import streamlit as st
from utils.theme_loader import load_theme, hide_streamlit_style
from utils.session import init_session
from utils.chat_storage import load_chat_sessions, save_chat_sessions, add_chat_session, delete_chat_session
import datetime

st.set_page_config(page_title="AI Chatbot", page_icon="💬", layout="wide", initial_sidebar_state="collapsed")

load_theme()
hide_streamlit_style()
init_session()

if "messages" not in st.session_state:
    st.session_state.messages = []
if "chat_sessions" not in st.session_state:
    st.session_state.chat_sessions = load_chat_sessions()
if "current_session_id" not in st.session_state:
    st.session_state.current_session_id = None
if "show_history_sidebar" not in st.session_state:
    st.session_state.show_history_sidebar = False
if "pending_response" not in st.session_state:
    st.session_state.pending_response = False
if "history_expanded" not in st.session_state:
    st.session_state.history_expanded = True

st.markdown("""
<style>
    .stApp {
        background: linear-gradient(180deg, #0A0E1A 0%, #1A1F2E 100%) !important;
    }
</style>

<script>
function fixChatInputStyle() {
    const chatInput = document.querySelector('[data-testid="stChatInput"]');
    if (chatInput) {
        chatInput.style.setProperty('background', '#1E293B', 'important');
        chatInput.style.setProperty('border', '2px solid #334155', 'important');
        chatInput.style.setProperty('border-radius', '20px', 'important');
        
        const allDivs = chatInput.querySelectorAll('div');
        allDivs.forEach(div => {
            div.style.setProperty('background', 'transparent', 'important');
            div.style.setProperty('background-color', 'transparent', 'important');
        });
        
        const textarea = chatInput.querySelector('textarea');
        if (textarea) {
            textarea.style.setProperty('color', '#F8FAFC', 'important');
            textarea.style.setProperty('background', 'transparent', 'important');
        }
    }
    
    const bottom = document.querySelector('[data-testid="stBottom"]');
    if (bottom) {
        bottom.style.setProperty('background', '#0A0E1A', 'important');
        const innerDivs = bottom.querySelectorAll('div');
        innerDivs.forEach(div => {
            if (div.closest('[data-testid="stChatInput"]')) {
                div.style.setProperty('background', 'transparent', 'important');
            }
        });
    }
}
setInterval(fixChatInputStyle, 500);
document.addEventListener('DOMContentLoaded', fixChatInputStyle);
</script>
""", unsafe_allow_html=True)

