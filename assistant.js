// JPS AI Assistant — Gemini-powered chat controller
// Backend: /api/chat at jps_assistant_api.py (FastAPI on port 31338)
// Fallback: local canned responses if backend is down

const API_BASE = window.location.hostname === 'jps33sd.com' || window.location.hostname === 'www.jps33sd.com' || window.location.hostname === 'jimenezplumbingsd.github.io'
  ? 'https://jps-api.botwave.io'  // production — Cloud Run
  : 'http://localhost:31338';      // local dev

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
  let requestsRemaining = 5; // free tier default
  let apiOnline = false;

  // Check API health on load
  checkAPIHealth();

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
      const messages = {
        services: "What services does JPS offer and what are the rates?",
        emergency: "I have a plumbing emergency — how fast can you get here?",
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
          <span class="member-bar-label" style="color:#22C55E;">✓ Member ${id} verified</span>
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
        <span class="member-bar-label" style="color:#22C55E;">✓ Member ${id} (local)</span>
        <span style="font-size:0.8rem;color:#94A3B8;">Features unlocked — 20 msgs/30min</span>
      `;
      addAIMessage(`Welcome, member ${id}! Full access unlocked. What can I help you with?`, "JPS AI Assistant");
    }
  });

  function handleSend() {
    const text = chatInput.value.trim();
    if (!text) return;
    if (requestsRemaining <= 0) {
      addAIMessage(`You've reached the free message limit (5 per 30 minutes). <strong>Upgrade to JPS-MP</strong> for 20 messages per 30 min plus blueprint analysis and priority booking. <a href='/membership.html'>Learn more →</a>`, "JPS AI Assistant");
      return;
    }
    addUserMessage(text);
    chatInput.value = '';
    chatInput.style.height = 'auto';
    sendToBackend(text);
  }

  async function sendToBackend(text) {
    showTyping();
    try {
      const resp = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          session_id: sessionId,
          member_id: memberId,
          history: conversationHistory.slice(-10)
        })
      });
      removeTyping();

      if (resp.status === 429) {
        const data = await resp.json();
        addAIMessage(data.detail || "Rate limit reached. JPS-MP members get higher limits. <a href='/membership.html'>Learn more →</a>", "JPS AI Assistant");
        return;
      }

      const data = await resp.json();
      requestsRemaining = data.requests_remaining;
      addAIMessage(data.reply, "JPS AI Assistant");
      apiOnline = true;
    } catch (err) {
      removeTyping();
      // Fallback to local responses if API is down
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

  function addAIMessage(html, name = 'JPS AI Assistant') {
    const msg = document.createElement('div');
    msg.className = 'chat-msg chat-msg-ai';
    msg.innerHTML = `
      <div class="msg-avatar"><div class="avatar-icon">JPS</div></div>
      <div class="msg-content">
        <div class="msg-header"><strong>${name}</strong><span class="msg-time">${timeNow()}</span></div>
        <div class="msg-body"><p>${html}</p></div>
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

  // ── Local fallback responses (when API is down) ──
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
      return `JPS 2026 Rate Sheet:<br><br>• Master Plumber: $150/hr<br>• Journeyman: $125/hr<br>• Service call: $225 (first hour included)<br>• Emergency/after-hours: $200/hr<br>• Weekend: $175/hr<br><br>All bids: (Labor + Materials) × 1.43<br>JPS-MP members save 15-20% on repairs.<br><br>What service are you looking at?`;
    }
    if (lc.includes('member') || lc.includes('jps-mp') || lc.includes('plan')) {
      return `<strong>JPS-MP Membership Program</strong><br><br>
Three tiers:<br><br>
<strong>Essential — $179/yr</strong><br>
Annual inspection, priority scheduling, 15% off service calls, 10% off remodels &amp; repipes, written inspection report, 30-day warranty extension<br><br>
<strong>Plus — $329/yr (Most Popular)</strong><br>
Everything in Essential plus 2 free emergency calls/yr, 20% off service calls, 15% off remodels, water heater flush, gas leak check, 90-day warranty<br><br>
<strong>Premium — $549/yr</strong><br>
Everything in Plus plus unlimited free emergency calls, 25% off service calls, 20% off remodels, same-day guarantee, 1-year warranty, AI blueprint estimates, dedicated contact number<br><br>
<a href="/membership.html">See full comparison →</a> or call (760) 789-3980.`;
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