'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import styles from './Navbar.module.css'

const NAV_ITEMS = [
    { href: '/', label: 'Trang chủ', icon: '⚡' },
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
                    <span className={styles.logoIcon}>⚡</span>
                    <span className={styles.logoText}>PhoBERT AI</span>
                </Link>

                <div className={styles.navLinks}>
                    {NAV_ITEMS.map(item => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`${styles.navLink} ${pathname === item.href ? styles.active : ''}`}
                        >
                            <span>{item.icon}</span>
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </div>

                <div className={styles.badge}>
                    <span className={styles.dot}></span>
                    v2.5.0
                </div>
            </div>
        </nav>
    )
}
