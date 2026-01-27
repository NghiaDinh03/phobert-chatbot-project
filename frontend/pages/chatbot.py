import streamlit as st
from utils.theme_loader import load_theme, hide_streamlit_style
from utils.session import init_session
import datetime

st.set_page_config(page_title="AI Chatbot", page_icon="💬", layout="wide", initial_sidebar_state="collapsed")

load_theme()
hide_streamlit_style()
init_session()

# Initialize session states
if "messages" not in st.session_state:
    st.session_state.messages = []
if "chat_sessions" not in st.session_state:
    st.session_state.chat_sessions = []
if "current_session_id" not in st.session_state:
    st.session_state.current_session_id = None
if "show_history_sidebar" not in st.session_state:
    st.session_state.show_history_sidebar = False

# Enhanced CSS for clean layout with proper message styling
st.markdown("""
<style>
    /* CRITICAL: Make entire page background dark */
    .stApp {
        background: linear-gradient(180deg, #0A0E1A 0%, #1A1F2E 100%) !important;
    }
    
    /* Container max-width to prevent overflow */
    .main .block-container {
        max-width: 1400px;
        padding-left: 2rem;
        padding-right: 2rem;
        background: transparent !important;
    }
    
    /* Main header styling */
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
        background: linear-gradient(135deg, #F8FAFC 0%, #3B82F6 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        font-weight: 900;
        margin-bottom: 0.5rem;
    }
    
    .main-header p {
        font-size: 1rem;
        color: #CBD5E1;
        margin: 0;
    }
    
    /* Fix button alignment */
    .stButton>button {
        height: 2.5rem !important;
        font-weight: 700 !important;
        color: #F8FAFC !important;
        font-size: 0.9rem !important;
    }
    
    /* Chat messages container */
    .stChatMessage {
        background: transparent !important;
        padding: 0.75rem 0 !important;
        max-width: 100% !important;
    }
    
    /* User messages - RIGHT SIDE with WHITE background */
    .stChatMessage[data-testid="user-message"] {
        display: flex !important;
        flex-direction: row-reverse !important;
        justify-content: flex-start !important;
    }
    
    .stChatMessage[data-testid="user-message"] > div {
        display: flex !important;
        flex-direction: row-reverse !important;
        max-width: 75% !important;
        margin-left: auto !important;
    }
    
    .stChatMessage[data-testid="user-message"] [data-testid="stChatMessageContent"] {
        background: linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%) !important;
        border: 2px solid rgba(59, 130, 246, 0.4) !important;
        border-radius: 18px 18px 4px 18px !important;
        padding: 1.25rem 1.5rem !important;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15) !important;
    }
    
    .stChatMessage[data-testid="user-message"] [data-testid="stChatMessageContent"] p {
        color: #0F172A !important;
        font-size: 0.975rem !important;
        line-height: 1.7 !important;
        margin: 0 !important;
    }
    
    /* AI messages - LEFT SIDE with DARK background */
    .stChatMessage[data-testid="assistant-message"] {
        display: flex !important;
        justify-content: flex-start !important;
    }
    
    .stChatMessage[data-testid="assistant-message"] > div {
        max-width: 75% !important;
    }
    
    .stChatMessage[data-testid="assistant-message"] [data-testid="stChatMessageContent"] {
        background: rgba(30, 41, 59, 0.95) !important;
        border: 1px solid rgba(148, 163, 184, 0.3) !important;
        border-radius: 18px 18px 18px 4px !important;
        padding: 1.25rem 1.5rem !important;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4) !important;
    }
    
    .stChatMessage[data-testid="assistant-message"] [data-testid="stChatMessageContent"] p {
        color: #F8FAFC !important;
        font-size: 0.975rem !important;
        line-height: 1.7 !important;
        margin: 0 !important;
    }
    
    /* Avatar styling */
    .stChatMessage [data-testid="chatAvatarIcon-user"] {
        background: linear-gradient(135deg, #3B82F6, #8B5CF6) !important;
        width: 40px !important;
        height: 40px !important;
    }
    
    .stChatMessage [data-testid="chatAvatarIcon-assistant"] {
        background: linear-gradient(135deg, #10B981, #06B6D4) !important;
        width: 40px !important;
        height: 40px !important;
    }
    
    /* Caption (timestamp) styling */
    .stChatMessage small {
        font-size: 0.75rem !important;
        color: #94A3B8 !important;
        margin-top: 0.5rem !important;
        display: block !important;
    }
    
    /* Chat input container - dark theme matching */
    .stChatInputContainer {
        margin-top: 1.5rem !important;
        padding: 1rem !important;
        background: rgba(15, 23, 42, 0.8) !important;
        border: 1px solid rgba(59, 130, 246, 0.3) !important;
        border-radius: 16px !important;
        box-shadow: 0 -2px 8px rgba(0,0,0,0.3), 0 0 20px rgba(59, 130, 246, 0.1) !important;
    }
    
    .stChatInput input {
        background: rgba(30, 41, 59, 0.6) !important;
        border: 1px solid rgba(148, 163, 184, 0.3) !important;
        color: #F8FAFC !important;
    }
    
    .stChatInput input::placeholder {
        color: #94A3B8 !important;
    }
    
    /* Welcome card */
    .welcome-card {
        text-align: center;
        padding: 2rem 1.5rem;
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 16px;
        margin: 0.5rem auto 1rem;
        max-width: 700px;
    }
    
    /* Expander styling */
    .streamlit-expanderHeader {
        background: rgba(59, 130, 246, 0.15) !important;
        border: 1px solid rgba(59, 130, 246, 0.3) !important;
        border-radius: 12px !important;
        color: #F8FAFC !important;
        font-weight: 700 !important;
        padding: 0.875rem 1.25rem !important;
    }
    
    .streamlit-expanderContent {
        background: rgba(15, 23, 42, 0.6) !important;
        border: 1px solid var(--border) !important;
        border-radius: 0 0 12px 12px !important;
        padding: 1.25rem !important;
        margin-top: -1px !important;
    }
    
    /* Push chat area to bottom */
    .main > div:first-child {
        min-height: calc(100vh - 200px);
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
    }
</style>
""", unsafe_allow_html=True)

