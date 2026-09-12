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
        // 明暗图标由 CSS 依据 [data-theme] 控制显隐，这里只更新无障碍标签，
        // 不再改写 className，避免主题切换瞬间的图标闪烁。
        const toggle = document.getElementById('themeToggle');
        if (!toggle) return;
        toggle.setAttribute('aria-label', isDark ? '切换到亮色模式' : '切换到暗色模式');
    }

    // 主题切换：以按钮为圆心做圆形扩散（View Transitions）。
    // motion.css 里 html[data-vt-theme] 会关掉默认的整页淡入淡出，
    // 让 clip-path 的圆形揭示成为唯一过渡；不支持时静默降级为直接切换。
    function toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        const reduce = window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (reduce || typeof document.startViewTransition !== 'function') {
            applyTheme(next);
            return;
        }

        // 圆心取主题按钮中心；取不到时退回右上角
        const btn = document.getElementById('themeToggle');
        let x = window.innerWidth - 36, y = 36;
        if (btn) {
            const r = btn.getBoundingClientRect();
            x = r.left + r.width / 2;
            y = r.top + r.height / 2;
        }
        const radius = Math.hypot(
            Math.max(x, window.innerWidth - x),
            Math.max(y, window.innerHeight - y)
        );

        const root = document.documentElement;
        root.setAttribute('data-vt-theme', '1');
        let vt;
        try {
            vt = document.startViewTransition(function () { applyTheme(next); });
        } catch (e) {
            root.removeAttribute('data-vt-theme');
            applyTheme(next);
            return;
        }
        vt.ready.then(function () {
            root.animate(
                {
                    clipPath: [
                        'circle(0px at ' + x + 'px ' + y + 'px)',
                        'circle(' + radius + 'px at ' + x + 'px ' + y + 'px)'
                    ]
                },
                {
                    duration: 620,
                    easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
                    pseudoElement: '::view-transition-new(root)'
                }
            );
        }).catch(function () { /* ready 被跳过：直接切换即可 */ });

        vt.finished.catch(function () { /* 忽略中断 */ }).then(function () {
            root.removeAttribute('data-vt-theme');
        });
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
    // MOBILE NAV — drawer with scrim, ESC, focus trap
    // ============================================================
    const mobileNav = (function () {
        const hamburger = document.getElementById('hamburger');
        const navLinks = document.getElementById('navLinks');
        const scrim = document.getElementById('navScrim');
        let isOpen = false;

        function open() {
            if (!navLinks) return;
            isOpen = true;
            navLinks.classList.add('active');
            if (hamburger) {
                hamburger.classList.add('active');
                hamburger.setAttribute('aria-expanded', 'true');
            }
            if (scrim) {
                scrim.classList.add('is-open');
                scrim.setAttribute('aria-hidden', 'false');
            }
            document.body.classList.add('nav-open');
            const first = navLinks.querySelector('a');
            if (first) first.focus({ preventScroll: true });
        }

        function close() {
            if (!navLinks) return;
            isOpen = false;
            navLinks.classList.remove('active');
            if (hamburger) {
                hamburger.classList.remove('active');
                hamburger.setAttribute('aria-expanded', 'false');
            }
            if (scrim) {
                scrim.classList.remove('is-open');
                scrim.setAttribute('aria-hidden', 'true');
            }
            document.body.classList.remove('nav-open');
            if (hamburger) hamburger.focus({ preventScroll: true });
        }

        function toggle() { isOpen ? close() : open(); }

        return { get isOpen() { return isOpen; }, open, close, toggle };
    })();

    function toggleMobileNav() { mobileNav.toggle(); }
    function closeMobileNav() { mobileNav.close(); }

    // ESC 关闭抽屉；Tab 在抽屉内循环焦点（基础焦点陷阱）
    function handleMobileNavKeys(e) {
        if (!mobileNav.isOpen) return;
        if (e.key === 'Escape') {
            e.preventDefault();
            mobileNav.close();
        } else if (e.key === 'Tab') {
            const navLinks = document.getElementById('navLinks');
            if (!navLinks) return;
            const focusable = navLinks.querySelectorAll('a');
            if (!focusable.length) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
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
    // CENTRAL SCROLL DISPATCHER (single rAF-batched listener)
    // All scroll-driven work funnels through ONE passive listener so the
    // browser only schedules one rAF per frame and reads layout once.
    // ============================================================
    const _scrollSubs = [];
    let _scrollScheduled = false;
    function _processScroll() {
        _scrollScheduled = false;
        for (let i = 0; i < _scrollSubs.length; i++) {
            try { _scrollSubs[i](); } catch (e) { /* keep others alive */ }
        }
    }
    function onScrollFrame(fn) { _scrollSubs.push(fn); }
    function scheduleScroll() {
        if (!_scrollScheduled) {
            _scrollScheduled = true;
            requestAnimationFrame(_processScroll);
        }
    }
    window.addEventListener('scroll', scheduleScroll, { passive: true });

    // ============================================================
    // SCROLL HANDLER — navbar state, back-to-top, reading progress
    // ============================================================
    function updateScrollChrome() {
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
    // NAV AUTO-HIDE — 已移除。
    // 下滑自动隐藏属于未要求的功能，会让用户在浏览时失去导航，造成
    // “导航消失了/没回来”的体验问题。导航始终常驻。
    // ============================================================

    // ============================================================
    // SCROLL REVEAL (Apple style fade-up)
    // ============================================================
    function setupScrollReveal() {
        if (!('IntersectionObserver' in window)) return;
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        // 修复说明：这里原本有一段「若浏览器支持 animation-timeline: view()，
        // 滚动揭示就交给纯 CSS」的提前 return。但 CSS 侧只给 .hero-grid 写了
        // view-timeline，没有任何规则会揭示 [data-reveal] —— 结果在 Chrome /
        // Safari 上，模板里手写的 [data-reveal] 元素永远拿不到 .revealed，
        // 永久停留在 opacity: 0（首页两个 section 副标题就是这样消失的）。
        // 现在由 JS 统一接管揭示，并以 setTimeout 兜底（见文件末尾）。

        // Backwards-compatible default entrance: the classic targets fade up
        // unless a template already gave them a specific data-reveal variant.
        // 「rise」比 fade-up 位移更大并带轻微缩放，内页列表的层次感更强
        // （变体定义在 motion.css）。
        document.querySelectorAll('.card, .blog-item, .info-item, .chapter-item, .section-title, .stat')
            .forEach(function (el) {
                if (!el.hasAttribute('data-reveal')) el.setAttribute('data-reveal', 'rise');
            });

        // Exclude cards inside horizontal scroll rows — they can sit off-screen
        // horizontally and would otherwise never trigger the reveal.
        const all = document.querySelectorAll('[data-reveal]');
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
            // 交错节奏封顶 6 档：列表长时不至于让末尾元素迟迟不出现
            if (idx > 0) el.style.transitionDelay = (Math.min(idx, 6) * 80) + 'ms';
        });

        const io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    // Promote to its own compositor layer only for the entrance,
                    // then release it on transitionend to keep memory/GPU healthy.
                    el.style.willChange = 'transform, opacity, filter';
                    el.classList.add('revealed');
                    const release = function () {
                        el.classList.add('done');
                        el.style.willChange = 'auto';
                        // Clear the stagger delay so later hovers feel instant.
                        el.style.transitionDelay = '';
                        el.removeEventListener('transitionend', release);
                    };
                    el.addEventListener('transitionend', release);
                    // Fallback in case transitionend doesn't fire (e.g. interrupted)
                    setTimeout(release, 1400);
                    io.unobserve(el);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

        targets.forEach(function (el) { io.observe(el); });

        // 兜底：若 3s 后仍有元素没被揭示（IntersectionObserver 在
        // content-visibility:auto 容器内的漏判、快速跳转锚点等），
        // 把已经进入视口范围的一律强制揭示，保证内容不会永久不可见。
        window.setTimeout(function () {
            const vh = window.innerHeight || 800;
            targets.forEach(function (el) {
                if (el.classList.contains('revealed')) return;
                const r = el.getBoundingClientRect();
                if (r.top < vh * 1.2 && r.bottom > -vh * 0.2) {
                    el.classList.add('revealed', 'done');
                }
            });
        }, 3000);
    }

    // ============================================================
    // NUMBER COUNTERS — count up when scrolled into view (keynote vibe)
    // ============================================================
    function animateCount(el, done) {
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
                if (done) done();
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
                const stat = el.closest('.stat');
                if (stat) stat.classList.add('is-counted');
            });
            return;
        }
        const io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    const stat = el.closest('.stat');
                    // 数字滚动期间标签淡出，完成后同步淡入（标签与数字节奏同步）
                    if (stat) stat.classList.add('is-counting');
                    animateCount(el, function () {
                        if (stat) {
                            stat.classList.remove('is-counting');
                            stat.classList.add('is-counted');
                        }
                    });
                    io.unobserve(el);
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

            // 悬停到可点击目标时辉光放大，形成「吸附」暗示（motion.css: .is-hovered）
            const HOT = 'a, button, .card, .blog-item, .he-post, .stat, input, .chapter-item';
            document.addEventListener('mouseover', function (e) {
                if (e.target && e.target.closest && e.target.closest(HOT)) {
                    glow.classList.add('is-hovered');
                }
            }, { passive: true });
            document.addEventListener('mouseout', function (e) {
                if (e.target && e.target.closest && e.target.closest(HOT)) {
                    glow.classList.remove('is-hovered');
                }
            }, { passive: true });
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
            const trackEase = 'transform 0.18s var(--ease-out-quint), background-color 0.25s ease, box-shadow 0.25s ease';
            const releaseEase = 'transform 0.55s var(--ease-spring), background-color 0.25s ease, box-shadow 0.25s ease';
            btn.style.transition = trackEase;
            btn.addEventListener('mousemove', function (e) {
                const r = btn.getBoundingClientRect();
                const mx = e.clientX - r.left - r.width / 2;
                const my = e.clientY - r.top - r.height / 2;
                btn.style.transform =
                    'translate(' + (mx * 0.18) + 'px, ' + (my * 0.28) + 'px)';
            });
            btn.addEventListener('mouseleave', function () {
                btn.style.transition = releaseEase;
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
                el.style.transition = 'none'; // track the cursor with zero lag
                el.style.transform =
                    'perspective(900px) rotateX(' + (-py * 4) + 'deg) rotateY(' + (px * 4) + 'deg)';
            });
            el.addEventListener('mouseleave', function () {
                // springy, GPU-composited return to rest
                el.style.transition = 'transform 0.5s var(--ease-spring)';
                el.style.transform = '';
            });
        });
    }

    // ============================================================
    // NAV INDICATOR — 导航滑动高亮条（基础层，所有设备）
    // 指示条吸附到 .active 链接；指针设备悬停时预览移动，移出后复位。
    // 抽屉形态下 CSS 会隐藏它，纵向列表里没有意义。
    // ============================================================
    function setupNavIndicator() {
        const navLinks = document.getElementById('navLinks');
        if (!navLinks) return;
        const links = Array.prototype.slice.call(navLinks.querySelectorAll('a'));
        if (links.length === 0) return;

        const ind = document.createElement('span');
        ind.className = 'nav-indicator';
        ind.setAttribute('aria-hidden', 'true');
        navLinks.appendChild(ind);

        function moveTo(el) {
            // offsetParent 为 null = 元素当前不可渲染（抽屉折叠），跳过
            if (!el || !el.offsetParent) return;
            ind.style.width = el.offsetWidth + 'px';
            ind.style.transform = 'translate3d(' + el.offsetLeft + 'px, 0, 0)';
            ind.classList.add('is-visible');
        }

        function reset() {
            const active = navLinks.querySelector('a.active');
            if (active) moveTo(active);
            else ind.classList.remove('is-visible');
        }

        // 首帧布局未必稳定（字体、logo 宽度），load 后再校一次。
        // setTimeout 兜底：后台标签页 / 未产帧时 rAF 不调度，指示条会一直不出现。
        requestAnimationFrame(reset);
        window.setTimeout(reset, 200);
        window.addEventListener('load', reset);
        window.addEventListener('resize', reset);

        const fine = window.matchMedia &&
            window.matchMedia('(hover: hover) and (pointer: fine)').matches;
        if (fine) {
            links.forEach(function (a) {
                a.addEventListener('mouseenter', function () { moveTo(a); });
                a.addEventListener('focus', function () { moveTo(a); });
            });
            navLinks.addEventListener('mouseleave', reset);
            navLinks.addEventListener('focusout', reset);
        }

        // updateNavActive() 会在初始化后改写 .active，跟随变化
        if ('MutationObserver' in window) {
            const mo = new MutationObserver(reset);
            links.forEach(function (a) {
                mo.observe(a, { attributes: true, attributeFilter: ['class'] });
            });
        }
    }

    // ============================================================
    // PAGE HEADER REVEAL — 内页标题遮罩上滑揭示（基础层）
    // 内页原本完全静态：h1 与副标题没有任何入场，看着像 Word 文档。
    // 这里把标题逐字包进遮罩，载入后统一上滑揭示。
    // ============================================================
    function setupPageHeaderReveal() {
        const header = document.querySelector('.page-header');
        if (!header) return;
        const reduce = window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const h1 = header.querySelector('h1');
        const sub = header.querySelector('.subtitle');
        const container = header.querySelector('.container') || header;

        function makeMask(text, delayMs) {
            const outer = document.createElement('span');
            outer.className = 'mv-mask';
            const inner = document.createElement('span');
            inner.className = 'mv-mask-inner';
            inner.textContent = text;
            if (delayMs) inner.style.setProperty('--mv-delay', delayMs + 'ms');
            outer.appendChild(inner);
            return outer;
        }

        if (h1 && !h1.getAttribute('data-mv')) {
            h1.setAttribute('data-mv', '1');
            if (!reduce && h1.children.length === 0) {
                // 纯文本标题：逐字揭示（中文标题通常 2–6 字，节奏刚好）
                const text = h1.textContent;
                h1.textContent = '';
                let i = 0;
                for (const ch of text) {
                    if (ch === ' ' || ch === '\n' || ch === '\t') {
                        h1.appendChild(document.createTextNode(' '));
                    } else {
                        h1.appendChild(makeMask(ch, i * 55));
                        i++;
                    }
                }
            } else if (!reduce) {
                // 含内嵌 HTML：整块当一个遮罩单元，不拆以免破坏结构
                const inner = document.createElement('span');
                inner.className = 'mv-mask-inner';
                while (h1.firstChild) inner.appendChild(h1.firstChild);
                const outer = document.createElement('span');
                outer.className = 'mv-mask';
                outer.appendChild(inner);
                h1.appendChild(outer);
            }
        }

        if (sub && !sub.getAttribute('data-mv')) {
            sub.setAttribute('data-mv', '1');
            if (!reduce) sub.classList.add('mv-ph-sub');
        }

        if (!reduce) {
            const rule = document.createElement('span');
            rule.className = 'mv-ph-rule';
            rule.setAttribute('aria-hidden', 'true');
            container.appendChild(rule);
        }

        // 双 rAF：确保初始 transform 已被采纳，transition 才会真正跑起来。
        // setTimeout 兜底很关键：rAF 在后台标签页或未产帧时不调度，
        // 而页头被遮罩藏住了文字 —— 兜底不到位就会变成「标题直接消失」。
        const reveal = function () { header.classList.add('is-revealed'); };
        requestAnimationFrame(function () { requestAnimationFrame(reveal); });
        window.setTimeout(reveal, 260);
    }

    // ============================================================
    // LINK UNDERLINE — 下划线自左绘出（基础层）
    // ============================================================
    function setupLinkUnderlines() {
        const SEL = '.md-content a:not(.btn), .card-links span, .he-head-link, ' +
            '.he-post-more, .result-title, .back-to-top';
        document.querySelectorAll(SEL).forEach(function (el) {
            el.classList.add('mv-underline');
        });
    }

    // ============================================================
    // RIPPLE — 触摸/点击涟漪
    // 这是移动端「炫酷感」的主要来源：触摸设备上没有 hover，
    // 若只靠淡入，点击反馈会非常空洞。
    // ============================================================
    function setupRipple() {
        const reduce = window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduce) return;
        const SEL = '.btn, .card, .blog-item, .he-post, .nav-links a, ' +
            '.theme-toggle, .search-trigger, .back-to-top, .chapter-item, ' +
            '.info-item, .stat, .he-course, .he-project';
        const hosts = document.querySelectorAll(SEL);
        if (hosts.length === 0) return;
        hosts.forEach(function (el) {
            if (el.classList.contains('mv-ripple-host')) return;
            el.classList.add('mv-ripple-host');
            el.addEventListener('pointerdown', function (e) {
                const r = el.getBoundingClientRect();
                const size = Math.max(r.width, r.height) * 2.4;
                const wave = document.createElement('span');
                wave.className = 'mv-ripple-wave';
                wave.style.width = size + 'px';
                wave.style.height = size + 'px';
                wave.style.left = (e.clientX - r.left) + 'px';
                wave.style.top = (e.clientY - r.top) + 'px';
                el.appendChild(wave);
                const kill = function () {
                    if (wave.parentNode) wave.parentNode.removeChild(wave);
                };
                wave.addEventListener('animationend', kill);
                window.setTimeout(kill, 900);
            }, { passive: true });
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
        function update() {
            const vh = window.innerHeight;
            items.forEach(function (el) {
                const r = el.getBoundingClientRect();
                const center = r.top + r.height / 2;
                const off = (center - vh / 2) / vh; // ~ -0.5 .. 0.5
                const y = Math.max(-18, Math.min(18, off * -24));
                el.style.transform = 'translate3d(0, ' + y + 'px, 0)';
            });
        }
        onScrollFrame(update);
        update();
    }

// ============================================================
// SCROLL SCRUB — hero backdrop parallax (continuous, scroll-linked)
// The .hero-bg wrapper drifts slower than the foreground content,
// producing a sense of depth. Gated to hover devices & no
// reduced-motion; driven by the single central rAF scheduler.
// ============================================================
function setupScrollScrub() {
    const bg = document.querySelector('.hero-bg');
    if (!bg) return;
    const reduce = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const noHover = window.matchMedia &&
        window.matchMedia('(hover: none)').matches;
    if (reduce || noHover) return;
    const hero = bg.closest('.hero') || bg.parentElement;
    function update() {
        const rect = hero.getBoundingClientRect();
        // p: 0 when the hero's top reaches the viewport top → 1 after a
        // full hero-height of scroll. The backdrop sinks as you scroll.
        const p = Math.min(Math.max(-rect.top / rect.height, 0), 1);
        bg.style.transform = 'translate3d(0, ' + (p * 48) + 'px, 0)';
    }
    onScrollFrame(update);
    update();
}

// ============================================================
// STARFIELD — lightweight canvas particle backdrop in the hero
// (Apple/tech vibe: drifting nodes + faint connective lines)
// Gated to hover devices & no reduced-motion preference; pauses
// when the hero scrolls out of view for performance.
// ============================================================
function setupStarfield() {
    const canvas = document.querySelector('.hero-stars');
    if (!canvas) return;
    const reduce = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const noHover = window.matchMedia &&
        window.matchMedia('(hover: none)').matches;
    // Perf gate: skip the full-viewport canvas on small/low-power screens
    const finePointer = window.matchMedia &&
        window.matchMedia('(pointer: fine)').matches;
    const largeScreen = window.innerWidth >= 1024;
    if (reduce || noHover || !finePointer || !largeScreen) return;

    const hero = canvas.parentElement;
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, dpr = 1, particles = [], raf = null;

    function initParticles() {
        const count = Math.max(28, Math.min(90, Math.floor((w * h) / 15000)));
        particles = [];
        for (let i = 0; i < count; i++) {
            particles.push({
                x: Math.random() * w,
                y: Math.random() * h,
                vx: (Math.random() - 0.5) * 0.22,
                vy: (Math.random() - 0.5) * 0.22,
                r: Math.random() * 1.6 + 0.5,
            });
        }
    }

    function resize() {
        const r = hero.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return;
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        w = r.width; h = r.height;
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        initParticles();
    }

    function draw() {
        ctx.clearRect(0, 0, w, h);
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const rgb = isDark ? '255,255,255' : '0,113,227';
        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            p.x += p.vx; p.y += p.vy;
            if (p.x < 0) p.x = w; else if (p.x > w) p.x = 0;
            if (p.y < 0) p.y = h; else if (p.y > h) p.y = 0;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(' + rgb + ',0.55)';
            ctx.fill();
            for (let j = i + 1; j < particles.length; j++) {
                const q = particles[j];
                const dx = p.x - q.x, dy = p.y - q.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 110) {
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(q.x, q.y);
                    ctx.strokeStyle = 'rgba(' + rgb + ',' + (0.14 * (1 - dist / 110)) + ')';
                    ctx.lineWidth = 0.6;
                    ctx.stroke();
                }
            }
        }
    }

    function loop() { draw(); raf = requestAnimationFrame(loop); }
    function start() { if (raf === null) loop(); }
    function stop() { if (raf !== null) { cancelAnimationFrame(raf); raf = null; } }

    resize();
    start();
    window.addEventListener('resize', resize, { passive: true });

    // Pause animation when the hero is off-screen (save battery/CPU)
    if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (en.isIntersecting) start(); else stop();
            });
        }, { threshold: 0 });
        io.observe(hero);
    }
}

