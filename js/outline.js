(function(){
  var SF = window.SF;

  SF.OUTLINE_HELP =
    '# Deck title            → cover (next line = subtitle, "Key: value" = meta)\n' +
    '## Section              → section divider\n' +
    '### Slide title         → content slide (layout picked from the body)\n' +
    '- Point: detail         → points / cards / big points\n' +
    '- 42% of users …        → stats (when every bullet starts with a number)\n' +
    '- 2024 — Launched       → timeline (when bullets start with dates)\n' +
    'Before: / After:        → two labelled lists become a comparison\n' +
    '> Quote  /  — Author    → quote\n' +
    '![caption](image-url)   → image, or split with bullets\n' +
    'Note: …                 → speaker notes\n' +
    '### Title {stats}       → force a layout\n' +
    '---                     → slide break';

  var SAMPLE =
    '# Launching Atlas\n' +
    'How we ship the new platform this year\n' +
    'Presenter: Sam Lee\n' +
    'Date: Q1 Kickoff\n\n' +
    '## Why now\n\n' +
    '### The problem\n' +
    'Teams lose hours every week stitching tools together.\n' +
    '- Context switching: six tools for one workflow\n' +
    '- Lost work: nothing is saved in one place\n' +
    '- Slow onboarding: weeks before new hires are productive\n\n' +
    '### By the numbers\n' +
    '- 38% of time spent searching for information\n' +
    '- 4.5x more tools than five years ago\n' +
    '- 12 hours lost per person each month\n\n' +
    '## The plan\n\n' +
    '### Roadmap\n' +
    '- Q1 — Private beta with 20 design partners\n' +
    '- Q2 — Public launch!\n' +
    '- Q3 — Integrations marketplace\n' +
    '- Q4 — Enterprise tier\n\n' +
    '### What changes\n' +
    'Today:\n' +
    '- Scattered docs\n' +
    '- Manual handoffs\n' +
    'With Atlas:\n' +
    '- One shared workspace\n' +
    '- Automated workflows\n\n' +
    '### Remember\n' +
    '> The best tool is the one your team actually uses.\n' +
    '— Product team\n' +
    'Note: Pause here for questions.';
  SF.OUTLINE_SAMPLE = SAMPLE;

  var BULLET = /^\s*([-*+•]|\d+[.)])\s+(.*)$/;
  var HEADING = /^(#{1,6})\s+(.*)$/;
  var IMAGE = /^!\[([^\]]*)\]\(([^)\s]+)\)\s*$/;
  var NOTE = /^(notes?|speaker notes?)\s*:\s*(.*)$/i;
  var CITE = /^\s*(—|–|--|~)\s*(.+)$/;
  var TIME = /^(?:(?:19|20)\d{2}(?:[-/]\d{1,2})?|Q[1-4](?:\s+(?:19|20)?\d{2})?|H[12](?:\s+\d{4})?|(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sept|Sep|Oct|Nov|Dec)\.?(?:\s+\d{1,4})?|(?:Week|Day|Phase|Step|Stage|Sprint|Month|Year)\s+\d+|v\d+(?:\.\d+)*|\d{1,2}:\d{2}(?:\s*[ap]m)?)\b/i;
  var STAT = /^([$€£¥]?\d[\d,]*(?:\.\d+)?)\s*(%|x|×|k|K|M|B|bn|\+|ms|s|h|pts)?(?=\s|$)\s*(.*)$/;

  function stripMd(s){ return String(s || '').replace(/^\*\*(.+)\*\*$/, '$1').trim(); }

  // "Title: detail", "Title — detail", "**Title** detail"
  function splitItem(text){
    var m = /^\*\*(.+?)\*\*[\s:—–-]*(.*)$/.exec(text);
    if (m) return { title:m[1].trim(), desc:m[2].trim() };
    m = /^(.{1,80}?)\s+[—–|]\s+(.+)$/.exec(text) || /^(.{1,80}?)\s+-\s+(.+)$/.exec(text) || /^([^:]{1,60}):\s+(.+)$/.exec(text);
    if (m) return { title:m[1].trim(), desc:m[2].trim() };
    return { title:text.trim(), desc:'' };
  }

  function newSlide(title, level){
    var hint = '', m = /\s*\{(\w+)\}\s*$/.exec(title || '');
    if (m && SF.LAYOUTS[m[1].toLowerCase()]){ hint = m[1].toLowerCase(); title = title.slice(0, m.index); }
    return { title:stripMd(title), level:level, hint:hint, bullets:[], paras:[], quotes:[], cite:'', images:[], notes:[], groups:[], meta:[] };
  }

  function pickLayout(s){
    var b = s.bullets;
    if (s.hint) return s.hint;
    var labelled = s.groups.filter(function(g){ return g.label && g.items.length; });
    if (labelled.length === 2) return 'compare';
    var plus = b.filter(function(x){ return x.marker === '+'; }).length;
    if (plus && plus < b.length) return 'compare';
    if (s.quotes.length && !b.length) return 'quote';
    if (s.images.length) return b.length || s.paras.length ? 'split' : 'image';
    if (!b.length) return 'statement';
    if (b.length >= 3 && b.filter(function(x){ return TIME.test(x.text); }).length >= Math.ceil(b.length * 0.7)) return 'timeline';
    if (b.length >= 2 && b.length <= 4 && b.every(function(x){ return STAT.test(x.text); })) return 'stats';
    var items = b.map(function(x){ return splitItem(x.text); });
    var withDesc = items.filter(function(x){ return x.desc; });
    var avg = withDesc.reduce(function(a, x){ return a + x.desc.length; }, 0) / (withDesc.length || 1);
    if (b.length >= 2 && b.length <= 4 && withDesc.length === b.length && avg > 38) return 'cards';
    if (b.length <= 4 && !withDesc.length && items.every(function(x){ return x.title.length < 70; })) return 'bigpoints';
    return 'points';
  }

  function itemsFor(layout, bullets){
    return bullets.map(function(x){
      var t = x.text, it;
      if (layout === 'stats'){
        var m = STAT.exec(t);
        if (m){
          var label = splitItem(m[3]);
          return { value:m[1].replace(/,/g, ''), suffix:m[2] || '', title:label.title, desc:label.desc };
        }
      }
      if (layout === 'timeline'){
        var tm = TIME.exec(t);
        if (tm){
          var rest = t.slice(tm[0].length).replace(/^\s*[—–:|,-]\s*/, '').trim();
          it = splitItem(rest);
          it.time = tm[0];
        }
      }
      if (!it) it = splitItem(t);
      if (/!\s*$/.test(it.title)){ it.hot = true; it.title = it.title.replace(/\s*!\s*$/, ''); }
      if (!it.desc && x.sub.length) it.desc = x.sub.join(' · ');
      return it;
    });
  }

  function build(s){
    var layout = pickLayout(s);
    var g = { title:s.title, items:[] };
    var para = s.paras.join('\n');
    if (layout === 'statement'){
      if (para){ g.eyebrow = s.title; g.text = para; }
      else g.text = s.title;
      g.title = '';
    } else if (layout === 'quote'){
      g.quote = s.quotes.join('\n') || para || s.title;
      g.cite = s.cite;
    } else {
      if (para) g.lede = para;
      g.items = itemsFor(layout, s.bullets);
    }
    if (s.images.length){ g.image = s.images[0].url; g.caption = s.images[0].caption; }
    if (layout === 'compare'){
      var lab = s.groups.filter(function(x){ return x.label && x.items.length; });
      if (lab.length === 2){
        g.leftTitle = lab[0].label; g.rightTitle = lab[1].label;
        g.left = itemsFor('points', lab[0].items); g.right = itemsFor('points', lab[1].items);
      } else {
        g.left = itemsFor('points', s.bullets.filter(function(x){ return x.marker === '+'; }));
        g.right = itemsFor('points', s.bullets.filter(function(x){ return x.marker !== '+'; }));
      }
      g.items = g.left.concat(g.right);
    }
    var slide = SF.makeSlide(layout, SF.fromGeneric(layout, g));
    if (s.notes.length) slide.notes = s.notes.join('\n');
    return slide;
  }

  SF.parseOutline = function(text, _retry){
    var src = String(text || '').replace(/\r\n?/g, '\n');
    var all = src.split('\n');

    // Work out which heading levels mean cover / section / slide.
    var levels = [], firstLevel = 0, h1count = {};
    all.forEach(function(l){
      var m = HEADING.exec(l.trim());
      if (!m) return;
      var n = m[1].length;
      if (!firstLevel) firstLevel = n;
      h1count[n] = (h1count[n] || 0) + 1;
      if (levels.indexOf(n) < 0) levels.push(n);
    });
    levels.sort();
    var coverLevel = 0, sectionLevel = 0, slideLevel = 0;
    if (levels.length){
      var rest = levels.slice();
      if (h1count[levels[0]] === 1 && firstLevel === levels[0] && levels.length > 1){ coverLevel = levels[0]; rest.shift(); }
      if (rest.length >= 2){ sectionLevel = rest[0]; slideLevel = rest[1]; }
      else if (rest.length === 1) slideLevel = rest[0];
      else { slideLevel = coverLevel; coverLevel = 0; }
    }

    if (!slideLevel) slideLevel = 9;
    var raw = [], cur = null, inNotes = false, deckTitle = '';
    function flush(){ if (cur) raw.push(cur); cur = null; inNotes = false; }
    function ensure(){ if (!cur) cur = newSlide('', slideLevel || 9); return cur; }

    if (!levels.length && !_retry){
      // No headings: each blank-line-separated block is a slide; first line is its title.
      var blocks = src.split(/\n\s*\n/).map(function(b){ return b.trim(); }).filter(Boolean);
      src = blocks.map(function(b, i){
        var ls = b.split('\n');
        if (/^---+$/.test(ls[0])) ls.shift();
        if (ls.length && !BULLET.test(ls[0]) && !/^>/.test(ls[0])) ls[0] = (i === 0 && blocks.length > 1 ? '# ' : '### ') + ls[0];
        return ls.join('\n');
      }).join('\n\n');
      return SF.parseOutline(src, true);
    }

    all.forEach(function(line){
      var t = line.trim();
      if (!t){ return; }
      if (/^(-{3,}|\*{3,}|_{3,})$/.test(t)){ flush(); return; }
      var h = HEADING.exec(t);
      if (h){
        var n = h[1].length, title = h[2].trim();
        if (n === coverLevel || n === sectionLevel || n === slideLevel || !cur || n < slideLevel){
          flush();
          cur = newSlide(title, n);
          if (n === coverLevel){ cur.kind = 'cover'; deckTitle = stripMd(cur.title); }
          else if (n === sectionLevel) cur.kind = 'section';
          return;
        }
        // Deeper heading inside a slide acts as a group label.
        cur.groups.push({ label:stripMd(title), items:[] });
        return;
      }
      var s = ensure();
      var nm = NOTE.exec(t);
      if (nm || /^\/\//.test(t)){ inNotes = true; var nt = nm ? nm[2] : t.replace(/^\/\/\s*/, ''); if (nt) s.notes.push(nt); return; }
      if (inNotes){ s.notes.push(t); return; }
      if (!s.title && !BULLET.test(t) && !/^>/.test(t) && !IMAGE.test(t)){ s.title = stripMd(t); return; }
      var im = IMAGE.exec(t);
      if (im){ s.images.push({ caption:im[1], url:im[2] }); return; }
      if (/^>/.test(t)){
        var q = t.replace(/^>\s?/, '');
        var c = CITE.exec(q);
        if (c && s.quotes.length) s.cite = c[2].trim();
        else if (q) s.quotes.push(q.replace(/^["“]|["”]$/g, ''));
        return;
      }
      var cm = CITE.exec(t);
      if (cm && s.quotes.length && !s.bullets.length){ s.cite = cm[2].trim(); return; }
      var b = BULLET.exec(line);
      if (b){
        var indent = /^\s*/.exec(line)[0].replace(/\t/g, '  ').length;
        var prev = s.bullets[s.bullets.length - 1];
        if (indent >= 2 && prev){ prev.sub.push(b[2].trim()); return; }
        var item = { text:b[2].trim(), marker:b[1], sub:[] };
        s.bullets.push(item);
        if (!s.groups.length) s.groups.push({ label:'', items:[] });
        s.groups[s.groups.length - 1].items.push(item);
        return;
      }
      if (/^[^:]{1,40}:$/.test(t)){ s.groups.push({ label:t.slice(0, -1).trim(), items:[] }); return; }
      if (s.kind === 'cover'){
        var kv = /^([^:]{1,24}):\s+(.+)$/.exec(t);
        if (kv){ s.meta.push(SF.cell(kv[1]) + ' | ' + SF.cell(kv[2])); return; }
      }
      s.paras.push(t);
    });
    flush();

    var slides = [], secNum = 0, secTitle = '';
    raw.forEach(function(s){
      if (s.kind === 'cover'){
        var cv = SF.makeSlide('cover', {
          title:s.title, eyebrow:'', badge:'',
          subtitle:s.paras.join('\n'),
          meta:s.meta.join('\n') || s.bullets.map(function(b){ var it = splitItem(b.text); return SF.cell(it.title) + (it.desc ? ' | ' + SF.cell(it.desc) : ''); }).join('\n')
        });
        if (s.notes.length) cv.notes = s.notes.join('\n');
        slides.push(cv);
        return;
      }
      if (s.kind === 'section'){
        secNum++; secTitle = s.title;
        var sec = SF.makeSlide('section', { number:(secNum < 10 ? '0' : '') + secNum, title:s.title, pill:s.paras.join(' ') });
        if (s.notes.length) sec.notes = s.notes.join('\n');
        slides.push(sec);
        // A section heading that carries its own bullets also gets a content slide.
        if (s.bullets.length || s.quotes.length || s.images.length){ s.paras = []; slides.push(build(s)); }
        return;
      }
      if (!s.title && !s.bullets.length && !s.paras.length && !s.quotes.length && !s.images.length) return;
      slides.push(build(s));
    });

    return { title:deckTitle || (slides[0] && String(slides[0].data.title || '').replace(/\*/g, '')) || 'Untitled deck', slides:slides };
  };
})();
