import streamlit as st

def render_message(role: str, content: str):
    """Render chat message with HTML"""
    avatar = "👤" if role == "user" else "🤖"
    css_class = "user-message" if role == "user" else "bot-message"
    
    html = f"""
    <div class="chat-message {css_class}">
        <div class="avatar">{avatar}</div>
        <div class="message-content">{content}</div>
    </div>
    """
    st.markdown(html, unsafe_allow_html=True)
