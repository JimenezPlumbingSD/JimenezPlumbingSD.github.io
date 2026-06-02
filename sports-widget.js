// JPS Sports Widget — live scores via ESPN API + colorway switcher
// Teams: Padres, Dodgers, Chargers, Lakers
// Click any team card to switch site colorway
// No API key required. CORS-accessible from browsers.

(function () {
  'use strict';

  const TEAMS = [
    { id: 'mlb-sdp',  sport: 'baseball',    league: 'mlb', teamId: '25',  name: 'Padres',   abbr: 'SD',  colorway: 'colorway-padres.css',  color: '#0B162A', accent: '#FF7F00', logo: 'https://a.espncdn.com/i/teamlogos/mlb/500/sd.png' },
    { id: 'mlb-lad',  sport: 'baseball',    league: 'mlb', teamId: '19',  name: 'Dodgers',  abbr: 'LAD', colorway: '',                     color: '#003DA5', accent: '#EF3E42', logo: 'https://a.espncdn.com/i/teamlogos/mlb/500/lad.png' },
    { id: 'nfl-lac',  sport: 'football',    league: 'nfl', teamId: '24',  name: 'Chargers', abbr: 'LAC', colorway: 'colorway-chargers.css',  color: '#003087', accent: '#FFC20E', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/lac.png' },
    { id: 'nba-lal',  sport: 'basketball',  league: 'nba', teamId: '13',  name: 'Lakers',   abbr: 'LAL', colorway: 'colorway-lakers.css',    color: '#552583', accent: '#FDB927', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/lal.png' },
  ];

  const WIDGET_ID = 'jps-sports-widget';
  let widgetEl = null;

  function getColorwaySheet() {
    return document.getElementById('colorwaySheet');
  }

  function applyColorwayFromTeam(team) {
    const sheet = getColorwaySheet();
    const html = document.documentElement;
    if (!sheet) return;

    html.classList.remove('light', 'theme-light');

    if (team.colorway) {
      sheet.setAttribute('href', team.colorway);
      sheet.removeAttribute('disabled');
    } else {
      // Dodgers = default (no sheet, clear)
      sheet.setAttribute('href', '');
      sheet.setAttribute('disabled', '');
    }

    localStorage.setItem('jps_colorway', team.colorway || '');
    localStorage.removeItem('jps_light');

    // Update active state in menu if visible
    const menu = document.getElementById('colorwayMenu');
    if (menu) {
      menu.querySelectorAll('button[data-colorway]').forEach(b => {
        const match = (b.dataset.colorway === team.colorway) || (!team.colorway && b.dataset.colorway === '');
        b.classList.toggle('active', match);
      });
    }

    window.dispatchEvent(new CustomEvent('jps-colorway-changed', { detail: { colorway: team.colorway || '', team: team.abbr } }));

    // Flash feedback on widget
    const card = document.getElementById('jsw-card-' + team.id);
    if (card) {
      card.style.transform = 'scale(1.05)';
      setTimeout(() => card.style.transform = '', 200);
    }
  }

  function buildWidget() {
    const existing = document.getElementById(WIDGET_ID);
    if (existing) existing.remove();

    widgetEl = document.createElement('div');
    widgetEl.id = WIDGET_ID;
    widgetEl.innerHTML = `
      <div class="jsw-header">
        <span class="jsw-title">Our Teams</span>
        <span class="jsw-live-dot" title="Live data"></span>
      </div>
      <div class="jsw-cards" id="jsw-cards">
        ${TEAMS.map(t => `
          <div class="jsw-card" id="jsw-card-${t.id}" data-team="${t.id}" style="--team-color:${t.color};--team-accent:${t.accent}">
            <img class="jsw-logo" src="${t.logo}" alt="${t.name}" loading="lazy" onerror="this.style.display='none'">
            <div class="jsw-info">
              <span class="jsw-name">${t.name}</span>
              <span class="jsw-score" id="jsw-score-${t.id}">Loading…</span>
            </div>
            <span class="jsw-pick" title="Switch to ${t.name} colors">Switch</span>
          </div>`).join('')}
      </div>
    `;

    injectStyles();
    document.body.appendChild(widgetEl);

    // Click handler for colorway switch
    widgetEl.querySelectorAll('.jsw-card').forEach(card => {
      card.addEventListener('click', (e) => {
        // Don't trigger if clicking score text (which may be a link later)
        const teamId = card.dataset.team;
        const team = TEAMS.find(t => t.id === teamId);
        if (team) applyColorwayFromTeam(team);
      });
      card.style.cursor = 'pointer';
    });

    TEAMS.forEach(team => fetchTeamScore(team));
    setInterval(() => TEAMS.forEach(team => fetchTeamScore(team)), 90000);
  }

  function fetchTeamScore(team) {
    const url = `https://site.api.espn.com/apis/site/v2/sports/${team.sport}/${team.league}/scoreboard`;
    fetch(url, { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return setScore(team.id, 'No data');
        const event = (data.events || []).find(e =>
          e.competitions[0].competitors.some(c => c.team.id === team.teamId)
        );
        if (!event) return setScore(team.id, 'No game today');

        const comp = event.competitions[0];
        const home = comp.competitors.find(c => c.homeAway === 'home');
        const away = comp.competitors.find(c => c.homeAway === 'away');
        const status = comp.status.type;
        const ourTeam = comp.competitors.find(c => c.team.id === team.teamId);
        const opponent = comp.competitors.find(c => c.team.id !== team.teamId);

        let scoreText = '';
        if (status.name === 'STATUS_FINAL') {
          const won = parseInt(ourTeam.score) > parseInt(opponent.score);
          const result = won ? 'W' : 'L';
          scoreText = `${result} ${ourTeam.score}–${opponent.score} vs ${opponent.team.abbreviation}`;
        } else if (status.name === 'STATUS_IN_PROGRESS') {
          scoreText = `LIVE ${away.score}–${home.score} · ${status.shortDetail || ''}`;
          document.getElementById('jsw-card-' + team.id)?.classList.add('jsw-live');
        } else if (status.name === 'STATUS_SCHEDULED') {
          const d = new Date(comp.date);
          const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
          scoreText = `${time} vs ${opponent.team.abbreviation}`;
        } else {
          scoreText = status.shortDetail || status.description || '—';
        }
        setScore(team.id, scoreText);
      })
      .catch(() => setScore(team.id, '—'));
  }

  function setScore(teamId, text) {
    const el = document.getElementById('jsw-score-' + teamId);
    if (el) el.textContent = text;
  }

  function injectStyles() {
    if (document.getElementById('jsw-styles')) return;
    const s = document.createElement('style');
    s.id = 'jsw-styles';
    s.textContent = `
      #jps-sports-widget {
        position: fixed;
        bottom: 90px;
        left: 16px;
        background: #0f172a;
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 14px;
        padding: 10px 12px;
        z-index: 8000;
        box-shadow: 0 8px 30px rgba(0,0,0,0.4);
        min-width: 220px;
        max-width: 260px;
        font-family: 'Open Sans', sans-serif;
        transition: transform 0.2s, box-shadow 0.2s;
      }
      #jps-sports-widget:hover {
        box-shadow: 0 12px 40px rgba(0,0,0,0.5);
      }
      .jsw-header {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 8px;
      }
      .jsw-title {
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: rgba(255,255,255,0.5);
      }
      .jsw-live-dot {
        width: 6px; height: 6px;
        background: #22c55e;
        border-radius: 50%;
        animation: jsw-pulse 2s infinite;
      }
      @keyframes jsw-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.3; }
      }
      .jsw-cards { display: flex; flex-direction: column; gap: 6px; max-height: 0; overflow: hidden; transition: max-height 0.25s ease; }
      #jps-sports-widget:hover .jsw-cards { max-height: 220px; }
      .jsw-card {
        display: flex;
        align-items: center;
        gap: 8px;
        background: rgba(255,255,255,0.05);
        border-left: 3px solid var(--team-accent);
        border-radius: 8px;
        padding: 6px 8px;
        transition: all 0.2s ease;
        position: relative;
      }
      .jsw-card:hover {
        background: rgba(255,255,255,0.1);
        transform: translateX(4px);
      }
      .jsw-card.jsw-live { background: rgba(34,197,94,0.08); }
      .jsw-logo { width: 28px; height: 28px; object-fit: contain; flex-shrink: 0; }
      .jsw-info { display: flex; flex-direction: column; min-width: 0; flex: 1; }
      .jsw-name {
        font-size: 11px;
        font-weight: 700;
        color: #ffffff;
        line-height: 1.2;
      }
      .jsw-score {
        font-size: 10px;
        color: rgba(255,255,255,0.6);
        line-height: 1.3;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .jsw-pick {
        font-size: 9px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--team-accent);
        opacity: 0;
        transition: opacity 0.2s;
        padding: 2px 4px;
        background: rgba(0,0,0,0.3);
        border-radius: 4px;
      }
      .jsw-card:hover .jsw-pick { opacity: 1; }
      @media (max-width: 480px) {
        #jps-sports-widget { bottom: 80px; left: 8px; min-width: 180px; max-width: 200px; }
      }
    `;
    document.head.appendChild(s);
  }

  // Expose globally for other scripts
  window.jpsSwitchColorwayByTeam = applyColorwayFromTeam;
  window.jpsSportsTeams = TEAMS;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildWidget);
  } else {
    buildWidget();
  }
})();
