'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import styles from './page.module.css'

const SUGGESTIONS = [
    { icon: '📋', title: 'ISO 27001 là gì?', sub: 'Tổng quan tiêu chuẩn' },
    { icon: '🔍', title: 'TCVN 14423 quy định gì?', sub: 'Pháp luật Việt Nam' },
    { icon: '💡', title: 'Làm sao triển khai ISMS?', sub: 'Lộ trình thực hiện' },
    { icon: '✅', title: 'Cách đánh giá rủi ro ATTT', sub: 'Phương pháp & quy trình' }
]

const SESSIONS_KEY = 'phobert_chat_sessions'
const ACTIVE_KEY = 'phobert_active_session'

function generateId() {
    return `s_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
}

function getTimeStr() {
    return new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function loadSessions() {
    if (typeof window === 'undefined') return []
    try { return JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]') } catch { return [] }
}

function saveSessions(sessions) {
    try { localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions)) } catch { }
}

function loadActiveId() {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(ACTIVE_KEY) || null
}

function saveActiveId(id) {
    try {
        if (id) localStorage.setItem(ACTIVE_KEY, id)
        else localStorage.removeItem(ACTIVE_KEY)
    } catch { }
}

export default function ChatbotPage() {
    const [sessions, setSessions] = useState([])
    const [currentId, setCurrentId] = useState(null)
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [showHistory, setShowHistory] = useState(false)
    const [initialized, setInitialized] = useState(false)
    const endRef = useRef(null)
    const inputRef = useRef(null)

    useEffect(() => {
        const saved = loadSessions()
        const activeId = loadActiveId()
        setSessions(saved)

        if (activeId) {
            const active = saved.find(s => s.id === activeId)
            if (active) {
                setCurrentId(activeId)
                setMessages(active.messages || [])
            }
        }
        setInitialized(true)
    }, [])

    useEffect(() => {
        if (initialized) saveSessions(sessions)
    }, [sessions, initialized])

    useEffect(() => {
        if (initialized) saveActiveId(currentId)
    }, [currentId, initialized])

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const persistSession = useCallback((msgs, sessionId) => {
        setSessions(prev => {
            const title = msgs[0]?.content?.slice(0, 50) + (msgs[0]?.content?.length > 50 ? '...' : '')
            const session = {
                id: sessionId,
                title,
                timestamp: new Date().toLocaleString('vi-VN'),
                messages: msgs,
                count: msgs.length
            }
            const idx = prev.findIndex(s => s.id === sessionId)
            if (idx >= 0) {
                const updated = [...prev]
                updated[idx] = session
                return updated
            }
            return [session, ...prev]
        })
    }, [])

    const sendMessage = async (text) => {
        if (!text.trim() || loading) return

        const sessionId = currentId || generateId()
        if (!currentId) setCurrentId(sessionId)

        const userMsg = { role: 'user', content: text.trim(), time: getTimeStr() }
        const nextMsgs = [...messages, userMsg]
        setMessages(nextMsgs)
        setInput('')
        setLoading(true)

        persistSession(nextMsgs, sessionId)

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text.trim(), session_id: sessionId })
            })
            const data = await res.json()
            const content = data.error
                ? `❌ ${data.error}`
                : (data.response || '⚠️ Không nhận được phản hồi.')

            const botMsg = { role: 'assistant', content, time: getTimeStr() }
            const final = [...nextMsgs, botMsg]
            setMessages(final)
            persistSession(final, sessionId)
        } catch {
            const errMsg = { role: 'assistant', content: '❌ Không kết nối được backend.', time: getTimeStr() }
            const final = [...nextMsgs, errMsg]
            setMessages(final)
            persistSession(final, sessionId)
        } finally {
            setLoading(false)
        }
    }

    const startNew = () => {
        setCurrentId(null)
        setMessages([])
        setShowHistory(false)
        inputRef.current?.focus()
    }

    const loadSession = (session) => {
        setCurrentId(session.id)
        setMessages(session.messages || [])
        setShowHistory(false)
    }

    const deleteSession = (id) => {
        setSessions(prev => prev.filter(s => s.id !== id))
        if (currentId === id) {
            setCurrentId(null)
            setMessages([])
        }
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>💬 AI Knowledge Assistant</h1>
                    <p className={styles.subtitle}>ISO 27001:2022 & TCVN 14423:2025</p>
                </div>
                <div className={styles.actions}>
                    <button className={styles.btnNew} onClick={startNew}>＋ Chat mới</button>
                    <button className={styles.btnHistory} onClick={() => setShowHistory(!showHistory)}>
                        📚 Lịch sử ({sessions.length})
                    </button>
                </div>
            </div>

            {showHistory && (
                <div className={styles.historyPanel}>
                    {sessions.length === 0 ? (
                        <p className={styles.emptyHistory}>Chưa có lịch sử</p>
                    ) : (
                        sessions.map(s => (
                            <div key={s.id} className={`${styles.historyItem} ${s.id === currentId ? styles.historyActive : ''}`}>
                                <div className={styles.historyInfo} onClick={() => loadSession(s)}>
                                    <div className={styles.historyTitle}>{s.title}</div>
                                    <div className={styles.historyMeta}>{s.timestamp} · {s.count} tin</div>
                                </div>
                                <button className={styles.historyDel} onClick={() => deleteSession(s.id)}>✕</button>
                            </div>
                        ))
                    )}
                </div>
            )}

            <div className={styles.chatArea}>
                {messages.length === 0 ? (
                    <div className={styles.welcome}>
                        <div className={styles.welcomeIcon}>👋</div>
                        <h2 className={styles.welcomeTitle}>Xin chào!</h2>
                        <p className={styles.welcomeDesc}>Hãy đặt câu hỏi về ISO 27001 hoặc chọn chủ đề bên dưới</p>
                        <div className={styles.suggestions}>
                            {SUGGESTIONS.map((s, i) => (
                                <button key={i} className={styles.sugCard} onClick={() => sendMessage(s.title)}>
                                    <span className={styles.sugIcon}>{s.icon}</span>
                                    <span className={styles.sugTitle}>{s.title}</span>
                                    <span className={styles.sugSub}>{s.sub}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className={styles.msgList}>
                        {messages.map((msg, i) => (
                            <div key={i} className={`${styles.msgRow} ${msg.role === 'user' ? styles.userRow : styles.botRow}`}>
                                {msg.role === 'assistant' && <div className={styles.botAvatar}>🤖</div>}
                                <div className={`${styles.bubble} ${msg.role === 'user' ? styles.userBubble : styles.botBubble}`}>
                                    {msg.role === 'assistant' ? (
                                        <div className={styles.mdContent}>
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                                        </div>
                                    ) : (
                                        <div>{msg.content}</div>
                                    )}
                                    <div className={styles.msgTime}>{msg.time}</div>
                                </div>
                                {msg.role === 'user' && <div className={styles.userAvatar}>👤</div>}
                            </div>
                        ))}
                        {loading && (
                            <div className={`${styles.msgRow} ${styles.botRow}`}>
                                <div className={styles.botAvatar}>🤖</div>
                                <div className={`${styles.bubble} ${styles.botBubble}`}>
                                    <div className={styles.typing}>
                                        <span /><span /><span />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={endRef} />
                    </div>
                )}
            </div>

            <form className={styles.inputArea} onSubmit={e => { e.preventDefault(); sendMessage(input) }}>
                <div className={styles.inputWrap}>
                    <input
                        ref={inputRef}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder="Nhập câu hỏi..."
                        className={styles.input}
                        disabled={loading}
                        autoFocus
                    />
                    <button type="submit" className={styles.sendBtn} disabled={!input.trim() || loading}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                    </button>
                </div>
            </form>
        </div>
    )
}
