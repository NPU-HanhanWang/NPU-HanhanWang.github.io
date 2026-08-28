/* handbook.js — AI Agent 学习手册交互
   1) 滚动高亮（scroll-spy）：根据阅读位置高亮左侧/抽屉目录
   2) 移动端目录抽屉：浮动按钮开关 + 遮罩 + 点击链接关闭
   纯原生，无依赖。在 blog-post.html 中按 handbook 标志 deferred 加载。 */
(function () {
  'use strict';
  var toc = document.getElementById('handbookToc');
  if (!toc) return;
  var toggle = document.getElementById('handbookTocToggle');

  function navHeight() {
    var v = getComputedStyle(document.documentElement).getPropertyValue('--nav-height');
    var n = parseInt(v, 10);
    return isNaN(n) ? 80 : n;
  }

  /* ── 滚动高亮 ── */
  var links = Array.prototype.slice.call(toc.querySelectorAll('a[href^="#"]'));
  var map = {};
  links.forEach(function (a) {
    var id = a.getAttribute('href').slice(1);
    if (id) map[id] = a;
  });
  var targets = [];
  Object.keys(map).forEach(function (id) {
    var el = document.getElementById(id);
    if (el) targets.push(el);
  });

  function clearActive() {
    links.forEach(function (a) { a.classList.remove('active'); });
  }
  function setActive(id) {
    clearActive();
    var a = map[id];
    if (a) a.classList.add('active');
  }

  var ticking = false;
  function update() {
    ticking = false;
    var pos = window.scrollY + navHeight() + 24;
    var activeId = null;
    for (var i = 0; i < targets.length; i++) {
      var top = targets[i].getBoundingClientRect().top + window.scrollY;
      if (top <= pos) activeId = targets[i].id;
      else break;
    }
    if (!activeId && targets.length) activeId = targets[0].id;
    if (activeId) setActive(activeId);
  }
  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', update);
  update();

  /* ── 移动端抽屉 ── */
  if (toggle) {
    var scrim = document.createElement('div');
    scrim.className = 'handbook-toc-scrim';
    document.body.appendChild(scrim);

    function openToc() {
      toc.classList.add('open');
      scrim.classList.add('show');
      toggle.setAttribute('aria-expanded', 'true');
    }
    function closeToc() {
      toc.classList.remove('open');
      scrim.classList.remove('show');
      toggle.setAttribute('aria-expanded', 'false');
    }
    toggle.addEventListener('click', function () {
      if (toc.classList.contains('open')) closeToc();
      else openToc();
    });
    scrim.addEventListener('click', closeToc);
    links.forEach(function (a) {
      a.addEventListener('click', function () {
        if (window.matchMedia('(max-width: 900px)').matches) closeToc();
      });
    });
  }
})();
