'use client'

import { useState, useEffect } from 'react'
import SystemStats from '@/components/SystemStats'
import styles from './page.module.css'

export default function AnalyticsPage() {
    const [services, setServices] = useState(null)
    const [loading, setLoading] = useState(true)

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

    return (
        <div className="page-container">
            <div className={styles.header}>
                <h1 className={styles.title}>📊 Analytics Dashboard</h1>
                <p className={styles.subtitle}>Giám sát hiệu năng hệ thống và trạng thái dịch vụ real-time</p>
            </div>

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
                                    <div className={styles.serviceName}>🧠 PhoBERT Model</div>
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
                                        LLM Model • Quant: <strong style={{ color: 'var(--accent-amber)' }}>Q4_K_M</strong> • 4.9GB
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

            <section>
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
        </div>
    )
}