st.markdown("""
<style>
    .stApp {
        background: linear-gradient(180deg, #0A0E1A 0%, #1A1F2E 100%) !important;
    }
    
    .main .block-container {
        max-width: 1400px;
        padding-left: 2rem;
        padding-right: 2rem;
        background: transparent !important;
    }
    
    .main-header {
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(139, 92, 246, 0.1));
        border: 1px solid rgba(59, 130, 246, 0.3);
        border-radius: 16px;
        padding: 1.5rem 2rem;
        text-align: center;
        margin-bottom: 1.5rem;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }
    
    .main-header h1 {
        font-size: 2rem;
        margin: 0;
        color: #F8FAFC !important;
        -webkit-text-fill-color: #F8FAFC !important;
        background: none !important;
        font-weight: 900;
        margin-bottom: 0.5rem;
    }
    
    .main-header p {
        font-size: 1rem;
        color: #CBD5E1;
        margin: 0;
    }
    
    .stButton>button {
        height: 2.5rem !important;
        font-weight: 700 !important;
        color: #F8FAFC !important;
        font-size: 0.9rem !important;
        background: linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95)) !important;
        border: 1px solid rgba(59, 130, 246, 0.4) !important;
        border-radius: 10px !important;
        transition: all 0.2s ease !important;
    }
    
    .stButton>button:hover {
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(139, 92, 246, 0.2)) !important;
        border-color: rgba(59, 130, 246, 0.6) !important;
        transform: translateY(-1px) !important;
    }
    
    [data-testid="stExpander"] {
        background: rgba(30, 41, 59, 0.8) !important;
        border: 1px solid rgba(59, 130, 246, 0.4) !important;
        border-radius: 12px !important;
    }
    
    [data-testid="stExpander"] > div:first-child {
        background: transparent !important;
    }
    
    [data-testid="stExpander"] summary {
        background: rgba(30, 41, 59, 0.9) !important;
        color: #F8FAFC !important;
        font-weight: 600 !important;
        padding: 0.75rem 1rem !important;
        border-radius: 12px !important;
    }
    
    [data-testid="stExpander"] summary:hover {
        background: rgba(59, 130, 246, 0.2) !important;
    }
    
    [data-testid="stExpander"] [data-testid="stExpanderDetails"] {
        background: transparent !important;
        padding: 1rem !important;
    }
    
    details {
        background: rgba(30, 41, 59, 0.8) !important;
        border: 1px solid rgba(59, 130, 246, 0.4) !important;
        border-radius: 12px !important;
    }
    
    details > summary {
        background: rgba(30, 41, 59, 0.9) !important;
        color: #F8FAFC !important;
        padding: 0.75rem 1rem !important;
        border-radius: 12px !important;
        cursor: pointer !important;
        list-style: none !important;
    }
    
    details > summary::-webkit-details-marker {
        display: none !important;
    }
    
    details > summary::before {
        content: "▶ " !important;
        color: #3B82F6 !important;
        font-size: 0.9rem !important;
        margin-right: 0.5rem !important;
        transition: transform 0.2s !important;
    }
    
    details[open] > summary::before {
        content: "▼ " !important;
    }
    
    [data-testid="stExpander"] svg {
        display: none !important;
    }
    
    [data-testid="stExpander"] span[data-baseweb="icon"] {
        display: none !important;
    }
    
    [data-testid="stBottom"] {
        background: #0F172A !important;
        border-top: 1px solid rgba(59, 130, 246, 0.2) !important;
        padding: 0.75rem 1rem !important;
    }
    
    /* AGGRESSIVE CHAT INPUT STYLING */
    [data-testid="stChatInput"],
    [data-testid="stChatInput"] > div,
    [data-testid="stChatInput"] > div > div,
    [data-testid="stChatInput"] div[class*="st-emotion"],
    [data-testid="stChatInput"] div[class*="stTextArea"],
    .stChatInput,
    .stChatInputContainer {
        background: #1E293B !important;
        background-color: #1E293B !important;
        border: 1px solid rgba(59, 130, 246, 0.4) !important;
        border-radius: 20px !important;
    }
    
    /* FORCE TEXT COLOR */
    [data-testid="stChatInput"] textarea,
    [data-testid="stChatInput"] input,
    [data-testid="stChatInput"] div[contenteditable],
    .stChatInput textarea,
    .stChatInputContainer textarea,
    div[data-baseweb="textarea"] textarea,
    div[data-baseweb="base-input"] input {
        background: transparent !important;
        background-color: transparent !important;
        color: #F8FAFC !important;
        -webkit-text-fill-color: #F8FAFC !important;
        caret-color: #3B82F6 !important;
        border: none !important;
    }
    
    [data-testid="stChatInput"] textarea::placeholder,
    .stChatInput textarea::placeholder {
        color: #64748B !important;
        -webkit-text-fill-color: #64748B !important;
    }
    
    [data-testid="stChatInputSubmitButton"] {
        background: linear-gradient(135deg, #3B82F6, #2563EB) !important;
        border-radius: 12px !important;
    }
    
    .chat-container {
        min-height: 300px;
        max-height: calc(100vh - 350px);
        overflow-y: auto;
        padding: 1rem 0;
        margin-bottom: 1rem;
    }
    
    .chat-row {
        display: flex;
        align-items: flex-end;
        gap: 10px;
        padding: 0.5rem 0;
        width: 100%;
    }
    
    .user-row {
        justify-content: flex-end;
    }
    
    .bot-row {
        justify-content: flex-start;
    }
    
    .chat-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.25rem;
        flex-shrink: 0;
    }
    
    .user-avatar {
        background: linear-gradient(135deg, #3B82F6, #8B5CF6);
    }
    
    .bot-avatar {
        background: linear-gradient(135deg, #10B981, #06B6D4);
    }
    
    .chat-bubble {
        max-width: 70%;
        padding: 1rem 1.25rem;
        border-radius: 18px;
    }
    
    .user-bubble {
        background: linear-gradient(135deg, #1E3A5F, #2563EB);
        border: 1px solid rgba(59, 130, 246, 0.5);
        border-radius: 18px 18px 4px 18px;
        box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
    }
    
    .bot-bubble {
        background: rgba(30, 41, 59, 0.95);
        border: 1px solid rgba(148, 163, 184, 0.3);
        border-radius: 18px 18px 18px 4px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
    }
    
    .bubble-content {
        color: #F8FAFC;
        font-size: 0.95rem;
        line-height: 1.6;
        word-wrap: break-word;
    }
    
    .bubble-time {
        font-size: 0.75rem;
        color: #94A3B8;
        margin-top: 0.5rem;
    }
    
    pre {
        background: #0D1117 !important;
        border: 1px solid #30363D !important;
        border-radius: 12px !important;
        padding: 1rem !important;
        margin: 1rem 0 !important;
        overflow-x: auto !important;
    }
    
    pre code {
        color: #E6EDF3 !important;
        font-family: 'JetBrains Mono', 'Fira Code', monospace !important;
        font-size: 0.9rem !important;
        line-height: 1.6 !important;
    }
    
    code {
        background: #1E293B !important;
        color: #A5D6FF !important;
        padding: 0.2rem 0.5rem !important;
        border-radius: 6px !important;
        font-size: 0.85rem !important;
    }
    
    .center-input-container {
        max-width: 700px;
        margin: 1.5rem auto 0;
        padding: 0 1rem;
    }
    
    .input-group {
        display: flex;
        align-items: center;
        background: rgba(30, 41, 59, 0.8);
        border: 1px solid rgba(59, 130, 246, 0.5);
        border-radius: 50px;
        padding: 4px 6px 4px 20px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        transition: all 0.3s ease;
    }
    
    .input-group:focus-within {
        border-color: #3B82F6;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3), 0 8px 30px rgba(0,0,0,0.4);
        background: rgba(30, 41, 59, 1);
    }
    
    .stTextInput {
        margin-bottom: 0 !important;
    }
    
    .stTextInput > div > div > input {
        background: transparent !important;
        border: none !important;
        color: #F8FAFC !important;
        padding: 0 !important;
        height: 48px !important;
    }
    
    .stTextInput > div > div > input:focus {
        box-shadow: none !important;
    }
    
    .custom-send-btn button {
        border-radius: 50% !important;
        width: 48px !important;
        height: 48px !important;
        padding: 0 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        background: linear-gradient(135deg, #3B82F6, #2563EB) !important;
        border: none !important;
        box-shadow: 0 2px 10px rgba(59, 130, 246, 0.3) !important;
        transition: transform 0.2s !important;
    }
    
    .custom-send-btn button:hover {
        transform: scale(1.05);
        box-shadow: 0 4px 15px rgba(59, 130, 246, 0.5) !important;
    }
    
    .welcome-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
        margin-top: 2rem;
    }
    
    .welcome-text {
        text-align: center;
        max-width: 800px;
        margin-bottom: 3rem;
    }
    
    .feature-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
        width: 100%;
        max-width: 600px;
        margin: 0 auto;
    }
    
    .feature-card {
        background: rgba(30, 41, 59, 0.4);
        padding: 1.25rem;
        border-radius: 16px;
        border: 1px solid rgba(148, 163, 184, 0.1);
        text-align: center;
        transition: all 0.2s ease;
        cursor: pointer;
    }
    
    .feature-card:hover {
        background: rgba(59, 130, 246, 0.1);
        border-color: rgba(59, 130, 246, 0.4);
        transform: translateY(-2px);
    }
</style>
""", unsafe_allow_html=True)

