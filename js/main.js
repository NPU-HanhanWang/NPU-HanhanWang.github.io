/* ============================================================
   main.js — Shared JavaScript for the personal academic blog
   Includes: Web Components (SharedNav, SharedFooter),
             i18n system, UI initialization
   ============================================================ */

(function () {
    'use strict';

    // ============================================================
    // TRANSLATION DATA
    // ============================================================
    const translations = {
        zh: {
            // Navigation
            'nav-home': '首页',
            'nav-courses': '课程',
            'nav-projects': '项目',
            'nav-about': '关于',
            'nav-contact': '联系',

            // Hero
            'hero-greeting': '你好，我是 <span class="highlight">王晗晗</span>',
            'hero-role': '西北工业大学 · 计算机科学',
            'hero-desc': '专注于计算机视觉与深度学习的研究生。热衷于将研究成果转化为可落地的项目，用代码解决实际问题。',
            'hero-btn': '了解更多',

            // About
            'about-title': '关于我',
            'about-subtitle': '教育背景与研究方向',
            'about-photo-placeholder': '照片',
            'about-heading': '我是谁？',
            'about-p1': '我是王晗晗，西北工业大学计算机科学与技术专业的研究生。研究方向主要为计算机视觉、深度学习和图像处理，对将AI技术应用于实际场景充满热情。',
            'about-p2': '在学术之外，我喜欢将学习笔记整理成博客文章，参与开源项目，并持续探索前沿技术。我相信知识的积累和分享是成长的最佳途径。',
            'about-btn': '联系我',

            // Skills
            'skills-title': '专业技能',
            'skills-subtitle': '我在学习和研究中常用的技术',
            'skill-ml-title': '机器学习',
            'skill-ml-desc': 'PyTorch, TensorFlow, Scikit-learn, 深度学习模型设计与训练',
            'skill-cv-title': '计算机视觉',
            'skill-cv-desc': 'OpenCV, 目标检测, 图像分割, 特征提取, 图像生成',
            'skill-programming-title': '编程语言',
            'skill-programming-desc': 'Python, C/C++, MATLAB, Shell脚本, Git版本控制',
            'skill-tools-title': '工具与平台',
            'skill-tools-desc': 'Linux, Docker, LaTeX, Jupyter, GitHub Pages, 论文写作',

            // Contact
            'contact-title': '联系我',
            'contact-subtitle': '有学术合作或其他问题？欢迎联系！',
            'contact-name': '你的名字',
            'contact-email': '你的邮箱',
            'contact-message': '你的留言',
            'contact-btn': '发送消息',
            'contact-location': '中国西安',

            // Footer
            'footer-text': '© 2025 王晗晗. 保留所有权利.',

            // Toast messages
            'toast-success': '✅ 感谢留言！我会尽快回复。',
            'toast-error': '⚠️ 请填写所有必填字段。',

            // Courses page
            'courses-title': '课程学习',
            'courses-subtitle': '课程笔记与学习记录',
            'back-to-courses': '返回课程列表',
            'chapters-title': '章节导航',
            'course-overview': '课程概述',
            'loading': '加载中...',
            'load-error': '加载失败',

            // Projects page
            'projects-title': '项目作品',
            'projects-subtitle': '科研项目与实践作品',
            'back-to-projects': '返回项目列表',
            'project-overview': '项目概述',
        },
        en: {
            // Navigation
            'nav-home': 'Home',
            'nav-courses': 'Courses',
            'nav-projects': 'Projects',
            'nav-about': 'About',
            'nav-contact': 'Contact',

            // Hero
            'hero-greeting': 'Hello, I\'m <span class="highlight">Hanhan Wang</span>',
            'hero-role': 'NPU · Computer Science',
            'hero-desc': 'A graduate student focused on computer vision and deep learning. Passionate about turning research into practical projects and solving real-world problems with code.',
            'hero-btn': 'Learn More',

            // About
            'about-title': 'About Me',
            'about-subtitle': 'Education & Research Interests',
            'about-photo-placeholder': 'Photo',
            'about-heading': 'Who Am I?',
            'about-p1': 'I am Hanhan Wang, a graduate student in Computer Science at Northwestern Polytechnical University (NPU). My research focuses on computer vision, deep learning, and image processing. I am passionate about applying AI technologies to real-world scenarios.',
            'about-p2': 'Beyond academia, I enjoy organizing study notes into blog posts, contributing to open-source projects, and continuously exploring cutting-edge technologies. I believe accumulating and sharing knowledge is the best path to growth.',
            'about-btn': 'Let\'s Talk',

            // Skills
            'skills-title': 'Skills',
            'skills-subtitle': 'Technologies I use in study and research',
            'skill-ml-title': 'Machine Learning',
            'skill-ml-desc': 'PyTorch, TensorFlow, Scikit-learn, Deep Learning model design & training',
            'skill-cv-title': 'Computer Vision',
            'skill-cv-desc': 'OpenCV, Object Detection, Image Segmentation, Feature Extraction, Image Generation',
            'skill-programming-title': 'Programming',
            'skill-programming-desc': 'Python, C/C++, MATLAB, Shell Scripting, Git version control',
            'skill-tools-title': 'Tools & Platforms',
            'skill-tools-desc': 'Linux, Docker, LaTeX, Jupyter, GitHub Pages, Academic writing',

            // Contact
            'contact-title': 'Get In Touch',
            'contact-subtitle': 'Have a project in mind or academic collaboration? Feel free to reach out!',
            'contact-name': 'Your Name',
            'contact-email': 'Your Email',
            'contact-message': 'Your Message',
            'contact-btn': 'Send Message',
            'contact-location': 'Xi\'an, China',

            // Footer
            'footer-text': '© 2025 Hanhan Wang. All rights reserved.',

            // Toast messages
            'toast-success': '✅ Thank you! I\'ll get back to you soon.',
            'toast-error': '⚠️ Please fill in all required fields.',

            // Courses page
            'courses-title': 'Courses',
            'courses-subtitle': 'Course notes and study records',
            'back-to-courses': 'Back to Courses',
            'chapters-title': 'Chapters',
            'course-overview': 'Course Overview',
            'loading': 'Loading...',
            'load-error': 'Failed to load',

            // Projects page
            'projects-title': 'Projects',
            'projects-subtitle': 'Research projects and practical work',
            'back-to-projects': 'Back to Projects',
            'project-overview': 'Project Overview',
        }
    };

    // ============================================================
    // STATE
    // ============================================================
    window.currentLang = localStorage.getItem('site-lang') || 'zh';
    window.translations = translations;

    /**
     * Translate a key for the current language.
     * @param {string} key
     * @param {string} [lang] — optional override
     * @returns {string}
     */
    window.t = function (key, lang) {
        lang = lang || window.currentLang;
        return translations[lang]?.[key] || translations['zh']?.[key] || key;
    };

    /**
     * Apply language to all static data-i18n and data-i18n-placeholder elements.
     * Triggers dynamicContentHandler if defined on the page.
     * @param {string} lang
     */
    window.applyLanguage = function (lang) {
        window.currentLang = lang;

        // Update text content
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (translations[lang] && translations[lang][key]) {
                if (key === 'hero-greeting') {
                    el.innerHTML = translations[lang][key];
                } else {
                    el.textContent = translations[lang][key];
                }
            }
        });

        // Update placeholder attributes
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (translations[lang] && translations[lang][key]) {
                el.setAttribute('placeholder', translations[lang][key]);
            }
        });

        // Update language toggle buttons
        document.querySelectorAll('.lang-btn').forEach(btn => {
            const isActive = btn.getAttribute('data-lang') === lang;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-pressed', isActive);
        });

        // Update HTML lang attribute
        document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';

        // Persist
        localStorage.setItem('site-lang', lang);

        // Trigger dynamic content re-render if handler is registered
        if (window.dynamicContentHandler) {
            window.dynamicContentHandler(lang);
        }
    };

    // ============================================================
    // SHARED NAV WEB COMPONENT
    // ============================================================
    class SharedNav extends HTMLElement {
        connectedCallback() {
            const active = this.getAttribute('active') || 'home';
            const navItems = [
                { id: 'home', href: 'index.html' },
                { id: 'courses', href: 'courses.html' },
                { id: 'projects', href: 'projects.html' },
                { id: 'about', href: 'index.html#about' },
                { id: 'contact', href: 'index.html#contact' },
            ];

            const lang = window.currentLang || 'zh';

            this.innerHTML = `
            <nav id="navbar">
              <div class="container">
                <a href="index.html" class="logo">Hanhan Wang</a>
                <ul class="nav-links" id="navLinks">
                  ${navItems.map(item => `
                    <li><a href="${item.href}"
                           class="${active === item.id ? 'active' : ''}"
                           data-i18n="nav-${item.id}">${window.t('nav-' + item.id, lang)}</a></li>
                  `).join('')}
                </ul>
                <div class="lang-switch" aria-label="Language switcher">
                  <button class="lang-btn ${lang === 'zh' ? 'active' : ''}" data-lang="zh" aria-pressed="${lang === 'zh'}">中文</button>
                  <button class="lang-btn ${lang === 'en' ? 'active' : ''}" data-lang="en" aria-pressed="${lang === 'en'}">EN</button>
                </div>
                <div class="hamburger" id="hamburger" aria-label="Toggle navigation menu" role="button" tabindex="0">
                  <span></span><span></span><span></span>
                </div>
              </div>
            </nav>`;

            // Initialize UI after DOM is updated
            setTimeout(() => {
                if (window.initUI) window.initUI();
            }, 0);
        }
    }
    customElements.define('shared-nav', SharedNav);

    // ============================================================
    // SHARED FOOTER WEB COMPONENT
    // ============================================================
    class SharedFooter extends HTMLElement {
        connectedCallback() {
            const lang = window.currentLang || 'zh';
            this.innerHTML = `
            <footer>
              <div class="container">
                <div class="social-links">
                  <a href="https://github.com/NPU-HanhanWang" target="_blank" rel="noopener" aria-label="GitHub"><i class="fab fa-github"></i></a>
                  <a href="mailto:hanhanwang@example.com" aria-label="Email"><i class="fas fa-envelope"></i></a>
                </div>
                <p data-i18n="footer-text">${window.t('footer-text', lang)}</p>
              </div>
            </footer>`;
        }
    }
    customElements.define('shared-footer', SharedFooter);

    // ============================================================
    // UI INITIALIZATION
    // ============================================================
    let uiInitialized = false;

    window.initUI = function () {
        const hamburger = document.getElementById('hamburger');
        const navLinks = document.getElementById('navLinks');
        const navbar = document.getElementById('navbar');

        if (!hamburger || !navLinks) return;

        // ---- Language buttons ----
        const langBtns = document.querySelectorAll('.lang-btn');
        langBtns.forEach(btn => {
            // Remove old listeners by cloning
            const clone = btn.cloneNode(true);
            btn.parentNode.replaceChild(clone, btn);
            clone.addEventListener('click', function () {
                window.applyLanguage(this.getAttribute('data-lang'));
            });
        });

        // Update active state
        langBtns.forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-lang') === window.currentLang);
        });

        // ---- Hamburger menu ----
        if (!uiInitialized) {
            hamburger.addEventListener('click', toggleMobileNav);
            hamburger.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleMobileNav();
                }
            });

            // Close mobile menu on nav link click
            navLinks.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    if (navLinks.classList.contains('active')) {
                        closeMobileNav();
                    }
                });
            });

            // ---- Smooth scrolling for anchor links ----
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', function (e) {
                    const targetId = this.getAttribute('href');
                    if (targetId === '#') return;
                    // Only handle same-page anchors (not links to other pages with #)
                    if (this.getAttribute('href').startsWith('#') && !window.location.pathname.endsWith('index.html') && window.location.pathname !== '/' && !window.location.pathname.endsWith('/')) {
                        // On non-index pages, navigate to index.html + hash
                        window.location.href = 'index.html' + targetId;
                        return;
                    }
                    e.preventDefault();
                    const target = document.querySelector(targetId);
                    if (target) {
                        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                });
            });

            // ---- Back to top button ----
            const backToTopBtn = document.getElementById('backToTop');
            if (backToTopBtn) {
                backToTopBtn.addEventListener('click', () => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                });
            }

            uiInitialized = true;
        }

        // re-apply language to the nav (in case page-specific text was missed)
        window.applyLanguage(window.currentLang);
    };

    function toggleMobileNav() {
        const hamburger = document.getElementById('hamburger');
        const navLinks = document.getElementById('navLinks');
        const isActive = navLinks.classList.toggle('active');
        hamburger.classList.toggle('active', isActive);
        hamburger.setAttribute('aria-expanded', isActive);
        document.body.style.overflow = isActive ? 'hidden' : '';
    }

    function closeMobileNav() {
        const hamburger = document.getElementById('hamburger');
        const navLinks = document.getElementById('navLinks');
        navLinks.classList.remove('active');
        hamburger.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
    }

    // ============================================================
    // SCROLL HANDLER — navbar shadow + back-to-top visibility
    // ============================================================
    window.addEventListener('scroll', function () {
        const navbar = document.getElementById('navbar');
        const backToTopBtn = document.getElementById('backToTop');

        if (navbar) {
            navbar.classList.toggle('scrolled', window.scrollY > 50);
        }
        if (backToTopBtn) {
            backToTopBtn.classList.toggle('visible', window.scrollY > 500);
        }
    }, { passive: true });

    // ============================================================
    // TOAST NOTIFICATION HELPER
    // ============================================================
    let toastTimer;
    window.showToast = function (message, duration) {
        duration = duration || 3000;
        const toast = document.getElementById('toast');
        if (!toast) return;
        clearTimeout(toastTimer);
        toast.textContent = message;
        toast.classList.add('show');
        toastTimer = setTimeout(function () {
            toast.classList.remove('show');
        }, duration);
    };

    // ============================================================
    // CONTACT FORM HANDLER
    // ============================================================
    document.addEventListener('DOMContentLoaded', function () {
        const contactForm = document.getElementById('contactForm');
        if (!contactForm) return;

        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const nameInput = document.getElementById('contactName');
            const emailInput = document.getElementById('contactEmail');
            const messageInput = document.getElementById('contactMessage');

            if (!nameInput || !emailInput || !messageInput) return;

            let isValid = true;

            [nameInput, emailInput, messageInput].forEach(function (input) {
                input.classList.remove('error');
            });

            if (!nameInput.value.trim()) {
                nameInput.classList.add('error');
                isValid = false;
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailInput.value.trim() || !emailRegex.test(emailInput.value.trim())) {
                emailInput.classList.add('error');
                isValid = false;
            }

            if (!messageInput.value.trim()) {
                messageInput.classList.add('error');
                isValid = false;
            }

            if (!isValid) {
                window.showToast(window.t('toast-error'), 3000);
                return;
            }

            window.showToast(window.t('toast-success'), 4000);
            contactForm.reset();

            [nameInput, emailInput, messageInput].forEach(function (input) {
                input.addEventListener('focus', function handler() {
                    input.classList.remove('error');
                    input.removeEventListener('focus', handler);
                }, { once: true });
            });
        });
    });

})();
