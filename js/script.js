/* ================================================================
   WAYPOINT — js/script.js
   Vanilla JS. No dependencies. No build step.
================================================================ */

/* ── Nav: scroll shadow + active link highlighting ──────────────── */
(function () {
  const nav      = document.querySelector('.nav');
  const navLinks = document.querySelectorAll('.nav__link');
  const sections = Array.from(document.querySelectorAll('main section[id]'));

  function onScroll() {
    nav.classList.toggle('is-scrolled', window.scrollY > 24);

    let current = '';
    sections.forEach(section => {
      if (window.scrollY >= section.offsetTop - 120) {
        current = section.id;
      }
    });

    navLinks.forEach(link => {
      const target = link.getAttribute('href').replace('#', '');
      link.classList.toggle('is-active', target === current);
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();


/* ── Mobile menu ────────────────────────────────────────────────── */
(function () {
  const toggle = document.querySelector('.nav__toggle');
  const menu   = document.querySelector('.nav__links');
  if (!toggle || !menu) return;

  toggle.addEventListener('click', () => {
    const open = menu.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });

  function closeMenu() {
    menu.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) {
      closeMenu();
      toggle.focus();
    }
  });
})();




/* ── Page loader (canvas-based, single rAF loop) ────────────────── */
(function () {
  var loader  = document.getElementById('loader');
  var canvas  = document.getElementById('loaderCanvas');
  var content = document.getElementById('loaderContent');
  var chevron = document.getElementById('loaderChevron');
  if (!loader || !canvas || !content) return;

  var ctx  = null;
  try { ctx = canvas.getContext('2d'); } catch (e) {}

  var busy  = false;
  var COLOR = '#FF6B4A';

  function vw() { return window.innerWidth  || document.documentElement.clientWidth  || 800; }
  function vh() { return window.innerHeight || document.documentElement.clientHeight || 600; }

  function resizeCanvas() {
    canvas.width  = vw();
    canvas.height = vh();
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas(); // set dimensions immediately so first trigger is ready

  function easeOutExpo(t) { return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t); }
  function easeInExpo(t)  { return t <= 0 ? 0 : Math.pow(2, 10 * t - 10); }

  function maxRadius(ox, oy) {
    var w = canvas.width, h = canvas.height;
    return Math.max(
      Math.hypot(ox,     oy),
      Math.hypot(w - ox, oy),
      Math.hypot(ox,     h - oy),
      Math.hypot(w - ox, h - oy)
    );
  }

  function drawCircle(ox, oy, r) {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (r <= 0) return;
    ctx.beginPath();
    ctx.arc(ox, oy, r, 0, Math.PI * 2);
    ctx.fillStyle = COLOR;
    ctx.fill();
  }

  var safetyTimer = null;

  function hide() {
    clearTimeout(safetyTimer);
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    loader.style.display = 'none';
    loader.classList.remove('is-active');
    content.style.opacity = '0';
    if (chevron) chevron.classList.remove('is-drawn');
    busy = false;
  }

  function trigger(ox, oy, callback) {
    if (busy) return;
    busy = true;

    // Safety valve: if the rAF loop never completes (e.g. canvas error,
    // background-tab throttling), force-reset after 3 s so the next tap works.
    safetyTimer = setTimeout(function () {
      if (!callback) { hide(); return; }
      callback();
      hide();
    }, 3000);

    loader.style.display = 'flex';
    loader.classList.add('is-active');
    content.style.opacity   = '0';
    content.style.transform = 'translateY(20px)';
    if (chevron) chevron.classList.remove('is-drawn');

    requestAnimationFrame(function () {
      resizeCanvas();
      var maxR = maxRadius(ox, oy);

      var T_EXPAND   = 700;
      var T_HOLD     = 300;
      var T_CONTRACT = 520;
      var CONTENT_START = T_EXPAND * 0.35;
      var CONTENT_DUR   = T_EXPAND * 0.65;

      var phase         = 'expand';
      var startTime     = null;
      var holdStart     = null;
      var contractStart = null;
      var callbackDone  = false;
      var chevronDone   = false;

      function frame(ts) {
        if (!startTime) startTime = ts;

        if (phase === 'expand') {
          var elapsed = ts - startTime;
          var t = Math.min(elapsed / T_EXPAND, 1);
          drawCircle(ox, oy, maxR * easeOutExpo(t));

          if (elapsed >= CONTENT_START) {
            var ct = Math.min((elapsed - CONTENT_START) / CONTENT_DUR, 1);
            content.style.opacity   = ct.toFixed(3);
            content.style.transform = 'translateY(' + ((1 - ct) * 20).toFixed(2) + 'px)';
          }

          if (!chevronDone && elapsed >= CONTENT_START + CONTENT_DUR * 0.5) {
            chevronDone = true;
            if (chevron) chevron.classList.add('is-drawn');
          }

          if (t >= 1) {
            phase     = 'hold';
            holdStart = ts;
            content.style.opacity   = '1';
            content.style.transform = 'translateY(0)';
            if (!callbackDone && callback) { callback(); callbackDone = true; }
          }

        } else if (phase === 'hold') {
          drawCircle(ox, oy, maxR);
          if (ts - holdStart >= T_HOLD) {
            phase         = 'contract';
            contractStart = ts;
          }

        } else if (phase === 'contract') {
          var t = Math.min((ts - contractStart) / T_CONTRACT, 1);
          drawCircle(ox, oy, maxR * (1 - easeInExpo(t)));
          content.style.opacity = Math.max(0, 1 - t / 0.4).toFixed(3);

          if (t >= 1) { hide(); return; }
        }

        requestAnimationFrame(frame);
      }

      requestAnimationFrame(frame);
    });
  }

  function originFromEl(el) {
    var r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  // Home logos (nav + footer)
  document.querySelectorAll('.nav__logo, .footer__logo-link').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      var o = originFromEl(el);
      trigger(o.x, o.y, function () {
        window.scrollTo(0, 0);
        history.pushState(null, '', '/');
      });
    });
  });

  // External links (http/https)
  document.querySelectorAll('a[href^="http"]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      var href   = el.getAttribute('href');
      var newTab = el.getAttribute('target') === '_blank';
      var o = originFromEl(el);

      if (newTab) {
        // Open a blank tab synchronously (direct from user gesture) so mobile
        // popup blockers don't kill it, then navigate it from the callback.
        var tab = window.open('', '_blank', 'noopener,noreferrer');
        trigger(o.x, o.y, function () {
          if (tab) { tab.location.href = href; }
          else     { window.open(href, '_blank', 'noopener,noreferrer'); }
        });
      } else {
        trigger(o.x, o.y, function () {
          window.location.href = href;
        });
      }
    });
  });
})();


