'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslation } from '@/components/LanguageProvider'
import styles from './page.module.css'
import {
    ArrowLeft, Shield, Landmark, Server, CheckSquare, FileText,
    ChevronDown, ChevronUp, Zap, Lock, Cloud, BookOpen,
    AlertTriangle, TrendingUp, Download, History, LayoutTemplate,
    Upload, Eye, Trash2, RotateCcw, Layers
} from 'lucide-react'

const TOC_KEYS = [
    { id: 'overview', labelKey: 'guide.toc1', icon: BookOpen },
    { id: 'workflow', labelKey: 'guide.toc2', icon: Layers },
    { id: 'step1', labelKey: 'guide.toc3', icon: Landmark },
    { id: 'step2', labelKey: 'guide.toc4', icon: Server },
    { id: 'step3', labelKey: 'guide.toc5', icon: CheckSquare },
    { id: 'step4', labelKey: 'guide.toc6', icon: FileText },
    { id: 'ai-modes', labelKey: 'guide.toc7', icon: Zap },
    { id: 'results', labelKey: 'guide.toc8', icon: TrendingUp },
    { id: 'history', labelKey: 'guide.toc9', icon: History },
    { id: 'evidence', labelKey: 'guide.toc10', icon: Upload },
    { id: 'export', labelKey: 'guide.toc11', icon: Download },
    { id: 'scoring', labelKey: 'guide.toc12', icon: Shield },
    { id: 'faq', labelKey: 'guide.toc13', icon: AlertTriangle },
]

