/* ════════════════════════════════════════════════════════
   CF-Panel — Minimal interactivity
   1. Nav scroll shadow
   2. Scroll reveal animations
   3. Active nav link tracking
   ════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── Nav scroll shadow ── */
  const nav = document.querySelector('.nav');
  let ticking = false;

  function updateNav() {
    if (window.scrollY > 8) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      window.requestAnimationFrame(updateNav);
      ticking = true;
    }
  }, { passive: true });

  /* ── Scroll reveal ── */
  const revealTargets = document.querySelectorAll(
    '.section__label, .section__heading, .section__lead, .prose, .shot, .view-card, .feature, .data-block, .tech-item, .download-card, .build-from-source, .references, .hero__cta, .hero__meta'
  );

  revealTargets.forEach(function (el) {
    el.classList.add('reveal');
  });

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.08,
      rootMargin: '0px 0px -40px 0px'
    });

    revealTargets.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    // Fallback: show everything
    revealTargets.forEach(function (el) {
      el.classList.add('visible');
    });
  }

  /* ── Active nav link tracking ── */
  var navLinks = document.querySelectorAll('.nav__links a');
  var sections = [];

  navLinks.forEach(function (link) {
    var href = link.getAttribute('href');
    if (href && href.startsWith('#')) {
      var target = document.querySelector(href);
      if (target) sections.push({ link: link, el: target });
    }
  });

  if ('IntersectionObserver' in window && sections.length > 0) {
    var navObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var match = sections.find(function (s) { return s.el === entry.target; });
        if (!match) return;
        if (entry.isIntersecting) {
          navLinks.forEach(function (l) { l.style.color = ''; });
          match.link.style.color = 'var(--accent)';
        }
      });
    }, {
      threshold: 0,
      rootMargin: '-50% 0px -45% 0px'
    });

    sections.forEach(function (s) { navObserver.observe(s.el); });
  }
})();
