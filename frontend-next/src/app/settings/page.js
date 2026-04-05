'use client'

import { useState, useEffect } from 'react'
import styles from './page.module.css'
import { Globe, Check } from 'lucide-react'

const LANGUAGES = [
    { code: 'en', label: 'English', sub: 'Default language' },
    { code: 'vi', label: 'Tiếng Việt', sub: 'Vietnamese' },
]

export default function SettingsPage() {
    const [language, setLanguage] = useState('en')
    const [saved, setSaved] = useState(false)

    useEffect(() => {
        const stored = localStorage.getItem('language')
        if (stored === 'en' || stored === 'vi') setLanguage(stored)
    }, [])

    const handleSelect = (code) => {
        setLanguage(code)
        localStorage.setItem('language', code)
        setSaved(true)
        const timer = setTimeout(() => setSaved(false), 2000)
        return () => clearTimeout(timer)
    }

    return (
        <div className="page-container">
            <div className={styles.header}>
                <h1 className={styles.title}>Settings</h1>
                <p className={styles.subtitle}>Application preferences</p>
            </div>

            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>
                    <Globe size={16} />
                    Language / Ngôn ngữ
                </h2>
                <div className={styles.card}>
                    <div className={styles.languageOptions}>
                        {LANGUAGES.map(lang => (
                            <button
                                key={lang.code}
                                className={`${styles.languageOption} ${language === lang.code ? styles.languageOptionActive : ''}`}
                                onClick={() => handleSelect(lang.code)}
                                aria-pressed={language === lang.code}
                            >
                                <span className={`${styles.radioCircle} ${language === lang.code ? styles.radioCircleActive : ''}`}>
                                    <span className={`${styles.radioDot} ${language === lang.code ? styles.radioDotActive : ''}`} />
                                </span>
                                <span className={styles.langInfo}>
                                    <span className={styles.langLabel}>{lang.label}</span>
                                    <span className={styles.langSub}>{lang.sub}</span>
                                </span>
                            </button>
                        ))}
                    </div>
                    {saved && (
                        <div className={styles.savedIndicator}>
                            <Check size={14} />
                            Language preference saved
                        </div>
                    )}
                    <p className={styles.note}>
                        Language preference is stored locally. Full i18n support coming soon.
                    </p>
                </div>
            </div>
        </div>
    )
}