function Collapse({ title, children, defaultOpen = false }) {
    const [open, setOpen] = useState(defaultOpen)
    return (
        <div className={`${styles.collapse} ${open ? styles.collapseOpen : ''}`}>
            <button
                type="button"
                className={styles.collapseHeader}
                onClick={() => setOpen(!open)}
                aria-expanded={open}
            >
                <span className={styles.collapseTitle}>{title}</span>
                {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {open && <div className={styles.collapseBody}>{children}</div>}
        </div>
    )
}

export default function AssessmentGuidePage() {
    const { t } = useTranslation()
    const scrollTo = (id) => {
        const el = document.getElementById(id)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    return (
        <div className="page-container">
            <div className={styles.header}>
                <Link href="/settings" className={styles.backLink}>
                    <ArrowLeft size={16} />
                    <span>{t('guide.backToSettings')}</span>
                </Link>
                <div className={styles.headerContent}>
                    <div className={styles.headerIcon}>
                        <Shield size={24} />
                    </div>
                    <div>
                        <h1 className={styles.title}>{t('guide.pageTitle')}</h1>
                        <p className={styles.subtitle}>
                            {t('guide.pageSubtitle')}
                        </p>
                    </div>
                </div>
            </div>

            <div className={styles.layout}>
                {/* Table of Contents sidebar */}
                <nav className={styles.toc} aria-label={t('guide.tocTitle')}>
                    <h3 className={styles.tocTitle}>{t('guide.tocTitle')}</h3>
                    {TOC_KEYS.map(item => {
                        const Icon = item.icon
                        return (
                            <button
                                key={item.id}
                                className={styles.tocItem}
                                onClick={() => scrollTo(item.id)}
                            >
                                <Icon size={14} />
                                <span>{t(item.labelKey)}</span>
                            </button>
                        )
                    })}
                </nav>

                {/* Main content */}
                <div className={styles.content}>

                    {/* ─── 1. Overview ──────────────────────────────────────────────── */}
                    <section id="overview" className={styles.section}>
                        <h2 className={styles.sectionTitle}>
                            <BookOpen size={18} />
                            1. Tổng quan về tính năng Assessment
                        </h2>
                        <div className={styles.card}>
                            <p className={styles.paragraph}>
                                Tính năng <strong>Assessment</strong> (Đánh giá An toàn Thông tin) cho phép bạn thực hiện đánh giá mức độ tuân thủ
                                các tiêu chuẩn bảo mật quốc tế và Việt Nam một cách <strong>tự động</strong> bằng AI.
                            </p>
                            <div className={styles.highlightBox}>
                                <strong>🎯 Mục đích chính:</strong>
                                <ul className={styles.bulletList}>
                                    <li>Xác định <strong>GAP</strong> (khoảng trống) giữa hiện trạng bảo mật và yêu cầu tiêu chuẩn</li>
                                    <li>Đưa ra <strong>Risk Register</strong> (sổ đăng ký rủi ro) với mức độ ưu tiên</li>
                                    <li>Tạo báo cáo <strong>Markdown</strong> chuyên nghiệp có thể xuất PDF</li>
                                    <li>Hỗ trợ nhiều tiêu chuẩn: ISO 27001, TCVN 11930, NIST CSF, PCI DSS, HIPAA, GDPR, SOC 2</li>
                                </ul>
                            </div>

                            <h4 className={styles.subHeading}>Các tiêu chuẩn được hỗ trợ</h4>
                            <div className={styles.tableWrap}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>Tiêu chuẩn</th>
                                            <th>Phạm vi</th>
                                            <th>Số Controls</th>
                                            <th>Phù hợp với</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td><strong>ISO 27001:2022</strong></td>
                                            <td>Quốc tế</td>
                                            <td>93 controls (Annex A)</td>
                                            <td>Mọi tổ chức muốn chứng nhận quốc tế</td>
                                        </tr>
                                        <tr>
                                            <td><strong>TCVN 11930:2017</strong></td>
                                            <td>Việt Nam</td>
                                            <td>34 controls</td>
                                            <td>Cơ quan nhà nước, HTTT theo Nghị định 85</td>
                                        </tr>
                                        <tr>
                                            <td><strong>NIST CSF 2.0</strong></td>
                                            <td>Hoa Kỳ</td>
                                            <td>Theo framework</td>
                                            <td>Tổ chức lớn, hạ tầng trọng yếu</td>
                                        </tr>
                                        <tr>
                                            <td><strong>PCI DSS 4.0</strong></td>
                                            <td>Quốc tế</td>
                                            <td>Theo domain</td>
                                            <td>Tổ chức xử lý thanh toán thẻ</td>
                                        </tr>
                                        <tr>
                                            <td><strong>HIPAA</strong></td>
                                            <td>Hoa Kỳ</td>
                                            <td>Security Rule</td>
                                            <td>Y tế, bệnh viện, bảo hiểm</td>
                                        </tr>
                                        <tr>
                                            <td><strong>GDPR</strong></td>
                                            <td>Châu Âu</td>
                                            <td>Theo điều khoản</td>
                                            <td>Tổ chức xử lý dữ liệu công dân EU</td>
                                        </tr>
                                        <tr>
                                            <td><strong>SOC 2</strong></td>
                                            <td>Quốc tế</td>
                                            <td>Trust Criteria</td>
                                            <td>SaaS, dịch vụ đám mây, fintech</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>

                    {/* ─── 2. Workflow ──────────────────────────────────────────────── */}
                    <section id="workflow" className={styles.section}>
                        <h2 className={styles.sectionTitle}>
                            <Layers size={18} />
                            2. Quy trình đánh giá 4 bước
                        </h2>
                        <div className={styles.card}>
                            <p className={styles.paragraph}>
                                Assessment sử dụng quy trình <strong>4 bước tuần tự</strong> (wizard). Mỗi bước thu thập thông tin khác nhau
                                để AI có đủ dữ liệu phân tích chính xác nhất.
                            </p>
                            <div className={styles.stepsFlow}>
                                <div className={styles.stepFlowItem}>
                                    <div className={styles.stepFlowNum}>1</div>
                                    <div className={styles.stepFlowContent}>
                                        <strong>Tổ chức & Tiêu chuẩn</strong>
                                        <span>Thông tin doanh nghiệp, chọn tiêu chuẩn, phạm vi đánh giá</span>
                                    </div>
                                </div>
                                <div className={styles.stepFlowArrow}>→</div>
                                <div className={styles.stepFlowItem}>
                                    <div className={`${styles.stepFlowNum} ${styles.stepFlowNum2}`}>2</div>
                                    <div className={styles.stepFlowContent}>
                                        <strong>Hạ tầng & Kỹ thuật</strong>
                                        <span>Máy chủ, firewall, VPN, backup, SIEM, cloud</span>
                                    </div>
                                </div>
                                <div className={styles.stepFlowArrow}>→</div>
                                <div className={styles.stepFlowItem}>
                                    <div className={`${styles.stepFlowNum} ${styles.stepFlowNum3}`}>3</div>
                                    <div className={styles.stepFlowContent}>
                                        <strong>Biện pháp kiểm soát</strong>
                                        <span>Tick (✓) các controls đã triển khai + upload bằng chứng</span>
                                    </div>
                                </div>
                                <div className={styles.stepFlowArrow}>→</div>
                                <div className={styles.stepFlowItem}>
                                    <div className={`${styles.stepFlowNum} ${styles.stepFlowNum4}`}>4</div>
                                    <div className={styles.stepFlowContent}>
                                        <strong>Tổng kết & Gửi</strong>
                                        <span>Mô tả topology, chọn AI mode, review → Bắt đầu Đánh giá</span>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.tipBox}>
                                <strong>💡 Mẹo:</strong> Form tự động lưu <strong>Draft</strong> (bản nháp) vào trình duyệt.
                                Bạn có thể đóng trang và quay lại — dữ liệu vẫn còn. Nút <code>✕ Xóa</code> sẽ xóa draft.
                            </div>
                        </div>
                    </section>

                    {/* ─── 3. Step 1 ───────────────────────────────────────────────── */}
                    <section id="step1" className={styles.section}>
                        <h2 className={styles.sectionTitle}>
                            <Landmark size={18} />
                            3. Bước 1 — Thông tin Tổ chức & Tiêu chuẩn
                        </h2>
                        <div className={styles.card}>
                            <p className={styles.paragraph}>
                                Bước đầu tiên thu thập thông tin cơ bản về tổ chức và lựa chọn tiêu chuẩn đánh giá.
                            </p>

                            <h4 className={styles.subHeading}>Các trường thông tin</h4>
                            <div className={styles.tableWrap}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>Trường</th>
                                            <th>Bắt buộc</th>
                                            <th>Mô tả</th>
                                            <th>Ví dụ</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td><strong>Tiêu chuẩn đánh giá</strong></td>
                                            <td><span className={styles.required}>✱ Có</span></td>
                                            <td>Chọn framework bảo mật để đánh giá. Quyết định bộ Checklist ở Bước 3.</td>
                                            <td>ISO 27001:2022</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Tên tổ chức</strong></td>
                                            <td><span className={styles.required}>✱ Có</span></td>
                                            <td>Tên công ty / doanh nghiệp / cơ quan</td>
                                            <td>Công ty Cổ phần ABC Tech</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Quy mô</strong></td>
                                            <td>Không</td>
                                            <td>Nhỏ (&lt;50 NV), Trung bình (50-200), Lớn (&gt;200)</td>
                                            <td>Trung bình</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Lĩnh vực</strong></td>
                                            <td>Không</td>
                                            <td>Ngành nghề kinh doanh chính</td>
                                            <td>Tài chính, Fintech</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Trạng thái tuân thủ</strong></td>
                                            <td>Không</td>
                                            <td>Mức độ triển khai hiện tại</td>
                                            <td>Đang xây dựng chính sách</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Tổng nhân viên</strong></td>
                                            <td>Không</td>
                                            <td>Tổng số người trong tổ chức</td>
                                            <td>120</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Nhân sự IT/Bảo mật</strong></td>
                                            <td>Không</td>
                                            <td>Số người trong bộ phận IT & Security</td>
                                            <td>8</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <h4 className={styles.subHeading}>Phạm vi đánh giá (Scope)</h4>
                            <p className={styles.paragraph}>
                                Bạn có 3 lựa chọn phạm vi:
                            </p>
                            <div className={styles.tableWrap}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>Phạm vi</th>
                                            <th>Khi nào chọn</th>
                                            <th>Ví dụ</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td><strong>🏢 Toàn bộ tổ chức</strong></td>
                                            <td>Lần đầu đánh giá, chuẩn bị chứng nhận ISO</td>
                                            <td>Đánh giá toàn công ty gồm 5 phòng ban, 3 hệ thống</td>
                                        </tr>
                                        <tr>
                                            <td><strong>👥 Theo phòng ban</strong></td>
                                            <td>Đánh giá nội bộ từng bộ phận</td>
                                            <td>Chỉ đánh giá Phòng IT + Phòng Kế toán</td>
                                        </tr>
                                        <tr>
                                            <td><strong>🖥️ Theo hệ thống</strong></td>
                                            <td>Đánh giá ứng dụng / hệ thống cụ thể</td>
                                            <td>Core Banking System, Portal khách hàng</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div className={styles.exampleBox}>
                                <strong>📋 Ví dụ thao tác:</strong>
                                <ol className={styles.orderedList}>
                                    <li>Chọn tiêu chuẩn <code>ISO 27001:2022</code> từ dropdown</li>
                                    <li>Nhập tên: <code>Ngân hàng TMCP Sài Gòn</code></li>
                                    <li>Chọn quy mô: <code>Lớn (Trên 200 NV)</code></li>
                                    <li>Lĩnh vực: <code>Tài chính - Ngân hàng</code></li>
                                    <li>Trạng thái: <code>Đang xây dựng chính sách</code></li>
                                    <li>Scope: <code>🏢 Toàn bộ tổ chức</code></li>
                                    <li>Bấm <strong>Tiếp theo →</strong></li>
                                </ol>
                            </div>
                        </div>
                    </section>

                    {/* ─── 4. Step 2 ───────────────────────────────────────────────── */}
                    <section id="step2" className={styles.section}>
                        <h2 className={styles.sectionTitle}>
                            <Server size={18} />
                            4. Bước 2 — Hạ tầng & Kỹ thuật mạng
                        </h2>
                        <div className={styles.card}>
                            <p className={styles.paragraph}>
                                Mô tả hạ tầng công nghệ hiện có. Thông tin càng chi tiết, AI càng đánh giá chính xác.
                            </p>

                            <div className={styles.tableWrap}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>Trường</th>
                                            <th>Mô tả</th>
                                            <th>Ví dụ thực tế</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td><strong>Máy chủ</strong></td>
                                            <td>Tổng số Physical + VM</td>
                                            <td><code>25</code> (5 physical + 20 VM trên VMware)</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Firewall (Tường lửa)</strong></td>
                                            <td>Thiết bị bảo vệ vùng biên mạng</td>
                                            <td><code>FortiGate 200F tại biên, Palo Alto PA-220 internal</code></td>
                                        </tr>
                                        <tr>
                                            <td><strong>Cloud (Đám mây)</strong></td>
                                            <td>Nền tảng cloud đang sử dụng</td>
                                            <td><code>AWS (EC2, S3, RDS) + Azure AD</code></td>
                                        </tr>
                                        <tr>
                                            <td><strong>AV/EDR (Chống mã độc)</strong></td>
                                            <td>Phần mềm Antivirus / Endpoint Detection</td>
                                            <td><code>CrowdStrike Falcon trên tất cả endpoint</code></td>
                                        </tr>
                                        <tr>
                                            <td><strong>Backup (Sao lưu)</strong></td>
                                            <td>Giải pháp sao lưu & khôi phục</td>
                                            <td><code>Veeam Backup, NAS Synology, offsite hàng tuần</code></td>
                                        </tr>
                                        <tr>
                                            <td><strong>SIEM (Ghi log tập trung)</strong></td>
                                            <td>Hệ thống thu thập & phân tích log bảo mật</td>
                                            <td><code>Wazuh + ELK Stack, lưu 12 tháng</code></td>
                                        </tr>
                                        <tr>
                                            <td><strong>Sự cố 12 tháng</strong></td>
                                            <td>Số lượng incident bảo mật trong 1 năm qua</td>
                                            <td><code>3</code> (1 Phishing, 1 DDoS, 1 Brute-force)</td>
                                        </tr>
                                        <tr>
                                            <td><strong>VPN</strong></td>
                                            <td>Có cấu hình VPN cho nhân viên từ xa không</td>
                                            <td>✅ Có — <code>Fortinet SSL VPN, 200 users</code></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div className={styles.tipBox}>
                                <strong>💡 Mẹo:</strong> Không cần điền tất cả. Nhưng các trường <strong>Firewall</strong>,
                                <strong> AV/EDR</strong>, <strong>Backup</strong> rất quan trọng — giúp AI đánh giá chính xác mức
                                tuân thủ cho controls liên quan đến <strong>A.8 Công nghệ</strong>.
                            </div>
                        </div>
                    </section>

                    {/* ─── 5. Step 3 ───────────────────────────────────────────────── */}
                    <section id="step3" className={styles.section}>
                        <h2 className={styles.sectionTitle}>
                            <CheckSquare size={18} />
                            5. Bước 3 — Biện pháp kiểm soát (Controls Checklist)
                        </h2>
                        <div className={styles.card}>
                            <p className={styles.paragraph}>
                                Đây là bước <strong>quan trọng nhất</strong>. Bạn đánh dấu (✓) vào các <strong>Controls</strong> (biện pháp kiểm soát)
                                mà tổ chức <strong>đã thực sự triển khai</strong> trong thực tế.
                            </p>

                            <h4 className={styles.subHeading}>Cấu trúc Controls theo ISO 27001:2022</h4>
                            <div className={styles.tableWrap}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>Nhóm</th>
                                            <th>Số lượng</th>
                                            <th>Nội dung chính</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td><strong>A.5 Tổ chức</strong> (Organizational)</td>
                                            <td>37 controls</td>
                                            <td>Chính sách, vai trò, IAM, nhà cung cấp, sự cố, BCP/DR, pháp lý</td>
                                        </tr>
                                        <tr>
                                            <td><strong>A.6 Con người</strong> (People)</td>
                                            <td>8 controls</td>
                                            <td>Tuyển dụng, đào tạo, NDA, remote work, báo cáo sự cố</td>
                                        </tr>
                                        <tr>
                                            <td><strong>A.7 Vật lý</strong> (Physical)</td>
                                            <td>14 controls</td>
                                            <td>An ninh vật lý, CCTV, UPS, bảo trì, hủy thiết bị</td>
                                        </tr>
                                        <tr>
                                            <td><strong>A.8 Công nghệ</strong> (Technological)</td>
                                            <td>34 controls</td>
                                            <td>Endpoint, PAM, MFA, malware, backup, SIEM, firewall, crypto, SDLC</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <h4 className={styles.subHeading}>Hệ thống trọng số (Weight System)</h4>
                            <p className={styles.paragraph}>
                                Mỗi control có 1 trong 4 mức trọng số. Điểm tuân thủ được tính theo <strong>weighted score</strong> —
                                controls quan trọng ảnh hưởng nhiều hơn đến % tuân thủ tổng.
                            </p>
                            <div className={styles.tableWrap}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>Trọng số</th>
                                            <th>Điểm</th>
                                            <th>Ý nghĩa</th>
                                            <th>Ví dụ Control</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td><span className={styles.weightCritical}>critical</span></td>
                                            <td><strong>4 điểm</strong></td>
                                            <td>Tối quan trọng — thiếu sẽ tạo rủi ro nghiêm trọng</td>
                                            <td>A.5.15 Kiểm soát truy cập, A.8.7 Anti-Malware</td>
                                        </tr>
                                        <tr>
                                            <td><span className={styles.weightHigh}>high</span></td>
                                            <td><strong>3 điểm</strong></td>
                                            <td>Quan trọng — nên triển khai sớm</td>
                                            <td>A.5.9 Kiểm kê tài sản, A.8.22 Phân tách mạng</td>
                                        </tr>
                                        <tr>
                                            <td><span className={styles.weightMedium}>medium</span></td>
                                            <td><strong>2 điểm</strong></td>
                                            <td>Trung bình — cải thiện bảo mật tổng thể</td>
                                            <td>A.5.7 Threat Intelligence, A.8.6 Capacity Planning</td>
                                        </tr>
                                        <tr>
                                            <td><span className={styles.weightLow}>low</span></td>
                                            <td><strong>1 điểm</strong></td>
                                            <td>Thấp — nice-to-have, ít ảnh hưởng trực tiếp</td>
                                            <td>A.5.6 Liên lạc nhóm chuyên gia, A.8.17 NTP</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div className={styles.exampleBox}>
                                <strong>📋 Ví dụ thao tác Bước 3:</strong>
                                <ol className={styles.orderedList}>
                                    <li>Mở nhóm <strong>A.5 Tổ chức</strong> bằng cách click vào tiêu đề</li>
                                    <li>Tick ✓ vào <code>A.5.1 — Chính sách an toàn thông tin</code> (nếu đã ban hành)</li>
                                    <li>Click icon <code>ⓘ</code> bên cạnh control để xem chi tiết yêu cầu + upload bằng chứng</li>
                                    <li>Dùng nút <strong>Chọn tất cả thuộc nhóm này</strong> nếu đã triển khai đầy đủ 1 nhóm</li>
                                    <li>Quan sát thanh <strong>% tuân thủ</strong> realtime ở đầu trang</li>
                                </ol>
                            </div>

                            <div className={styles.warningBox}>
                                <strong>⚠️ Lưu ý quan trọng:</strong> Chỉ tick những controls <strong>đã triển khai thực tế</strong>.
                                Tick sai sẽ khiến AI đánh giá lệch. Nếu đang triển khai dở, <strong>không nên tick</strong> — hãy ghi vào
                                phần <strong>Ghi chú</strong> ở Bước 4.
                            </div>
                        </div>
                    </section>

                    {/* ─── 6. Step 4 ───────────────────────────────────────────────── */}
                    <section id="step4" className={styles.section}>
                        <h2 className={styles.sectionTitle}>
                            <FileText size={18} />
                            6. Bước 4 — Mô tả hệ thống & Tổng kết
                        </h2>
                        <div className={styles.card}>
                            <p className={styles.paragraph}>
                                Bước cuối cùng trước khi gửi đánh giá. Bạn mô tả kiến trúc mạng (topology) bằng văn bản
                                và chọn chế độ AI.
                            </p>

                            <h4 className={styles.subHeading}>Mô tả Kiến trúc mạng / Topology</h4>
                            <p className={styles.paragraph}>
                                Đây là phần <strong>free-text</strong> — bạn viết bằng ngôn ngữ tự nhiên. AI sẽ phân tích
                                để hiểu kiến trúc hệ thống.
                            </p>

                            <div className={styles.exampleBox}>
                                <strong>📝 Ví dụ mô tả topology hoàn chỉnh:</strong>
                                <div className={styles.codeBlock}>
                                    {`Mạng chia 5 VLAN:
- VLAN 10 (Server): 20 VM trên VMware ESXi 7.0
- VLAN 20 (User): 150 workstation Windows 11
- VLAN 30 (WiFi Guest): isolated, không access internal
- VLAN 50 (DMZ): Web Server Nginx, Mail Gateway
- VLAN 1 (Management): Switch Cisco Catalyst 9300

Firewall: FortiGate 200F tại biên mạng, block all inbound mặc định.
Zone-based policy: DMZ ↔ Internal chỉ cho phép port 443, 3306.
Internet: 2 ISP (VNPT + Viettel), BGP failover.

Core Banking chạy trên 2 Dell R750 HA Cluster (Active-Passive).
Database: Oracle 19c RAC, TDE enabled.
Backup: Veeam Backup hàng ngày, offsite NAS Synology mỗi tuần.

VPN: FortiClient SSL cho 200 nhân viên remote.
SIEM: Wazuh thu log toàn bộ server + firewall, lưu 12 tháng.
EDR: CrowdStrike Falcon trên 100% endpoint.`}
                                </div>
                            </div>

                            <h4 className={styles.subHeading}>Phần Ghi chú bổ sung</h4>
                            <div className={styles.bulletList}>
                                <li>Sự cố gần đây: <strong>Phishing</strong> (lừa đảo email), <strong>Ransomware</strong> (mã độc tống tiền), <strong>DDoS</strong> (tấn công từ chối dịch vụ)</li>
                                <li>Lỗ hổng đã biết nhưng chưa vá (Known Vulnerabilities)</li>
                                <li>Yêu cầu tuân thủ đặc thù: <strong>PCI-DSS</strong> (thanh toán thẻ), <strong>HIPAA</strong> (y tế)</li>
                                <li>Kế hoạch nâng cấp hạ tầng sắp tới (Roadmap)</li>
                                <li>Ngân sách ATTT (Security Budget) dự kiến</li>
                            </div>

                            <h4 className={styles.subHeading}>Bảng tổng kết trước khi gửi</h4>
                            <p className={styles.paragraph}>
                                Trước khi bấm <strong>Bắt đầu Đánh giá</strong>, hệ thống hiển thị bảng tổng kết:
                            </p>
                            <div className={styles.summaryPreview}>
                                <div className={styles.summaryItem}><span>Tiêu chuẩn:</span> <strong>ISO 27001:2022</strong></div>
                                <div className={styles.summaryItem}><span>Tổ chức:</span> <strong>Ngân hàng TMCP Sài Gòn</strong></div>
                                <div className={styles.summaryItem}><span>Quy mô:</span> <strong>500 nhân sự (25 máy chủ)</strong></div>
                                <div className={styles.summaryItem}><span>Phạm vi:</span> <strong>🏢 Toàn bộ tổ chức</strong></div>
                                <div className={styles.summaryItem}><span>Tuân thủ sơ bộ:</span> <strong>62/93 Controls (71.8%)</strong></div>
                                <div className={styles.summaryItem}><span>Chế độ AI:</span> <strong>⚡ Hybrid (SecurityLM + OpenClaude)</strong></div>
                            </div>
                        </div>
                    </section>

                    {/* ─── 7. AI Modes ──────────────────────────────────────────────── */}
                    <section id="ai-modes" className={styles.section}>
                        <h2 className={styles.sectionTitle}>
                            <Zap size={18} />
                            7. Chế độ AI (Model Mode)
                        </h2>
                        <div className={styles.card}>
                            <p className={styles.paragraph}>
                                Hệ thống hỗ trợ 3 chế độ AI với mức bảo mật và chất lượng khác nhau.
                                Chọn chế độ phù hợp tùy vào <strong>độ nhạy cảm</strong> của dữ liệu.
                            </p>

                            <div className={styles.aiModeGrid}>
                                <div className={`${styles.aiModeCard} ${styles.aiModeLocal}`}>
                                    <div className={styles.aiModeHeader}>
                                        <Lock size={20} />
                                        <h4>Local Only</h4>
                                        <span className={styles.aiModeBadge}>🔒 Bảo mật cao nhất</span>
                                    </div>
                                    <div className={styles.aiModeFlow}>
                                        <span>📋 Form</span> → <span className={styles.flowLocal}>🖥️ SecurityLM</span> → <span className={styles.flowLocal}>🖥️ SecurityLM</span> → <span>📄 Report</span>
                                    </div>
                                    <ul className={styles.aiModeDetails}>
                                        <li><strong>Dữ liệu:</strong> Không rời khỏi server cục bộ</li>
                                        <li><strong>Phase 1 + 2:</strong> Đều chạy trên máy local (SecurityLM)</li>
                                        <li><strong>Thời gian:</strong> 2–5 phút</li>
                                        <li><strong>Phù hợp:</strong> Air-gap, dữ liệu mật, quân sự, chính phủ</li>
                                        <li><strong>Nhược điểm:</strong> Báo cáo cơ bản hơn, cần GPU/RAM mạnh</li>
                                    </ul>
                                </div>

                                <div className={`${styles.aiModeCard} ${styles.aiModeHybrid}`}>
                                    <div className={styles.aiModeHeader}>
                                        <Zap size={20} />
                                        <h4>Hybrid</h4>
                                        <span className={`${styles.aiModeBadge} ${styles.aiModeBadgeRecommend}`}>⚡ Khuyên dùng</span>
                                    </div>
                                    <div className={styles.aiModeFlow}>
                                        <span>📋 Form</span> → <span className={styles.flowLocal}>🖥️ SecurityLM</span> → <span>📊 GAP ẩn danh</span> → <span className={styles.flowCloud}>☁️ OpenClaude</span> → <span>📄 Report</span>
                                    </div>
                                    <ul className={styles.aiModeDetails}>
                                        <li><strong>Dữ liệu hạ tầng:</strong> Chỉ xử lý local — IP, config không gửi cloud</li>
                                        <li><strong>Phase 1:</strong> SecurityLM phân tích GAP cục bộ</li>
                                        <li><strong>Phase 2:</strong> Kết quả GAP (đã ẩn danh) → Cloud format báo cáo</li>
                                        <li><strong>Thời gian:</strong> 1–3 phút</li>
                                        <li><strong>Phù hợp:</strong> Hầu hết tổ chức — cân bằng bảo mật & chất lượng</li>
                                    </ul>
                                </div>

                                <div className={`${styles.aiModeCard} ${styles.aiModeCloud}`}>
                                    <div className={styles.aiModeHeader}>
                                        <Cloud size={20} />
                                        <h4>Cloud Only</h4>
                                        <span className={styles.aiModeBadge}>☁️ Chất lượng cao nhất</span>
                                    </div>
                                    <div className={styles.aiModeFlow}>
                                        <span>📋 Form</span> → <span className={styles.flowCloud}>☁️ OpenClaude P1</span> → <span className={styles.flowCloud}>☁️ OpenClaude P2</span> → <span>📄 Report</span>
                                    </div>
                                    <ul className={styles.aiModeDetails}>
                                        <li><strong>⚠️ Dữ liệu:</strong> Toàn bộ gửi lên cloud (bao gồm hạ tầng, firewall, server)</li>
                                        <li><strong>Phase 1 + 2:</strong> Đều xử lý trên OpenClaude</li>
                                        <li><strong>Thời gian:</strong> 30–60 giây</li>
                                        <li><strong>Phù hợp:</strong> Dữ liệu không nhạy cảm, demo, đào tạo</li>
                                        <li><strong>Ưu điểm:</strong> Báo cáo chi tiết nhất, phân tích sâu nhất</li>
                                    </ul>
                                </div>
                            </div>

                            <div className={styles.warningBox}>
                                <strong>⚠️ Quan trọng về bảo mật:</strong> Nếu tổ chức xử lý dữ liệu nhạy cảm (thông tin khách hàng,
                                dữ liệu y tế, tài chính), hãy chọn <strong>Local Only</strong> hoặc <strong>Hybrid</strong>.
                                Chế độ Cloud gửi <strong>toàn bộ</strong> thông tin hạ tầng lên internet.
                            </div>
                        </div>
                    </section>

                    {/* ─── 8. Results ───────────────────────────────────────────────── */}
                    <section id="results" className={styles.section}>
                        <h2 className={styles.sectionTitle}>
                            <TrendingUp size={18} />
                            8. Đọc hiểu Kết quả đánh giá
                        </h2>
                        <div className={styles.card}>
                            <p className={styles.paragraph}>
                                Sau khi AI hoàn thành phân tích, tab <strong>Kết quả</strong> sẽ hiển thị báo cáo gồm nhiều phần:
                            </p>

                            <h4 className={styles.subHeading}>8.1 Score Hero (Bảng điểm tổng quan)</h4>
                            <div className={styles.tableWrap}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>Thành phần</th>
                                            <th>Mô tả</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td><strong>Gauge (Đồng hồ %)</strong></td>
                                            <td>Hiển thị % tuân thủ tổng (weighted). Màu sắc thay đổi theo mức: xanh ≥80%, xanh dương ≥50%, vàng ≥25%, đỏ &lt;25%</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Compliance Badge</strong></td>
                                            <td>✅ Tuân thủ cao | 🟡 Tuân thủ một phần | 🟠 Tuân thủ thấp | 🔴 Không tuân thủ</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Controls đạt / Còn thiếu / Tổng</strong></td>
                                            <td>Số liệu cụ thể: VD <code>62 / 31 / 93</code></td>
                                        </tr>
                                        <tr>
                                            <td><strong>Model Chips</strong></td>
                                            <td>AI model đã sử dụng (VD: SecurityLM, Semantic RAG)</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <h4 className={styles.subHeading}>8.2 Phân tích theo Category (Weighted Breakdown)</h4>
                            <p className={styles.paragraph}>
                                Bảng thanh tiến trình cho từng nhóm controls, hiển thị:
                            </p>
                            <div className={styles.bulletList}>
                                <li>Tên category (VD: A.5 Tổ chức, A.8 Công nghệ)</li>
                                <li>% tuân thủ có trọng số (không phải đếm đơn giản)</li>
                                <li>Số controls đạt / tổng controls trong nhóm</li>
                                <li>Điểm đạt / điểm tối đa</li>
                            </div>

                            <h4 className={styles.subHeading}>8.3 Dashboard cấu trúc (Structured Data)</h4>
                            <div className={styles.tableWrap}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>Phần</th>
                                            <th>Nội dung</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td><strong>Phân loại Rủi ro</strong></td>
                                            <td>Đếm số GAP theo severity: Critical / High / Medium / Low</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Tuân thủ theo Trọng số</strong></td>
                                            <td>% tuân thủ riêng cho mỗi mức weight (critical, high, medium, low)</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Controls Thiếu Ưu tiên Cao</strong></td>
                                            <td>Top 8 controls chưa triển khai nhưng severity critical/high</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <h4 className={styles.subHeading}>8.4 Mức đánh giá tuân thủ</h4>
                            <div className={styles.tableWrap}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>% Tuân thủ</th>
                                            <th>Mức</th>
                                            <th>Ý nghĩa</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td><span className={styles.scoreGreen}>≥ 80%</span></td>
                                            <td>✅ Tuân thủ cao</td>
                                            <td>Sẵn sàng cho audit chứng nhận, chỉ cần hoàn thiện chi tiết</td>
                                        </tr>
                                        <tr>
                                            <td><span className={styles.scoreBlue}>50% – 79%</span></td>
                                            <td>🟡 Tuân thủ một phần</td>
                                            <td>Có nền tảng tốt, cần bổ sung nhiều controls nữa</td>
                                        </tr>
                                        <tr>
                                            <td><span className={styles.scoreAmber}>25% – 49%</span></td>
                                            <td>🟠 Tuân thủ thấp</td>
                                            <td>Mới bắt đầu, cần xây dựng roadmap triển khai có ưu tiên</td>
                                        </tr>
                                        <tr>
                                            <td><span className={styles.scoreRed}>&lt; 25%</span></td>
                                            <td>🔴 Không tuân thủ</td>
                                            <td>Rủi ro rất cao, cần hành động ngay lập tức</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>

                    {/* ─── 9. History & Templates ──────────────────────────────────── */}
                    <section id="history" className={styles.section}>
                        <h2 className={styles.sectionTitle}>
                            <History size={18} />
                            9. Lịch sử đánh giá & Kho mẫu (Templates)
                        </h2>
                        <div className={styles.card}>
                            <h4 className={styles.subHeading}>Tab Lịch sử</h4>
                            <p className={styles.paragraph}>
                                Tất cả đánh giá được lưu trên server. Tab <strong>Lịch sử</strong> hiển thị:
                            </p>
                            <div className={styles.bulletList}>
                                <li>Tên tổ chức + ngày giờ đánh giá</li>
                                <li>Tiêu chuẩn đã dùng (ISO 27001, TCVN 11930...)</li>
                                <li>% tuân thủ khi hoàn thành</li>
                                <li>Trạng thái: ✅ Hoàn thành | ⏳ Đang xử lý | ❌ Thất bại | 🔄 Chờ</li>
                            </div>

                            <div className={styles.exampleBox}>
                                <strong>📋 Thao tác trên Lịch sử:</strong>
                                <ul className={styles.bulletList}>
                                    <li><strong>Xem →</strong> : Mở lại kết quả đánh giá đã hoàn thành</li>
                                    <li><strong>Theo dõi →</strong> : Xem tiến trình đánh giá đang chạy</li>
                                    <li><strong>Thử lại</strong> : Quay về Bước 4 để gửi lại (khi thất bại)</li>
                                    <li><strong>🗑️</strong> : Xóa đánh giá (có xác nhận trước khi xóa)</li>
                                    <li><strong>🔄 Làm mới</strong> : Refresh danh sách lịch sử</li>
                                </ul>
                            </div>

                            <h4 className={styles.subHeading}>Tab Kho Mẫu (Templates)</h4>
                            <p className={styles.paragraph}>
                                Kho mẫu chứa dữ liệu hệ thống thực tế (ngân hàng, bệnh viện, startup...) đã cấu hình sẵn.
                                Hữu ích cho: <strong>demo</strong>, <strong>đào tạo</strong>, <strong>benchmark</strong>, <strong>so sánh</strong>.
                            </p>

                            <div className={styles.exampleBox}>
                                <strong>📋 Cách sử dụng Template:</strong>
                                <ol className={styles.orderedList}>
                                    <li>Chuyển sang tab <strong>Mẫu</strong></li>
                                    <li>Lọc theo tiêu chuẩn (ISO 27001 / TCVN 11930)</li>
                                    <li>Xem thông tin: nhân sự, máy chủ, IT staff, mức tuân thủ</li>
                                    <li>Bấm <strong>Phân tích hệ thống này →</strong></li>
                                    <li>Hệ thống tự điền toàn bộ form → bạn chỉnh sửa nếu cần → Đánh giá</li>
                                </ol>
                            </div>
                        </div>
                    </section>

                    {/* ─── 10. Evidence ─────────────────────────────────────────────── */}
                    <section id="evidence" className={styles.section}>
                        <h2 className={styles.sectionTitle}>
                            <Upload size={18} />
                            10. Upload bằng chứng triển khai (Evidence)
                        </h2>
                        <div className={styles.card}>
                            <p className={styles.paragraph}>
                                Mỗi control có thể đính kèm <strong>bằng chứng</strong> (evidence) — file minh chứng đã triển khai thực tế.
                                AI sẽ phân tích nội dung file khi tạo báo cáo.
                            </p>

                            <h4 className={styles.subHeading}>Cách upload bằng chứng</h4>
                            <ol className={styles.orderedList}>
                                <li>Ở Bước 3, click icon <code>ⓘ</code> bên cạnh bất kỳ control nào</li>
                                <li>Panel chi tiết mở ra — cuộn xuống phần <strong>Upload bằng chứng</strong></li>
                                <li>Kéo-thả (drag & drop) file vào vùng upload, hoặc bấm <strong>📎 Chọn file</strong></li>
                                <li>Hỗ trợ nhiều file cùng lúc, tối đa <strong>10MB/file</strong></li>
                            </ol>

                            <h4 className={styles.subHeading}>Định dạng file hỗ trợ</h4>
                            <div className={styles.fileFormats}>
                                <span className={styles.formatBadge}>.pdf</span>
                                <span className={styles.formatBadge}>.png</span>
                                <span className={styles.formatBadge}>.jpg</span>
                                <span className={styles.formatBadge}>.doc/.docx</span>
                                <span className={styles.formatBadge}>.xlsx</span>
                                <span className={styles.formatBadge}>.csv</span>
                                <span className={styles.formatBadge}>.txt</span>
                                <span className={styles.formatBadge}>.log</span>
                                <span className={styles.formatBadge}>.conf</span>
                                <span className={styles.formatBadge}>.xml</span>
                                <span className={styles.formatBadge}>.json</span>
                            </div>

                            <div className={styles.exampleBox}>
                                <strong>📋 Ví dụ bằng chứng cho từng control:</strong>
                                <div className={styles.tableWrap}>
                                    <table className={styles.table}>
                                        <thead>
                                            <tr>
                                                <th>Control</th>
                                                <th>Loại bằng chứng</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td><strong>A.5.1</strong> Chính sách ATTT</td>
                                                <td>File PDF chính sách đã phê duyệt, có chữ ký ban giám đốc</td>
                                            </tr>
                                            <tr>
                                                <td><strong>A.6.3</strong> Đào tạo ATTT</td>
                                                <td>Slide đào tạo, danh sách nhân viên đã tham gia, điểm kiểm tra</td>
                                            </tr>
                                            <tr>
                                                <td><strong>A.8.7</strong> Anti-Malware</td>
                                                <td>Screenshot dashboard EDR, report quét virus, policy config</td>
                                            </tr>
                                            <tr>
                                                <td><strong>A.8.15</strong> SIEM Logging</td>
                                                <td>Export config SIEM, sample log, dashboard screenshot</td>
                                            </tr>
                                            <tr>
                                                <td><strong>A.8.20</strong> Firewall</td>
                                                <td>Firewall rule export (.conf), network diagram, access policy</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className={styles.tipBox}>
                                <strong>💡 Mẹo:</strong> Bạn có thể bấm <strong>👁️</strong> để xem trước nội dung file đã upload.
                                Bấm <strong>✕</strong> để xóa file. Tổng số file đính kèm hiển thị ở badge bên cạnh tiêu đề.
                            </div>
                        </div>
                    </section>

                    {/* ─── 11. Export ───────────────────────────────────────────────── */}
                    <section id="export" className={styles.section}>
                        <h2 className={styles.sectionTitle}>
                            <Download size={18} />
                            11. Xuất báo cáo (Export)
                        </h2>
                        <div className={styles.card}>
                            <p className={styles.paragraph}>
                                Sau khi đánh giá hoàn thành, bạn có nhiều cách xuất & chia sẻ báo cáo:
                            </p>

                            <div className={styles.tableWrap}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>Hành động</th>
                                            <th>Mô tả</th>
                                            <th>Dùng khi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td><strong>Copy report</strong></td>
                                            <td>Copy toàn bộ nội dung Markdown vào clipboard</td>
                                            <td>Dán vào email, Slack, Confluence, Notion</td>
                                        </tr>
                                        <tr>
                                            <td><strong>📄 Xem / Xuất PDF</strong></td>
                                            <td>Mở tab mới với HTML đẹp → Ctrl+P để in/lưu PDF</td>
                                            <td>Gửi cho khách hàng, ban giám đốc</td>
                                        </tr>
                                        <tr>
                                            <td><strong>📥 Tải PDF (Server)</strong></td>
                                            <td>Server tạo PDF và tải về trực tiếp</td>
                                            <td>Lưu trữ chính thức, đính kèm hồ sơ</td>
                                        </tr>
                                        <tr>
                                            <td><strong>🖨️ In báo cáo</strong></td>
                                            <td>Mở dialog in của trình duyệt</td>
                                            <td>In giấy cho cuộc họp</td>
                                        </tr>
                                        <tr>
                                            <td><strong>📥 Tải JSON</strong></td>
                                            <td>Export dữ liệu cấu trúc (compliance %, risk counts, weight breakdown)</td>
                                            <td>Tích hợp dashboard/BI ngoài (Grafana, Power BI)</td>
                                        </tr>
                                        <tr>
                                            <td><strong>← Đánh giá mới</strong></td>
                                            <td>Quay về form nhập liệu để đánh giá lại</td>
                                            <td>Đánh giá tổ chức khác hoặc sau khi cải thiện</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Đánh giá lại (Local/Hybrid/Cloud)</strong></td>
                                            <td>Gửi lại form với chế độ AI khác</td>
                                            <td>So sánh kết quả giữa các AI model</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>

                    {/* ─── 12. Scoring ──────────────────────────────────────────────── */}
                    <section id="scoring" className={styles.section}>
                        <h2 className={styles.sectionTitle}>
                            <Shield size={18} />
                            12. Công thức tính điểm tuân thủ (Weighted Scoring)
                        </h2>
                        <div className={styles.card}>
                            <p className={styles.paragraph}>
                                Điểm tuân thủ <strong>không phải</strong> đếm đơn giản (VD: 62/93 = 66.7%). Hệ thống dùng
                                <strong> weighted scoring</strong> — controls có trọng số critical ảnh hưởng gấp 4 lần controls low.
                            </p>

                            <div className={styles.formulaBox}>
                                <h4>Công thức:</h4>
                                <div className={styles.formula}>
                                    <code>% Tuân thủ = (Tổng điểm controls đã tick) / (Tổng điểm tối đa) × 100</code>
                                </div>
                                <p>Trong đó: critical = 4 điểm, high = 3, medium = 2, low = 1</p>
                            </div>

                            <h4 className={styles.subHeading}>Ví dụ tính toán thực tế</h4>
                            <div className={styles.exampleBox}>
                                <strong>📊 Ví dụ: Tổ chức A đã tick 62/93 controls (ISO 27001)</strong>
                                <div className={styles.tableWrap}>
                                    <table className={styles.table}>
                                        <thead>
                                            <tr>
                                                <th>Trọng số</th>
                                                <th>Tổng controls</th>
                                                <th>Đã tick</th>
                                                <th>Điểm đạt</th>
                                                <th>Điểm tối đa</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td><span className={styles.weightCritical}>critical</span></td>
                                                <td>22</td>
                                                <td>18</td>
                                                <td>18 × 4 = <strong>72</strong></td>
                                                <td>22 × 4 = 88</td>
                                            </tr>
                                            <tr>
                                                <td><span className={styles.weightHigh}>high</span></td>
                                                <td>30</td>
                                                <td>22</td>
                                                <td>22 × 3 = <strong>66</strong></td>
                                                <td>30 × 3 = 90</td>
                                            </tr>
                                            <tr>
                                                <td><span className={styles.weightMedium}>medium</span></td>
                                                <td>25</td>
                                                <td>16</td>
                                                <td>16 × 2 = <strong>32</strong></td>
                                                <td>25 × 2 = 50</td>
                                            </tr>
                                            <tr>
                                                <td><span className={styles.weightLow}>low</span></td>
                                                <td>16</td>
                                                <td>6</td>
                                                <td>6 × 1 = <strong>6</strong></td>
                                                <td>16 × 1 = 16</td>
                                            </tr>
                                            <tr className={styles.totalRow}>
                                                <td><strong>Tổng</strong></td>
                                                <td><strong>93</strong></td>
                                                <td><strong>62</strong></td>
                                                <td><strong>176</strong></td>
                                                <td><strong>244</strong></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                <p className={styles.paragraph} style={{ marginTop: '0.75rem' }}>
                                    <strong>% Tuân thủ = 176 / 244 × 100 = 72.1%</strong> (thay vì 66.7% nếu đếm đơn giản)
                                </p>
                                <p className={styles.paragraph}>
                                    → Vì tổ chức A tick được nhiều controls <strong>critical</strong> (18/22), weighted score cao hơn.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* ─── 13. FAQ ──────────────────────────────────────────────────── */}
                    <section id="faq" className={styles.section}>
                        <h2 className={styles.sectionTitle}>
                            <AlertTriangle size={18} />
                            13. Câu hỏi thường gặp (FAQ)
                        </h2>
                        <div className={styles.card}>
                            <Collapse title="Đánh giá mất bao lâu?">
                                <p className={styles.paragraph}>
                                    Tùy chế độ AI:
                                </p>
                                <ul className={styles.bulletList}>
                                    <li><strong>Cloud:</strong> 30–60 giây</li>
                                    <li><strong>Hybrid:</strong> 1–3 phút</li>
                                    <li><strong>Local:</strong> 2–5 phút (phụ thuộc cấu hình máy)</li>
                                </ul>
                                <p className={styles.paragraph}>
                                    Bạn <strong>không cần chờ</strong> — có thể chuyển tab hoặc đóng trình duyệt. Hệ thống xử lý ngầm
                                    và lưu kết quả. Quay lại tab <strong>Lịch sử</strong> để xem khi nào xong.
                                </p>
                            </Collapse>

                            <Collapse title="Lỗi 'could not load model' hoặc 'rpc error' nghĩa là gì?">
                                <p className={styles.paragraph}>
                                    <strong>Nguyên nhân:</strong> LocalAI không load được model — thường do thiếu RAM/VRAM hoặc model file chưa tải.
                                </p>
                                <p className={styles.paragraph}>
                                    <strong>Giải pháp:</strong> Chuyển sang chế độ <strong>Hybrid</strong> hoặc <strong>Cloud</strong> ở Bước 4
                                    rồi đánh giá lại. Hoặc kiểm tra Docker container <code>localai</code> có đang chạy không.
                                </p>
                            </Collapse>

                            <Collapse title="Sự khác nhau giữa 'điểm đếm' và 'weighted score'?">
                                <p className={styles.paragraph}>
                                    <strong>Điểm đếm:</strong> 62/93 controls = 66.7% — mỗi control bằng nhau.
                                    <br />
                                    <strong>Weighted score:</strong> Controls critical (×4) ảnh hưởng nhiều hơn low (×1).
                                    Nên nếu bạn tick được nhiều critical controls, % sẽ cao hơn 66.7%.
                                </p>
                                <p className={styles.paragraph}>
                                    Hệ thống <strong>luôn</strong> dùng weighted score để phản ánh đúng mức độ rủi ro thực tế.
                                </p>
                            </Collapse>

                            <Collapse title="Dữ liệu có được lưu không? Ở đâu?">
                                <p className={styles.paragraph}>
                                    <strong>Draft form:</strong> Lưu trong <code>localStorage</code> trình duyệt (tự động, mất khi xóa cache).
                                    <br />
                                    <strong>Kết quả đánh giá:</strong> Lưu trên server backend (thư mục <code>data/assessments/</code>).
                                    Không mất khi đóng trình duyệt.
                                </p>
                            </Collapse>

                            <Collapse title="Có thể đánh giá lại với AI mode khác không?">
                                <p className={styles.paragraph}>
                                    <strong>Có.</strong> Sau khi xem kết quả, ở cuối báo cáo có nhóm nút <strong>Đánh giá lại</strong> —
                                    chọn Local / Hybrid / Cloud. Hệ thống sẽ gửi lại cùng dữ liệu với model khác.
                                </p>
                                <p className={styles.paragraph}>
                                    Hữu ích để <strong>so sánh</strong> chất lượng báo cáo giữa LocalAI vs Cloud AI.
                                </p>
                            </Collapse>

                            <Collapse title="Tôi muốn đánh giá theo TCVN 11930 thay vì ISO 27001?">
                                <p className={styles.paragraph}>
                                    Ở Bước 1, thay đổi dropdown <strong>Tiêu chuẩn đánh giá</strong> sang <code>TCVN 11930:2017</code>.
                                    Bộ Checklist ở Bước 3 sẽ tự động chuyển sang 34 controls theo TCVN 11930
                                    (Mạng, Máy chủ, Ứng dụng, Dữ liệu, Vận hành).
                                </p>
                                <p className={styles.paragraph}>
                                    <strong>Lưu ý:</strong> Khi đổi tiêu chuẩn, danh sách controls đã tick sẽ bị reset.
                                </p>
                            </Collapse>

                            <Collapse title="Làm sao tải mẫu báo cáo PDF chuyên nghiệp?">
                                <p className={styles.paragraph}>
                                    Sau khi đánh giá xong:
                                </p>
                                <ol className={styles.orderedList}>
                                    <li>Bấm <strong>📄 Xem / Xuất PDF</strong> — mở tab mới với HTML đẹp</li>
                                    <li>Bấm <strong>🖨️ In / Lưu PDF</strong> (hoặc <code>Ctrl+P</code>)</li>
                                    <li>Chọn <strong>Lưu thành PDF</strong> → <strong>Lưu</strong></li>
                                </ol>
                                <p className={styles.paragraph}>
                                    Hoặc bấm <strong>📥 Tải PDF (Server)</strong> để server tạo PDF và tải về trực tiếp.
                                </p>
                            </Collapse>

                            <Collapse title="Assessment hỗ trợ Custom Standard (tiêu chuẩn tự tạo) không?">
                                <p className={styles.paragraph}>
                                    <strong>Có.</strong> Nếu bạn đã upload custom standard qua trang <strong>Standards</strong>,
                                    nó sẽ tự động xuất hiện trong dropdown tiêu chuẩn ở Bước 1 với tag <code>(custom)</code>.
                                </p>
                            </Collapse>
                        </div>
                    </section>

                    {/* ─── CTA ──────────────────────────────────────────────────────── */}
                    <div className={styles.ctaSection}>
                        <div className={styles.ctaCard}>
                            <h3>{t('guide.readyToStart')}</h3>
                            <p>{t('guide.readyToStartDesc')}</p>
                            <div className={styles.ctaActions}>
                                <Link href="/form-iso" className={styles.ctaPrimary}>
                                    <Shield size={16} />
                                    {t('guide.startAssessment')}
                                </Link>
                                <Link href="/settings" className={styles.ctaSecondary}>
                                    ← {t('guide.backToSettings')}
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
