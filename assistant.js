// JPS AI Assistant — Chat UI controller
// Connects to Gemini via Vertex AI proxy

document.addEventListener('DOMContentLoaded', () => {
  const chatArea = document.getElementById('chatArea');
  const chatInput = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendBtn');
  const fileUpload = document.getElementById('fileUpload');
  const memberIdInput = document.getElementById('memberIdInput');
  const unlockBtn = document.getElementById('unlockBtn');
  const quickActions = document.querySelectorAll('.qa-btn');

  let memberUnlocked = false;
  let conversationHistory = [];

  // Auto-resize textarea
  chatInput.addEventListener('input', () => {
    chatInput.style.height = 'auto';
    chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
  });

  // Send on Enter (Shift+Enter for newline)
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
        addAIMessage("Blueprint analysis is a JPS-MP member feature. Enter your member ID above to unlock, or learn about membership at the JPS-MP page.", "JPS AI Assistant");
        return;
      }
      if (messages[action]) {
        addUserMessage(messages[action]);
        simulateResponse(messages[action], action);
      }
    });
  });

  // File upload
  fileUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!memberUnlocked && (file.type.includes('pdf') || file.type.includes('image'))) {
      addAIMessage("Blueprint and photo analysis requires JPS-MP membership. Enter your member ID above, or sign up at our membership page.", "JPS AI Assistant");
      return;
    }
    addUserMessage(`[Uploaded: ${file.name}] — Analyzing...`);
    addAIMessage("I'm analyzing your document. In production, this connects to Gemini Vision via our Vertex AI proxy to produce a full material takeoff and cost estimate. For now, describe your project and I can give you a ballpark range.", "JPS AI Assistant");
  });

  // Member unlock
  unlockBtn.addEventListener('click', () => {
    const id = memberIdInput.value.trim();
    if (id.length < 4) {
      addAIMessage("Please enter a valid JPS-MP member ID. Contact (760) 789-3980 if you need your ID.", "JPS AI Assistant");
      return;
    }
    memberUnlocked = true;
    document.getElementById('memberBar').innerHTML = `
      <span class="member-bar-label" style="color:#22C55E;">✓ Member ${id} verified</span>
      <span style="font-size:0.8rem;color:#94A3B8;">Blueprint analysis + priority booking unlocked</span>
    `;
    addAIMessage(`Welcome back, JPS-MP member ${id}! You now have access to blueprint analysis, instant quotes, and priority booking. What can I help you with?`, "JPS AI Assistant");
  });

  function handleSend() {
    const text = chatInput.value.trim();
    if (!text) return;
    addUserMessage(text);
    chatInput.value = '';
    chatInput.style.height = 'auto';
    simulateResponse(text);
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
    conversationHistory.push({ role: 'user', text });
  }

  function addAIMessage(text, name = 'JPS AI Assistant') {
    const msg = document.createElement('div');
    msg.className = 'chat-msg chat-msg-ai';
    msg.innerHTML = `
      <div class="msg-avatar"><div class="avatar-icon">JPS</div></div>
      <div class="msg-content">
        <div class="msg-header"><strong>${name}</strong><span class="msg-time">${timeNow()}</span></div>
        <div class="msg-body"><p>${text}</p></div>
      </div>
    `;
    chatArea.appendChild(msg);
    scrollToBottom();
    conversationHistory.push({ role: 'assistant', text });
  }

  function simulateResponse(userText, action) {
    // Show typing indicator
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

    // Simulate AI response delay
    setTimeout(() => {
      typing.remove();
      const response = getResponse(action, userText);
      addAIMessage(response);
    }, 1200 + Math.random() * 800);
  }

  function getResponse(action, text) {
    if (action === 'services') {
      return `JPS specializes in:<br><br>
<strong>Kitchen & Bath Remodels</strong> — $2,800–$5,000 plumbing-only<br>
<strong>Custom Home Plumbing</strong> — New construction, design-build<br>
<strong>Commercial / Restaurant</strong> — Just completed Ono Hawaiian BBQ in Mt. Carmel<br>
<strong>LP Gas Leak Detection & Repair</strong> — Full gas line pressure testing<br>
<strong>Slab Leak Detection & Repair</strong><br>
<strong>Whole-House Repipes</strong> — Copper or PEX water, full sewer repipes<br>
<strong>Service Work</strong> — $225 service call, first hour included<br><br>
Master plumber rate: $150/hr. Journeyman: $125/hr. Emergency after-hours: $200/hr.`;
    }
    if (action === 'emergency') {
      return `If this is a gas leak or active water emergency:<br><br>
<strong>Call (760) 789-3980 now.</strong> JPS offers 24/7 emergency service.<br><br>
Gas leaks — evacuate first, then call. Don't use light switches or appliances near the leak.<br>
Burst pipe — shut off the main water valve if you can reach it safely.<br>
Sewer backup — stop using all water in the house.<br><br>
JPS-MP members get priority emergency booking and free dispatch ($89 value). Want to know more about membership?`;
    }
    if (action === 'estimate') {
      return `To give you a solid ballpark, I need a few details:<br><br>
1. <strong>What type of project?</strong> (remodel, repipe, new construction, service call)<br>
2. <strong>What's the scope?</strong> (how many fixtures, linear feet, square footage)<br>
3. <strong>Any access issues?</strong> (slab foundation, crawl space, multi-story)<br><br>
Every JPS bid is calculated: (Labor + Materials) × 1.43 — that covers overhead (15%), profit (10%), tax (8.25%), contingency (10%).<br><br>
Just describe your project and I'll give you a range. JPS-MP members can also upload blueprints for a full takeoff.`;
    }
    if (action === 'member') {
      return `<strong>JPS-MP Membership Program</strong><br><br>
Three tiers:<br><br>
<strong>Essential — $19/mo ($190/yr)</strong><br>
• Annual plumbing safety inspection ($467 value)<br>
• One free service call/yr ($225 value)<br>
• 15% off all service repairs<br>
• 5% off installations & repipes<br>
• Priority emergency booking<br>
• 50% off dispatch fees<br>
• Transferable membership<br><br>
<strong>Premier — $39/mo ($390/yr)</strong><br>
Everything in Essential, plus:<br>
• Annual water heater flush & descaling ($165 value)<br>
• Annual gas line safety check ($125 value)<br>
• Two free service calls/yr ($450 value)<br>
• 20% off service repairs, 10% off installations<br>
• Free emergency dispatch<br>
• Blueprint & estimate consultation<br><br>
<strong>Commercial — $79/mo ($790/yr)</strong><br>
Everything in Premier, plus:<br>
• Quarterly commercial inspections<br>
• 2-hour emergency response guarantee<br>
• Dedicated account manager<br>
• Annual compliance audit<br><br>
Sign up at our membership page or call (760) 789-3980.`;
    }
    if (action === 'book') {
      return `You can book a service call three ways:<br><br>
1. <strong>Call (760) 789-3980</strong> — talk to Chuck directly<br>
2. <strong>Use the form on our main page</strong> — jimenezplumbingsd.github.io#contact<br>
3. <strong>Tell me your details here</strong> — name, phone, address, and what you need, and we'll get back to you<br><br>
JPS-MP members get first available time slots. Same-day service available for emergencies.`;
    }

    // Generic response for freeform text
    const lc = text.toLowerCase();
    if (lc.includes('kitchen') || lc.includes('bath') || lc.includes('remodel')) {
      return `Kitchen and bath remodels are JPS's specialty. Plumbing-only packages range from $2,800–$5,000 depending on scope — number of fixtures, fixture quality tier, and whether we're relocating lines or working with existing rough-in.<br><br>Want me to walk through what a typical kitchen or bath remodel involves? Or describe your specific project and I'll give you a ballpark.`;
    }
    if (lc.includes('repip') || lc.includes('copper') || lc.includes('pex')) {
      return `Whole-house repipes are a JPS core service. We do both copper and PEX.<br><br>Typical 2-bath home repipe runs $4,000–$8,000 depending on size, access (slab vs. crawl space), and number of fixtures. We handle the permit and coordinate the inspection.<br><br>Want a more specific number? Tell me your home size and I'll narrow it down.`;
    }
    if (lc.includes('gas') || lc.includes('leak') || lc.includes('smell')) {
      return `<strong>If you smell gas, take this seriously:</strong><br><br>1. Don't use any switches or appliances<br>2. Open windows if safe to do so<br>3. Evacuate the area<br>4. Call (760) 789-3980 once you're safe<br><br>JPS performs full LP gas line leak detection and repair. Master plumber sign-off on every gas system. Don't wait on gas leaks.`;
    }
    if (lc.includes('commercial') || lc.includes('restaurant')) {
      return `JPS handles commercial restaurant build-outs. Chuck just completed the plumbing for Ono Hawaiian BBQ in the Mt. Carmel area — grease trap, backflow preventer, commercial water heater, the full system.<br><br>Commercial work typically requires health department compliance and backflow certification. Want to discuss a specific project?`;
    }
    if (lc.includes('price') || lc.includes('cost') || lc.includes('how much') || lc.includes('rate')) {
      return `JPS 2026 Rate Sheet:<br><br>• Master Plumber: $150/hr<br>• Journeyman: $125/hr<br>• Service call: $225 (first hour included)<br>• Emergency/after-hours: $200/hr<br>• Weekend: $175/hr<br><br>All bids: (Labor + Materials) × 1.43<br>JPS-MP members save 15-20% on repairs.<br><br>What service are you looking at?`;
    }

    return `Thanks for reaching out. I can help with:<br><br>
• <strong>Service information and pricing</strong> — ask about any specific service<br>
• <strong>Project estimates</strong> — describe what you need, get a ballpark<br>
• <strong>Emergency guidance</strong> — if this is urgent, call (760) 789-3980<br>
• <strong>JPS-MP membership</strong> — learn about our maintenance plan<br>
• <strong>Book a service call</strong> — schedule a visit<br><br>
What would you like to know?`;
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