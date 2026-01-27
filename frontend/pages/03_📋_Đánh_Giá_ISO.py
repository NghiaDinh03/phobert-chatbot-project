import streamlit as st
from utils.theme_loader import load_theme, hide_streamlit_style
from utils.session import init_session
import json

st.set_page_config(page_title="Đánh giá ISO 27001", page_icon="📋", layout="wide")

load_theme()
hide_streamlit_style()
init_session()

# Manual Sidebar is removed in favor of native navigation

st.markdown("""
<div style="text-align: center; background: white; padding: 2rem; border-radius: 12px; border: 1px solid #E2E8F0; margin-bottom: 2rem;">
    <h1 style="color: #0F172A; margin-bottom: 0.5rem;">Đánh giá ISO 27001:2022</h1>
    <p style="color: #64748B;">Đánh giá mức độ tuân thủ tiêu chuẩn bảo mật thông tin ISO 27001:2022 & TCVN 14423:2025</p>
</div>
""", unsafe_allow_html=True)


with st.form(key="iso_assessment_form"):
    st.markdown("### 1️⃣ Thông tin Tổ chức")
    
    col1, col2 = st.columns(2)
    with col1:
        org_name = st.text_input("Tên tổ chức *", placeholder="VD: Công ty TNHH ABC")
        org_size = st.selectbox("Quy mô nhân sự *", ["< 50", "50 - 200", "200 - 1000", "> 1000"])
        address = st.text_input("Địa chỉ", placeholder="VD: 123 Nguyễn Huệ, Q1, TP.HCM")
        
    with col2:
        org_industry = st.selectbox("Ngành nghề *", ["Công nghệ thông tin", "Tài chính - Ngân hàng", "Sản xuất", "Y tế", "Giáo dục", "Thương mại điện tử", "Khác"])
        org_type = st.selectbox("Loại hình *", ["Doanh nghiệp tư nhân", "Doanh nghiệp nhà nước", "Tổ chức phi chính phủ", "Startup"])
        contact_person = st.text_input("Người liên hệ", placeholder="Họ tên")

    st.markdown("---")
    st.markdown("### 2️⃣ Phạm vi Hệ thống Quản lý Bảo mật Thông tin (ISMS)")
    
    isms_scope = st.text_area("Mô tả chi tiết phạm vi áp dụng ISMS *", 
                             placeholder="VD: Hệ thống quản lý bảo mật thông tin áp dụng cho toàn bộ quy trình xử lý dữ liệu khách hàng, bao gồm: thu thập, lưu trữ, xử lý, truyền tải và hủy dữ liệu. Phạm vi bao gồm data center tại Hà Nội và TP.HCM...",
                             height=100)
    
    col1, col2 = st.columns(2)
    with col1:
        st.checkbox("Cơ sở Data Center riêng")
        st.checkbox("Sử dụng Cloud (AWS/Azure/GCP)")
    with col2:
        st.checkbox("Có thiết bị IoT")
        st.checkbox("Có ứng dụng Mobile")
        
    st.markdown("---")
    st.markdown("### 3️⃣ Chi tiết Hạ tầng IT")
    
    col1, col2 = st.columns(2)
    with col1:
        server_count = st.number_input("Số lượng servers", min_value=0, value=0)
        os_types = st.multiselect("Hệ điều hành servers", ["Ubuntu", "CentOS", "Windows Server", "RedHat", "Khác"])
        firewall = st.selectbox("Loại Firewall", ["Không có", "Software Firewall", "Hardware Firewall (Cisco/Fortinet...)", "Cloud Firewall"])
        
    with col2:
        st.checkbox("Có IDS/IPS (Intrusion Detection/Prevention)")
        st.checkbox("SIEM Tool")
        backup_freq = st.selectbox("Tần suất Backup *", ["Hàng ngày", "Hàng tuần", "Hàng tháng", "Không backup"])
        
    submitted = st.form_submit_button("🚀 Gửi Đánh giá")
    
    if submitted:
        if not org_name or not isms_scope:
            st.error("Vui lòng điền đầy đủ các thông tin bắt buộc (*)")
        else:
            with st.spinner("Đang phân tích dữ liệu..."):
                import time
                time.sleep(1.5) 
                
                # Mock processing
                form_data = {
                    "organization": org_name,
                    "industry": org_industry,
                    "size": org_size,
                    "scope": isms_scope,
                    "servers": server_count,
                    "backup": backup_freq
                }
                
                st.success("✅ Đã gửi đánh giá thành công! Hệ thống đang xử lý report.")
                st.balloons()
                
                # In real implementation, this would send data to backend
                # response = requests.post("http://backend:8000/api/iso/assess", json=form_data)
                
            st.markdown("---")
            with st.expander("📄 Xem chi tiết dữ liệu đã gửi"):
                st.json(form_data)
