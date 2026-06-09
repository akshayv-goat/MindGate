const revealElems = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    entry.target.classList.toggle('show', entry.isIntersecting);
  });
}, {
  threshold: 0.2,
});

revealElems.forEach((el) => observer.observe(el));

// Contact modal functionality
const contactTriggers = document.querySelectorAll('.contact-btn');
const contactModal = document.getElementById('contact-modal');
const modalClose = document.getElementById('modal-close');

if (contactTriggers.length && contactModal) {
  contactTriggers.forEach((trigger) => {
    trigger.addEventListener('click', () => {
      contactModal.classList.add('active');
    });
  });

  modalClose.addEventListener('click', () => {
    contactModal.classList.remove('active');
  });

  contactModal.addEventListener('click', (e) => {
    if (e.target === contactModal) {
      contactModal.classList.remove('active');
    }
  });
}

const mobileToggle = document.getElementById('mobile-menu-toggle');
const navLinks = document.getElementById('nav-links');

if (mobileToggle && navLinks) {
  mobileToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });

  navLinks.addEventListener('click', (e) => {
    if (e.target.tagName === 'A' || e.target.classList.contains('contact-btn')) {
      navLinks.classList.remove('open');
    }
  });
}

  // Smooth in-page navigation and hash normalization
  document.addEventListener('click', (e) => {
    const el = e.target.closest && e.target.closest('a[href^="#"]');
    if (!el) return;
    const hash = el.getAttribute('href');
    if (!hash || hash === '#') return;
    const id = hash.slice(1);
    const target = document.getElementById(id);
    if (target) {
      e.preventDefault();
      // disable browser auto scroll restoration which can interfere
      if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

      const nav = document.querySelector('.site-nav');
      const navHeight = nav ? nav.offsetHeight : 0;
      const extraOffset = 12; // small breathing room
      const targetRect = target.getBoundingClientRect();
      const targetY = window.pageYOffset + targetRect.top - navHeight - extraOffset;

      // perform smooth window scroll so the browser's native anchor behavior isn't involved
      window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });

      // briefly give target a programmatic focus for accessibility without scrolling
      const prevTab = target.getAttribute('tabindex');
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
      if (prevTab !== null) target.setAttribute('tabindex', prevTab); else target.removeAttribute('tabindex');

      try {
        history.pushState(null, document.title, '#' + id);
      } catch (err) {
        // ignore if pushState is unavailable
      }
    } else {
      // If the target doesn't exist, prevent the browser jump and clear hash
      e.preventDefault();
      try {
        history.replaceState(null, document.title, window.location.pathname + window.location.search);
      } catch (err) {}
    }
  });

  // On load, if the URL contains a hash that has no matching element, remove it to avoid unexpected scrolling
  window.addEventListener('load', () => {
    const h = window.location.hash;
    if (h && h.length > 1) {
      const id = h.slice(1);
      if (!document.getElementById(id)) {
        try {
          history.replaceState(null, document.title, window.location.pathname + window.location.search);
        } catch (err) {}
      }
    }
  });
