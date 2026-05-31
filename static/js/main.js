/* ============================================================
   main.js — Client-side interactivity for the static site
   Handles: dark mode, mobile nav, reading progress bar,
            scroll effects, back-to-top
   ============================================================ */
(function () {
    'use strict';

    // ============================================================
    // STATE
    // ============================================================
    const THEME_KEY = 'site-theme';

    function getTheme() {
        const stored = localStorage.getItem(THEME_KEY);
        if (stored === 'dark' || stored === 'light') return stored;
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }

    function setTheme(theme) {
        localStorage.setItem(THEME_KEY, theme);
    }

    // ============================================================
    // DARK MODE
    // ============================================================
    function applyTheme(theme) {
        const isDark = theme === 'dark';
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
        updateThemeIcon(isDark);
        setTheme(theme);
    }

    function updateThemeIcon(isDark) {
        const toggle = document.getElementById('themeToggle');
        if (!toggle) return;
        const icon = toggle.querySelector('i');
        if (icon) {
            icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
        }
        toggle.setAttribute('aria-label', isDark ? '切换到亮色模式' : '切换到暗色模式');
    }

    function toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
        applyTheme(current === 'dark' ? 'light' : 'dark');
    }

    // Listen for system theme changes
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem(THEME_KEY)) {
                applyTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    // ============================================================
    // NAV ACTIVE STATE
    // ============================================================
    function updateNavActive() {
        const currentPath = window.location.pathname;
        document.querySelectorAll('.nav-links a').forEach(link => {
            const href = link.getAttribute('href');
            if (!href) return;
            const resolved = new URL(href, window.location.origin).pathname;
            link.classList.toggle('active', resolved === currentPath);
        });
    }

    // ============================================================
    // MOBILE NAV
    // ============================================================
    function toggleMobileNav() {
        const hamburger = document.getElementById('hamburger');
        const navLinks = document.getElementById('navLinks');
        if (!hamburger || !navLinks) return;
        const isActive = navLinks.classList.toggle('active');
        hamburger.classList.toggle('active', isActive);
        hamburger.setAttribute('aria-expanded', String(isActive));
        document.body.style.overflow = isActive ? 'hidden' : '';
    }

    function closeMobileNav() {
        const hamburger = document.getElementById('hamburger');
        const navLinks = document.getElementById('navLinks');
        if (!navLinks) return;
        navLinks.classList.remove('active');
        if (hamburger) {
            hamburger.classList.remove('active');
            hamburger.setAttribute('aria-expanded', 'false');
        }
        document.body.style.overflow = '';
    }

    // ============================================================
    // CODE BLOCK COPY BUTTONS
    // ============================================================
    function setupCodeCopyButtons() {
        const contentAreas = document.querySelectorAll('.md-content');
        contentAreas.forEach(function (area) {
            const pres = area.querySelectorAll('pre');
            pres.forEach(function (pre) {
                if (pre.closest('.code-block-wrapper')) return;
                const wrapper = document.createElement('div');
                wrapper.className = 'code-block-wrapper';
                pre.parentNode.insertBefore(wrapper, pre);
                wrapper.appendChild(pre);

                const btn = document.createElement('button');
                btn.className = 'code-copy-btn';
                btn.setAttribute('aria-label', 'Copy code');
                btn.innerHTML = '<i class="fas fa-copy"></i><span>Copy</span>';

                btn.addEventListener('click', function () {
                    const codeEl = pre.querySelector('code') || pre;
                    const text = codeEl.textContent;
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(text).then(function () {
                            btn.classList.add('copied');
                            btn.innerHTML = '<i class="fas fa-check"></i><span>Copied!</span>';
                            setTimeout(function () {
                                btn.classList.remove('copied');
                                btn.innerHTML = '<i class="fas fa-copy"></i><span>Copy</span>';
                            }, 2000);
                        }).catch(function () {
                            fallbackCopy(text, btn);
                        });
                    } else {
                        fallbackCopy(text, btn);
                    }
                });

                wrapper.appendChild(btn);
            });
        });
    }

    function fallbackCopy(text, btn) {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        ta.style.top = '-9999px';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        try {
            var ok = document.execCommand('copy');
            if (ok) {
                btn.classList.add('copied');
                btn.innerHTML = '<i class="fas fa-check"></i><span>Copied!</span>';
                setTimeout(function () {
                    btn.classList.remove('copied');
                    btn.innerHTML = '<i class="fas fa-copy"></i><span>Copy</span>';
                }, 2000);
            }
        } catch (_) { /* ignore */ }
        document.body.removeChild(ta);
    }

    // ============================================================
    // TABLE SCROLL WRAPPERS (mobile)
    // ============================================================
    function setupTableWrappers() {
        const contentAreas = document.querySelectorAll('.md-content');
        contentAreas.forEach(function (area) {
            const tables = area.querySelectorAll('table');
            tables.forEach(function (table) {
                if (table.closest('.table-wrapper')) return;
                const wrapper = document.createElement('div');
                wrapper.className = 'table-wrapper';
                table.parentNode.insertBefore(wrapper, table);
                wrapper.appendChild(table);
            });
        });
    }

    // ============================================================
    // READING PROGRESS BAR
    // ============================================================
    function updateReadingProgress() {
        const bar = document.getElementById('readingProgress');
        if (!bar) return;
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (docHeight <= 0) {
            bar.style.width = '0%';
            return;
        }
        const progress = Math.min((scrollTop / docHeight) * 100, 100);
        bar.style.width = progress + '%';
    }

    // ============================================================
    // SCROLL HANDLER
    // ============================================================
    function onScroll() {
        const navbar = document.getElementById('navbar');
        const backToTopBtn = document.getElementById('backToTop');

        if (navbar) {
            navbar.classList.toggle('scrolled', window.scrollY > 50);
        }
        if (backToTopBtn) {
            backToTopBtn.classList.toggle('visible', window.scrollY > 500);
        }
        updateReadingProgress();
    }

    // ============================================================
    // INITIALIZATION
    // ============================================================
    function init() {
        // Apply theme
        applyTheme(getTheme());

        // Update nav active state
        updateNavActive();

        // ---- Hamburger menu ----
        const hamburger = document.getElementById('hamburger');
        if (hamburger) {
            hamburger.addEventListener('click', toggleMobileNav);
            hamburger.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleMobileNav();
                }
            });
        }

        // Close mobile menu on nav link click
        const navLinks = document.getElementById('navLinks');
        if (navLinks) {
            navLinks.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    if (navLinks.classList.contains('active')) {
                        closeMobileNav();
                    }
                });
            });
        }

        // ---- Theme toggle ----
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', toggleTheme);
        }

        // ---- Back to top ----
        const backToTopBtn = document.getElementById('backToTop');
        if (backToTopBtn) {
            backToTopBtn.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }

        // ---- Scroll handler ----
        window.addEventListener('scroll', onScroll, { passive: true });

        // ---- Code copy buttons ----
        setupCodeCopyButtons();

        // ---- Table scroll wrappers ----
        setupTableWrappers();

        // Initial scroll state
        onScroll();
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