st.markdown("""
<div class="main-header">
    <h1>💬 AI Knowledge Assistant</h1>
    <p>Trợ lý AI chuyên về ISO 27001:2022 & TCVN 14423:2025</p>
</div>
""", unsafe_allow_html=True)

col1, col2, col3, col4, col5 = st.columns(5)

with col1:
    if st.button("🏠 **Trang chủ**", key="nav_home", use_container_width=True):
        st.switch_page("app.py")

with col2:
    if st.button("📋 **Form ISO**", key="nav_form", use_container_width=True):
        st.switch_page("pages/Form_iso27001.py")

with col3:
    if st.button("📊 **Analytics**", key="nav_analytics", use_container_width=True):
        st.switch_page("pages/analytics.py")

with col4:
    if st.button("➕ **Chat mới**", key="new_chat", type="primary", use_container_width=True):
        if st.session_state.messages and st.session_state.current_session_id:
            session_exists = False
            for session in st.session_state.chat_sessions:
                if session['id'] == st.session_state.current_session_id:
                    session['messages'] = st.session_state.messages.copy()
                    session['message_count'] = len(st.session_state.messages)
                    session_exists = True
                    break
            
            if not session_exists:
                new_session = {
                    "id": st.session_state.current_session_id,
                    "title": st.session_state.messages[0]['content'][:40] + "...",
                    "timestamp": datetime.datetime.now().strftime('%d/%m/%Y %H:%M'),
                    "messages": st.session_state.messages.copy(),
                    "message_count": len(st.session_state.messages)
                }
                st.session_state.chat_sessions = add_chat_session(new_session)
            else:
                save_chat_sessions(st.session_state.chat_sessions)
        
        st.session_state.current_session_id = None
        st.session_state.messages = []
        st.rerun()

