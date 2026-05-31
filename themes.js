/* themes.js — optional decorative graphics for the worksheet generator.
 *
 * Standalone, no build step, no dependencies. Exposes window.THEMES.
 *
 * All artwork is ORIGINAL generic line art (no copyrighted/trademarked
 * characters). Icons are simple, friendly, bold-stroke SVG sized to a
 * 0 0 64 64 viewBox and draw with `currentColor` so they print cleanly
 * in black & white as well as in color.
 */
(function () {
  'use strict';

  /* ---- seeded RNG (mulberry32 + hashSeed, matching generator.js) ---- */
  function hashSeed(str) {
    str = String(str == null ? '' : str);
    var h = 1779033703 ^ str.length;
    for (var i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    return (h ^= h >>> 16) >>> 0;
  }
  function mulberry32(a) {
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ---- svg helper: wrap path/shape markup in a sized, theme-aware svg ---- */
  function svg(body) {
    return (
      '<svg class="theme-svg" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" ' +
      'fill="none" stroke="currentColor" stroke-width="2.4" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ' +
      'focusable="false">' +
      body +
      '</svg>'
    );
  }

  /* ===================== THEME ICON LIBRARIES ===================== */
  /* Each entry is a complete SVG string. Keep shapes simple & bold.   */

  var icons = {
    /* ----------------------------- DINOSAURS ----------------------------- */
    dinosaurs: [
      // long-neck sauropod
      svg(
        '<path d="M14 50c0-6 4-10 10-11 1-9 5-16 12-19 4-2 7-1 7 2 0 2-2 3-4 4-5 2-8 7-8 13 4 0 8 2 11 6"/>' +
        '<path d="M14 50h22"/><path d="M18 50v5"/><path d="M30 50v5"/>'
      ),
      // stego with back plates
      svg(
        '<path d="M10 46c4-2 9-3 14-3s11 1 16 4c3 2 6 2 9-1"/>' +
        '<path d="M12 46l4-7 5 6 5-8 5 7 5-6 4 7"/>' +
        '<path d="M14 46v6M40 47v6"/>'
      ),
      // t-rex
      svg(
        '<path d="M22 52c-3-1-6-4-6-9 0-10 7-19 17-19 6 0 10 3 10 7 0 3-2 5-6 5"/>' +
        '<path d="M16 43c-3 1-6 1-9-1"/><path d="M30 44l-3 8M38 42l3 9"/>' +
        '<circle cx="38" cy="29" r="1.4" fill="currentColor" stroke="none"/>'
      ),
      // triceratops head
      svg(
        '<path d="M16 44c-2-7 2-15 11-17 9-2 17 3 20 11"/>' +
        '<path d="M40 30l8-4M44 36l9-1"/><path d="M22 30l-2-7M30 27l1-8"/>' +
        '<path d="M18 44h24"/>'
      ),
      // hatching egg
      svg(
        '<path d="M22 52c-6 0-10-6-10-14C12 28 17 18 26 18s14 10 14 20c0 8-4 14-10 14z" transform="translate(6 0)"/>' +
        '<path d="M22 34l5 4 4-5 4 5 5-4"/>'
      ),
      // pterodactyl
      svg(
        '<path d="M8 24c10-2 18 4 24 12 6-8 14-14 24-12"/>' +
        '<path d="M32 36v10"/><path d="M32 22c2 0 4 2 4 4"/>' +
        '<path d="M28 48l4-2 4 2"/>'
      )
    ],

    /* ------------------------------ ANIMALS ------------------------------ */
    animals: [
      // cat face
      svg(
        '<circle cx="32" cy="34" r="16"/>' +
        '<path d="M20 24l-4-8 10 4M44 24l4-8-10 4"/>' +
        '<circle cx="26" cy="33" r="1.6" fill="currentColor" stroke="none"/>' +
        '<circle cx="38" cy="33" r="1.6" fill="currentColor" stroke="none"/>' +
        '<path d="M30 40c1 1 3 1 4 0"/>'
      ),
      // dog face
      svg(
        '<path d="M20 22c-6 0-10 5-10 12s5 14 22 14 22-7 22-14-4-12-10-12"/>' +
        '<path d="M20 22c-2-4 2-8 6-6M44 22c2-4-2-8-6-6"/>' +
        '<circle cx="26" cy="34" r="1.6" fill="currentColor" stroke="none"/>' +
        '<circle cx="38" cy="34" r="1.6" fill="currentColor" stroke="none"/>' +
        '<path d="M32 38v3M30 43c1 1 3 1 4 0"/>'
      ),
      // elephant
      svg(
        '<path d="M14 48c-3-3-4-8-4-12 0-10 8-18 18-18s18 7 18 16c0 4-1 8-3 11"/>' +
        '<path d="M30 34c0 6-1 12-6 14-3 1-6-1-6-4 0-2 2-3 4-3"/>' +
        '<circle cx="38" cy="30" r="1.6" fill="currentColor" stroke="none"/>' +
        '<path d="M44 26c4-2 7 0 7 4"/>'
      ),
      // bunny
      svg(
        '<circle cx="32" cy="40" r="13"/>' +
        '<path d="M26 28V12c0-3 4-3 4 0v15M34 28V12c0-3 4-3 4 0v15"/>' +
        '<circle cx="28" cy="39" r="1.4" fill="currentColor" stroke="none"/>' +
        '<circle cx="36" cy="39" r="1.4" fill="currentColor" stroke="none"/>' +
        '<path d="M32 43v3M30 47c1 1 3 1 4 0"/>'
      ),
      // chick
      svg(
        '<circle cx="32" cy="36" r="14"/>' +
        '<path d="M30 30l-6 2 6 2" fill="none"/>' +
        '<circle cx="36" cy="31" r="1.6" fill="currentColor" stroke="none"/>' +
        '<path d="M32 22v-6M27 24l-3-4M37 24l3-4"/>' +
        '<path d="M24 50l4-4 4 4 4-4 4 4"/>'
      ),
      // fox
      svg(
        '<path d="M16 24l6 6c6-3 14-3 20 0l6-6-2 14c0 8-7 14-14 14s-14-6-14-14z"/>' +
        '<circle cx="26" cy="34" r="1.6" fill="currentColor" stroke="none"/>' +
        '<circle cx="38" cy="34" r="1.6" fill="currentColor" stroke="none"/>' +
        '<path d="M32 39l-3 3h6z" fill="currentColor" stroke="none"/>'
      )
    ],

    /* ------------------------------- SPACE ------------------------------- */
    space: [
      // rocket
      svg(
        '<path d="M32 6c8 6 11 16 11 26l-4 6H25l-4-6c0-10 3-20 11-26z"/>' +
        '<circle cx="32" cy="26" r="4"/>' +
        '<path d="M25 38l-7 6 4-12M39 38l7 6-4-12"/>' +
        '<path d="M28 44c1 6 4 10 4 10s3-4 4-10"/>'
      ),
      // planet with ring
      svg(
        '<circle cx="32" cy="32" r="14"/>' +
        '<ellipse cx="32" cy="32" rx="24" ry="8" transform="rotate(-20 32 32)"/>'
      ),
      // robot
      svg(
        '<rect x="18" y="22" width="28" height="24" rx="4"/>' +
        '<circle cx="27" cy="32" r="2.5"/><circle cx="37" cy="32" r="2.5"/>' +
        '<path d="M26 40h12"/><path d="M32 22v-6M32 16h-4M32 16h4"/>' +
        '<path d="M18 30h-5M46 30h5"/>'
      ),
      // star (5 point, outline)
      svg(
        '<path d="M32 8l7 14 16 2-12 11 3 16-14-8-14 8 3-16-12-11 16-2z"/>'
      ),
      // ufo
      svg(
        '<ellipse cx="32" cy="34" rx="22" ry="7"/>' +
        '<path d="M20 32c0-7 5-12 12-12s12 5 12 12"/>' +
        '<path d="M22 41l-3 7M42 41l3 7M32 41v8"/>'
      ),
      // crescent moon
      svg(
        '<path d="M40 12a22 22 0 1 0 0 40 18 18 0 0 1 0-40z"/>' +
        '<circle cx="30" cy="22" r="1.4" fill="currentColor" stroke="none"/>' +
        '<circle cx="26" cy="34" r="1.2" fill="currentColor" stroke="none"/>'
      )
    ],

    /* ------------------------------ FANTASY ------------------------------ */
    fantasy: [
      // dragon head
      svg(
        '<path d="M14 46c-2-8 2-18 12-21 8-2 16 2 20 9"/>' +
        '<path d="M46 34l6-4-2 8 6-2"/>' +
        '<path d="M22 25l-2-7 6 4M30 22V13l5 6"/>' +
        '<circle cx="38" cy="33" r="1.6" fill="currentColor" stroke="none"/>' +
        '<path d="M18 46h22"/>'
      ),
      // unicorn head
      svg(
        '<path d="M40 50c8-2 12-9 12-17 0-9-6-16-15-16-7 0-12 4-14 10"/>' +
        '<path d="M44 17l4-12 3 9"/>' +
        '<path d="M24 27c-6 1-10 5-12 11l8-2-4 8 8-4"/>' +
        '<circle cx="42" cy="32" r="1.6" fill="currentColor" stroke="none"/>'
      ),
      // castle
      svg(
        '<path d="M12 50V28h8v6h6v-6h6v6h6v-6h8v22z"/>' +
        '<path d="M12 28v-6h4v4M52 28v-6h-4v4"/>' +
        '<path d="M28 50V40h8v10"/><path d="M32 22V12l4 4-4 4"/>'
      ),
      // wizard hat
      svg(
        '<path d="M32 8L18 44h28z"/>' +
        '<path d="M14 44h36v4H14z"/>' +
        '<path d="M30 22l3 3-3 3M38 32l2 2-2 2"/>'
      ),
      // magic wand + sparkles
      svg(
        '<path d="M16 50L42 24"/>' +
        '<path d="M44 12l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/>' +
        '<path d="M18 18l1 4 4 1-4 1-1 4-1-4-4-1 4-1z"/>'
      ),
      // potion bottle
      svg(
        '<path d="M27 14h10v8l6 12c2 6-2 14-11 14s-13-8-11-14l6-12z"/>' +
        '<path d="M24 34h16"/>' +
        '<path d="M25 12h14"/>'
      )
    ],

    /* ------------------------------- NINJAS ------------------------------ */
    ninjas: [
      // masked ninja head (generic, original)
      svg(
        '<circle cx="32" cy="32" r="18"/>' +
        '<path d="M14 30h36"/><path d="M16 36h32"/>' +
        '<path d="M26 33h4M34 33h4"/>'
      ),
      // shuriken (4-point throwing star)
      svg(
        '<path d="M32 8l6 18 18 6-18 6-6 18-6-18-18-6 18-6z"/>' +
        '<circle cx="32" cy="32" r="3"/>'
      ),
      // crossed swords
      svg(
        '<path d="M14 14l28 28M22 44l4 4M40 12l4 4"/>' +
        '<path d="M50 14L22 42M42 44l-4 4M24 12l-4 4"/>'
      ),
      // ninja star burst (6-point)
      svg(
        '<path d="M32 10l4 14 14-4-10 12 10 12-14-4-4 14-4-14-14 4 10-12-10-12 14 4z"/>'
      ),
      // bo staff / nunchaku knot
      svg(
        '<path d="M12 24l16 16M24 28l12 12"/>' +
        '<circle cx="40" cy="44" r="6"/>' +
        '<path d="M44 40l8-8"/>'
      ),
      // scroll
      svg(
        '<path d="M16 18h32v28H16z"/>' +
        '<path d="M16 18c-3 0-3 6 0 6M48 18c3 0 3 6 0 6"/>' +
        '<path d="M24 30h16M24 36h12"/>'
      )
    ],

    /* ------------------------------- RESCUE ------------------------------ */
    rescue: [
      // generic puppy face (rescue pup)
      svg(
        '<circle cx="32" cy="34" r="15"/>' +
        '<path d="M18 26c-4-2-8 2-7 7 1 4 5 5 8 4M46 26c4-2 8 2 7 7-1 4-5 5-8 4"/>' +
        '<circle cx="27" cy="33" r="1.6" fill="currentColor" stroke="none"/>' +
        '<circle cx="37" cy="33" r="1.6" fill="currentColor" stroke="none"/>' +
        '<path d="M32 38v3M30 43c1 1 3 1 4 0"/>'
      ),
      // fire truck
      svg(
        '<path d="M8 40V28h26v12M34 40V22h12l6 8v10"/>' +
        '<circle cx="18" cy="44" r="4"/><circle cx="44" cy="44" r="4"/>' +
        '<path d="M8 34h26M40 24l8 12"/>'
      ),
      // police car
      svg(
        '<path d="M10 42l4-12h36l4 12"/>' +
        '<path d="M20 30l4-8h16l4 8"/>' +
        '<rect x="28" y="16" width="8" height="5" rx="1"/>' +
        '<circle cx="20" cy="44" r="4"/><circle cx="44" cy="44" r="4"/>'
      ),
      // helicopter
      svg(
        '<path d="M18 36c0-6 5-10 12-10h10l8 6v6H22z"/>' +
        '<path d="M46 38l8 2M22 48h16"/>' +
        '<path d="M10 22h44M30 22v4"/>' +
        '<path d="M28 48v4M36 48v4"/>'
      ),
      // life ring
      svg(
        '<circle cx="32" cy="32" r="18"/><circle cx="32" cy="32" r="8"/>' +
        '<path d="M32 14v8M32 42v8M14 32h8M42 32h8"/>'
      ),
      // megaphone
      svg(
        '<path d="M14 28v8l8 2 18 8V18l-18 8z"/>' +
        '<path d="M22 38v8h6v-6"/>' +
        '<path d="M46 26c4 2 4 10 0 12"/>'
      )
    ],

    /* ------------------------------- OCEAN ------------------------------- */
    ocean: [
      // fish
      svg(
        '<path d="M10 32c8-12 28-12 36 0-8 12-28 12-36 0z"/>' +
        '<path d="M46 32l10-7v14z"/>' +
        '<circle cx="22" cy="30" r="1.6" fill="currentColor" stroke="none"/>'
      ),
      // whale
      svg(
        '<path d="M10 38c0-10 9-16 20-16s22 5 24 14c0 0-6 4-14 4H18c-5 0-8-2-8-6z"/>' +
        '<path d="M48 22c2-4 6-4 8-2M44 24v-6"/>' +
        '<circle cx="22" cy="32" r="1.6" fill="currentColor" stroke="none"/>'
      ),
      // octopus
      svg(
        '<path d="M20 32c0-8 5-14 12-14s12 6 12 14v6H20z"/>' +
        '<path d="M20 38c-2 4-4 4-6 8M27 38c-1 5-2 6-2 10M37 38c1 5 2 6 2 10M44 38c2 4 4 4 6 8"/>' +
        '<circle cx="28" cy="30" r="1.6" fill="currentColor" stroke="none"/>' +
        '<circle cx="36" cy="30" r="1.6" fill="currentColor" stroke="none"/>'
      ),
      // crab
      svg(
        '<path d="M18 40c0-8 6-12 14-12s14 4 14 12"/>' +
        '<path d="M18 40c-4 0-6-4-4-8M46 40c4 0 6-4 4-8"/>' +
        '<path d="M22 40l-4 6M30 42v6M34 42v6M42 40l4 6"/>' +
        '<circle cx="28" cy="34" r="1.4" fill="currentColor" stroke="none"/>' +
        '<circle cx="36" cy="34" r="1.4" fill="currentColor" stroke="none"/>'
      ),
      // seashell
      svg(
        '<path d="M32 50C18 50 12 38 12 28c0-10 9-16 20-16s20 6 20 16c0 10-6 22-20 22z"/>' +
        '<path d="M32 50V14M32 50c-6-4-10-12-12-22M32 50c6-4 10-12 12-22"/>'
      ),
      // starfish
      svg(
        '<path d="M32 10l8 16 18 1-14 12 5 17-17-9-17 9 5-17-14-12 18-1z"/>'
      )
    ],

    /* ------------------------------- SPORTS ------------------------------ */
    sports: [
      // soccer ball
      svg(
        '<circle cx="32" cy="32" r="18"/>' +
        '<path d="M32 22l8 6-3 10h-10l-3-10z"/>' +
        '<path d="M32 22V14M27 38l-8 5M37 38l8 5"/>'
      ),
      // basketball
      svg(
        '<circle cx="32" cy="32" r="18"/>' +
        '<path d="M14 32h36M32 14v36M19 19c8 6 18 6 26 0M19 45c8-6 18-6 26 0"/>'
      ),
      // baseball
      svg(
        '<circle cx="32" cy="32" r="18"/>' +
        '<path d="M21 18c6 8 6 20 0 28M43 18c-6 8-6 20 0 28"/>'
      ),
      // trophy
      svg(
        '<path d="M22 14h20v8c0 8-4 14-10 14s-10-6-10-14z"/>' +
        '<path d="M22 18h-6c0 6 3 9 7 10M42 18h6c0 6-3 9-7 10"/>' +
        '<path d="M32 36v8M24 50h16M28 44h8v6"/>'
      ),
      // medal
      svg(
        '<path d="M24 12l8 16M40 12l-8 16"/>' +
        '<circle cx="32" cy="40" r="12"/>' +
        '<path d="M32 34l2 4 4 1-3 3 1 4-4-2-4 2 1-4-3-3 4-1z"/>'
      ),
      // whistle / flag
      svg(
        '<path d="M14 22h18v22z"/>' +
        '<path d="M14 22v28"/>' +
        '<path d="M36 24c8 0 14 4 14 4s-6 4-14 4"/>'
      )
    ],

    /* -------------------------------- NONE ------------------------------- */
    none: []
  };

  /* ===================== THEME LIST (for dropdown) ===================== */
  var list = [
    { id: 'none',      label: 'None',      emoji: '—' },
    { id: 'dinosaurs', label: 'Dinosaurs', emoji: '🦕' },
    { id: 'animals',   label: 'Animals',   emoji: '🐶' },
    { id: 'space',     label: 'Space',     emoji: '🚀' },
    { id: 'fantasy',   label: 'Fantasy',   emoji: '🐉' },
    { id: 'ninjas',    label: 'Ninjas',    emoji: '🥷' },
    { id: 'rescue',    label: 'Rescue',    emoji: '🚒' },
    { id: 'ocean',     label: 'Ocean',     emoji: '🐟' },
    { id: 'sports',    label: 'Sports',    emoji: '⚽' }
  ];

  /* ===================== PICK / DECOR HELPERS ===================== */

  // Deterministic pick of n icons for a theme given a seed string.
  // Picks without immediate repeats when the pack is large enough.
  function pick(themeId, n, seedStr) {
    var pack = icons[themeId];
    if (!pack || !pack.length || !n) return [];
    var rnd = mulberry32(hashSeed(themeId + '|' + (seedStr == null ? '' : seedStr)));
    // Shuffle a copy (Fisher-Yates) for stable, varied selection.
    var pool = pack.slice();
    for (var i = pool.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1));
      var t = pool[i]; pool[i] = pool[j]; pool[j] = t;
    }
    var out = [];
    for (var k = 0; k < n; k++) out.push(pool[k % pool.length]);
    return out;
  }

  // Header decoration: 2-3 icons that flank the worksheet title.
  function headerDecor(themeId, seedStr) {
    if (!themeId || themeId === 'none' || !icons[themeId] || !icons[themeId].length) {
      return '';
    }
    var picks = pick(themeId, 3, 'header|' + (seedStr == null ? '' : seedStr));
    var html = '<div class="theme-decor" data-theme="' + themeId + '" aria-hidden="true">';
    for (var i = 0; i < picks.length; i++) {
      html += '<span class="theme-decor__icon">' + picks[i] + '</span>';
    }
    html += '</div>';
    return html;
  }

  // Corner / footer flourish: a single small icon, absolutely positioned.
  function cornerDecor(themeId, seedStr) {
    if (!themeId || themeId === 'none' || !icons[themeId] || !icons[themeId].length) {
      return '';
    }
    var one = pick(themeId, 1, 'corner|' + (seedStr == null ? '' : seedStr))[0];
    return (
      '<div class="theme-corner" data-theme="' + themeId + '" aria-hidden="true">' +
      '<span class="theme-corner__icon">' + one + '</span></div>'
    );
  }

  /* ===================== EXPOSE API ===================== */
  window.THEMES = {
    list: list,
    icons: icons,
    pick: pick,
    headerDecor: headerDecor,
    cornerDecor: cornerDecor,
    // expose RNG internals in case the parent wants reproducible picks too
    _hashSeed: hashSeed,
    _mulberry32: mulberry32
  };
})();
