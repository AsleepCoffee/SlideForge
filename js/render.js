function SF_RENDER(){
  var SF = window.SF = window.SF || {};

  SF.FONTS = {
    grotesk:  { name:'Grotesk',   d:"'Space Grotesk'",    b:"'Inter'",         m:"'JetBrains Mono'", q:'family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500;700' },
    editorial:{ name:'Editorial', d:"'Fraunces'",         b:"'Inter'",         m:"'IBM Plex Mono'",  q:'family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Inter:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500' },
    tech:     { name:'Tech',      d:"'Sora'",             b:"'Manrope'",       m:"'Space Mono'",     q:'family=Sora:wght@400;600;700&family=Manrope:wght@300;400;500;600&family=Space+Mono:wght@400;700' },
    clean:    { name:'Clean',     d:"'Outfit'",           b:"'DM Sans'",       m:"'DM Mono'",        q:'family=Outfit:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500' },
    classic:  { name:'Classic',   d:"'Playfair Display'", b:"'Source Sans 3'", m:"'IBM Plex Mono'",  q:'family=Playfair+Display:wght@500;600;700&family=Source+Sans+3:wght@300;400;600&family=IBM+Plex+Mono:wght@400;500' },
    bold:     { name:'Bold',      d:"'Archivo'",          b:"'Archivo'",       m:"'Space Mono'",     q:'family=Archivo:wght@300;400;500;700;800&family=Space+Mono:wght@400;700' }
  };
  SF.PALETTES = {
    ember: ['#ff4b57','#ff8a3d','#ffc93c','#2dd4bf','#5aa9ff'],
    ocean: ['#5aa9ff','#2dd4bf','#7c8cff','#38bdf8','#a5f3fc'],
    neon:  ['#ff3ea5','#8b5cf6','#22d3ee','#a3e635','#facc15'],
    sunset:['#ff6b6b','#ff9f43','#feca57','#ff7eb3','#c084fc'],
    forest:['#34d399','#a3e635','#facc15','#2dd4bf','#86efac'],
    royal: ['#a78bfa','#f472b6','#60a5fa','#fbbf24','#c4b5fd'],
    mono:  ['#e5e7eb','#9ca3af','#f9fafb','#d1d5db','#6b7280'],
    ink:   ['#1d4ed8','#b91c1c','#047857','#7c3aed','#c2410c']
  };
  SF.BASES = ['midnight','navy','charcoal','plum','forest','paper','snow'];
  SF.BGS = ['grid','dots','lines','aurora','plain'];
  SF.TRANSITIONS = ['drift','fade','zoom','rise','flip','swing','push','wipe','iris','glitch'];
  SF.ELANIMS = ['up','fade','blur','scale','left','drop','none'];

  function esc(s){
    return String(s == null ? '' : s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }
  function inline(s){
    return esc(s)
      .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
      .replace(/\*(.+?)\*/g,'<em>$1</em>')
      .replace(/`(.+?)`/g,'<code>$1</code>')
      .replace(/\n/g,'<br>');
  }
  function rows(text, n){
    return String(text || '').split('\n').map(function(r){ return r.trim(); }).filter(Boolean).map(function(r){
      var cells = r.split('|').map(function(c){ return c.trim(); });
      while (cells.length < n) cells.push('');
      return cells;
    });
  }
  function hex(c){ c = String(c || '').trim(); return /^#[0-9a-f]{3,8}$/i.test(c) ? c : ''; }
  function imgUrl(u){
    u = String(u || '').trim();
    if (!u || /^\s*(javascript|vbscript):/i.test(u)) return '';
    if (/^data:/i.test(u) && !/^data:image\//i.test(u)) return '';
    return esc(u);
  }
  function two(n){ return (n < 10 ? '0' : '') + n; }
  SF.esc = esc; SF.inline = inline; SF.rows = rows; SF.hex = hex;

  var ANIM = ' data-anim';
  function wrap(tag, cls, html){ return '<' + tag + (cls ? ' class="' + cls + '"' : '') + ANIM + '>' + html + '</' + tag + '>'; }
  function header(d, c){
    return '<div class="sf-head"' + ANIM + '><div class="eyebrow">' + esc(d.eyebrow || c.section || '') +
      '</div><span class="tag">' + two(c.num) + '</span></div>';
  }
  function h2(d){ return d.title ? wrap('h2', '', inline(d.title)) : ''; }
  function lede(d){ return d.lede ? wrap('p', 'lede', inline(d.lede)) : ''; }
  function figure(url, caption, fit, cls){
    var u = imgUrl(url);
    var inner = u ? '<img src="' + u + '" alt="">' : '<div class="ph">Add an image</div>';
    if (caption) inner += '<figcaption>' + esc(caption) + '</figcaption>';
    return wrap('figure', (cls || '') + (fit === 'contain' ? ' contain' : ''), inner);
  }
  function list(items, fn){ return items.map(fn).join(''); }

  var L = SF.LAYOUT_RENDER = {};

  L.cover = function(d){
    var meta = rows(d.meta, 2);
    return (d.badge ? '<div class="badge">' + esc(d.badge) + '</div>' : '') +
      wrap('div', 'eyebrow', esc(d.eyebrow)) +
      wrap('h1', '', inline(d.title)) +
      (d.subtitle ? wrap('div', 'sub', inline(d.subtitle)) : '') +
      (meta.length ? wrap('div', 'cover-meta', list(meta, function(r){
        return '<div><span>' + esc(r[0]) + '</span><b>' + esc(r[1]) + '</b></div>';
      })) : '');
  };

  L.section = function(d){
    return wrap('div', 'num', esc(d.number)) + wrap('h2', '', inline(d.title)) +
      (d.pill ? wrap('div', 'pill', '<i></i>' + esc(d.pill)) : '');
  };

  L.statement = function(d){
    return wrap('div', 'eyebrow', esc(d.eyebrow)) + wrap('div', 'big', inline(d.text)) +
      (d.after ? wrap('div', 'after', inline(d.after)) : '');
  };

  L.points = function(d, c){
    var r = rows(d.items, 2);
    return header(d, c) + h2(d) + lede(d) +
      '<ul class="points' + (r.length > 5 ? ' many' : '') + '">' + list(r, function(x, i){
        return '<li' + ANIM + '><span class="k">' + two(i + 1) + '</span><b>' + inline(x[0]) + '</b><span>' + inline(x[1]) + '</span></li>';
      }) + '</ul>';
  };

  L.bigpoints = function(d, c){
    return header(d, c) + h2(d) + '<ul class="bigpoints">' + list(rows(d.items, 2), function(x){
      return '<li' + ANIM + '><b>' + inline(x[0]) + '</b>' + (x[1] ? '<span>' + inline(x[1]) + '</span>' : '') + '</li>';
    }) + '</ul>';
  };

  L.cards = function(d, c){
    var r = rows(d.cards, 3);
    var n = Math.max(1, Math.min(4, +d.columns || Math.min(r.length, 3) || 1));
    return header(d, c) + h2(d) + lede(d) + '<div class="grid g' + n + '">' + list(r, function(x){
      return '<div class="card"' + ANIM + '>' + (x[0] ? '<span class="kt">' + esc(x[0]) + '</span>' : '') +
        '<h3>' + inline(x[1]) + '</h3>' + (x[2] ? '<p>' + inline(x[2]) + '</p>' : '') + '</div>';
    }) + '</div>';
  };

  L.image = function(d, c){
    return header(d, c) + h2(d) + figure(d.image, d.caption, d.fit, 'hero');
  };

  L.split = function(d, c){
    var b = rows(d.bullets, 1);
    var txt = '<div class="txt">' + h2(d) + lede(d) +
      (b.length ? '<ul class="bullets">' + list(b, function(x){ return '<li' + ANIM + '>' + inline(x[0]) + '</li>'; }) + '</ul>' : '') + '</div>';
    return header(d, c) + '<div class="split' + (d.side === 'left' ? ' left' : '') + '">' + txt + figure(d.image, d.caption, d.fit) + '</div>';
  };

  L.quote = function(d){
    return wrap('div', 'qmark', '&ldquo;') + wrap('blockquote', '', inline(d.quote)) +
      (d.cite ? wrap('cite', '', '&mdash; ' + esc(d.cite)) : '');
  };

  L.stats = function(d, c){
    var r = rows(d.stats, 3);
    var n = Math.max(1, Math.min(4, r.length));
    return header(d, c) + h2(d) + lede(d) + '<div class="stats g' + n + '">' + list(r, function(x){
      var isNum = /^-?\d+(\.\d+)?$/.test(x[0]);
      var val = isNum ? '<span data-count="' + esc(x[0]) + '">' + esc(x[0]) + '</span>' : esc(x[0]);
      return '<div class="stat"' + ANIM + '><div class="n">' + val + (x[2] ? '<i>' + esc(x[2]) + '</i>' : '') +
        '</div><div class="lbl">' + inline(x[1]) + '</div></div>';
    }) + '</div>';
  };

  L.timeline = function(d, c){
    return header(d, c) + h2(d) + '<ul class="tl">' + list(rows(d.items, 4), function(x){
      var hot = x[2].charAt(0) === '!';
      var t = hot ? x[2].slice(1).trim() : x[2];
      return '<li' + ANIM + (hot ? ' class="hot"' : '') + '><div class="time">' + esc(x[0]) +
        (x[1] ? '<small>' + esc(x[1]) + '</small>' : '') + '</div><span class="node"></span><b>' + inline(t) + '</b>' +
        (x[3] ? '<p>' + inline(x[3]) + '</p>' : '') + '</li>';
    }) + '</ul>';
  };

  L.compare = function(d, c){
    function col(cls, icon, t, items){
      return '<div class="col ' + cls + '"' + ANIM + '><h3><i>' + icon + '</i>' + inline(t) + '</h3><ul>' +
        list(rows(items, 1), function(x){ return '<li>' + inline(x[0]) + '</li>'; }) + '</ul></div>';
    }
    return header(d, c) + h2(d) + lede(d) + '<div class="yesno">' +
      col('ok', '&#10003;', d.leftTitle, d.left) + col('no', '&#10005;', d.rightTitle, d.right) + '</div>';
  };

  SF.context = function(deck, i){
    var slides = deck.slides, section = '', secCount = 0;
    for (var k = 0; k <= i; k++){
      var s = slides[k];
      if (s.layout === 'section' || s.layout === 'cover'){ secCount++; section = (s.data && s.data.title) || ''; }
      if (s.section) section = s.section;
    }
    section = String(section).replace(/\*/g,'').replace(/\n/g,' ');
    return { num: i + 1, total: slides.length, section: slides[i].layout === 'section' ? '' : section, secIndex: Math.max(0, secCount - 1) };
  };

  SF.accentFor = function(deck, i){
    var t = deck.theme || {}, s = deck.slides[i];
    var own = hex(s && s.accent);
    if (own) return own;
    var pal = (t.palette && t.palette.length ? t.palette : SF.PALETTES.ember).map(hex).filter(Boolean);
    if (!pal.length) pal = SF.PALETTES.ember;
    if (t.accentMode === 'single') return pal[0];
    if (t.accentMode === 'cycle') return pal[i % pal.length];
    return pal[SF.context(deck, i).secIndex % pal.length];
  };

  SF.renderSlide = function(deck, i){
    var s = deck.slides[i], t = deck.theme || {};
    var fn = L[s.layout] || L.points;
    var tr = SF.TRANSITIONS.indexOf(s.transition) >= 0 ? s.transition : (t.transition || 'drift');
    return '<section class="slide l-' + esc(s.layout) + '" data-tr="' + esc(tr) + '" style="--accent:' + SF.accentFor(deck, i) + '">' +
      fn(s.data || {}, SF.context(deck, i)) + '</section>';
  };

  SF.applyTheme = function(el, deck){
    var t = deck.theme || {};
    var f = SF.FONTS[t.font] || SF.FONTS.grotesk;
    el.classList.add('sf-deck');
    el.setAttribute('data-base', SF.BASES.indexOf(t.base) >= 0 ? t.base : 'midnight');
    el.setAttribute('data-bg', SF.BGS.indexOf(t.bg) >= 0 ? t.bg : 'grid');
    el.setAttribute('data-el', SF.ELANIMS.indexOf(t.elAnim) >= 0 ? t.elAnim : 'up');
    el.setAttribute('data-glow', t.glow === false ? 'off' : 'on');
    el.setAttribute('data-vig', t.vignette === false ? 'off' : 'on');
    el.style.setProperty('--spd', String(Math.max(0.25, Math.min(3, +t.speed || 1))));
    el.style.setProperty('--display', f.d + ',system-ui,sans-serif');
    el.style.setProperty('--body', f.b + ',system-ui,sans-serif');
    el.style.setProperty('--mono', f.m + ',ui-monospace,monospace');
    SF.loadFont(t.font);
  };

  SF.loadFont = function(key){
    var f = SF.FONTS[key] || SF.FONTS.grotesk;
    var id = 'sf-font-' + (SF.FONTS[key] ? key : 'grotesk');
    if (document.getElementById(id)) return;
    var l = document.createElement('link');
    l.id = id; l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?' + f.q + '&display=swap';
    document.head.appendChild(l);
  };

  SF.backdrop = function(){
    return '<div class="sf-bg"><div class="pat"></div><div class="sf-glow"></div><div class="sf-vig"></div></div>';
  };

  SF.stagger = function(root, speed){
    var sp = Math.max(0.25, Math.min(3, +speed || 1));
    root.querySelectorAll('.slide').forEach(function(s){
      s.querySelectorAll('[data-anim]').forEach(function(el, n){
        el.style.transitionDelay = Math.round((90 + n * 60) * sp) + 'ms';
      });
    });
  };

  SF.fitStage = function(stage, w, h){
    stage.style.transform = 'scale(' + Math.min(w / 1600, h / 900) + ')';
  };
}
SF_RENDER();