// ============================================================
// HERO TITLE — split into per-character spans for a staggered
// keynote-style reveal. The .highlight name stays one animated unit.
// Gated to no reduced-motion; falls back to the static gradient.
// ============================================================
function setupHeroTitle() {
    const h1 = document.querySelector('.hero-text h1');
    if (!h1) return;
    const reduce = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    const nodes = Array.prototype.slice.call(h1.childNodes);
    h1.innerHTML = '';
    let idx = 0;
    const STEP = 0.03;   /* 字符交错节奏：首屏整体 0.8s 内完成 */

    // Each glyph lives inside an overflow-hidden mask so it can slide
    // up into view (Apple keynote style) instead of just fading in.
    function wrapInMask(inner) {
        const mask = document.createElement('span');
        mask.className = 'char-mask';
        mask.appendChild(inner);
        return mask;
    }

    nodes.forEach(function (node) {
        if (node.nodeType === 3) { // text node
            const text = node.textContent;
            for (const ch of text) {
                const span = document.createElement('span');
                span.className = 'char';
                span.textContent = (ch === ' ') ? ' ' : ch;
                span.style.animationDelay = (idx * STEP) + 's';
                h1.appendChild(wrapInMask(span));
                idx++;
            }
        } else if (node.nodeType === 1) { // element (e.g. .highlight)
            node.classList.add('char-unit');
            node.style.animationDelay = (idx * STEP) + 's';
            h1.appendChild(wrapInMask(node));
            idx += Math.max(1, node.textContent.length);
        }
    });
    h1.classList.add('chars-split');
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
    function update() {
        const rect = hero.getBoundingClientRect();
        const p = Math.min(Math.max(-rect.top / rect.height, 0), 1);
        content.style.transform = 'scale(' + (1 - p * 0.12) + ')';
        content.style.opacity = String(1 - p * 0.85);
    }
    onScrollFrame(update);
    update();
}