with col5:
    history_count = len(st.session_state.chat_sessions)
    if st.button(f"📚 **Lịch sử ({history_count})**", key="toggle_history", use_container_width=True):
        st.session_state.show_history_sidebar = not st.session_state.show_history_sidebar

# History Panel
if st.session_state.show_history_sidebar and st.session_state.chat_sessions:
    arrow = "▼" if st.session_state.history_expanded else "▶"
    session_count = len(st.session_state.chat_sessions)
    
    if st.button(f"{arrow}  📚 Lịch sử Chat  ({session_count} cuộc hội thoại)", 
                 key="toggle_expand", use_container_width=True):
        st.session_state.history_expanded = not st.session_state.history_expanded
        st.rerun()
    
    if st.session_state.history_expanded:
        for idx, session in enumerate(reversed(st.session_state.chat_sessions)):
            col_info, col_actions = st.columns([3, 1])
            
            with col_info:
                status_indicator = session.get('status', 'completed')
                status_color = "#10B981" if status_indicator == "completed" else "#F59E0B"
                st.markdown(f"""
                <div style="background: linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.9)); 
                            padding: 1rem 1.25rem; border-radius: 12px; 
                            border: 1px solid rgba(59, 130, 246, 0.3); margin-bottom: 0.5rem;
                            transition: all 0.2s ease;">
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                        <span style="width: 8px; height: 8px; border-radius: 50%; background: {status_color};"></span>
                        <span style="color: #F8FAFC; font-weight: 600; font-size: 0.95rem; 
                                    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            {session['title']}
                        </span>
                    </div>
                    <div style="display: flex; gap: 1rem; color: #64748B; font-size: 0.8rem;">
                        <span>🕒 {session.get('timestamp', 'N/A')}</span>
                        <span>💬 {session.get('message_count', len(session['messages']))} tin</span>
                    </div>
                </div>
                """, unsafe_allow_html=True)
            
            with col_actions:
                if st.button("📂", key=f"load_{idx}", help="Mở lại chat", use_container_width=True):
                    st.session_state.current_session_id = session['id']
                    st.session_state.messages = session['messages'].copy()
                    st.session_state.show_history_sidebar = False
                    st.rerun()
                
                if st.button("🗑️", key=f"del_{idx}", help="Xóa chat", use_container_width=True):
                    st.session_state.chat_sessions = delete_chat_session(session['id'])
                    if st.session_state.current_session_id == session['id']:
                        st.session_state.messages = []
                        st.session_state.current_session_id = None
                    st.rerun()

elif st.session_state.show_history_sidebar and not st.session_state.chat_sessions:
    st.info("📭 Chưa có lịch sử chat nào. Hãy bắt đầu cuộc hội thoại đầu tiên!")

st.markdown("<br>", unsafe_allow_html=True)

prompt = None

