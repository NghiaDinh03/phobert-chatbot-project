'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import styles from './page.module.css'

// ── Inline Format Guide Panel ────────────────────────────────────────────────
function FormatGuidePanel({ onClose }) {
    const [tab, setTab] = useState('json')
    return (
        <div className={styles.formatGuideOverlay} onClick={onClose}>
            <div className={styles.formatGuidePanel} onClick={e => e.stopPropagation()}>
                <div className={styles.formatGuideHeader}>
                    <div>
                        <h3 className={styles.formatGuideTitle}>📖 Hướng dẫn Format Tiêu chuẩn</h3>
                        <p className={styles.formatGuideSubtitle}>
                            Cả hai tiêu chuẩn có sẵn (ISO 27001, TCVN 11930) đều dùng chung schema này.
                            File custom upload phải đúng format bên dưới.
                        </p>
                    </div>
                    <button className={styles.formatGuideClose} onClick={onClose}>✕</button>
                </div>

                <div className={styles.formatGuideTabs}>
                    {[
                        { id: 'json', label: '📄 JSON' },
                        { id: 'yaml', label: '📄 YAML' },
                        { id: 'builtin', label: '🏛️ Built-in mẫu' },
                        { id: 'chromadb', label: '🗄️ vs ChromaDB' },
                    ].map(t => (
                        <button
                            key={t.id}
                            className={`${styles.formatGuideTab} ${tab === t.id ? styles.formatGuideTabActive : ''}`}
                            onClick={() => setTab(t.id)}
                        >{t.label}</button>
                    ))}
                </div>

                <div className={styles.formatGuideBody}>
                    {tab === 'json' && (
                        <>
                            <p className={styles.formatGuideNote}>
                                ✅ Format JSON đầy đủ — cả <strong>controls lồng nhau theo category</strong> và <strong>controlDescriptions</strong> tùy chọn.
                            </p>
                            <pre className={styles.formatGuideCode}>{`{
  "id": "my_standard",          // BẮT BUỘC · Duy nhất · a-z 0-9 _ -
  "name": "Tên Tiêu chuẩn",    // BẮT BUỘC · Hiển thị trong dropdown
  "version": "1.0",             // Tùy chọn
  "description": "Mô tả...",   // Tùy chọn

  "controls": [                 // BẮT BUỘC · Mảng categories
    {
      "category": "1. Tên nhóm",
      "controls": [
        {
          "id": "CTL.01",       // BẮT BUỘC · Duy nhất trong toàn tiêu chuẩn
          "label": "Tên ngắn",  // BẮT BUỘC
          "weight": "critical"  // BẮT BUỘC · critical|high|medium|low
        },
        {
          "id": "CTL.02",
          "label": "Control khác",
          "weight": "high"
        }
      ]
    }
  ],

  "controlDescriptions": {      // TÙY CHỌN · Chi tiết từng control
    "CTL.01": {
      "requirement": "Yêu cầu tiêu chuẩn đặt ra...",
      "criteria": "Cách đánh giá / kiểm tra...",
      "hint": "Gợi ý triển khai thực tế...",
      "evidence": [
        "Tài liệu chính sách ABC",
        "Log file XYZ"
      ]
    }
  }
}`}</pre>
                            <div className={styles.formatGuideWeights}>
                                <strong>Trọng số điểm:</strong>
                                {[['critical','#ef4444','4 điểm'],['high','#f59e0b','3 điểm'],['medium','#3b82f6','2 điểm'],['low','#94a3b8','1 điểm']].map(([w,c,p])=>(
                                    <span key={w} style={{borderColor:c,color:c,border:`1px solid ${c}`,borderRadius:'4px',padding:'2px 8px',fontSize:'0.78rem'}}>{w} = {p}</span>
                                ))}
                            </div>
                        </>
                    )}
                    {tab === 'yaml' && (
                        <>
                            <p className={styles.formatGuideNote}>✅ Format YAML — tương đương JSON, cú pháp gọn hơn.</p>
                            <pre className={styles.formatGuideCode}>{`id: my_standard
name: "Tên Tiêu chuẩn"
version: "1.0"
description: "Mô tả tiêu chuẩn"

controls:
  - category: "1. Tên nhóm"
    controls:
      - id: CTL.01
        label: "Tên control ngắn"
        weight: critical        # critical | high | medium | low
      - id: CTL.02
        label: "Control khác"
        weight: high

controlDescriptions:            # Tùy chọn
  CTL.01:
    requirement: "Yêu cầu tiêu chuẩn..."
    criteria: "Tiêu chí kiểm tra..."
    hint: "Gợi ý triển khai..."
    evidence:
      - "Tài liệu chính sách"
      - "Log file minh chứng"`}</pre>
                        </>
                    )}
                    {tab === 'builtin' && (
                        <>
                            <p className={styles.formatGuideNote}>
                                🏛️ Hai tiêu chuẩn built-in dùng <strong>cùng schema</strong> như custom upload.
                                Sự khác biệt duy nhất: built-in được hardcode trong <code>src/data/standards.js</code> và không thể xóa.
                            </p>
                            <pre className={styles.formatGuideCode}>{`// ISO 27001:2022 — ví dụ 2 controls đầu
{
  "id": "iso27001",
  "name": "ISO 27001:2022 (93 Biện pháp kiểm soát)",
  "controls": [
    {
      "category": "A.5 Tổ chức",
      "controls": [
        { "id": "A.5.1",  "label": "Chính sách an toàn thông tin", "weight": "critical" },
        { "id": "A.5.2",  "label": "Vai trò và trách nhiệm ATTT",  "weight": "critical" }
        // ... 91 controls tiếp theo
      ]
    },
    { "category": "A.6 Con người",   "controls": [ /* 8 controls */ ] },
    { "category": "A.7 Vật lý",      "controls": [ /* 14 controls */ ] },
    { "category": "A.8 Công nghệ",   "controls": [ /* 34 controls */ ] }
  ]
}

// TCVN 11930:2017 — cùng schema, ID khác
{
  "id": "tcvn11930",
  "name": "TCVN 11930:2017 (34 Yêu cầu kỹ thuật/quản lý)",
  "controls": [
    { "category": "1. Bảo đảm ATTT Mạng",            "controls": [ /* NW.01–NW.08 */ ] },
    { "category": "2. Bảo đảm ATTT Máy chủ",          "controls": [ /* SV.01–SV.08 */ ] },
    { "category": "3. Bảo đảm ATTT Ứng dụng",         "controls": [ /* APP.01–APP.07 */ ] },
    { "category": "4. Bảo đảm ATTT Dữ liệu",          "controls": [ /* DAT.01–DAT.06 */ ] },
    { "category": "5. Quản lý Vận hành & Chính sách",  "controls": [ /* MNG.01–MNG.05 */ ] }
  ]
}`}</pre>
                            <p className={styles.formatGuideNote} style={{marginTop:'0.75rem'}}>
                                💡 Muốn xem full schema? Bấm <strong>"Tải mẫu JSON"</strong> — file tải về sẽ có đầy đủ tất cả trường bắt buộc và tùy chọn.
                            </p>
                        </>
                    )}
                    {tab === 'chromadb' && (
                        <>
                            <p className={styles.formatGuideNote}>
                                🗄️ <strong>ChromaDB không dùng format JSON của bạn trực tiếp.</strong>
                                Backend tự động chuyển đổi (transform) khi bạn upload.
                            </p>
                            <div className={styles.formatGuideCompare}>
                                <div className={styles.formatGuideCompareCol}>
                                    <div className={styles.formatGuideCompareHead} style={{background:'var(--surface-2,#1e2a3a)',color:'var(--accent-blue)'}}>
                                        📄 File upload của bạn (JSON/YAML)
                                    </div>
                                    <pre className={styles.formatGuideCode} style={{margin:0,borderRadius:'0 0 8px 8px'}}>{`{
  "id": "my_standard",
  "controls": [
    {
      "category": "1. Nhóm A",
      "controls": [
        {
          "id": "CTL.01",
          "label": "Control name",
          "weight": "critical"
        }
      ]
    }
  ]
}`}</pre>
                                </div>
                                <div className={styles.formatGuideCompareArrow}>→ backend transform →</div>
                                <div className={styles.formatGuideCompareCol}>
                                    <div className={styles.formatGuideCompareHead} style={{background:'var(--surface-2,#1e2a3a)',color:'var(--accent-green)'}}>
                                        🗄️ ChromaDB document chunk
                                    </div>
                                    <pre className={styles.formatGuideCode} style={{margin:0,borderRadius:'0 0 8px 8px'}}>{`{
  "id": "my_standard__CTL_01",
  "document": "CTL.01 — Control name\\n
    Category: 1. Nhóm A\\n
    Weight: critical\\n
    Standard: my_standard",
  "metadata": {
    "source": "my_standard",
    "control_id": "CTL.01",
    "category": "1. Nhóm A",
    "weight": "critical"
  }
}`}</pre>
                                </div>
                            </div>
                            <p className={styles.formatGuideNote} style={{marginTop:'0.75rem'}}>
                                Mỗi control được index thành <strong>1 chunk riêng</strong> trong ChromaDB.
                                AI Auditor tra cứu ChromaDB khi đánh giá để tìm yêu cầu chuẩn liên quan.
                                <br/>
                                Sau upload, nhấn <strong>🔄 Re-index</strong> trên card tiêu chuẩn để cập nhật ChromaDB nếu cần.
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

export default function StandardsPage() {
    const [standards, setStandards] = useState({ builtin: [], custom: [] })
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [uploadResult, setUploadResult] = useState(null)
    const [validateResult, setValidateResult] = useState(null)
    const [dragOver, setDragOver] = useState(false)
    const [selectedStandard, setSelectedStandard] = useState(null)
    const [detailLoading, setDetailLoading] = useState(false)
    const [showFormatGuide, setShowFormatGuide] = useState(false)

    const fetchStandards = useCallback(async () => {
        try {
            setLoading(true)
            const res = await fetch('/api/standards')
            if (res.ok) {
                const data = await res.json()
                setStandards({ builtin: data.builtin || [], custom: data.custom || [] })
            }
        } catch (e) {
            console.error('Failed to fetch standards:', e)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchStandards() }, [fetchStandards])

    const handleUpload = async (file) => {
        if (!file) return
        setUploading(true)
        setUploadResult(null)
        setValidateResult(null)

        const formData = new FormData()
        formData.append('file', file)

        try {
            const res = await fetch('/api/standards/upload', {
                method: 'POST',
                body: formData,
            })
            const data = await res.json()

            if (res.ok && data.status === 'success') {
                setUploadResult({ success: true, data })
                fetchStandards()
            } else {
                setUploadResult({
                    success: false,
                    errors: data.errors || [data.detail || data.message || 'Upload failed'],
                })
            }
        } catch (e) {
            setUploadResult({ success: false, errors: [`Network error: ${e.message}`] })
        } finally {
            setUploading(false)
        }
    }

    const handleValidate = async (file) => {
        if (!file) return
        setValidateResult(null)

        const formData = new FormData()
        formData.append('file', file)

        try {
            const res = await fetch('/api/standards/validate', {
                method: 'POST',
                body: formData,
            })
            const data = await res.json()
            setValidateResult(data)
        } catch (e) {
            setValidateResult({ valid: false, errors: [`Network error: ${e.message}`] })
        }
    }

    const handleDelete = async (standardId) => {
        if (!confirm(`Xác nhận xóa tiêu chuẩn "${standardId}"? Hành động này không thể hoàn tác.`)) return

        try {
            const res = await fetch(`/api/standards/${standardId}`, { method: 'DELETE' })
            if (res.ok) {
                fetchStandards()
                if (selectedStandard?.id === standardId) setSelectedStandard(null)
            }
        } catch (e) {
            console.error('Delete failed:', e)
        }
    }

    const handleReindex = async (standardId) => {
        try {
            const res = await fetch(`/api/standards/${standardId}/index`, { method: 'POST' })
            const data = await res.json()
            alert(data.status === 'ok'
                ? `✅ Indexed ${data.chunks_indexed} chunks cho tiêu chuẩn "${standardId}"`
                : `❌ ${data.message || 'Indexing failed'}`
            )
        } catch (e) {
            alert(`❌ Error: ${e.message}`)
        }
    }

    const handleViewDetail = async (standardId) => {
        setDetailLoading(true)
        try {
            const res = await fetch(`/api/standards/${standardId}`)
            if (res.ok) {
                const data = await res.json()
                setSelectedStandard(data)
            }
        } catch (e) {
            console.error('Failed to load standard detail:', e)
        } finally {
            setDetailLoading(false)
        }
    }

    const downloadSample = async () => {
        try {
            const res = await fetch('/api/standards/sample')
            const data = await res.json()
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'sample_standard.json'
            a.click()
            URL.revokeObjectURL(url)
        } catch (e) {
            console.error('Download failed:', e)
        }
    }

    const onDrop = (e) => {
        e.preventDefault()
        setDragOver(false)
        const file = e.dataTransfer?.files?.[0]
        if (file) handleUpload(file)
    }

    const onFileSelect = (e) => {
        const file = e.target.files?.[0]
        if (file) handleUpload(file)
    }

    const onValidateSelect = (e) => {
        const file = e.target.files?.[0]
        if (file) handleValidate(file)
    }

    const WEIGHT_LABEL = { critical: 'Tối quan trọng', high: 'Quan trọng', medium: 'Trung bình', low: 'Thấp' }
    const WEIGHT_COLOR = { critical: '#ef4444', high: '#f59e0b', medium: '#3b82f6', low: '#94a3b8' }

    return (
        <div className="page-container">
            <div className={styles.header}>
                <h1 className={styles.title}>📋 Quản lý Tiêu chuẩn Đánh giá</h1>
                <p className={styles.subtitle}>
                    Upload tiêu chuẩn tùy chỉnh (JSON/YAML) → Backend parse + ChromaDB index → Form đánh giá tự động render.
                    <br />
                    <Link href="/form-iso" className={styles.backLink}>← Quay lại Form đánh giá</Link>
                </p>
            </div>

            {/* ── Format Guide Modal ──────────────────────── */}
            {showFormatGuide && <FormatGuidePanel onClose={() => setShowFormatGuide(false)} />}

            {/* ── Upload Section ──────────────────────────── */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>
                        <span>⬆️</span> Upload Tiêu chuẩn Mới
                        <button
                            className={styles.infoIconBtn}
                            onClick={() => setShowFormatGuide(true)}
                            title="Xem hướng dẫn format file upload"
                        >ℹ️</button>
                    </h2>
                    <div className={styles.sectionActions}>
                        <button className={styles.btnOutline} onClick={downloadSample}>
                            📥 Tải mẫu JSON
                        </button>
                        <label className={styles.btnOutline}>
                            🔍 Validate file
                            <input type="file" accept=".json,.yaml,.yml" onChange={onValidateSelect} hidden />
                        </label>
                    </div>
                </div>

                <div
                    className={`${styles.dropZone} ${dragOver ? styles.dropZoneActive : ''} ${uploading ? styles.dropZoneUploading : ''}`}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={onDrop}
                >
                    {uploading ? (
                        <div className={styles.dropContent}>
                            <span className={styles.dropSpinner} />
                            <p>Đang upload và xử lý...</p>
                        </div>
                    ) : (
                        <div className={styles.dropContent}>
                            <span className={styles.dropIcon}>📂</span>
                            <p className={styles.dropText}>Kéo thả file JSON / YAML vào đây</p>
                            <p className={styles.dropHint}>hoặc</p>
                            <label className={styles.btnPrimary}>
                                Chọn file
                                <input type="file" accept=".json,.yaml,.yml" onChange={onFileSelect} hidden />
                            </label>
                            <p className={styles.dropMeta}>Hỗ trợ: .json, .yaml, .yml · Tối đa 2MB</p>
                        </div>
                    )}
                </div>

                {/* Validate Result */}
                {validateResult && (
                    <div className={`${styles.resultBox} ${validateResult.valid ? styles.resultSuccess : styles.resultError}`}>
                        <div className={styles.resultHeader}>
                            {validateResult.valid ? '✅ File hợp lệ' : '❌ File không hợp lệ'}
                        </div>
                        {validateResult.preview && (
                            <div className={styles.resultMeta}>
                                <span>ID: <strong>{validateResult.preview.id}</strong></span>
                                <span>Tên: <strong>{validateResult.preview.name}</strong></span>
                                <span>Controls: <strong>{validateResult.preview.total_controls}</strong></span>
                                <span>Categories: <strong>{validateResult.preview.categories}</strong></span>
                            </div>
                        )}
                        {validateResult.errors?.length > 0 && (
                            <ul className={styles.errorList}>
                                {validateResult.errors.map((err, i) => <li key={i}>{err}</li>)}
                            </ul>
                        )}
                    </div>
                )}

                {/* Upload Result */}
                {uploadResult && (
                    <div className={`${styles.resultBox} ${uploadResult.success ? styles.resultSuccess : styles.resultError}`}>
                        <div className={styles.resultHeader}>
                            {uploadResult.success ? '✅ Upload thành công!' : '❌ Upload thất bại'}
                        </div>
                        {uploadResult.success && uploadResult.data?.standard && (
                            <div className={styles.resultMeta}>
                                <span>ID: <strong>{uploadResult.data.standard.id}</strong></span>
                                <span>Tên: <strong>{uploadResult.data.standard.name}</strong></span>
                                <span>Controls: <strong>{uploadResult.data.standard.total_controls}</strong></span>
                                <span>Max Score: <strong>{uploadResult.data.standard.max_weighted_score}</strong></span>
                                {uploadResult.data.chromadb_index?.chunks_indexed && (
                                    <span>ChromaDB: <strong>{uploadResult.data.chromadb_index.chunks_indexed} chunks indexed</strong></span>
                                )}
                            </div>
                        )}
                        {uploadResult.errors?.length > 0 && (
                            <ul className={styles.errorList}>
                                {uploadResult.errors.map((err, i) => <li key={i}>{err}</li>)}
                            </ul>
                        )}
                        {!uploadResult.success && (
                            <p className={styles.resultHint}>
                                💡 Tải <button className={styles.linkBtn} onClick={downloadSample}>mẫu JSON</button> để xem format chuẩn.
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* ── Standards List ──────────────────────────── */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>
                        <span>📚</span> Danh sách Tiêu chuẩn
                    </h2>
                    <button className={styles.btnOutline} onClick={fetchStandards} disabled={loading}>
                        🔄 Làm mới
                    </button>
                </div>

                {loading ? (
                    <div className={styles.loadingBox}>⏳ Đang tải...</div>
                ) : (
                    <>
                        {/* Built-in Standards */}
                        <div className={styles.groupTitleRow}>
                            <h3 className={styles.groupTitle}>🏛️ Tiêu chuẩn có sẵn (Built-in)</h3>
                            <button
                                className={styles.infoIconBtn}
                                onClick={() => setShowFormatGuide(true)}
                                title="Xem format schema của tiêu chuẩn built-in"
                            >ℹ️ Xem format</button>
                        </div>
                        <div className={styles.standardGrid}>
                            {standards.builtin.map(std => (
                                <div key={std.id} className={styles.standardCard}>
                                    <div className={styles.cardHeader}>
                                        <span className={styles.cardBadge}>Built-in</span>
                                        <span className={styles.cardVersion}>{std.version}</span>
                                    </div>
                                    <h4 className={styles.cardName}>{std.name}</h4>
                                    <p className={styles.cardDesc}>{std.description}</p>
                                    <div className={styles.cardStats}>
                                        <span>{std.total_controls} controls</span>
                                        <span>{std.categories} categories</span>
                                    </div>
                                    <div className={styles.cardActions}>
                                        <Link href="/form-iso" className={styles.btnSmall}>
                                            📝 Sử dụng
                                        </Link>
                                        <button className={styles.btnSmall} onClick={() => setShowFormatGuide(true)}>
                                            📖 Schema
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Custom Standards */}
                        <h3 className={styles.groupTitle}>⬆️ Tiêu chuẩn tùy chỉnh (Uploaded)</h3>
                        {standards.custom.length === 0 ? (
                            <div className={styles.emptyBox}>
                                <p>Chưa có tiêu chuẩn tùy chỉnh nào.</p>
                                <p className={styles.emptyHint}>Upload file JSON/YAML ở trên để thêm tiêu chuẩn mới.</p>
                            </div>
                        ) : (
                            <div className={styles.standardGrid}>
                                {standards.custom.map(std => (
                                    <div key={std.id} className={`${styles.standardCard} ${styles.standardCardCustom}`}>
                                        <div className={styles.cardHeader}>
                                            <span className={`${styles.cardBadge} ${styles.cardBadgeCustom}`}>Custom</span>
                                            <span className={styles.cardVersion}>{std.version}</span>
                                        </div>
                                        <h4 className={styles.cardName}>{std.name}</h4>
                                        <p className={styles.cardDesc}>{std.description || 'Không có mô tả'}</p>
                                        <div className={styles.cardStats}>
                                            <span>{std.total_controls} controls</span>
                                            <span>{std.categories} categories</span>
                                            <span>Max: {std.max_weighted_score} điểm</span>
                                        </div>
                                        {std.weight_breakdown && Object.keys(std.weight_breakdown).length > 0 && (
                                            <div className={styles.weightBreakdown}>
                                                {Object.entries(std.weight_breakdown).map(([w, count]) => count > 0 && (
                                                    <span key={w} className={styles.weightTag} style={{ borderColor: WEIGHT_COLOR[w], color: WEIGHT_COLOR[w] }}>
                                                        {WEIGHT_LABEL[w]}: {count}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        <div className={styles.cardActions}>
                                            <button className={styles.btnSmall} onClick={() => handleViewDetail(std.id)}>
                                                👁️ Chi tiết
                                            </button>
                                            <button className={styles.btnSmall} onClick={() => handleReindex(std.id)}>
                                                🔄 Re-index
                                            </button>
                                            <button className={`${styles.btnSmall} ${styles.btnDanger}`} onClick={() => handleDelete(std.id)}>
                                                🗑️ Xóa
                                            </button>
                                        </div>
                                        <div className={styles.cardMeta}>
                                            <span>📅 {std.created_at ? new Date(std.created_at).toLocaleDateString('vi-VN') : '—'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ── Detail Panel ──────────────────────────── */}
            {selectedStandard && selectedStandard.controls && (
                <>
                    <div className={styles.panelOverlay} onClick={() => setSelectedStandard(null)} />
                    <div className={styles.detailPanel}>
                        <div className={styles.panelHeader}>
                            <div>
                                <h3 className={styles.panelTitle}>{selectedStandard.name}</h3>
                                <p className={styles.panelSubtitle}>
                                    {selectedStandard.id} · v{selectedStandard.version} · {selectedStandard.total_controls} controls
                                </p>
                            </div>
                            <button className={styles.panelClose} onClick={() => setSelectedStandard(null)}>✕</button>
                        </div>
                        <div className={styles.panelBody}>
                            {detailLoading ? (
                                <div className={styles.loadingBox}>⏳ Đang tải chi tiết...</div>
                            ) : (
                                selectedStandard.controls.map((cat, catIdx) => (
                                    <div key={catIdx} className={styles.detailCategory}>
                                        <h4 className={styles.detailCatTitle}>
                                            {cat.category}
                                            <span className={styles.detailCatCount}>{cat.controls.length} controls</span>
                                        </h4>
                                        <div className={styles.detailControlList}>
                                            {cat.controls.map(ctrl => (
                                                <div key={ctrl.id} className={styles.detailControl}>
                                                    <span className={styles.detailCtrlId}>{ctrl.id}</span>
                                                    <span className={styles.detailCtrlLabel}>{ctrl.label}</span>
                                                    <span
                                                        className={styles.detailWeightBadge}
                                                        style={{ borderColor: WEIGHT_COLOR[ctrl.weight], color: WEIGHT_COLOR[ctrl.weight] }}
                                                    >
                                                        {ctrl.weight}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className={styles.panelFooter}>
                            <Link href="/form-iso" className={styles.btnPrimary}>
                                📝 Sử dụng trong Form đánh giá
                            </Link>
                        </div>
                    </div>
                </>
            )}

            {/* ── Schema Guide (Quick Reference) ──────────── */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>
                        <span>📖</span> Hướng dẫn Format Nhanh
                    </h2>
                    <button className={styles.btnOutline} onClick={() => setShowFormatGuide(true)}>
                        📖 Xem đầy đủ (JSON / YAML / ChromaDB)
                    </button>
                </div>
                <div className={styles.schemaBox}>
                    <div className={styles.schemaSyncNote}>
                        <span className={styles.schemaSyncBadge}>✅ Đồng bộ</span>
                        Hai tiêu chuẩn có sẵn (<strong>ISO 27001</strong> và <strong>TCVN 11930</strong>) dùng
                        <strong> cùng schema JSON</strong> với custom upload. Chỉ khác ở <code>id</code> và
                        cấu trúc tên category/control ID.
                    </div>
                    <pre className={styles.schemaCode}>{`{
  "id": "my_standard_id",          // BẮT BUỘC · a-z 0-9 _ - · ISO dùng "iso27001"
  "name": "Tên tiêu chuẩn",        // BẮT BUỘC · Hiển thị trong dropdown
  "version": "1.0",                // Tùy chọn
  "description": "Mô tả ngắn",    // Tùy chọn
  "controls": [                    // BẮT BUỘC · Mảng categories
    {
      "category": "1. Tên nhóm",  // Ví dụ: "A.5 Tổ chức" (ISO) / "1. Bảo đảm ATTT Mạng" (TCVN)
      "controls": [
        {
          "id": "CTL.01",          // Duy nhất · ISO dùng "A.5.1" · TCVN dùng "NW.01"
          "label": "Tên ngắn",
          "weight": "critical"     // critical | high | medium | low
        }
      ]
    }
  ],
  "controlDescriptions": {         // TÙY CHỌN · Chi tiết hiển thị khi click ℹ
    "CTL.01": {
      "requirement": "Yêu cầu tiêu chuẩn",
      "criteria": "Tiêu chí đánh giá",
      "hint": "Hướng dẫn triển khai",
      "evidence": ["Bằng chứng 1", "Bằng chứng 2"]
    }
  }
}`}</pre>
                    <div className={styles.schemaNote}>
                        <p><strong>Trọng số điểm:</strong></p>
                        <div className={styles.weightBreakdown}>
                            <span className={styles.weightTag} style={{ borderColor: '#ef4444', color: '#ef4444' }}>critical = 4 điểm</span>
                            <span className={styles.weightTag} style={{ borderColor: '#f59e0b', color: '#f59e0b' }}>high = 3 điểm</span>
                            <span className={styles.weightTag} style={{ borderColor: '#3b82f6', color: '#3b82f6' }}>medium = 2 điểm</span>
                            <span className={styles.weightTag} style={{ borderColor: '#94a3b8', color: '#94a3b8' }}>low = 1 điểm</span>
                        </div>
                        <p className={styles.schemaHintText}>
                            File hỗ trợ <strong>JSON và YAML</strong>. Tối đa 500 controls. Sau khi upload,
                            backend tự động chuyển đổi từng control thành document chunk và index vào <strong>ChromaDB</strong>
                            để AI Auditor có thể tra cứu khi đánh giá.
                            <br />
                            <button className={styles.linkBtn} onClick={() => setShowFormatGuide(true)}>
                                👁️ Xem cách ChromaDB lưu trữ khác gì với file upload →
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
