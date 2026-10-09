(function(){
  var SF = window.SF;
  var KEY_STORE = 'slideforge.ai.key', MODEL_STORE = 'slideforge.ai.model';

  SF.AI_MODELS = [
    ['claude-opus-5-5', 'Claude Opus 5.5 — best quality'],
    ['claude-sonnet-5-5', 'Claude Sonnet 5.5 — faster'],
    ['claude-haiku-4-5', 'Claude Haiku 4.5 — fastest']
  ];

  function store(k, v){
    try { if (v === undefined) return localStorage.getItem(k) || ''; if (v) localStorage.setItem(k, v); else localStorage.removeItem(k); } catch (e) {}
    return '';
  }

  var sessionKey = '';
  var ai = SF.ai = {
    key: function(){ return sessionKey || store(KEY_STORE); },
    setKey: function(k, remember){ sessionKey = k; store(KEY_STORE, remember ? k : null); },
    remembered: function(){ return !!store(KEY_STORE); },
    model: function(){ return store(MODEL_STORE) || SF.AI_MODELS[0][0]; },
    setModel: function(m){ store(MODEL_STORE, m); },
    ready: function(){ return !!ai.key(); }
  };

  /* ---------- request ---------- */

  async function call(system, user, schema, opts){
    opts = opts || {};
    var key = ai.key();
    if (!key) throw new Error('Add your Anthropic API key first.');
    var model = ai.model();
    var body = {
      model: model,
      max_tokens: opts.maxTokens || 16000,
      stream: true,
      system: system,
      messages: [{ role:'user', content:user }],
      output_config: { format: { type:'json_schema', schema:schema } }
    };
    var headers = {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    };
    // Haiku 4.5 doesn't take `effort`; the newer models do. Opus/Sonnet 5.5 can also re-run a
    // safety decline on a fallback model server-side.
    if (model !== 'claude-haiku-4-5'){
      body.output_config.effort = opts.effort || 'medium';
      body.fallbacks = 'default';
      headers['anthropic-beta'] = 'server-side-fallback-2026-07-01';
    }

    var res;
    try {
      res = await fetch('https://api.anthropic.com/v1/messages', { method:'POST', headers:headers, body:JSON.stringify(body), signal:opts.signal });
    } catch (e) {
      if (e.name === 'AbortError') throw e;
      throw new Error('Could not reach the Anthropic API. Check your connection.');
    }
    if (!res.ok){
      var json = null;
      try { json = await res.json(); } catch (e) {}
      var msg = json && json.error && json.error.message || ('HTTP ' + res.status);
      if (res.status === 401) msg = 'The API key was rejected. Check it and try again.';
      else if (res.status === 429) msg = 'Rate limited. Wait a moment and try again.';
      else if (res.status >= 500) msg = 'The API is having trouble (' + res.status + '). Try again shortly.';
      throw new Error(msg);
    }

    // Read the server-sent event stream, collecting text deltas.
    var reader = res.body.getReader(), dec = new TextDecoder(), buf = '', text = '', stop = '';
    function handle(ev){
      if (ev.type === 'content_block_delta' && ev.delta && ev.delta.type === 'text_delta'){
        text += ev.delta.text;
        if (opts.onText) opts.onText(text);
      } else if (ev.type === 'message_delta' && ev.delta && ev.delta.stop_reason){
        stop = ev.delta.stop_reason;
      } else if (ev.type === 'error'){
        throw new Error((ev.error && ev.error.message) || 'The API reported an error mid-response.');
      }
    }
    for (;;){
      var chunk = await reader.read();
      if (chunk.done) break;
      buf += dec.decode(chunk.value, { stream:true });
      var lines = buf.split('\n');
      buf = lines.pop();
      lines.forEach(function(l){
        if (l.indexOf('data:') !== 0) return;
        var ev; try { ev = JSON.parse(l.slice(5)); } catch (e) { return; }
        handle(ev);
      });
    }
    if (stop === 'refusal') throw new Error('Claude declined this request. Try rephrasing it.');
    if (stop === 'max_tokens') throw new Error('The response was cut off. Ask for fewer slides.');
    try { return JSON.parse(text); }
    catch (e) { throw new Error('Claude returned something that wasn’t valid JSON. Try again.'); }
  }

  /* ---------- schemas built from the layout registry ---------- */

  var FIELD_KEYS = [];
  SF.LAYOUT_ORDER.forEach(function(l){
    SF.LAYOUTS[l].fields.forEach(function(f){ if (FIELD_KEYS.indexOf(f.k) < 0 && f.type !== 'image') FIELD_KEYS.push(f.k); });
  });

  function obj(props){
    return { type:'object', properties:props, required:Object.keys(props), additionalProperties:false };
  }
  var SLIDE_SCHEMA = obj({
    layout: { type:'string', enum:SF.LAYOUT_ORDER },
    fields: { type:'array', items: obj({ key:{ type:'string', enum:FIELD_KEYS }, value:{ type:'string' } }) },
    notes: { type:'string' }
  });
  var THEME_SCHEMA = obj({
    font: { type:'string', enum:Object.keys(SF.FONTS) },
    palette: { type:'string', enum:Object.keys(SF.PALETTES) },
    base: { type:'string', enum:SF.BASES },
    bg: { type:'string', enum:SF.BGS },
    transition: { type:'string', enum:SF.TRANSITIONS },
    elAnim: { type:'string', enum:SF.ELANIMS },
    accentMode: { type:'string', enum:['section','cycle','single'] },
    reason: { type:'string' }
  });
  var DECK_SCHEMA = obj({ title:{ type:'string' }, theme:THEME_SCHEMA, slides:{ type:'array', items:SLIDE_SCHEMA } });

  function layoutGuide(){
    return SF.LAYOUT_ORDER.map(function(l){
      var L = SF.LAYOUTS[l];
      var fs = L.fields.filter(function(f){ return f.type !== 'image'; }).map(function(f){
        if (f.type === 'rows') return f.k + ' (one row per line, columns separated by " | ": ' + f.cols.join(' | ') + ')';
        if (f.type === 'select') return f.k + ' (one of: ' + f.opts.map(function(o){ return o[0] || '""'; }).join(', ') + ')';
        return f.k;
      });
      return '- ' + l + ' — ' + L.desc + '. Fields: ' + fs.join('; ');
    }).join('\n');
  }

  var STYLE_RULES =
    'Writing rules for slide text:\n' +
    '- Slides are glanceable: titles under ~8 words, list items under ~12 words, details under ~18 words. Put depth in speaker notes.\n' +
    '- Inline formatting: *word* renders in the accent colour (use on 1–3 key words per title), **word** is bold, `x` is code. A newline in a text field is a line break.\n' +
    '- Never put a "|" or a line break inside a row cell.\n' +
    '- stats: Value must be a plain number (e.g. 42 or 3.5) so it can animate; put units like %, x, k in Suffix. Use 2–4 stats.\n' +
    '- timeline: prefix a Title with "!" to highlight the key milestone (at most one).\n' +
    '- cards: 2–4 cards; points: 3–6 items; bigpoints: 2–4 items.\n' +
    '- Leave eyebrow empty on content slides unless it adds something; it defaults to the section name.\n' +
    '- section slides: number is "01", "02", … in order.\n' +
    '- Do not invent statistics, quotes or attributions. If the brief has no real numbers, avoid the stats layout, and only use quote for well-known, correctly attributed quotes or quotes provided in the brief.\n' +
    '- image and split slides need a picture the user will add later; use them sparingly and describe the intended picture in caption.\n' +
    '- Only include fields that belong to the chosen layout.';

  function toSlide(s){
    var layout = SF.LAYOUTS[s.layout] ? s.layout : 'points';
    var data = {};
    var allowed = SF.LAYOUTS[layout].fields.map(function(f){ return f.k; });
    (s.fields || []).forEach(function(f){ if (allowed.indexOf(f.key) >= 0) data[f.key] = String(f.value || ''); });
    SF.LAYOUTS[layout].fields.forEach(function(f){ if (!(f.k in data)) data[f.k] = ''; });
    var slide = SF.makeSlide(layout, data);
    slide.data = data;
    slide.notes = String(s.notes || '');
    return slide;
  }

  function toTheme(t, base){
    var out = Object.assign({}, base || SF.defaultTheme());
    ['font','base','bg','transition','elAnim','accentMode'].forEach(function(k){ if (t[k]) out[k] = t[k]; });
    if (SF.PALETTES[t.palette]){ out.paletteName = t.palette; out.palette = SF.PALETTES[t.palette].slice(); }
    return out;
  }

  function themeGuide(){
    return 'Theme options: font (' + Object.keys(SF.FONTS).map(function(k){ return k + ' = ' + SF.FONTS[k].name + ' (' + SF.FONTS[k].d.replace(/'/g, '') + ')'; }).join(', ') +
      '); palette (' + Object.keys(SF.PALETTES).map(function(k){ return k + ': ' + SF.PALETTES[k].join(' '); }).join('; ') +
      '); base background colour (' + SF.BASES.join(', ') + ' — paper and snow are light, the rest dark; the ink palette is only for light bases); ' +
      'bg pattern (' + SF.BGS.join(', ') + '); slide transition (' + SF.TRANSITIONS.join(', ') + '); element entrance elAnim (' + SF.ELANIMS.join(', ') +
      '); accentMode (section = colour changes per section, cycle = every slide, single = one colour). Give a one-sentence reason.';
  }

  /* ---------- public actions ---------- */

  ai.generateDeck = async function(brief, opts){
    opts = opts || {};
    var system = 'You design presentation decks for SlideForge, a slide app with fixed layouts. ' +
      'Return the whole deck as JSON matching the schema. Choose the layout that best fits each idea and vary layouts so the deck has rhythm.\n\n' +
      'Layouts:\n' + layoutGuide() + '\n\n' + STYLE_RULES + '\n\n' + themeGuide();
    var user = 'Create a deck of about ' + (opts.count || 10) + ' slides. Start with a cover slide; use section slides to group the content if the deck has more than ~7 slides; end with a clear closing slide.' +
      (opts.audience ? '\nAudience: ' + opts.audience : '') +
      (opts.tone ? '\nTone: ' + opts.tone : '') +
      '\nWrite speaker notes for every content slide (2–4 sentences).\n\nBrief:\n' + brief;
    var r = await call(system, user, DECK_SCHEMA, { signal:opts.signal, onText:opts.onText, maxTokens:32000 });
    var slides = (r.slides || []).map(toSlide);
    if (!slides.length) throw new Error('Claude returned an empty deck. Try a more detailed brief.');
    return { title:String(r.title || 'Untitled deck'), theme:toTheme(r.theme || {}), slides:slides, reason:r.theme && r.theme.reason };
  };

  ai.rewriteSlide = async function(deck, index, instruction, opts){
    opts = opts || {};
    var s = deck.slides[index];
    var context = deck.slides.map(function(x, i){
      var d = x.data || {};
      return (i === index ? '→ ' : '  ') + (i + 1) + '. [' + x.layout + '] ' + String(d.title || d.text || d.quote || '').replace(/\n/g, ' ');
    }).join('\n');
    var current = { layout:s.layout, fields:Object.keys(s.data).filter(function(k){ return s.data[k] && k !== 'image'; }).map(function(k){ return { key:k, value:s.data[k] }; }), notes:s.notes || '' };
    var system = 'You edit single slides in SlideForge decks. Return the revised slide as JSON matching the schema.\n\n' +
      'Layouts:\n' + layoutGuide() + '\n\n' + STYLE_RULES;
    var user = 'Deck: ' + deck.title + '\nOutline (→ marks the slide to edit):\n' + context +
      '\n\nCurrent slide:\n' + JSON.stringify(current, null, 2) +
      '\n\nInstruction: ' + (instruction || 'Make this slide clearer, punchier and more visual.') +
      (opts.keepLayout ? '\nKeep the layout "' + s.layout + '".' : '\nYou may switch to a better-fitting layout if it helps.') +
      '\nKeep facts that are already on the slide; do not invent new ones.';
    var r = await call(system, user, SLIDE_SCHEMA, { signal:opts.signal, onText:opts.onText });
    var out = toSlide(r);
    if (s.data.image && 'image' in out.data) out.data.image = s.data.image;
    return out;
  };

  ai.suggestTheme = async function(deck, mood, opts){
    opts = opts || {};
    var outline = deck.slides.slice(0, 30).map(function(x){ var d = x.data || {}; return '- ' + String(d.title || d.text || d.quote || x.layout).replace(/\n/g, ' '); }).join('\n');
    var system = 'You are a presentation designer choosing a visual theme for a SlideForge deck. Return JSON matching the schema.\n\n' + themeGuide();
    var user = 'Deck title: ' + deck.title + '\nSlides:\n' + outline + (mood ? '\n\nThe presenter wants it to feel: ' + mood : '') +
      '\n\nPick a theme that suits the subject and audience and keeps text readable.';
    var r = await call(system, user, THEME_SCHEMA, { signal:opts.signal, onText:opts.onText, maxTokens:4000, effort:'low' });
    return { theme:toTheme(r, deck.theme), reason:r.reason || '' };
  };
})();
