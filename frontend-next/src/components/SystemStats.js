'use client'

import { useState, useEffect } from 'react'
import styles from './SystemStats.module.css'

export default function SystemStats() {
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/system/stats')
            if (res.ok) {
                const data = await res.json()
                setStats(data)
            }
        } catch (err) {
            console.error('Failed to fetch system stats:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchStats()
        const interval = setInterval(fetchStats, 10000)
        return () => clearInterval(interval)
    }, [])

    const formatBytes = (bytes) => {
        if (!bytes) return '0'
        const gb = bytes / (1024 ** 3)
        return gb >= 1 ? `${gb.toFixed(1)}` : `${(bytes / (1024 ** 2)).toFixed(0)}MB`
    }

    const formatUptime = (seconds) => {
        if (!seconds) return '0d'
        const days = Math.floor(seconds / 86400)
        const hours = Math.floor((seconds % 86400) / 3600)
        return days > 0 ? `${days}d ${hours}h` : `${hours}h`
    }

    if (loading) {
        return (
            <div className={styles.grid}>
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className={styles.card}>
                        <div className={styles.skeleton}></div>
                    </div>
                ))}
            </div>
        )
    }

    if (!stats) {
        return (
            <div className={styles.grid}>
                <div className={styles.card}>
                    <p style={{ color: 'var(--text-muted)' }}>Không thể kết nối hệ thống</p>
                </div>
            </div>
        )
    }

    const items = [
        {
            icon: '💻',
            label: 'CPU Usage',
            value: `${stats.cpu.percent}%`,
            detail: `${stats.cpu.name}`,
            sub: `${stats.cpu.cores} Cores`,
            color: stats.cpu.percent > 80 ? 'var(--accent-red)' : stats.cpu.percent > 50 ? 'var(--accent-amber)' : 'var(--accent-green)',
            percent: stats.cpu.percent
        },
        {
            icon: '🧠',
            label: 'Memory',
            value: `${formatBytes(stats.memory.used)}`,
            unit: 'GB',
            detail: `${stats.memory.percent}% sử dụng`,
            sub: `/ ${formatBytes(stats.memory.total)} GB tổng`,
            color: stats.memory.percent > 80 ? 'var(--accent-red)' : stats.memory.percent > 60 ? 'var(--accent-amber)' : 'var(--accent-green)',
            percent: stats.memory.percent
        },
        {
            icon: '💾',
            label: 'Storage',
            value: `${formatBytes(stats.disk.used)}`,
            unit: 'GB',
            detail: `${stats.disk.percent}% sử dụng`,
            sub: `/ ${formatBytes(stats.disk.total)} GB tổng`,
            color: stats.disk.percent > 85 ? 'var(--accent-red)' : stats.disk.percent > 70 ? 'var(--accent-amber)' : 'var(--accent-green)',
            percent: stats.disk.percent
        },
        {
            icon: '⚡',
            label: 'Uptime',
            value: formatUptime(stats.uptime_seconds),
            detail: stats.platform,
            sub: 'Hệ điều hành',
            color: 'var(--accent-green)',
            percent: 100
        }
    ]

    return (
        <div className={styles.grid}>
            {items.map((item, i) => (
                <div key={i} className={`${styles.card} fade-in`} style={{ animationDelay: `${i * 0.1}s` }}>
                    <div className={styles.header}>
                        <span className={styles.icon}>{item.icon}</span>
                        <span className={styles.label}>{item.label}</span>
                    </div>
                    <div className={styles.value} style={{ color: item.color }}>
                        {item.value}
                        {item.unit && <span className={styles.unit}>{item.unit}</span>}
                    </div>
                    <div className={styles.progressBar}>
                        <div
                            className={styles.progressFill}
                            style={{ width: `${Math.min(item.percent, 100)}%`, background: item.color }}
                        />
                    </div>
                    <div className={styles.detail} title={item.detail}>{item.detail}</div>
                    <div className={styles.sub}>{item.sub}</div>
                </div>
            ))}
        </div>
    )
}
