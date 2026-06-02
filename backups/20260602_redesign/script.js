// JPS Website — script.js
// Sticky header, smooth scroll, form handling, mobile nav

document.addEventListener('DOMContentLoaded', () => {

  // ── Smooth scrolling for anchor links ──
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id === '#') return;
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ── Sticky header shadow on scroll ──
  const header = document.querySelector('.site-header');
  if (header) {
    window.addEventListener('scroll', () => {
      header.classList.toggle('scrolled', window.scrollY > 50);
    });
  }

  // ── Service category nav scroll hint ──
  const nav = document.querySelector('.main-nav .container');
  if (nav && nav.scrollWidth > nav.clientWidth) {
    nav.classList.add('scrollable');
    let hint = document.createElement('span');
    hint.className = 'scroll-hint';
    hint.innerHTML = '&#9654;';
    nav.parentElement.appendChild(hint);
    nav.addEventListener('scroll', () => {
      hint.style.opacity = nav.scrollLeft + nav.clientWidth >= nav.scrollWidth - 10 ? '0' : '0.7';
    });
  }

  // ── Contact form handling ──
  const form = document.querySelector('.contact-form');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const origText = btn.textContent;
      btn.textContent = 'Sending...';
      btn.disabled = true;

      const fd = new FormData(form);
      const data = Object.fromEntries(fd.entries());

      // Submit to API backend
      fetch('https://api.jps33sd.com/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          source: 'jps_website',
          business: 'JPS'
        })
      })
      .then(r => {
        if (!r.ok) throw new Error('Server error');
        return r.json();
      })
      .then(() => {
        btn.textContent = 'Request Submitted';
        btn.style.background = '#22C55E';
        form.reset();
        setTimeout(() => {
          btn.textContent = origText;
          btn.style.background = '';
          btn.disabled = false;
        }, 4000);
      })
      .catch(() => {
        // Fallback: mailto
        const subject = encodeURIComponent(`JPS Service Request: ${data.service || 'General'}`);
        const body = encodeURIComponent(
          `Name: ${data.first_name || ''} ${data.last_name || ''}\n` +
          `Phone: ${data.phone || ''}\nEmail: ${data.email || ''}\n` +
          `Service: ${data.service || ''}\nMessage: ${data.message || ''}`
        );
        window.location.href = `mailto:JPSJimenez33@gmail.com?subject=${subject}&body=${body}`;
        btn.textContent = origText;
        btn.disabled = false;
      });
    });
  }

  // ── Review cards — lazy load from Google when API is live ──
  // For now the static reviews in HTML suffice

  // ── Chat button visibility on scroll (show after hero) ──
  const chatBtn = document.querySelector('.chat-with-us');
  if (chatBtn) {
    window.addEventListener('scroll', () => {
      chatBtn.classList.toggle('visible', window.scrollY > 400);
    });
    // Start hidden until scroll
    chatBtn.classList.add('chat-hidden');
  }

  // ── Dynamic year ──
  const yearEl = document.querySelector('.footer-bottom p');
  if (yearEl) {
    yearEl.innerHTML = yearEl.innerHTML.replace('1989\u20132025', `1989\u2013${new Date().getFullYear()}`);
    yearEl.innerHTML = yearEl.innerHTML.replace('1989\u20132026', `1989\u2013${new Date().getFullYear()}`);
  }

  // Colorway switcher
  const colorwayToggle = document.getElementById('colorwayToggle');
  const colorwayMenu   = document.getElementById('colorwayMenu');
  const colorwaySheet  = document.getElementById('colorwaySheet');

  function applyColorway(cw, isLight) {
    const html = document.documentElement;
    if (!colorwaySheet) return;

    html.classList.remove('light', 'theme-light');

    if (isLight || cw === 'light') {
      // Light mode: disable branded sheet, add light class (base styles + overrides in css)
      colorwaySheet.setAttribute('href', '');
      colorwaySheet.setAttribute('disabled', '');
      html.classList.add('light', 'theme-light');
    } else if (cw) {
      colorwaySheet.setAttribute('href', cw);
      colorwaySheet.removeAttribute('disabled');
    } else {
      colorwaySheet.setAttribute('href', '');
      colorwaySheet.setAttribute('disabled', '');
    }

    if (colorwayMenu) {
      colorwayMenu.querySelectorAll('button[data-colorway]').forEach(b => {
        const match = (b.dataset.colorway === cw) || (cw === '' && b.dataset.colorway === '');
        b.classList.toggle('active', match);
      });
    }
  }

  if (colorwayToggle && colorwayMenu && colorwaySheet) {
    const saved = localStorage.getItem('jps_colorway') || '';
    const isLightSaved = saved === 'light' || localStorage.getItem('jps_light') === '1';
    applyColorway(saved, isLightSaved);

    colorwayToggle.addEventListener('click', e => {
      e.stopPropagation();
      colorwayMenu.classList.toggle('open');
    });

    colorwayMenu.querySelectorAll('button[data-colorway]').forEach(btn => {
      btn.addEventListener('click', () => {
        const cw = btn.dataset.colorway;
        const light = btn.dataset.mode === 'light' || cw === 'light';
        applyColorway(cw, light);
        localStorage.setItem('jps_colorway', light ? 'light' : cw);
        if (light) localStorage.setItem('jps_light', '1'); else localStorage.removeItem('jps_light');
        colorwayMenu.classList.remove('open');
      });
    });

    document.addEventListener('click', () => colorwayMenu.classList.remove('open'));
    colorwayMenu.addEventListener('click', e => e.stopPropagation());
  }
});

