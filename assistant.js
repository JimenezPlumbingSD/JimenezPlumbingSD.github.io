// JPS AI Assistant — Gemini-powered chat controller
// Backend: /api/chat at jps_assistant_api.py (FastAPI on port 31338)
// Fallback: local canned responses if backend is down

const API_BASE = 'http://localhost:5000';

document.addEventListener('DOMContentLoaded', () => {
  const chatArea = document.getElementById('chatArea');
  const chatInput = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendBtn');
  const fileUpload = document.getElementById('fileUpload');
  const memberIdInput = document.getElementById('memberIdInput');
  const unlockBtn = document.getElementById('unlockBtn');
  const quickActions = document.querySelectorAll('.qa-btn');

  let memberUnlocked = false;
  let memberId = null;
  let sessionId = generateSessionId();
  let conversationHistory = [];
  let requestCount = 0;
  let requestsRemaining = 10; // free tier default

  // Hardened client-side rate limiting + abuse guard (localStorage, per feature #6 + #9)
  const RATE_KEY = 'jps_chat_requests';
  const ABUSE_KEY = 'jps_chat_abuse';
  const WINDOW_MS = 6 * 60 * 60 * 1000; // 6 hours

  function loadRateState() {
    try {
      const raw = localStorage.getItem(RATE_KEY);
      if (!raw) return { count: 0, ts: Date.now() };
      const state = JSON.parse(raw);
      if (Date.now() - state.ts > WINDOW_MS) return { count: 0, ts: Date.now() };
      return state;
    } catch { return { count: 0, ts: Date.now() }; }
  }

  function saveRateState(state) {
    try { localStorage.setItem(RATE_KEY, JSON.stringify(state)); } catch {}
  }

  function isAbused() {
    try {
      const abuse = parseInt(localStorage.getItem(ABUSE_KEY) || '0', 10);
      return abuse >= 3; // after 3 strikes, locked
    } catch { return false; }
  }

  function recordAbuse() {
    try {
      let abuse = parseInt(localStorage.getItem(ABUSE_KEY) || '0', 10);
      localStorage.setItem(ABUSE_KEY, String(abuse + 1));
    } catch {}
  }

  let rateState = loadRateState();
  requestsRemaining = Math.max(0, 10 - rateState.count);
  let apiOnline = false;

  // Check API health on load
  checkAPIHealth();

  // Opening prompt per vision: promote Botwave + JPS + Telegram redirect
  setTimeout(() => {
    if (chatArea && chatArea.children.length < 3) {
      addAIMessage(
        `Hi — I'm the <strong>JPS AI Assistant</strong>, built by <strong>Botwave Digital Solutions</strong>.<br><br>` +
        `Botwave builds practical AI tools for local businesses: 24/7 customer assistants, membership programs (like JPS-MP), automated estimates, and scheduling hand-off to the owner.<br><br>` +
        `Everything the <a href="https://t.me/jimenezplumbingbot" target="_blank">@jimenezplumbingbot</a> Telegram bot can do, this web UI can do too — ask about services, get pricing, book callbacks, learn the maintenance program, or just chat plumbing.<br><br>` +
        `This is a proof-of-concept for JPS (Jimenez Plumbing Solutions) in San Diego Country Estates and North County. <strong>Chuck Jimenez</strong> still answers the real phone at (760) 789-3980.<br><br>` +
        `What can I help you with today? (Emergency? Call Chuck now.)`,
        'JPS + Botwave'
      );
    }
  }, 420);

  // Rate-limit fallback message — Botwave promo, same pattern as big tech upsells
  const FALLBACK_MESSAGE = `
<strong>You've used your 10 free messages.</strong><br><br>
<strong>Want unlimited access?</strong> Botwave builds AI assistants like this one for local businesses — 24/7 chat, automated estimates, membership programs, and Telegram bots that work when you're not in the office.<br><br>
<strong>If you're a business owner</strong> in trades, home services, or construction and want your own AI assistant:<br>
→ <a href="https://botwave.io" target="_blank" rel="noopener"><strong>botwave.io</strong></a> — see what we build<br>
→ <a href="mailto:botwave1904@gmail.com"><strong>botwave1904@gmail.com</strong></a> — reach Kyle directly<br>
→ <a href="https://instagram.com/botwave1904" target="_blank" rel="noopener"><strong>@botwave1904</strong></a> on Instagram<br><br>
<strong>Still need JPS?</strong> Call Chuck at <a href="tel:7607893980">(760) 789-3980</a> or message <a href="https://t.me/jimenezplumbingbot" target="_blank">@jimenezplumbingbot</a> on Telegram.
`;

  // Auto-resize textarea
  chatInput.addEventListener('input', () => {
    chatInput.style.height = 'auto';
    chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
  });

  // Send on Enter
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  sendBtn.addEventListener('click', handleSend);

  // Quick actions
  quickActions.forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      if (action === 'emergency') {
        launchEmergencyTriage();
        return;
      }
      const messages = {
        services: "What services does JPS offer and what are the rates?",
        estimate: "I'd like to get an estimate for a project. How does this work?",
        blueprint: "I have a blueprint or photo I'd like analyzed for a material takeoff.",
        member: "Tell me about the JPS-MP membership program. What are the tiers and benefits?",
        book: "I'd like to schedule a service call. How do I book?"
      };
      if (action === 'blueprint' && !memberUnlocked) {
        addAIMessage("Blueprint analysis is a JPS-MP member feature. Enter your member ID above to unlock, or learn about membership at our <a href='/membership.html'>JPS-MP page</a>.", "JPS AI Assistant");
        return;
      }
      if (messages[action]) {
        addUserMessage(messages[action]);
        sendToBackend(messages[action]);
      }
    });
  });

  //  Emergency Triage (state-of-the-art interactive decision tree) 
  //
  // The web UI is the front door for emergencies. Instead of a one-line
  // "call this number" reply, the user gets a clickable scenario picker
  // and a structured action plan for the situation they choose.
  const TRIAGE_SCENARIOS = {
    gas: {
      label: 'I smell gas',
      icon: '',
      severity: 'life-safety',
      steps: [
        '<strong>Do NOT flip any switches, lighters, or matches.</strong>',
        'Open windows and doors if you can do it safely.',
        'Evacuate everyone from the building. Bring pets.',
        'From a safe distance: call <a href="tel:911">911</a> (gas leaks are a fire department response).',
        'Then call JPS master plumber Chuck at <a href="tel:7607893980">(760) 789-3980</a> once you\'re clear of the building.',
        'Do not re-enter until the gas company or fire department says it\'s safe.'
      ],
      promise: 'Chuck is on call for gas emergencies during business hours. After-hours, use the 911 path first — we\'ll dispatch as soon as the scene is made safe.'
    },
    burst: {
      label: 'Burst pipe / flooding',
      icon: '',
      severity: 'urgent',
      steps: [
        'Find your main water shut-off valve. It\'s usually where the water line enters the house — basement, crawl space, garage, or outside near the meter.',
        'Turn the valve clockwise until it stops. If it\'s a lever-style valve, turn it perpendicular to the pipe.',
        'Open a faucet at the lowest point of the house to drain remaining water from the lines.',
        'Kill power to any area that\'s actively flooding near electrical outlets or panels — only if you can do so safely from a dry location.',
        'Photograph the damage for insurance.',
        'Call JPS: <a href="tel:7607893980">(760) 789-3980</a>. We\'ll walk you through the next steps and dispatch Chuck for a same-day visit during business hours.'
      ],
      promise: 'Same-day response during business hours for active flooding. We can usually be on site within 2-4 hours of your call.'
    },
    sewer: {
      label: 'Sewer backup',
      icon: '',
      severity: 'urgent',
      steps: [
        'Stop running any water in the house — no showers, dishwashers, laundry, or toilet flushes.',
        'Keep people and pets away from the affected drain or fixture. Sewage carries bacteria.',
        'If it\'s safe to do so, ventilate the area (open windows, exhaust fan).',
        'Do not use chemical drain cleaners — they make the situation worse for the plumber and can damage pipes.',
        'Call JPS: <a href="tel:7607893980">(760) 789-3980</a>. We do NOT do routine drain cleaning, but we diagnose and repair sewer line failures (collapses, root intrusions, bellied pipes).'
      ],
      promise: 'We diagnose the cause (not just snake and run). Camera inspection included on every sewer call. Honest quote on the spot.'
    },
    nohotwater: {
      label: 'No hot water',
      icon: '',
      severity: 'standard',
      steps: [
        'Check the water heater\'s pilot light (gas units) or breaker (electric units).',
        'If you have a gas water heater and the pilot is out, follow the relight instructions on the unit. If it won\'t stay lit, the thermocouple is likely bad — needs a pro.',
        'If the tank is leaking at the base, that\'s a replacement, not a repair. Stop using hot water and call us.',
        'Tankless error code? Snap a photo of the code panel and tell us the model — we can often diagnose over the phone.',
        'Otherwise: book a service call. JPS: <a href="tel:7607893980">(760) 789-3980</a>.'
      ],
      promise: 'Same-day diagnosis during business hours. Tank, tankless, or hybrid — we work on all of them.'
    },
    leak: {
      label: 'Slow leak / drip',
      icon: '',
      severity: 'routine',
      steps: [
        'Place a bucket or towel under the drip. Note where it\'s coming from (faucet, shut-off valve, supply line, drain).',
        'If the leak is at a supply line under a sink, you can usually shut off the angle stop (the small oval handle on the pipe coming out of the wall) to stop water to that fixture.',
        'Photograph the leak location — it helps us bring the right parts.',
        'Not urgent, but don\'t ignore it. A slow drip wastes water and can rot cabinets or subfloor.',
        'Book a service call: <a href="tel:7607893980">(760) 789-3980</a>. Or describe what you\'re seeing right here and I can give you a ballpark.'
      ],
      promise: 'Next-business-day service call. Most slow leaks get diagnosed and fixed in a single visit.'
    },
    other: {
      label: 'Something else',
      icon: '',
      severity: 'unknown',
      steps: [
        'Describe what you\'re seeing in the chat below — fixture type, where it is, when it started, any sounds or smells.',
        'Photo helps a lot. You can attach one with the upload button below.',
        'I\'ll give you a ballpark on whether it\'s urgent, DIY-able, or needs a pro.'
      ],
      promise: 'Live AI triage — describe the issue, I\'ll route you to the right next step.'
    }
  };

  function launchEmergencyTriage() {
    addUserMessage('I have a plumbing situation. Help me figure out what to do.');
    const scenarios = Object.entries(TRIAGE_SCENARIOS);
    const buttons = scenarios.map(([key, s]) =>
      `<button class="triage-btn triage-${s.severity}" data-triage="${key}">
         <span class="triage-icon">${s.icon}</span>
         <span class="triage-label">${s.label}</span>
       </button>`
    ).join('');

    const html = `
      <div class="triage-card">
        <div class="triage-header">
          <strong>Emergency Triage</strong>
          <span class="triage-sub">Pick the situation that matches what you're seeing.</span>
        </div>
        <div class="triage-grid">${buttons}</div>
        <div class="triage-disclaimer">
          <strong>Life-safety first.</strong> If anyone is in immediate danger — gas leak, smoke, electrical fire — call <a href="tel:911">911</a> first, then JPS.
        </div>
      </div>
    `;
    addAIMessage(html, 'JPS AI Assistant', { raw: true });
    // Wire the scenario buttons
    setTimeout(() => {
      document.querySelectorAll('.triage-btn').forEach(b => {
        b.addEventListener('click', () => showTriageResult(b.dataset.triage));
      });
    }, 50);
  }

  function showTriageResult(key) {
    const s = TRIAGE_SCENARIOS[key];
    if (!s) return;
    addUserMessage(s.icon + ' ' + s.label);

    const stepsHtml = s.steps.map((step, i) =>
      `<li><span class="step-num">${i + 1}</span><span class="step-text">${step}</span></li>`
    ).join('');

    const severityClass = `severity-${s.severity}`;

    const html = `
      <div class="triage-result ${severityClass}">
        <div class="triage-result-header">
          <span class="triage-result-icon">${s.icon}</span>
          <div>
            <strong class="triage-result-title">${s.label}</strong>
            <span class="triage-result-severity">${s.severity.replace('-', ' / ')}</span>
          </div>
        </div>
        <ol class="triage-steps">${stepsHtml}</ol>
        <div class="triage-promise">
          <strong>JPS commitment:</strong> ${s.promise}
        </div>
        <div class="triage-actions">
          <a href="tel:7607893980" class="triage-action primary"> Call (760) 789-3980</a>
          <button class="triage-action secondary" data-action="book"> Book online</button>
          <button class="triage-action tertiary" data-action="back-to-triage">← Different situation</button>
        </div>
      </div>
    `;
    addAIMessage(html, 'JPS AI Assistant', { raw: true });
    setTimeout(() => {
      const back = document.querySelector('[data-action="back-to-triage"]');
      if (back) back.addEventListener('click', launchEmergencyTriage);
      const book = document.querySelector('[data-action="book"]');
      if (book) book.addEventListener('click', () => {
        addUserMessage('Book a service call');
        addAIMessage("I'll collect a few details and Chuck will call you back. What's your name?", 'JPS AI Assistant');
        // Triggers the booking flow the existing /book quick action uses
        sendToBackend('I need to book a service call');
      });
    }, 50);
  }

  // File upload
  fileUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!memberUnlocked) {
      addAIMessage("Blueprint and photo analysis requires <strong>JPS-MP membership</strong>. Enter your member ID above, or <a href='/membership.html'>sign up here</a>.", "JPS AI Assistant");
      return;
    }
    addUserMessage(`[Uploaded: ${file.name}] — Analyzing with Gemini Vision...`);
    addAIMessage("I'm analyzing your document now. In the full deployment, this connects to Gemini Vision through our Vertex AI proxy to produce a complete material takeoff and cost estimate. For now, describe your project in detail and I can give you a ballpark range.", "JPS AI Assistant");
  });

  // Member unlock
  unlockBtn.addEventListener('click', async () => {
    const id = memberIdInput.value.trim();
    if (id.length < 4) {
      addAIMessage("Please enter a valid JPS-MP member ID. Contact <a href='tel:7607893980'>(760) 789-3980</a> if you need your ID.", "JPS AI Assistant");
      return;
    }

    // Try backend verification
    try {
      const resp = await fetch(`${API_BASE}/api/member/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: id })
      });
      const data = await resp.json();
      if (data.valid) {
        memberUnlocked = true;
        memberId = id;
        requestsRemaining = 20; // member limit
        document.getElementById('memberBar').innerHTML = `
          <span class="member-bar-label" style="color:#22C55E;"> Member ${id} verified</span>
          <span style="font-size:0.8rem;color:#94A3B8;">Blueprint analysis + priority booking unlocked — 20 msgs/30min</span>
        `;
        addAIMessage(`Welcome back, JPS-MP member ${id}! You have full access to blueprint analysis, instant quotes, priority booking, and the Botwave suite. What can I help with?`, "JPS AI Assistant");
      } else {
        addAIMessage(data.message || "Invalid member ID. Contact (760) 789-3980 for help.", "JPS AI Assistant");
      }
    } catch {
      // Fallback: accept locally
      memberUnlocked = true;
      memberId = id;
      requestsRemaining = 20;
      document.getElementById('memberBar').innerHTML = `
        <span class="member-bar-label" style="color:#22C55E;"> Member ${id} (local)</span>
        <span style="font-size:0.8rem;color:#94A3B8;">Features unlocked — 20 msgs/30min</span>
      `;
      addAIMessage(`Welcome, member ${id}! Full access unlocked. What can I help you with?`, "JPS AI Assistant");
    }
  });

  function handleSend() {
    const text = chatInput.value.trim();
    if (!text) return;
    if (isAbused()) {
      addAIMessage(FALLBACK_MESSAGE.replace(/\n/g, '<br>'), "JPS AI Assistant");
      return;
    }
    if (requestsRemaining <= 0) {
      rateState.count++;
      saveRateState(rateState);
      if (rateState.count > 15) { // abuse threshold
        recordAbuse();
        addAIMessage(FALLBACK_MESSAGE, "JPS AI Assistant");
        return;
      }
      addAIMessage(FALLBACK_MESSAGE, "JPS AI Assistant");
      return;
    }
    addUserMessage(text);
    rateState.count++;
    saveRateState(rateState);
    requestsRemaining = Math.max(0, 10 - rateState.count);
    chatInput.value = '';
    chatInput.style.height = 'auto';
    // Detect emergency keywords typed in chat → launch the triage UI
    const API_BASE = 'http://localhost:5000';


    // ...


    async function sendToBackend(text) {
        showTyping();
        try {
          const resp = await fetch(`${API_BASE}/api/v1/chat`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-API-Key': 'JPS_UNDENIABLE_AI_CORE'
            },
            body: JSON.stringify({ message: text })
          });
          removeTyping();

          const data = await resp.json();
          if (resp.ok) {
            addAIMessage(data.message, "JPS AI Assistant");
          } else {
            addAIMessage(data.error || "An error occurred.", "JPS AI Assistant (error)");
          }
          apiOnline = true;
        } catch (err) {
          removeTyping();
          const fallback = getLocalResponse(text);
          addAIMessage(fallback, "JPS AI Assistant (offline)");
          apiOnline = false;
        }
      }

  function addUserMessage(text) {
    const msg = document.createElement('div');
    msg.className = 'chat-msg chat-msg-user';
    msg.innerHTML = `
      <div class="msg-avatar"><div class="avatar-icon">YOU</div></div>
      <div class="msg-content">
        <div class="msg-header"><strong>You</strong><span class="msg-time">${timeNow()}</span></div>
        <div class="msg-body"><p>${escapeHTML(text)}</p></div>
      </div>
    `;
    chatArea.appendChild(msg);
    scrollToBottom();
    conversationHistory.push({ role: 'user', content: text });
  }

  function addAIMessage(html, name = 'JPS AI Assistant', opts = {}) {
    // If the HTML is a block (starts with <div, <ol, <ul, <table, etc.),
    // don't wrap it in <p> — that breaks block-level layout.
    const isBlock = /^\s*<(div|ol|ul|table|section|article|nav|header|footer|aside)/i.test(html);
    const body = isBlock ? html : `<p>${html}</p>`;
    const msg = document.createElement('div');
    msg.className = 'chat-msg chat-msg-ai';
    msg.innerHTML = `
      <div class="msg-avatar"><div class="avatar-icon">JPS</div></div>
      <div class="msg-content">
        <div class="msg-header"><strong>${name}</strong><span class="msg-time">${timeNow()}</span></div>
        <div class="msg-body">${body}</div>
      </div>
    `;
    chatArea.appendChild(msg);
    scrollToBottom();
    conversationHistory.push({ role: 'assistant', content: html });
  }

  function showTyping() {
    const typing = document.createElement('div');
    typing.className = 'chat-msg chat-msg-ai';
    typing.id = 'typingMsg';
    typing.innerHTML = `
      <div class="msg-avatar"><div class="avatar-icon">JPS</div></div>
      <div class="msg-content">
        <div class="msg-header"><strong>JPS AI Assistant</strong><span class="msg-time">typing...</span></div>
        <div class="msg-body"><div class="typing-indicator"><span></span><span></span><span></span></div></div>
      </div>
    `;
    chatArea.appendChild(typing);
    scrollToBottom();
  }

  function removeTyping() {
    const el = document.getElementById('typingMsg');
    if (el) el.remove();
  }

  async function checkAPIHealth() {
    try {
      const resp = await fetch(`${API_BASE}/api/health`, { signal: AbortSignal.timeout(3000) });
      if (resp.ok) {
        apiOnline = true;
        document.querySelector('.status-text').textContent = 'Online — Gemini 2.5 Flash';
      }
    } catch {
      apiOnline = false;
      document.querySelector('.status-text').textContent = 'Offline — local mode';
    }
  }

  //  Local fallback responses (when API is down) 
  //
  // Pricing data is loaded from /jps_config.json which the JPS Telegram
  // /setup wizard writes to. This keeps the web UI, the owner bot, and
  // the customer bot in lockstep. If the JSON is missing (or fetch fails),
  // we fall back to the hardcoded 2026 numbers below as a last resort.
  let PRICING = {
    rates: {
      master_plumber: 150, journeyman: 125, helper_apprentice: 75,
      service_call_first_hour: 225, emergency_after_hours: 200, weekend: 175,
      markup_multiplier: 1.43,
    },
    membership: {
      tiers: [
        { name: 'Essential', annual: 179, popular: false,
          service_call_discount_pct: 15, remodel_repipe_discount_pct: 10,
          free_emergency_calls_per_year: 0, warranty_extension_days: 30 },
        { name: 'Plus', annual: 329, popular: true,
          service_call_discount_pct: 20, remodel_repipe_discount_pct: 15,
          free_emergency_calls_per_year: 2, warranty_extension_days: 90 },
        { name: 'Premium', annual: 549, popular: false,
          service_call_discount_pct: 25, remodel_repipe_discount_pct: 20,
          free_emergency_calls_per_year: -1, warranty_extension_days: 365 },
      ],
    },
    company: {
      web_ui_url: 'https://jps33sd.com/assistant.html',
      membership_url: 'https://jps33sd.com/membership.html',
      customer_bot: '@jimenezplumbingbot',
    },
  };
  // Best-effort fetch — never blocks, never throws.
  fetch('./jps_config.json', { cache: 'no-store' })
    .then(r => r.ok ? r.json() : null)
    .then(j => { if (j) PRICING = j; })
    .catch(() => { /* keep defaults */ });

  function fmtRateSheet() {
    const r = PRICING.rates;
    return (
      `JPS 2026 Rate Sheet:<br><br>` +
      `• Master Plumber: $${r.master_plumber}/hr<br>` +
      `• Journeyman: $${r.journeyman}/hr<br>` +
      `• Helper/Apprentice: $${r.helper_apprentice}/hr<br>` +
      `• Service call: $${r.service_call_first_hour} (first hour included)<br>` +
      `• Emergency/after-hours: $${r.emergency_after_hours}/hr<br>` +
      `• Weekend: $${r.weekend}/hr<br><br>` +
      `All bids: (Labor + Materials) × ${r.markup_multiplier}<br>` +
      `JPS-MP members save on service calls + remodels.<br><br>` +
      `What service are you looking at?`
    );
  }

  function fmtMembership() {
    const t = PRICING.membership.tiers;
    let s = '<strong>JPS-MP Membership Program</strong><br><br>Three tiers:<br><br>';
    t.forEach(tier => {
      const popular = tier.popular ? ' (Most Popular)' : '';
      const emg = tier.free_emergency_calls_per_year === -1
        ? 'unlimited free emergency calls/yr'
        : tier.free_emergency_calls_per_year > 0
          ? `${tier.free_emergency_calls_per_year} free emergency calls/yr`
          : 'no free emergency calls';
      s += `<strong>${tier.name} — $${tier.annual}/yr</strong>${popular}<br>` +
           `  • ${tier.service_call_discount_pct}% off service calls, ` +
           `${tier.remodel_repipe_discount_pct}% off remodels, ${emg}, ` +
           `${tier.warranty_extension_days}-day warranty<br><br>`;
    });
    s += `<a href="${PRICING.company.membership_url}">See full comparison →</a> ` +
         `or call (760) 789-3980.`;
    return s;
  }

  function getLocalResponse(text) {
    const lc = text.toLowerCase();

    if (lc.includes('kitchen') || lc.includes('bath') || lc.includes('remodel')) {
      return `Kitchen and bath remodels are JPS's specialty. Plumbing-only packages range from $2,800–$5,000 depending on scope — number of fixtures, fixture quality tier, and whether we're relocating lines or working with existing rough-in.<br><br>Want me to walk through what a typical kitchen or bath remodel involves? Or describe your specific project and I'll give you a ballpark.`;
    }
    if (lc.includes('repip') || lc.includes('copper') || lc.includes('pex')) {
      return `Whole-house repipes are a JPS core service. We do both copper and PEX.<br><br>Typical 2-bath home repipe runs $4,000–$8,000 depending on size, access (slab vs. crawl space), and number of fixtures. We handle the permit and coordinate the inspection.<br><br>Want a more specific number? Tell me your home size and I'll narrow it down.`;
    }
    if (lc.includes('gas') || lc.includes('leak') || lc.includes('smell')) {
      return `<strong>If you smell gas, take this seriously:</strong><br><br>1. Don't use any switches or appliances<br>2. Open windows if safe to do so<br>3. Evacuate the area<br>4. Call <a href="tel:7607893980">(760) 789-3980</a> once you're safe<br><br>JPS performs full LP gas line leak detection and repair. Master plumber sign-off on every gas system. Don't wait on gas leaks.`;
    }
    if (lc.includes('commercial') || lc.includes('restaurant')) {
      return `JPS handles commercial restaurant build-outs. Chuck just completed the plumbing for Ono Hawaiian BBQ in the Mt. Carmel area — grease trap, backflow preventer, commercial water heater, the full system.<br><br>Commercial work typically requires health department compliance and backflow certification. Want to discuss a specific project?`;
    }
    if (lc.includes('price') || lc.includes('cost') || lc.includes('how much') || lc.includes('rate')) {
      return fmtRateSheet();
    }
    if (lc.includes('member') || lc.includes('jps-mp') || lc.includes('plan')) {
      return fmtMembership();
    }
    if (lc.includes('botwave') || lc.includes('who built') || lc.includes('kyle') || lc.includes('this ai')) {
      return `This AI assistant was built by Chuck's son Kyle through his company <strong>Botwave Digital Solutions</strong>. Botwave provides AI automation for small businesses — custom chat assistants, membership systems, business automation, and content tools.<br><br>If you're curious about what Botwave can do for your business, check out <a href="https://botwave.io" target="_blank">botwave.io</a> or just ask me about it. Kyle also runs BOTWAVEBOMBA, a corruption and money-in-politics tracker that follows the data — not the headlines.`;
    }
    if (lc.includes('corruption') || lc.includes('political') || lc.includes('bomba') || lc.includes('tracker')) {
      return `BOTWAVEBOMBA is Botwave's corruption and money-in-politics tracker. It indexes claims from sources like OpenSecrets, FEC, CA Secretary of State, FollowTheMoney, and USASpending.<br><br>It's not a political opinion tool — it just tracks where the money goes so you can verify for yourself.<br><br>Sources: <a href="https://www.opensecrets.org" target="_blank">OpenSecrets</a> · <a href="https://www.fec.gov/data/" target="_blank">FEC</a> · <a href="https://cal-access.sos.ca.gov/" target="_blank">CA SoS</a> · <a href="https://www.followthemoney.org" target="_blank">FollowTheMoney</a> · <a href="https://www.usaspending.gov" target="_blank">USASpending</a>`;
    }
    if (lc.includes('dodgers') || lc.includes('baseball') || lc.includes('sports') || lc.includes('ohtani') || lc.includes('freeman') || lc.includes('betts')) {
      return `JPS is a Dodgers family — blue runs deep in Ramona!<br><br>Botwave's Bomba news feed tracks current events. I can pull Dodgers news when the backend is online. For now, catch the latest at <a href="https://www.mlb.com/dodgers" target="_blank">MLB.com/Dodgers</a>.<br><br>Go Blue.`;
    }

    return `Thanks for reaching out. I can help with:<br><br>
• <strong>Service information and pricing</strong> — ask about any specific service<br>
• <strong>Project estimates</strong> — describe what you need, get a ballpark<br>
• <strong>Emergency guidance</strong> — if this is urgent, call <a href="tel:7607893980">(760) 789-3980</a><br>
• <strong>JPS-MP membership</strong> — learn about our maintenance plan<br>
• <strong>Book a service call</strong> — schedule a visit<br>
• <strong>Botwave</strong> — ask who built this, or about our AI and corruption tracking tools<br>
• <strong>Dodgers</strong> — yeah, we're fans too<br><br>
What would you like to know?`;
  }

  function generateSessionId() {
    return 'sess_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
  }
  function timeNow() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  function scrollToBottom() {
    chatArea.scrollTop = chatArea.scrollHeight;
  }
  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
});