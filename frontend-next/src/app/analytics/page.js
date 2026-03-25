'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import SystemStats from '@/components/SystemStats'
import Link from 'next/link'
import styles from './page.module.css'

// Minimal markdown-to-HTML for the PDF export window (no external deps)
function mdToHtml(md) {
    if (!md) return ''
    return md
        .replace(/^######\s+(.+)$/gm, '<h6>$1</h6>')
        .replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>')
        .replace(/^####\s+(.+)$/gm, '<h4>$1</h4>')
        .replace(/^###\s+(.+)$/gm, '<h3>$1</h3>')
        .replace(/^##\s+(.+)$/gm, '<h2>$1</h2>')
        .replace(/^#\s+(.+)$/gm, '<h1>$1</h1>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/^[-*]\s+(.+)$/gm, '<li>$1</li>')
        .replace(/^(\d+)\.\s+(.+)$/gm, '<li>$2</li>')
        .replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>')
        .replace(/^---+$/gm, '<hr>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/(<li>[\s\S]*?<\/li>)+/g, s => `<ul>${s}</ul>`)
        .replace(/\n\n+/g, '</p><p>')
        .replace(/^(?!<[hbcuop]|<\/[hbcuop])(.*\S.*)$/gm, '$1<br>')
}

// Mini SVG gauge for the analytics modal
function SvgGauge({ percent, size = 96, color = 'var(--accent-blue)' }) {
    const r = (size - 12) / 2
    const circ = 2 * Math.PI * r
    const dash = (Math.min(Math.max(percent, 0), 100) / 100) * circ
    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth="6" />
            <circle
                cx={size / 2} cy={size / 2} r={r}
                fill="none" stroke={color} strokeWidth="6"
                strokeDasharray={`${dash} ${circ}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 0.6s ease' }}
            />
        </svg>
    )
}

export default function AnalyticsPage() {
    const [activeMainTab, setActiveMainTab] = useState('dashboard') // 'dashboard' | 'standards'
    const [services, setServices] = useState(null)
    const [assessments, setAssessments] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedAssessment, setSelectedAssessment] = useState(null)
    const [modalLoading, setModalLoading] = useState(false)
    const [deleteWarning, setDeleteWarning] = useState(null)
    const [dontAskAgain, setDontAskAgain] = useState(false)
    const [chromaStats, setChromaStats] = useState(null)
    const [reindexing, setReindexing] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState(null)
    const [searching, setSearching] = useState(false)
    const [showFiles, setShowFiles] = useState(false)
    const [cacheStats, setCacheStats] = useState(null)
    // Standards state
    const [standards, setStandards] = useState({ builtin: [], custom: [] })
    const [stdLoading, setStdLoading] = useState(false)
    const [stdUploading, setStdUploading] = useState(false)
    const [stdUploadResult, setStdUploadResult] = useState(null)
    const [stdDragOver, setStdDragOver] = useState(false)
    const [selectedStandard, setSelectedStandard] = useState(null)
    const [stdDetailLoading, setStdDetailLoading] = useState(false)
    const [showSchemaGuide, setShowSchemaGuide] = useState(false)
    const router = useRouter()

    const fetchStandards = useCallback(async () => {
        try {
            setStdLoading(true)
            const res = await fetch('/api/standards')
            if (res.ok) {
                const data = await res.json()
                setStandards({ builtin: data.builtin || [], custom: data.custom || [] })
            }
        } catch (e) { console.error('Failed to fetch standards:', e) }
        finally { setStdLoading(false) }
    }, [])

    const handleStdUpload = async (file) => {
        if (!file) return
        setStdUploading(true)
        setStdUploadResult(null)
        const formData = new FormData()
        formData.append('file', file)
        try {
            const res = await fetch('/api/standards/upload', { method: 'POST', body: formData })
            const data = await res.json()
            if (res.ok && data.status === 'success') {
                setStdUploadResult({ success: true, data })
                fetchStandards()
            } else {
                setStdUploadResult({ success: false, errors: data.errors || [data.detail || 'Upload failed'] })
            }
        } catch (e) { setStdUploadResult({ success: false, errors: [`Network error: ${e.message}`] }) }
        finally { setStdUploading(false) }
    }

    const handleStdDelete = async (standardId) => {
        if (!confirm(`Xác nhận xóa tiêu chuẩn "${standardId}"?`)) return
        try {
            const res = await fetch(`/api/standards/${standardId}`, { method: 'DELETE' })
            if (res.ok) { fetchStandards(); if (selectedStandard?.id === standardId) setSelectedStandard(null) }
        } catch (e) { console.error('Delete failed:', e) }
    }

    const handleStdReindex = async (standardId) => {
        try {
            const res = await fetch(`/api/standards/${standardId}/index`, { method: 'POST' })
            const data = await res.json()
            alert(data.status === 'ok' ? `✅ Indexed ${data.chunks_indexed} chunks` : `❌ ${data.message || 'Failed'}`)
        } catch (e) { alert(`❌ ${e.message}`) }
    }

    const handleStdDetail = async (standardId) => {
        setStdDetailLoading(true)
        try {
            const res = await fetch(`/api/standards/${standardId}`)
            if (res.ok) { const data = await res.json(); setSelectedStandard(data) }
        } catch (e) { console.error(e) }
        finally { setStdDetailLoading(false) }
    }

    const downloadSample = async () => {
        try {
            const res = await fetch('/api/standards/sample')
            const data = await res.json()
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a'); a.href = url; a.download = 'sample_standard.json'; a.click()
            URL.revokeObjectURL(url)
        } catch (e) { console.error(e) }
    }

    // Load standards when tab is activated
    useEffect(() => {
        if (activeMainTab === 'standards' && standards.builtin.length === 0) {
            fetchStandards()
        }
    }, [activeMainTab, fetchStandards, standards.builtin.length])

    const openDetail = async (id) => {
        setModalLoading(true)
        setSelectedAssessment({ id, loading: true })
        try {
            const res = await fetch(`/api/iso27001/assessments/${id}`)
            if (res.ok) {
                const data = await res.json()
                setSelectedAssessment(data)
            } else {
                setSelectedAssessment({ id, error: 'Không tìm thấy dữ liệu' })
            }
        } catch {
            setSelectedAssessment({ id, error: 'Lỗi tải chi tiết' })
        } finally {
            setModalLoading(false)
        }
    }

    const handleReuse = () => {
        if (selectedAssessment && selectedAssessment.system_info) {
            localStorage.setItem('reuse_iso_form', JSON.stringify(selectedAssessment.system_info))
            router.push('/form-iso')
        }
    }

    const checkDeleteWarning = (id, e) => {
        e.stopPropagation()
        const suppressUntil = localStorage.getItem('skip_delete_warning_iso')
        if (suppressUntil && Date.now() < parseInt(suppressUntil)) {
            executeDelete(id)
        } else {
            setDeleteWarning(id)
        }
    }

    const executeDelete = async (id) => {
        try {
            const res = await fetch(`/api/iso27001/assessments/${id}`, { method: 'DELETE' })
            if (res.ok) {
                setAssessments(prev => prev.filter(a => a.id !== id))
                if (selectedAssessment?.id === id) setSelectedAssessment(null)
            }
        } catch (e) {
            console.error('Lỗi khi xóa:', e)
        } finally {
            setDeleteWarning(null)
        }
    }

    const confirmDelete = () => {
        if (dontAskAgain) {
            // Suppress warnings for 24 hours
            const twentyFourHours = 24 * 60 * 60 * 1000
            localStorage.setItem('skip_delete_warning_iso', Date.now() + twentyFourHours)
        }
        executeDelete(deleteWarning)
    }

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch('/api/health')
                const backendReady = res.ok

                let localaiReady = false
                let models = []
                try {
                    const sysRes = await fetch('/api/system/stats')
                    if (sysRes.ok) localaiReady = true
                } catch { }

                try {
                    const assessRes = await fetch('/api/iso27001/assessments')
                    if (assessRes.ok) {
                        setAssessments(await assessRes.json())
                    }
                } catch { }

                try {
                    const chromaRes = await fetch('/api/iso27001/chromadb/stats')
                    if (chromaRes.ok) {
                        setChromaStats(await chromaRes.json())
                    }
                } catch { }

                try {
                    const cacheRes = await fetch('/api/system/cache-stats')
                    if (cacheRes.ok) {
                        setCacheStats(await cacheRes.json())
                    }
                } catch { }

                setServices({
                    backend: { status: backendReady ? 'Running' : 'Offline', ready: backendReady },
                    localai: { status: localaiReady ? 'Ready' : 'Offline', ready: localaiReady },
                    models
                })
            } catch {
                setServices({
                    backend: { status: 'Offline', ready: false },
                    localai: { status: 'Offline', ready: false },
                    models: []
                })
            } finally {
                setLoading(false)
            }
        }
        fetchData()
        const interval = setInterval(fetchData, 15000)
        return () => clearInterval(interval)
    }, [])

    const WEIGHT_COLOR_STD = { critical: '#ef4444', high: '#f59e0b', medium: '#3b82f6', low: '#94a3b8' }
    const WEIGHT_LABEL_STD = { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' }

    return (
        <div className="page-container">
            <div className={styles.header}>
                <h1 className={styles.title}>📊 Analytics & Quản lý</h1>
                <p className={styles.subtitle}>Giám sát hệ thống, lịch sử đánh giá và quản lý tiêu chuẩn đánh giá</p>
            </div>

            {/* ── Main Tab Nav ───────────────────────── */}
            <div className={styles.mainTabNav}>
                <button
                    className={`${styles.mainTab} ${activeMainTab === 'dashboard' ? styles.mainTabActive : ''}`}
                    onClick={() => setActiveMainTab('dashboard')}
                >
                    📊 Dashboard
                </button>
                <button
                    className={`${styles.mainTab} ${activeMainTab === 'standards' ? styles.mainTabActive : ''}`}
                    onClick={() => setActiveMainTab('standards')}
                >
                    📋 Tiêu chuẩn
                </button>
                <span className={styles.mainTabSpacer} />
                <Link href="/form-iso" className={styles.mainTabLink}>← Đánh giá</Link>
            </div>

            {/* ══════════════════════════════════════
                TAB: STANDARDS MANAGEMENT
            ══════════════════════════════════════ */}
            {activeMainTab === 'standards' && (
                <div>
                    {/* Upload section */}
                    <div className={styles.stdSection}>
                        <div className={styles.stdSectionHeader}>
                            <h2 className={styles.stdSectionTitle}>⬆️ Upload Tiêu chuẩn Mới</h2>
                            <div className={styles.stdHeaderActions}>
                                <button className={styles.stdBtnOutline} onClick={downloadSample}>📥 Tải mẫu JSON</button>
                                <button
                                    className={styles.stdBtnOutline}
                                    onClick={() => setShowSchemaGuide(!showSchemaGuide)}
                                >
                                    {showSchemaGuide ? '✕ Đóng hướng dẫn' : '❓ Hướng dẫn format'}
                                </button>
                            </div>
                        </div>

                        {showSchemaGuide && (
                            <div className={styles.stdSchemaBox}>
                                <pre className={styles.stdSchemaCode}>{`{
  "id": "my_standard_id",       // ID slug (a-z, 0-9, _, -)
  "name": "Tên tiêu chuẩn",     // Tên hiển thị
  "version": "1.0",
  "description": "Mô tả ngắn",
  "controls": [
    {
      "category": "1. Tên nhóm",
      "controls": [
        {
          "id": "CTL.01",            // ID control (unique)
          "label": "Tên control",    // Mô tả ngắn
          "weight": "critical",      // critical|high|medium|low
          "description": {           // Tùy chọn
            "requirement": "...",
            "criteria": "...",
            "hint": "...",
            "evidence": ["Bằng chứng 1"]
          }
        }
      ]
    }
  ]
}`}</pre>
                                <div className={styles.stdWeightNote}>
                                    <strong>Trọng số:</strong>
                                    <span style={{ color: '#ef4444', border: '1px solid #ef4444', borderRadius: 12, padding: '1px 8px', fontSize: 11, fontWeight: 700 }}>critical=4</span>
                                    <span style={{ color: '#f59e0b', border: '1px solid #f59e0b', borderRadius: 12, padding: '1px 8px', fontSize: 11, fontWeight: 700 }}>high=3</span>
                                    <span style={{ color: '#3b82f6', border: '1px solid #3b82f6', borderRadius: 12, padding: '1px 8px', fontSize: 11, fontWeight: 700 }}>medium=2</span>
                                    <span style={{ color: '#94a3b8', border: '1px solid #94a3b8', borderRadius: 12, padding: '1px 8px', fontSize: 11, fontWeight: 700 }}>low=1</span>
                                </div>
                            </div>
                        )}

                        <div
                            className={`${styles.stdDropZone} ${stdDragOver ? styles.stdDropZoneActive : ''} ${stdUploading ? styles.stdDropZoneUploading : ''}`}
                            onDragOver={(e) => { e.preventDefault(); setStdDragOver(true) }}
                            onDragLeave={() => setStdDragOver(false)}
                            onDrop={(e) => { e.preventDefault(); setStdDragOver(false); const f = e.dataTransfer?.files?.[0]; if (f) handleStdUpload(f) }}
                        >
                            {stdUploading ? (
                                <div className={styles.stdDropContent}>
                                    <span className={styles.stdDropSpinner} />
                                    <p>Đang upload và xử lý...</p>
                                </div>
                            ) : (
                                <div className={styles.stdDropContent}>
                                    <span className={styles.stdDropIcon}>📂</span>
                                    <p className={styles.stdDropText}>Kéo thả file JSON / YAML vào đây</p>
                                    <label className={styles.stdBtnPrimary}>
                                        Chọn file
                                        <input type="file" accept=".json,.yaml,.yml" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleStdUpload(f) }} hidden />
                                    </label>
                                    <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>.json, .yaml, .yml · Tối đa 2MB</p>
                                </div>
                            )}
                        </div>

                        {stdUploadResult && (
                            <div className={`${styles.stdResultBox} ${stdUploadResult.success ? styles.stdResultSuccess : styles.stdResultError}`}>
                                <div className={styles.stdResultHeader}>{stdUploadResult.success ? '✅ Upload thành công!' : '❌ Upload thất bại'}</div>
                                {stdUploadResult.success && stdUploadResult.data?.standard && (
                                    <div className={styles.stdResultMeta}>
                                        <span>ID: <strong>{stdUploadResult.data.standard.id}</strong></span>
                                        <span>{stdUploadResult.data.standard.total_controls} controls</span>
                                        {stdUploadResult.data.chromadb_index?.chunks_indexed && <span>ChromaDB: {stdUploadResult.data.chromadb_index.chunks_indexed} chunks</span>}
                                    </div>
                                )}
                                {stdUploadResult.errors?.length > 0 && (
                                    <ul style={{ margin: '6px 0 0', paddingLeft: 18, fontSize: 12, color: 'var(--accent-red)' }}>
                                        {stdUploadResult.errors.map((e, i) => <li key={i}>{e}</li>)}
                                    </ul>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Standards list */}
                    <div className={styles.stdSection}>
                        <div className={styles.stdSectionHeader}>
                            <h2 className={styles.stdSectionTitle}>📚 Danh sách Tiêu chuẩn</h2>
                            <button className={styles.stdBtnOutline} onClick={fetchStandards} disabled={stdLoading}>🔄 Làm mới</button>
                        </div>

                        {stdLoading ? (
                            <div className={styles.loading}>⏳ Đang tải...</div>
                        ) : (
                            <>
                                <p className={styles.stdGroupLabel}>🏛️ Tiêu chuẩn có sẵn (Built-in)</p>
                                <div className={styles.stdGrid}>
                                    {standards.builtin.map(std => (
                                        <div key={std.id} className={styles.stdCard}>
                                            <div className={styles.stdCardHead}>
                                                <span className={styles.stdCardBadge}>Built-in</span>
                                                <span className={styles.stdCardVersion}>{std.version}</span>
                                            </div>
                                            <h4 className={styles.stdCardName}>{std.name}</h4>
                                            <p className={styles.stdCardDesc}>{std.description}</p>
                                            <div className={styles.stdCardStats}>
                                                <span>{std.total_controls} controls</span>
                                                <span>{std.categories} categories</span>
                                            </div>
                                            <div className={styles.stdCardActions}>
                                                <Link href="/form-iso" className={styles.stdBtnSmall}>📝 Sử dụng</Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <p className={styles.stdGroupLabel} style={{ marginTop: '1.25rem' }}>⬆️ Tiêu chuẩn tùy chỉnh (Uploaded)</p>
                                {standards.custom.length === 0 ? (
                                    <div className={styles.stdEmpty}>
                                        <p>Chưa có tiêu chuẩn tùy chỉnh.</p>
                                        <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>Upload file JSON/YAML ở trên để thêm.</p>
                                    </div>
                                ) : (
                                    <div className={styles.stdGrid}>
                                        {standards.custom.map(std => (
                                            <div key={std.id} className={`${styles.stdCard} ${styles.stdCardCustom}`}>
                                                <div className={styles.stdCardHead}>
                                                    <span className={`${styles.stdCardBadge} ${styles.stdCardBadgeCustom}`}>Custom</span>
                                                    <span className={styles.stdCardVersion}>{std.version}</span>
                                                </div>
                                                <h4 className={styles.stdCardName}>{std.name}</h4>
                                                <p className={styles.stdCardDesc}>{std.description || 'Không có mô tả'}</p>
                                                <div className={styles.stdCardStats}>
                                                    <span>{std.total_controls} controls</span>
                                                    <span>Max: {std.max_weighted_score}đ</span>
                                                </div>
                                                {std.weight_breakdown && (
                                                    <div className={styles.stdWeightTags}>
                                                        {Object.entries(std.weight_breakdown).map(([w, cnt]) => cnt > 0 && (
                                                            <span key={w} className={styles.stdWeightTag} style={{ borderColor: WEIGHT_COLOR_STD[w], color: WEIGHT_COLOR_STD[w] }}>
                                                                {WEIGHT_LABEL_STD[w]}: {cnt}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                                <div className={styles.stdCardActions}>
                                                    <button className={styles.stdBtnSmall} onClick={() => handleStdDetail(std.id)}>👁️ Chi tiết</button>
                                                    <button className={styles.stdBtnSmall} onClick={() => handleStdReindex(std.id)}>🔄 Re-index</button>
                                                    <button className={`${styles.stdBtnSmall} ${styles.stdBtnDanger}`} onClick={() => handleStdDelete(std.id)}>🗑️</button>
                                                </div>
                                                <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 6 }}>
                                                    📅 {std.created_at ? new Date(std.created_at).toLocaleDateString('vi-VN') : '—'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Standard detail side panel */}
                    {selectedStandard && selectedStandard.controls && (
                        <>
                            <div className={styles.modalOverlay} onClick={() => setSelectedStandard(null)} />
                            <div className={styles.stdDetailPanel}>
                                <div className={styles.modalHeader}>
                                    <div>
                                        <h3 className={styles.modalTitle}>{selectedStandard.name}</h3>
                                        <p className={styles.modalSubtitle}>{selectedStandard.id} · v{selectedStandard.version} · {selectedStandard.total_controls} controls</p>
                                    </div>
                                    <button className={styles.closeBtn} onClick={() => setSelectedStandard(null)}>✕</button>
                                </div>
                                <div className={styles.modalBody} style={{ overflowY: 'auto', flex: 1 }}>
                                    {stdDetailLoading ? <div className={styles.loading}>⏳</div> : (
                                        selectedStandard.controls.map((cat, ci) => (
                                            <div key={ci} style={{ marginBottom: '1rem' }}>
                                                <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-blue)', borderBottom: '1px solid var(--border)', paddingBottom: 4, marginBottom: 6, display: 'flex', gap: 8, alignItems: 'center' }}>
                                                    {cat.category}
                                                    <span style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 400 }}>{cat.controls.length} controls</span>
                                                </h4>
                                                {cat.controls.map(ctrl => (
                                                    <div key={ctrl.id} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '4px 6px', borderRadius: 6, background: 'var(--bg-subtle)', marginBottom: 3, fontSize: 12 }}>
                                                        <span style={{ fontWeight: 700, color: 'var(--text-primary)', minWidth: 52 }}>{ctrl.id}</span>
                                                        <span style={{ flex: 1, color: 'var(--text-secondary)' }}>{ctrl.label}</span>
                                                        <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 12, border: `1px solid ${WEIGHT_COLOR_STD[ctrl.weight]}`, color: WEIGHT_COLOR_STD[ctrl.weight] }}>{ctrl.weight}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ))
                                    )}
                                </div>
                                <div className={styles.modalFooter}>
                                    <Link href="/form-iso" className={styles.btnPrimary}>📝 Sử dụng trong Form</Link>
                                    <button className={styles.btnSecondary} onClick={() => setSelectedStandard(null)}>Đóng</button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ══════════════════════════════════════
                TAB: DASHBOARD (existing content)
            ══════════════════════════════════════ */}
            {activeMainTab === 'dashboard' && (
            <div>

            <section style={{ marginBottom: '2.5rem' }}>
                <h2 className="section-title">⚡ Tài nguyên Hệ thống</h2>
                <SystemStats />
            </section>

            <section style={{ marginBottom: '2.5rem' }}>
                <h2 className="section-title">🤖 Trạng thái Dịch vụ</h2>
                {loading ? (
                    <div className={styles.loading}>Đang tải...</div>
                ) : (
                    <div className="grid-2">
                        <div className={styles.serviceCard}>
                            <div className={styles.serviceHeader}>
                                <div>
                                    <div className={styles.serviceName}>
                                        {services?.backend?.ready ? '✅' : '⏳'} FastAPI Backend
                                    </div>
                                    <div className={styles.serviceDetail}>
                                        Core API Service • Port: <strong style={{ color: 'var(--accent-blue)' }}>8000</strong> • v1.0.0
                                    </div>
                                </div>
                                <span className={`status-badge ${services?.backend?.ready ? 'status-online' : 'status-offline'}`}>
                                    {services?.backend?.status}
                                </span>
                            </div>
                        </div>

                        <div className={styles.serviceCard}>
                            <div className={styles.serviceHeader}>
                                <div>
                                    <div className={styles.serviceName}>
                                        {services?.localai?.ready ? '🔥' : '⏳'} LocalAI Engine
                                    </div>
                                    <div className={styles.serviceDetail}>
                                        Model Server • Port: <strong style={{ color: 'var(--accent-blue)' }}>8080</strong> • CPU Mode
                                    </div>
                                </div>
                                <span className={`status-badge ${services?.localai?.ready ? 'status-online' : 'status-offline'}`}>
                                    {services?.localai?.status}
                                </span>
                            </div>
                        </div>

                        <div className={styles.serviceCard}>
                            <div className={styles.serviceHeader}>
                                <div>
                                    <div className={styles.serviceName}>
                                        {services?.backend?.ready ? '🗄️' : '⏳'} ChromaDB
                                    </div>
                                    <div className={styles.serviceDetail}>
                                        Vector Database • RAG ISO 27001 • <strong style={{ color: 'var(--accent-green)' }}>cosine</strong> space
                                    </div>
                                </div>
                                <span className={`status-badge ${services?.backend?.ready ? 'status-online' : 'status-offline'}`}>
                                    {services?.backend?.status}
                                </span>
                            </div>
                        </div>

                        <div className={styles.serviceCard}>
                            <div className={styles.serviceHeader}>
                                <div>
                                    <div className={styles.serviceName}>🧠 VinAI Translate Model</div>
                                    <div className={styles.serviceDetail}>
                                        Vietnamese NLP • Parameters: <strong style={{ color: 'var(--accent-green)' }}>135M</strong>
                                    </div>
                                </div>
                                <span className="status-badge status-online">Active</span>
                            </div>
                        </div>

                        <div className={styles.serviceCard}>
                            <div className={styles.serviceHeader}>
                                <div>
                                    <div className={styles.serviceName}>⚡ Llama 3.1 8B</div>
                                    <div className={styles.serviceDetail}>
                                        LLM (General/Summary) • Quant: <strong style={{ color: 'var(--accent-amber)' }}>Q4_K_M</strong> • 4.9GB
                                    </div>
                                </div>
                                <span className={`status-badge ${services?.localai?.ready ? 'status-online' : 'status-loading'}`}>
                                    {services?.localai?.ready ? 'Ready' : 'Loading'}
                                </span>
                            </div>
                        </div>

                        <div className={styles.serviceCard}>
                            <div className={styles.serviceHeader}>
                                <div>
                                    <div className={styles.serviceName}>🛡️ SecurityLLM 7B</div>
                                    <div className={styles.serviceDetail}>
                                        LLM (ISO Assessor) • Quant: <strong style={{ color: 'var(--accent-amber)' }}>Q4_K_M</strong> • 4.4GB
                                    </div>
                                </div>
                                <span className={`status-badge ${services?.localai?.ready ? 'status-online' : 'status-loading'}`}>
                                    {services?.localai?.ready ? 'Ready' : 'Loading'}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </section>

            <section style={{ marginBottom: '2.5rem' }}>
                <h2 className="section-title">💾 Giám sát Sinh Cache (Audio & Translate)</h2>
                {cacheStats ? (
                    <div className="grid-3">
                        <div className={styles.configCard} style={{ background: 'var(--bg-secondary)' }}>
                            <div className={styles.configLabel}>Cache Translations (Text)</div>
                            <div className={styles.configValue}>{cacheStats.translations.files}</div>
                            <div className={styles.configUnit}>files • {(cacheStats.translations.size_bytes / 1024 / 1024).toFixed(2)} MB</div>
                        </div>
                        <div className={styles.configCard} style={{ background: 'var(--bg-secondary)' }}>
                            <div className={styles.configLabel}>Cache Summaries (Audio)</div>
                            <div className={styles.configValue}>{cacheStats.summaries.files}</div>
                            <div className={styles.configUnit}>files • {(cacheStats.summaries.size_bytes / 1024 / 1024).toFixed(2)} MB</div>
                        </div>
                        <div className={styles.configCard} style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid var(--accent-blue)' }}>
                            <div className={styles.configLabel} style={{ color: 'var(--accent-blue)' }}>Tổng dung lượng Storage</div>
                            <div className={styles.configValue} style={{ color: 'var(--text-primary)' }}>{(cacheStats.total_size_bytes / 1024 / 1024).toFixed(2)}</div>
                            <div className={styles.configUnit}>Megabytes (Tự dọn dẹp mỗi 2h)</div>
                        </div>
                    </div>
                ) : (
                    <div className={styles.loading}>Đang tải thống kê cache...</div>
                )}
            </section>

            <section style={{ marginBottom: '2.5rem' }}>
                <h2 className="section-title">🕒 Lịch sử Đánh giá ISO 27001</h2>
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Thời gian</th>
                                <th>Tổ chức</th>
                                <th>% Tuân thủ</th>
                                <th>Trạng thái</th>
                                <th>ID Giao dịch</th>
                                <th style={{ textAlign: 'right' }}>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assessments.length > 0 ? assessments.map(a => {
                                const pct = a.compliance_percent ?? null
                                const pctColor = pct == null ? '' :
                                    pct >= 80 ? 'var(--accent-green)' :
                                    pct >= 50 ? 'var(--accent-blue)' :
                                    pct >= 25 ? 'var(--accent-amber,#f59e0b)' :
                                    'var(--accent-red)'
                                return (
                                    <tr key={a.id} onClick={() => openDetail(a.id)} className={styles.tableRowRef}>
                                        <td>{new Date(a.created_at).toLocaleString('vi-VN')}</td>
                                        <td><strong>{a.org_name}</strong></td>
                                        <td>
                                            {pct != null ? (
                                                <span className={styles.pctBadge} style={{ color: pctColor, borderColor: pctColor }}>
                                                    {pct}%
                                                </span>
                                            ) : (
                                                <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>—</span>
                                            )}
                                        </td>
                                        <td>
                                            <span className={`status-badge ${a.status === 'completed' ? 'status-online' : a.status === 'processing' ? 'status-loading' : 'status-offline'}`}>
                                                {a.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td><code className={styles.codeId}>{a.id.split('-')[0]}</code></td>
                                        <td style={{ textAlign: 'right' }}>
                                            <button
                                                className={styles.deleteBtn}
                                                onClick={(e) => checkDeleteWarning(a.id, e)}
                                                title="Xóa đánh giá này"
                                            >
                                                🗑️
                                            </button>
                                        </td>
                                    </tr>
                                )
                            }) : (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>Chưa có yêu cầu đánh giá nào.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            <section style={{ marginBottom: '2.5rem' }}>
                <h2 className="section-title">📈 Cấu hình Hệ thống</h2>
                <div className="grid-3">
                    <div className={styles.configCard}>
                        <div className={styles.configLabel}>Context Size</div>
                        <div className={styles.configValue}>8192</div>
                        <div className={styles.configUnit}>tokens</div>
                    </div>
                    <div className={styles.configCard}>
                        <div className={styles.configLabel}>Max Tokens</div>
                        <div className={styles.configValue}>Unlimited</div>
                        <div className={styles.configUnit}>không giới hạn</div>
                    </div>
                    <div className={styles.configCard}>
                        <div className={styles.configLabel}>Threads</div>
                        <div className={styles.configValue}>8</div>
                        <div className={styles.configUnit}>CPU threads</div>
                    </div>
                </div>
            </section>

            <section>
                <h2 className="section-title">🗄️ Kho Tài liệu AI — ChromaDB</h2>
                <div className={styles.chromaPanel}>
                    <div className={styles.chromaHeader}>
                        <div className={styles.chromaHeaderLeft}>
                            <div className={styles.chromaGrid}>
                                <div className={styles.chromaStat}>
                                    <span className={styles.chromaStatIcon}>🧩</span>
                                    <div>
                                        <span className={styles.chromaStatValue}>{chromaStats?.total_chunks ?? '--'}</span>
                                        <span className={styles.chromaStatLabel}>Chunks</span>
                                    </div>
                                </div>
                                <div className={styles.chromaStat}>
                                    <span className={styles.chromaStatIcon}>📄</span>
                                    <div>
                                        <span className={styles.chromaStatValue}>{chromaStats?.total_files ?? '--'}</span>
                                        <span className={styles.chromaStatLabel}>Files</span>
                                    </div>
                                </div>
                                <div className={styles.chromaStat}>
                                    <span className={styles.chromaStatIcon}>🎯</span>
                                    <div>
                                        <span className={styles.chromaStatValue} style={{ fontSize: '1rem', textTransform: 'uppercase' }}>{chromaStats?.metric ?? '--'}</span>
                                        <span className={styles.chromaStatLabel}>Metric</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={styles.chromaHeaderRight}>
                            <div className={styles.searchBox}>
                                <input
                                    type="text"
                                    placeholder="Thử tìm kiếm tài liệu..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className={styles.searchInput}
                                    onKeyDown={async (e) => {
                                        if (e.key === 'Enter' && searchQuery.trim()) {
                                            setSearching(true)
                                            try {
                                                const res = await fetch('/api/iso27001/chromadb/search', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ query: searchQuery, top_k: 3 })
                                                })
                                                if (res.ok) setSearchResults(await res.json())
                                            } catch { } finally { setSearching(false) }
                                        }
                                    }}
                                />
                                <button
                                    className={styles.btnSearch}
                                    disabled={searching || !searchQuery.trim()}
                                    onClick={async () => {
                                        if (!searchQuery.trim()) return
                                        setSearching(true)
                                        try {
                                            const res = await fetch('/api/iso27001/chromadb/search', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ query: searchQuery, top_k: 3 })
                                            })
                                            if (res.ok) setSearchResults(await res.json())
                                        } catch { } finally { setSearching(false) }
                                    }}
                                >{searching ? '⏳' : '🔍'}</button>
                            </div>
                            {searchResults?.results?.length > 0 && (
                                <div className={styles.searchResultsPanel}>
                                    {searchResults.results.map((r, i) => (
                                        <div key={i} className={styles.searchResultItem}>
                                            <div className={styles.searchResultHeader}>
                                                <span className={styles.searchResultSource}>{r.source}</span>
                                                <span className={styles.searchResultScore}>{(r.score * 100).toFixed(0)}%</span>
                                            </div>
                                            <p className={styles.searchResultText}>{r.text?.substring(0, 200)}...</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className={styles.chromaStatusRow} style={{ marginTop: 'auto', paddingTop: '1rem' }}>
                                <span className={`${styles.chromaStatusDot} ${chromaStats?.status === 'ok' ? styles.dotOk : styles.dotErr}`} />
                                <span className={styles.chromaStatusText}>{chromaStats?.status === 'ok' ? 'Database sẵn sàng' : 'Đang kiểm tra...'}</span>
                                <button
                                    className={styles.btnReindex}
                                    disabled={reindexing}
                                    onClick={async () => {
                                        setReindexing(true)
                                        try {
                                            const res = await fetch('/api/iso27001/reindex', { method: 'POST' })
                                            if (res.ok) {
                                                const data = await res.json()
                                                alert(`Nạp lại thành công! ${data.files} files → ${data.chunks} chunks`)
                                                const r2 = await fetch('/api/iso27001/chromadb/stats')
                                                if (r2.ok) setChromaStats(await r2.json())
                                            }
                                        } catch (e) {
                                            alert('Lỗi: ' + e.message)
                                        } finally { setReindexing(false) }
                                    }}
                                >
                                    {reindexing ? '⏳ Đang nạp...' : '🔄 Nạp lại'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {chromaStats?.files?.length > 0 && (
                        <div className={styles.chromaFiles}>
                            <div className={styles.fileToggle} onClick={() => setShowFiles(!showFiles)}>
                                <span>{showFiles ? '▼' : '▶'} Danh sách tài liệu ({chromaStats.files.length} files)</span>
                                <span className={styles.fileTotalSize}>
                                    {(chromaStats.files.reduce((s, f) => s + f.size_bytes, 0) / 1024).toFixed(1)} KB
                                </span>
                            </div>
                            {showFiles && (
                                <div className={styles.fileList}>
                                    {chromaStats.files.map((f, i) => (
                                        <div key={i} className={styles.fileItem}>
                                            <span className={styles.fileName}>{f.name}</span>
                                            <span className={styles.fileSize}>{(f.size_bytes / 1024).toFixed(1)} KB</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </section>

            {selectedAssessment && (
                <div className={styles.modalOverlay} onClick={() => setSelectedAssessment(null)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <div>
                                <h3 className={styles.modalTitle}>
                                    Chi tiết Đánh giá
                                </h3>
                                <p className={styles.modalSubtitle}>
                                    ID: <code className={styles.codeId}>{selectedAssessment.id?.split('-')[0]}</code>
                                    {selectedAssessment.created_at && (
                                        <> &nbsp;·&nbsp; {new Date(selectedAssessment.created_at).toLocaleString('vi-VN')}</>
                                    )}
                                </p>
                            </div>
                            <button className={styles.closeBtn} onClick={() => setSelectedAssessment(null)}>✕</button>
                        </div>
                        <div className={styles.modalBody}>
                            {modalLoading || selectedAssessment.loading ? (
                                <div className={styles.loading}>
                                    <div className={styles.loadingSpinner} />
                                    <span>Đang tải chi tiết báo cáo...</span>
                                </div>
                            ) : selectedAssessment.error ? (
                                <div className={styles.statusError}>{selectedAssessment.error}</div>
                            ) : (
                                <>
                                    {/* ── Score Hero mini ── */}
                                    {(() => {
                                        const pct = selectedAssessment.compliance_percent ?? null
                                        const org = selectedAssessment.system_info?.organization
                                        const infra = selectedAssessment.system_info?.infrastructure
                                        const comp = selectedAssessment.system_info?.compliance
                                        const stdId = selectedAssessment.standard
                                        const stdName = stdId === 'tcvn11930' ? 'TCVN 11930:2017' : 'ISO 27001:2022'
                                        const gaugeColor = pct == null ? 'var(--accent-blue)' :
                                            pct >= 80 ? 'var(--accent-green)' :
                                            pct >= 50 ? 'var(--accent-blue)' :
                                            pct >= 25 ? 'var(--accent-amber,#f59e0b)' :
                                            'var(--accent-red)'
                                        const badgeClass = pct == null ? styles.modalBadgeNeutral :
                                            pct >= 80 ? styles.modalBadgeFull :
                                            pct >= 50 ? styles.modalBadgeMostly :
                                            pct >= 25 ? styles.modalBadgePartial :
                                            styles.modalBadgeLow
                                        const badgeLabel = pct == null ? '— Đang xử lý' :
                                            pct >= 80 ? '✅ Tuân thủ cao' :
                                            pct >= 50 ? '🟡 Tuân thủ một phần' :
                                            pct >= 25 ? '🟠 Tuân thủ thấp' :
                                            '🔴 Không tuân thủ'
                                        return (
                                            <div className={styles.modalScoreHero}>
                                                <div className={styles.modalGaugeWrap}>
                                                    {pct != null ? (
                                                        <>
                                                            <SvgGauge percent={pct} size={96} color={gaugeColor} />
                                                            <div className={styles.modalGaugeOverlay}>
                                                                <span className={styles.modalGaugePct} style={{ color: gaugeColor }}>{pct}%</span>
                                                                <span className={styles.modalGaugeLabel}>Tuân thủ</span>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className={styles.modalGaugePlaceholder}>⏳</div>
                                                    )}
                                                </div>
                                                <div className={styles.modalScoreInfo}>
                                                    <div className={styles.modalOrgName}>{org?.name || 'Tổ chức'}</div>
                                                    <div className={styles.modalStdName}>{stdName}</div>
                                                    <span className={`${styles.modalBadge} ${badgeClass}`}>{badgeLabel}</span>
                                                    <div className={styles.modalMetaRow}>
                                                        {org?.employees ? <span>{org.employees} nhân viên</span> : null}
                                                        {infra?.servers ? <span>{infra.servers} máy chủ</span> : null}
                                                        {comp?.iso_status ? <span>{comp.iso_status}</span> : null}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })()}

                                    {/* ── Action bar ── */}
                                    <div className={styles.modalActionBar}>
                                        <button className={styles.modalActionBtn} onClick={() => {
                                            const text = selectedAssessment.result?.report || ''
                                            navigator.clipboard?.writeText(text).catch(() => {})
                                        }}>📋 Sao chép</button>
                                        <button className={styles.modalActionBtn} onClick={() => {
                                            const pct = selectedAssessment.compliance_percent ?? null
                                            const orgName = selectedAssessment.system_info?.organization?.name || 'Tổ chức'
                                            const stdId = selectedAssessment.standard
                                            const stdName = stdId === 'tcvn11930' ? 'TCVN 11930:2017' : 'ISO 27001:2022'
                                            const gaugeColor = pct == null ? '#3b82f6' :
                                                pct >= 80 ? '#10b981' : pct >= 50 ? '#3b82f6' : pct >= 25 ? '#f59e0b' : '#ef4444'
                                            const reportHtml = `<!DOCTYPE html>
<html lang="vi"><head><meta charset="UTF-8">
<title>Báo cáo Đánh giá - ${orgName}</title>
<style>
  body{font-family:'Segoe UI',Arial,sans-serif;max-width:860px;margin:40px auto;padding:0 24px;color:#1e293b;line-height:1.7;font-size:14px}
  h1{font-size:20px;font-weight:800;border-bottom:2px solid #3b82f6;padding-bottom:8px}
  h2{font-size:15px;font-weight:700;color:#3b82f6;margin-top:24px;border-left:3px solid #3b82f6;padding-left:8px}
  h3{font-size:14px;font-weight:600;color:#475569;margin-top:16px}
  .hero{display:flex;align-items:center;gap:20px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px 20px;margin:16px 0}
  .pct{font-size:36px;font-weight:900;color:${gaugeColor};min-width:90px;text-align:center}
  .meta strong{display:block;font-size:16px}.meta span{color:#64748b;font-size:13px}
  table{width:100%;border-collapse:collapse;margin:8px 0}th,td{padding:8px 12px;text-align:left;border-bottom:1px solid #e2e8f0;font-size:13px}th{background:#f1f5f9;font-weight:600}
  ul{padding-left:20px}li{margin-bottom:4px}strong{color:#1e293b}
  blockquote{border-left:3px solid #3b82f6;margin:8px 0;padding:6px 12px;background:#eff6ff;border-radius:0 8px 8px 0;color:#475569}
  hr{border:none;border-top:1px solid #e2e8f0;margin:16px 0}code{background:#f1f5f9;border:1px solid #e2e8f0;border-radius:4px;padding:1px 6px;font-size:12px}
  @media print{.no-print{display:none!important}}
</style></head><body>
<div class="no-print" style="background:#eff6ff;border:1px solid #3b82f6;border-radius:8px;padding:12px 16px;margin-bottom:20px;font-size:13px;color:#1d4ed8;">
  💡 <strong>Để lưu PDF:</strong> nhấn <kbd>Ctrl+P</kbd> → chọn <em>"Lưu thành PDF"</em>.
  <button onclick="window.print()" style="float:right;padding:6px 14px;background:#3b82f6;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600;">🖨️ In / Lưu PDF</button>
</div>
<div class="hero">
  <div class="pct">${pct != null ? pct + '%' : '—'}</div>
  <div class="meta"><strong>${orgName}</strong><span>${stdName}</span></div>
</div>
<p>${mdToHtml(selectedAssessment.result?.report || 'Chưa có báo cáo.')}</p>
</body></html>`
                                            const w = window.open('', '_blank')
                                            if (w) { w.document.write(reportHtml); w.document.close() }
                                        }}>📄 Xem / Xuất PDF</button>
                                        <button className={styles.modalActionBtnSecondary} onClick={handleReuse}>♻️ Tái sử dụng</button>
                                    </div>

                                    {/* ── Report ── */}
                                    {selectedAssessment.status === 'failed' && (
                                        <div className={styles.failedNote}>
                                            <strong>💡 Lưu ý:</strong> Báo cáo này bị lỗi từ phiên cũ. Hãy dùng &quot;Tái sử dụng&quot; để chạy lại trên hệ thống mới.
                                        </div>
                                    )}
                                    <div className={styles.md}>
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {selectedAssessment.result?.report || '*Chưa có báo cáo chi tiết cho đánh giá này.*'}
                                        </ReactMarkdown>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className={styles.modalFooter}>
                            <button className={styles.btnSecondary} onClick={() => setSelectedAssessment(null)}>Đóng</button>
                            <button className={styles.btnPrimary} onClick={handleReuse}>♻️ Tái sử dụng Form này</button>
                        </div>
                    </div>
                </div>
            )}

            {deleteWarning && (
                <div className={styles.modalOverlay} onClick={() => setDeleteWarning(null)}>
                    <div className={`${styles.modalContent} ${styles.modalSmall}`} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3 className={styles.modalTitle} style={{ color: 'var(--accent-red)' }}>⚠️ Xác nhận Xóa</h3>
                            <button className={styles.closeBtn} onClick={() => setDeleteWarning(null)}>✕</button>
                        </div>
                        <div className={styles.modalBody} style={{ paddingBottom: '0.5rem' }}>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                                Bạn có chắc chắn muốn xóa vĩnh viễn báo cáo đánh giá này không? Hành động này không thể hoàn tác.
                            </p>
                            <label className={styles.checkboxLabel}>
                                <input
                                    type="checkbox"
                                    checked={dontAskAgain}
                                    onChange={(e) => setDontAskAgain(e.target.checked)}
                                />
                                <span>Không hiển thị lại thông báo này trong 24 giờ tới</span>
                            </label>
                        </div>
                        <div className={styles.modalFooter}>
                            <button className={styles.btnSecondary} onClick={() => setDeleteWarning(null)}>Hủy bỏ</button>
                            <button className={styles.btnDanger} onClick={confirmDelete}>Xóa vĩnh viễn</button>
                        </div>
                    </div>
                </div>
            )}
            </div>
            )} {/* end activeMainTab === 'dashboard' */}
        </div>
    )
}
