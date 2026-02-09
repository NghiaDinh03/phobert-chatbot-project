import streamlit as st
from utils.theme_loader import load_theme, hide_streamlit_style
from utils.session import init_session
import json
import datetime

st.set_page_config(page_title="ISO 27001:2022 Assessment", page_icon="📋", layout="wide", initial_sidebar_state="collapsed")

load_theme()
hide_streamlit_style()

st.markdown("""
<style>
    /* Custom Button Styling */
    div[data-testid="stFormSubmitButton"] button {
        background-color: #0F172A !important;  /* Nền đen/tối */
        color: #E2E8F0 !important;             /* Chữ sáng */
        border: 1px solid #334155 !important;  /* Viền xám tối */
        padding: 0.5rem 1rem !important;
        border-radius: 8px !important;
        font-weight: 600 !important;
        transition: all 0.2s ease-in-out !important;
    }
    
    div[data-testid="stFormSubmitButton"] button:hover {
        background-color: #1E293B !important;
        border-color: #64748B !important;
        transform: translateY(-2px);
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5);
    }

    div[data-testid="stFormSubmitButton"] button:active {
        transform: translateY(0);
    }
    
    /* Primary button (Gửi đánh giá) */
    div[data-testid="stFormSubmitButton"] button[kind="primary"] {
        background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%) !important;
        border: none !important;
        color: #FFFFFF !important;
        box-shadow: 0 4px 15px rgba(124, 58, 237, 0.3) !important;
    }

    div[data-testid="stFormSubmitButton"] button[kind="primary"]:hover {
        box-shadow: 0 6px 20px rgba(124, 58, 237, 0.5) !important;
        filter: brightness(1.1);
    }
    
    /* --- Deep Dark Mode Input Styling --- */
    
    /* 1. Base Input Fields (Text, Number, TextArea) */
    .stTextInput input, .stNumberInput input, .stTextArea textarea {
        background-color: #0F172A !important;
        color: #F8FAFC !important;
        border: 1px solid #334155 !important;
        caret-color: #3B82F6 !important;
    }
    
    /* 2. Selectbox & Multiselect Containers */
    div[data-baseweb="select"] > div {
        background-color: #0F172A !important;
        border-color: #334155 !important;
        color: #F8FAFC !important;
    }
    
    div[data-baseweb="select"] span {
        color: #F8FAFC !important;
    }
    
    /* 3. Dropdown Menu / Popover (FIXED) */
    div[data-baseweb="popover"] {
        background-color: #1E293B !important;
        border: 1px solid #475569 !important;
        z-index: 999999 !important; /* Ensure on top */
    }
    
    div[data-baseweb="popover"] > div {
        background-color: #1E293B !important;
    }
    
    ul[data-baseweb="menu"], ul[role="listbox"] {
        background-color: #1E293B !important;
        padding: 0 !important;
    }
    
    /* 4. Dropdown Options */
    li[data-baseweb="option"], li[role="option"] {
        background-color: #1E293B !important;
        color: #E2E8F0 !important; /* Text color fixed */
    }
    
    /* Force all text inside options to be light */
    li[data-baseweb="option"] *, li[role="option"] * {
        color: #E2E8F0 !important;
    }
    
    /* Hover & Selected States */
    li[data-baseweb="option"]:hover, 
    li[role="option"]:hover,
    li[data-baseweb="option"][aria-selected="true"],
    li[role="option"][aria-selected="true"] {
        background-color: #334155 !important;
        color: #FFFFFF !important;
    }
    
    li[data-baseweb="option"]:hover *, 
    li[role="option"][aria-selected="true"] * {
        color: #FFFFFF !important;
    }
    
    /* 5. Multiselect Tags */
    span[data-baseweb="tag"] {
        background-color: #3B82F6 !important;
        color: #FFFFFF !important; 
    }
    span[data-baseweb="tag"] span {
        color: #FFFFFF !important;
    }
    
    /* 6. Checkbox & Radio Labels */
    .stCheckbox label p, .stRadio label p {
        color: #E2E8F0 !important;
    }
    
    /* 7. Focus States */
    .stTextInput input:focus, .stTextArea textarea:focus, div[data-baseweb="select"] > div:focus-within {
        border-color: #8B5CF6 !important;
        box-shadow: 0 0 0 1px #8B5CF6 !important;
    }
    
    /* 8. Fix Selectbox Display Value Visibility (Final) */
    /* Target the exact value container structure */
    div[data-baseweb="select"] > div {
        background-color: #1E293B !important;
        border-color: #334155 !important;
        color: #F8FAFC !important;
    }

    /* Force all text inside the selectbox to be white */
    div[data-baseweb="select"] > div * {
        color: #F8FAFC !important;
        opacity: 1 !important;
        -webkit-text-fill-color: #F8FAFC !important;
    }
    
    /* Specific fix for the selected value container which might be getting overridden */
    div[data-baseweb="select"] .st-emotion-cache-1l1qom0, 
    div[data-baseweb="select"] [data-testid="stMarkdownContainer"] p {
        color: #F8FAFC !important; 
    }
    
    /* Input element (Search box) */
    div[data-baseweb="select"] input {
        color: #F8FAFC !important;
        caret-color: #3B82F6 !important;
    }
    
    /* Dropdown menu items */
    li[role="option"] {
        color: #F8FAFC !important;
        background-color: #1E293B !important;
    }
    
    /* Keep Icons Gray */
    div[data-baseweb="select"] svg, div[data-baseweb="select"] svg path {
        color: #94A3B8 !important;
        fill: #94A3B8 !important;
    }
    
    svg[data-baseweb="icon"] {
        fill: #94A3B8 !important;
    }
    
    [data-testid="stFormSubmitButton"] {
        margin-top: 1rem;
    }
    
    .stForm {
        background: transparent !important;
    }
    
    .stForm > div {
        gap: 0.5rem !important;
    }
    
    [data-testid="column"] {
        display: flex;
        flex-direction: column;
    }
    
    [data-testid="column"] > div {
        flex: 1;
    }
    
    .stTextInput, .stSelectbox, .stNumberInput, .stTextArea, .stMultiSelect {
        margin-bottom: 0.75rem !important;
    }
    
    .stCheckbox {
        margin: 0.5rem 0 !important;
    }
</style>
""", unsafe_allow_html=True)
init_session()

