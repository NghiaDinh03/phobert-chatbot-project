import streamlit as st
from utils.theme_loader import load_theme, hide_streamlit_style
from utils.session import init_session
import datetime

st.set_page_config(page_title="AI Chat Bot", page_icon="💬", layout="wide")

load_theme()
hide_streamlit_style()
init_session()

if "messages" not in st.session_state:
    st.session_state.messages = []
if "chat_history" not in st.session_state:
    st.session_state.chat_history = []
if "current_session" not in st.session_state:
    st.session_state.current_session = None

with st.sidebar:
    st.title("Lịch sử Chat")
    
    if st.button("➕ Cuộc hội thoại mới", use_container_width=True, key="new_chat"):
        st.session_state.messages = []
        st.session_state.current_session = f"session_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}"
        st.rerun()
    
    if st.session_state.chat_history:
        for idx, session in enumerate(reversed(st.session_state.chat_history)):
            title = session['title'][:25] + "..." if len(session['title']) > 25 else session['title']
            col1, col2 = st.columns([5, 1])
            with col1:
                if st.button(f"📄 {title}", key=f"load_{idx}", use_container_width=True):
                    st.session_state.messages = session['messages']
                    st.session_state.current_session = session['id']
                    st.rerun()
            with col2:
                if st.button("×", key=f"del_{idx}"):
                    st.session_state.chat_history = [s for s in st.session_state.chat_history if s['id'] != session['id']]
                    if st.session_state.current_session == session['id']:
                        st.session_state.messages = []
                        st.session_state.current_session = None
                    st.rerun()
    else:
        st.caption("Chưa có lịch sử")

# Chat Interface
st.markdown("""
<div style="border-bottom:1px solid #E2E8F0; padding-bottom:1rem; margin-bottom:1rem;">
    <h2 style="margin:0 !important; font-size:1.5rem !important;">Trợ lý AI Thông minh</h2>
    <p style="margin:0 !important; font-size:0.9rem !important;">Hỏi đáp về ISO 27001, quy trình bảo mật và tài liệu nội bộ.</p>
</div>
""", unsafe_allow_html=True)

chat_container = st.container()
with chat_container:
    if not st.session_state.messages:
        st.markdown("""
        <div style="text-align:center; padding:4rem 2rem; background:#F8FAFC; border-radius:12px; margin-top:2rem;">
            <div style="background:white; width:64px; height:64px; border-radius:12px; display:inline-flex; align-items:center; justify-content:center; box-shadow:0 1px 2px rgba(0,0,0,0.05); margin-bottom:1rem; font-size:2rem;">
                👋
            </div>
            <h3 style="color:#0F172A;">Tôi có thể giúp gì cho bạn hôm nay?</h3>
            <p style="color:#64748B; max-width:400px; margin:0 auto;">
                Tôi có thể giúp bạn rà soát văn bản, giải thích các điều khoản bảo mật hoặc soạn thảo chính sách.
            </p>
        </div>
        """, unsafe_allow_html=True)
    else:
        for message in st.session_state.messages:
            if message["role"] == "user":
                with st.chat_message("user", avatar="👤"):
                    st.write(message["content"])
            else:
                with st.chat_message("assistant", avatar="🤖"):
                    st.write(message["content"])

user_input = st.chat_input("Nhập câu hỏi của bạn...")

if user_input:
    st.session_state.messages.append({"role": "user", "content": user_input})
    
    with st.spinner("Đang xử lý..."):
        try:
            from services.api_client import APIClient
            
            session_id = st.session_state.current_session or "default"
            response = APIClient.chat(user_input, session_id)
            
            if "error" in response:
                bot_reply = f"Lỗi: {response['error']}"
            elif "response" in response:
                bot_reply = response["response"]
            else:
                bot_reply = "Lỗi hệ thống: Phản hồi không hợp lệ."
                
        except Exception as e:
            bot_reply = f"Lỗi kết nối: {str(e)}"
    
    st.session_state.messages.append({"role": "assistant", "content": bot_reply})
    
    if not st.session_state.current_session or not any(s['id'] == st.session_state.current_session for s in st.session_state.chat_history):
        session_id = f"session_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}"
        st.session_state.current_session = session_id
        st.session_state.chat_history.append({
            "id": session_id,
            "title": user_input[:40] + "..." if len(user_input) > 40 else user_input,
            "time": datetime.datetime.now().strftime('%H:%M'),
            "messages": st.session_state.messages.copy()
        })
    else:
        for session in st.session_state.chat_history:
            if session['id'] == st.session_state.current_session:
                session['messages'] = st.session_state.messages.copy()
                break
    
    st.rerun()
