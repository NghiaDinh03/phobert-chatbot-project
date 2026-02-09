import json
import os
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"
CHAT_HISTORY_FILE = DATA_DIR / "chat_history.json"

def ensure_data_dir():
    DATA_DIR.mkdir(exist_ok=True)

def load_chat_sessions():
    ensure_data_dir()
    if CHAT_HISTORY_FILE.exists():
        try:
            with open(CHAT_HISTORY_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            return []
    return []

def save_chat_sessions(sessions):
    ensure_data_dir()
    try:
        with open(CHAT_HISTORY_FILE, 'w', encoding='utf-8') as f:
            json.dump(sessions, f, ensure_ascii=False, indent=2)
        return True
    except IOError:
        return False

def add_chat_session(session):
    sessions = load_chat_sessions()
    existing_idx = None
    for idx, s in enumerate(sessions):
        if s.get('id') == session.get('id'):
            existing_idx = idx
            break
    
    if existing_idx is not None:
        sessions[existing_idx] = session
    else:
        sessions.append(session)
    
    save_chat_sessions(sessions)
    return sessions

def delete_chat_session(session_id):
    sessions = load_chat_sessions()
    sessions = [s for s in sessions if s.get('id') != session_id]
    save_chat_sessions(sessions)
    return sessions

def update_session_messages(session_id, messages):
    sessions = load_chat_sessions()
    for session in sessions:
        if session.get('id') == session_id:
            session['messages'] = messages
            session['message_count'] = len(messages)
            break
    save_chat_sessions(sessions)
    return sessions
