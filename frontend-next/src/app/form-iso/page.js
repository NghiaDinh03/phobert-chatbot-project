'use client'

import { useState } from 'react'
import styles from './page.module.css'

const ISO_SECTIONS = [
    {
        id: 'context',
        title: '4. Bối cảnh tổ chức',
        items: [
            'Xác định các vấn đề bên trong và bên ngoài',
            'Xác định nhu cầu và kỳ vọng của các bên liên quan',
            'Xác định phạm vi ISMS',
            'Hệ thống quản lý an toàn thông tin'
        ]
    },
    {
        id: 'leadership',
        title: '5. Lãnh đạo',
        items: [
            'Cam kết của lãnh đạo',
            'Chính sách an toàn thông tin',
            'Vai trò, trách nhiệm và quyền hạn trong tổ chức'
        ]
    },
    {
        id: 'planning',
        title: '6. Hoạch định',
        items: [
            'Hành động xử lý rủi ro và cơ hội',
            'Mục tiêu ATTT và kế hoạch đạt được',
            'Hoạch định thay đổi'
        ]
    },
    {
        id: 'support',
        title: '7. Hỗ trợ',
        items: [
            'Tài nguyên',
            'Năng lực',
            'Nhận thức',
            'Trao đổi thông tin',
            'Thông tin dạng văn bản'
        ]
    },
    {
        id: 'operation',
        title: '8. Điều hành',
        items: [
            'Hoạch định và kiểm soát điều hành',
            'Đánh giá rủi ro ATTT',
            'Xử lý rủi ro ATTT'
        ]
    },
    {
        id: 'evaluation',
        title: '9. Đánh giá hiệu quả',
        items: [
            'Giám sát, đo lường, phân tích và đánh giá',
            'Đánh giá nội bộ',
            'Xem xét của lãnh đạo'
        ]
    },
    {
        id: 'improvement',
        title: '10. Cải tiến',
        items: [
            'Sự không phù hợp và hành động khắc phục',
            'Cải tiến liên tục'
        ]
    }
]

const RATING_OPTIONS = [
    { value: '', label: 'Chọn đánh giá' },
    { value: 'compliant', label: '✅ Tuân thủ' },
    { value: 'partial', label: '⚠️ Tuân thủ một phần' },
    { value: 'non-compliant', label: '❌ Không tuân thủ' },
    { value: 'na', label: '➖ Không áp dụng' }
]

