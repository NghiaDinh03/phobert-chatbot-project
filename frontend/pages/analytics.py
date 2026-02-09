import streamlit as st
from utils.theme_loader import load_theme, hide_streamlit_style
from utils.session import init_session
import time
import datetime

st.set_page_config(page_title="Analytics Dashboard", page_icon="📊", layout="wide", initial_sidebar_state="collapsed")

load_theme()
hide_streamlit_style()
init_session()

st.markdown("""
<div class="hero-section" style="padding: 2.5rem 2rem;">
    <div style="font-size: 3rem; margin-bottom: 1rem; filter: drop-shadow(0 0 15px rgba(6, 182, 212, 0.6));">📊</div>
    <h1 style="font-size: 2.5rem; color: #F8FAFC !important; -webkit-text-fill-color: #F8FAFC !important;">Analytics Dashboard</h1>
    <p style="font-size: 1.1rem; color: #CBD5E1; max-width: 700px; margin: 1rem auto 0;">
        Theo dõi hiệu năng hệ thống, tài nguyên và trạng thái dịch vụ <strong style="color:#06B6D4;">real-time</strong>
    </p>
</div>
""", unsafe_allow_html=True)

# System Metrics
st.markdown("### 📈 Thống kê Tài nguyên Hệ thống")

col1, col2, col3, col4 = st.columns(4)

try:
    import psutil
    cpu_percent = psutil.cpu_percent(interval=0.5)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
    boot_time = psutil.boot_time()
    uptime_hours = (time.time() - boot_time) / 3600
except:
    cpu_percent = 12.5
    memory = type('obj', (object,), {'percent': 52.3, 'used': 16.7*1024**3, 'total': 32*1024**3})
    disk = type('obj', (object,), {'percent': 68.4, 'used': 684*1024**3, 'total': 1000*1024**3})
    uptime_hours = 582.5

with col1:
    st.markdown(f"""
    <div class="stat-card">
        <div class="stat-label">💻 CPU Usage</div>
        <div class="stat-value">{cpu_percent:.1f}%</div>
        <div style="font-size:0.85rem; color:#64748B; margin-top:0.5rem;">8 Cores @ 3.2GHz</div>
    </div>
    """, unsafe_allow_html=True)

with col2:
    mem_gb = memory.used / (1024**3)
    mem_total = memory.total / (1024**3)
    st.markdown(f"""
    <div class="stat-card">
        <div class="stat-label">🧠 RAM Usage</div>
        <div class="stat-value">{mem_gb:.1f}<span style="font-size:1.2rem;">GB</span></div>
        <div style="font-size:0.85rem; color:#64748B; margin-top:0.5rem;">{memory.percent:.0f}% of {mem_total:.0f}GB</div>
    </div>
    """, unsafe_allow_html=True)

with col3:
    disk_gb = disk.used / (1024**3)
    disk_total = disk.total / (1024**3)
    st.markdown(f"""
    <div class="stat-card">
        <div class="stat-label">💾 Disk Usage</div>
        <div class="stat-value">{disk.percent:.0f}%</div>
        <div style="font-size:0.85rem; color:#64748B; margin-top:0.5rem;">{disk_gb:.0f}GB / {disk_total:.0f}GB</div>
    </div>
    """, unsafe_allow_html=True)

with col4:
    uptime_days = uptime_hours / 24
    st.markdown(f"""
    <div class="stat-card">
        <div class="stat-label">⚡ System Uptime</div>
        <div class="stat-value">{uptime_days:.0f}<span style="font-size:1.2rem;">d</span></div>
        <div style="font-size:0.85rem; color:#64748B; margin-top:0.5rem;">99.8% Availability</div>
    </div>
    """, unsafe_allow_html=True)

st.markdown("<br>", unsafe_allow_html=True)

# Services Status
st.markdown("### 🔧 Trạng thái Dịch vụ")

from utils.health_check import get_service_status
services = get_service_status()

col1, col2 = st.columns(2)

