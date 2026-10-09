window.SF_DECK_CSS = `
.sf-deck{--accent:#ff4b57;--spd:1;--ease:cubic-bezier(.22,.72,.16,1);--ease-out:cubic-bezier(.16,1,.3,1);
  --tint:255,255,255;--ink:#07080b;--ink2:#0b0c12;--fg:#eef0f6;--fg-dim:#9aa1b4;--fg-faint:#5f6678;
  --good:#2dd4bf;--bad:#ff4b57;--warn:#ffc93c;
  --line:rgba(var(--tint),.10);--line-soft:rgba(var(--tint),.06);
  --display:'Space Grotesk',system-ui,sans-serif;--body:'Inter',system-ui,sans-serif;--mono:'JetBrains Mono',ui-monospace,monospace;
  position:relative;overflow:hidden;background:var(--ink);color:var(--fg);font-family:var(--body);
  -webkit-font-smoothing:antialiased;user-select:none}
.sf-deck *{box-sizing:border-box;margin:0;padding:0}
.sf-deck[data-base=navy]{--ink:#060b16;--ink2:#0b1426;--fg-dim:#97a3bd;--fg-faint:#56627c}
.sf-deck[data-base=charcoal]{--ink:#0f0f11;--ink2:#17171a;--fg-dim:#a1a1aa;--fg-faint:#64646c}
.sf-deck[data-base=plum]{--ink:#0d0811;--ink2:#170e1e;--fg-dim:#ab9cb8;--fg-faint:#6b5d78}
.sf-deck[data-base=forest]{--ink:#060d0b;--ink2:#0b1714;--fg-dim:#94aba3;--fg-faint:#566b64}
.sf-deck[data-base=paper]{--tint:24,22,30;--ink:#f4f1ea;--ink2:#ebe6da;--fg:#16161c;--fg-dim:#4b4d58;--fg-faint:#8c8e97;
  --line:rgba(var(--tint),.14);--line-soft:rgba(var(--tint),.08)}
.sf-deck[data-base=snow]{--tint:20,24,34;--ink:#f7f8fb;--ink2:#eceff5;--fg:#11141b;--fg-dim:#4a5163;--fg-faint:#8a91a2;
  --line:rgba(var(--tint),.13);--line-soft:rgba(var(--tint),.075)}

/* background */
.sf-bg{position:absolute;inset:0;z-index:0;overflow:hidden;background:
  radial-gradient(1200px 700px at 78% -10%,rgba(var(--tint),.04),transparent 60%),
  linear-gradient(180deg,var(--ink2) 0%,var(--ink) 60%)}
.sf-bg .pat{position:absolute;inset:-2px;
  -webkit-mask-image:radial-gradient(ellipse 72% 78% at 50% 42%,#000 25%,transparent 82%);
          mask-image:radial-gradient(ellipse 72% 78% at 50% 42%,#000 25%,transparent 82%)}
.sf-deck[data-bg=grid] .pat{background-image:linear-gradient(rgba(var(--tint),.03) 1px,transparent 1px),
  linear-gradient(90deg,rgba(var(--tint),.03) 1px,transparent 1px);background-size:64px 64px}
.sf-deck[data-bg=dots] .pat{background-image:radial-gradient(rgba(var(--tint),.11) 1px,transparent 1.6px);background-size:26px 26px}
.sf-deck[data-bg=lines] .pat{background-image:repeating-linear-gradient(135deg,rgba(var(--tint),.035) 0 1px,transparent 1px 22px)}
.sf-deck[data-bg=aurora] .pat{-webkit-mask-image:none;mask-image:none;filter:blur(50px);opacity:.55;
  background:radial-gradient(38% 48% at 22% 28%,color-mix(in srgb,var(--accent) 45%,transparent),transparent 70%),
             radial-gradient(34% 44% at 78% 72%,color-mix(in srgb,var(--accent) 30%,#5aa9ff 20%),transparent 70%),
             radial-gradient(30% 40% at 60% 18%,color-mix(in srgb,var(--accent) 20%,#a78bfa 18%),transparent 70%);
  animation:sf-aurora 22s ease-in-out infinite alternate}
@keyframes sf-aurora{0%{transform:translate3d(-4%,2%,0) rotate(0deg) scale(1)}
  50%{transform:translate3d(3%,-3%,0) rotate(8deg) scale(1.08)}100%{transform:translate3d(-2%,4%,0) rotate(-6deg) scale(1.02)}}
.sf-glow{position:absolute;width:1100px;height:1100px;left:50%;top:50%;margin:-550px 0 0 -550px;border-radius:50%;
  background:radial-gradient(circle,var(--accent) 0%,transparent 62%);opacity:.11;filter:blur(40px);
  transform:translate3d(18%,-22%,0);transition:background 1.1s ease,transform 1.4s var(--ease)}
.sf-deck[data-base=paper] .sf-glow,.sf-deck[data-base=snow] .sf-glow{opacity:.14}
.sf-deck[data-glow=off] .sf-glow{display:none}
.sf-vig{position:absolute;inset:0;background:radial-gradient(120% 90% at 50% 50%,transparent 45%,rgba(0,0,0,.6) 100%)}
.sf-deck[data-base=paper] .sf-vig,.sf-deck[data-base=snow] .sf-vig{background:radial-gradient(120% 90% at 50% 50%,transparent 55%,rgba(0,0,0,.08) 100%)}
.sf-deck[data-vig=off] .sf-vig{display:none}

/* stage + slide transitions */
.sf-stage{position:absolute;left:50%;top:50%;width:1600px;height:900px;margin:-450px 0 0 -800px;z-index:1;
  transform-origin:center;perspective:2400px}
.slide{position:absolute;inset:0;padding:74px 100px 100px;display:flex;flex-direction:column;opacity:0;pointer-events:none;
  transition:opacity calc(.5s*var(--spd)) ease,transform calc(.8s*var(--spd)) var(--ease),filter calc(.6s*var(--spd)) ease,clip-path calc(.8s*var(--spd)) var(--ease);
  will-change:transform,opacity;backface-visibility:hidden}
.slide[data-tr=drift]{transform:translateX(5%) scale(.955);filter:blur(6px)}
.slide[data-tr=drift].prev{transform:translateX(-5%) scale(.955)}
.slide[data-tr=zoom]{transform:scale(1.14);filter:blur(10px)}
.slide[data-tr=zoom].prev{transform:scale(.86)}
.slide[data-tr=rise]{transform:translateY(9%);filter:blur(4px)}
.slide[data-tr=rise].prev{transform:translateY(-9%)}
.slide[data-tr=flip]{transform:rotateY(-68deg) scale(.88)}
.slide[data-tr=flip].prev{transform:rotateY(68deg) scale(.88)}
.slide[data-tr=swing]{transform-origin:50% 100%;transform:rotateX(-38deg) translateY(6%)}
.slide[data-tr=swing].prev{transform-origin:50% 0;transform:rotateX(38deg) translateY(-6%)}
.slide[data-tr=push]{transform:translateX(100%)}
.slide[data-tr=push].prev{transform:translateX(-100%)}
.slide[data-tr=wipe]{clip-path:inset(0 0 0 100%)}
.slide[data-tr=wipe].prev{clip-path:inset(0 100% 0 0)}
.slide[data-tr=iris]{clip-path:circle(0% at 50% 50%);transform:scale(1.04)}
.slide[data-tr=iris].prev{clip-path:circle(0% at 50% 50%)}
.slide[data-tr=glitch]{transition:opacity calc(.18s*var(--spd)) linear}
.sf-stage .slide.active{opacity:1;transform:none;filter:none;pointer-events:auto;z-index:3}
.sf-stage .slide[data-tr=wipe].active{clip-path:inset(0 0 0 0)}
.sf-stage .slide[data-tr=iris].active{clip-path:circle(75% at 50% 50%)}
.sf-stage .slide[data-tr=glitch].active{animation:sf-glitch calc(.55s*var(--spd)) steps(1) both}
@keyframes sf-glitch{0%{clip-path:inset(42% 0 33% 0);transform:translateX(-3%);filter:hue-rotate(60deg)}
  15%{clip-path:inset(8% 0 72% 0);transform:translateX(3%)}30%{clip-path:inset(68% 0 6% 0);transform:translateX(-2%);filter:hue-rotate(-40deg)}
  45%{clip-path:inset(22% 0 48% 0);transform:translateX(1.5%)}60%{clip-path:inset(0 0 0 0);transform:translateX(-.6%);filter:none}
  75%{transform:translateX(.3%)}100%{clip-path:none;transform:none}}

/* element entrances */
.sf-deck [data-anim]{opacity:0;transition:opacity calc(.62s*var(--spd)) var(--ease-out),transform calc(.74s*var(--spd)) var(--ease-out),filter calc(.6s*var(--spd)) ease}
.sf-deck[data-el=up] [data-anim]{transform:translateY(24px)}
.sf-deck[data-el=blur] [data-anim]{filter:blur(14px);transform:scale(1.03)}
.sf-deck[data-el=scale] [data-anim]{transform:scale(.9)}
.sf-deck[data-el=left] [data-anim]{transform:translateX(-36px)}
.sf-deck[data-el=drop] [data-anim]{transform:translateY(-26px) rotateX(30deg)}
.sf-deck .slide.active [data-anim]{opacity:1;transform:none;filter:none}
.sf-deck[data-el=none] [data-anim]{opacity:1;transform:none;filter:none;transition:none}
.sf-static .slide,.sf-static [data-anim]{transition:none!important;animation:none!important}

/* type */
.sf-deck .eyebrow{font-family:var(--mono);font-size:14px;font-weight:500;letter-spacing:.24em;text-transform:uppercase;
  color:var(--accent);display:flex;align-items:center;gap:14px}
.sf-deck .eyebrow:not(:empty)::before{content:'';width:34px;height:1px;background:var(--accent);opacity:.7}
.sf-deck h1{font-family:var(--display);font-weight:700;font-size:118px;line-height:.95;letter-spacing:-.035em}
.sf-deck h2{font-family:var(--display);font-weight:600;font-size:62px;line-height:1.04;letter-spacing:-.028em;margin-bottom:22px}
.sf-deck h3{font-family:var(--display);font-weight:600;font-size:28px;line-height:1.18;letter-spacing:-.015em}
.sf-deck em{font-style:normal;color:var(--accent)}
.sf-deck strong{color:var(--fg);font-weight:600}
.sf-deck code{font-family:var(--mono);font-size:.86em;background:rgba(var(--tint),.07);border:1px solid var(--line-soft);padding:1px 8px;border-radius:4px}
.sf-deck .lede{font-size:25px;line-height:1.52;color:var(--fg-dim);font-weight:300;max-width:1080px;margin-bottom:34px}
.sf-deck p{font-size:19px;line-height:1.6;color:var(--fg-dim);font-weight:300}
.sf-head{display:flex;justify-content:space-between;align-items:baseline;padding-bottom:18px;
  border-bottom:1px solid var(--line-soft);margin-bottom:36px;min-height:38px}
.sf-head .tag{font-family:var(--mono);font-size:12.5px;letter-spacing:.22em;color:var(--fg-faint)}

/* cover */
.l-cover{justify-content:center;padding-left:116px}
.l-cover h1{font-size:136px;margin-top:22px}
.l-cover .sub{font-family:var(--display);font-size:38px;font-weight:400;color:var(--fg-dim);letter-spacing:-.02em;margin-top:18px}
.cover-meta{display:flex;gap:56px;margin-top:64px;padding-top:32px;border-top:1px solid var(--line)}
.cover-meta span{display:block;font-family:var(--mono);font-size:11.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--fg-faint);margin-bottom:9px}
.cover-meta b{font-family:var(--display);font-size:21px;font-weight:500;color:var(--fg)}
.badge{position:absolute;top:42px;right:100px;font-family:var(--mono);font-size:11.5px;letter-spacing:.24em;text-transform:uppercase;
  color:var(--accent);border:1px solid color-mix(in srgb,var(--accent) 40%,transparent);padding:7px 14px;border-radius:2px;
  background:color-mix(in srgb,var(--accent) 8%,transparent)}

/* section */
.l-section{justify-content:center}
.l-section .num{font-family:var(--display);font-weight:700;font-size:250px;line-height:.8;letter-spacing:-.06em;
  background:linear-gradient(180deg,var(--accent) 0%,rgba(var(--tint),.08) 135%);-webkit-background-clip:text;background-clip:text;color:transparent}
.l-section h2{font-size:86px;margin:10px 0 0}
.pill{margin-top:34px;display:inline-flex;align-self:flex-start;align-items:center;gap:13px;font-family:var(--mono);font-size:14px;letter-spacing:.1em;
  color:var(--fg-dim);border:1px solid var(--line);border-radius:100px;padding:11px 22px;background:rgba(var(--tint),.03)}
.pill i{width:7px;height:7px;border-radius:50%;background:var(--accent);box-shadow:0 0 0 4px color-mix(in srgb,var(--accent) 22%,transparent)}

/* statement */
.l-statement{justify-content:center}
.l-statement .big{font-family:var(--display);font-weight:600;font-size:88px;line-height:1.06;letter-spacing:-.035em;max-width:1340px;margin-top:26px}
.l-statement .after{margin-top:34px;font-size:24px;color:var(--fg-faint);font-weight:300;max-width:1000px}

/* points */
.points{list-style:none;display:flex;flex-direction:column}
.points li{display:flex;gap:28px;align-items:baseline;padding:20px 0;border-bottom:1px solid var(--line-soft)}
.points li:first-child{border-top:1px solid var(--line-soft)}
.points .k{font-family:var(--mono);font-size:12.5px;color:var(--accent);flex:none;width:30px;font-weight:500;opacity:.85}
.points b{font-family:var(--display);font-size:32px;font-weight:600;letter-spacing:-.018em;color:var(--fg);line-height:1.2;flex:none}
.points span{font-size:19px;color:var(--fg-faint);font-weight:300;line-height:1.4}
.points.many li{padding:14px 0}.points.many b{font-size:26px}
.bigpoints{list-style:none;display:flex;flex-direction:column;gap:28px}
.bigpoints b{font-family:var(--display);font-size:46px;font-weight:600;letter-spacing:-.025em;color:var(--fg);line-height:1.12;display:block}
.bigpoints span{display:block;font-size:19px;color:var(--fg-faint);font-weight:300;margin-top:8px}
.bullets{list-style:none;display:flex;flex-direction:column;gap:16px}
.bullets li{display:flex;gap:15px;align-items:flex-start;font-size:20px;line-height:1.5;color:var(--fg-dim);font-weight:300}
.bullets li::before{content:'';flex:none;width:6px;height:6px;border-radius:50%;background:var(--accent);margin-top:12px}

/* cards */
.grid{display:grid;gap:20px}
.g1{grid-template-columns:1fr}.g2{grid-template-columns:1fr 1fr}.g3{grid-template-columns:repeat(3,1fr)}.g4{grid-template-columns:repeat(4,1fr)}
.card{border:1px solid var(--line-soft);border-radius:12px;background:linear-gradient(165deg,rgba(var(--tint),.05),rgba(var(--tint),.012));
  padding:26px 28px;position:relative;overflow:hidden}
.card::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--accent)}
.card .kt{font-family:var(--mono);font-size:10.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--accent);display:block;margin-bottom:12px}
.card h3{margin-bottom:10px}.card p{font-size:17px;line-height:1.55}
.g4 .card{padding:22px 23px}.g4 .card h3{font-size:22px}.g4 .card p{font-size:15.5px}

/* images */
.sf-deck figure{position:relative;border-radius:12px;overflow:hidden;border:1px solid var(--line);background:rgba(var(--tint),.03);
  box-shadow:0 24px 60px rgba(0,0,0,.45);min-height:0}
.sf-deck figure img{display:block;width:100%;height:100%;object-fit:cover}
.sf-deck figure.contain img{object-fit:contain}
.sf-deck figcaption{position:absolute;left:0;right:0;bottom:0;padding:28px 20px 13px;font-family:var(--mono);font-size:11.5px;
  letter-spacing:.16em;text-transform:uppercase;color:rgba(255,255,255,.9);background:linear-gradient(180deg,transparent,rgba(0,0,0,.85))}
.ph{width:100%;height:100%;display:grid;place-items:center;font-family:var(--mono);font-size:14px;letter-spacing:.18em;
  text-transform:uppercase;color:var(--fg-faint);background:repeating-linear-gradient(135deg,rgba(var(--tint),.03) 0 12px,transparent 12px 24px)}
.l-image figure.hero{flex:1}
.split{display:grid;grid-template-columns:1fr 1fr;gap:60px;flex:1;min-height:0;align-items:stretch}
.split.left{grid-template-columns:1fr 1fr}.split.left .txt{order:2}
.split .txt{display:flex;flex-direction:column;justify-content:center}
.split .txt .lede{font-size:23px}

/* quote */
.l-quote{justify-content:center;align-items:center;text-align:center;padding:100px 160px}
.qmark{font-family:var(--display);font-size:220px;line-height:.6;color:var(--accent);height:110px;opacity:.9}
.l-quote blockquote{font-family:var(--display);font-size:60px;font-weight:500;line-height:1.16;letter-spacing:-.025em;max-width:1240px}
.l-quote cite{display:block;margin-top:40px;font-style:normal;font-family:var(--mono);font-size:15px;letter-spacing:.2em;text-transform:uppercase;color:var(--fg-faint)}

/* stats */
.stats{display:grid;gap:22px;margin-top:10px}
.stat{border:1px solid var(--line-soft);border-radius:14px;padding:34px 30px;background:linear-gradient(165deg,rgba(var(--tint),.05),rgba(var(--tint),.01))}
.stat .n{font-family:var(--display);font-weight:700;font-size:96px;line-height:1;letter-spacing:-.05em;
  background:linear-gradient(180deg,var(--fg) 20%,var(--accent) 160%);-webkit-background-clip:text;background-clip:text;color:transparent}
.stat .n i{font-style:normal;font-size:.5em;margin-left:4px;color:var(--accent);-webkit-text-fill-color:var(--accent)}
.stat .lbl{margin-top:16px;font-size:18px;color:var(--fg-dim);font-weight:300;line-height:1.45}

/* timeline */
.tl{list-style:none;position:relative;padding-left:168px}
.tl::before{content:'';position:absolute;left:137px;top:8px;bottom:8px;width:1px;background:linear-gradient(180deg,transparent,var(--line) 8%,var(--line) 92%,transparent)}
.tl li{position:relative;padding:0 0 24px}.tl li:last-child{padding-bottom:0}
.tl .time{position:absolute;left:-168px;top:1px;width:116px;text-align:right;font-family:var(--mono);font-size:15px;color:var(--accent);line-height:1.4}
.tl .time small{display:block;font-size:11px;color:var(--fg-faint);letter-spacing:.14em;text-transform:uppercase;margin-top:3px}
.tl .node{position:absolute;left:-36px;top:7px;width:9px;height:9px;border-radius:50%;background:var(--ink);border:1.5px solid var(--accent);
  box-shadow:0 0 0 4px color-mix(in srgb,var(--accent) 14%,transparent)}
.tl li.hot .node{background:var(--accent);box-shadow:0 0 0 5px color-mix(in srgb,var(--accent) 22%,transparent),0 0 18px var(--accent)}
.tl b{display:block;font-family:var(--display);font-size:22px;font-weight:500;color:var(--fg);margin-bottom:5px}
.tl p{font-size:17px;line-height:1.48}

/* compare */
.yesno{display:grid;grid-template-columns:1fr 1fr;gap:22px}
.yesno .col{border:1px solid var(--line-soft);border-radius:12px;padding:28px 30px}
.yesno .ok{--c:var(--good);border-color:color-mix(in srgb,var(--good) 30%,transparent);background:linear-gradient(165deg,color-mix(in srgb,var(--good) 10%,transparent),transparent)}
.yesno .no{--c:var(--bad);border-color:color-mix(in srgb,var(--bad) 32%,transparent);background:linear-gradient(165deg,color-mix(in srgb,var(--bad) 11%,transparent),transparent)}
.yesno h3{font-size:24px;margin-bottom:16px;display:flex;align-items:center;gap:12px}
.yesno h3 i{font-style:normal;font-family:var(--mono);color:var(--c)}
.yesno ul{list-style:none}
.yesno li{display:flex;gap:12px;padding:9px 0;font-size:18px;line-height:1.45;color:var(--fg-dim);font-weight:300}
.yesno li::before{content:'';flex:none;width:6px;height:6px;border-radius:50%;margin-top:10px;background:var(--c)}

/* player HUD */
.sf-player{position:fixed;inset:0;z-index:1000}
.sf-hud{position:absolute;left:0;right:0;bottom:0;z-index:10;display:flex;align-items:center;gap:22px;padding:18px 30px;
  font-family:var(--mono);font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:var(--fg-faint);transition:opacity .4s}
.sf-hud .sec{flex:1;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.sf-hud .cnt b{color:var(--fg);font-weight:500}
.sf-hud button{all:unset;cursor:pointer;width:34px;height:34px;display:grid;place-items:center;border:1px solid var(--line);border-radius:50%;
  color:var(--fg-dim);font-size:15px;letter-spacing:0;transition:all .2s}
.sf-hud button:hover{color:var(--fg);border-color:var(--accent)}
.sf-bar{position:absolute;left:0;bottom:0;height:2px;background:var(--accent);z-index:11;transition:width .7s var(--ease),background .8s;
  box-shadow:0 0 12px var(--accent)}
.sf-player.idle{cursor:none}.sf-player.idle .sf-hud{opacity:0}
.sf-player[data-hud=off] .sf-hud{display:none}
.sf-index{position:absolute;inset:0;z-index:20;background:color-mix(in srgb,var(--ink) 92%,transparent);backdrop-filter:blur(14px);
  padding:70px 100px;opacity:0;pointer-events:none;transition:opacity .35s;overflow:auto}
.sf-index.open{opacity:1;pointer-events:auto}
.sf-index h4{font-family:var(--mono);font-size:13px;letter-spacing:.24em;text-transform:uppercase;color:var(--accent);margin-bottom:28px}
.sf-index ol{columns:2;column-gap:64px;list-style:none}
.sf-index li{break-inside:avoid;display:flex;gap:18px;align-items:baseline;padding:12px 0;border-bottom:1px solid var(--line-soft);cursor:pointer;
  font-family:var(--display);font-size:21px;color:var(--fg-dim);transition:color .2s,padding .2s}
.sf-index li:hover{color:var(--fg);padding-left:8px}.sf-index li.cur{color:var(--accent)}
.sf-index li span{font-family:var(--mono);font-size:12px;color:var(--fg-faint)}
.sf-notes{position:absolute;left:50%;bottom:70px;transform:translate(-50%,20px);z-index:15;max-width:900px;width:calc(100% - 60px);
  padding:20px 26px;border-radius:12px;border:1px solid var(--line);background:color-mix(in srgb,var(--ink) 90%,transparent);backdrop-filter:blur(12px);
  font-size:18px;line-height:1.55;color:var(--fg-dim);opacity:0;pointer-events:none;transition:opacity .3s,transform .3s;white-space:pre-wrap;user-select:text}
.sf-notes.open{opacity:1;transform:translate(-50%,0)}
.sf-black{position:absolute;inset:0;z-index:30;background:#000;opacity:0;pointer-events:none;transition:opacity .4s}
.sf-black.on{opacity:1;pointer-events:auto}
.sf-hint{position:absolute;top:22px;left:50%;transform:translateX(-50%);z-index:12;font-family:var(--mono);font-size:11.5px;letter-spacing:.14em;
  color:var(--fg-faint);border:1px solid var(--line);padding:8px 16px;border-radius:100px;background:color-mix(in srgb,var(--ink) 80%,transparent);transition:opacity .8s}
.sf-hint.gone{opacity:0}
`;
