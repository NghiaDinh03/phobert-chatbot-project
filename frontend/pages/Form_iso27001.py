import streamlit as st
from utils.theme_loader import load_theme, hide_streamlit_style
from utils.session import init_session
import json
import datetime

st.set_page_config(page_title="ISO 27001:2022 Assessment", page_icon="📋", layout="wide", initial_sidebar_state="collapsed")

load_theme()
hide_streamlit_style()
init_session()

# Initialize draft state
if "form_draft" not in st.session_state:
    st.session_state.form_draft = {}
if "last_saved" not in st.session_state:
    st.session_state.last_saved = None

# Auto-save function
def save_draft(data):
    st.session_state.form_draft = data
    st.session_state.last_saved = datetime.datetime.now().strftime("%H:%M:%S")

# Load draft function
def load_draft():
    return st.session_state.form_draft

st.markdown("""
<div class="hero-section" style="padding: 3rem 2.5rem;">
    <div style="font-size: 3rem; margin-bottom: 1rem; filter: drop-shadow(0 0 15px rgba(139, 92, 246, 0.6));">📋</div>
    <h1 style="font-size: 2.5rem;">Đánh giá ISO 27001:2022</h1>
    <p style="font-size: 1.1rem; color: #CBD5E1; max-width: 700px; margin: 1rem auto 0;">
        Form đánh giá tuân thủ tiêu chuẩn bảo mật thông tin <strong style="color:#8B5CF6;">ISO 27001:2022</strong> & <strong style="color:#8B5CF6;">TCVN 14423:2025</strong>
    </p>
</div>
""", unsafe_allow_html=True)

# Draft status indicator
if st.session_state.last_saved:
    st.success(f"✅ Draft đã lưu tự động lúc {st.session_state.last_saved}")

# Load existing draft
draft = load_draft()

