// jps_pricing_sync.js — Syncs visible JPS pricing on the static site with
// /jps_config.json (the single source of truth the JPS /setup wizard writes).
//
// Targets:
//   [data-jps-rate="service_call_first_hour"]   → $XXX service call text
//   [data-jps-rate="tier_essential"]            → $XXX JPS-MP Essential price
//   [data-jps-rate="tier_plus"]                 → $XXX JPS-MP Plus price
//   [data-jps-rate="tier_premium"]              → $XXX JPS-MP Premium price
//   [data-jps-rate="tier_range_low"]            → $179 in "$179–$549/yr"
//   [data-jps-rate="tier_range_high"]           → $549 in "$179–$549/yr"
//   [data-jps-rate="service_call_inspect"]      → $XXX in "...$XXX service call..."
//
// Best-effort: if the JSON is missing or fetch fails, the hardcoded HTML
// values stand. Never throws, never blocks the page.
(function () {
  fetch('./jps_config.json', { cache: 'no-store' })
    .then(r => r.ok ? r.json() : null)
    .then(j => { if (j) applyPricing(j); })
    .catch(() => {});

  function applyPricing(cfg) {
    const r = cfg.rates || {};
    const tiers = (cfg.membership && cfg.membership.tiers) || [];
    const find = key => tiers.find(t => t.key === key || t.name.toLowerCase() === key);

    const set = (attr, val) => {
      if (val == null) return;
      document.querySelectorAll(`[data-jps-rate="${attr}"]`).forEach(el => {
        el.textContent = val;
      });
    };

    set('service_call_first_hour', `$${r.service_call_first_hour}`);
    set('service_call_inspect',    `$${r.service_call_first_hour}`);

    const ess = find('essential');
    const plus = find('plus');
    const prem = find('premium');
    if (ess)  set('tier_essential', `$${ess.annual}`);
    if (plus) set('tier_plus',      `$${plus.annual}`);
    if (prem) set('tier_premium',   `$${prem.annual}`);
    if (ess && prem) {
      set('tier_range_low',  `$${ess.annual}`);
      set('tier_range_high', `$${prem.annual}`);
    }
  }
})();
