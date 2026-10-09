(function(){
  var SF = window.SF;

  var FMT = 'Supports **bold**, *accent* and `code`';
  var EYEBROW = { k:'eyebrow', label:'Eyebrow', type:'text', hint:'Leave empty to show the section name' };
  var TITLE = { k:'title', label:'Title', type:'area', rows:2, hint:FMT };
  var LEDE = { k:'lede', label:'Lede', type:'area', rows:3 };
  var FIT = { k:'fit', label:'Image fit', type:'select', opts:[['cover','Fill (crop)'],['contain','Fit (no crop)']] };

  // list: which rows-field holds the slide's main list, and what each column means.
  // Column meanings are shared names used to convert content between layouts.
  SF.LAYOUTS = {
    cover: {
      name:'Cover', desc:'Title slide with meta row',
      fields:[
        { k:'badge', label:'Badge', type:'text', hint:'Small tag in the top-right corner' },
        { k:'eyebrow', label:'Eyebrow', type:'text' },
        { k:'title', label:'Title', type:'area', rows:2, hint:FMT },
        { k:'subtitle', label:'Subtitle', type:'area', rows:2 },
        { k:'meta', label:'Meta', type:'rows', cols:['Label','Value'] }
      ],
      list:{ field:'meta', cols:['title','desc'] },
      defaults:{ badge:'', eyebrow:'Presentation', title:'Your big *idea*', subtitle:'A short line that sets the stage',
        meta:'Presenter | Your Name\nDate | ' + new Date().toLocaleDateString(undefined, { month:'long', year:'numeric' }) }
    },
    section: {
      name:'Section', desc:'Big number divider',
      fields:[
        { k:'number', label:'Number', type:'text' },
        { k:'title', label:'Title', type:'area', rows:2, hint:FMT },
        { k:'pill', label:'Pill', type:'text', hint:'Optional caption under the title' }
      ],
      defaults:{ number:'01', title:'New section', pill:'' }
    },
    statement: {
      name:'Statement', desc:'One bold sentence',
      fields:[
        { k:'eyebrow', label:'Eyebrow', type:'text' },
        { k:'text', label:'Statement', type:'area', rows:4, hint:FMT },
        { k:'after', label:'Follow-up', type:'area', rows:2 }
      ],
      defaults:{ eyebrow:'The point', text:'Say the one thing people should *remember*.', after:'' }
    },
    points: {
      name:'Points', desc:'Numbered list with details',
      fields:[ EYEBROW, TITLE, LEDE, { k:'items', label:'Points', type:'rows', cols:['Point','Detail'] } ],
      list:{ field:'items', cols:['title','desc'] },
      defaults:{ eyebrow:'', title:'Key points', lede:'',
        items:'First point | A short supporting detail\nSecond point | Why it matters\nThird point | What happens next' }
    },
    bigpoints: {
      name:'Big points', desc:'Few large statements',
      fields:[ EYEBROW, TITLE, { k:'items', label:'Points', type:'rows', cols:['Point','Detail'] } ],
      list:{ field:'items', cols:['title','desc'] },
      defaults:{ eyebrow:'', title:'', items:'Ship *smaller* changes | Less risk per release\nMeasure what matters | Then act on it\nKeep it simple | Complexity is a cost' }
    },
    cards: {
      name:'Cards', desc:'Grid of 1–4 columns',
      fields:[ EYEBROW, TITLE, LEDE,
        { k:'cards', label:'Cards', type:'rows', cols:['Tag','Title','Body'] },
        { k:'columns', label:'Columns', type:'select', opts:[['','Auto'],['1','1'],['2','2'],['3','3'],['4','4']] } ],
      list:{ field:'cards', cols:['tag','title','desc'] },
      defaults:{ eyebrow:'', title:'Three pillars', lede:'', columns:'',
        cards:'Speed | Fast by default | Every interaction under 100ms.\nCraft | Details matter | Polish is a feature, not a phase.\nTrust | Safe to use | Private and secure from day one.' }
    },
    image: {
      name:'Image', desc:'Full-width picture',
      fields:[ EYEBROW, TITLE, { k:'image', label:'Image', type:'image' }, { k:'caption', label:'Caption', type:'text' }, FIT ],
      defaults:{ eyebrow:'', title:'A picture is worth a thousand words', image:'', caption:'', fit:'cover' }
    },
    split: {
      name:'Split', desc:'Text beside an image',
      fields:[ EYEBROW, TITLE, LEDE, { k:'bullets', label:'Bullets', type:'rows', cols:['Bullet'] },
        { k:'image', label:'Image', type:'image' }, { k:'caption', label:'Caption', type:'text' }, FIT,
        { k:'side', label:'Image side', type:'select', opts:[['right','Right'],['left','Left']] } ],
      list:{ field:'bullets', cols:['title'] },
      defaults:{ eyebrow:'', title:'Text and image', lede:'Explain the picture in a sentence or two.',
        bullets:'A supporting point\nAnother detail worth noting', image:'', caption:'', fit:'cover', side:'right' }
    },
    quote: {
      name:'Quote', desc:'Pull quote with attribution',
      fields:[ { k:'quote', label:'Quote', type:'area', rows:4, hint:FMT }, { k:'cite', label:'Attribution', type:'text' } ],
      defaults:{ quote:'Simplicity is the ultimate *sophistication*.', cite:'Leonardo da Vinci' }
    },
    stats: {
      name:'Stats', desc:'Big numbers that count up',
      fields:[ EYEBROW, TITLE, LEDE, { k:'stats', label:'Stats', type:'rows', cols:['Value','Label','Suffix'],
        hint:'Plain numbers (like 42 or 3.5) animate; put units in Suffix' } ],
      list:{ field:'stats', cols:['value','title','suffix'] },
      defaults:{ eyebrow:'', title:'By the numbers', lede:'',
        stats:'98 | Customer satisfaction | %\n3.2 | Faster than before | x\n120 | Countries served | ' }
    },
    timeline: {
      name:'Timeline', desc:'Dated milestones',
      fields:[ EYEBROW, TITLE, { k:'items', label:'Milestones', type:'rows', cols:['When','Sub','Title','Detail'],
        hint:'Start a title with ! to highlight that milestone' } ],
      list:{ field:'items', cols:['time','sub','title','desc'] },
      defaults:{ eyebrow:'', title:'Roadmap',
        items:'Q1 | 2026 | Research | Interviews and prototypes\nQ2 | 2026 | !Launch beta | First 100 customers\nQ3 | 2026 | Scale | Self-serve onboarding\nQ4 | 2026 | General availability | ' }
    },
    compare: {
      name:'Compare', desc:'Do / don’t columns',
      fields:[ EYEBROW, TITLE, LEDE,
        { k:'leftTitle', label:'Left title (✓)', type:'text' }, { k:'left', label:'Left items', type:'rows', cols:['Item'] },
        { k:'rightTitle', label:'Right title (✕)', type:'text' }, { k:'right', label:'Right items', type:'rows', cols:['Item'] } ],
      defaults:{ eyebrow:'', title:'Do this, not that', lede:'',
        leftTitle:'Do', left:'Start with the problem\nShow real examples\nEnd with a clear ask',
        rightTitle:'Avoid', right:'Walls of text\nReading slides aloud\nBurying the conclusion' }
    }
  };
  SF.LAYOUT_ORDER = ['cover','section','statement','points','bigpoints','cards','image','split','quote','stats','timeline','compare'];

  function clone(o){
    if (Array.isArray(o)) return o.map(clone);
    if (o && typeof o === 'object'){ var r = {}; for (var k in o) r[k] = clone(o[k]); return r; }
    return o;
  }
  SF.clone = clone;
  SF.uid = function(){ return 's' + Math.random().toString(36).slice(2, 9); };

  SF.defaultTheme = function(){
    return { font:'grotesk', palette:SF.PALETTES.ember.slice(), paletteName:'ember', base:'midnight', bg:'grid',
      transition:'drift', elAnim:'up', accentMode:'section', speed:1, glow:true, vignette:true, hud:true, autoplay:0 };
  };

  SF.makeSlide = function(layout, data){
    var L = SF.LAYOUTS[layout] ? layout : 'points';
    var d = clone(SF.LAYOUTS[L].defaults);
    if (data) for (var k in data) if (data[k] != null) d[k] = data[k];
    return { id:SF.uid(), layout:L, data:d, notes:'' };
  };

  SF.blankDeck = function(){
    return { title:'Untitled deck', theme:SF.defaultTheme(), slides:[SF.makeSlide('cover', { title:'Untitled *deck*', subtitle:'', badge:'' })] };
  };

  // Fill in anything missing so older or hand-written decks load cleanly.
  SF.normalizeDeck = function(deck){
    if (!deck || typeof deck !== 'object' || !Array.isArray(deck.slides)) throw new Error('Not a SlideForge deck');
    var t = deck.theme = Object.assign(SF.defaultTheme(), deck.theme || {});
    if (!Array.isArray(t.palette) || !t.palette.filter(SF.hex).length) t.palette = (SF.PALETTES[t.paletteName] || SF.PALETTES.ember).slice();
    deck.title = String(deck.title || 'Untitled deck');
    deck.slides = deck.slides.filter(function(s){ return s && typeof s === 'object'; }).map(function(s){
      var L = SF.LAYOUTS[s.layout] ? s.layout : 'points';
      var out = { id:s.id || SF.uid(), layout:L, data:{}, notes:String(s.notes || '') };
      var src = s.data || {};
      SF.LAYOUTS[L].fields.forEach(function(f){ out.data[f.k] = src[f.k] == null ? '' : String(src[f.k]); });
      if (s.accent && SF.hex(s.accent)) out.accent = s.accent;
      if (s.transition && SF.TRANSITIONS.indexOf(s.transition) >= 0) out.transition = s.transition;
      if (s.section) out.section = String(s.section);
      return out;
    });
    if (!deck.slides.length) deck.slides.push(SF.makeSlide('cover'));
    return deck;
  };

  /* ---------- converting content between layouts ---------- */

  function splitRow(line){ return line.split('|').map(function(c){ return c.trim(); }); }
  function lines(text){ return String(text || '').split('\n').map(function(r){ return r.trim(); }).filter(Boolean); }
  function cell(s){ return String(s == null ? '' : s).replace(/\|/g, '/').replace(/\n/g, ' ').trim(); }
  SF.cell = cell;

  // Layout data -> a neutral shape: scalar fields plus items:[{title,desc,tag,value,suffix,time,sub,hot}]
  SF.toGeneric = function(layout, d){
    var g = {}, def = SF.LAYOUTS[layout];
    ['title','eyebrow','lede','text','after','quote','cite','image','caption','fit','side','number','pill','subtitle','badge']
      .forEach(function(k){ if (d[k]) g[k] = d[k]; });
    g.items = [];
    if (def.list){
      lines(d[def.list.field]).forEach(function(r){
        var c = splitRow(r), it = {};
        def.list.cols.forEach(function(name, i){ if (c[i]) it[name] = c[i]; });
        if (it.title && it.title.charAt(0) === '!'){ it.hot = true; it.title = it.title.slice(1).trim(); }
        g.items.push(it);
      });
    }
    if (layout === 'compare'){
      g.leftTitle = d.leftTitle; g.rightTitle = d.rightTitle;
      g.left = lines(d.left).map(function(r){ return { title:r }; });
      g.right = lines(d.right).map(function(r){ return { title:r }; });
      g.items = g.left.concat(g.right);
    }
    return g;
  };

  // toStats: the target holds numbers separately, so titles stay plain; otherwise a stat's
  // number is folded into the title ("98% Satisfaction") so converting back can recover it.
  function colValue(name, it, i, toStats){
    switch (name){
      case 'title':
        if (!toStats && it.value) return it.value + (it.suffix || '') + (it.title ? ' ' + it.title : '');
        return it.title || it.label || it.value || '';
      case 'desc': return it.desc || '';
      case 'tag': return it.tag || it.time || '';
      case 'value': return it.value || '';
      case 'suffix': return it.suffix || '';
      case 'time': return it.time || it.tag || String(i + 1).padStart(2, '0');
      case 'sub': return it.sub || '';
    }
    return '';
  }

  // Optional fields are cleared rather than left holding sample text from the defaults.
  var OPTIONAL = { eyebrow:1, lede:1, badge:1, pill:1, after:1, caption:1, subtitle:1, image:1, cite:1 };

  // Neutral shape -> data for `layout`. Anything the source can't supply falls back to the layout's defaults.
  SF.fromGeneric = function(layout, g){
    var def = SF.LAYOUTS[layout], d = clone(def.defaults);
    def.fields.forEach(function(f){
      if (f.type === 'rows') return;
      var v = g[f.k];
      if (f.k === 'title' && !v) v = g.text || g.quote;
      if (f.k === 'text' && !v) v = g.title || g.quote;
      if (f.k === 'quote' && !v) v = g.text || g.title;
      if (v) d[f.k] = v;
      else if (OPTIONAL[f.k]) d[f.k] = '';
    });
    var items = g.items || [];
    if (def.list && items.length){
      d[def.list.field] = items.map(function(it, i){
        var row = def.list.cols.map(function(name){ return cell(colValue(name, it, i, layout === 'stats')); });
        var ti = def.list.cols.indexOf('title');
        if (layout === 'timeline' && it.hot && ti >= 0) row[ti] = '!' + row[ti];
        if (layout === 'stats' && !row[0]){
          var m = /^([\d.,]+)\s*(%|x|k|m|b|ms|s)?(?:\s+(.*))?$/i.exec(row[1]);
          if (m && m[3]){ row[0] = m[1].replace(/,/g, ''); row[2] = row[2] || m[2] || ''; row[1] = m[3]; }
          else row[0] = '—';
        }
        while (row.length > 1 && !row[row.length - 1]) row.pop();
        return row.join(' | ');
      }).join('\n');
    }
    if (layout === 'compare'){
      var L = g.left, R = g.right;
      if (!L && items.length){ var h = Math.ceil(items.length / 2); L = items.slice(0, h); R = items.slice(h); }
      if (L && L.length) d.left = L.map(function(it){ return cell(it.title || it.desc); }).join('\n');
      if (R && R.length) d.right = R.map(function(it){ return cell(it.title || it.desc); }).join('\n');
      if (g.leftTitle) d.leftTitle = g.leftTitle;
      if (g.rightTitle) d.rightTitle = g.rightTitle;
    }
    return d;
  };

  SF.convertSlide = function(slide, layout){
    if (slide.layout === layout) return;
    var g = SF.toGeneric(slide.layout, slide.data || {});
    slide.data = SF.fromGeneric(layout, g);
    slide.layout = layout;
  };

  /* ---------- sample deck ---------- */

  SF.sampleDeck = function(){
    var S = SF.makeSlide;
    var deck = {
      title:'SlideForge — a quick tour',
      theme:SF.defaultTheme(),
      slides:[
        S('cover', { badge:'Sample deck', eyebrow:'SlideForge', title:'Make decks that *move*',
          subtitle:'A tour of every layout — edit anything on the right',
          meta:'Made with | SlideForge\nExport | One HTML file\nNeeds | Just a browser' }),
        S('statement', { eyebrow:'The idea', text:'Write the content.\nLet the design *take care of itself*.',
          after:'Pick a layout, type into the fields, and the slide updates live.' }),
        S('section', { number:'01', title:'Building slides', pill:'Layouts · fields · outlines' }),
        S('points', { title:'How it works', lede:'Every slide is a layout plus a handful of fields.',
          items:'Choose a layout | Twelve of them, from covers to timelines\nFill in the fields | Use **bold**, *accent* and `code` inline\nTheme the deck | Fonts, palettes, backgrounds, transitions\nPresent or export | One self-contained HTML file' }),
        S('cards', { title:'Three ways to start', columns:'3',
          cards:'Manual | Start from scratch | Add slides one by one and pick a layout for each.\nOutline | Paste an outline | Headings become sections, bullets become points.\nAI | Ask Claude | Describe the talk and get a draft deck to refine.' }),
        S('stats', { title:'By the numbers', lede:'Plain numbers count up when the slide appears.',
          stats:'12 | Layouts to choose from\n10 | Slide transitions\n1 | Self-contained HTML file to share' }),
        S('section', { number:'02', title:'Presenting', pill:'Keys · notes · overview' }),
        S('timeline', { title:'A typical workflow',
          items:'Step 1 | Draft | Outline the talk | Paste it into Outline → Slides\nStep 2 | Shape | Pick layouts | Swap any slide’s layout without losing text\nStep 3 | Style | !Choose a theme | Or let AI suggest one\nStep 4 | Share | Export HTML | Double-click to present anywhere' }),
        S('compare', { title:'Good slides, bad slides',
          leftTitle:'Do', left:'One idea per slide\nLarge, readable type\nSpeaker notes for the detail',
          rightTitle:'Avoid', right:'Paragraphs on screen\nTen bullets per slide\nReading the slide aloud' }),
        S('split', { title:'Pictures help', lede:'Upload an image or paste a URL into the Image field.',
          bullets:'Drop an image file straight onto the preview\nChoose fill or fit, and which side it sits on', side:'right' }),
        S('quote', { quote:'If you can’t explain it simply, you don’t understand it *well enough*.', cite:'Often attributed to Albert Einstein' }),
        S('bigpoints', { title:'Presenter keys',
          items:'← → to navigate | Or click, scroll or swipe\nN for notes · O for overview | B blacks out the screen\nF for fullscreen | Esc to exit' }),
        S('statement', { eyebrow:'Your turn', text:'Press **New** and make it *yours*.', after:'Or hit ▶ Present to see this deck in motion.' })
      ]
    };
    deck.slides[1].notes = 'Speaker notes live here. Press N while presenting to show them.';
    return deck;
  };
})();
