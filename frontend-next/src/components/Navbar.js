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
            <div className={styles.inner}>
                <Link href="/" className={styles.brand}>
                    <div className={styles.brandIcon}>⚡</div>
                    <span className={styles.brandName}>PhoBERT AI</span>
                </Link>

                <div className={styles.nav}>
                    {NAV_ITEMS.map(item => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`${styles.link} ${pathname === item.href ? styles.linkActive : ''}`}
                        >
                            <span>{item.icon}</span>
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </div>

                <div className={styles.status}>
                    <span className={styles.dot} />
                    <span>Online</span>
                </div>
            </div>
        </nav>
    )
}