// Billing toggle (membership page)
(function () {
  const btns = document.querySelectorAll('.billing-btn');
  if (!btns.length) return;

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const monthly = btn.dataset.period === 'month';
      document.querySelectorAll('.price-annual').forEach(el => el.hidden = monthly);
      document.querySelectorAll('.price-monthly').forEach(el => el.hidden = !monthly);
    });
  });
})();

// Video embed — swap placeholder for real YouTube iframe when ID is set
(function () {
  const placeholder = document.querySelector('.video-placeholder[data-yt-id]');
  if (!placeholder) return;
  const ytId = placeholder.dataset.ytId;
  if (!ytId || ytId === 'YOUTUBE_ID_HERE') return;
  // Real ID set — replace placeholder with iframe on click
  placeholder.addEventListener('click', function () {
    const iframe = document.createElement('iframe');
    iframe.src = 'https://www.youtube.com/embed/' + ytId + '?autoplay=1&rel=0';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    iframe.allowFullscreen = true;
    iframe.style.cssText = 'width:100%;height:100%;border:none;display:block;';
    placeholder.parentElement.replaceChild(iframe, placeholder);
  });
})();

/* ================================================
   SPLASH ANIMATION: eye blink + water explode on click
   Unlocks the rest of the homepage (onboarding feel)
   Vanilla canvas particles, no libs
   ================================================ */
