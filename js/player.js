function SF_PLAYER(){
  var SF = window.SF;

  function countUp(el){
    var raw = el.getAttribute('data-count');
    var target = parseFloat(raw), dec = (raw.split('.')[1] || '').length;
    var t0 = performance.now(), dur = 950;
    function tick(t){
      var p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * e).toFixed(dec);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  SF.play = function(root, deck, opts){
    opts = opts || {};
    var slides = deck.slides || [];
    var n = slides.length, cur = -1, busy = false;
    var t = deck.theme || {};

    root.innerHTML = '';
    root.className = 'sf-player';
    SF.applyTheme(root, deck);
    if (t.hud === false) root.setAttribute('data-hud', 'off');

    var html = SF.backdrop() + '<div class="sf-stage">';
    for (var i = 0; i < n; i++) html += SF.renderSlide(deck, i);
    html += '</div>' +
      '<div class="sf-hud"><span class="sec"></span><button data-act="prev" aria-label="Previous">&#8249;</button>' +
      '<span class="cnt"><b>01</b> / ' + (n < 10 ? '0' : '') + n + '</span>' +
      '<button data-act="next" aria-label="Next">&#8250;</button></div>' +
      '<div class="sf-bar"></div>' +
      '<div class="sf-index"><h4>' + SF.esc(deck.title || 'Slides') + '</h4><ol></ol></div>' +
      '<div class="sf-notes"></div><div class="sf-black"></div>' +
      '<div class="sf-hint">&larr; &rarr; navigate &middot; O overview &middot; N notes &middot; B blackout &middot; F fullscreen</div>';
    root.innerHTML = html;

    var $ = function(s){ return root.querySelector(s); };
    var stage = $('.sf-stage'), glow = $('.sf-glow'), bar = $('.sf-bar'), sec = $('.sf-hud .sec'),
        cnt = $('.sf-hud .cnt b'), idx = $('.sf-index'), notes = $('.sf-notes'), black = $('.sf-black'), hint = $('.sf-hint');
    var els = Array.prototype.slice.call(stage.children);
    SF.stagger(stage, t.speed);

    var ol = idx.querySelector('ol');
    slides.forEach(function(s, k){
      var li = document.createElement('li');
      var d = s.data || {};
      var label = String(d.title || d.text || d.quote || s.layout).replace(/\*/g, '').replace(/\n/g, ' ');
      li.innerHTML = '<span>' + (k < 9 ? '0' : '') + (k + 1) + '</span>' + SF.esc(label);
      li.onclick = function(){ go(k); toggle(idx, false); };
      ol.appendChild(li);
    });

    function fit(){ SF.fitStage(stage, root.clientWidth, root.clientHeight); }
    var ro = new ResizeObserver(fit); ro.observe(root); fit();

    function go(k){
      if (!n) return;
      k = Math.max(0, Math.min(n - 1, k));
      if (k === cur) return;
      cur = k;
      els.forEach(function(el, j){ el.classList.toggle('active', j === k); el.classList.toggle('prev', j < k); });
      var a = SF.accentFor(deck, k);
      root.style.setProperty('--accent', a);
      glow.style.transform = 'translate3d(' + (k % 2 ? -16 : 18) + '%,' + (k % 3 ? -20 : 14) + '%,0) scale(' + (1 + (k % 4) * 0.06) + ')';
      sec.textContent = SF.context(deck, k).section;
      cnt.textContent = (k < 9 ? '0' : '') + (k + 1);
      bar.style.width = ((k + 1) / n * 100) + '%';
      Array.prototype.forEach.call(ol.children, function(li, j){ li.classList.toggle('cur', j === k); });
      notes.textContent = slides[k].notes || '(no notes for this slide)';
      els[k].querySelectorAll('[data-count]').forEach(function(el){ setTimeout(function(){ countUp(el); }, 360); });
      if (opts.standalone) try { history.replaceState(null, '', '#' + (k + 1)); } catch (e) {}
      if (opts.onChange) opts.onChange(k);
      armAuto();
    }
    function step(d){
      if (busy) return;
      busy = true; go(cur + d);
      setTimeout(function(){ busy = false; }, 240);
    }
    function toggle(el, force){ el.classList.toggle('open', force === undefined ? !el.classList.contains('open') : force); }

    var autoT;
    function armAuto(){
      clearTimeout(autoT);
      var s = +t.autoplay || 0;
      if (s > 0 && cur < n - 1) autoT = setTimeout(function(){ step(1); }, s * 1000);
    }

    function fullscreen(){
      if (document.fullscreenElement) document.exitFullscreen();
      else (opts.fsTarget || document.documentElement).requestFullscreen().catch(function(){});
    }

    function onKey(e){
      if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      var k = e.key;
      if (k === 'Escape'){
        if (idx.classList.contains('open')) toggle(idx, false);
        else if (notes.classList.contains('open')) toggle(notes, false);
        else if (opts.onExit) opts.onExit();
        return;
      }
      if (k === 'o' || k === 'O' || k === 'g' || k === 'G'){ e.preventDefault(); toggle(idx); return; }
      if (idx.classList.contains('open')) return;
      switch (k){
        case 'ArrowRight': case 'ArrowDown': case ' ': case 'PageDown': case 'Enter': e.preventDefault(); step(1); break;
        case 'ArrowLeft': case 'ArrowUp': case 'PageUp': case 'Backspace': e.preventDefault(); step(-1); break;
        case 'Home': e.preventDefault(); go(0); break;
        case 'End': e.preventDefault(); go(n - 1); break;
        case 'f': case 'F': e.preventDefault(); fullscreen(); break;
        case 'n': case 'N': e.preventDefault(); toggle(notes); break;
        case 'b': case 'B': case '.': e.preventDefault(); black.classList.toggle('on'); break;
        default: return;
      }
      hint.classList.add('gone');
    }
    window.addEventListener('keydown', onKey);

    root.addEventListener('click', function(e){
      var btn = e.target.closest('[data-act]');
      if (btn){ step(btn.getAttribute('data-act') === 'next' ? 1 : -1); return; }
      if (e.target.closest('.sf-index,.sf-notes,a,button')) return;
      if (black.classList.contains('on')){ black.classList.remove('on'); return; }
      step(e.clientX < root.clientWidth * 0.25 ? -1 : 1);
    });

    var wheelLock = 0;
    root.addEventListener('wheel', function(e){
      if (idx.classList.contains('open')) return;
      var now = Date.now();
      if (now < wheelLock || Math.abs(e.deltaY) < 30) return;
      wheelLock = now + 700;
      step(e.deltaY > 0 ? 1 : -1);
    }, { passive: true });

    var tx = 0, ty = 0;
    root.addEventListener('touchstart', function(e){ tx = e.changedTouches[0].clientX; ty = e.changedTouches[0].clientY; }, { passive: true });
    root.addEventListener('touchend', function(e){
      var dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
      if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? 1 : -1);
    }, { passive: true });

    var idleT;
    function onMove(){
      root.classList.remove('idle'); clearTimeout(idleT);
      idleT = setTimeout(function(){ root.classList.add('idle'); }, 2600);
    }
    root.addEventListener('mousemove', onMove); onMove();
    setTimeout(function(){ hint.classList.add('gone'); }, 5000);

    var start = +opts.start || 0;
    if (opts.standalone){ var h = parseInt(location.hash.slice(1), 10); if (h > 0) start = h - 1; }
    requestAnimationFrame(function(){ requestAnimationFrame(function(){ go(start); }); });

    return {
      go: go,
      destroy: function(){
        window.removeEventListener('keydown', onKey);
        clearTimeout(autoT); clearTimeout(idleT); ro.disconnect();
        root.innerHTML = '';
      }
    };
  };
}
SF_PLAYER();
