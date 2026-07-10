/* ============================================================
   support.js — "support the project" links

   Data-driven framework: add entries to SUPPORT_LINKS and they
   render automatically into #support in index.html. Each entry:
     { label, url, emoji? }
   Keep it small — this is a support/tip footer, not navigation.
   Marked no-print, so it never appears on generated worksheets.

   Currently EMPTY on purpose — no public support page exists yet.
   RE-ENABLE CRITERIA (tracked in the brand-family rollout issue):
     1. The support URL returns HTTP 200 in a logged-out/private window
        (the old patreon.com/cw/AppalachianCloud link 404s — no page yet).
     2. Low-friction: a guest / one-time path, no forced account.
     3. Label names the real action (e.g. 'Buy us a coffee ☕'); never a
        stale platform name. Use "support"/"tip", never "donate"
        (Appalachian Cloud is an LLC, not a 501(c)(3) — tips aren't deductible).
   Example (leave commented until the page is live):
     // { label: 'Support LessonsAtHome', url: 'https://…', emoji: '❤️' },
   ============================================================ */
window.SUPPORT_LINKS = [
];

(function renderSupportLinks(){
  const host = document.getElementById('support');
  if(!host || !Array.isArray(window.SUPPORT_LINKS) || !window.SUPPORT_LINKS.length) return;
  host.innerHTML = window.SUPPORT_LINKS.map(l =>
    `<a class="support-link" href="${l.url}" target="_blank" rel="noopener noreferrer">`
    + `${l.emoji ? l.emoji + ' ' : ''}${l.label}</a>`
  ).join('');
})();
