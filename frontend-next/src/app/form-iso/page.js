'use client'

import { useState } from 'react'
import styles from './page.module.css'

const ISO_SECTIONS = [
    {
        id: 'A5',
        title: 'A.5 — Chính sách an toàn thông tin',
        items: [
            { code: 'A.5.1', name: 'Chính sách an toàn thông tin', desc: 'Xây dựng và phê duyệt chính sách tổng thể về ATTT' },
            { code: 'A.5.2', name: 'Vai trò và trách nhiệm', desc: 'Phân công vai trò, trách nhiệm về ATTT' }
        ]
    },
    {
        id: 'A6',
        title: 'A.6 — Tổ chức an toàn thông tin',
        items: [
            { code: 'A.6.1', name: 'Cấu trúc tổ chức ATTT', desc: 'Thiết lập bộ máy quản lý ATTT trong tổ chức' },
            { code: 'A.6.2', name: 'Thiết bị di động & làm việc từ xa', desc: 'Chính sách sử dụng thiết bị di động và teleworking' }
        ]
    },
    {
        id: 'A7',
        title: 'A.7 — An toàn nguồn nhân lực',
        items: [
            { code: 'A.7.1', name: 'Trước tuyển dụng', desc: 'Kiểm tra lý lịch, điều khoản hợp đồng về ATTT' },
            { code: 'A.7.2', name: 'Trong quá trình làm việc', desc: 'Đào tạo nhận thức và kỷ luật ATTT' },
            { code: 'A.7.3', name: 'Chấm dứt / thay đổi vị trí', desc: 'Thu hồi quyền truy cập khi nghỉ việc' }
        ]
    },
    {
        id: 'A8',
        title: 'A.8 — Quản lý tài sản',
        items: [
            { code: 'A.8.1', name: 'Phân loại tài sản', desc: 'Danh mục hóa tài sản thông tin' },
            { code: 'A.8.2', name: 'Phân loại thông tin', desc: 'Đánh nhãn và xử lý thông tin theo mức độ bảo mật' },
            { code: 'A.8.3', name: 'Xử lý phương tiện lưu trữ', desc: 'Quản lý và hủy bỏ phương tiện chứa dữ liệu' }
        ]
    },
    {
        id: 'A9',
        title: 'A.9 — Kiểm soát truy cập',
        items: [
            { code: 'A.9.1', name: 'Chính sách kiểm soát truy cập', desc: 'Quy định nguyên tắc cấp phát quyền truy cập' },
            { code: 'A.9.2', name: 'Quản lý truy cập người dùng', desc: 'Đăng ký, cấp quyền, xem xét và thu hồi quyền' },
            { code: 'A.9.3', name: 'Kiểm soát truy cập hệ thống', desc: 'Hạn chế truy cập vào hệ thống và ứng dụng' }
        ]
    },
    {
        id: 'A10',
        title: 'A.10 — Mã hóa',
        items: [
            { code: 'A.10.1', name: 'Kiểm soát mã hóa', desc: 'Chính sách sử dụng biện pháp mã hóa dữ liệu' },
            { code: 'A.10.2', name: 'Quản lý khóa', desc: 'Quản lý vòng đời khóa mã hóa' }
        ]
    }
]

const RATINGS = [
    { value: '', label: 'Chưa đánh giá', color: '' },
    { value: 'compliant', label: '✅ Tuân thủ', color: 'var(--accent-green)' },
    { value: 'partial', label: '⚠️ Một phần', color: 'var(--accent-amber)' },
    { value: 'non-compliant', label: '❌ Không tuân thủ', color: 'var(--accent-red)' },
    { value: 'na', label: '➖ N/A', color: 'var(--text-dim)' }
]

