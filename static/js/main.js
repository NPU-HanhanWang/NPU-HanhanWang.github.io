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
        swapHighlightTheme(isDark);
    }

    function swapHighlightTheme(isDark) {
        var lightEl = document.getElementById('hljs-theme');
        var darkEl = document.getElementById('hljs-theme-dark');
        if (lightEl) lightEl.disabled = isDark;
        if (darkEl) darkEl.disabled = !isDark;
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
            let active = resolved === currentPath;
            // Sub-page matching: highlight section on detail pages
            // e.g. /courses/foo/bar.html → 课程; /blog/post.html → 博客
            if (!active && resolved !== '/' && currentPath.startsWith(resolved)) {
                active = true;
            }
            link.classList.toggle('active', active);
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
                // Skip mermaid diagrams (they get replaced with SVG)
                if (pre.classList.contains('mermaid') || pre.querySelector('code.language-mermaid')) return;
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
    // MERMAID DIAGRAMS
    // ============================================================
    async function renderMermaidDiagrams() {
        // Find all <code class="language-mermaid"> elements generated by marked
        var mermaidCodes = document.querySelectorAll('pre code.language-mermaid');
        if (mermaidCodes.length === 0) return;

        // Ensure mermaid library is loaded
        if (typeof mermaid === 'undefined') {
            setTimeout(renderMermaidDiagrams, 200);
            return;
        }

        // Convert <pre><code class="language-mermaid">...</code></pre>
        //       → <pre class="mermaid">...</pre>
        // This is the standard format that mermaid.run() expects.
        mermaidCodes.forEach(function (codeEl) {
            var preEl = codeEl.parentElement;
            var mermaidDef = codeEl.textContent;
            preEl.classList.add('mermaid');
            preEl.classList.remove('hljs');
            preEl.textContent = mermaidDef;
        });

        try {
            await mermaid.run();
        } catch (err) {
            console.warn('Mermaid run error:', err);
        }
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
    // SCROLL REVEAL (Apple style fade-up)
    // ============================================================
    function setupScrollReveal() {
        if (!('IntersectionObserver' in window)) return;
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        // Exclude cards inside horizontal scroll rows — they can sit off-screen
        // horizontally and would otherwise never trigger the reveal.
        const all = document.querySelectorAll('.card, .blog-item, .info-item, .chapter-item, .section-title, .stat');
        const targets = Array.prototype.filter.call(all, function (el) {
            return !el.closest('.h-scroll');
        });
        if (targets.length === 0) return;
        // Staggered entrance: siblings animate in sequence (Apple vibe)
        const groups = {};
        targets.forEach(function (el) {
            const p = el.parentElement;
            const key = p ? (p.className || p.tagName) + (p.id || '') : 'none';
            groups[key] = groups[key] || [];
            const idx = groups[key].length;
            groups[key].push(el);
            if (idx > 0) el.style.transitionDelay = (idx * 70) + 'ms';
        });
        const io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
        targets.forEach(function (el) {
            el.classList.add('reveal');
            io.observe(el);
        });
    }

    // ============================================================
    // NUMBER COUNTERS — count up when scrolled into view (keynote vibe)
    // ============================================================
    function animateCount(el) {
        const target = parseFloat(el.getAttribute('data-count')) || 0;
        const duration = 1500;
        const start = performance.now();
        function tick(now) {
            const p = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
            el.textContent = Math.round(target * eased);
            if (p < 1) {
                requestAnimationFrame(tick);
            } else {
                el.textContent = target;
            }
        }
        requestAnimationFrame(tick);
    }

    function setupCounters() {
        const nums = document.querySelectorAll('.stat-number[data-count]');
        if (nums.length === 0) return;
        const reduce = window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduce || !('IntersectionObserver' in window)) {
            nums.forEach(function (el) {
                el.textContent = el.getAttribute('data-count');
            });
            return;
        }
        const io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    animateCount(entry.target);
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        nums.forEach(function (el) { io.observe(el); });
    }

    // ============================================================
    // COOL EFFECTS — parallax, cursor glow, magnetic, spotlight
    // All gated to hover devices & no reduced-motion preference.
    // ============================================================
    function setupCoolEffects() {
        const reduceMotion = window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const noHover = window.matchMedia &&
            window.matchMedia('(hover: none)').matches;
        if (reduceMotion || noHover) return;

        // ── Ambient cursor glow ──
        const glow = document.querySelector('.cursor-glow');
        if (glow) {
            let gx = 0, gy = 0, glowRaf = null;
            window.addEventListener('mousemove', function (e) {
                gx = e.clientX;
                gy = e.clientY;
                glow.style.opacity = '1';
                if (!glowRaf) {
                    glowRaf = requestAnimationFrame(function () {
                        glow.style.transform = 'translate3d(' + gx + 'px, ' + gy + 'px, 0)';
                        glowRaf = null;
                    });
                }
            }, { passive: true });
            document.addEventListener('mouseout', function (e) {
                if (!e.relatedTarget) glow.style.opacity = '0';
            });
        }

        // ── Hero parallax + avatar tilt ──
        const hero = document.querySelector('.hero');
        if (hero) {
            const text = hero.querySelector('.hero-text');
            const img = hero.querySelector('.hero-image');
            let pRaf = null, px = 0, py = 0;
            hero.addEventListener('mousemove', function (e) {
                const r = hero.getBoundingClientRect();
                px = (e.clientX - r.left) / r.width - 0.5;
                py = (e.clientY - r.top) / r.height - 0.5;
                if (!pRaf) {
                    pRaf = requestAnimationFrame(function () {
                        if (text) {
                            text.style.transform =
                                'translate3d(' + (px * -16) + 'px, ' + (py * -10) + 'px, 0)';
                        }
                        if (img) {
                            img.style.transform =
                                'translate3d(' + (px * 20) + 'px, ' + (py * 14) + 'px, 0) ' +
                                'rotateX(' + (-py * 7) + 'deg) rotateY(' + (px * 7) + 'deg)';
                        }
                        pRaf = null;
                    });
                }
            }, { passive: true });
            hero.addEventListener('mouseleave', function () {
                if (text) text.style.transform = '';
                if (img) img.style.transform = '';
            });
        }

        // ── Magnetic buttons ──
        document.querySelectorAll('.btn').forEach(function (btn) {
            btn.style.transition =
                'transform 0.18s ease-out, background 0.25s ease, box-shadow 0.25s ease';
            btn.addEventListener('mousemove', function (e) {
                const r = btn.getBoundingClientRect();
                const mx = e.clientX - r.left - r.width / 2;
                const my = e.clientY - r.top - r.height / 2;
                btn.style.transform =
                    'translate(' + (mx * 0.18) + 'px, ' + (my * 0.28) + 'px)';
            });
            btn.addEventListener('mouseleave', function () {
                btn.style.transform = '';
            });
        });

        // ── Card spotlight (--mx/--my drive the radial highlight) ──
        document.querySelectorAll('.card, .blog-item').forEach(function (el) {
            el.addEventListener('mousemove', function (e) {
                const r = el.getBoundingClientRect();
                el.style.setProperty('--mx', (((e.clientX - r.left) / r.width) * 100) + '%');
                el.style.setProperty('--my', (((e.clientY - r.top) / r.height) * 100) + '%');
            });
        });

        // ── Card 3D tilt (subtle, strengthens the glass cards on the portal) ──
        document.querySelectorAll('.card').forEach(function (el) {
            el.addEventListener('mousemove', function (e) {
                const r = el.getBoundingClientRect();
                const px = (e.clientX - r.left) / r.width - 0.5;
                const py = (e.clientY - r.top) / r.height - 0.5;
                el.style.transform =
                    'perspective(900px) rotateX(' + (-py * 4) + 'deg) rotateY(' + (px * 4) + 'deg)';
            });
            el.addEventListener('mouseleave', function () {
                el.style.transform = '';
            });
        });
    }

    // ============================================================
    // PARALLAX — subtle scroll-linked drift on section titles
    // Gated to hover devices & no reduced-motion preference.
    // ============================================================
    function setupParallax() {
        const reduce = window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const noHover = window.matchMedia &&
            window.matchMedia('(hover: none)').matches;
        if (reduce || noHover) return;
        const items = document.querySelectorAll('.parallax');
        if (items.length === 0) return;
        let raf = null;
        function update() {
            const vh = window.innerHeight;
            items.forEach(function (el) {
                const r = el.getBoundingClientRect();
                const center = r.top + r.height / 2;
                const off = (center - vh / 2) / vh; // ~ -0.5 .. 0.5
                const y = Math.max(-18, Math.min(18, off * -24));
                el.style.transform = 'translate3d(0, ' + y + 'px, 0)';
            });
            raf = null;
        }
        window.addEventListener('scroll', function () {
            if (!raf) raf = requestAnimationFrame(update);
        }, { passive: true });
        update();
    }

// ============================================================
// TYPEWRITER — rotating tagline in the hero (Apple hero vibe)
// ============================================================
function setupTypewriter() {
    const el = document.getElementById('typewriter');
    if (!el) return;
    const reduce = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const words = ['深度学习', '强化学习', '开源项目', 'AI 基础设施', '可落地的科研'];
    if (reduce) {
        el.textContent = words[0];
        return;
    }
    let w = 0, c = 0, deleting = false;
    function tick() {
        const word = words[w];
        if (!deleting) {
            c++;
            el.textContent = word.slice(0, c);
            if (c === word.length) {
                deleting = true;
                setTimeout(tick, 1500);
                return;
            }
        } else {
            c--;
            el.textContent = word.slice(0, c);
            if (c === 0) {
                deleting = false;
                w = (w + 1) % words.length;
            }
        }
        setTimeout(tick, deleting ? 55 : 105);
    }
    tick();
}

// ============================================================
// HERO SCROLL — scale & fade hero content as you scroll past it
// (classic Apple product-page scroll effect)
// ============================================================
function setupHeroScroll() {
    const hero = document.querySelector('.hero');
    const content = document.querySelector('.hero-content');
    if (!hero || !content) return;
    const reduce = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const noHover = window.matchMedia &&
        window.matchMedia('(hover: none)').matches;
    if (reduce || noHover) return;
    let raf = null;
    function update() {
        const rect = hero.getBoundingClientRect();
        const p = Math.min(Math.max(-rect.top / rect.height, 0), 1);
        content.style.transform = 'scale(' + (1 - p * 0.12) + ')';
        content.style.opacity = String(1 - p * 0.85);
        raf = null;
    }
    window.addEventListener('scroll', function () {
        if (!raf) raf = requestAnimationFrame(update);
    }, { passive: true });
    update();
}

// ============================================================
// INITIALIZATION
// ============================================================
    function init() {
        // Apply theme
        applyTheme(getTheme());

        // Update nav active state
        updateNavActive();

        // Scroll reveal animations
        setupScrollReveal();

        // Number counters (stats strip)
        setupCounters();

        // Cool effects: parallax, cursor glow, magnetic, spotlight
        setupCoolEffects();

        // Subtle parallax on section titles
        setupParallax();

        // Typewriter tagline + hero scroll scale/fade
        setupTypewriter();
        setupHeroScroll();

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

        // ---- Mermaid diagrams ----
        renderMermaidDiagrams();

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
