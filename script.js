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

  function applyColorway(cw) {
    if (!colorwaySheet) return;
    if (cw) {
      colorwaySheet.setAttribute('href', cw);
      colorwaySheet.removeAttribute('disabled');
    } else {
      colorwaySheet.setAttribute('href', '');
      colorwaySheet.setAttribute('disabled', '');
    }
    if (colorwayMenu) {
      colorwayMenu.querySelectorAll('button[data-colorway]').forEach(b => {
        b.classList.toggle('active', b.dataset.colorway === cw);
      });
    }
  }

  if (colorwayToggle && colorwayMenu && colorwaySheet) {
    const saved = localStorage.getItem('jps_colorway') || '';
    applyColorway(saved);

    colorwayToggle.addEventListener('click', e => {
      e.stopPropagation();
      colorwayMenu.classList.toggle('open');
    });

    colorwayMenu.querySelectorAll('button[data-colorway]').forEach(btn => {
      btn.addEventListener('click', () => {
        const cw = btn.dataset.colorway;
        applyColorway(cw);
        localStorage.setItem('jps_colorway', cw);
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
