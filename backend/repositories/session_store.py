class SessionStore:
    def __init__(self):
        self.sessions = {}
    
    def save(self, session_id: str, data: dict):
        self.sessions[session_id] = data
    
    def load(self, session_id: str):
        return self.sessions.get(session_id, {})