if not st.session_state.messages:
    # --- 1. WELCOME SCREEN (Central Input) ---
    welcome_html = """<div class="welcome-container"><div class="welcome-text"><div style="font-size: 3.5rem; margin-bottom: 0.5rem;">👋</div><h2 style="font-size: 2.2rem; background: linear-gradient(to right, #60A5FA, #A78BFA); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 800; margin-bottom: 1rem;">Xin chào! Tôi có thể giúp gì cho bạn?</h2><p style="color: #94A3B8; font-size: 1.1rem; line-height: 1.6;">Trợ lý ảo hỗ trợ ISO 27001 và TCVN 14423.<br>Hãy đặt câu hỏi hoặc chọn các chủ đề bên dưới.</p></div><div class="feature-grid"><div class="feature-card"><div style="font-size: 1.5rem; margin-bottom: 0.5rem;">📋</div><div style="font-weight: 600; color: #E2E8F0; margin-bottom: 0.25rem;">Giải thích điều khoản</div><div style="font-size: 0.8rem; color: #64748B;">Chi tiết về ISO 27001</div></div><div class="feature-card"><div style="font-size: 1.5rem; margin-bottom: 0.5rem;">🔍</div><div style="font-weight: 600; color: #E2E8F0; margin-bottom: 0.25rem;">Tra cứu văn bản</div><div style="font-size: 0.8rem; color: #64748B;">Pháp luật liên quan</div></div><div class="feature-card"><div style="font-size: 1.5rem; margin-bottom: 0.5rem;">💡</div><div style="font-weight: 600; color: #E2E8F0; margin-bottom: 0.25rem;">Tư vấn triển khai</div><div style="font-size: 0.8rem; color: #64748B;">Lộ trình ISMS</div></div><div class="feature-card"><div style="font-size: 1.5rem; margin-bottom: 0.5rem;">✅</div><div style="font-weight: 600; color: #E2E8F0; margin-bottom: 0.25rem;">Đánh giá rủi ro</div><div style="font-size: 0.8rem; color: #64748B;">Phương pháp & quy trình</div></div></div></div>"""
    st.markdown(welcome_html, unsafe_allow_html=True)
    
    # Central Input Form matching the dark theme
    st.markdown('<div class="center-input-container">', unsafe_allow_html=True)
    with st.form("init_chat_form", clear_on_submit=True, border=False):
        col_input, col_btn = st.columns([10, 1])
        with col_input:
            init_input = st.text_input("msg", placeholder="💬 Hỏi tôi về ISO 27001, TCVN 14423...", label_visibility="collapsed")
        with col_btn:
            submitted = st.form_submit_button("➤")
        
        if submitted and init_input:
            prompt = init_input
            # Timezone GMT+7 logic handled below
    st.markdown('</div>', unsafe_allow_html=True)

    # Re-add CSS for centered input
    st.markdown("""
<style>
.center-input-container {
    max-width: 800px;
    width: 70%;
    margin: 2rem auto 0;
    position: relative;
    z-index: 100;
}
.center-input-container form[data-testid="stForm"] {
    background-color: #0F172A !important;
    border: 2px solid #334155 !important;
    border-radius: 30px !important;
    padding: 4px 8px !important;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5) !important;
}
.center-input-container .stTextInput input {
    color: #F8FAFC !important;
    background-color: transparent !important;
}
.center-input-container .stFormSubmitButton > button {
    background: transparent !important;
    border: none !important;
    color: #3B82F6 !important;
    font-size: 1.5rem !important;
}
</style>
""", unsafe_allow_html=True)

