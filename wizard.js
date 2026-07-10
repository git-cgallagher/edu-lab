/* ============================================================
   wizard.js — optional, skippable onboarding wizard (LessonsAtHome)

   Greets a first-time visitor with a small, warm modal, asks a few
   friendly questions, pre-fills the sidebar dropdowns, and reuses the
   EXISTING app.js generate path (by firing 'change' on the real
   controls) — or lets them skip straight to the full generator.

   PROGRESSIVE ENHANCEMENT: this file self-registers, builds its own
   DOM, and touches nothing if the controls it expects are missing. If
   wizard.js fails to load, the generator is completely unaffected.

   Loads AFTER app.js (last <script> in index.html), so by the time it
   runs, app.js has already merged STEM into window.WS.TYPE_META, wired
   the control 'change' listeners, and rendered a default worksheet
   behind the overlay.

   PRIVACY: the "don't greet me again" flag lives in localStorage
   (key 'lah_wizard_seen') — that is *local to this browser only*, not
   a cookie and not sent anywhere, so it honors the no-account /
   no-tracking promise. A "Setup wizard" link in the sidebar reopens it.
   ============================================================ */
(function () {
  'use strict';

  var SEEN_KEY = 'lah_wizard_seen';

  var byId = function (id) { return document.getElementById(id); };

  /* The live sidebar controls we drive. If the essentials are missing,
     bail out entirely — the wizard is a pure enhancement. */
  var ctl = {
    subject: byId('subject'), grade: byId('grade'), difficulty: byId('difficulty'),
    type: byId('type'), theme: byId('theme'), themeOn: byId('themeOn'),
    generate: byId('generate'), controls: byId('controls')
  };
  if (!ctl.subject || !ctl.grade || !ctl.difficulty || !ctl.type || !ctl.controls) return;

  /* ---------- small helpers ---------- */
  function fire(el, type) {
    if (el) el.dispatchEvent(new Event(type, { bubbles: true }));
  }
  function optionExists(select, value) {
    return Array.prototype.some.call(select.options, function (o) { return o.value === value; });
  }
  function hasSeen() {
    try { return localStorage.getItem(SEEN_KEY) === '1'; } catch (e) { return false; }
  }
  function markSeen() {
    try { localStorage.setItem(SEEN_KEY, '1'); } catch (e) { /* private mode: greet once per load */ }
  }

  var GRADES = [
    { v: '0', label: 'Kindergarten' }, { v: '1', label: 'Grade 1' }, { v: '2', label: 'Grade 2' },
    { v: '3', label: 'Grade 3' }, { v: '4', label: 'Grade 4' }, { v: '5', label: 'Grade 5' }
  ];
  var SUBJECTS = [
    { v: 'math', label: 'Math' }, { v: 'la', label: 'Language Arts' },
    { v: 'reading', label: 'Reading' }, { v: 'stem', label: 'STEM' }
  ];
  var DIFFS = [
    { v: 'easy', label: 'Easy — warm up' }, { v: 'medium', label: 'Medium — just right' },
    { v: 'hard', label: 'Hard — a challenge' }
  ];
  function gradeLabel(v) {
    for (var i = 0; i < GRADES.length; i++) if (GRADES[i].v === String(v)) return GRADES[i].label;
    return 'this grade';
  }
  function subjectLabel(v) {
    for (var i = 0; i < SUBJECTS.length; i++) if (SUBJECTS[i].v === v) return SUBJECTS[i].label;
    return v;
  }

  /* One-tap "recipes" — concrete, appealing starting points. Every combo
     below is a VALID subject+grade+type (verified against TYPE_META), so
     the reused generate path always has a worksheet to build. */
  var RECIPES = [
    { emoji: '🧸', label: 'Kindergarten counting', cfg: { grade: 0, subject: 'math', type: 'counting', difficulty: 'easy', theme: 'animals' } },
    { emoji: '➕', label: 'Grade 2 addition facts', cfg: { grade: 2, subject: 'math', type: 'addition', difficulty: 'easy' } },
    { emoji: '📖', label: 'Grade 3 reading', cfg: { grade: 3, subject: 'reading', type: 'reading', difficulty: 'medium' } },
    { emoji: '✖️', label: 'Grade 4 multiplication', cfg: { grade: 4, subject: 'math', type: 'multiplication', difficulty: 'medium' } }
  ];

  /* Which subjects actually have at least one worksheet type at a given
     grade — data-driven from the live TYPE_META (STEM already merged in
     by app.js). This is what stops the wizard steering a user into a
     dead-end combo (e.g. Reading at Kindergarten, Language Arts at K/G1),
     where app.js generate() would bail on an empty #type. */
  function validSubjects(grade) {
    var meta = (window.WS && window.WS.TYPE_META) || {};
    var ok = {};
    for (var key in meta) {
      if (!Object.prototype.hasOwnProperty.call(meta, key)) continue;
      var m = meta[key];
      if (m && m.grades && m.grades.indexOf(grade) !== -1) ok[m.subject] = true;
    }
    return ok;
  }

  /* ============================================================
     Build the modal DOM (no inline scripts — CSP is script-src 'self')
     ============================================================ */
  var els = {};

  function makeSelect(id, items) {
    var s = document.createElement('select');
    s.id = id; s.className = 'wiz-select';
    items.forEach(function (it) {
      var o = document.createElement('option');
      o.value = it.v; o.textContent = it.label;
      s.appendChild(o);
    });
    return s;
  }
  function labeledField(text, control) {
    var lab = document.createElement('label');
    lab.className = 'wiz-field';
    var span = document.createElement('span');
    span.textContent = text;
    lab.appendChild(span); lab.appendChild(control);
    return lab;
  }

  function build() {
    var overlay = document.createElement('div');
    overlay.className = 'wiz-overlay no-print';
    overlay.id = 'wizOverlay';
    overlay.hidden = true;

    var modal = document.createElement('div');
    modal.className = 'wiz-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'wizTitle');
    modal.setAttribute('aria-describedby', 'wizIntro');
    modal.tabIndex = -1;

    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'wiz-close';
    closeBtn.setAttribute('aria-label', 'Close setup');
    closeBtn.textContent = '×'; // ×

    var title = document.createElement('h2');
    title.className = 'wiz-title'; title.id = 'wizTitle';
    title.textContent = "Let’s make your first worksheet";

    var intro = document.createElement('p');
    intro.className = 'wiz-intro'; intro.id = 'wizIntro';
    intro.textContent = "Tell us a little about your learner and we’ll set up a print-ready page for you. Prefer to explore on your own? Skip anytime — nothing here is required.";

    /* recipes */
    var recWrap = document.createElement('div');
    recWrap.className = 'wiz-recipes';
    var recLabel = document.createElement('span');
    recLabel.className = 'wiz-recipes__label';
    recLabel.textContent = 'One-tap starts';
    var chips = document.createElement('div');
    chips.className = 'wiz-chips';
    RECIPES.forEach(function (r) {
      var chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'wiz-chip';
      chip.textContent = r.emoji + ' ' + r.label;
      chip.addEventListener('click', function () { finishWith(r.cfg); });
      chips.appendChild(chip);
    });
    recWrap.appendChild(recLabel); recWrap.appendChild(chips);

    var divider = document.createElement('div');
    divider.className = 'wiz-or';
    divider.innerHTML = '<span>or choose your own</span>';

    /* fields */
    var fields = document.createElement('div');
    fields.className = 'wiz-fields';

    els.grade = makeSelect('wizGrade', GRADES);
    els.subject = makeSelect('wizSubject', SUBJECTS);
    els.difficulty = makeSelect('wizDifficulty', DIFFS);

    fields.appendChild(labeledField("Who’s this for?", els.grade));
    fields.appendChild(labeledField('What should we practice?', els.subject));

    els.note = document.createElement('p');
    els.note.className = 'wiz-note';
    els.note.id = 'wizNote';
    els.note.setAttribute('aria-live', 'polite');
    els.note.hidden = true;
    fields.appendChild(els.note);

    fields.appendChild(labeledField('How challenging?', els.difficulty));

    /* optional theme — only if THEMES loaded */
    if (window.THEMES && window.THEMES.list && window.THEMES.list.length) {
      var themeItems = window.THEMES.list.map(function (t) {
        return { v: t.id, label: (t.emoji && t.id !== 'none' ? t.emoji + ' ' : '') + (t.id === 'none' ? 'No theme' : t.label) };
      });
      els.theme = makeSelect('wizTheme', themeItems);
      fields.appendChild(labeledField('Add a fun theme? (optional)', els.theme));
    }

    /* update subject availability when the grade changes */
    els.grade.addEventListener('change', refreshSubjects);

    /* actions */
    var actions = document.createElement('div');
    actions.className = 'wiz-actions';
    var go = document.createElement('button');
    go.type = 'button'; go.className = 'wiz-btn wiz-btn--primary'; go.id = 'wizGo';
    go.textContent = 'Make my worksheet';
    go.addEventListener('click', finishFromForm);
    var skip = document.createElement('button');
    skip.type = 'button'; skip.className = 'wiz-btn wiz-btn--ghost'; skip.id = 'wizSkip';
    skip.textContent = "Skip — I’ll set it up myself";
    skip.addEventListener('click', skipWizard);
    actions.appendChild(go); actions.appendChild(skip);

    var privacy = document.createElement('p');
    privacy.className = 'wiz-privacy';
    privacy.textContent = "We remember this on this device only (browser storage — no account, no tracking), so we won’t greet you again. Reopen setup anytime from the sidebar.";

    modal.appendChild(closeBtn);
    modal.appendChild(title);
    modal.appendChild(intro);
    modal.appendChild(recWrap);
    modal.appendChild(divider);
    modal.appendChild(fields);
    modal.appendChild(actions);
    modal.appendChild(privacy);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    els.overlay = overlay;
    els.modal = modal;

    closeBtn.addEventListener('click', skipWizard);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) skipWizard(); });

    /* sidebar reopen link */
    els.reopen = document.createElement('button');
    els.reopen.type = 'button';
    els.reopen.className = 'wiz-reopen no-print';
    els.reopen.textContent = '✨ Setup wizard';
    els.reopen.addEventListener('click', openWizard);
    var sub = ctl.controls.querySelector('.sub');
    if (sub) sub.insertAdjacentElement('afterend', els.reopen);
    else ctl.controls.insertBefore(els.reopen, ctl.controls.firstChild);
  }

  /* Grey out subjects with no worksheet type at the chosen grade; if the
     current pick becomes invalid, fall back to the first valid one
     (Math always qualifies) and explain the switch politely. */
  function refreshSubjects() {
    var g = Number(els.grade.value);
    var ok = validSubjects(g);
    var opts = els.subject.options;
    var i;
    for (i = 0; i < opts.length; i++) opts[i].disabled = !ok[opts[i].value];
    var current = opts[els.subject.selectedIndex];
    if (current && current.disabled) {
      var wasLabel = subjectLabel(els.subject.value);
      for (i = 0; i < opts.length; i++) {
        if (!opts[i].disabled) { els.subject.value = opts[i].value; break; }
      }
      showNote('“' + wasLabel + '” isn’t ready for ' + gradeLabel(g) +
        ' yet — we picked ' + subjectLabel(els.subject.value) + ' for you. Change it anytime.');
    } else {
      hideNote();
    }
  }
  function showNote(msg) { els.note.textContent = msg; els.note.hidden = false; }
  function hideNote() { els.note.textContent = ''; els.note.hidden = true; }

  /* ============================================================
     Apply choices by REUSING the app.js generate path
     ============================================================ */
  function applyConfig(cfg) {
    if (cfg.grade != null) ctl.grade.value = String(cfg.grade);
    if (cfg.difficulty) ctl.difficulty.value = cfg.difficulty;
    var wantTheme = cfg.theme && cfg.theme !== 'none';
    if (ctl.theme) ctl.theme.value = wantTheme ? cfg.theme : 'none';
    if (ctl.themeOn) ctl.themeOn.checked = !!wantTheme;
    if (cfg.subject) ctl.subject.value = cfg.subject;

    /* Firing 'change' on #subject reuses app.js exactly: it repopulates
       #type for the new subject+grade, applies the type's default count,
       and calls generate(). No generation logic is duplicated here. */
    fire(ctl.subject, 'change');

    /* A recipe may request a specific worksheet type. Set it only if it is
       valid for the chosen subject+grade; otherwise keep app.js's
       first-type default. Firing 'change' on #type reuses app.js again
       (syncControls + default count + generate). */
    if (cfg.type && optionExists(ctl.type, cfg.type)) {
      ctl.type.value = cfg.type;
      fire(ctl.type, 'change');
    }
  }

  function finishFromForm() {
    finishWith({
      grade: Number(els.grade.value),
      subject: els.subject.value,
      difficulty: els.difficulty.value,
      theme: els.theme ? els.theme.value : 'none'
    });
  }
  function finishWith(cfg) {
    applyConfig(cfg);
    markSeen();
    closeWizard();
  }
  function skipWizard() {
    markSeen();
    closeWizard();
  }

  /* ============================================================
     Open / close + accessibility (focus trap, Esc, restore focus)
     ============================================================ */
  var lastFocused = null;

  function focusables() {
    var sel = 'a[href],button:not([disabled]),input:not([disabled]),' +
      'select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
    return Array.prototype.filter.call(els.modal.querySelectorAll(sel), function (el) {
      return el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0;
    });
  }
  function onKeydown(e) {
    if (e.key === 'Escape') { e.preventDefault(); skipWizard(); return; }
    if (e.key !== 'Tab') return;
    var f = focusables();
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function syncFromControls() {
    /* pre-fill the wizard from whatever is currently set in the sidebar */
    els.grade.value = ctl.grade.value;
    if (optionExists(els.subject, ctl.subject.value)) els.subject.value = ctl.subject.value;
    els.difficulty.value = ctl.difficulty.value;
    if (els.theme && ctl.theme && optionExists(els.theme, ctl.theme.value)) {
      els.theme.value = ctl.themeOn && ctl.themeOn.checked ? ctl.theme.value : 'none';
    }
  }

  function openWizard() {
    lastFocused = document.activeElement;
    syncFromControls();
    refreshSubjects();
    els.overlay.hidden = false;
    document.body.classList.add('wiz-open');
    document.addEventListener('keydown', onKeydown, true);
    els.modal.focus();
  }
  function closeWizard() {
    els.overlay.hidden = true;
    document.body.classList.remove('wiz-open');
    document.removeEventListener('keydown', onKeydown, true);
    var target = (lastFocused && lastFocused.isConnected && lastFocused !== document.body)
      ? lastFocused : els.reopen;
    if (target && target.focus) target.focus();
  }

  /* ---------- init ---------- */
  build();
  if (!hasSeen()) openWizard();

  /* expose a tiny hook (handy for manual reopen / debugging) */
  window.LAH_WIZARD = { open: openWizard, close: closeWizard };
})();