export default function FormISOPage() {
    const [assessments, setAssessments] = useState({})
    const [notes, setNotes] = useState({})
    const [orgName, setOrgName] = useState('')
    const [assessor, setAssessor] = useState('')

    const handleRating = (sectionId, itemIdx, value) => {
        setAssessments(prev => ({
            ...prev,
            [`${sectionId}_${itemIdx}`]: value
        }))
    }

    const handleNote = (sectionId, itemIdx, value) => {
        setNotes(prev => ({
            ...prev,
            [`${sectionId}_${itemIdx}`]: value
        }))
    }

    const getStats = () => {
        const values = Object.values(assessments).filter(v => v)
        const total = values.length
        const compliant = values.filter(v => v === 'compliant').length
        const partial = values.filter(v => v === 'partial').length
        const nonCompliant = values.filter(v => v === 'non-compliant').length
        const na = values.filter(v => v === 'na').length
        const totalItems = ISO_SECTIONS.reduce((sum, s) => sum + s.items.length, 0)
        const progress = Math.round((total / totalItems) * 100)

        return { total, compliant, partial, nonCompliant, na, totalItems, progress }
    }

    const stats = getStats()

    const exportReport = () => {
        const date = new Date().toLocaleDateString('vi-VN')
        let report = `BÁO CÁO ĐÁNH GIÁ TUÂN THỦ ISO 27001:2022\n`
        report += `${'='.repeat(50)}\n`
        report += `Tổ chức: ${orgName || 'Chưa điền'}\n`
        report += `Người đánh giá: ${assessor || 'Chưa điền'}\n`
        report += `Ngày: ${date}\n\n`
        report += `TỔNG KẾT:\n`
        report += `- Tuân thủ: ${stats.compliant}/${stats.totalItems}\n`
        report += `- Tuân thủ một phần: ${stats.partial}/${stats.totalItems}\n`
        report += `- Không tuân thủ: ${stats.nonCompliant}/${stats.totalItems}\n`
        report += `- Tiến độ: ${stats.progress}%\n\n`

        ISO_SECTIONS.forEach(section => {
            report += `\n${section.title}\n${'-'.repeat(40)}\n`
            section.items.forEach((item, idx) => {
                const key = `${section.id}_${idx}`
                const rating = assessments[key] || 'Chưa đánh giá'
                const note = notes[key] || ''
                report += `  ${item}: ${rating}${note ? ` (Ghi chú: ${note})` : ''}\n`
            })
        })

        const blob = new Blob([report], { type: 'text/plain;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `ISO27001_Assessment_${date.replace(/\//g, '-')}.txt`
        a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <div className="page-container">
            <div className={styles.header}>
                <h1 className={styles.title}>📋 ISO 27001:2022 Assessment</h1>
                <p className={styles.subtitle}>Form đánh giá tuân thủ tiêu chuẩn bảo mật thông tin</p>
            </div>

            <div className={styles.topBar}>
                <div className={styles.formRow}>
                    <div className={styles.field}>
                        <label className={styles.label}>Tên tổ chức</label>
                        <input className={styles.textInput} value={orgName} onChange={e => setOrgName(e.target.value)} placeholder="VD: Công ty ABC" />
                    </div>
                    <div className={styles.field}>
                        <label className={styles.label}>Người đánh giá</label>
                        <input className={styles.textInput} value={assessor} onChange={e => setAssessor(e.target.value)} placeholder="VD: Nguyễn Văn A" />
                    </div>
                </div>
            </div>

            <div className={styles.statsBar}>
                <div className={styles.statItem}>
                    <span className={styles.statValue} style={{ color: 'var(--accent-blue)' }}>{stats.progress}%</span>
                    <span className={styles.statLabel}>Tiến độ</span>
                </div>
                <div className={styles.statItem}>
                    <span className={styles.statValue} style={{ color: 'var(--accent-green)' }}>{stats.compliant}</span>
                    <span className={styles.statLabel}>Tuân thủ</span>
                </div>
                <div className={styles.statItem}>
                    <span className={styles.statValue} style={{ color: 'var(--accent-amber)' }}>{stats.partial}</span>
                    <span className={styles.statLabel}>Một phần</span>
                </div>
                <div className={styles.statItem}>
                    <span className={styles.statValue} style={{ color: 'var(--accent-red)' }}>{stats.nonCompliant}</span>
                    <span className={styles.statLabel}>Không tuân thủ</span>
                </div>
                <button className="btn btn-primary" onClick={exportReport}>📥 Xuất báo cáo</button>
            </div>

            <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${stats.progress}%` }}></div>
            </div>

            {ISO_SECTIONS.map(section => (
                <div key={section.id} className={styles.section}>
                    <h3 className={styles.sectionTitle}>{section.title}</h3>
                    <div className={styles.itemList}>
                        {section.items.map((item, idx) => {
                            const key = `${section.id}_${idx}`
                            return (
                                <div key={key} className={styles.item}>
                                    <div className={styles.itemContent}>
                                        <p className={styles.itemText}>{item}</p>
                                        <div className={styles.itemControls}>
                                            <select
                                                className={styles.select}
                                                value={assessments[key] || ''}
                                                onChange={e => handleRating(section.id, idx, e.target.value)}
                                            >
                                                {RATING_OPTIONS.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                            <input
                                                className={styles.noteInput}
                                                placeholder="Ghi chú..."
                                                value={notes[key] || ''}
                                                onChange={e => handleNote(section.id, idx, e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            ))}
        </div>
    )
}
