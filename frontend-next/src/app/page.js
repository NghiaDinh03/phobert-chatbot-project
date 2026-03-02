'use client'

import Link from 'next/link'
import SystemStats from '@/components/SystemStats'
import styles from './page.module.css'

const FEATURES = [
    {
        icon: '💬',
        title: 'AI Knowledge Assistant',
        desc: 'Trợ lý AI thông minh hỗ trợ tra cứu văn bản pháp luật ISO 27001, TCVN 14423 và giải đáp nghiệp vụ bảo mật.',
        highlight: '⚡ Streaming Response',
        color: '#3B82F6',
        href: '/chatbot'
    },
    {
        icon: '📋',
        title: 'ISO 27001 Assessment',
        desc: 'Form đánh giá tuân thủ tiêu chuẩn bảo mật thông tin với report tự động và phân tích chuyên sâu.',
        highlight: '📊 Auto Report Generation',
        color: '#8B5CF6',
        href: '/form-iso'
    },
    {
        icon: '📊',
        title: 'Analytics Dashboard',
        desc: 'Dashboard phân tích hiệu năng server, tài nguyên hệ thống và trạng thái dịch vụ real-time.',
        highlight: '📈 Real-time Monitoring',
        color: '#06B6D4',
        href: '/analytics'
    }
]

export default function HomePage() {
    return (
        <div className="page-container">
            <section className={styles.hero}>
                <div className={styles.heroIcon}>⚡</div>
                <h1 className={styles.heroTitle}>PhoBERT AI Enterprise Platform</h1>
                <p className={styles.heroDesc}>
                    Nền tảng AI tiên tiến cho đánh giá tuân thủ <strong>ISO 27001:2022</strong> &{' '}
                    <strong>TCVN 14423</strong>.<br />
                    Tích hợp công nghệ <strong>PhoBERT</strong> và <strong>Phi-3 Mini</strong> được tối ưu hóa cho tiếng Việt.
                </p>
                <div className={styles.heroBadges}>
                    <span className="status-badge status-online">
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'currentColor' }}></span>
                        Production Ready
                    </span>
                </div>
            </section>

            <section>
                <h2 className="section-title">📊 Tài nguyên Hệ thống Real-time</h2>
                <SystemStats />
            </section>

            <section style={{ marginTop: '3rem' }}>
                <h2 className="section-title">🚀 Chức năng Nghiệp vụ</h2>
                <div className={styles.features}>
                    {FEATURES.map((f, i) => (
                        <Link key={i} href={f.href} className={`${styles.featureCard} fade-in`} style={{ animationDelay: `${i * 0.15}s` }}>
                            <div className={styles.featureIcon} style={{ filter: `drop-shadow(0 0 15px ${f.color}50)` }}>
                                {f.icon}
                            </div>
                            <h3 className={styles.featureTitle}>{f.title}</h3>
                            <p className={styles.featureDesc}>{f.desc}</p>
                            <div className={styles.featureHighlight} style={{ color: f.color }}>
                                {f.highlight}
                            </div>
                            <div className={styles.featureArrow}>→</div>
                        </Link>
                    ))}
                </div>
            </section>

            <footer className={styles.footer}>
                <p>© 2026 PhoBERT AI Platform. Enterprise Edition.</p>
                <p className={styles.footerTech}>
                    Powered by <strong style={{ color: '#3B82F6' }}>FastAPI</strong> •{' '}
                    <strong style={{ color: '#10B981' }}>Next.js</strong> •{' '}
                    <strong style={{ color: '#06B6D4' }}>LocalAI</strong>
                </p>
            </footer>
        </div>
    )
}