else:
    # --- 2. CHAT HISTORY SCREEN (Bottom Input) ---
    st.markdown('<div class="chat-container">', unsafe_allow_html=True)
    for message in st.session_state.messages:
        if message["role"] == "user":
            st.markdown(f"""
<div class="chat-row user-row">
    <div class="chat-bubble user-bubble">
        <div class="bubble-content">{message["content"]}</div>
        <div class="bubble-time">🕒 {message.get('timestamp', '')}</div>
    </div>
    <div class="chat-avatar user-avatar">👤</div>
</div>
""", unsafe_allow_html=True)
        else:
            content = message["content"]
            import re
            has_code = bool(re.search(r'```', content))
            
            if has_code:
                st.markdown(f"""
<div class="chat-row bot-row">
    <div class="chat-avatar bot-avatar">🤖</div>
    <div class="chat-bubble bot-bubble" style="max-width: 80%;">
        <div class="bubble-time">🕒 {message.get('timestamp', '')}</div>
    </div>
</div>
""", unsafe_allow_html=True)
                st.markdown(content)
            else:
                st.markdown(f"""
<div class="chat-row bot-row">
    <div class="chat-avatar bot-avatar">🤖</div>
    <div class="chat-bubble bot-bubble">
        <div class="bubble-content">{content}</div>
        <div class="bubble-time">🕒 {message.get('timestamp', '')}</div>
    </div>
</div>
""", unsafe_allow_html=True)
    
    if st.session_state.pending_response:
        st.markdown("""
<div class="chat-row bot-row">
    <div class="chat-avatar bot-avatar">🤖</div>
    <div class="chat-bubble bot-bubble">
        <div class="bubble-content">Đang suy nghĩ...</div>
    </div>
</div>""", unsafe_allow_html=True)
    
    st.markdown('</div>', unsafe_allow_html=True)
    
    st.markdown("""
    <style>
        [data-testid="stChatInput"],
        [data-testid="stChatInput"] > div,
        [data-testid="stChatInput"] > div > div,
        [data-testid="stChatInput"] > div > div > div,
        [data-testid="stChatInput"] * {
            background: #1E293B !important;
            background-color: #1E293B !important;
        }
        [data-testid="stChatInput"] textarea {
            background: transparent !important;
            color: #F8FAFC !important;
            -webkit-text-fill-color: #F8FAFC !important;
        }
        [data-testid="stBottom"] {
            background: #0A0E1A !important;
        }
        [data-testid="stBottom"] > div > div {
            background: #1E293B !important;
            border: 2px solid #334155 !important;
            border-radius: 20px !important;
        }
    </style>
    """, unsafe_allow_html=True)
    
    prompt = st.chat_input("💬 Nhập câu hỏi tiếp theo...")