// ============================================================
// INITIALIZATION
// ============================================================
    function init() {
        // Apply theme
        applyTheme(getTheme());

        // Split hero title into per-character spans (staggered reveal)
        setupHeroTitle();

        // Update nav active state
        updateNavActive();

        // 导航滑动指示条（依赖 .active，故放在 updateNavActive 之后）
        setupNavIndicator();

        // Scroll reveal animations
        setupScrollReveal();

        // 内页页头遮罩揭示 + 链接下划线 + 触摸涟漪（基础层/触摸层）
        setupPageHeaderReveal();
        setupLinkUnderlines();
        setupRipple();

        // Number counters (stats strip)
        setupCounters();

        // Cool effects: parallax, cursor glow, magnetic, spotlight
        setupCoolEffects();

        // Subtle parallax on section titles
        setupParallax();

        // Continuous scroll-scrubbed hero backdrop parallax
        setupScrollScrub();

        // Canvas starfield backdrop in the hero
        setupStarfield();

        // Typewriter tagline + hero scroll scale/fade
        setupTypewriter();
        setupHeroScroll();

        // ---- Mobile drawer ----
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

        // Close drawer when a nav link is tapped
        const navLinks = document.getElementById('navLinks');
        if (navLinks) {
            navLinks.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    if (mobileNav.isOpen) mobileNav.close();
                });
            });
        }

        // Tap scrim to dismiss the drawer
        const navScrim = document.getElementById('navScrim');
        if (navScrim) {
            navScrim.addEventListener('click', () => mobileNav.close());
        }

        // ESC / focus-trap for the drawer
        document.addEventListener('keydown', handleMobileNavKeys);

        // ---- Theme toggle ----
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', toggleTheme);
        }

        // ---- Platform-aware search shortcut hint ----
        // macOS shows ⌘K; Windows/Linux show Ctrl K.
        const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform || '') ||
            (navigator.userAgent || '').includes('Mac');
        const kbd = document.getElementById('searchKbd');
        if (kbd && !isMac) kbd.textContent = 'Ctrl K';

        // ---- Global ⌘K search ----
        setupGlobalSearch();

        // ---- Back to top ----
        const backToTopBtn = document.getElementById('backToTop');
        if (backToTopBtn) {
            backToTopBtn.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }

        // ---- Scroll handler (central rAF dispatcher) ----
        onScrollFrame(updateScrollChrome);

        // ---- Mermaid diagrams ----
        renderMermaidDiagrams();

        // ---- Code copy buttons ----
        setupCodeCopyButtons();

        // ---- Table scroll wrappers ----
        setupTableWrappers();

        // Initial scroll state
        updateScrollChrome();
    }

    // ───────────────────────────────────────────────────────────
    // Global ⌘K search modal
    // ───────────────────────────────────────────────────────────
    function setupGlobalSearch() {
        const overlay = document.getElementById('searchOverlay');
        const trigger = document.getElementById('searchTrigger');
        const input = document.getElementById('searchInput');
        const resultsEl = document.getElementById('searchResults');
        if (!overlay || !input || !resultsEl) return;

        const WEIGHTS = { title: 10, tags: 6, category: 5, description: 4, body: 1 };
        let index = null;
        let activeIndex = -1;
        let current = [];

        const escapeHtml = (s) => String(s).replace(/[&<>"']/g, c =>
            ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
        const highlight = (text, terms) => {
            const esc = escapeHtml(text);
            const safe = terms.map(t => t.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).filter(Boolean);
            if (!safe.length) return esc;
            return esc.replace(new RegExp('(' + safe.join('|') + ')', 'gi'), '<mark>$1</mark>');
        };

        function loadIndex() {
            if (index) return Promise.resolve(index);
            // Resolve the search index from the site root (user-pages deploy at "/").
            const base = (window.SITE_BASE_URL || '/').replace(/\/+$/, '') + '/';
            return fetch(base + 'search-index.json')
                .then(r => r.ok ? r.json() : [])
                .then(data => { index = Array.isArray(data) ? data : []; return index; })
                .catch(() => { index = []; return index; });
        }

        function scorePost(post, terms) {
            let score = 0;
            const f = {
                title: (post.title || '').toLowerCase(),
                tags: (post.tags || []).join(' ').toLowerCase(),
                category: (post.category || '').toLowerCase(),
                description: (post.description || '').toLowerCase(),
                body: (post.body || '').toLowerCase(),
            };
            terms.forEach(term => {
                if (f.title.includes(term)) score += WEIGHTS.title * (f.title.startsWith(term) ? 2 : 1);
                if (f.tags.includes(term)) score += WEIGHTS.tags;
                if (f.category.includes(term)) score += WEIGHTS.category;
                if (f.description.includes(term)) score += WEIGHTS.description;
                if (f.body.includes(term)) score += WEIGHTS.body;
            });
            return score;
        }

        function matchesAll(post, terms) {
            return terms.every(term =>
                (post.title || '').toLowerCase().includes(term) ||
                (post.tags || []).join(' ').toLowerCase().includes(term) ||
                (post.category || '').toLowerCase().includes(term) ||
                (post.description || '').toLowerCase().includes(term) ||
                (post.body || '').toLowerCase().includes(term));
        }

        function render(query) {
            const q = (query || '').trim().toLowerCase();
            const terms = q.split(/\s+/).filter(Boolean);
            let list;
            if (!terms.length) {
                list = (index || []).slice().sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 6);
            } else {
                list = index.filter(p => matchesAll(p, terms))
                    .map(p => ({ p, s: scorePost(p, terms) }))
                    .sort((x, y) => y.s - x.s || (y.p.date || '').localeCompare(x.p.date || ''))
                    .map(x => x.p);
            }
            current = list;
            activeIndex = list.length ? 0 : -1;

            if (!list.length) {
                resultsEl.innerHTML = q
                    ? '<div class="search-empty">没有匹配的结果。</div>'
                    : '<div class="search-empty">暂无文章。</div>';
                return;
            }
            resultsEl.innerHTML = list.map((p, i) => {
                const cat = escapeHtml(p.category || '博客');
                const title = highlight(p.title || '', terms);
                const desc = highlight(p.description || '', terms);
                const time = p.readingTime || 1;
                return `<a class="result-item${i === activeIndex ? ' is-active' : ''}" href="/blog/${encodeURIComponent(p.slug)}.html" data-idx="${i}">
                    <div class="result-head">
                        <span class="result-cat">${cat}</span>
                        <span class="result-time">${time} 分钟阅读</span>
                    </div>
                    <div class="result-title">${title}</div>
                    <div class="result-desc">${desc}</div>
                </a>`;
            }).join('');
            // 结果是动态生成的，下划线要重新套用
            setupLinkUnderlines();
        }

        function open() {
            overlay.classList.add('is-open');
            overlay.setAttribute('aria-hidden', 'false');
            loadIndex().then(() => render(input.value));
            setTimeout(() => input.focus(), 60);
        }
        function close() {
            overlay.classList.remove('is-open');
            overlay.setAttribute('aria-hidden', 'true');
        }
        function isOpen() { return overlay.classList.contains('is-open'); }

        trigger && trigger.addEventListener('click', open);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
        input.addEventListener('input', () => render(input.value));
        input.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (current.length) { activeIndex = (activeIndex + 1) % current.length; updateActive(); }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (current.length) { activeIndex = (activeIndex - 1 + current.length) % current.length; updateActive(); }
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const el = resultsEl.querySelector('.result-item.is-active');
                if (el) window.location.href = el.getAttribute('href');
            }
        });

        function updateActive() {
            resultsEl.querySelectorAll('.result-item').forEach(el => {
                const on = Number(el.dataset.idx) === activeIndex;
                el.classList.toggle('is-active', on);
                if (on) el.scrollIntoView({ block: 'nearest' });
            });
        }

        document.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                isOpen() ? close() : open();
            } else if (e.key === 'Escape' && isOpen()) {
                close();
            }
        });
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
