"""Summary Service — Article scraping, Open Claude translation, Edge-TTS audio generation."""

import os
import json
import hashlib
import logging
import asyncio
import edge_tts
import re
import time
import threading
import traceback
import random
from typing import Dict, Optional
from datetime import datetime

logger = logging.getLogger(__name__)
_process_lock = threading.Semaphore(1)

CACHE_DIR = "/data/summaries"
AUDIO_DIR = os.path.join(CACHE_DIR, "audio")

os.makedirs(CACHE_DIR, exist_ok=True)
os.makedirs(AUDIO_DIR, exist_ok=True)

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_7_2) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0",
]

# Domains with known bot-blocking or specific scrape strategies
BOT_BLOCKING_DOMAINS = {
    "darkreading.com": "requests_bs4",
    "marketwatch.com": "requests_bs4",
    "thehackernews.com": "requests_bs4",
    "securityweek.com": "newspaper",
    "cnbc.com": "requests_bs4",
    "yahoo.com": "requests_bs4",
    "znews.vn": "requests_bs4",
    "vnexpress.net": "requests_bs4",
    "vneconomy.vn": "requests_bs4",
    "cafef.vn": "requests_bs4",
    "vietstock.vn": "requests_bs4",
    "tinnhanhchungkhoan.vn": "requests_bs4",
    "baodautu.vn": "requests_bs4",
}

# CSS selectors for article body — ordered from most-specific to fallback
ARTICLE_SELECTORS = [
    # Standard semantic
    "article",
    '[role="article"]',
    '[itemtype*="Article"]',
    '[itemtype*="NewsArticle"]',
    # Named content zones
    ".article-body",
    ".article-content",
    ".article__body",
    ".article__content",
    ".article-text",
    ".article__text",
    ".post-content",
    ".post-body",
    ".entry-content",
    ".entry-body",
    ".story-body",
    ".story-content",
    # IDs
    "#article-body",
    "#article-content",
    "#js-article-text",
    "#main-article",
    "#news-content",
    # Vietnamese news sites
    ".detail-content",          # VnExpress, Znews
    ".detail__content",
    ".article-detail",
    ".article__detail",
    ".fck_detail",              # Znews, CafeF
    ".post-detail",
    ".news-detail",
    ".content-detail",
    ".article-body-content",
    ".articleBody",
    ".caas-body",               # Yahoo Finance
    ".ContentModule",
    "#main-content article",
    ".main-content article",
]

# Junk selectors to strip before extraction
JUNK_SELECTORS = [
    "script", "style", "nav", "footer", "header", "aside",
    "form", "iframe", "noscript", "button", "input", "select",
    ".related", ".related-news", ".related-articles",
    ".advertisement", ".ads", ".ad-container", ".banner",
    ".social-share", ".share-buttons", ".share",
    ".comment", ".comments", "#comments",
    ".sidebar", ".widget", ".newsletter",
    ".promotion", ".promo", ".sponsored",
    ".tag-list", ".tags", ".breadcrumb",
    ".author-box", ".author-info",
    ".read-more", ".more-news",
    '[class*="advert"]', '[class*="banner"]',
    '[class*="popup"]', '[class*="subscribe"]',
    '[id*="comment"]', '[id*="sidebar"]',
]


def _get_random_headers() -> Dict[str, str]:
    return {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,vi;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "DNT": "1",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Cache-Control": "max-age=0",
    }


def _get_domain(url: str) -> str:
    try:
        from urllib.parse import urlparse
        return urlparse(url).netloc.replace("www.", "")
    except Exception:
        return ""


