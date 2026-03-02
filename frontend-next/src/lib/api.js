const API_BASE = typeof window !== 'undefined'
    ? ''
    : (process.env.API_URL || 'http://backend:8000');

export async function fetchSystemStats() {
    const res = await fetch(`${API_BASE}/api/system/stats`, {
        cache: 'no-store'
    });
    if (!res.ok) throw new Error('Failed to fetch system stats');
    return res.json();
}

export async function fetchServiceStatus() {
    try {
        const healthRes = await fetch(`${API_BASE}/api/health`, { cache: 'no-store' });
        const backendReady = healthRes.ok;

        return {
            backend: {
                status: backendReady ? 'Running' : 'Offline',
                ready: backendReady
            }
        };
    } catch {
        return {
            backend: { status: 'Offline', ready: false }
        };
    }
}

export async function sendChatMessage(message, sessionId) {
    const res = await fetch(`/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, session_id: sessionId })
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Backend error (${res.status}): ${errorText}`);
    }

    return res.json();
}

export async function getSystemStatsClient() {
    const res = await fetch('/api/system/stats');
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
}