(function () {
  const splash = document.getElementById('splash');
  const canvas = document.getElementById('splashFx');
  const main = document.getElementById('main-content');
  if (!splash || !canvas || !main) return;

  const ctx = canvas.getContext('2d', { alpha: true });
  let particles = [];
  let animFrame = null;
  let entered = false;

  function resizeCanvas() {
    const rect = splash.getBoundingClientRect();
    // Match the displayed img size (max 620px)
    const size = Math.min(620, Math.min(rect.width * 0.92, rect.height * 0.92));
    canvas.width = size;
    canvas.height = size;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  class Particle {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      // explode outward + slight upward bias for "water"
      const ang = Math.random() * Math.PI * 2;
      const speed = 1.8 + Math.random() * 3.2;
      this.vx = Math.cos(ang) * speed;
      this.vy = Math.sin(ang) * speed - 1.2; // bias up
      this.life = 38 + Math.random() * 22;
      this.maxLife = this.life;
      this.r = 1.6 + Math.random() * 2.8;
      // water / cosmic colors
      this.hue = 195 + Math.random() * 35; // cyan-blue range
      this.alpha = 0.85 + Math.random() * 0.15;
    }
    step() {
      this.x += this.vx;
      this.y += this.vy;
      this.vy += 0.08; // gravity
      this.vx *= 0.985;
      this.life -= 1;
      // fade
      this.alpha = Math.max(0.02, (this.life / this.maxLife) * 0.95);
    }
    draw() {
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.fillStyle = `hsla(${this.hue}, 92%, 78%, 1)`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fill();
      // highlight
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.beginPath();
      ctx.arc(this.x - this.r * 0.3, this.y - this.r * 0.3, this.r * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function spawnExplode(cx, cy, count = 52) {
    particles = [];
    for (let i = 0; i < count; i++) {
      particles.push(new Particle(cx, cy));
    }
    // extra central burst
    for (let i = 0; i < 14; i++) {
      const p = new Particle(cx, cy);
      p.vx *= 0.4; p.vy *= 0.4; p.life *= 0.7;
      particles.push(p);
    }
  }

  function drawBlink(cx, cy, progress) {
    // progress 0->1 , quick close then open
    ctx.save();
    ctx.fillStyle = 'rgba(5,7,15,0.92)';
    const h = Math.sin(progress * Math.PI) * 28; // lid height
    // upper lid
    ctx.beginPath();
    ctx.ellipse(cx, cy - 8, 48, 14 + h * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    // lower lid hint
    ctx.beginPath();
    ctx.ellipse(cx, cy + 6, 46, 8 + h * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function animateSplash() {
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width / 2;
    const cy = canvas.height * 0.42; // eye approx center for this art (tuned for 1024 square)

    let blinkP = 0;
    if (window._splashBlinkT && window._splashBlinkT > 0) {
      blinkP = Math.min(1, (Date.now() - window._splashBlinkT) / 380);
      drawBlink(cx, cy, blinkP);
      if (blinkP >= 1) window._splashBlinkT = 0;
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.step();
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      p.draw();
    }

    if (particles.length > 0 || (window._splashBlinkT && window._splashBlinkT > 0)) {
      animFrame = requestAnimationFrame(animateSplash);
    } else {
      // final clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      animFrame = null;
    }
  }

  function triggerEnter(e) {
    if (entered) return;
    entered = true;

    const rect = canvas.getBoundingClientRect();
    const cx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const cy = (e.clientY - rect.top) * (canvas.height / rect.height);

    // water explode
    spawnExplode(cx || canvas.width * 0.5, cy || canvas.height * 0.42, 58);

    // trigger blink
    window._splashBlinkT = Date.now();

    // start anim loop
    if (!animFrame) animateSplash();

    // "load into" the onboarding homepage
    main.classList.add('unlocked');

    // nice scroll down after short delay so user sees the effect
    setTimeout(() => {
      const services = document.getElementById('services') || document.querySelector('.trust-bar');
      if (services) services.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // optional: flash a tiny welcome
      splash.style.boxShadow = '0 0 0 3px rgba(34,197,94,0.3) inset';
      setTimeout(() => { splash.style.boxShadow = ''; }, 650);
    }, 620);

    // one-time: remove pointer cursor hint after
    splash.style.cursor = 'default';
  }

  splash.addEventListener('click', triggerEnter, { once: false });

  // Keyboard accessibility: Enter/Space on splash focuses and triggers
  splash.setAttribute('tabindex', '0');
  splash.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      const fakeEvt = { clientX: 0, clientY: 0 };
      triggerEnter(fakeEvt);
    }
  });

  // Auto-unlock hint for crawlers / no-js (content always there for SEO)
  // But keep dim until click for the intended dramatic first-visit experience
  console.log('[JPS] Splash ready — click the all-seeing plumber to unlock full site with effect.');
})();
