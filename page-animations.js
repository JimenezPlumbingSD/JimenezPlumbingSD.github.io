/**
 * JPS Page Animations — scroll-driven entrance effects
 * Add data-reveal="fade-up" | "fade-in" | "slide-left" | "slide-right" | "scale-in" | "stagger"
 * to any element. IntersectionObserver triggers the animation when it enters viewport.
 */
(function() {
  'use strict';

  const DEFAULT_DELAY = 0;
  const DEFAULT_DURATION = 700;
  const DEFAULT_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const STAGGER_STEP = 100;

  const animations = {
    'fade-up':    { transform: 'translateY(40px)', opacity: '0' },
    'fade-down':  { transform: 'translateY(-40px)', opacity: '0' },
    'fade-in':    { opacity: '0' },
    'slide-left': { transform: 'translateX(60px)', opacity: '0' },
    'slide-right':{ transform: 'translateX(-60px)', opacity: '0' },
    'scale-in':   { transform: 'scale(0.9)', opacity: '0' },
    'rotate-in':  { transform: 'rotate(-4deg) scale(0.95)', opacity: '0' }
  };

  function init() {
    // Inject base styles
    const style = document.createElement('style');
    style.id = 'jps-animations';
    style.textContent = `
      [data-reveal] {
        transition-property: transform, opacity;
        transition-duration: ${DEFAULT_DURATION}ms;
        transition-timing-function: ${DEFAULT_EASING};
        will-change: transform, opacity;
      }
      [data-reveal].revealed {
        transform: none !important;
        opacity: 1 !important;
      }
      /* Stagger children inside a stagger container */
      [data-reveal="stagger"] > * {
        opacity: 0;
        transform: translateY(30px);
        transition: transform ${DEFAULT_DURATION}ms ${DEFAULT_EASING}, opacity ${DEFAULT_DURATION}ms ${DEFAULT_EASING};
      }
      [data-reveal="stagger"].revealed > * {
        opacity: 1;
        transform: none;
      }
      /* Respect reduced motion */
      @media (prefers-reduced-motion: reduce) {
        [data-reveal], [data-reveal="stagger"] > * {
          transition: none !important;
          transform: none !important;
          opacity: 1 !important;
        }
      }
    `;
    document.head.appendChild(style);

    // Set initial hidden state
    document.querySelectorAll('[data-reveal]:not([data-reveal="stagger"])').forEach(el => {
      const anim = animations[el.dataset.reveal] || animations['fade-up'];
      if (anim.transform) el.style.transform = anim.transform;
      if (anim.opacity) el.style.opacity = anim.opacity;

      const delay = parseInt(el.dataset.revealDelay || '0', 10);
      if (delay) el.style.transitionDelay = delay + 'ms';
    });

    // IntersectionObserver
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        const el = entry.target;

        if (el.dataset.reveal === 'stagger') {
          // Stagger children
          const children = Array.from(el.children);
          children.forEach((child, i) => {
            setTimeout(() => {
              child.style.transitionDelay = (i * STAGGER_STEP) + 'ms';
              child.classList.add('revealed');
            }, 50);
          });
        } else {
          el.classList.add('revealed');
        }

        observer.unobserve(el);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('[data-reveal]').forEach(el => observer.observe(el));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