def _is_noise_paragraph(text: str) -> bool:
    """Return True if paragraph is navigation/promo/related-article noise."""
    noise_patterns = [
        # Related/suggested content
        r"^(đọc thêm|xem thêm|see also|read more|related[:\s]|related articles|you (may|might) (also )?(like|enjoy|want))",
        r"^(bài viết (liên quan|đề xuất)|chủ đề liên quan|topics?:|tags?:)",
        r"(more stories|more from|explore more|trending now|popular now|also read)",
        # Social/share/subscribe
        r"^(share|chia sẻ|theo dõi|follow us|subscribe|sign up|newsletter|get the latest)",
        r"(follow .{0,30} on (twitter|facebook|instagram|linkedin|youtube))",
        # Ads/promo
        r"^(quảng cáo|advertisement|sponsored|paid content|partner content|presented by)",
        r"(click here|nhấn vào đây|đăng ký ngay|tải app|download now|get started)",
        # Legal/copyright
        r"^copyright\s*©",
        r"all rights reserved",
        r"^©\s*\d{4}",
        # Navigation artifacts
        r"^(home|trang chủ|menu|navigation|skip to content)",
        r"^(previous|next|newer|older|← back|next →)",
        # Cookie/GDPR banners
        r"(cookie|we use cookies|privacy policy|terms of (use|service))",
        # Empty or whitespace only
        r"^\s*$",
    ]
    low = text.lower().strip()
    for pat in noise_patterns:
        if re.search(pat, low):
            return True
    # Very short lines that look like menu items or tags
    if len(text.strip()) < 30 and not re.search(r"[\d%$€£¥]", text):
        return True
    # Lines that are mostly uppercase (likely headers/nav)
    alpha = [c for c in text if c.isalpha()]
    if alpha and sum(1 for c in alpha if c.isupper()) / len(alpha) > 0.7 and len(text) < 60:
        return True
    return False


def _scrape_with_requests_bs4(url: str) -> Optional[str]:
    try:
        import requests
        from bs4 import BeautifulSoup

        session = requests.Session()
        headers = _get_random_headers()
        resp = session.get(url, headers=headers, timeout=20, allow_redirects=True)

        if resp.status_code == 403:
            logger.debug(f"[Scrape/BS4] 403 for {url} — retrying with different UA")
            headers["User-Agent"] = random.choice(USER_AGENTS)
            time.sleep(2)
            resp = session.get(url, headers=headers, timeout=20, allow_redirects=True)

        if resp.status_code == 401:
            logger.debug(f"[Scrape/BS4] 401 for {url} — adding Referer and retrying")
            headers["Referer"] = "https://www.google.com/"
            time.sleep(1)
            resp = session.get(url, headers=headers, timeout=20, allow_redirects=True)

        if resp.status_code not in (200, 206):
            logger.warning(f"[Scrape/BS4] HTTP {resp.status_code} for {url}")
            return None

        soup = BeautifulSoup(resp.content, "html.parser")

        # Strip all junk elements first
        for selector in JUNK_SELECTORS:
            for tag in soup.select(selector):
                tag.decompose()

        text = None

        # Try known article selectors in priority order
        for selector in ARTICLE_SELECTORS:
            elements = soup.select(selector)
            if not elements:
                continue
            paragraphs = []
            for el in elements:
                for p in el.find_all(["p", "li", "h2", "h3", "h4", "blockquote"]):
                    t = p.get_text(separator=" ", strip=True)
                    if t and len(t) > 30 and not _is_noise_paragraph(t):
                        paragraphs.append(t)
            if paragraphs:
                candidate = "\n\n".join(paragraphs)
                if len(candidate) > 400:
                    text = candidate
                    logger.debug(f"[Scrape/BS4] Used selector '{selector}' → {len(text)} chars")
                    break

        # Fallback: all <p> tags
        if not text or len(text) < 400:
            paragraphs = []
            for p in soup.find_all("p"):
                t = p.get_text(separator=" ", strip=True)
                if t and len(t) > 40 and not _is_noise_paragraph(t):
                    paragraphs.append(t)
            if paragraphs:
                candidate = "\n\n".join(paragraphs)
                if len(candidate) > len(text or ""):
                    text = candidate

        if text and len(text) > 300:
            logger.info(f"[Scrape/BS4] Extracted {len(text)} chars from {url}")
            return text

        logger.warning(f"[Scrape/BS4] Insufficient content ({len(text) if text else 0} chars) for {url}")
        return None
    except Exception as e:
        logger.warning(f"[Scrape/BS4] Exception for {url}: {e}")
        return None


