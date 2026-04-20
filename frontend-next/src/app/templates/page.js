'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslation } from '@/components/LanguageProvider'
import styles from './page.module.css'
import { useAssessmentTemplates } from '../../data'
import { ASSESSMENT_STANDARDS } from '../../data/standards'
import { Filter, Zap, ExternalLink, Info } from 'lucide-react'

export default function TemplatesMonitorPage() {
    const { t } = useTranslation()
    const router = useRouter()
    const [filter, setFilter] = useState('all')
    const ASSESSMENT_TEMPLATES = useAssessmentTemplates()

    const filteredTemplates = useMemo(() => {
        if (filter === 'all') return ASSESSMENT_TEMPLATES
        return ASSESSMENT_TEMPLATES.filter(t => t.standard === filter)
    }, [filter, ASSESSMENT_TEMPLATES])

    const getControlCount = (template) => {
        const std = ASSESSMENT_STANDARDS.find(s => s.id === template.standard)
        const total = std ? std.controls.reduce((acc, cat) => acc + cat.controls.length, 0) : 0
        const implemented = template.data.compliance?.implemented_controls?.length || 0
        return { implemented, total }
    }

    const selectTemplate = (tpl) => {
        localStorage.setItem('reuse_iso_form', JSON.stringify(tpl.data))
        router.push('/form-iso')
    }

    return (
        <div className="page-container">
            <div className={styles.header}>
                <div className={styles.headerMeta}>
                    <Link href="/form-iso" className={styles.backBtn}>{t('templates.backToAssessment')}</Link>
                </div>
                <h1 className={styles.title}>{t('templates.pageTitle')}</h1>
                <p className={styles.subtitle}>
                    {t('templates.pageSubtitle')}
                </p>
            </div>

            <div className={styles.filterBar}>
                <Filter size={14} style={{ color: 'var(--text-dim)', alignSelf: 'center' }} />
                <button
                    className={`${styles.filterBtn} ${filter === 'all' ? styles.filterActive : ''}`}
                    onClick={() => setFilter('all')}
                >
                    All ({ASSESSMENT_TEMPLATES.length})
                </button>
                {ASSESSMENT_STANDARDS.map(std => {
                    const count = ASSESSMENT_TEMPLATES.filter(t => t.standard === std.id).length
                    if (count === 0) return null
                    return (
                        <button
                            key={std.id}
                            className={`${styles.filterBtn} ${filter === std.id ? styles.filterActive : ''}`}
                            onClick={() => setFilter(std.id)}
                        >
                            {std.id === 'iso27001' ? 'ISO 27001' : 'TCVN 11930'} ({count})
                        </button>
                    )
                })}
            </div>

            <div className={styles.templateGrid}>
                {filteredTemplates.map(tpl => {
                    const { implemented, total } = getControlCount(tpl)
                    const percent = total > 0 ? Math.round((implemented / total) * 100) : 0

                    return (
                        <div key={tpl.id} className={styles.templateCard}>
                            <div className={styles.cardHeader}>
                                <div className={styles.cardTitleRow}>
                                    <h3 className={styles.cardTitle}>{tpl.name}</h3>
                                    <span className={`${styles.stdBadge} ${tpl.standard === 'iso27001' ? styles.stdIso : styles.stdTcvn}`}>
                                        {tpl.standard === 'iso27001' ? 'ISO 27001' : 'TCVN 11930'}
                                    </span>
                                </div>
                                <span className={styles.industryTag}>{tpl.data.organization.industry}</span>
                            </div>

                            <div className={styles.cardBody}>
                                <p className={styles.cardDesc}>{tpl.description}</p>

                                {tpl.source && (
                                    <div className={styles.sourceRow}>
                                        <Info size={11} className={styles.sourceIcon} />
                                        <span className={styles.sourceText}>
                                            {tpl.sourceUrl ? (
                                                <a
                                                    href={tpl.sourceUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={styles.sourceLink}
                                                >
                                                    {tpl.source}
                                                    <ExternalLink size={10} style={{ marginLeft: '4px', verticalAlign: 'middle' }} />
                                                </a>
                                            ) : tpl.source}
                                        </span>
                                    </div>
                                )}

                                <div className={styles.statsRow}>
                                    {[
                                        { num: tpl.data.organization.employees?.toLocaleString(), label: t('templates.employees') },
                                        { num: tpl.data.infrastructure.servers?.toLocaleString(), label: t('templates.servers') },
                                        { num: tpl.data.organization.it_staff?.toLocaleString(), label: t('templates.itSec') },
                                    ].map(s => (
                                        <div key={s.label} className={styles.statBox}>
                                            <span className={styles.statNum}>{s.num}</span>
                                            <span className={styles.statLabel}>{s.label}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className={styles.metaGrid}>
                                    {[
                                        { label: 'Cloud', value: tpl.data.infrastructure.cloud?.split(',')[0]?.split('(')[0]?.trim() || 'None' },
                                        { label: 'Firewall', value: tpl.data.infrastructure.firewalls?.split(',')[0]?.trim() || 'None' },
                                        { label: 'SIEM', value: tpl.data.infrastructure.siem?.split(',')[0]?.split('+')[0]?.trim() || 'None' },
                                        { label: 'Status', value: tpl.data.compliance.iso_status?.split('(')[0]?.trim() || '—' },
                                    ].map(m => (
                                        <div key={m.label} className={styles.metaItem}>
                                            <span className={styles.metaLabel}>{m.label}</span>
                                            <span className={styles.metaValue}>{m.value}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className={styles.complianceSection}>
                                    <div className={styles.complianceHeader}>
                                        <span className={styles.complianceTitle}>{t('templates.compliance')}</span>
                                        <span className={styles.complianceValue}>{implemented}/{total} — {percent}%</span>
                                    </div>
                                    <div className={styles.complianceTrack}>
                                        <div className={styles.complianceFill} style={{
                                            width: `${percent}%`,
                                            background: percent >= 80 ? 'var(--accent-green)'
                                                      : percent >= 50 ? 'var(--accent-blue)'
                                                      : percent >= 25 ? 'var(--accent-amber, #f59e0b)'
                                                      : 'var(--accent-red, #ef4444)'
                                        }} />
                                    </div>
                                </div>
                            </div>

                            <div className={styles.cardFooter}>
                                <button className={styles.useBtn} onClick={() => selectTemplate(tpl)} aria-label={`${t('templates.analyzeSystem')} ${tpl.name}`}>
                                    <Zap size={13} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
                                    {t('templates.analyzeSystem')}
                                </button>
                            </div>
                        </div>
                    )
                })}
                {filteredTemplates.length === 0 && (
                    <div className={styles.emptyState}>
                        <p>{t('templates.noTemplates')}</p>
                    </div>
                )}
            </div>
        </div>
    )
}
