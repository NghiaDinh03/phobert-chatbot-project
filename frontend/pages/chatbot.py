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

# Enhanced CSS for clean layout
st.markdown("""
<style>
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
    
    /* Fix button alignment - make all buttons same height and style */
    .stButton>button {
        height: 2.5rem !important;
        font-weight: 700 !important;
        color: #F8FAFC !important;
        font-size: 0.9rem !important;
    }
    
    /* Custom chat message styling - dark theme */
    .stChatMessage {
        background: transparent !important;
        padding: 1rem 0 !important;
    }
    
    /* User messages - right side, white background */
    [data-testid="stChatMessageContent"][data-role="user"] {
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.9)) !important;
        border: 1px solid rgba(59, 130, 246, 0.3) !important;
        border-radius: 16px 16px 4px 16px !important;
        padding: 1.25rem 1.5rem !important;
        color: #0F172A !important;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2) !important;
        margin-left: auto !important;
        max-width: 75% !important;
    }
    
    [data-testid="stChatMessage"]:has([data-role="user"]) {
        flex-direction: row-reverse !important;
    }
    
    /* AI messages - left side, dark background */
    [data-testid="stChatMessageContent"][data-role="assistant"] {
        background: var(--bg-card) !important;
        border: 1px solid var(--border-light) !important;
        border-radius: 16px 16px 16px 4px !important;
        padding: 1.25rem 1.5rem !important;
        color: #F8FAFC !important;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
        max-width: 75% !important;
    }
    
    /* Message text color override */
    .stChatMessage p {
        color: inherit !important;
        margin: 0 !important;
        line-height: 1.7 !important;
    }
    
    /* Avatar styling */
    .stChatMessage [data-testid="chatAvatarIcon-user"] {
        background: linear-gradient(135deg, #3B82F6, #8B5CF6) !important;
    }
    
    .stChatMessage [data-testid="chatAvatarIcon-assistant"] {
        background: linear-gradient(135deg, #10B981, #06B6D4) !important;
    }
    
    /* Chat input styling - prevent overflow */
    .stChatInputContainer {
        margin-top: 2rem !important;
        padding-top: 1.5rem !important;
        border-top: 2px solid var(--border) !important;
        background: var(--bg-card) !important;
        border-radius: 12px !important;
        padding: 1rem !important;
    }
    
    /* Welcome card */
    .welcome-card {
        text-align: center;
        padding: 2.5rem 2rem;
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 20px;
        margin: 1rem auto 2rem;
        max-width: 750px;
    }
    
    /* Expander styling for history */
    .streamlit-expanderHeader {
        background: var(--bg-card) !important;
        border: 1px solid var(--border) !important;
        border-radius: 10px !important;
        color: #F8FAFC !important;
        font-weight: 700 !important;
    }
    
    .streamlit-expanderContent {
        background: var(--bg-darker) !important;
        border: 1px solid var(--border) !important;
        border-radius: 0 0 10px 10px !important;
        padding: 1rem !important;
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

# Top Navigation Bar with equal columns
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
    # ============================================
    # TÍNH NĂNG "CHAT MỚI" - Giải thích cơ chế:
    # ============================================
    # 1. Kiểm tra nếu đang có chat hiện tại (messages tồn tại)
    # 2. Lưu chat hiện tại vào session history trước khi tạo mới
    # 3. Tạo session ID mới với timestamp unique
    # 4. Reset messages array về rỗng
    # 5. Rerun để UI refresh và hiển thị welcome screen
    # ============================================
    if st.button("➕ **Chat mới**", key="new_chat", type="primary", use_container_width=True):
        # Lưu chat hiện tại vào history nếu có nội dung
        if st.session_state.messages and st.session_state.current_session_id:
            session_exists = False
            
            # Kiểm tra xem session đã tồn tại trong history chưa
            for session in st.session_state.chat_sessions:
                if session['id'] == st.session_state.current_session_id:
                    # Update messages của session đã tồn tại
                    session['messages'] = st.session_state.messages.copy()
                    session_exists = True
                    break
            
            # Nếu chưa tồn tại, tạo session history mới
            if not session_exists:
                st.session_state.chat_sessions.append({
                    "id": st.session_state.current_session_id,
                    "title": st.session_state.messages[0]['content'][:40] + "...",
                    "timestamp": datetime.datetime.now().strftime('%d/%m/%Y %H:%M'),
                    "messages": st.session_state.messages.copy(),
                    "message_count": len(st.session_state.messages)
                })
        
        # Tạo session ID mới với timestamp để đảm bảo unique
        st.session_state.current_session_id = f"chat_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # Reset messages để bắt đầu chat mới
        st.session_state.messages = []
        
        # Rerun để UI refresh
        st.rerun()

with col5:
    # History button to toggle expander view
    history_count = len(st.session_state.chat_sessions)
    if st.button(f"📚 **Lịch sử ({history_count})**", key="toggle_history", use_container_width=True):
        st.session_state.show_history_sidebar = not st.session_state.show_history_sidebar

# History Panel - Using Expander
if st.session_state.show_history_sidebar and st.session_state.chat_sessions:
    with st.expander("📚 Lịch sử Chat - Click vào để mở lại", expanded=True):
        st.markdown(f"**Tổng số:** {len(st.session_state.chat_sessions)} cuộc hội thoại")
        st.markdown("---")
        
        for idx, session in enumerate(reversed(st.session_state.chat_sessions)):
            col_info, col_actions = st.columns([3, 1])
            
            with col_info:
                st.markdown(f"""
                <div style="background: rgba(59, 130, 246, 0.1); padding: 1rem; border-radius: 10px; 
                            border: 1px solid rgba(59, 130, 246, 0.3);">
                    <div style="color: #F8FAFC; font-weight: 600; margin-bottom: 0.5rem;">
                        📄 {session['title']}
                    </div>
                    <div style="color: #94A3B8; font-size: 0.85rem;">
                        🕒 {session.get('timestamp', 'N/A')} | 💬 {session.get('message_count', len(session['messages']))} tin
                    </div>
                </div>
                """, unsafe_allow_html=True)
            
            with col_actions:
                # Load button
                if st.button("📂", key=f"load_{idx}", help="Mở chat", use_container_width=True):
                    st.session_state.current_session_id = session['id']
                    st.session_state.messages = session['messages'].copy()
                    st.session_state.show_history_sidebar = False
                    st.rerun()
                
                # Delete button
                if st.button("🗑️", key=f"del_{idx}", help="Xóa", use_container_width=True):
                    st.session_state.chat_sessions = [
                        s for s in st.session_state.chat_sessions 
                        if s['id'] != session['id']
                    ]
                    if st.session_state.current_session_id == session['id']:
                        st.session_state.messages = []
                        st.session_state.current_session_id = None
                    st.rerun()
            
            st.markdown("<br>", unsafe_allow_html=True)

# Spacer
st.markdown("<br>", unsafe_allow_html=True)

# Chat Messages Area
if not st.session_state.messages:
    # Welcome Screen
    st.markdown("""
    <div class="welcome-card">
        <div style="font-size: 3.5rem; margin-bottom: 1.25rem; filter: drop-shadow(0 0 18px rgba(59, 130, 246, 0.5));">👋</div>
        <h2 style="color: #F8FAFC; font-size: 1.75rem; margin-bottom: 1rem; font-weight: 700;">Xin chào! Tôi có thể giúp gì?</h2>
        <p style="color: #CBD5E1; font-size: 1rem; line-height: 1.9; margin-bottom: 1.5rem;">
            Hãy hỏi tôi bất kỳ điều gì về ISO 27001, TCVN 14423,<br>
            hoặc các vấn đề liên quan đến bảo mật thông tin.
        </p>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; max-width: 600px; margin: 0 auto;">
            <div style="background: rgba(59, 130, 246, 0.1); padding: 1.25rem; border-radius: 12px; border: 1px solid rgba(59, 130, 246, 0.3);">
                <div style="font-size: 1.75rem; margin-bottom: 0.5rem;">📋</div>
                <div style="font-size: 0.95rem; color: #CBD5E1; font-weight: 500;">Giải thích điều khoản ISO 27001</div>
            </div>
            <div style="background: rgba(139, 92, 246, 0.1); padding: 1.25rem; border-radius: 12px; border: 1px solid rgba(139, 92, 246, 0.3);">
                <div style="font-size: 1.75rem; margin-bottom: 0.5rem;">🔍</div>
                <div style="font-size: 0.95rem; color: #CBD5E1; font-weight: 500;">Tra cứu văn bản pháp luật</div>
            </div>
            <div style="background: rgba(6, 182, 212, 0.1); padding: 1.25rem; border-radius: 12px; border: 1px solid rgba(6, 182, 212, 0.3);">
                <div style="font-size: 1.75rem; margin-bottom: 0.5rem;">💡</div>
                <div style="font-size: 0.95rem; color: #CBD5E1; font-weight: 500;">Tư vấn triển khai ISMS</div>
            </div>
            <div style="background: rgba(16, 185, 129, 0.1); padding: 1.25rem; border-radius: 12px; border: 1px solid rgba(16, 185, 129, 0.3);">
                <div style="font-size: 1.75rem; margin-bottom: 0.5rem;">✅</div>
                <div style="font-size: 0.95rem; color: #CBD5E1; font-weight: 500;">Hướng dẫn đánh giá rủi ro</div>
            </div>
        </div>
    </div>
    """, unsafe_allow_html=True)
else:
    # Display messages using Streamlit native chat
    for message in st.session_state.messages:
        with st.chat_message(message["role"], avatar="👤" if message["role"] == "user" else "🤖"):
            st.markdown(message["content"])
            st.caption(f"🕒 {message.get('timestamp', 'N/A')}")

# Spacer before chat input
st.markdown("<br><br>", unsafe_allow_html=True)

# Chat Input - đặt ở cuối để không bị tràn
user_input = st.chat_input("💬 Nhập câu hỏi của bạn về ISO 27001, TCVN 14423...")

if user_input:
    timestamp = datetime.datetime.now().strftime('%H:%M')
    
    # Add user message
    st.session_state.messages.append({
        "role": "user",
        "content": user_input,
        "timestamp": timestamp
    })
    
    # Get bot response
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
    
    # Add bot response
    st.session_state.messages.append({
        "role": "assistant",
        "content": bot_reply,
        "timestamp": datetime.datetime.now().strftime('%H:%M')
    })
    
    # Save to session if new
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
