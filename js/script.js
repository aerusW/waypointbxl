/* ================================================================
   WAYPOINT — js/script.js
   Shared page behaviours. Vanilla JS. No dependencies. No build step.
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


/* ── Smooth scroll ──────────────────────────────────────────────── */
(function () {
  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

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
