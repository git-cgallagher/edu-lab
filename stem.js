/* ============================================================
   stem.js — STEM subject add-on (self-registering)
   Loaded AFTER generator.js, BEFORE app.js.
   Attaches generators, metadata, and renderers onto window.WS-
   adjacent globals so the parent can merge them with one line each.

   Conventions mirrored from generator.js / app.js:
     - generator signature: function genX(R, opt){ ...returns array... }
     - all randomness flows through R (the seeded RNG) => reproducible
     - grade helper G(opt); grades K=0..5
     - every problem object carries `answer`
     - renderers return a DOM node and honor a showAns boolean
   ============================================================ */
(function () {
  'use strict';

  /* ---------- local grade helper (mirrors generator.js) ---------- */
  var G = function (opt) { return Number(opt.grade); };

  /* ---------- tiny local el() (app.js's el is NOT global) ---------- */
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* ============================================================
     CONTENT BANKS  (all curated inside stem.js)
     ============================================================ */

  /* Computer parts: part, simple job, kid-friendly nickname, scenario */
  var PARTS = [
    { part: 'CPU',         job: 'the brain that does the thinking and math',          grades: [2, 3, 4, 5], scenario: 'Which part does the calculations and runs the programs?' },
    { part: 'RAM',         job: 'short-term memory the computer uses while it works', grades: [3, 4, 5],    scenario: 'Which part holds what the computer is using RIGHT NOW but forgets when you turn it off?' },
    { part: 'Hard drive',  job: 'long-term storage that keeps your files saved',      grades: [2, 3, 4, 5], scenario: 'Which part keeps your photos and files even after the computer is turned off?' },
    { part: 'SSD',         job: 'fast long-term storage that keeps your files saved', grades: [4, 5],       scenario: 'Which fast storage part keeps your files saved when the power is off?' },
    { part: 'Monitor',     job: 'the screen that shows pictures and words',           grades: [2, 3, 4, 5], scenario: 'Which part lets you SEE what the computer is doing?' },
    { part: 'Keyboard',    job: 'lets you type letters and numbers',                  grades: [2, 3, 4, 5], scenario: 'Which part do you use to TYPE words?' },
    { part: 'Mouse',       job: 'lets you point and click on the screen',             grades: [2, 3, 4, 5], scenario: 'Which part do you use to point and click?' },
    { part: 'GPU',         job: 'draws the graphics, games, and video',               grades: [4, 5],       scenario: 'Which part helps draw fast graphics for games and video?' },
    { part: 'Speaker',     job: 'plays the sound you hear',                           grades: [2, 3, 4, 5], scenario: 'Which part lets you HEAR sound from the computer?' },
    { part: 'Printer',     job: 'puts your work on paper',                            grades: [2, 3, 4, 5], scenario: 'Which part puts your work onto paper?' }
  ];

  /* Sequencing: everyday tasks with steps in CORRECT order */
  var SEQUENCES = [
    { task: 'making a peanut butter sandwich', steps: ['Get two slices of bread', 'Spread peanut butter on one slice', 'Put the slices together', 'Take a bite'] },
    { task: 'planting a seed',                 steps: ['Dig a small hole in the soil', 'Drop the seed in the hole', 'Cover the seed with soil', 'Water the soil'] },
    { task: 'brushing your teeth',             steps: ['Put toothpaste on the brush', 'Brush your teeth', 'Spit out the toothpaste', 'Rinse with water'] },
    { task: 'washing your hands',              steps: ['Turn on the water', 'Put soap on your hands', 'Scrub your hands', 'Dry your hands with a towel'] },
    { task: 'getting ready for school',        steps: ['Wake up', 'Get dressed', 'Eat breakfast', 'Put on your backpack'] },
    { task: 'making a bowl of cereal',         steps: ['Get a bowl', 'Pour in the cereal', 'Pour in the milk', 'Eat with a spoon'] },
    { task: 'drawing a picture',               steps: ['Get a piece of paper', 'Pick up a crayon', 'Draw your picture', 'Show it to a friend'] },
    { task: 'baking cookies',                  steps: ['Mix the dough', 'Put dough on the tray', 'Bake in the oven', 'Let the cookies cool'] }
  ];

  /* ============================================================
     GENERATORS  (subject: 'stem')
     ============================================================ */

  /* ---- Computers & technology: computer parts ----
     Dedup while the distinct pool can still satisfy demand; once the
     number we've placed reaches the distinct capacity, stop deduping and
     allow repeats so we always hit opt.count (no infinite loop). */
  function genComputerParts(R, opt) {
    var g = G(opt);
    var pool = PARTS.filter(function (p) { return p.grades.indexOf(g) >= 0; });
    if (!pool.length) pool = PARTS.slice();
    // distinct capacity by grade: g<=2 match only (1 key/part);
    // g===3 both match & scenario (2 keys/part); g>=4 scenario only (1 key/part)
    var capacity = pool.length * (g === 3 ? 2 : 1);
    var probs = [], seen = new Set(), guard = 0;
    while (probs.length < opt.count && guard++ < opt.count * 80) {
      var e = R.pick(pool);
      // K-2/easy => "match part to job"; older/harder => scenario question
      var useScenario = g >= 4 || (g >= 3 && R.chance(0.5));
      var key = (useScenario ? 's' : 'm') + e.part;
      var dedup = probs.length < capacity;
      if (dedup && seen.has(key)) continue;
      seen.add(key);
      if (useScenario) {
        probs.push({ q: esc(e.scenario), answer: e.part });
      } else {
        probs.push({ q: 'What is the job of the <b>' + esc(e.part) + '</b>?', answer: e.job });
      }
    }
    return probs;
  }

  /* ---- Computers & technology: binary ---- */
  function genBinary(R, opt) {
    var g = G(opt);
    var max = g >= 5 ? 31 : 15;                 // small numbers only
    var bits = g >= 5 ? 5 : 4;
    var probs = [], seen = new Set(), guard = 0;
    while (probs.length < opt.count && guard++ < opt.count * 60) {
      var toBinary = R.chance(0.5);
      var n = R.int(0, max);
      var bin = n.toString(2);
      while (bin.length < bits) bin = '0' + bin;
      var key = (toBinary ? 'b' : 'd') + n;
      var dedup = probs.length < (max + 1) * 2; // distinct capacity: each value as binary+decimal
      if (dedup && seen.has(key)) continue;
      seen.add(key);
      if (toBinary) {
        probs.push({
          q: 'Computers use only 1s and 0s. Write <b>' + n + '</b> in binary:',
          given: String(n), answer: bin, dir: 'toBinary'
        });
      } else {
        probs.push({
          q: 'Computers use only 1s and 0s. What number is binary <b>' + bin + '</b>?',
          given: bin, answer: String(n), dir: 'toDecimal'
        });
      }
    }
    return probs;
  }

  /* ---- Logic & reasoning: sequencing (unplugged algorithms) ---- */
  function genSequencing(R, opt) {
    var probs = [], seen = new Set(), guard = 0;
    while (probs.length < opt.count && guard++ < opt.count * 60) {
      var t = R.pick(SEQUENCES);
      var dedup = probs.length < SEQUENCES.length; // unique tasks until pool exhausted
      if (dedup && seen.has(t.task)) continue;
      seen.add(t.task);
      // Build labeled, shuffled steps. label letter -> correct position index.
      var n = t.steps.length;
      var order = R.shuffle(t.steps.map(function (_, i) { return i; })); // shuffled original indices
      // order[displayPos] = originalStepIndex (0 = first step)
      var labeled = order.map(function (origIdx, displayPos) {
        return { label: String.fromCharCode(65 + displayPos), text: t.steps[origIdx], origIdx: origIdx };
      });
      // Answer = labels in correct order (step 0 first, step 1 next, ...)
      var answerLabels = [];
      for (var step = 0; step < n; step++) {
        for (var d = 0; d < labeled.length; d++) {
          if (labeled[d].origIdx === step) { answerLabels.push(labeled[d].label); break; }
        }
      }
      probs.push({
        task: t.task,
        steps: labeled.map(function (s) { return { label: s.label, text: s.text }; }),
        answer: answerLabels.join(', ')
      });
    }
    return probs;
  }

  /* ---- Logic & reasoning: what-comes-next patterns ---- */
  var SHAPES = ['▲', '●', '■', '★', '◆'];
  function genPatternLogic(R, opt) {
    var g = G(opt);
    var probs = [], seen = new Set(), guard = 0;
    var kinds = ['numStep', 'shapeAB', 'shapeABC', 'letterStep', 'letterAB'];
    if (g >= 3) kinds.push('numMul', 'numStep2');
    while (probs.length < opt.count && guard++ < opt.count * 80) {
      var kind = R.pick(kinds);
      var seq, ans, isShape = false, key;

      if (kind === 'numStep') {
        var start = R.int(1, 9), step = g <= 1 ? R.int(1, 3) : R.int(2, 6);
        var arr = [start, start + step, start + 2 * step, start + 3 * step];
        seq = arr.join(', '); ans = String(start + 4 * step); key = 'ns' + start + step;
      } else if (kind === 'numStep2') {
        var s2 = R.int(2, 6), st2 = R.int(2, 9);
        var a2 = [s2, s2 + st2, s2 + 2 * st2, s2 + 3 * st2];
        seq = a2.join(', '); ans = String(s2 + 4 * st2); key = 'n2' + s2 + st2;
      } else if (kind === 'numMul') {
        var sm = R.int(1, 3), m = R.int(2, 3);
        var am = [sm, sm * m, sm * m * m, sm * m * m * m];
        seq = am.join(', '); ans = String(sm * Math.pow(m, 4)); key = 'nm' + sm + m;
      } else if (kind === 'shapeAB') {
        isShape = true;
        var pair = R.shuffle(SHAPES).slice(0, 2);
        var sa = [pair[0], pair[1], pair[0], pair[1], pair[0]];
        seq = sa.join(' '); ans = pair[1]; key = 'sab' + pair.join('');
      } else if (kind === 'shapeABC') {
        isShape = true;
        var tri = R.shuffle(SHAPES).slice(0, 3);
        var sc = [tri[0], tri[1], tri[2], tri[0], tri[1]];
        seq = sc.join(' '); ans = tri[2]; key = 'sabc' + tri.join('');
      } else if (kind === 'letterStep') {
        var ls = R.int(0, 18), lstep = R.int(1, 2);
        var la = [0, 1, 2, 3].map(function (i) { return String.fromCharCode(65 + ls + i * lstep); });
        seq = la.join(', '); ans = String.fromCharCode(65 + ls + 4 * lstep); key = 'ls' + ls + lstep;
      } else { // letterAB
        var li = R.int(0, 22);
        var L1 = String.fromCharCode(65 + li), L2 = String.fromCharCode(65 + li + 1);
        var lab = [L1, L2, L1, L2, L1];
        seq = lab.join(', '); ans = L2; key = 'lab' + li;
      }

      // many distinct patterns are possible; dedup generously, then allow repeats
      var dedup = probs.length < 60;
      if (dedup && seen.has(key)) continue;
      seen.add(key);
      probs.push({ seq: seq, isShape: isShape, answer: ans });
    }
    return probs;
  }

  /* ---- Logic & reasoning: light deduction word problems ---- */
  function genLogicProblems(R, opt) {
    var g = G(opt);
    var probs = [], seen = new Set(), guard = 0;

    // template builders; each fills variables from R and returns {q, answer}
    function tallest() {
      var nm = R.shuffle(['Maya', 'Sam', 'Leo', 'Ava', 'Noah', 'Zoe', 'Eli', 'Ivy']).slice(0, 3);
      // nm[0] tallest > nm[1] > nm[2]
      var q = nm[0] + ' is taller than ' + nm[1] + '. ' + nm[1] + ' is taller than ' + nm[2] + '. Who is the tallest?';
      return { q: q, answer: nm[0], key: 't' + nm.join('') };
    }
    function shortest() {
      var nm = R.shuffle(['Maya', 'Sam', 'Leo', 'Ava', 'Noah', 'Zoe', 'Eli', 'Ivy']).slice(0, 3);
      var q = nm[0] + ' is older than ' + nm[1] + '. ' + nm[1] + ' is older than ' + nm[2] + '. Who is the youngest?';
      return { q: q, answer: nm[2], key: 'y' + nm.join('') };
    }
    function oddOne() {
      var groups = [
        { items: ['apple', 'banana', 'orange', 'carrot'], odd: 'carrot', why: 'it is a vegetable, the rest are fruit' },
        { items: ['dog', 'cat', 'fish', 'rabbit'], odd: 'fish', why: 'it lives in water, the rest do not' },
        { items: ['red', 'blue', 'green', 'circle'], odd: 'circle', why: 'it is a shape, the rest are colors' },
        { items: ['2', '4', '6', '7'], odd: '7', why: 'it is odd, the rest are even' },
        { items: ['car', 'bus', 'boat', 'truck'], odd: 'boat', why: 'it travels on water, the rest on roads' }
      ];
      var grp = R.pick(groups);
      var shown = R.shuffle(grp.items);
      var q = 'Which one does NOT belong? ' + shown.join(', ') + '.';
      return { q: q, answer: grp.odd + ' (' + grp.why + ')', key: 'o' + grp.odd };
    }
    function ifThen() {
      var day = R.pick(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
      var act = R.pick(['has gym class', 'gets pizza', 'goes to the library', 'has music class']);
      var q = 'Every ' + day + ', Mia ' + act + '. Today is ' + day + '. Does Mia ' + act.replace(/^has |^gets |^goes /, function (m) { return m; }) + ' today?';
      return { q: q, answer: 'Yes', key: 'if' + day + act };
    }
    function moreThan() {
      var nm = R.shuffle(['Mia', 'Leo', 'Ava', 'Noah', 'Zoe', 'Eli']).slice(0, 2);
      var item = R.pick(['stickers', 'marbles', 'crayons', 'cards', 'books']);
      var a = R.int(5, 20), b = R.int(5, 20);
      while (b === a) b = R.int(5, 20);
      var more = a > b ? nm[0] : nm[1];
      var q = nm[0] + ' has ' + a + ' ' + item + '. ' + nm[1] + ' has ' + b + ' ' + item + '. Who has more?';
      return { q: q, answer: more, key: 'mt' + nm.join('') + a + b };
    }
    function trueFalse() {
      var facts = [
        { s: 'All squares have 4 sides.', a: 'True' },
        { s: 'A triangle has 4 corners.', a: 'False (it has 3)' },
        { s: 'The sun is a star.', a: 'True' },
        { s: 'Fish can breathe in the air like people.', a: 'False' },
        { s: 'Ice is frozen water.', a: 'True' },
        { s: 'A week has 5 days.', a: 'False (it has 7)' }
      ];
      var f = R.pick(facts);
      return { q: 'True or False: ' + f.s, answer: f.a, key: 'tf' + f.s };
    }

    var builders = g <= 2
      ? [tallest, shortest, oddOne, moreThan, trueFalse]
      : [tallest, shortest, oddOne, ifThen, moreThan, trueFalse];

    while (probs.length < opt.count && guard++ < opt.count * 80) {
      var built = R.pick(builders)();
      // dedup generously; many randomized variants exist, but allow repeats
      // before the guard would ever trip on small effective pools
      var dedup = probs.length < 40;
      if (dedup && seen.has(built.key)) continue;
      seen.add(built.key);
      probs.push({ q: built.q, answer: built.answer });
    }
    return probs;
  }

  /* ============================================================
     RENDERERS  (layout name -> function(problems, showAns) -> node)
     Block-style layouts reuse existing .block / .block-grid CSS;
     STEM-specific structure styled in stem.css.
     ============================================================ */

  function ans(showAns, value) {
    return showAns
      ? 'Answer: <span class="ans">' + esc(value) + '</span>'
      : 'Answer: __________';
  }

  /* computer parts -> block layout */
  function renderComputerParts(probs, showAns) {
    var wrap = el('div', 'block-grid stem-grid');
    wrap.style.gridTemplateColumns = 'repeat(2,1fr)';
    probs.forEach(function (p, i) {
      var c = el('div', 'block');
      c.appendChild(el('div', null, '<span class="pnum">' + (i + 1) + '.</span>' + p.q));
      c.appendChild(el('div', 'work', ans(showAns, p.answer)));
      wrap.appendChild(c);
    });
    return wrap;
  }

  /* binary -> block layout with a worked area */
  function renderBinary(probs, showAns) {
    var wrap = el('div', 'block-grid stem-grid');
    wrap.style.gridTemplateColumns = 'repeat(2,1fr)';
    probs.forEach(function (p, i) {
      var c = el('div', 'block stem-binary');
      c.appendChild(el('div', null, '<span class="pnum">' + (i + 1) + '.</span>' + p.q));
      var box = showAns
        ? '<span class="bin-ans ans">' + esc(p.answer) + '</span>'
        : '<span class="bin-box"></span>';
      c.appendChild(el('div', 'work', 'Answer: ' + box));
      wrap.appendChild(c);
    });
    return wrap;
  }

  /* sequencing -> block layout with labeled steps + order line */
  function renderSequencing(probs, showAns) {
    var wrap = el('div', 'block-grid stem-grid');
    wrap.style.gridTemplateColumns = 'repeat(2,1fr)';
    probs.forEach(function (p, i) {
      var c = el('div', 'block');
      c.appendChild(el('div', null, '<span class="pnum">' + (i + 1) + '.</span>Put the steps for <b>' + esc(p.task) + '</b> in the right order.'));
      var list = el('div', 'seq-steps');
      p.steps.forEach(function (s) {
        list.appendChild(el('div', 'seq-step', '<b>' + s.label + '.</b> ' + esc(s.text)));
      });
      c.appendChild(list);
      c.appendChild(el('div', 'work',
        showAns
          ? 'Correct order: <span class="ans">' + esc(p.answer) + '</span>'
          : 'Correct order: ___, ___, ___, ___'));
      wrap.appendChild(c);
    });
    return wrap;
  }

  /* pattern logic -> inline-ish row of boxes; shapes shown big */
  function renderPatternLogic(probs, showAns) {
    var wrap = el('div', 'block-grid stem-grid');
    wrap.style.gridTemplateColumns = 'repeat(2,1fr)';
    probs.forEach(function (p, i) {
      var c = el('div', 'block stem-pattern');
      var seqHTML = p.isShape
        ? '<span class="pat-shapes">' + esc(p.seq) + '</span>'
        : '<span class="pat-seq">' + esc(p.seq) + '</span>';
      var nextBox = showAns
        ? '<span class="pat-next ans">' + esc(p.answer) + '</span>'
        : '<span class="pat-box"></span>';
      c.appendChild(el('div', 'pattern-row',
        '<span class="pnum">' + (i + 1) + '.</span> ' + seqHTML +
        ' <span class="pat-arrow">,</span> ' + nextBox));
      wrap.appendChild(c);
    });
    return wrap;
  }

  /* logic problems -> block layout */
  function renderLogicProblems(probs, showAns) {
    var wrap = el('div', 'block-grid stem-grid');
    wrap.style.gridTemplateColumns = 'repeat(2,1fr)';
    probs.forEach(function (p, i) {
      var c = el('div', 'block');
      c.appendChild(el('div', null, '<span class="pnum">' + (i + 1) + '.</span>' + esc(p.q)));
      c.appendChild(el('div', 'work', ans(showAns, p.answer)));
      wrap.appendChild(c);
    });
    return wrap;
  }

  /* ============================================================
     METADATA  (TYPE_META entries; subject:'stem')
     ============================================================ */
  var STEM_META = {
    computerparts: { subject: 'stem', group: 'Computers & technology', label: 'Computer parts & jobs', grades: [2, 3, 4, 5], layout: 'stemparts', defaultCount: 12 },
    binary:        { subject: 'stem', group: 'Computers & technology', label: 'Binary (1s & 0s)',      grades: [4, 5],       layout: 'stembinary', defaultCount: 16 },
    sequencing:    { subject: 'stem', group: 'Logic & reasoning',      label: 'Put the steps in order', grades: [0, 1, 2, 3], layout: 'stemseq', defaultCount: 8 },
    patternlogic:  { subject: 'stem', group: 'Logic & reasoning',      label: 'What comes next?',       grades: [1, 2, 3, 4, 5], layout: 'stempattern', defaultCount: 20 },
    logicproblems: { subject: 'stem', group: 'Logic & reasoning',      label: 'Logic puzzles',          grades: [2, 3, 4, 5], layout: 'stemlogic', defaultCount: 8 }
  };

  /* ============================================================
     SELF-REGISTER onto window
     ============================================================ */
  window.WS = window.WS || {};
  Object.assign(
    window.WS.GENERATORS_STEM = window.WS.GENERATORS_STEM || {},
    {
      computerparts: genComputerParts,
      binary: genBinary,
      sequencing: genSequencing,
      patternlogic: genPatternLogic,
      logicproblems: genLogicProblems
    }
  );

  window.STEM_META = STEM_META;

  window.STEM_RENDERERS = {
    stemparts: renderComputerParts,
    stembinary: renderBinary,
    stemseq: renderSequencing,
    stempattern: renderPatternLogic,
    stemlogic: renderLogicProblems
  };

})();