# Initialize draft state
if "form_draft" not in st.session_state:
    st.session_state.form_draft = {}
if "last_saved" not in st.session_state:
    st.session_state.last_saved = None

# Auto-save function
import os

# Define draft file path (UPDATED: frontend/data/)
DRAFT_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data', 'form_drafts.json')

# Enhanced save_draft function with persistence and history limit
def save_draft(data):
    try:
        # Ensure directory exists
        os.makedirs(os.path.dirname(DRAFT_FILE), exist_ok=True)
        
        # Load existing drafts
        drafts = []
        if os.path.exists(DRAFT_FILE):
            with open(DRAFT_FILE, 'r', encoding='utf-8') as f:
                drafts = json.load(f)
        
        # Add new draft
        new_draft = {
            "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "data": data
        }
        drafts.append(new_draft)
        
        # Sort by timestamp descending (newest first)
        drafts.sort(key=lambda x: x['timestamp'], reverse=True)
        
        # Keep only latest 3
        if len(drafts) > 3:
            drafts = drafts[:3]
            
        # Save back to file
        with open(DRAFT_FILE, 'w', encoding='utf-8') as f:
            json.dump(drafts, f, ensure_ascii=False, indent=4)
            
        st.session_state.last_saved = new_draft["timestamp"]
        st.toast(f"✅ Đã lưu bản nháp! (Lịch sử: {len(drafts)}/3 bản)", icon="💾")
        
    except Exception as e:
        st.error(f"Lỗi khi lưu draft: {e}")

# Enhanced load_draft function
def load_draft():
    try:
        if os.path.exists(DRAFT_FILE):
            with open(DRAFT_FILE, 'r', encoding='utf-8') as f:
                drafts = json.load(f)
            if drafts:
                # Return the latest draft data
                st.toast(f"📂 Đã tải bản nháp gần nhất ({drafts[0]['timestamp']})", icon="✅")
                return drafts[0]['data']
    except Exception as e:
        st.error(f"Lỗi khi tải draft: {e}")
    return {}

