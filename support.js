/* ============================================================
   support.js — "support the project" links (Patreon, etc.)

   Data-driven framework: add entries to SUPPORT_LINKS and they
   render automatically into #support in index.html. Each entry:
     { label, url, emoji? }
   Keep it small — this is a support/donate footer, not navigation.
   Marked no-print, so it never appears on generated worksheets.
   ============================================================ */
window.SUPPORT_LINKS = [
  { label: 'Support us on Patreon', url: 'https://www.patreon.com/c/AppalachianCloud', emoji: '❤️' },
];

(function renderSupportLinks(){
  const host = document.getElementById('support');
  if(!host || !Array.isArray(window.SUPPORT_LINKS) || !window.SUPPORT_LINKS.length) return;
  host.innerHTML = window.SUPPORT_LINKS.map(l =>
    `<a class="support-link" href="${l.url}" target="_blank" rel="noopener noreferrer">`
    + `${l.emoji ? l.emoji + ' ' : ''}${l.label}</a>`
  ).join('');
})();