export default function FormISOPage() {
    const [data, setData] = useState({})
    const [notes, setNotes] = useState({})
    const [orgName, setOrgName] = useState('')
    const [assessor, setAssessor] = useState('')
    const [expandedSections, setExpandedSections] = useState({})

    const handleRating = (key, value) => setData(p => ({ ...p, [key]: value }))
    const handleNote = (key, value) => setNotes(p => ({ ...p, [key]: value }))
    const toggleSection = (id) => setExpandedSections(p => ({ ...p, [id]: !p[id] }))

    const totalItems = ISO_SECTIONS.reduce((s, sec) => s + sec.items.length, 0)
    const rated = Object.values(data).filter(v => v).length
    const compliant = Object.values(data).filter(v => v === 'compliant').length
    const partial = Object.values(data).filter(v => v === 'partial').length
    const nonCompliant = Object.values(data).filter(v => v === 'non-compliant').length
    const progress = totalItems > 0 ? Math.round((rated / totalItems) * 100) : 0

    const exportReport = () => {
        const date = new Date().toLocaleDateString('vi-VN')
        let txt = `BÁO CÁO ĐÁNH GIÁ TUÂN THỦ ISO 27001:2022 (Annex A)\n${'='.repeat(55)}\n`
        txt += `Tổ chức: ${orgName || '—'}\nNgười đánh giá: ${assessor || '—'}\nNgày: ${date}\n\n`
        txt += `KẾT QUẢ: Tuân thủ ${compliant}/${totalItems} | Một phần ${partial} | Không tuân thủ ${nonCompliant} | Tiến độ ${progress}%\n\n`

        ISO_SECTIONS.forEach(sec => {
            txt += `\n${sec.title}\n${'-'.repeat(45)}\n`
            sec.items.forEach(item => {
                const k = item.code
                const r = data[k] || 'Chưa đánh giá'
                const n = notes[k] ? ` → ${notes[k]}` : ''
                txt += `  [${item.code}] ${item.name}: ${r}${n}\n`
            })
        })

        const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' })
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = `ISO27001_Report_${date.replace(/\//g, '-')}.txt`
        a.click()
    }

    return (
        <div className="page-container">
            <div className={styles.header}>
                <h1 className={styles.title}>📋 ISO 27001:2022 — Annex A Assessment</h1>
                <p className={styles.subtitle}>Đánh giá các biện pháp kiểm soát ATTT theo Phụ lục A</p>
            </div>

            <div className={styles.topBar}>
                <div className={styles.fields}>
                    <div className={styles.field}>
                        <label>Tổ chức</label>
                        <input value={orgName} onChange={e => setOrgName(e.target.value)} placeholder="Tên tổ chức / công ty" />
                    </div>
                    <div className={styles.field}>
                        <label>Người đánh giá</label>
                        <input value={assessor} onChange={e => setAssessor(e.target.value)} placeholder="Họ tên người đánh giá" />
                    </div>
                </div>
            </div>

            <div className={styles.statsRow}>
                <div className={styles.stat}><span className={styles.statNum} style={{ color: 'var(--accent-blue)' }}>{progress}%</span><span className={styles.statLbl}>Tiến độ</span></div>
                <div className={styles.stat}><span className={styles.statNum} style={{ color: 'var(--accent-green)' }}>{compliant}</span><span className={styles.statLbl}>Tuân thủ</span></div>
                <div className={styles.stat}><span className={styles.statNum} style={{ color: 'var(--accent-amber)' }}>{partial}</span><span className={styles.statLbl}>Một phần</span></div>
                <div className={styles.stat}><span className={styles.statNum} style={{ color: 'var(--accent-red)' }}>{nonCompliant}</span><span className={styles.statLbl}>Vi phạm</span></div>
                <button className={styles.exportBtn} onClick={exportReport}>📥 Xuất báo cáo</button>
            </div>

            <div className={styles.progressBar}><div className={styles.progressFill} style={{ width: `${progress}%` }} /></div>

            {ISO_SECTIONS.map(sec => {
                const expanded = expandedSections[sec.id] !== false
                return (
                    <div key={sec.id} className={styles.section}>
                        <div className={styles.sectionHead} onClick={() => toggleSection(sec.id)}>
                            <span className={styles.sectionArrow}>{expanded ? '▾' : '▸'}</span>
                            <span>{sec.title}</span>
                            <span className={styles.sectionCount}>{sec.items.filter(i => data[i.code]).length}/{sec.items.length}</span>
                        </div>
                        {expanded && (
                            <div className={styles.items}>
                                {sec.items.map(item => (
                                    <div key={item.code} className={styles.item}>
                                        <div className={styles.itemTop}>
                                            <div>
                                                <span className={styles.itemCode}>{item.code}</span>
                                                <span className={styles.itemName}>{item.name}</span>
                                            </div>
                                            <select value={data[item.code] || ''} onChange={e => handleRating(item.code, e.target.value)} className={styles.select}>
                                                {RATINGS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                            </select>
                                        </div>
                                        <div className={styles.itemDesc}>{item.desc}</div>
                                        <input
                                            className={styles.noteInput}
                                            value={notes[item.code] || ''}
                                            onChange={e => handleNote(item.code, e.target.value)}
                                            placeholder="Ghi chú thêm..."
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}
