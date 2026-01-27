(function () {
    'use strict';

    // Get saved theme
    let currentTheme = localStorage.getItem('phobert-theme') || 'light';

    // Apply theme
    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('phobert-theme', theme);
        console.log('[Theme] Applied:', theme);
    }

    // Initialize theme immediately
    applyTheme(currentTheme);

    // Create toggle button
    function createToggleButton() {
        // Remove existing
        const existing = document.getElementById('theme-toggle-btn');
        if (existing) {
            existing.remove();
        }

        const button = document.createElement('button');
        button.id = 'theme-toggle-btn';
        button.innerHTML = currentTheme === 'dark' ? '☀️' : '🌙';
        button.setAttribute('aria-label', 'Toggle dark/light mode');
        button.setAttribute('title', 'Chuyển đổi Dark/Light mode');

        button.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
            applyTheme(currentTheme);

            button.innerHTML = currentTheme === 'dark' ? '☀️' : '🌙';

            console.log('[Theme] Toggled to:', currentTheme);
        });

        document.body.appendChild(button);
        console.log('[Theme] Button created');
    }

    // Wait for DOM
    function init() {
        if (document.body) {
            createToggleButton();
        } else {
            setTimeout(init, 100);
        }
    }

    // Start init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Re-create on Streamlit rerun
    const observer = new MutationObserver(function (mutations) {
        if (!document.getElementById('theme-toggle-btn')) {
            console.log('[Theme] Button missing, recreating...');
            setTimeout(createToggleButton, 100);
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: false
    });

    // Reapply theme periodically (workaround for Streamlit reruns)
    setInterval(function () {
        const saved = localStorage.getItem('phobert-theme');
        if (saved && saved !== currentTheme) {
            currentTheme = saved;
            applyTheme(currentTheme);
        }
    }, 500);

    console.log('[Theme] Script loaded, initial theme:', currentTheme);
})();