st.markdown("""
<div class="hero-section" style="padding: 3rem 2.5rem;">
    <div style="font-size: 3rem; margin-bottom: 1rem; filter: drop-shadow(0 0 15px rgba(139, 92, 246, 0.6));">📋</div>
    <h1 style="font-size: 2.5rem; color: #F8FAFC !important; -webkit-text-fill-color: #F8FAFC !important;">Đánh giá ISO 27001:2022</h1>
    <p style="font-size: 1.1rem; color: #CBD5E1; max-width: 700px; margin: 1rem auto 0;">
        Form đánh giá tuân thủ tiêu chuẩn bảo mật thông tin <strong style="color:#8B5CF6;">ISO 27001:2022</strong> & <strong style="color:#8B5CF6;">TCVN 14423:2025</strong>
    </p>
</div>
""", unsafe_allow_html=True)

# Draft status indicator
if st.session_state.last_saved:
    st.success(f"✅ Draft đã lưu tự động lúc {st.session_state.last_saved}")

# Load existing draft logic (remains same behavior for pre-filling)
draft = st.session_state.get("form_draft", {})
# Try loading from file if session is empty
if not draft:
    file_data = load_draft()
    if file_data:
        draft = file_data

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
    
    # Section 4
    st.markdown("""
    <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(245, 158, 11, 0.1)); 
                padding: 1.5rem; border-radius: 16px; border-left: 4px solid #10B981; margin-bottom: 2rem;">
        <h2 style="margin: 0; font-size: 1.75rem; color: #F8FAFC !important;">
            4️⃣ Tài sản & Dữ liệu Quan trọng
        </h2>
    </div>
    """, unsafe_allow_html=True)
    
    col1, col2 = st.columns(2)
    with col1:
        data_types = st.multiselect("📂 Loại dữ liệu xử lý *", 
                                   ["Thông tin cá nhân (PII)", "Dữ liệu tài chính/Thẻ", "Sở hữu trí tuệ (IP)", "Dữ liệu y tế (PHI)", "Bí mật kinh doanh"],
                                   default=draft.get("data_types", []))
        storage_locations = st.multiselect("💾 Nơi lưu trữ chính", 
                                          ["On-premise Servers", "Cloud Storage (S3/Blob)", "Employee Devices", "Third-party SaaS", "Physical Archives"],
                                          default=draft.get("storage_locations", []))
        
    with col2:
        critical_assets = st.text_area("💎 Liệt kê các tài sản quan trọng nhất (Critical Assets)",
                                      value=draft.get("critical_assets", ""),
                                      placeholder="VD: Database khách hàng, Source code core system, Key quản trị...",
                                      height=100)
    
    st.markdown("<br>", unsafe_allow_html=True)

    # Section 5
    st.markdown("""
    <div style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(239, 68, 68, 0.1)); 
                padding: 1.5rem; border-radius: 16px; border-left: 4px solid #F59E0B; margin-bottom: 2rem;">
        <h2 style="margin: 0; font-size: 1.75rem; color: #F8FAFC !important;">
            5️⃣ Kiểm soát An toàn (Security Controls)
        </h2>
    </div>
    """, unsafe_allow_html=True)
    
    col1, col2 = st.columns(2)
    with col1:
        access_controls = st.multiselect("🔐 Kiểm soát truy cập (Access Control)", 
                                        ["MFA (Xác thực đa yếu tố)", "VPN cho truy cập từ xa", "Chính sách mật khẩu mạnh", "Privileged Access Management (PAM)", "Review quyền định kỳ"],
                                        default=draft.get("access_controls", []))
        endpoint_security = st.checkbox("🛡️ Có cài Antivirus/EDR trên 100% thiết bị", value=draft.get("endpoint_security", False))
        data_encryption = st.checkbox("🔒 Mã hóa dữ liệu (At rest & In transit)", value=draft.get("data_encryption", False))

    with col2:
        security_assessments = st.multiselect("🕵️ Đánh giá bảo mật định kỳ", 
                                             ["Penetration Testing", "Vulnerability Scanning", "Code Review", "Phishing Simulation", "Chưa thực hiện"],
                                             default=draft.get("security_assessments", []))
        has_incident_plan_old = st.checkbox("🚨 Có Quy trình Ứng phó sự cố (Old)", value=draft.get("has_incident_plan_old", False))
        security_training_old = st.checkbox("👨‍🏫 Đào tạo nhận thức bảo mật (Old)", value=draft.get("security_training_old", False))

    st.markdown("<br>", unsafe_allow_html=True)
    
    # Section 6: Additional Security Controls (New)
    st.markdown("""
    <div style="background: linear-gradient(135deg, rgba(236, 72, 153, 0.15), rgba(219, 39, 119, 0.1)); 
                padding: 1.5rem; border-radius: 16px; border-left: 4px solid #EC4899; margin-bottom: 2rem;">
        <h2 style="margin: 0; font-size: 1.75rem; color: #F8FAFC !important;">
            6️⃣ Bảo mật Nâng cao & Tuân thủ
        </h2>
    </div>
    """, unsafe_allow_html=True)
    
    col1, col2 = st.columns(2)
    with col1:
        auth_methods = st.multiselect("🔐 Phương thức xác thực (Auth Methods)", 
                                     ["Password", "MFA/2FA", "SSO", "Biometric", "Certificate-based"],
                                     default=draft.get("auth_methods", []))
        remote_access = st.multiselect("🌍 Truy cập từ xa (Remote Access)", 
                                      ["VPN", "VDI", "Zero Trust (ZTNA)", "Public Internet"],
                                      default=draft.get("remote_access", []))
        has_pam = st.checkbox("🔑 Có PAM (Privileged Access)", value=draft.get("has_pam", False))
    
    with col2:
        physical_security = st.multiselect("🏢 An ninh vật lý",
                                          ["CCTV", "Biometric Access", "Security Guards", "Restricted Areas", "None"],
                                          default=draft.get("physical_security", []))
        compliance_req = st.multiselect("⚖️ Tuân thủ khác",
                                       ["GDPR", "PCI DSS", "HIPAA", "Luật ANM", "PDP Decree"],
                                       default=draft.get("compliance_req", []))
        has_network_seg = st.checkbox("🕸️ Phân vùng mạng (Network Seg)", value=draft.get("has_network_seg", False))

    st.markdown("<br>", unsafe_allow_html=True)
    
    # Section 7: Governance (New)
    st.markdown("""
    <div style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(79, 70, 229, 0.1)); 
                padding: 1.5rem; border-radius: 16px; border-left: 4px solid #6366F1; margin-bottom: 2rem;">
        <h2 style="margin: 0; font-size: 1.75rem; color: #F8FAFC !important;">
            7️⃣ Quản trị & Chính sách
        </h2>
    </div>
    """, unsafe_allow_html=True)
    
    col1, col2 = st.columns(2)
    with col1:
        has_sec_policy = st.checkbox("📜 Có Chính sách ATTT (ISP)", value=draft.get("has_sec_policy", False))
        has_nda = st.checkbox("✍️ Ký NDA với nhân viên/đối tác", value=draft.get("has_nda", False))
        review_access = st.selectbox("📅 Tần suất review quyền truy cập", 
                                    ["Hàng tháng", "Hàng quý", "Hàng năm", "Không thực hiện"],
                                    index=["Hàng tháng", "Hàng quý", "Hàng năm", "Không thực hiện"].index(draft.get("review_access", "Hàng năm")))
        
    with col2:
        has_incident_plan = st.checkbox("🚨 Quy trình Ứng phó sự cố (New)", value=draft.get("has_incident_plan", False))
        has_bcp_dr = st.checkbox("🔄 Kế hoạch BCP/DR", value=draft.get("has_bcp_dr", False))
        vendor_mgmt = st.checkbox("🤝 Quản lý rủi ro bên thứ 3 (Vendor)", value=draft.get("vendor_mgmt", False))
        security_training = st.selectbox("🎓 Đào tạo nhận thức", 
                                        ["Onboarding", "Hàng năm", "Định kỳ", "Chưa có"],
                                        index=["Onboarding", "Hàng năm", "Định kỳ", "Chưa có"].index(draft.get("security_training", "Chưa có")))

    st.markdown("<br>", unsafe_allow_html=True)
    
    # Buttons
    col1, col2, col3, col4 = st.columns([1, 1, 1, 1])
    with col1:
        home_btn = st.form_submit_button("🏠 Trang chủ", use_container_width=True)
    with col2:
        save_draft_btn = st.form_submit_button("💾 Lưu Draft", use_container_width=True)
    with col3:
        load_draft_btn = st.form_submit_button("📂 Tải Draft", use_container_width=True)
    with col4:
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
        "backup_freq": backup_freq,
        "auth_methods": auth_methods,
        "remote_access": remote_access,
        "has_pam": has_pam,
        "has_network_seg": has_network_seg,
        "review_access": review_access,
        "has_sec_policy": has_sec_policy,
        "has_nda": has_nda,
        "security_training": security_training,
        "has_incident_plan": has_incident_plan,
        "has_bcp_dr": has_bcp_dr,
        "vendor_mgmt": vendor_mgmt,
        "physical_security": physical_security,
        "compliance_req": compliance_req,
        "data_types": data_types,
        "storage_locations": storage_locations,
        "critical_assets": critical_assets,
        "access_controls": access_controls,
        "endpoint_security": endpoint_security,
        "data_encryption": data_encryption,
        "security_assessments": security_assessments,
        "has_incident_plan_old": has_incident_plan_old,
        "security_training_old": security_training_old
    }
    
    if home_btn:
        st.switch_page("app.py")

    if save_draft_btn:
        save_draft(form_data)
        st.rerun()
    
    if load_draft_btn:
        loaded_data = load_draft()
        if loaded_data:
            st.session_state.form_draft = loaded_data
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
                
                # Mock result calculation based on inputs
                compliance_score = 40 # Base score
                if has_sec_policy: compliance_score += 10
                if "MFA/2FA" in auth_methods: compliance_score += 10
                if has_incident_plan: compliance_score += 10
                if backup_freq != "Không backup": compliance_score += 10
                if security_training != "Chưa có": compliance_score += 10
                if has_ids_ips or has_siem: compliance_score += 5
                if has_pam: compliance_score += 5
                
                issues = 0
                if not has_sec_policy: issues += 1
                if not has_incident_plan: issues += 1
                if "MFA/2FA" not in auth_methods: issues += 1
                if backup_freq == "Không backup": issues += 1
                
                strengths = 0
                if has_siem: strengths += 1
                if has_pam: strengths += 1
                if "Zero Trust Network Access" in remote_access: strengths += 1

                st.markdown(f"""
                <div style="background: var(--bg-card); border: 1px solid var(--border-light); 
                            border-radius: 16px; padding: 2rem; margin-top: 2rem;">
                    <h3 style="color: #10B981 !important; margin-bottom: 1rem;">📊 Kết quả Đánh giá Sơ bộ</h3>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-top: 1.5rem;">
                        <div style="text-align: center; padding: 1rem; background: rgba(59, 130, 246, 0.1); border-radius: 12px;">
                            <div style="font-size: 2rem; font-weight: 700; color: #3B82F6;">{compliance_score}%</div>
                            <div style="font-size: 0.9rem; color: #94A3B8;">Mức độ tuân thủ (Ước tính)</div>
                        </div>
                        <div style="text-align: center; padding: 1rem; background: rgba(245, 158, 11, 0.1); border-radius: 12px;">
                            <div style="font-size: 2rem; font-weight: 700; color: #F59E0B;">{issues}</div>
                            <div style="font-size: 0.9rem; color: #94A3B8;">Vấn đề trọng yếu</div>
                        </div>
                        <div style="text-align: center; padding: 1rem; background: rgba(16, 185, 129, 0.1); border-radius: 12px;">
                            <div style="font-size: 2rem; font-weight: 700; color: #10B981;">{strengths}</div>
                            <div style="font-size: 0.9rem; color: #94A3B8;">Điểm mạnh nổi bật</div>
                        </div>
                    </div>
                    <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--border);">
                        <p style="color: #CBD5E1; text-align: center; font-style: italic;">
                            * Đây là đánh giá sơ bộ dựa trên thông tin cung cấp. Để có báo cáo chi tiết và lộ trình triển khai cụ thể, 
                            vui lòng liên hệ chuyên gia hoặc sử dụng tính năng Chatbot để được tư vấn sâu hơn.
                        </p>
                    </div>
                </div>
                """, unsafe_allow_html=True)
            
            with st.expander("📄 Xem chi tiết dữ liệu đã gửi"):
                st.json(form_data)
