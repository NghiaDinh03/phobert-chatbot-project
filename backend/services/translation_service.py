import os
import json
import time
import hashlib
import logging
from typing import Dict, List, Optional
from pathlib import Path
import torch
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

logger = logging.getLogger(__name__)

CACHE_DIR = Path("/data/translations")
CACHE_TTL = 43200

class VinAITranslator:
    tokenizer = None
    model = None
    device = None

    @classmethod
    def load(cls):
        if cls.model is None:
            model_name = "vinai/vinai-translate-en2vi-v2"
            logger.info(f"Đang tải model {model_name} vào bộ nhớ...")
            cls.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
            cls.tokenizer = AutoTokenizer.from_pretrained(model_name, src_lang="en_XX")
            cls.model = AutoModelForSeq2SeqLM.from_pretrained(model_name).to(cls.device)
            logger.info("Tải VinAI Translate thành công!")
        return cls.tokenizer, cls.model

    @classmethod
    def translate(cls, texts: List[str]) -> List[str]:
        if not cls.model or not cls.tokenizer:
            cls.load()

        if not texts:
            return []

        results = []
        try:
            with torch.no_grad():
                input_ids = cls.tokenizer(texts, padding=True, return_tensors="pt").to(cls.device)
                output_ids = cls.model.generate(
                    **input_ids,
                    decoder_start_token_id=cls.tokenizer.lang_code_to_id["vi_VN"],
                    num_return_sequences=1,
                    num_beams=3, # giảm beam cho nhẹ
                    early_stopping=True,
                    max_length=512 # Giữ ở mức an toàn
                )
                
                results = cls.tokenizer.batch_decode(output_ids, skip_special_tokens=True)
                # clear torch cache if needed
                if torch.cuda.is_available():
                    torch.cuda.empty_cache()
            return results
        except Exception as e:
            logger.error(f"VinAI translate failed: {e}")
            return [""] * len(texts)
CACHE_DIR = Path("/data/translations")
CACHE_TTL = 43200


class TranslationService:
    @staticmethod
    def _cache_path(category: str) -> Path:
        CACHE_DIR.mkdir(parents=True, exist_ok=True)
        return CACHE_DIR / f"{category}.json"

    @staticmethod
    def _load_cache(category: str) -> Dict:
        path = TranslationService._cache_path(category)
        if path.exists():
            try:
                data = json.loads(path.read_text(encoding="utf-8"))
                if time.time() - data.get("timestamp", 0) < CACHE_TTL:
                    return data.get("translations", {})
            except Exception:
                pass
        return {}

    @staticmethod
    def _save_cache(category: str, translations: Dict):
        path = TranslationService._cache_path(category)
        path.write_text(json.dumps({
            "timestamp": time.time(),
            "translations": translations
        }, ensure_ascii=False, indent=2), encoding="utf-8")

    @staticmethod
    def _make_key(title: str) -> str:
        return hashlib.md5(title.strip().lower().encode()).hexdigest()[:12]

    @staticmethod
    def translate_batch(titles: List[str], category: str) -> Dict[str, str]:
        cache = TranslationService._load_cache(category)

        missing = [t for t in titles if TranslationService._make_key(t) not in cache]
        if not missing:
            return cache

        CHUNK_SIZE = 8
        for chunk_start in range(0, len(missing), CHUNK_SIZE):
            chunk = missing[chunk_start:chunk_start + CHUNK_SIZE]
            translated = []

            try:
                translated = VinAITranslator.translate(chunk)
                logger.info(f"Dịch {len(chunk)} titles qua VinAI Translate")
            except Exception as e:
                logger.warning(f"Chunk translation thất bại: {e}")
                continue

            for i, t in enumerate(chunk):
                key = TranslationService._make_key(t)
                if i < len(translated) and translated[i]:
                    cache[key] = translated[i]

            if translated:
                TranslationService._save_cache(category, cache)

        return cache

    @staticmethod
    def get_translation(title: str, cache: Dict) -> Optional[str]:
        key = TranslationService._make_key(title)
        return cache.get(key)

