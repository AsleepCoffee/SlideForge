(function(){
  var SF = window.SF;
  var STORE = 'slideforge.deck.v1';
  function $(id){ return document.getElementById(id); }
  var esc = SF.esc;

  var E = SF.ed = { deck:null, cur:0, presenting:false };

  /* ---------- toasts, modals, confirm ---------- */

  var ui = SF.ui = {};
  ui.toast = function(msg, kind, ms){
    var t = document.createElement('div');
    t.className = 'toast' + (kind ? ' ' + kind : '');
    t.textContent = msg;
    $('toasts').appendChild(t);
    requestAnimationFrame(function(){ t.classList.add('in'); });
    setTimeout(function(){ t.classList.remove('in'); setTimeout(function(){ t.remove(); }, 300); }, ms || 2600);
  };

  var openModal = null;
  ui.modal = function(o){
    if (openModal) openModal.close();
    var m = $('modal');
    m.innerHTML = '<div class="mdl-box' + (o.wide ? ' wide' : '') + '" role="dialog" aria-modal="true">' +
      '<div class="mdl-head"><h3>' + esc(o.title || '') + '</h3><button class="ic mdl-x" aria-label="Close">✕</button></div>' +
      '<div class="mdl-body"></div><div class="mdl-foot"></div></div>';
    var box = m.firstChild, body = box.querySelector('.mdl-body'), foot = box.querySelector('.mdl-foot');
    if (typeof o.body === 'string') body.innerHTML = o.body; else if (o.body) body.appendChild(o.body);
    var ctx = { el:box, body:body, foot:foot, close:close, closed:false,
      busy:function(on, label){
        box.classList.toggle('busy', !!on);
        foot.querySelectorAll('button').forEach(function(b){ if (!b.hasAttribute('data-cancel')) b.disabled = !!on; });
        var s = foot.querySelector('.mdl-status');
        if (s) s.textContent = on ? (label || 'Working…') : '';
      }
    };
    foot.innerHTML = '<span class="mdl-status"></span>';
    (o.actions || [{ label:'Close' }]).forEach(function(a){
      var b = document.createElement('button');
      b.textContent = a.label;
      if (a.primary) b.className = 'primary';
      if (a.cancel) b.setAttribute('data-cancel', '');
      b.onclick = function(){
        var r = a.onClick ? a.onClick(ctx) : undefined;
        if (r !== false && !(r && r.then)) close();
      };
      foot.appendChild(b);
    });
    function close(){
      if (ctx.closed) return;
      ctx.closed = true;
      m.classList.remove('open');
      m.innerHTML = '';
      openModal = null;
      if (o.onClose) o.onClose();
    }
    box.querySelector('.mdl-x').onclick = close;
    m.onmousedown = function(e){ if (e.target === m) close(); };
    m.classList.add('open');
    openModal = ctx;
    var first = body.querySelector('textarea,input,select');
    if (first) setTimeout(function(){ first.focus(); }, 30);
    return ctx;
  };
  ui.confirm = function(title, msg, okLabel){
    return new Promise(function(resolve){
      var done = false;
      ui.modal({ title:title, body:'<p class="mdl-p">' + esc(msg) + '</p>',
        actions:[{ label:'Cancel', cancel:true }, { label:okLabel || 'OK', primary:true, onClick:function(){ done = true; } }],
        onClose:function(){ resolve(done); } });
    });
  };

  function download(name, text, type){
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type:type }));
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }
  function slug(s){ return String(s || '').toLowerCase().replace(/[*`]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'deck'; }

  // Read an image file as a data URL, scaling big photos down so decks stay small enough to autosave.
  SF.readImage = function(file){
    return new Promise(function(resolve, reject){
      if (!file || !/^image\//.test(file.type)) return reject(new Error('That file is not an image.'));
      var fr = new FileReader();
      fr.onerror = function(){ reject(new Error('Could not read the file.')); };
      fr.onload = function(){
        var url = fr.result;
        if (/svg|gif/.test(file.type)) return resolve(url);
        var img = new Image();
        img.onload = function(){
          var w = img.naturalWidth, h = img.naturalHeight, s = Math.min(1, 1920 / Math.max(w, h));
          if (s === 1 && file.size < 700000) return resolve(url);
          var c = document.createElement('canvas');
          c.width = Math.round(w * s); c.height = Math.round(h * s);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL('image/webp', 0.86));
        };
        img.onerror = function(){ resolve(url); };
        img.src = url;
      };
      fr.readAsDataURL(file);
    });
  };

  /* ---------- undo / redo ---------- */

  var undoStack = [], redoStack = [], lastTag = '', lastTime = 0, listT;
  function snap(){ return { deck:SF.clone(E.deck), cur:E.cur }; }

  // Every edit goes through here. Edits sharing a tag within 1.5s collapse into one undo step,
  // so typing a sentence is undone in one go. kind: 'slide' | 'theme' | 'meta' | 'structure'.
  E.change = function(fn, tag, kind){
    var now = Date.now();
    if (!(tag && tag === lastTag && now - lastTime < 1500)){
      undoStack.push(snap());
      if (undoStack.length > 80) undoStack.shift();
      redoStack = [];
    }
    lastTag = tag || ''; lastTime = now;
    fn(E.deck);
    E.after(kind || 'structure');
  };
  E.after = function(kind){
    if (kind === 'slide'){ renderThumb(E.cur); renderPreview(false); updateChrome(); }
    else if (kind === 'theme'){ renderPreview(false); clearTimeout(listT); listT = setTimeout(renderList, 120); }
    else if (kind === 'meta'){ updateChrome(); }
    else E.renderAll(false);
    save();
    updateUndo();
  };
  function restore(from, to){
    if (!from.length) return;
    to.push(snap());
    var s = from.pop();
    E.deck = s.deck; E.cur = Math.min(s.cur, E.deck.slides.length - 1);
    lastTag = '';
    E.renderAll(false, true);
    save();
    updateUndo();
  }
  E.undo = function(){ restore(undoStack, redoStack); };
  E.redo = function(){ restore(redoStack, undoStack); };
  function updateUndo(){ $('undoBtn').disabled = !undoStack.length; $('redoBtn').disabled = !redoStack.length; }

  /* ---------- persistence ---------- */

  var saveT, warnedQuota = false;
  function save(){
    clearTimeout(saveT);
    saveT = setTimeout(function(){
      try { localStorage.setItem(STORE, JSON.stringify(E.deck)); warnedQuota = false; }
      catch (e){
        if (!warnedQuota){ ui.toast('Autosave failed — the deck is too large for browser storage. Use Save to keep a copy.', 'err', 5000); warnedQuota = true; }
      }
    }, 350);
  }
  function loadSaved(){
    try { var raw = localStorage.getItem(STORE); if (raw) return SF.normalizeDeck(JSON.parse(raw)); } catch (e) {}
    return null;
  }

  E.load = function(deck, opts){
    opts = opts || {};
    deck = SF.normalizeDeck(deck);
    if (opts.undoable === false){ E.deck = deck; E.cur = 0; E.renderAll(true, true); save(); updateUndo(); return; }
    E.change(function(){ E.deck = deck; E.cur = 0; }, '', 'meta');
    E.renderAll(true);
  };

  /* ---------- rendering ---------- */

  function activeHTML(deck, i){ return SF.renderSlide(deck, i).replace('class="slide ', 'class="slide active '); }

  // Static mini render of slide i of `deck` into `box` (used by the slide list and the layout picker).
  function mini(box, deck, i){
    var w = box.clientWidth || 168, h = w * 9 / 16;
    var root = document.createElement('div');
    root.className = 'th-root sf-static';
    SF.applyTheme(root, deck);
    root.style.setProperty('--accent', SF.accentFor(deck, i));
    root.innerHTML = SF.backdrop() + '<div class="sf-stage">' + activeHTML(deck, i) + '</div>';
    box.innerHTML = '';
    box.appendChild(root);
    SF.fitStage(root.querySelector('.sf-stage'), w, h);
  }
  E.mini = mini;

  function renderList(){
    var list = $('list'), slides = E.deck.slides;
    list.innerHTML = '';
    slides.forEach(function(s, i){
      var it = document.createElement('div');
      it.className = 'sl-item' + (i === E.cur ? ' on' : '');
      it.draggable = true;
      it.setAttribute('data-i', i);
      it.title = SF.LAYOUTS[s.layout].name;
      it.innerHTML = '<span class="sl-n">' + (i + 1) + '</span><div class="sl-thumb"></div>' +
        '<div class="sl-acts"><button data-a="dup" title="Duplicate (Ctrl+D)">⧉</button><button data-a="del" title="Delete (Del)">✕</button></div>' +
        (s.notes ? '<span class="sl-note" title="Has speaker notes">✎</span>' : '');
      list.appendChild(it);
    });
    // Thumbnails are measured after the items are in the DOM.
    list.querySelectorAll('.sl-thumb').forEach(function(box, i){ mini(box, E.deck, i); });
    $('slideCount').textContent = slides.length;
  }
  function renderThumb(i){
    var it = $('list').children[i];
    if (!it) return renderList();
    mini(it.querySelector('.sl-thumb'), E.deck, i);
    var hasNote = !!E.deck.slides[i].notes, mark = it.querySelector('.sl-note');
    if (hasNote && !mark) it.insertAdjacentHTML('beforeend', '<span class="sl-note" title="Has speaker notes">✎</span>');
    if (!hasNote && mark) mark.remove();
  }
  function markCurrent(){
    Array.prototype.forEach.call($('list').children, function(el, j){ el.classList.toggle('on', j === E.cur); });
    var on = $('list').children[E.cur];
    if (on) on.scrollIntoView({ block:'nearest' });
  }

  var pv = { root:null, stage:null, glow:null, html:'' };
  function buildPreview(){
    $('preview').innerHTML = '<div class="pv-root"></div>';
    pv.root = $('preview').firstChild;
    pv.root.innerHTML = SF.backdrop() + '<div class="sf-stage"></div>';
    pv.stage = pv.root.querySelector('.sf-stage');
    pv.glow = pv.root.querySelector('.sf-glow');
    new ResizeObserver(fitPreview).observe($('preview'));
  }
  function fitPreview(){
    var box = $('preview');
    var cs = getComputedStyle(box);
    var w = box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    var h = box.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    var s = Math.max(0.05, Math.min(w / 1600, h / 900));
    pv.root.style.width = Math.floor(1600 * s) + 'px';
    pv.root.style.height = Math.floor(900 * s) + 'px';
    SF.fitStage(pv.stage, 1600 * s, 900 * s);
  }
  function countUp(el){
    var raw = el.getAttribute('data-count'), target = parseFloat(raw), dec = (raw.split('.')[1] || '').length, t0 = performance.now();
    (function tick(t){
      var p = Math.min((t - t0) / 950, 1);
      el.textContent = (target * (1 - Math.pow(1 - p, 3))).toFixed(dec);
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }

  // animate=true plays the slide's transition and entrances; false swaps content in place (used while typing).
  function renderPreview(animate){
    var deck = E.deck, k = E.cur, root = pv.root;
    root.className = 'pv-root';
    SF.applyTheme(root, deck);
    root.style.setProperty('--accent', SF.accentFor(deck, k));
    pv.glow.style.transform = 'translate3d(' + (k % 2 ? -16 : 18) + '%,' + (k % 3 ? -20 : 14) + '%,0) scale(' + (1 + (k % 4) * 0.06) + ')';
    var html = SF.renderSlide(deck, k);
    if (!animate && html === pv.html) return;
    pv.html = html;
    if (!animate) root.classList.add('sf-static');
    pv.stage.innerHTML = html;
    SF.stagger(pv.stage, deck.theme.speed);
    var sl = pv.stage.firstChild;
    if (animate){
      requestAnimationFrame(function(){ requestAnimationFrame(function(){
        sl.classList.add('active');
        sl.querySelectorAll('[data-count]').forEach(function(el){ setTimeout(function(){ countUp(el); }, 360); });
      }); });
    } else {
      sl.classList.add('active');
      void root.offsetWidth;
      root.classList.remove('sf-static');
    }
  }
  E.replay = function(){ pv.html = ''; renderPreview(true); };

  function updateChrome(){
    var s = E.deck.slides[E.cur], n = E.deck.slides.length;
    $('layoutName').textContent = SF.LAYOUTS[s.layout].name + ' ▾';
    $('pvCount').textContent = (E.cur + 1) + ' / ' + n;
    $('pvPrev').disabled = E.cur === 0;
    $('pvNext').disabled = E.cur === n - 1;
    var ti = $('deckTitle');
    if (document.activeElement !== ti) ti.value = E.deck.title;
    document.title = (E.deck.title ? E.deck.title + ' — ' : '') + 'SlideForge';
  }

  // full: also rebuild the theme panel. keepFocus: inspector tries to restore the focused field.
  E.renderAll = function(full, keepFocus){
    renderList();
    renderPreview(true);
    updateChrome();
    if (SF.panels){ SF.panels.slide(keepFocus); if (full !== false || keepFocus) SF.panels.theme(); }
  };

  E.select = function(i, opts){
    i = Math.max(0, Math.min(E.deck.slides.length - 1, i));
    if (i === E.cur && !(opts && opts.force)) return;
    E.cur = i;
    markCurrent();
    renderPreview(true);
    updateChrome();
    if (SF.panels) SF.panels.slide();
  };

  /* ---------- slide operations ---------- */

  function sectionNumberAt(slides, idx){
    var n = 0;
    for (var i = 0; i < idx; i++) if (slides[i].layout === 'section') n++;
    return (n + 1 < 10 ? '0' : '') + (n + 1);
  }
  E.addSlide = function(layout, at){
    E.change(function(d){
      var pos = at == null ? E.cur + 1 : at;
      var s = SF.makeSlide(layout);
      if (layout === 'section') s.data.number = sectionNumberAt(d.slides, pos);
      d.slides.splice(pos, 0, s);
      E.cur = pos;
    });
  };
  E.duplicate = function(i){
    i = i == null ? E.cur : i;
    E.change(function(d){
      var c = SF.clone(d.slides[i]);
      c.id = SF.uid();
      d.slides.splice(i + 1, 0, c);
      E.cur = i + 1;
    });
  };
  E.remove = function(i){
    i = i == null ? E.cur : i;
    if (E.deck.slides.length <= 1){ ui.toast('A deck needs at least one slide.'); return; }
    E.change(function(d){
      d.slides.splice(i, 1);
      if (E.cur >= d.slides.length || E.cur > i) E.cur = Math.max(0, E.cur - 1);
    });
    ui.toast('Slide deleted — Ctrl+Z to undo');
  };
  E.move = function(from, to){
    if (from === to || to < 0 || to >= E.deck.slides.length) return;
    E.change(function(d){
      var s = d.slides.splice(from, 1)[0];
      d.slides.splice(to, 0, s);
      E.cur = to;
    });
  };
  E.setLayout = function(layout){
    var s = E.deck.slides[E.cur];
    if (s.layout === layout) return;
    E.change(function(){
      SF.convertSlide(s, layout);
      if (layout === 'section' && !s.data.number) s.data.number = sectionNumberAt(E.deck.slides, E.cur);
    });
  };

  /* ---------- layout picker ---------- */

  var pickerClose = null;
  E.pickLayout = function(anchor, current, cb){
    var pop = $('layoutPicker');
    if (pickerClose){ var was = pop._anchor === anchor; pickerClose(); if (was) return; }
    pop.innerHTML = '<div class="lp-head">' + (current ? 'Change layout' : 'Add a slide') + '</div><div class="lp-grid"></div>';
    var grid = pop.querySelector('.lp-grid');
    SF.LAYOUT_ORDER.forEach(function(l){
      var b = document.createElement('button');
      b.className = 'lp-item' + (l === current ? ' on' : '');
      b.innerHTML = '<div class="lp-thumb"></div><b>' + esc(SF.LAYOUTS[l].name) + '</b><small>' + esc(SF.LAYOUTS[l].desc) + '</small>';
      b.onclick = function(){ close(); cb(l); };
      grid.appendChild(b);
    });
    pop._anchor = anchor;
    pop.classList.add('open');
    var r = anchor.getBoundingClientRect(), pw = pop.offsetWidth, ph = pop.offsetHeight;
    var left = Math.min(Math.max(8, r.left), innerWidth - pw - 8);
    var top = r.bottom + 6;
    if (top + ph > innerHeight - 8) top = Math.max(8, r.top - ph - 6);
    pop.style.left = left + 'px'; pop.style.top = top + 'px';
    // Mini previews use the deck's theme so the picker shows what you'll actually get.
    var demo = { title:'', theme:E.deck.theme, slides:SF.LAYOUT_ORDER.map(function(l){ return SF.makeSlide(l); }) };
    grid.querySelectorAll('.lp-thumb').forEach(function(box, i){ mini(box, demo, i); });
    function outside(e){ if (!pop.contains(e.target) && e.target !== anchor && !anchor.contains(e.target)) close(); }
    function close(){ pop.classList.remove('open'); document.removeEventListener('mousedown', outside, true); pickerClose = null; }
    setTimeout(function(){ document.addEventListener('mousedown', outside, true); });
    pickerClose = close;
  };

  /* ---------- present ---------- */

  E.present = function(from){
    if (E.presenting) return;
    if (pickerClose) pickerClose();
    var host = document.createElement('div');
    document.body.appendChild(host);
    E.presenting = true;
    var last = from == null ? E.cur : from, wasFull = false;
    var p = SF.play(host, E.deck, { start:last, fsTarget:host, onChange:function(k){ last = k; }, onExit:close });
    function onFs(){
      if (document.fullscreenElement === host) wasFull = true;
      else if (wasFull) close();   // Esc in fullscreen exits fullscreen; treat that as leaving the presentation.
    }
    document.addEventListener('fullscreenchange', onFs);
    if (host.requestFullscreen) host.requestFullscreen().catch(function(){});
    function close(){
      if (!E.presenting) return;
      E.presenting = false;
      document.removeEventListener('fullscreenchange', onFs);
      if (document.fullscreenElement) document.exitFullscreen().catch(function(){});
      p.destroy();
      host.remove();
      E.select(last, { force:true });
    }
  };

  /* ---------- save / open / export ---------- */

  E.saveFile = function(){
    var out = Object.assign({ app:'SlideForge', version:1 }, E.deck);
    download(slug(E.deck.title) + '.json', JSON.stringify(out, null, 2), 'application/json');
    ui.toast('Deck saved as ' + slug(E.deck.title) + '.json');
  };
  E.openFile = function(file){
    var fr = new FileReader();
    fr.onload = function(){
      try {
        var deck = JSON.parse(fr.result);
        E.load(deck);
        ui.toast('Opened “' + E.deck.title + '”');
      } catch (e){ ui.toast('Could not open that file: ' + e.message, 'err', 4000); }
    };
    fr.readAsText(file);
  };

  E.buildExport = function(deck){
    var t = deck.theme || {}, fkey = SF.FONTS[t.font] ? t.font : 'grotesk', f = SF.FONTS[fkey];
    var json = JSON.stringify(deck).replace(/</g, '\\u003c');
    var js = 'var DECK = ' + json + ';\n' +
      SF_RENDER.toString() + '\nSF_RENDER();\n' +
      SF_PLAYER.toString() + '\nSF_PLAYER();\n' +
      'SF.play(document.getElementById("deck"), DECK, { standalone: true });';
    js = js.replace(/<\/(script)/gi, '<\\/$1');
    return '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n' +
      '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
      '<meta name="generator" content="SlideForge">\n' +
      '<title>' + esc(String(deck.title || 'Slides').replace(/[*`]/g, '')) + '</title>\n' +
      '<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
      '<link id="sf-font-' + fkey + '" rel="stylesheet" href="https://fonts.googleapis.com/css2?' + f.q + '&display=swap">\n' +
      '<style>html,body{margin:0;height:100%;overflow:hidden;background:#000}' + SF_DECK_CSS + '</style>\n' +
      '</head>\n<body>\n<div id="deck"></div>\n<script>\n' + js + '\n</script>\n</body>\n</html>\n';
  };
  E.exportHTML = function(){
    var deck = SF.clone(E.deck);
    deck.slides.forEach(function(s){ delete s.id; });
    download(slug(deck.title) + '.html', E.buildExport(deck), 'text/html');
    ui.toast('Exported ' + slug(deck.title) + '.html — double-click it to present');
  };

  /* ---------- wiring ---------- */

  function typingIn(el){ return el && (/INPUT|TEXTAREA|SELECT/.test(el.tagName) || el.isContentEditable); }

  function wire(){
    $('undoBtn').onclick = E.undo;
    $('redoBtn').onclick = E.redo;
    $('newBtn').onclick = function(){
      ui.confirm('Start a new deck?', 'The current deck will be replaced. You can still undo with Ctrl+Z.', 'New deck').then(function(ok){
        if (ok){ E.load(SF.blankDeck()); ui.toast('New deck'); }
      });
    };
    $('openBtn').onclick = function(){ $('fileOpen').click(); };
    $('fileOpen').onchange = function(){ if (this.files[0]) E.openFile(this.files[0]); this.value = ''; };
    $('saveBtn').onclick = E.saveFile;
    $('exportBtn').onclick = E.exportHTML;
    $('presentBtn').onclick = function(){ E.present(); };
    $('replayBtn').onclick = E.replay;
    $('pvPrev').onclick = function(){ E.select(E.cur - 1); };
    $('pvNext').onclick = function(){ E.select(E.cur + 1); };
    $('addSlide').onclick = function(){ E.pickLayout(this, null, function(l){ E.addSlide(l); }); };
    $('layoutName').onclick = function(){ E.pickLayout(this, E.deck.slides[E.cur].layout, E.setLayout); };
    $('deckTitle').oninput = function(){ var v = this.value; E.change(function(d){ d.title = v; }, 'title', 'meta'); };

    var list = $('list'), dragFrom = -1;
    list.onclick = function(e){
      var it = e.target.closest('.sl-item');
      if (!it) return;
      var i = +it.getAttribute('data-i'), a = e.target.closest('[data-a]');
      if (a){ e.stopPropagation(); if (a.getAttribute('data-a') === 'dup') E.duplicate(i); else E.remove(i); return; }
      E.select(i);
    };
    list.ondblclick = function(e){ var it = e.target.closest('.sl-item'); if (it && !e.target.closest('[data-a]')) E.present(+it.getAttribute('data-i')); };
    list.ondragstart = function(e){
      var it = e.target.closest('.sl-item');
      if (!it) return;
      dragFrom = +it.getAttribute('data-i');
      it.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(dragFrom));
    };
    function clearDrop(){ list.querySelectorAll('.drop-before,.drop-after,.dragging').forEach(function(el){ el.classList.remove('drop-before', 'drop-after', 'dragging'); }); }
    list.ondragover = function(e){
      if (dragFrom < 0) return;
      var it = e.target.closest('.sl-item');
      if (!it) return;
      e.preventDefault();
      var r = it.getBoundingClientRect(), after = e.clientY > r.top + r.height / 2;
      list.querySelectorAll('.drop-before,.drop-after').forEach(function(el){ el.classList.remove('drop-before', 'drop-after'); });
      it.classList.add(after ? 'drop-after' : 'drop-before');
    };
    list.ondrop = function(e){
      e.preventDefault();
      var it = e.target.closest('.sl-item');
      if (it && dragFrom >= 0){
        var to = +it.getAttribute('data-i') + (it.classList.contains('drop-after') ? 1 : 0);
        if (to > dragFrom) to--;
        E.move(dragFrom, to);
      }
      clearDrop(); dragFrom = -1;
    };
    list.ondragend = function(){ clearDrop(); dragFrom = -1; };

    // Drop an image file on the preview to put it in the current slide.
    var prev = $('preview');
    prev.ondragover = function(e){ if (e.dataTransfer.types.indexOf('Files') >= 0){ e.preventDefault(); prev.classList.add('drop'); } };
    prev.ondragleave = function(){ prev.classList.remove('drop'); };
    prev.ondrop = function(e){
      e.preventDefault(); prev.classList.remove('drop');
      var file = e.dataTransfer.files[0];
      if (!file) return;
      var s = E.deck.slides[E.cur];
      SF.readImage(file).then(function(url){
        E.change(function(){
          if (!('image' in s.data)) SF.convertSlide(s, 'split');
          s.data.image = url;
        });
        ui.toast('Image added');
      }, function(err){ ui.toast(err.message, 'err'); });
    };

    document.addEventListener('keydown', function(e){
      if (E.presenting) return;
      var k = e.key, mod = e.ctrlKey || e.metaKey;
      if (openModal){ if (k === 'Escape') openModal.close(); return; }
      if (k === 'Escape' && pickerClose){ pickerClose(); return; }
      if (mod && (k === 'z' || k === 'Z')){ e.preventDefault(); if (e.shiftKey) E.redo(); else E.undo(); return; }
      if (mod && (k === 'y' || k === 'Y')){ e.preventDefault(); E.redo(); return; }
      if (mod && (k === 's' || k === 'S')){ e.preventDefault(); E.saveFile(); return; }
      if (mod && k === 'Enter'){ e.preventDefault(); E.present(); return; }
      if (mod && (k === 'd' || k === 'D')){ e.preventDefault(); E.duplicate(); return; }
      if (typingIn(e.target) || mod || e.altKey) return;
      switch (k){
        case 'ArrowUp': case 'ArrowLeft': case 'PageUp': e.preventDefault(); E.select(E.cur - 1); break;
        case 'ArrowDown': case 'ArrowRight': case 'PageDown': e.preventDefault(); E.select(E.cur + 1); break;
        case 'Home': e.preventDefault(); E.select(0); break;
        case 'End': e.preventDefault(); E.select(E.deck.slides.length - 1); break;
        case 'Delete': case 'Backspace': e.preventDefault(); E.remove(); break;
        case 'r': case 'R': E.replay(); break;
      }
    });
  }

  function init(){
    var st = document.createElement('style');
    st.id = 'sf-deck-css';
    st.textContent = SF_DECK_CSS;
    document.head.appendChild(st);
    buildPreview();
    wire();
    if (SF.panels) SF.panels.init();
    var deck = loadSaved();
    E.load(deck || SF.sampleDeck(), { undoable:false });
    if (!deck) ui.toast('Loaded a sample deck — press New to start fresh', '', 4000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
