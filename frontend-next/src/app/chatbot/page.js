'use client'

import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import styles from './page.module.css'

const SUGGESTIONS = [
    { icon: '📋', title: 'Giải thích điều khoản', sub: 'Chi tiết về ISO 27001' },
    { icon: '🔍', title: 'Tra cứu văn bản', sub: 'Pháp luật liên quan' },
    { icon: '💡', title: 'Tư vấn triển khai', sub: 'Lộ trình ISMS' },
    { icon: '✅', title: 'Đánh giá rủi ro', sub: 'Phương pháp & quy trình' }
]

function generateId() {
    return `chat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function getTimeStr() {
    return new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })
}

export default function ChatbotPage() {
    const [sessions, setSessions] = useState([])
    const [currentSessionId, setCurrentSessionId] = useState(null)
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [showHistory, setShowHistory] = useState(false)
    const messagesEndRef = useRef(null)
    const inputRef = useRef(null)

    useEffect(() => {
        const saved = localStorage.getItem('chat_sessions')
        if (saved) {
            try { setSessions(JSON.parse(saved)) } catch { }
        }
    }, [])

    useEffect(() => {
        if (sessions.length > 0) {
            localStorage.setItem('chat_sessions', JSON.stringify(sessions))
        }
    }, [sessions])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const saveSession = (msgs, sessionId) => {
        setSessions(prev => {
            const existing = prev.findIndex(s => s.id === sessionId)
            const session = {
                id: sessionId,
                title: msgs[0]?.content?.slice(0, 40) + (msgs[0]?.content?.length > 40 ? '...' : ''),
                timestamp: new Date().toLocaleString('vi-VN'),
                messages: msgs,
                messageCount: msgs.length
            }
            if (existing >= 0) {
                const updated = [...prev]
                updated[existing] = session
                return updated
            }
            return [session, ...prev]
        })
    }

    const sendMessage = async (text) => {
        if (!text.trim() || loading) return

        const sessionId = currentSessionId || generateId()
        if (!currentSessionId) setCurrentSessionId(sessionId)

        const userMsg = { role: 'user', content: text.trim(), timestamp: getTimeStr() }
        const newMessages = [...messages, userMsg]
        setMessages(newMessages)
        setInput('')
        setLoading(true)

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text.trim(), session_id: sessionId })
            })

            const data = await res.json()
            const botContent = data.error
                ? `❌ **Lỗi**: ${data.error}`
                : (data.response || '⚠️ Không nhận được phản hồi.')

            const botMsg = { role: 'assistant', content: botContent, timestamp: getTimeStr() }
            const updatedMessages = [...newMessages, botMsg]
            setMessages(updatedMessages)
            saveSession(updatedMessages, sessionId)
        } catch {
            const errorMsg = { role: 'assistant', content: '❌ **Lỗi**: Không kết nối được backend.', timestamp: getTimeStr() }
            const updatedMessages = [...newMessages, errorMsg]
            setMessages(updatedMessages)
            saveSession(updatedMessages, sessionId)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        sendMessage(input)
    }

    const startNewChat = () => {
        setCurrentSessionId(null)
        setMessages([])
        setShowHistory(false)
        inputRef.current?.focus()
    }

    const loadSession = (session) => {
        setCurrentSessionId(session.id)
        setMessages(session.messages || [])
        setShowHistory(false)
    }

    const deleteSession = (id) => {
        setSessions(prev => prev.filter(s => s.id !== id))
        if (currentSessionId === id) {
            setCurrentSessionId(null)
            setMessages([])
        }
    }

    const handleSuggestion = (text) => {
        sendMessage(text)
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>💬 AI Knowledge Assistant</h1>
                    <p className={styles.subtitle}>Trợ lý AI chuyên về ISO 27001:2022 & TCVN 14423:2025</p>
                </div>
                <div className={styles.headerActions}>
                    <button className="btn btn-primary" onClick={startNewChat}>➕ Chat mới</button>
                    <button className="btn btn-ghost" onClick={() => setShowHistory(!showHistory)}>
                        📚 Lịch sử ({sessions.length})
                    </button>
                </div>
            </div>

            {showHistory && (
                <div className={styles.historyPanel}>
                    <h3 className={styles.historyTitle}>📚 Lịch sử Chat</h3>
                    {sessions.length === 0 ? (
                        <p className={styles.historyEmpty}>Chưa có lịch sử chat nào</p>
                    ) : (
                        <div className={styles.historyList}>
                            {sessions.map(session => (
                                <div key={session.id} className={styles.historyItem}>
                                    <div className={styles.historyInfo} onClick={() => loadSession(session)}>
                                        <span className={styles.historyDot}></span>
                                        <div>
                                            <div className={styles.historyItemTitle}>{session.title}</div>
                                            <div className={styles.historyMeta}>
                                                🕒 {session.timestamp} • 💬 {session.messageCount} tin
                                            </div>
                                        </div>
                                    </div>
                                    <button className={styles.historyDelete} onClick={() => deleteSession(session.id)}>
                                        🗑️
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <div className={styles.chatArea}>
                {messages.length === 0 ? (
                    <div className={styles.welcome}>
                        <div className={styles.welcomeEmoji}>👋</div>
                        <h2 className={styles.welcomeTitle}>Xin chào! Tôi có thể giúp gì cho bạn?</h2>
                        <p className={styles.welcomeDesc}>
                            Trợ lý ảo hỗ trợ ISO 27001 và TCVN 14423.<br />
                            Hãy đặt câu hỏi hoặc chọn các chủ đề bên dưới.
                        </p>
                        <div className={styles.suggestions}>
                            {SUGGESTIONS.map((s, i) => (
                                <button key={i} className={styles.suggestionCard} onClick={() => handleSuggestion(s.title)}>
                                    <span className={styles.suggestionIcon}>{s.icon}</span>
                                    <span className={styles.suggestionTitle}>{s.title}</span>
                                    <span className={styles.suggestionSub}>{s.sub}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className={styles.messageList}>
                        {messages.map((msg, i) => (
                            <div key={i} className={`${styles.messageRow} ${msg.role === 'user' ? styles.userRow : styles.botRow}`}>
                                {msg.role === 'assistant' && (
                                    <div className={`${styles.avatar} ${styles.botAvatar}`}>🤖</div>
                                )}
                                <div className={`${styles.bubble} ${msg.role === 'user' ? styles.userBubble : styles.botBubble}`}>
                                    <div className={styles.bubbleContent}>
                                        {msg.role === 'assistant' ? (
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                                        ) : (
                                            msg.content
                                        )}
                                    </div>
                                    <div className={styles.bubbleTime}>🕒 {msg.timestamp}</div>
                                </div>
                                {msg.role === 'user' && (
                                    <div className={`${styles.avatar} ${styles.userAvatar}`}>👤</div>
                                )}
                            </div>
                        ))}

                        {loading && (
                            <div className={`${styles.messageRow} ${styles.botRow}`}>
                                <div className={`${styles.avatar} ${styles.botAvatar}`}>🤖</div>
                                <div className={`${styles.bubble} ${styles.botBubble}`}>
                                    <div className={styles.loadingIndicator}>
                                        <div className={styles.spinner}></div>
                                        <span>Đang xử lý câu hỏi...</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            <form className={styles.inputArea} onSubmit={handleSubmit}>
                <div className={styles.inputGroup}>
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder={messages.length === 0 ? '💬 Hỏi tôi về ISO 27001, TCVN 14423...' : '💬 Nhập câu hỏi tiếp theo...'}
                        className={styles.input}
                        disabled={loading}
                        autoFocus
                    />
                    <button type="submit" className={styles.sendBtn} disabled={!input.trim() || loading}>
                        ➤
                    </button>
                </div>
            </form>

            {messages.length > 0 && (
                <div className={styles.chatMeta}>
                    💬 <strong>{messages.length}</strong> tin nhắn •
                    📚 <strong>{sessions.length}</strong> lịch sử
                </div>
            )}
        </div>
    )
}