if prompt:
    # Timezone GMT+7
    vietnam_time = datetime.datetime.utcnow() + datetime.timedelta(hours=7)
    timestamp = vietnam_time.strftime('%H:%M')
    
    # 1. Append User Message
    st.session_state.messages.append({
        "role": "user",
        "content": prompt,
        "timestamp": timestamp
    })
    
    # 2. Immediately create/update session (BEFORE waiting for bot)
    if not st.session_state.current_session_id:
        st.session_state.current_session_id = f"chat_{vietnam_time.strftime('%Y%m%d_%H%M%S')}"
        new_session = {
            "id": st.session_state.current_session_id,
            "title": prompt[:40] + ("..." if len(prompt) > 40 else ""),
            "timestamp": vietnam_time.strftime('%d/%m/%Y %H:%M'),
            "messages": st.session_state.messages.copy(),
            "message_count": len(st.session_state.messages),
            "status": "waiting"
        }
        st.session_state.chat_sessions = add_chat_session(new_session)
    else:
        for session in st.session_state.chat_sessions:
            if session['id'] == st.session_state.current_session_id:
                session['messages'] = st.session_state.messages.copy()
                session['message_count'] = len(st.session_state.messages)
                session['status'] = "waiting"
                break
        save_chat_sessions(st.session_state.chat_sessions)
    
    # 3. Render User Message Immediately
    st.markdown(f"""
    <div class="chat-row user-row">
        <div class="chat-bubble user-bubble">
            <div class="bubble-content">{prompt}</div>
            <div class="bubble-time">🕒 {timestamp}</div>
        </div>
        <div class="chat-avatar user-avatar">👤</div>
    </div>
    """, unsafe_allow_html=True)


    # 4. Show Loading Indicator
    loading_placeholder = st.empty()
    loading_placeholder.markdown("""
    <div class="chat-row bot-row">
        <div class="chat-avatar bot-avatar">🤖</div>
        <div class="chat-bubble bot-bubble" style="background: linear-gradient(90deg, #1E293B, #334155, #1E293B); background-size: 200% 100%; animation: shimmer 1.5s infinite;">
            <div class="bubble-content" style="display: flex; align-items: center; gap: 10px;">
                <div style="width: 20px; height: 20px; border: 3px solid #3B82F6; border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <span style="color: #94A3B8;">Đang xử lý câu hỏi...</span>
            </div>
        </div>
    </div>
    <style>
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
    </style>
    """, unsafe_allow_html=True)
    
    # 5. Get Bot Response
    try:
        from services.api_client import APIClient
        session_id = st.session_state.current_session_id or "default"
        response = APIClient.chat(prompt, session_id)
        
        if "error" in response and response["error"]:
            error_msg = response.get("response", str(response["error"]))
            bot_reply = f"❌ **Lỗi**: {error_msg}\n\nVui lòng thử lại sau."
        elif "response" in response:
            bot_reply = response["response"]
        else:
            bot_reply = "⚠️ **Lỗi hệ thống**: Phản hồi không hợp lệ."
    except Exception as e:
        bot_reply = f"❌ **Lỗi**: Không kết nối được backend. Kiểm tra Docker container."
    
    loading_placeholder.empty()

    # 6. Append Bot Message
    bot_timestamp = (datetime.datetime.utcnow() + datetime.timedelta(hours=7)).strftime('%H:%M')
    st.session_state.messages.append({
        "role": "assistant",
        "content": bot_reply,
        "timestamp": bot_timestamp
    })

    # 7. Update Session with bot response (SAVE IMMEDIATELY)
    for session in st.session_state.chat_sessions:
        if session['id'] == st.session_state.current_session_id:
            session['messages'] = st.session_state.messages.copy()
            session['message_count'] = len(st.session_state.messages)
            session['status'] = "completed"
            session['last_response'] = bot_reply[:100] + "..." if len(bot_reply) > 100 else bot_reply
            break
    save_chat_sessions(st.session_state.chat_sessions)
    
    # 8. Show bot response before rerun (for visual confirmation)
    st.markdown(f"""
    <div class="chat-row bot-row">
        <div class="chat-avatar bot-avatar">🤖</div>
        <div class="chat-bubble bot-bubble">
            <div class="bubble-content">{bot_reply}</div>
            <div class="bubble-time">🕒 {bot_timestamp}</div>
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    import time
    time.sleep(0.5)
    st.rerun()

if st.session_state.messages:
    st.markdown("<br>", unsafe_allow_html=True)
    st.markdown(f"""
    <div style="text-align: center; padding: 1rem; background: var(--bg-card); 
                border: 1px solid var(--border); border-radius: 12px;">
        <p style="color: #94A3B8; margin: 0; font-size: 0.9rem;">
            💬 <strong style="color: #3B82F6;">{len(st.session_state.messages)}</strong> tin nhắn | 
            🕒 Bắt đầu: <strong style="color: #3B82F6;">{st.session_state.messages[0].get('timestamp', 'N/A')}</strong> | 
            📚 <strong style="color: #3B82F6;">{len(st.session_state.chat_sessions)}</strong> lịch sử
        </p>
    </div>
    """, unsafe_allow_html=True)
    st.markdown("""
<style>
    /* --- Main UI Tweaks --- */
    /* Make the bottom fixed container transparent */
/* --- Main UI Tweaks --- */
div[data-testid="stBottom"] > div {
    background-color: #0F172A !important;
}
div[data-testid="stBottom"] {
    background-color: #0F172A !important;
    border-top: 1px solid rgba(59, 130, 246, 0.2) !important;
}

div[data-testid="stChatInput"] {
    padding-bottom: 20px !important;
    background-color: transparent !important;
}

div[data-testid="stChatInput"] > div {
    width: 70% !important;
    max-width: 800px !important;
    margin: 0 auto !important;
    background: linear-gradient(135deg, #1E293B, #0F172A) !important;
    border: 2px solid #334155 !important;
    border-radius: 30px !important;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5) !important;
}

div[data-testid="stChatInput"] > div:focus-within {
    border-color: #3B82F6 !important;
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.3) !important;
}

div[data-testid="stChatInput"] > div > div,
div[data-testid="stChatInput"] > div > div > div {
    background: transparent !important;
    background-color: transparent !important;
}

div[data-testid="stChatInput"] textarea {
    background: transparent !important;
    background-color: transparent !important;
    color: #F8FAFC !important;
    caret-color: #3B82F6 !important;
    padding: 0.75rem 1.25rem !important;
    font-size: 1rem !important;
    border: none !important;
}

div[data-testid="stChatInput"] textarea::placeholder {
    color: #94A3B8 !important;
}