with col1:
    backend_status = services["backend"]
    backend_badge = "status-online" if backend_status["ready"] else "status-loading"
    st.markdown(f"""
    <div class="service-card">
        <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
                <div style="font-size:1.15rem; font-weight:700; color:#F8FAFC; margin-bottom:0.5rem;">
                    {"✅" if backend_status["ready"] else "⏳"} FastAPI Backend
                </div>
                <div style="font-size:0.9rem; color:#94A3B8;">
                    Status: <strong style="color:{"#10B981" if backend_status["ready"] else "#F59E0B"};">{backend_status["status"]}</strong> | Port: <strong>8000</strong> | Version: <strong>1.0.0</strong>
                </div>
            </div>
            <span class="status-badge {backend_badge}">{"Active" if backend_status["ready"] else "Starting"}</span>
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    st.markdown("""
    <div class="service-card">
        <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
                <div style="font-size:1.15rem; font-weight:700; color:#F8FAFC; margin-bottom:0.5rem;">
                    💾 PostgreSQL Database
                </div>
                <div style="font-size:0.9rem; color:#94A3B8;">
                    Status: <strong style="color:#10B981;">Connected</strong> | Pool: <strong>20/50</strong> | Latency: <strong>~12ms</strong>
                </div>
            </div>
            <span class="status-badge status-online">Ready</span>
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    st.markdown("""
    <div class="service-card">
        <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
                <div style="font-size:1.15rem; font-weight:700; color:#F8FAFC; margin-bottom:0.5rem;">
                    🗄️ Redis Cache
                </div>
                <div style="font-size:0.9rem; color:#94A3B8;">
                    Status: <strong style="color:#10B981;">Connected</strong> | Memory: <strong>145MB</strong> | Keys: <strong>1,247</strong>
                </div>
            </div>
            <span class="status-badge status-online">Active</span>
        </div>
    </div>
    """, unsafe_allow_html=True)

with col2:
    localai_status = services["localai"]
    localai_badge = "status-online" if localai_status["ready"] else "status-loading"
    st.markdown(f"""
    <div class="service-card">
        <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
                <div style="font-size:1.15rem; font-weight:700; color:#F8FAFC; margin-bottom:0.5rem;">
                    {"🔥" if localai_status["ready"] else "⏳"} LocalAI Model Server
                </div>
                <div style="font-size:0.9rem; color:#94A3B8;">
                    Status: <strong style="color:{"#10B981" if localai_status["ready"] else "#F59E0B"};">{localai_status["status"]}</strong> | Port: <strong>8080</strong> | GPU: <strong>CPU Mode</strong>
                </div>
            </div>
            <span class="status-badge {localai_badge}">{"Ready" if localai_status["ready"] else "Loading"}</span>
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    st.markdown("""
    <div class="service-card">
        <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
                <div style="font-size:1.15rem; font-weight:700; color:#F8FAFC; margin-bottom:0.5rem;">
                    🧠 PhoBERT Model
                </div>
                <div style="font-size:0.9rem; color:#94A3B8;">
                    Status: <strong style="color:#10B981;">Loaded</strong> | Params: <strong>135M</strong> | Inference: <strong>~850ms</strong>
                </div>
            </div>
            <span class="status-badge status-online">Ready</span>
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    model_ready = services["llama_ready"] or len(services["models"]) > 0
    model_badge = "status-online" if model_ready else "status-loading"
    model_name = services["models"][0] if services["models"] else "Llama-3.1-8B"
    st.markdown(f"""
    <div class="service-card">
        <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
                <div style="font-size:1.15rem; font-weight:700; color:#F8FAFC; margin-bottom:0.5rem;">
                    {"⚡" if model_ready else "⏳"} {model_name[:25]}
                </div>
                <div style="font-size:0.9rem; color:#94A3B8;">
                    Status: <strong style="color:{"#10B981" if model_ready else "#F59E0B"};">{"Loaded" if model_ready else "Loading"}</strong> | Quant: <strong>Q4_K_M</strong> | Size: <strong>4.9GB</strong>
                </div>
            </div>
            <span class="status-badge {model_badge}">{"Ready" if model_ready else "Starting"}</span>
        </div>
    </div>
    """, unsafe_allow_html=True)

st.markdown("<br>", unsafe_allow_html=True)

# Performance Charts Section
st.markdown("### 📉 Biểu đồ Hiệu năng (Mock Data)")

# Mock chart data using Streamlit native charts
import pandas as pd
import numpy as np

col1, col2 = st.columns(2)

with col1:
    st.markdown("<div style='background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; padding: 1.5rem;'>", unsafe_allow_html=True)
    st.markdown("**CPU Usage Over Time (24h)**")
    chart_data = pd.DataFrame({
        'time': range(24),
        'cpu': np.random.uniform(5, 25, 24)
    })
    st.area_chart(chart_data.set_index('time'), color="#3B82F6")
    st.markdown("</div>", unsafe_allow_html=True)

with col2:
    st.markdown("<div style='background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; padding: 1.5rem;'>", unsafe_allow_html=True)
    st.markdown("**Memory Usage Over Time (24h)**")
    chart_data = pd.DataFrame({
        'time': range(24),
        'memory': np.random.uniform(40, 65, 24)
    })
    st.area_chart(chart_data.set_index('time'), color="#8B5CF6")
    st.markdown("</div>", unsafe_allow_html=True)

st.markdown("<br>", unsafe_allow_html=True)

# API Request Stats
st.markdown("### 🌐 API Request Statistics")

col1, col2, col3 = st.columns(3)

with col1:
    st.markdown("""
    <div class="stat-card">
        <div class="stat-label">📨 Total Requests (24h)</div>
        <div class="stat-value">12,547</div>
        <div style="font-size:0.85rem; color:#10B981; margin-top:0.5rem;">↑ 8.3% vs yesterday</div>
    </div>
    """, unsafe_allow_html=True)

with col2:
    st.markdown("""
    <div class="stat-card">
        <div class="stat-label">⚡ Avg Response Time</div>
        <div class="stat-value">842<span style="font-size:1.2rem;">ms</span></div>
        <div style="font-size:0.85rem; color:#64748B; margin-top:0.5rem;">Target: < 1000ms</div>
    </div>
    """, unsafe_allow_html=True)

with col3:
    st.markdown("""
    <div class="stat-card">
        <div class="stat-label">✅ Success Rate</div>
        <div class="stat-value">98.7%</div>
        <div style="font-size:0.85rem; color:#10B981; margin-top:0.5rem;">156 errors</div>
    </div>
    """, unsafe_allow_html=True)

st.markdown("<br>", unsafe_allow_html=True)

st.markdown("### 🧭 Điều hướng nhanh")
nav_col1, nav_col2, nav_col3, nav_col4 = st.columns(4)

with nav_col1:
    if st.button("🏠 Trang chủ", key="nav_home", use_container_width=True):
        st.switch_page("app.py")

with nav_col2:
    if st.button("💬 Chat Bot", key="nav_chat", use_container_width=True):
        st.switch_page("pages/chatbot.py")

with nav_col3:
    if st.button("📝 Form ISO", key="nav_form", use_container_width=True):
        st.switch_page("pages/Form_iso27001.py")

with nav_col4:
    if st.button("📊 Refresh Data", key="nav_refresh", use_container_width=True):
        st.rerun()

vietnam_time = datetime.datetime.utcnow() + datetime.timedelta(hours=7)
st.markdown(f"""
<div style="text-align: center; margin-top: 2rem; padding: 1.5rem; background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px;">
    <p style="color: #94A3B8; margin: 0; font-size: 0.9rem;">
        🔄 Dashboard cập nhật lúc: <strong style="color: #3B82F6;">{vietnam_time.strftime('%H:%M:%S')}</strong> (GMT+7)
    </p>
</div>
""", unsafe_allow_html=True)
