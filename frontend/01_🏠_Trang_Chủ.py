import streamlit as st
from utils.theme_loader import load_theme, hide_streamlit_style
from utils.session import init_session

st.set_page_config(
    page_title="Trang chủ - PhoBERT AI",
    page_icon="🏠",
    layout="wide",
    initial_sidebar_state="expanded"
)

load_theme()
hide_streamlit_style()
init_session()

# Hero Section
st.markdown("""
<div class="hero-container">
    <div style="font-size: 3.5rem; margin-bottom: 1rem;">⚡</div>
    <h1>Nền Tảng AI Doanh Nghiệp</h1>
    <p style="font-size: 1.15rem !important; max-width: 700px; margin: 0 auto; color: #475569;">
        Giải pháp đánh giá tuân thủ ISO 27001 & TCVN 14423 tự động hóa.<br>
        Tích hợp công nghệ PhoBERT và Phi-3 Mini tối ưu cho tiếng Việt.
    </p>
    <div style="margin-top: 2rem;">
        <span class="status-badge">v2.5.0 Stable</span>
    </div>
</div>
""", unsafe_allow_html=True)

# System Status Section
st.markdown("### 📡 Trạng thái Hệ thống")
col1, col2, col3 = st.columns(3)

with col1:
    st.markdown("""
    <div class="service-card" style="display:block; text-align:center;">
        <div style="font-weight:600; color:#64748B; font-size:0.875rem; text-transform:uppercase; margin-bottom:0.5rem;">Dịch vụ Backend</div>
        <div style="font-size:1.875rem; font-weight:700; color:#0F172A; margin-bottom:0.5rem;">Ready</div>
        <span class="status-badge">Online</span>
        <div style="font-size:0.8rem; color:#64748B; margin-top:0.5rem;">Port: 8000</div>
    </div>
    """, unsafe_allow_html=True)

with col2:
    st.markdown("""
    <div class="service-card" style="display:block; text-align:center;">
        <div style="font-weight:600; color:#64748B; font-size:0.875rem; text-transform:uppercase; margin-bottom:0.5rem;">AI Engine</div>
        <div style="font-size:1.875rem; font-weight:700; color:#0F172A; margin-bottom:0.5rem;">Phi-3 Mini</div>
        <span class="status-badge loading">Initializing</span>
        <div style="font-size:0.8rem; color:#64748B; margin-top:0.5rem;">CPU Mode</div>
    </div>
    """, unsafe_allow_html=True)

with col3:
    st.markdown("""
    <div class="service-card" style="display:block; text-align:center;">
        <div style="font-weight:600; color:#64748B; font-size:0.875rem; text-transform:uppercase; margin-bottom:0.5rem;">Thời gian hoạt động</div>
        <div style="font-size:1.875rem; font-weight:700; color:#0F172A; margin-bottom:0.5rem;">24d 14h</div>
        <span class="status-badge">99.9%</span>
        <div style="font-size:0.8rem; color:#64748B; margin-top:0.5rem;">Last restart: 15m ago</div>
    </div>
    """, unsafe_allow_html=True)

st.markdown("<br>", unsafe_allow_html=True)

# Main Features
st.markdown("### 🚀 Chức năng nghiệp vụ")
col1, col2, col3 = st.columns(3)

with col1:
    st.markdown("""
    <div class="feature-card">
        <div class="feature-icon">💬</div>
        <h4>Trợ lý AI Thông minh</h4>
        <p style="font-size:0.9rem; margin-bottom:1.5rem;">Hỗ trợ giải đáp nghiệp vụ, tra cứu văn bản pháp luật và quy trình nội bộ.</p>
    </div>
    """, unsafe_allow_html=True)
    if st.button("Truy cập Chat Bot", key="btn_chat", use_container_width=True):
        st.switch_page("pages/02_💬_Chat_Bot.py")

with col2:
    st.markdown("""
    <div class="feature-card">
        <div class="feature-icon">📋</div>
        <h4>Đánh giá ISO 27001</h4>
        <p style="font-size:0.9rem; margin-bottom:1.5rem;">Form đánh giá mức độ tuân thủ tiêu chuẩn bảo mật với report tự động.</p>
    </div>
    """, unsafe_allow_html=True)
    if st.button("Mở Form Đánh giá", key="btn_form", use_container_width=True):
        st.switch_page("pages/03_📋_Đánh_Giá_ISO.py")

with col3:
    st.markdown("""
    <div class="feature-card">
        <div class="feature-icon">📊</div>
        <h4>Thống kê & Báo cáo</h4>
        <p style="font-size:0.9rem; margin-bottom:1.5rem;">Dashboard thống kê hiệu năng server và mức độ sử dụng tài nguyên.</p>
    </div>
    """, unsafe_allow_html=True)
    if st.button("Xem Thống kê", key="btn_analytics", use_container_width=True):
        st.switch_page("pages/04_📊_Thống_Kê.py")

st.markdown("""
<div style="text-align: center; margin-top: 4rem; padding-top: 2rem; border-top: 1px solid #E2E8F0; color: #94A3B8; font-size: 0.875rem;">
    &copy; 2026 PhoBERT AI Platform. Enterprise Edition. <br>
    Powered by FastAPI & Streamlit.
</div>
""", unsafe_allow_html=True)