def _scrape_with_trafilatura(url: str) -> Optional[str]:
    try:
        import trafilatura
        downloaded = trafilatura.fetch_url(url)
        if not downloaded:
            logger.warning(f"[Scrape/Trafilatura] fetch_url returned nothing for {url}")
            return None
        text = trafilatura.extract(
            downloaded,
            include_comments=False,
            include_tables=False,
            favor_recall=True,
            no_fallback=False,
        )
        if text and len(text) > 300:
            logger.info(f"[Scrape/Trafilatura] Extracted {len(text)} chars from {url}")
            return text
        logger.warning(f"[Scrape/Trafilatura] Insufficient content ({len(text) if text else 0} chars) for {url}")
        return None
    except ImportError:
        logger.debug("[Scrape/Trafilatura] Not installed, skipping")
        return None
    except Exception as e:
        logger.warning(f"[Scrape/Trafilatura] Exception for {url}: {e}")
        return None


def _scrape_with_newspaper(url: str) -> Optional[str]:
    try:
        from newspaper import Article, Config
        config = Config()
        config.browser_user_agent = random.choice(USER_AGENTS)
        config.request_timeout = 20
        config.fetch_images = False

        article = Article(url, config=config)
        article.download()
        article.parse()
        text = article.text

        if text and len(text) > 300:
            logger.info(f"[Scrape/Newspaper] Extracted {len(text)} chars from {url}")
            return text
        logger.warning(f"[Scrape/Newspaper] Insufficient content ({len(text) if text else 0} chars) for {url}")
        return None
    except Exception as e:
        logger.warning(f"[Scrape/Newspaper] Exception for {url}: {e}")
        return None


def scrape_article(url: str) -> Optional[str]:
    """Multi-strategy scraper: tries each method in order until article content is obtained."""
    domain = _get_domain(url)
    primary_strategy = None
    for blocked_domain, strategy in BOT_BLOCKING_DOMAINS.items():
        if blocked_domain in domain:
            primary_strategy = strategy
            break

    if primary_strategy == "requests_bs4":
        strategies = [_scrape_with_requests_bs4, _scrape_with_trafilatura, _scrape_with_newspaper]
    elif primary_strategy == "newspaper":
        strategies = [_scrape_with_newspaper, _scrape_with_requests_bs4, _scrape_with_trafilatura]
    else:
        strategies = [_scrape_with_trafilatura, _scrape_with_requests_bs4, _scrape_with_newspaper]

    logger.info(f"[Scrape] Starting for {url} (domain={domain}, primary_strategy={primary_strategy or 'default'})")

    best_text = None
    for i, strategy in enumerate(strategies):
        try:
            text = strategy(url)
            if text and len(text) > 300:
                # Keep the longest result as best
                if best_text is None or len(text) > len(best_text):
                    best_text = text
                # Good enough if > 1000 chars — stop early
                if len(text) >= 1000:
                    return text
            if i < len(strategies) - 1:
                logger.debug(f"[Scrape] Strategy {strategy.__name__} insufficient, trying next")
                time.sleep(1)
        except Exception as e:
            logger.warning(f"[Scrape] Strategy {strategy.__name__} raised exception for {url}: {e}")

    if best_text:
        logger.info(f"[Scrape] Best result: {len(best_text)} chars from {url}")
        return best_text

    logger.error(f"[Scrape] All strategies failed for {url}")
    return None


