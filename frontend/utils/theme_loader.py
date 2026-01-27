import streamlit as st

def load_theme():
    st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
    
    :root {
        --primary: #3B82F6;
        --primary-hover: #2563EB;
        --secondary: #8B5CF6;
        --accent: #06B6D4;
        --success: #10B981;
        --warning: #F59E0B;
        --error: #EF4444;
        --bg-dark: #0A0E1A;
        --bg-darker: #070A13;
        --bg-card: #1A1F2E;
        --bg-card-hover: #252B3B;
        --text-primary: #F8FAFC;
        --text-secondary: #CBD5E1;
        --text-muted: #64748B;
        --border: #1E293B;
        --border-light: #334155;
        --glow: rgba(59, 130, 246, 0.3);
    }

    * {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
    }
    
    .material-icons, [class*="material"] {
        font-family: 'Material Icons' !important;
    }

    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    [data-testid="stToolbar"] {visibility: hidden;}
    header {visibility: hidden;}
    
    .stApp {
        background: linear-gradient(135deg, #0A0E1A 0%, #1A1F2E 50%, #0F1419 100%);
        color: var(--text-primary);
    }
    
    .block-container {
        padding: 2.5rem 3.5rem !important;
        max-width: 1600px !important;
    }

    h1, h2, h3, h4, h5, h6 {
        color: var(--text-primary) !important;
        font-weight: 700 !important;
        letter-spacing: -0.02em !important;
    }
    
    h1 {
        font-size: 3rem !important;
        font-weight: 900 !important;
        background: linear-gradient(135deg, #F8FAFC 0%, #3B82F6 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        margin-bottom: 1rem !important;
    }
    
    h2 {
        font-size: 2rem !important;
        margin-bottom: 1.5rem !important;
    }
    
    h3 {
        font-size: 1.5rem !important;
        margin-bottom: 1.25rem !important;
        color: var(--text-secondary) !important;
    }
    
    p, span, div, label {
        color: var(--text-secondary) !important;
        line-height: 1.8 !important;
    }

    .stButton>button {
        background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%) !important;
        color: white !important;
        border: 1px solid rgba(59, 130, 246, 0.3) !important;
        border-radius: 12px !important;
        padding: 0.875rem 1.75rem !important;
        font-weight: 600 !important;
        font-size: 1rem !important;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3), inset 0 1px 0 rgba(255,255,255,0.1) !important;
    }
    
    .stButton>button:hover {
        transform: translateY(-2px) scale(1.02) !important;
        box-shadow: 0 8px 30px rgba(59, 130, 246, 0.5), inset 0 1px 0 rgba(255,255,255,0.2) !important;
        border-color: rgba(59, 130, 246, 0.6) !important;
    }

    .stTextInput>div>div>input,
    .stTextArea>div>div>textarea,
    .stSelectbox>div>div,
    .stNumberInput>div>div>input,
    .stMultiSelect>div>div {
        background: var(--bg-card) !important;
        border: 2px solid var(--border) !important;
        border-radius: 10px !important;
        color: var(--text-primary) !important;
        padding: 0.875rem 1.125rem !important;
        font-size: 1rem !important;
        transition: all 0.2s ease !important;
    }

    .stTextInput>div>div>input:focus,
    .stTextArea>div>div>textarea:focus {
        border-color: var(--primary) !important;
        box-shadow: 0 0 0 4px var(--glow), inset 0 1px 3px rgba(0,0,0,0.2) !important;
        outline: none !important;
        background: var(--bg-card-hover) !important;
    }
    
    label {
        color: var(--text-primary) !important;
        font-weight: 600 !important;
        font-size: 0.95rem !important;
        margin-bottom: 0.5rem !important;
    }

    section[data-testid="stSidebar"] {
        display: none !important;
    }

    .stChatMessage {
        background: var(--bg-card) !important;
        border: 1px solid var(--border) !important;
        border-radius: 16px !important;
        padding: 1.5rem !important;
        margin-bottom: 1.25rem !important;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
    }
    
    [data-testid="stChatMessageContent"] {
        color: var(--text-primary) !important;
    }
    
    .stChatInputContainer {
        background: var(--bg-card) !important;
        border: 2px solid var(--border-light) !important;
        border-radius: 16px !important;
    }

    .hero-section {
        background: linear-gradient(135deg, rgba(26, 31, 46, 0.9) 0%, rgba(15, 20, 25, 0.95) 100%);
        border: 1px solid var(--border-light);
        border-radius: 24px;
        padding: 4rem 3rem;
        margin-bottom: 3rem;
        text-align: center;
        position: relative;
        overflow: hidden;
        box-shadow: 0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05);
    }
    
    .hero-section::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(90deg, var(--primary), var(--secondary), var(--accent));
    }
    
    .hero-section::after {
        content: '';
        position: absolute;
        top: -50%;
        right: -10%;
        width: 500px;
        height: 500px;
        background: radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%);
        border-radius: 50%;
        pointer-events: none;
    }
    
    .stat-card {
        background: linear-gradient(135deg, var(--bg-card) 0%, rgba(26, 31, 46, 0.8) 100%);
        border: 1px solid var(--border-light);
        border-radius: 20px;
        padding: 2rem 1.5rem;
        text-align: center;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;
        box-shadow: 0 8px 24px rgba(0,0,0,0.4);
    }
    
    .stat-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(90deg, var(--primary), var(--accent));
        opacity: 0;
        transition: opacity 0.3s ease;
    }
    
    .stat-card:hover {
        transform: translateY(-8px) scale(1.03);
        border-color: var(--primary);
        box-shadow: 0 20px 40px rgba(59, 130, 246, 0.3), 0 0 60px rgba(59, 130, 246, 0.2);
    }
    
    .stat-card:hover::before {
        opacity: 1;
    }
    
    .stat-label {
        font-size: 0.85rem;
        font-weight: 700;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.1em;
        margin-bottom: 0.75rem;
    }
    
    .stat-value {
        font-size: 2.5rem;
        font-weight: 900;
        background: linear-gradient(135deg, var(--text-primary), var(--primary));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        margin: 0.5rem 0;
    }
    
    .feature-card {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 20px;
        padding: 2.5rem 2rem;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        height: 100%;
        position: relative;
        overflow: hidden;
        box-shadow: 0 8px 24px rgba(0,0,0,0.3);
    }
    
    .feature-card::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 4px;
        height: 100%;
        background: linear-gradient(180deg, var(--primary), var(--secondary));
        opacity: 0;
        transition: opacity 0.3s ease;
    }
    
    .feature-card:hover {
        transform: translateY(-10px) scale(1.02);
        border-color: var(--primary);
        box-shadow: 0 20px 50px rgba(59, 130, 246, 0.25);
        background: var(--bg-card-hover);
    }
    
    .feature-card:hover::after {
        opacity: 1;
    }
    
    .service-card {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 16px;
        padding: 1.75rem;
        margin-bottom: 1.25rem;
        transition: all 0.3s ease;
        box-shadow: 0 4px 16px rgba(0,0,0,0.3);
    }
    
    .service-card:hover {
        border-color: var(--primary);
        transform: translateX(8px);
        box-shadow: 0 8px 24px rgba(59, 130, 246, 0.2);
    }
    
    .status-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        border-radius: 9999px;
        font-size: 0.85rem;
        font-weight: 700;
        letter-spacing: 0.025em;
    }
    
    .status-online {
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 95, 70, 0.3));
        color: #10B981;
        border: 1px solid rgba(16, 185, 129, 0.3);
    }
    
    .status-loading {
        background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(146, 64, 14, 0.3));
        color: #F59E0B;
        border: 1px solid rgba(245, 158, 11, 0.3);
    }
    
    hr {
        border: none;
        border-top: 1px solid var(--border);
        margin: 2.5rem 0 !important;
        opacity: 0.5;
    }
    
    .stExpander {
        background: var(--bg-card) !important;
        border: 1px solid var(--border) !important;
        border-radius: 12px !important;
    }
    
    .stForm {
        background: var(--bg-card);
        border: 1px solid var(--border-light);
        border-radius: 20px;
        padding: 2.5rem;
        box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    }
    
    @keyframes glow {
        0%, 100% { opacity: 0.5; }
        50% { opacity: 1; }
    }
    
    .glow-effect {
        animation: glow 2s ease-in-out infinite;
    }
</style>
""", unsafe_allow_html=True)

def hide_streamlit_style():
    st.markdown("""
    <style>
        .stDeployButton {display: none;}
        [data-testid="stDecoration"] {display: none;}
    </style>
    """, unsafe_allow_html=True)
