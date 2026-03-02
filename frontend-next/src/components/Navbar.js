'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import styles from './Navbar.module.css'

const NAV_ITEMS = [
    { href: '/', label: 'Trang chủ', icon: '🏠' },
    { href: '/chatbot', label: 'AI Chat', icon: '💬' },
    { href: '/analytics', label: 'Analytics', icon: '📊' },
    { href: '/form-iso', label: 'Form ISO', icon: '📋' }
]

export default function Navbar() {
    const pathname = usePathname()

    return (
        <nav className={styles.navbar}>
            <div className={styles.container}>
                <Link href="/" className={styles.logo}>
                    <div className={styles.logoGlow}>
                        <span className={styles.logoIcon}>⚡</span>
                    </div>
                    <div className={styles.logoTextGroup}>
                        <span className={styles.logoText}>PhoBERT</span>
                        <span className={styles.logoSub}>AI Platform</span>
                    </div>
                </Link>

                <div className={styles.navCenter}>
                    <div className={styles.navPill}>
                        {NAV_ITEMS.map(item => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`${styles.navLink} ${pathname === item.href ? styles.active : ''}`}
                            >
                                <span className={styles.navIcon}>{item.icon}</span>
                                <span className={styles.navLabel}>{item.label}</span>
                                {pathname === item.href && <div className={styles.activeIndicator} />}
                            </Link>
                        ))}
                    </div>
                </div>

                <div className={styles.navRight}>
                    <div className={styles.statusChip}>
                        <div className={styles.statusDot} />
                        <span>Online</span>
                    </div>
                </div>
            </div>
        </nav>
    )
}