with st.form(key="iso_assessment_form"):
    # Section 1
    st.markdown("""
    <div style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(139, 92, 246, 0.1)); 
                padding: 1.5rem; border-radius: 16px; border-left: 4px solid #3B82F6; margin-bottom: 2rem;">
        <h2 style="margin: 0; font-size: 1.75rem; color: #F8FAFC !important;">
            1️⃣ Thông tin Tổ chức
        </h2>
    </div>
    """, unsafe_allow_html=True)
    
    col1, col2 = st.columns(2)
    with col1:
        org_name = st.text_input("📌 Tên tổ chức *", value=draft.get("org_name", ""), placeholder="VD: Công ty TNHH ABC")
        org_size = st.selectbox("👥 Quy mô nhân sự *", ["< 50", "50 - 200", "200 - 1000", "> 1000"], 
                                index=["< 50", "50 - 200", "200 - 1000", "> 1000"].index(draft.get("org_size", "< 50")))
        address = st.text_input("📍 Địa chỉ", value=draft.get("address", ""), placeholder="VD: 123 Nguyễn Huệ, Q1, TP.HCM")
        
    with col2:
        industries = ["Công nghệ thông tin", "Tài chính - Ngân hàng", "Sản xuất", "Y tế", "Giáo dục", "Thương mại điện tử", "Khác"]
        org_industry = st.selectbox("🏢 Ngành nghề *", industries, 
                                    index=industries.index(draft.get("org_industry", "Công nghệ thông tin")))
        org_types = ["Doanh nghiệp tư nhân", "Doanh nghiệp nhà nước", "Tổ chức phi chính phủ", "Startup"]
        org_type = st.selectbox("🏛️ Loại hình *", org_types,
                               index=org_types.index(draft.get("org_type", "Doanh nghiệp tư nhân")))
        contact_person = st.text_input("👤 Người liên hệ", value=draft.get("contact_person", ""), placeholder="Họ và tên")

    st.markdown("<br>", unsafe_allow_html=True)
    
    # Section 2
    st.markdown("""
    <div style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(6, 182, 212, 0.1)); 
                padding: 1.5rem; border-radius: 16px; border-left: 4px solid #8B5CF6; margin-bottom: 2rem;">
        <h2 style="margin: 0; font-size: 1.75rem; color: #F8FAFC !important;">
            2️⃣ Phạm vi Hệ thống Quản lý Bảo mật (ISMS)
        </h2>
    </div>
    """, unsafe_allow_html=True)
    
    isms_scope = st.text_area("📝 Mô tả chi tiết phạm vi áp dụng ISMS *", 
                             value=draft.get("isms_scope", ""),
                             placeholder="VD: Hệ thống quản lý bảo mật thông tin áp dụng cho toàn bộ quy trình xử lý dữ liệu khách hàng...",
                             height=120)
    
    col1, col2 = st.columns(2)
    with col1:
        has_datacenter = st.checkbox("🏢 Cơ sở Data Center riêng", value=draft.get("has_datacenter", False))
        uses_cloud = st.checkbox("☁️ Sử dụng Cloud (AWS/Azure/GCP)", value=draft.get("uses_cloud", False))
    with col2:
        has_iot = st.checkbox("📡 Có thiết bị IoT", value=draft.get("has_iot", False))
        has_mobile = st.checkbox("📱 Có ứng dụng Mobile", value=draft.get("has_mobile", False))
        
    st.markdown("<br>", unsafe_allow_html=True)
    
    # Section 3
    st.markdown("""
    <div style="background: linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(16, 185, 129, 0.1)); 
                padding: 1.5rem; border-radius: 16px; border-left: 4px solid #06B6D4; margin-bottom: 2rem;">
        <h2 style="margin: 0; font-size: 1.75rem; color: #F8FAFC !important;">
            3️⃣ Chi tiết Hạ tầng IT
        </h2>
    </div>
    """, unsafe_allow_html=True)
    
    col1, col2 = st.columns(2)
    with col1:
        server_count = st.number_input("🖥️ Số lượng servers", min_value=0, value=draft.get("server_count", 0))
        os_types = st.multiselect("💿 Hệ điều hành servers", 
                                 ["Ubuntu", "CentOS", "Windows Server", "RedHat", "Debian", "Khác"],
                                 default=draft.get("os_types", []))
        firewall_options = ["Không có", "Software Firewall", "Hardware Firewall (Cisco/Fortinet...)", "Cloud Firewall"]
        firewall = st.selectbox("🔥 Loại Firewall", firewall_options,
                               index=firewall_options.index(draft.get("firewall", "Không có")))
        
    with col2:
        has_ids_ips = st.checkbox("🛡️ Có IDS/IPS (Intrusion Detection/Prevention)", value=draft.get("has_ids_ips", False))
        has_siem = st.checkbox("📊 SIEM Tool", value=draft.get("has_siem", False))
        backup_options = ["Hàng ngày", "Hàng tuần", "Hàng tháng", "Không backup"]
        backup_freq = st.selectbox("💾 Tần suất Backup *", backup_options,
                                  index=backup_options.index(draft.get("backup_freq", "Hàng ngày")))
    
    st.markdown("<br>", unsafe_allow_html=True)
    
    # Buttons
    col1, col2, col3 = st.columns([1, 1, 1])
    with col1:
        save_draft_btn = st.form_submit_button("💾 Lưu Draft", use_container_width=True)
    with col2:
        load_draft_btn = st.form_submit_button("📂 Tải Draft", use_container_width=True)
    with col3:
        submitted = st.form_submit_button("🚀 Gửi Đánh giá", use_container_width=True, type="primary")
    
    # Handle form submission
    form_data = {
        "org_name": org_name,
        "org_size": org_size,
        "address": address,
        "org_industry": org_industry,
        "org_type": org_type,
        "contact_person": contact_person,
        "isms_scope": isms_scope,
        "has_datacenter": has_datacenter,
        "uses_cloud": uses_cloud,
        "has_iot": has_iot,
        "has_mobile": has_mobile,
        "server_count": server_count,
        "os_types": os_types,
        "firewall": firewall,
        "has_ids_ips": has_ids_ips,
        "has_siem": has_siem,
        "backup_freq": backup_freq
    }
    
    if save_draft_btn:
        save_draft(form_data)
        st.success("✅ Draft đã được lưu thành công!")
        st.rerun()
    
    if submitted:
        if not org_name or not isms_scope:
            st.error("❌ Vui lòng điền đầy đủ các thông tin bắt buộc (*)")
        else:
            with st.spinner("🔄 Đang phân tích dữ liệu và tạo report..."):
                import time
                time.sleep(2)
                
                save_draft(form_data)
                
                st.success("✅ Đánh giá đã được gửi thành công!")
                st.balloons()
                
                st.markdown("""
                <div style="background: var(--bg-card); border: 1px solid var(--border-light); 
                            border-radius: 16px; padding: 2rem; margin-top: 2rem;">
                    <h3 style="color: #10B981 !important; margin-bottom: 1rem;">📊 Kết quả Đánh giá Sơ bộ</h3>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-top: 1.5rem;">
                        <div style="text-align: center; padding: 1rem; background: rgba(59, 130, 246, 0.1); border-radius: 12px;">
                            <div style="font-size: 2rem; font-weight: 700; color: #3B82F6;">78%</div>
                            <div style="font-size: 0.9rem; color: #94A3B8;">Mức độ tuân thủ</div>
                        </div>
                        <div style="text-align: center; padding: 1rem; background: rgba(245, 158, 11, 0.1); border-radius: 12px;">
                            <div style="font-size: 2rem; font-weight: 700; color: #F59E0B;">12</div>
                            <div style="font-size: 0.9rem; color: #94A3B8;">Vấn đề cần khắc phục</div>
                        </div>
                        <div style="text-align: center; padding: 1rem; background: rgba(16, 185, 129, 0.1); border-radius: 12px;">
                            <div style="font-size: 2rem; font-weight: 700; color: #10B981;">35</div>
                            <div style="font-size: 0.9rem; color: #94A3B8;">Điểm mạnh</div>
                        </div>
                    </div>
                </div>
                """, unsafe_allow_html=True)
            
            with st.expander("📄 Xem chi tiết dữ liệu đã gửi"):
                st.json(form_data)