/* ── Smooth scroll ──────────────────────────────────────────────── */
(function () {
  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  // rAF-driven animation — bypasses CSS scroll-behavior and prefers-reduced-motion,
  // so it works even when OS/browser animations are disabled.
  // Uses the two-arg scrollTo(x, y) form which is always a synchronous position set.
  function smoothScrollTo(targetY, duration) {
    var startY    = window.scrollY;
    var diff      = targetY - startY;
    var startTime = null;
    function step(ts) {
      if (!startTime) startTime = ts;
      var t = Math.min((ts - startTime) / duration, 1);
      window.scrollTo(0, startY + diff * easeInOutCubic(t));
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var id = link.getAttribute('href').slice(1);
      if (!id) return;
      var target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();

      var navH = (document.querySelector('.nav') || {}).offsetHeight || 0;
      var top  = target.getBoundingClientRect().top + window.scrollY - navH;
      smoothScrollTo(top, 700);
      history.pushState(null, '', '#' + id);
    });
  });
})();


/* ── Scroll progress bar ────────────────────────────────────────── */
(function () {
  const bar = document.querySelector('.scroll-progress');
  if (!bar) return;

  function update() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';
  }

  window.addEventListener('scroll', update, { passive: true });
  update();
})();


/* ── Copy email to clipboard ────────────────────────────────────── */
(function () {
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const text = btn.dataset.copy;
      if (!text) return;

      navigator.clipboard.writeText(text).then(() => {
        const label = btn.querySelector('.copy-btn__label');
        btn.classList.add('is-copied');
        if (label) label.textContent = 'Copied!';

        setTimeout(() => {
          btn.classList.remove('is-copied');
          if (label) label.textContent = 'Copy';
        }, 2000);
      });
    });
  });
})();


/* ── Scroll-reveal via IntersectionObserver ─────────────────────── */
(function () {
  const targets = document.querySelectorAll('.reveal');

  if (!('IntersectionObserver' in window)) {
    targets.forEach(el => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
  });

  targets.forEach(el => observer.observe(el));
})();
