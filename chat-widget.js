// JPS 24/7 Chat Widget — floating hot button on every page
// Opens assistant.html in a new window (per operator spec)
// Position: bottom-right on desktop, bottom-center on mobile

(function () {
  'use strict';

  const WIDGET_ID = 'jps-chat-widget';

  function buildWidget() {
    const existing = document.getElementById(WIDGET_ID);
    if (existing) existing.remove();

    const widget = document.createElement('div');
    widget.id = WIDGET_ID;
    widget.innerHTML = `
      <a href="assistant.html" target="_blank" rel="noopener" class="jps-chat-btn" aria-label="Open 24/7 AI Assistant">
        <span class="chat-pulse"></span>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
        </svg>
        <span class="chat-label">24/7 AI Assistant</span>
      </a>
    `;

    injectStyles();
    document.body.appendChild(widget);
  }

  function injectStyles() {
    if (document.getElementById('jps-chat-styles')) return;
    const s = document.createElement('style');
    s.id = 'jps-chat-styles';
    s.textContent = `
      #jps-chat-widget {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 9000;
        font-family: 'Montserrat', sans-serif;
      }
      .jps-chat-btn {
        display: flex;
        align-items: center;
        gap: 10px;
        background: linear-gradient(135deg, #005A9C 0%, #003D68 100%);
        color: #fff;
        padding: 14px 22px;
        border-radius: 50px;
        text-decoration: none;
        font-weight: 700;
        font-size: 0.9rem;
        letter-spacing: 0.3px;
        box-shadow: 0 4px 20px rgba(0,58,156,0.35);
        transition: all 0.25s ease;
        position: relative;
        overflow: hidden;
      }
      .jps-chat-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 30px rgba(0,58,156,0.45);
        background: linear-gradient(135deg, #0072C6 0%, #005A9C 100%);
      }
      .jps-chat-btn:active {
        transform: translateY(0);
      }
      .chat-pulse {
        position: absolute;
        inset: 0;
        border-radius: 50px;
        background: rgba(0,114,198,0.3);
        animation: chatPulse 2s infinite;
        pointer-events: none;
      }
      @keyframes chatPulse {
        0% { transform: scale(1); opacity: 0.5; }
        50% { transform: scale(1.05); opacity: 0; }
        100% { transform: scale(1); opacity: 0.5; }
      }
      .jps-chat-btn svg {
        flex-shrink: 0;
        position: relative;
        z-index: 1;
      }
      .chat-label {
        position: relative;
        z-index: 1;
        white-space: nowrap;
      }
      @media (max-width: 480px) {
        #jps-chat-widget {
          bottom: 16px;
          right: 50%;
          transform: translateX(50%);
        }
        .jps-chat-btn {
          padding: 12px 18px;
          font-size: 0.85rem;
        }
        .chat-label {
          font-size: 0.8rem;
        }
      }
    `;
    document.head.appendChild(s);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildWidget);
  } else {
    buildWidget();
  }
})();
