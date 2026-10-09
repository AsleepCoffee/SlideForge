(function(){
  var SF = window.SF, E = SF.ed, ui = SF.ui, esc = SF.esc;
  function $(id){ return document.getElementById(id); }
  function h(html){ var d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }
  function opt(v, label, sel){ return '<option value="' + esc(v) + '"' + (v === sel ? ' selected' : '') + '>' + esc(label) + '</option>'; }
  function cap(s){ return s.charAt(0).toUpperCase() + s.slice(1); }

  var P = SF.panels = {};

  /* ======================= Slide inspector ======================= */

  function cur(){ return E.deck.slides[E.cur]; }

  // Titles of section/cover slides feed the eyebrow + HUD of the slides after them, so re-render every thumbnail.
  function kindFor(s, key){ return (key === 'title' && (s.layout === 'section' || s.layout === 'cover')) || key === 'section' ? 'theme' : 'slide'; }

  function setField(key, value, path){
    var s = cur();
    E.change(function(){ s.data[key] = value; }, 'f:' + s.id + ':' + (path || key), kindFor(s, key));
  }

  function rowsOf(text, n){
    var r = SF.rows(text, n);
    return r.length ? r : [];
  }
  function rowsText(box){
    return Array.prototype.map.call(box.querySelectorAll('.re-row'), function(row){
      var cells = Array.prototype.map.call(row.querySelectorAll('input'), function(i){ return SF.cell(i.value); });
      while (cells.length > 1 && !cells[cells.length - 1]) cells.pop();
      return cells.join(' | ');
    }).filter(function(r){ return r.replace(/[\s|]/g, ''); }).join('\n');
  }

  function rowEditor(f, value){
    var box = h('<div class="re" data-k="' + f.k + '"></div>');
    var cols = f.cols;
    function draw(rows){
      box.innerHTML = '';
      box.style.setProperty('--cols', cols.length);
      if (cols.length > 1) box.appendChild(h('<div class="re-head">' + cols.map(function(c){ return '<span>' + esc(c) + '</span>'; }).join('') + '<span></span></div>'));
      rows.forEach(function(r, i){
        var row = h('<div class="re-row"></div>');
        cols.forEach(function(c, j){
          var inp = document.createElement('input');
          inp.value = r[j] || '';
          inp.placeholder = c;
          inp.setAttribute('data-path', 'r:' + f.k + ':' + i + ':' + j);
          inp.spellcheck = true;
          row.appendChild(inp);
        });
        row.appendChild(h('<span class="re-acts"><button data-ra="up" title="Move up" tabindex="-1">↑</button><button data-ra="down" title="Move down" tabindex="-1">↓</button><button data-ra="del" title="Remove" tabindex="-1">✕</button></span>'));
        box.appendChild(row);
      });
      var add = h('<button class="re-add">+ Add ' + esc(cols[0].toLowerCase()) + '</button>');
      add.onclick = function(){
        var rows = current(); rows.push(cols.map(function(){ return ''; }));
        draw(rows);
        var ins = box.querySelectorAll('.re-row:last-of-type input');
        if (ins[0]) ins[0].focus();
      };
      box.appendChild(add);
    }
    function current(){
      return Array.prototype.map.call(box.querySelectorAll('.re-row'), function(row){
        return Array.prototype.map.call(row.querySelectorAll('input'), function(i){ return i.value; });
      });
    }
    box.addEventListener('input', function(){ setField(f.k, rowsText(box), f.k); });
    box.addEventListener('keydown', function(e){
      if (e.key !== 'Enter' || e.target.tagName !== 'INPUT') return;
      e.preventDefault();
      var row = e.target.closest('.re-row'), rows = current(), idx = Array.prototype.indexOf.call(box.querySelectorAll('.re-row'), row);
      rows.splice(idx + 1, 0, cols.map(function(){ return ''; }));
      draw(rows);
      box.querySelectorAll('.re-row')[idx + 1].querySelector('input').focus();
    });
    box.addEventListener('click', function(e){
      var b = e.target.closest('[data-ra]');
      if (!b) return;
      var rows = current(), idx = Array.prototype.indexOf.call(box.querySelectorAll('.re-row'), b.closest('.re-row'));
      var a = b.getAttribute('data-ra');
      if (a === 'del') rows.splice(idx, 1);
      else {
        var to = a === 'up' ? idx - 1 : idx + 1;
        if (to < 0 || to >= rows.length) return;
        rows.splice(to, 0, rows.splice(idx, 1)[0]);
      }
      draw(rows);
      var s = cur();
      E.change(function(){ s.data[f.k] = rowsText(box); }, '', kindFor(s, f.k));
    });
    var initial = rowsOf(value, cols.length);
    draw(initial.length ? initial : [cols.map(function(){ return ''; })]);
    return box;
  }

  function imageField(f, value){
    var box = h('<div class="imgf">' +
      '<div class="imgf-pv"></div>' +
      '<div class="imgf-ctl"><input data-path="f:' + f.k + '" placeholder="Paste an image URL…">' +
      '<div class="imgf-btns"><button data-ia="pick">Upload…</button><button data-ia="clear">Remove</button></div></div></div>');
    var inp = box.querySelector('input'), pv = box.querySelector('.imgf-pv');
    function show(v){
      pv.innerHTML = v ? '<img alt="">' : '<span>No image</span>';
      if (v) pv.firstChild.src = v;
      inp.value = /^data:/.test(v) ? '' : v;
      inp.placeholder = /^data:/.test(v) ? 'Uploaded image (embedded)' : 'Paste an image URL…';
    }
    show(value || '');
    inp.oninput = function(){ setField(f.k, inp.value.trim()); pv.innerHTML = inp.value.trim() ? '<img alt="">' : '<span>No image</span>'; if (inp.value.trim()) pv.firstChild.src = inp.value.trim(); };
    box.addEventListener('click', function(e){
      var a = e.target.closest('[data-ia]');
      if (!a) return;
      if (a.getAttribute('data-ia') === 'clear'){ setField(f.k, ''); show(''); return; }
      var pick = $('imgPick');
      pick.onchange = function(){
        var file = pick.files[0]; pick.value = '';
        if (!file) return;
        SF.readImage(file).then(function(url){ var s = cur(); E.change(function(){ s.data[f.k] = url; }, '', 'slide'); show(url); },
          function(err){ ui.toast(err.message, 'err'); });
      };
      pick.click();
    });
    return box;
  }

  function fieldEl(f, s){
    var v = s.data[f.k] == null ? '' : String(s.data[f.k]);
    var wrap = h('<div class="fld"><label>' + esc(f.label) + '</label></div>');
    var el;
    if (f.type === 'rows') el = rowEditor(f, v);
    else if (f.type === 'image') el = imageField(f, v);
    else if (f.type === 'select'){
      el = h('<select data-path="f:' + f.k + '">' + f.opts.map(function(o){ return opt(o[0], o[1], v); }).join('') + '</select>');
      el.onchange = function(){ setField(f.k, el.value); };
    } else {
      el = f.type === 'area' ? document.createElement('textarea') : document.createElement('input');
      if (f.type === 'area') el.rows = f.rows || 3;
      el.value = v;
      el.setAttribute('data-path', 'f:' + f.k);
      el.oninput = function(){ setField(f.k, el.value); };
    }
    wrap.appendChild(el);
    if (f.hint) wrap.appendChild(h('<small class="hint">' + esc(f.hint) + '</small>'));
    return wrap;
  }

  P.slide = function(keepFocus){
    var tab = $('tab-slide'), s = cur();
    if (!s) return;
    var a = document.activeElement, focus = null;
    if (keepFocus && a && tab.contains(a) && a.getAttribute('data-path')){
      focus = { path:a.getAttribute('data-path'), start:a.selectionStart, end:a.selectionEnd };
    }
    var L = SF.LAYOUTS[s.layout];
    tab.innerHTML = '';

    var head = h('<div class="ins-head"><div><small>Slide ' + (E.cur + 1) + ' of ' + E.deck.slides.length + '</small>' +
      '<button class="lay-btn" title="Change layout">' + esc(L.name) + ' <i>▾</i></button></div>' +
      '<button class="ai sm" data-x="rewrite" title="Rewrite this slide with AI">✦ Rewrite</button></div>');
    head.querySelector('.lay-btn').onclick = function(){ E.pickLayout(this, s.layout, E.setLayout); };
    head.querySelector('[data-x=rewrite]').onclick = function(){ P.ai('rewrite'); };
    tab.appendChild(head);

    var sec = h('<div class="ins-sec"></div>');
    L.fields.forEach(function(f){ sec.appendChild(fieldEl(f, s)); });
    tab.appendChild(sec);

    // Speaker notes
    var notes = h('<div class="ins-sec"><div class="fld"><label>Speaker notes</label><textarea rows="4" data-path="notes" placeholder="Shown when you press N while presenting"></textarea></div></div>');
    var nt = notes.querySelector('textarea');
    nt.value = s.notes || '';
    nt.oninput = function(){ var v = nt.value; E.change(function(){ s.notes = v; }, 'n:' + s.id, 'slide'); };
    tab.appendChild(notes);

    // Per-slide overrides
    var t = E.deck.theme, pal = (t.palette || []).filter(SF.hex);
    var adv = h('<details class="ins-sec ins-adv"' + (s.accent || s.transition || s.section ? ' open' : '') + '><summary>Slide options</summary>' +
      '<div class="fld"><label>Accent colour</label><div class="acc">' +
        '<button data-acc="" class="acc-auto' + (!s.accent ? ' on' : '') + '" title="Use the theme’s colour">Auto</button>' +
        pal.map(function(c){ return '<button data-acc="' + c + '" class="sw' + (s.accent === c ? ' on' : '') + '" style="--c:' + c + '" title="' + c + '"></button>'; }).join('') +
        '<label class="sw sw-custom' + (s.accent && pal.indexOf(s.accent) < 0 ? ' on' : '') + '" title="Custom colour" style="--c:' + (s.accent || '#888888') + '"><input type="color" value="' + (s.accent || SF.accentFor(E.deck, E.cur)) + '"></label>' +
      '</div></div>' +
      '<div class="fld"><label>Transition</label><select data-path="o:transition">' + opt('', 'Theme default (' + t.transition + ')', s.transition || '') +
        SF.TRANSITIONS.map(function(x){ return opt(x, cap(x), s.transition || ''); }).join('') + '</select></div>' +
      '<div class="fld"><label>Section label</label><input data-path="o:section" placeholder="Shown in the header and presenter bar"><small class="hint">Carries on to the following slides until the next section</small></div>' +
      '</details>');
    adv.querySelector('.acc').addEventListener('click', function(e){
      var b = e.target.closest('[data-acc]');
      if (!b) return;
      var c = b.getAttribute('data-acc');
      E.change(function(){ if (c) s.accent = c; else delete s.accent; }, '', 'slide');
      adv.querySelectorAll('.acc .on').forEach(function(x){ x.classList.remove('on'); });
      b.classList.add('on');
    });
    adv.querySelector('input[type=color]').oninput = function(){
      var c = this.value;
      E.change(function(){ s.accent = c; }, 'acc:' + s.id, 'slide');
      adv.querySelectorAll('.acc .on').forEach(function(x){ x.classList.remove('on'); });
      var lab = this.parentNode; lab.classList.add('on'); lab.style.setProperty('--c', c);
    };
    var trSel = adv.querySelector('select');
    trSel.onchange = function(){ var v = trSel.value; E.change(function(){ if (v) s.transition = v; else delete s.transition; }, '', 'slide'); E.replay(); };
    var secIn = adv.querySelector('input[data-path="o:section"]');
    secIn.value = s.section || '';
    secIn.oninput = function(){ var v = secIn.value; E.change(function(){ if (v) s.section = v; else delete s.section; }, 'sec:' + s.id, 'theme'); };
    tab.appendChild(adv);

    var acts = h('<div class="ins-acts">' +
      '<button data-x="up" title="Move up"' + (E.cur === 0 ? ' disabled' : '') + '>↑ Up</button>' +
      '<button data-x="down" title="Move down"' + (E.cur === E.deck.slides.length - 1 ? ' disabled' : '') + '>↓ Down</button>' +
      '<button data-x="dup" title="Duplicate (Ctrl+D)">Duplicate</button>' +
      '<button data-x="del" class="danger" title="Delete (Del)">Delete</button></div>');
    acts.onclick = function(e){
      var b = e.target.closest('[data-x]');
      if (!b) return;
      var x = b.getAttribute('data-x');
      if (x === 'up') E.move(E.cur, E.cur - 1);
      else if (x === 'down') E.move(E.cur, E.cur + 1);
      else if (x === 'dup') E.duplicate();
      else E.remove();
    };
    tab.appendChild(acts);

    if (focus){
      var el = tab.querySelector('[data-path="' + focus.path + '"]');
      if (el){
        el.focus();
        try { if (focus.start != null) el.setSelectionRange(Math.min(focus.start, el.value.length), Math.min(focus.end, el.value.length)); } catch (e) {}
      }
    }
  };

  /* ======================= Theme panel ======================= */

  var BASE_SW = { midnight:'#07080b', navy:'#0b1426', charcoal:'#17171a', plum:'#170e1e', forest:'#0b1714', paper:'#f4f1ea', snow:'#f7f8fb' };
  var ACCENT_MODES = [['section','Per section'],['cycle','Every slide'],['single','Single']];

  function setTheme(key, value, tag){
    E.change(function(d){ d.theme[key] = value; }, tag || ('t:' + key), 'theme');
  }
  function seg(key, options, cls){
    var t = E.deck.theme;
    var g = h('<div class="seg' + (cls ? ' ' + cls : '') + '"></div>');
    options.forEach(function(o){
      var b = h('<button data-v="' + esc(o[0]) + '"' + (String(t[key]) === String(o[0]) ? ' class="on"' : '') + '>' + o[1] + '</button>');
      if (o[2]) b.title = o[2];
      g.appendChild(b);
    });
    g.onclick = function(e){
      var b = e.target.closest('button');
      if (!b) return;
      setTheme(key, b.getAttribute('data-v'), '');
      g.querySelectorAll('.on').forEach(function(x){ x.classList.remove('on'); });
      b.classList.add('on');
    };
    return g;
  }
  function group(label, el, hint){
    var w = h('<div class="fld"><label>' + esc(label) + '</label></div>');
    w.appendChild(el);
    if (hint) w.appendChild(h('<small class="hint">' + esc(hint) + '</small>'));
    return w;
  }

  P.theme = function(){
    var tab = $('tab-theme'), t = E.deck.theme;
    tab.innerHTML = '';

    var top = h('<div class="ins-head"><div><small>Applies to every slide</small><b class="th-title">Theme</b></div><button class="ai sm" title="Let AI pick a theme for this deck">✦ Suggest</button></div>');
    top.querySelector('button').onclick = function(){ P.ai('theme'); };
    tab.appendChild(top);

    var sec = h('<div class="ins-sec"></div>');

    Object.keys(SF.FONTS).forEach(SF.loadFont);
    sec.appendChild(group('Fonts', seg('font', Object.keys(SF.FONTS).map(function(k){
      var f = SF.FONTS[k];
      return [k, '<span class="fn-aa" style="font-family:' + esc(f.d) + ',sans-serif">Aa</span><span class="fn-n">' + esc(f.name) + '</span>', f.d.replace(/'/g, '') + ' + ' + f.b.replace(/'/g, '')];
    }), 'fonts')));

    // Palettes: presets plus five editable colours.
    var palBox = h('<div class="pals"></div>');
    Object.keys(SF.PALETTES).forEach(function(k){
      var b = h('<button class="pal' + (t.paletteName === k ? ' on' : '') + '" data-p="' + k + '" title="' + cap(k) + '">' +
        SF.PALETTES[k].map(function(c){ return '<i style="background:' + c + '"></i>'; }).join('') + '</button>');
      palBox.appendChild(b);
    });
    var custom = h('<div class="pal-edit">' + (t.palette || []).slice(0, 5).map(function(c, i){
      return '<label class="sw" style="--c:' + esc(c) + '"><input type="color" data-ci="' + i + '" value="' + esc(SF.hex(c) || '#888888') + '"></label>';
    }).join('') + '<small>Click a colour to edit</small></div>');
    palBox.onclick = function(e){
      var b = e.target.closest('[data-p]');
      if (!b) return;
      var k = b.getAttribute('data-p');
      E.change(function(d){ d.theme.palette = SF.PALETTES[k].slice(); d.theme.paletteName = k; }, '', 'theme');
      P.theme();
      P.slide();
    };
    custom.addEventListener('input', function(e){
      var i = +e.target.getAttribute('data-ci'), c = e.target.value;
      E.change(function(d){
        var p = d.theme.palette.slice(); while (p.length < 5) p.push(c);
        p[i] = c; d.theme.palette = p; d.theme.paletteName = 'custom';
      }, 't:palette:' + i, 'theme');
      e.target.parentNode.style.setProperty('--c', c);
      palBox.querySelectorAll('.on').forEach(function(x){ x.classList.remove('on'); });
    });
    var palWrap = group('Accent palette', palBox);
    palWrap.appendChild(custom);
    sec.appendChild(palWrap);
    sec.appendChild(group('Accent colour changes', seg('accentMode', ACCENT_MODES)));

    sec.appendChild(group('Background', seg('base', SF.BASES.map(function(b){
      return [b, '<i class="base-sw" style="background:' + BASE_SW[b] + '"></i>', cap(b)];
    }), 'bases'), 'Paper and Snow are light; the Ink palette reads best on them.'));
    sec.appendChild(group('Pattern', seg('bg', SF.BGS.map(function(b){ return [b, cap(b)]; }), 'wrap')));

    var tr = h('<div class="row2"><select>' + SF.TRANSITIONS.map(function(x){ return opt(x, cap(x), t.transition); }).join('') + '</select><button title="Replay on the preview">▶</button></div>');
    tr.querySelector('select').onchange = function(){ setTheme('transition', this.value, ''); E.replay(); P.slide(); };
    tr.querySelector('button').onclick = E.replay;
    sec.appendChild(group('Slide transition', tr));

    var el = h('<div class="row2"><select>' + SF.ELANIMS.map(function(x){ return opt(x, x === 'up' ? 'Rise' : x === 'none' ? 'None' : cap(x), t.elAnim); }).join('') + '</select><button title="Replay on the preview">▶</button></div>');
    el.querySelector('select').onchange = function(){ setTheme('elAnim', this.value, ''); E.replay(); };
    el.querySelector('button').onclick = E.replay;
    sec.appendChild(group('Element entrance', el));

    var spd = h('<div class="range"><input type="range" min="0.25" max="3" step="0.05"><output></output></div>');
    var rIn = spd.querySelector('input'), rOut = spd.querySelector('output');
    rIn.value = t.speed || 1;
    rOut.textContent = (+rIn.value).toFixed(2) + '×';
    rIn.oninput = function(){ rOut.textContent = (+rIn.value).toFixed(2) + '×'; setTheme('speed', +rIn.value); };
    rIn.onchange = E.replay;
    sec.appendChild(group('Animation duration', spd, 'Higher is slower'));

    var tg = h('<div class="toggles"></div>');
    [['glow','Accent glow'],['vignette','Vignette'],['hud','Presenter bar']].forEach(function(o){
      var l = h('<label class="tgl"><input type="checkbox"' + (t[o[0]] !== false ? ' checked' : '') + '><span></span>' + o[1] + '</label>');
      l.querySelector('input').onchange = function(){ setTheme(o[0], this.checked, ''); };
      tg.appendChild(l);
    });
    sec.appendChild(group('Effects', tg));

    var ap = h('<div class="row2"><input type="number" min="0" max="600" step="1"><span class="unit">seconds per slide</span></div>');
    var apIn = ap.querySelector('input');
    apIn.value = +t.autoplay || 0;
    apIn.oninput = function(){ setTheme('autoplay', Math.max(0, +apIn.value || 0)); };
    sec.appendChild(group('Autoplay', ap, '0 = off. Advances automatically while presenting.'));

    tab.appendChild(sec);
  };

  /* ======================= Outline → Slides ======================= */

  P.outline = function(){
    var body = h('<div class="ol">' +
      '<div class="ol-main"><textarea class="mono" spellcheck="false" placeholder="Paste or type an outline…"></textarea>' +
      '<div class="ol-opts"><label><input type="radio" name="olm" value="replace" checked> Replace deck</label>' +
      '<label><input type="radio" name="olm" value="append"> Insert after current slide</label><span class="grow"></span><span class="ol-sum"></span></div></div>' +
      '<aside class="ol-help"><b>Outline syntax</b><table></table><button class="link">Load an example</button></aside></div>');
    var ta = body.querySelector('textarea'), sum = body.querySelector('.ol-sum');
    body.querySelector('table').innerHTML = SF.OUTLINE_HELP.split('\n').map(function(l){
      var p = l.split('→');
      return '<tr><td><code>' + esc(p[0].trim()) + '</code></td><td>' + esc((p[1] || '').trim()) + '</td></tr>';
    }).join('');
    var draft = '';
    try { draft = localStorage.getItem('slideforge.outline') || ''; } catch (e) {}
    ta.value = draft;
    function update(){
      try { localStorage.setItem('slideforge.outline', ta.value); } catch (e) {}
      if (!ta.value.trim()){ sum.textContent = ''; return; }
      var r = SF.parseOutline(ta.value), counts = {};
      r.slides.forEach(function(s){ counts[s.layout] = (counts[s.layout] || 0) + 1; });
      sum.textContent = r.slides.length + ' slide' + (r.slides.length === 1 ? '' : 's') + ' · ' +
        Object.keys(counts).map(function(k){ return counts[k] + ' ' + SF.LAYOUTS[k].name.toLowerCase(); }).join(', ');
    }
    ta.oninput = update;
    body.querySelector('.link').onclick = function(){ ta.value = SF.OUTLINE_SAMPLE; update(); ta.focus(); };
    update();
    ui.modal({ title:'Outline → Slides', wide:true, body:body, actions:[
      { label:'Cancel', cancel:true },
      { label:'Create slides', primary:true, onClick:function(){
        var r = SF.parseOutline(ta.value);
        if (!r.slides.length){ ui.toast('Nothing to convert yet — type an outline first.'); return false; }
        if (body.querySelector('input[name=olm]:checked').value === 'replace'){
          E.load({ title:r.title, theme:SF.clone(E.deck.theme), slides:r.slides });
        } else {
          E.change(function(d){ d.slides.splice.apply(d.slides, [E.cur + 1, 0].concat(r.slides)); E.cur = E.cur + 1; });
        }
        ui.toast('Created ' + r.slides.length + ' slides');
      } }
    ] });
  };

  /* ======================= AI ======================= */

  var AI_TABS = [['deck','Generate deck'],['rewrite','Rewrite slide'],['theme','Suggest theme'],['settings','Settings']];
  var aiRun = null;

  function aiTabs(active){
    return '<div class="ai-tabs">' + AI_TABS.map(function(t){ return '<button data-t="' + t[0] + '"' + (t[0] === active ? ' class="on"' : '') + '>' + t[1] + '</button>'; }).join('') + '</div>';
  }
  function chips(list){ return '<div class="chips">' + list.map(function(c){ return '<button class="chip-btn">' + esc(c) + '</button>'; }).join('') + '</div>'; }
  function bindChips(body, target){
    body.querySelectorAll('.chip-btn').forEach(function(b){ b.onclick = function(){ target.value = b.textContent; target.focus(); }; });
  }

  // Runs an AI action with busy state, streaming progress and a working Cancel button.
  function run(ctx, label, fn, progress){
    var ctl = new AbortController();
    aiRun = ctl;
    ctx.busy(true, label);
    var opts = { signal:ctl.signal, onText:function(text){ if (progress && !ctx.closed) ctx.busy(true, progress(text)); } };
    return fn(opts).then(function(r){
      aiRun = null;
      ctx.busy(false);
      return r;
    }, function(err){
      aiRun = null;
      if (!ctx.closed) ctx.busy(false);
      if (err.name !== 'AbortError') ui.toast(err.message, 'err', 6000);
      throw err;
    });
  }

  P.ai = function(tab){
    if (!SF.ai.ready() && tab !== 'settings') tab = 'settings:' + (tab || 'deck');
    var next = '';
    if (tab.indexOf('settings:') === 0){ next = tab.slice(9); tab = 'settings'; }
    tab = tab || 'deck';

    var body = h('<div class="aim">' + aiTabs(tab) + '<div class="ai-pane"></div></div>');
    var pane = body.querySelector('.ai-pane');
    var actions = [{ label:'Close', cancel:true, onClick:function(){ if (aiRun) aiRun.abort(); } }];
    var s = cur();

    if (tab === 'settings'){
      pane.innerHTML =
        '<p class="mdl-p">SlideForge calls the Claude API directly from your browser. Your key is only sent to <code>api.anthropic.com</code>.</p>' +
        '<div class="fld"><label>Anthropic API key</label><input type="password" class="mono" autocomplete="off" spellcheck="false" placeholder="sk-ant-…"></div>' +
        '<label class="tgl"><input type="checkbox"' + (SF.ai.remembered() ? ' checked' : '') + '><span></span>Remember on this device</label>' +
        '<div class="fld"><label>Model</label><select>' + SF.AI_MODELS.map(function(m){ return opt(m[0], m[1], SF.ai.model()); }).join('') + '</select></div>' +
        '<small class="hint">Don’t have a key? Create one at console.anthropic.com. Usage is billed to your account.</small>';
      var kIn = pane.querySelector('input[type=password]'), rem = pane.querySelector('input[type=checkbox]'), mSel = pane.querySelector('select');
      kIn.value = SF.ai.key();
      actions.push({ label:next ? 'Save & continue' : 'Save', primary:true, onClick:function(){
        var k = kIn.value.trim();
        if (!k){ ui.toast('Enter an API key.'); return false; }
        SF.ai.setKey(k, rem.checked);
        SF.ai.setModel(mSel.value);
        ui.toast('AI settings saved');
        if (next) setTimeout(function(){ P.ai(next); });
      } });
    }

    if (tab === 'deck'){
      pane.innerHTML =
        '<div class="fld"><label>What is the presentation about?</label><textarea rows="6" placeholder="e.g. A 10-minute kickoff for our new onboarding programme: why we’re changing it, what new hires will experience, the timeline, and how managers can help."></textarea>' +
        '<small class="hint">Paste notes, a doc or an outline for the best results.</small></div>' +
        '<div class="grid3"><div class="fld"><label>Slides</label><input type="number" min="3" max="30" value="10"></div>' +
        '<div class="fld"><label>Audience</label><input placeholder="e.g. executives"></div>' +
        '<div class="fld"><label>Tone</label><input placeholder="e.g. confident, warm"></div></div>' +
        '<div class="ol-opts"><label><input type="radio" name="aim" value="replace" checked> Replace deck</label>' +
        '<label><input type="radio" name="aim" value="append"> Insert after current slide</label>' +
        '<label class="tgl"><input type="checkbox" checked><span></span>Apply suggested theme</label></div>';
      var ins = pane.querySelectorAll('input:not([type=radio]):not([type=checkbox])'), brief = pane.querySelector('textarea'), useTheme = pane.querySelector('input[type=checkbox]');
      actions.push({ label:'✦ Generate', primary:true, onClick:function(ctx){
        if (!brief.value.trim()){ ui.toast('Describe the presentation first.'); return false; }
        var count = Math.max(3, Math.min(30, +ins[0].value || 10));
        return run(ctx, 'Thinking…', function(o){
          return SF.ai.generateDeck(brief.value.trim(), Object.assign(o, { count:count, audience:ins[1].value.trim(), tone:ins[2].value.trim() }));
        }, function(text){
          var n = (text.match(/"layout"/g) || []).length;
          return n ? 'Writing slide ' + n + ' of ~' + count + '…' : 'Planning the deck…';
        }).then(function(r){
          var replace = pane.querySelector('input[name=aim]:checked').value === 'replace';
          if (replace) E.load({ title:r.title, theme:useTheme.checked ? r.theme : SF.clone(E.deck.theme), slides:r.slides });
          else E.change(function(d){ d.slides.splice.apply(d.slides, [E.cur + 1, 0].concat(r.slides)); E.cur = E.cur + 1; if (useTheme.checked) d.theme = r.theme; });
          ctx.close();
          ui.toast('Created ' + r.slides.length + ' slides' + (r.reason && useTheme.checked ? ' — ' + r.reason : ''), '', 6000);
        }, function(){});
      } });
    }

    if (tab === 'rewrite'){
      var d = s.data || {};
      pane.innerHTML =
        '<p class="mdl-p">Rewriting slide ' + (E.cur + 1) + ' · <b>' + esc(SF.LAYOUTS[s.layout].name) + '</b> · ' + esc(String(d.title || d.text || d.quote || '').replace(/[*`]/g, '').replace(/\n/g, ' ')) + '</p>' +
        '<div class="fld"><label>How should it change?</label><textarea rows="3" placeholder="e.g. Make it punchier and cut it to three points"></textarea></div>' +
        chips(['Make it punchier', 'Shorten everything', 'Make it more visual', 'Turn it into a comparison', 'Fix grammar and tone', 'Write speaker notes']) +
        '<label class="tgl"><input type="checkbox"><span></span>Keep the current layout</label>';
      var instr = pane.querySelector('textarea'), keep = pane.querySelector('input[type=checkbox]');
      bindChips(pane, instr);
      actions.push({ label:'✦ Rewrite', primary:true, onClick:function(ctx){
        var idx = E.cur, target = E.deck.slides[idx];
        return run(ctx, 'Rewriting…', function(o){
          return SF.ai.rewriteSlide(E.deck, idx, instr.value.trim(), Object.assign(o, { keepLayout:keep.checked }));
        }).then(function(out){
          E.change(function(dk){
            var i = dk.slides.indexOf(target);
            if (i < 0) return;
            out.id = target.id;
            if (target.accent) out.accent = target.accent;
            if (target.transition) out.transition = target.transition;
            if (target.section) out.section = target.section;
            if (!out.notes) out.notes = target.notes;
            dk.slides[i] = out;
          });
          ctx.close();
          ui.toast('Slide rewritten — Ctrl+Z to undo');
        }, function(){});
      } });
    }

    if (tab === 'theme'){
      pane.innerHTML =
        '<div class="fld"><label>How should the deck feel? (optional)</label><input placeholder="e.g. calm and trustworthy"></div>' +
        chips(['Bold and energetic', 'Calm and trustworthy', 'Clean and minimal', 'Playful', 'Premium and editorial', 'Technical']) +
        '<small class="hint">Claude reads your slide titles and picks fonts, colours, background and motion.</small>';
      var mood = pane.querySelector('input');
      bindChips(pane, mood);
      actions.push({ label:'✦ Suggest theme', primary:true, onClick:function(ctx){
        return run(ctx, 'Choosing a theme…', function(o){ return SF.ai.suggestTheme(E.deck, mood.value.trim(), o); }).then(function(r){
          E.change(function(dk){ dk.theme = r.theme; }, '', 'structure');
          P.theme();
          ctx.close();
          ui.toast(r.reason || 'Theme applied', '', 6000);
        }, function(){});
      } });
    }

    var ctx = ui.modal({ title:'✦ AI assist', body:body, actions:actions, onClose:function(){ if (aiRun) aiRun.abort(); } });
    body.querySelector('.ai-tabs').onclick = function(e){
      var b = e.target.closest('[data-t]');
      if (b && !aiRun) P.ai(b.getAttribute('data-t'));
    };
    return ctx;
  };

  /* ======================= init ======================= */

  P.init = function(){
    document.querySelectorAll('.tabs [data-tab]').forEach(function(b){
      b.onclick = function(){
        document.querySelectorAll('.tabs [data-tab]').forEach(function(x){ x.classList.toggle('on', x === b); });
        document.querySelectorAll('.panel .tab').forEach(function(t){ t.classList.toggle('on', t.id === 'tab-' + b.getAttribute('data-tab')); });
      };
    });
    $('outlineBtn').onclick = P.outline;
    $('aiBtn').onclick = function(){ P.ai('deck'); };
  };
})();