# Header
st.markdown("""
<div class="main-header">
    <h1>💬 AI Knowledge Assistant</h1>
    <p>Trợ lý AI chuyên về ISO 27001:2022 & TCVN 14423:2025</p>
</div>
""", unsafe_allow_html=True)

# Top Navigation Bar
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
                    session_exists = True
                    break
            
            if not session_exists:
                st.session_state.chat_sessions.append({
                    "id": st.session_state.current_session_id,
                    "title": st.session_state.messages[0]['content'][:40] + "...",
                    "timestamp": datetime.datetime.now().strftime('%d/%m/%Y %H:%M'),
                    "messages": st.session_state.messages.copy(),
                    "message_count": len(st.session_state.messages)
                })
        
        st.session_state.current_session_id = f"chat_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}"
        st.session_state.messages = []
        st.rerun()

with col5:
    history_count = len(st.session_state.chat_sessions)
    if st.button(f"📚 **Lịch sử ({history_count})**", key="toggle_history", use_container_width=True):
        st.session_state.show_history_sidebar = not st.session_state.show_history_sidebar

# History Panel
if st.session_state.show_history_sidebar and st.session_state.chat_sessions:
    with st.expander("📚 **Lịch sử Chat** - Click vào để mở lại cuộc hội thoại", expanded=True):
        st.markdown(f"**Tổng số:** {len(st.session_state.chat_sessions)} cuộc hội thoại")
        st.markdown("---")
        
        for idx, session in enumerate(reversed(st.session_state.chat_sessions)):
            col_info, col_actions = st.columns([3, 1])
            
            with col_info:
                st.markdown(f"""
                <div style="background: rgba(59, 130, 246, 0.12); padding: 1rem; border-radius: 12px; 
                            border: 1px solid rgba(59, 130, 246, 0.35); margin-bottom: 0.5rem;">
                    <div style="color: #F8FAFC; font-weight: 700; margin-bottom: 0.5rem; font-size: 0.95rem;">
                        📄 {session['title']}
                    </div>
                    <div style="color: #94A3B8; font-size: 0.85rem;">
                        🕒 {session.get('timestamp', 'N/A')} | 💬 {session.get('message_count', len(session['messages']))} tin nhắn
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
                    st.session_state.chat_sessions = [
                        s for s in st.session_state.chat_sessions 
                        if s['id'] != session['id']
                    ]
                    if st.session_state.current_session_id == session['id']:
                        st.session_state.messages = []
                        st.session_state.current_session_id = None
                    st.rerun()
            
            st.markdown("<br>", unsafe_allow_html=True)
elif st.session_state.show_history_sidebar and not st.session_state.chat_sessions:
    st.info("📭 Chưa có lịch sử chat nào. Hãy bắt đầu cuộc hội thoại đầu tiên!")

# Spacer
st.markdown("<br>", unsafe_allow_html=True)

# Chat Messages Area
if not st.session_state.messages:
    st.markdown("""
    <div class="welcome-card">
        <div style="font-size: 3rem; margin-bottom: 1rem; filter: drop-shadow(0 0 15px rgba(59, 130, 246, 0.5));">👋</div>
        <h2 style="color: #F8FAFC; font-size: 1.6rem; margin-bottom: 0.875rem; font-weight: 700;">Xin chào! Tôi có thể giúp gì?</h2>
        <p style="color: #CBD5E1; font-size: 0.95rem; line-height: 1.7; margin-bottom: 1.25rem;">
            Hãy hỏi tôi bất kỳ điều gì về ISO 27001, TCVN 14423,<br>
            hoặc các vấn đề liên quan đến bảo mật thông tin.
        </p>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.875rem; max-width: 550px; margin: 0 auto;">
            <div style="background: rgba(59, 130, 246, 0.1); padding: 1rem; border-radius: 10px; border: 1px solid rgba(59, 130, 246, 0.3);">
                <div style="font-size: 1.5rem; margin-bottom: 0.4rem;">📋</div>
                <div style="font-size: 0.875rem; color: #CBD5E1; font-weight: 500;">Giải thích điều khoản ISO 27001</div>
            </div>
            <div style="background: rgba(139, 92, 246, 0.1); padding: 1rem; border-radius: 10px; border: 1px solid rgba(139, 92, 246, 0.3);">
                <div style="font-size: 1.5rem; margin-bottom: 0.4rem;">🔍</div>
                <div style="font-size: 0.875rem; color: #CBD5E1; font-weight: 500;">Tra cứu văn bản pháp luật</div>
            </div>
            <div style="background: rgba(6, 182, 212, 0.1); padding: 1rem; border-radius: 10px; border: 1px solid rgba(6, 182, 212, 0.3);">
                <div style="font-size: 1.5rem; margin-bottom: 0.4rem;">💡</div>
                <div style="font-size: 0.875rem; color: #CBD5E1; font-weight: 500;">Tư vấn triển khai ISMS</div>
            </div>
            <div style="background: rgba(16, 185, 129, 0.1); padding: 1rem; border-radius: 10px; border: 1px solid rgba(16, 185, 129, 0.3);">
                <div style="font-size: 1.5rem; margin-bottom: 0.4rem;">✅</div>
                <div style="font-size: 0.875rem; color: #CBD5E1; font-weight: 500;">Hướng dẫn đánh giá rủi ro</div>
            </div>
        </div>
    </div>
    """, unsafe_allow_html=True)
else:
    # Display messages with proper styling
    for message in st.session_state.messages:
        with st.chat_message(message["role"], avatar="👤" if message["role"] == "user" else "🤖"):
            st.markdown(message["content"])
            st.caption(f"🕒 {message.get('timestamp', 'N/A')}")

# Spacer before input
st.markdown("<br>", unsafe_allow_html=True)

# Chat Input
user_input = st.chat_input("💬 Nhập câu hỏi của bạn về ISO 27001, TCVN 14423...")

if user_input:
    timestamp = datetime.datetime.now().strftime('%H:%M')
    
    st.session_state.messages.append({
        "role": "user",
        "content": user_input,
        "timestamp": timestamp
    })
    
    with st.spinner("🤔 Đang xử lý và tìm kiếm thông tin..."):
        try:
            from services.api_client import APIClient
            
            session_id = st.session_state.current_session_id or "default"
            response = APIClient.chat(user_input, session_id)
            
            if "error" in response:
                bot_reply = f"❌ **Lỗi**: {response['error']}\n\nVui lòng thử lại sau."
            elif "response" in response:
                bot_reply = response["response"]
            else:
                bot_reply = "⚠️ **Lỗi hệ thống**: Phản hồi không hợp lệ."
        except Exception as e:
            bot_reply = f"""⚠️ **Không thể kết nối tới backend**

**Lỗi**: `{str(e)}`

**Gợi ý**:
- Kiểm tra FastAPI backend (Port 8000)
- Kiểm tra LocalAI server (Port 8080)
"""
    
    st.session_state.messages.append({
        "role": "assistant",
        "content": bot_reply,
        "timestamp": datetime.datetime.now().strftime('%H:%M')
    })
    
    if not st.session_state.current_session_id:
        st.session_state.current_session_id = f"chat_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}"
        st.session_state.chat_sessions.append({
            "id": st.session_state.current_session_id,
            "title": user_input[:40] + ("..." if len(user_input) > 40 else ""),
            "timestamp": datetime.datetime.now().strftime('%d/%m/%Y %H:%M'),
            "messages": st.session_state.messages.copy(),
            "message_count": len(st.session_state.messages)
        })
    
    st.rerun()

# Footer stats
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