button[data-testid="stChatInputSubmitButton"] {
    background: linear-gradient(135deg, #3B82F6, #2563EB) !important;
    border: none !important;
    border-radius: 50% !important;
    padding: 8px !important;
    margin-right: 8px !important;
}

button[data-testid="stChatInputSubmitButton"] svg {
    fill: #FFFFFF !important;
}

button[data-testid="stChatInputSubmitButton"]:hover {
    background: linear-gradient(135deg, #2563EB, #1D4ED8) !important;
    transform: scale(1.05);
}



    /* --- Message Bubbles (Refined) --- */
    div[data-testid="stChatMessage"] {
        background-color: transparent !important;
        border: 1px solid rgba(148, 163, 184, 0.1) !important;
    }
    
    div[data-testid="stChatMessage"][data-test-user-avatar="true"] {
        background: linear-gradient(90deg, rgba(59, 130, 246, 0.1), transparent) !important;
        border-left: 4px solid #3B82F6 !important;
    }
    
    div[data-testid="stChatMessage"][data-test-user-avatar="false"] {
        background: linear-gradient(90deg, rgba(30, 41, 59, 0.6), transparent) !important;
        border-right: 4px solid #8B5CF6 !important;
    }
    
    /* Avatar Styling */
    div[data-testid="stChatMessage"] [data-testid="stImage"] {
        border-radius: 50% !important;
    }
    
    /* Code Blocks */
    div[data-testid="stMarkdown"] code {
        background-color:   #1E293B !important;
        color: #E2E8F0 !important;
        border-radius: 6px !important;
    }
    
    /* ULTRA AGGRESSIVE OVERRIDE - Force dark theme on ALL chat input elements */
    [data-testid="stChatInput"],
    [data-testid="stChatInput"] *,
    [data-testid="stChatInput"] div,
    [data-testid="stChatInput"] > div,
    [data-testid="stChatInput"] > div > div,
    [data-testid="stChatInput"] > div > div > div,
    [data-testid="stBottom"],
    [data-testid="stBottom"] > div,
    [data-testid="stBottom"] > div > div,
    .stChatInput,
    .stChatInput div,
    .stChatInputContainer,
    .stChatInputContainer div {
        background: #1E293B !important;
        background-color: #1E293B !important;
        border-color: #334155 !important;
    }
    
    [data-testid="stChatInput"] textarea,
    .stChatInput textarea,
    [data-testid="stChatInput"] input,
    textarea[data-testid="stChatInputTextArea"] {
        background: transparent !important;
        background-color: transparent !important;
        color: #F8FAFC !important;
        -webkit-text-fill-color: #F8FAFC !important;
        border: none !important;
        caret-color: #3B82F6 !important;
    }
    
    [data-testid="stChatInput"] textarea::placeholder,
    .stChatInput textarea::placeholder {
        color: #64748B !important;
        -webkit-text-fill-color: #64748B !important;
        opacity: 1 !important;
    }
    
    [data-testid="stBottom"] {
        background: #0A0E1A !important;
        background-color: #0A0E1A !important;
        border-top: 1px solid #1E293B !important;
    }
    
    [data-testid="stChatInputSubmitButton"],
    [data-testid="stChatInputSubmitButton"] button {
        background: linear-gradient(135deg, #3B82F6, #2563EB) !important;
        border: none !important;
        border-radius: 50% !important;
    }
    
    [data-testid="stChatInputSubmitButton"] svg {
        fill: #FFFFFF !important;
    }
    
    /* Bot Message Improvement */
    .bot-bubble {
        background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%) !important;
        border: 1px solid #334155 !important;
    }
</style>
""", unsafe_allow_html=True)

st.markdown("""
<style>
    /* FINAL PASS - Override ALL Streamlit BaseUI components */
    div[class*="stChatInput"] { background: #1E293B !important; border-radius: 20px !important; }
    div[class*="stChatInput"] div { background: transparent !important; }
    div[class*="stChatInput"] textarea { color: #F8FAFC !important; background: transparent !important; -webkit-text-fill-color: #F8FAFC !important; }
    div[data-baseweb] { background: #1E293B !important; }
    div[data-baseweb] > div { background: transparent !important; }
    
    /* Target BaseUI TextArea specifically */
    div[data-baseweb="textarea"] { background: #1E293B !important; border: 2px solid #334155 !important; border-radius: 20px !important; }
    div[data-baseweb="textarea"] > div { background: transparent !important; }
    div[data-baseweb="base-input"] { background: transparent !important; }
    
    /* Force all nested divs in stBottom */
    [data-testid="stBottom"] * { background: transparent !important; }
    [data-testid="stBottom"] { background: #0A0E1A !important; }
    [data-testid="stBottom"] > div > div { background: #1E293B !important; border: 2px solid #334155 !important; border-radius: 20px !important; }
</style>
""", unsafe_allow_html=True)