class SummaryService:
    @staticmethod
    def _generate_hash(url: str) -> str:
        return hashlib.md5(url.encode()).hexdigest()

    @staticmethod
    def _get_cache(url: str, skip_retryable: bool = False) -> Optional[Dict]:
        url_hash = SummaryService._generate_hash(url)
        cache_path = os.path.join(CACHE_DIR, f"{url_hash}.json")
        if not os.path.exists(cache_path):
            return None
        try:
            with open(cache_path, "r", encoding="utf-8") as f:
                data = json.load(f)

            if skip_retryable and data.get("retryable"):
                os.remove(cache_path)
                logger.info(f"[Cache] Removed retryable error cache for {url}")
                return None

            if "error" in data and skip_retryable:
                cache_age = time.time() - os.path.getmtime(cache_path)
                if cache_age > 7200:
                    os.remove(cache_path)
                    logger.info(f"[Cache] Removed stale error cache ({cache_age/3600:.1f}h old) for {url}")
                    return None

            return data
        except Exception as e:
            logger.warning(f"[Cache] Read failed for {cache_path}: {e}")
            return None

    @staticmethod
    def _save_cache(url: str, data: Dict):
        url_hash = SummaryService._generate_hash(url)
        cache_path = os.path.join(CACHE_DIR, f"{url_hash}.json")
        try:
            with open(cache_path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False)
            logger.debug(f"[Cache] Saved to {cache_path}")
        except Exception as e:
            logger.warning(f"[Cache] Save failed for {cache_path}: {e}")

    @staticmethod
    def process_article(url: str, lang: str = "en", title: str = "") -> Dict:
        with _process_lock:
            try:
                return SummaryService._process_article_internal(url, lang, title)
            except Exception as e:
                logger.error(f"[ProcessArticle] Critical error for {url}: {e}\n{traceback.format_exc()}")
                return {"error": f"Lỗi hệ thống: {str(e)}"}

    @staticmethod
    def _process_article_internal(url: str, lang: str = "en", title: str = "") -> Dict:
        logger.info(f"[ProcessArticle] Starting — url={url}, lang={lang}, title='{title[:60]}'")

        cached = SummaryService._get_cache(url)
        if cached:
            logger.info(f"[ProcessArticle] Cache HIT for {url}")
            return cached

        url_hash = SummaryService._generate_hash(url)
        audio_filename = f"{url_hash}.mp3"
        audio_path = os.path.join(AUDIO_DIR, audio_filename)

        # ── Step 1: Scrape article content ──────────────────────────────────────
        logger.info(f"[ProcessArticle] Step 1 — Scraping article content from {url}")
        text = None
        for attempt in range(2):
            try:
                text = scrape_article(url)
                if text and len(text) >= 300:
                    logger.info(f"[ProcessArticle] Step 1 OK — scraped {len(text)} chars (attempt {attempt+1})")
                    # Truncate at known "related articles" section markers to avoid feeding noise to AI
                    _related_cutoff_markers = [
                        "\n\nRelated Articles", "\n\nRelated:", "\n\nSee Also",
                        "\n\nRead More", "\n\nYou May Also Like", "\n\nMore Stories",
                        "\n\nBài viết liên quan", "\n\nXem thêm:", "\n\nĐọc thêm:",
                        "\n\nChủ đề liên quan", "\n\nTopics:", "\n\nTags:",
                        "More from this author", "More on this topic",
                    ]
                    for marker in _related_cutoff_markers:
                        idx = text.find(marker)
                        if idx > 500:
                            logger.info(f"[ProcessArticle] Step 1 — trimmed at '{marker.strip()}' ({idx} chars kept)")
                            text = text[:idx]
                            break
                    if len(text) > 12000:
                        logger.info(f"[ProcessArticle] Step 1 — truncating from {len(text)} to 12000 chars")
                        text = text[:12000]
                    break
                else:
                    logger.warning(f"[ProcessArticle] Step 1 — insufficient content ({len(text) if text else 0} chars), attempt {attempt+1}/2")
                    if attempt == 0:
                        time.sleep(3)
                    else:
                        if title:
                            text = f"{title}\n\n{text or ''}"
                            logger.warning(f"[ProcessArticle] Step 1 — using title+partial text ({len(text)} chars) as fallback")
                            if len(text) >= 100:
                                break
                        raise Exception("Insufficient content from all scraping strategies")
            except Exception as e:
                logger.error(f"[ProcessArticle] Step 1 FAILED attempt {attempt+1}/2: {e}")
                if attempt == 0:
                    time.sleep(3)
                else:
                    domain = _get_domain(url)
                    err_str = str(e)
                    is_blocked = any(k in err_str for k in ["401", "403", "429", "blocked", "Insufficient"])
                    if is_blocked:
                        err_msg = f"Trang {domain} chặn truy cập bot. Sẽ tự động thử lại sau."
                    else:
                        err_msg = f"Lỗi truy cập trang: {err_str[:80]}"
                    res = {"error": f"❌ {err_msg}", "url": url, "hash": url_hash, "retryable": True}
                    SummaryService._save_cache(url, res)
                    return res

        # ── Step 2: Open Claude — translate/rewrite to broadcast Vietnamese ─────
        logger.info(f"[ProcessArticle] Step 2 — Sending {len(text)} chars to Open Claude (lang={lang})")
        try:
            from services.cloud_llm_service import CloudLLMService

            if lang == "en":
                system_prompt = (
                    "Bạn là biên dịch viên báo chí chuyên nghiệp. "
                    "Nhiệm vụ duy nhất: dịch TOÀN BỘ nội dung bài báo sang Tiếng Việt. "
                    "KHÔNG giải thích, KHÔNG bình luận, KHÔNG thêm nội dung ngoài bài báo."
                )
                user_prompt = (
                    f"TIÊU ĐỀ GỐC: {title}\n"
                    f"URL: {url}\n\n"
                    "====== NỘI DUNG BÀI BÁO CẦN DỊCH ======\n"
                    f"{text}\n"
                    "====== KẾT THÚC NỘI DUNG ======\n\n"
                    "YÊU CẦU DỊCH THUẬT:\n"
                    "1. Dòng đầu tiên: tiêu đề Tiếng Việt hấp dẫn, sát nghĩa gốc.\n"
                    "2. GIỮ NGUYÊN 100%: tên người, tổ chức, số liệu, ngày tháng, mã CVE, "
                    "địa chỉ IP, tên phần mềm, tên sản phẩm, tên quốc gia.\n"
                    "3. KHÔNG rút gọn, KHÔNG tóm tắt — dịch ĐẦY ĐỦ từng đoạn.\n"
                    "4. Bỏ qua và KHÔNG dịch: menu điều hướng, quảng cáo, nút bấm, footer, link đăng ký, danh sách bài viết đề xuất/liên quan.\n"
                    "5. Văn phong báo chí chuyên nghiệp, phù hợp đọc radio.\n"
                    "6. CHỈ dùng văn bản thuần — KHÔNG dùng ký tự: *, #, [], (), **.\n"
                    "7. CHỈ trả về bản dịch — KHÔNG thêm bất kỳ ghi chú hay giải thích nào.\n"
                )
            else:
                system_prompt = (
                    "Bạn là biên tập viên báo chí chuyên nghiệp. "
                    "Nhiệm vụ duy nhất: biên tập lại bài báo Tiếng Việt thành bài hoàn chỉnh, chuẩn phát thanh. "
                    "KHÔNG giải thích, KHÔNG bình luận, KHÔNG thêm nội dung ngoài bài báo."
                )
                user_prompt = (
                    f"TIÊU ĐỀ: {title}\n"
                    f"URL: {url}\n\n"
                    "====== NỘI DUNG BÀI BÁO CẦN BIÊN TẬP ======\n"
                    f"{text}\n"
                    "====== KẾT THÚC NỘI DUNG ======\n\n"
                    "YÊU CẦU BIÊN TẬP:\n"
                    "1. Dòng đầu tiên: tiêu đề bài báo.\n"
                    "2. GIỮ NGUYÊN 100%: tên người, tổ chức, số liệu, ngày tháng, dẫn chứng.\n"
                    "3. KHÔNG rút gọn, KHÔNG tóm tắt — giữ ĐẦY ĐỦ nội dung.\n"
                    "4. Bỏ qua và KHÔNG đưa vào: HTML, code, quảng cáo, menu, footer, link rác, danh sách bài viết liên quan.\n"
                    "5. Văn phong tự nhiên, phù hợp đọc radio.\n"
                    "6. CHỈ dùng văn bản thuần — KHÔNG dùng ký tự: *, #, [], (), **.\n"
                    "7. CHỈ trả về bài biên tập — KHÔNG thêm bất kỳ ghi chú hay giải thích nào.\n"
                )

            ai_result = CloudLLMService.chat_completion(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.1,
                max_tokens=32000,
                task_type="news_translate",
            )

            summary_vi = ai_result.get("content", "").strip()
            provider = ai_result.get("provider", "unknown")
            model = ai_result.get("model", "?")
            usage = ai_result.get("usage", {})

            logger.info(
                f"[ProcessArticle] Step 2 OK — provider={provider}, model={model}, "
                f"prompt_tokens={usage.get('prompt_tokens','?')}, "
                f"completion_tokens={usage.get('completion_tokens','?')}, "
                f"output_len={len(summary_vi)}"
            )

            if not summary_vi:
                raise Exception("AI returned empty content")

            # Strip AI artifacts
            summary_vi = summary_vi.replace("*", "").replace("#", "").replace('"', "")
            summary_vi = summary_vi.replace("<|eot_id|>", "").replace("<|end_header_id|>", "")
            if summary_vi.lower().startswith("assistant"):
                summary_vi = summary_vi[len("assistant"):].strip()

            # Remove trailing AI notes/disclaimers
            for pattern in [
                r"\(Đoạn văn tiếp theo.*$", r"\(Lưu ý:.*$", r"\(Ghi chú:.*$",
                r"\(Chú thích:.*$", r"\(Dịch giả:.*$", r"\(Biên tập:.*$",
                r"---.*$", r"Lưu ý:.*$", r"Note:.*$",
            ]:
                summary_vi = re.sub(pattern, "", summary_vi, flags=re.DOTALL).strip()

            lines = [l.strip() for l in summary_vi.split("\n") if l.strip()]
            final_title_vi = lines[0] if lines else title

            try:
                from services.news_service import NewsService
                NewsService._update_history([{
                    "url": url,
                    "title_vi": final_title_vi,
                    "summary_text": summary_vi[:500],
                    "audio_cached": True,
                }])
                logger.info(f"[ProcessArticle] Step 2 — history updated with title_vi='{final_title_vi[:60]}'")
            except Exception as e:
                logger.warning(f"[ProcessArticle] Step 2 — history sync failed: {e}")

        except Exception as e:
            logger.error(f"[ProcessArticle] Step 2 FAILED for {url}: {e}")
            if "timeout" in str(e).lower():
                err_msg = "AI timeout. Vui lòng thử lại sau."
            elif "401" in str(e):
                err_msg = "Lỗi xác thực API AI. Kiểm tra lại API key."
            elif "empty" in str(e).lower():
                err_msg = "AI trả về kết quả rỗng. Vui lòng thử lại."
            else:
                err_msg = f"❌ AI error: {str(e)[:120]}"
            res = {"error": err_msg, "url": url, "hash": url_hash, "retryable": True}
            SummaryService._save_cache(url, res)
            return res

        # ── Step 2.5: Generate short TTS summary (3-5 sentences for audio only) ─
        tts_text = summary_vi  # default: full text
        try:
            short_summary_prompt = (
                f"Tóm tắt bài báo sau thành 3-5 câu ngắn gọn, phù hợp đọc radio (không đề cập đến nguồn, không quảng cáo):\n\n"
                f"{summary_vi[:3000]}"
            )
            short_result = CloudLLMService.chat_completion(
                messages=[{"role": "user", "content": short_summary_prompt}],
                temperature=0.3,
                max_tokens=400,
                task_type="news_summary",
            )
            short_text = short_result.get("content", "").strip()
            if short_text and len(short_text) > 80:
                tts_text = short_text
                logger.info(f"[ProcessArticle] Step 2.5 OK — TTS summary {len(tts_text)} chars (full: {len(summary_vi)})")
            else:
                logger.warning(f"[ProcessArticle] Step 2.5 — short summary too short, using full text")
        except Exception as e:
            logger.warning(f"[ProcessArticle] Step 2.5 FAILED (TTS summary) — using full text: {e}")

        # ── Step 3: Edge-TTS — generate Vietnamese audio ────────────────────────
        logger.info(f"[ProcessArticle] Step 3 — Generating TTS audio (text_len={len(tts_text)})")
        try:
            text_to_read = SummaryService._fix_pronunciation(tts_text)
            communicate = edge_tts.Communicate(text_to_read, "vi-VN-HoaiMyNeural")
            asyncio.run(communicate.save(audio_path))
            logger.info(f"[ProcessArticle] Step 3 OK — audio saved to {audio_path}")
        except Exception as e:
            logger.error(f"[ProcessArticle] Step 3 FAILED (TTS) for {url}: {e}")
            res = {"error": "Lỗi tạo giọng nói.", "url": url, "hash": url_hash}
            SummaryService._save_cache(url, res)
            return res

        result = {
            "url": url,
            "original_lang": lang,
            "summary_vi": summary_vi,
            "audio_url": f"/api/news/audio/{audio_filename}",
            "hash": url_hash,
        }
        SummaryService._save_cache(url, result)
        logger.info(f"[ProcessArticle] Complete — url={url}, audio={audio_filename}")
        return result

    @staticmethod
    def _fix_pronunciation(text: str) -> str:
        replacements = {
            r"\bRAT\b": "Rát", r"\bAI\b": "Ây ai", r"\bFBI\b": "Ép bi ai",
            r"\bCIA\b": "Xi ai ây", r"\bAPT\b": "Ê pi ti", r"\bAPI\b": "Ê pi ai",
            r"\bCEO\b": "Xi y âu", r"\bIT\b": "Ai ti", r"\bCISA\b": "Xi sa",
            r"\bUS\b": "Mỹ", r"\bUSA\b": "Mỹ", r"\biOS\b": "Ai âu ét",
            r"\bIP\b": "Ai pi", r"\bIoT\b": "Ai âu ti", r"\bAWS\b": "Ây đắp liu ét",
            r"\bURL\b": "U rờ lờ", r"\bHTTPS?\b": "Ếch ti ti pi",
            r"\bDDoS\b": "Đi đốt", r"\bVPN\b": "Vi pi en",
            r"\bSSL\b": "Ét ét eo", r"\bTLS\b": "Ti eo ét",
            r"(?i)\bcybersecurity\b": "An ninh mạng", r"(?i)\bhacker\b": "Hắc cờ",
            r"(?i)\bmalware\b": "Mã độc", r"(?i)\bphishing\b": "Lừa đảo qua mạng",
            r"(?i)\bransomware\b": "Mã độc tống tiền",
            r"(?i)\bvinaconex\b": "Vi na cô nếch", r"(?i)\bvietstock\b": "Việt xtốc",
            r"(?i)\bvneconomy\b": "Vi en i cô nô mi",
            r"(?i)\bpost\b": "Pốt", r"(?i)\btrading\b": "Tra đing",
            r"(?i)\betfs?\b": "Ê tê ép", r"(?i)\btech\b": "Tếch",
            r"(?i)\bblockchain\b": "Bờ lốc chên", r"(?i)\bcrypto\b": "Cờ ríp tô",
        }
        for pattern, replacement in replacements.items():
            text = re.sub(pattern, replacement, text)
        return text
