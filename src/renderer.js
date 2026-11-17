/* Mars renderer: the dog, the moods and the daily rhythm. Pure rules live in logic.js. */
(function () {
  'use strict';
  const L = window.MarsLogic;
  const api = window.mars;
  const stage = document.getElementById('stage');
  const tpl = document.getElementById('dogTpl');
  const params = new URLSearchParams(location.search);

  const rand = (a, b) => a + Math.random() * (b - a);
  const HOME_X = 24;
  const DANCES = ['dance', 'dance2', 'dance3', 'dance4', 'dance5', 'dance6'];

  /* ---------------- snapshot sheet (npm run snapshots) ---------------- */
  if (params.has('snap')) {
    document.body.classList.add('snap');
    const cells = [
      ['neutral', 'idle'], ['happy', 'idle'], ['sad', 'idle'], ['angry', 'idle'], ['sleepy', 'idle'],
      ['surprised', 'idle'], ['love', 'idle'], ['happy', 'dance'], ['happy', 'dance2'], ['happy', 'dance3'], ['happy', 'dance4'], ['happy', 'dance5'], ['happy', 'dance6'], ['neutral', 'read'], ['happy', 'game'],
      ['sleepy', 'sleep'], ['happy', 'wave'], ['sad', 'sigh'], ['angry', 'shake'], ['neutral', 'look'],
      ['happy', 'talk'], ['sad', 'hug'], ['angry', 'game'], ['surprised', 'jump'], ['neutral', 'blink'], ['neutral', 'laptop'], ['happy', 'laptop'],
      ['grumpy', 'idle'], ['grumpy', 'laptop'], ['grumpy', 'talk'], ['neutral', 'cave'],
      ['happy', 'toy'], ['neutral', 'bone'], ['love', 'hug'], ['neutral', 'walk'], ['neutral', 'sniff'],
      ['happy', 'sing'],
    ];
    for (const [emo, act] of cells) {
      const cell = document.createElement('div'); cell.className = 'cell';
      const lbl = document.createElement('div'); lbl.className = 'lbl'; lbl.textContent = `${emo} / ${act}`;
      if (act === 'cave') { cell.append(lbl, document.getElementById('caveTpl').content.firstElementChild.cloneNode(true)); stage.append(cell); continue; }
      const svg = tpl.content.firstElementChild.cloneNode(true);
      svg.dataset.emo = emo;
      if (act === 'walk' || act === 'sniff') { const w = document.createElement('div'); w.className = 'mars walking' + (act === 'sniff' ? ' sniffing' : ''); w.style.cssText = 'position:absolute;left:10px;top:18px'; w.append(svg); cell.append(lbl, w); stage.append(cell); continue; }
      if (act === 'talk') svg.classList.add('talking'); else if (act === 'blink') svg.classList.add('blink');
      else svg.dataset.act = act;
      cell.append(lbl, svg); stage.append(cell);
    }
    return;
  }

  /* ---------------- state ---------------- */
  const S = {
    x: HOME_X, y: 4, homeX: HOME_X, homeY: 4, dayMood: 'normal', dayMoodDay: '', inCave: false, homeAnim: null, mood: new L.Mood(), sleeping: false, awakeUntil: 0, dragging: false, bubbleOpen: false,
    lastInteract: Date.now(), lonely: false, lastTick: Date.now(), nextChatter: Date.now() + rand(20, 40) * 60000,
    data: {}, lang: 'en', quietUntil: 0, hidden: false, ai: false, cat: 'other', mimicAct: null, pend: { cat: 'other', n: 0 }, sulk: false, token: 0, walkId: 0,
  };
  const pokes = new L.PokeTracker();

  /* ---------------- build the dog ---------------- */
  const root = document.createElement('div'); root.className = 'mars';
  const flip = document.createElement('div'); flip.className = 'flip';
  const svg = tpl.content.firstElementChild.cloneNode(true);
  flip.append(svg);
  const hit = document.createElement('div'); hit.className = 'hit';
  const bubble = document.createElement('div'); bubble.className = 'bubble';
  root.append(flip, hit, bubble); stage.append(root);
  const cave = document.getElementById('caveTpl').content.firstElementChild.cloneNode(true);
  stage.prepend(cave); // behind the dog
  function place() { root.style.left = S.x + 'px'; root.style.bottom = S.y + 'px'; }
  place();

  const waitFor = (ms) => new Promise((r) => { const t = setTimeout(r, ms); S._wake = () => { clearTimeout(t); r(); }; });
  const baseEmo = () => (S.sleeping ? 'sleepy' : S.mimicAct === 'sing' ? 'happy' : S.mood.emotion()); // music lifts any mood
  let emoTimer = null;
  function setEmo(e) { svg.dataset.emo = e; }
  function emote(e, ms) {
    setEmo(e); clearTimeout(emoTimer);
    if (ms) emoTimer = setTimeout(() => setEmo(baseEmo()), ms);
  }
  function setAct(a) { a = a || S.mimicAct; if (a) svg.dataset.act = a; else delete svg.dataset.act; }
  let sniffing = false; // sniffing for an answer: mirroring waits until it is done
  /** While the model thinks, Mars sniffs the floor for an answer: nose down, slowly back and forth near the spot. */
  async function sniffFor(p) {
    let done = false;
    const x0 = S.x, y0 = S.y;
    const result = Promise.resolve(p).catch(() => null).finally(() => { done = true; S.walkId++; });
    sniffing = true;
    delete svg.dataset.act; // nose to the floor: put the laptop (or book, game, mic) away for now
    root.classList.add('sniffing');
    (async () => {
      let dir = Math.random() < 0.5 ? -1 : 1;
      while (!done && !S.dragging) {
        await moveTo(x0 + dir * rand(25, 60), y0, 32);
        dir = -dir;
        if (!done) await pause(rand(300, 900));
      }
    })();
    try { return await result; } finally { sniffing = false; root.classList.remove('sniffing', 'walking'); face(1); setAct(null); } // back to what Mars was mirroring
  }
  /** Happy hops: jumps with little sideways bounces. Stops early when something else takes over. */
  async function hopAround(n, emo = 'happy') {
    const token = ++S.token;
    emote(emo, 0);
    const bob = svg.querySelector('.bobber');
    for (let i = 0; i < n && token === S.token && !S.dragging; i++) {
      delete svg.dataset.act; getComputedStyle(bob).animationName; // restart the jump animation
      setAct('jump');
      const dx = (i % 2 ? -1 : 1) * rand(25, 65);
      await Promise.all([moveTo(S.x + dx, S.y, 120, { noTrot: true }), pause(680)]);
    }
    if (token === S.token) { setAct(null); setEmo(baseEmo()); face(1); }
  }
  function interrupt() { S.token++; S.walkId++; root.classList.remove('walking', 'sniffing'); if (S._wake) S._wake(); }
  const maxX = () => Math.max(HOME_X, window.innerWidth - L.DOG_W - 8);
  const maxY = () => Math.max(0, window.innerHeight - L.DOG_H - 8);
  const clampX = (x) => Math.max(0, Math.min(maxX(), x));
  const clampY = (y) => Math.max(0, Math.min(maxY(), y));
  const period = () => L.periodOf(new Date());
  const ctx = () => ({ name: S.data.name, period: period(), emotion: svg.dataset.emo, lang: S.lang, dayMood: S.dayMood });
  const T = (k, v) => L.tr(S.lang, k, v);
  const isQuiet = () => Date.now() < S.quietUntil;

  /* ---------------- movement ---------------- */
  function face(dir) { root.classList.toggle('face-left', dir < 0); }
  /** Trots to (tx, ty) in a straight line; ty = distance from the bottom. Resolves early when interrupted. */
  function moveTo(tx, ty, speed = 85, opts = {}) {
    return new Promise((resolve) => {
      const id = ++S.walkId;
      if (!opts.free) { tx = clampX(tx); ty = clampY(ty); }
      if (Math.hypot(tx - S.x, ty - S.y) < 4) return resolve();
      if (Math.abs(tx - S.x) > 2) face(tx - S.x);
      if (!opts.noTrot) root.classList.add('walking');
      let last = performance.now();
      const step = (now) => {
        if (id !== S.walkId) return resolve();
        const dt = Math.min(0.05, (now - last) / 1000); last = now;
        const dx = tx - S.x, dy = ty - S.y, d = Math.hypot(dx, dy), move = speed * dt;
        if (d <= move) { S.x = tx; S.y = ty; place(); root.classList.remove('walking'); if (!opts.keepFace) face(1); return resolve(); }
        S.x += dx / d * move; S.y += dy / d * move; place();
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }
  const walkTo = (x, speed) => moveTo(x, S.homeY, speed);
  const pause = (ms) => new Promise((r) => setTimeout(r, ms));

  /* ---------------- speech bubble ---------------- */
  let bubbleTimer = null, bubbleResolve = null, talkTimer = null, sayId = 0;
  function closeBubble(value = null) {
    clearTimeout(bubbleTimer);
    bubble.classList.remove('show');
    S.bubbleOpen = false;
    const r = bubbleResolve; bubbleResolve = null;
    if (r) r(value);
  }
  function placeBubble() {
    bubble.style.marginLeft = '0px'; bubble.style.setProperty('--tail', '50%');
    bubble.classList.remove('below');
    if (bubble.getBoundingClientRect().top < 8) bubble.classList.add('below'); // living near the top: talk downwards
    const r = bubble.getBoundingClientRect();
    let shift = 0;
    if (r.left < 8) shift = 8 - r.left;
    else if (r.right > window.innerWidth - 8) shift = window.innerWidth - 8 - r.right;
    bubble.style.marginLeft = shift + 'px';
    bubble.style.setProperty('--tail', `calc(50% - ${shift}px)`);
  }
  /** opts: {emotion, ttl, choices:[{label,value}], input:true, placeholder, talk:true} -> Promise(value | null) */
  function say(text, opts = {}) {
    closeBubble(null);
    const mine = ++sayId;
    return new Promise((resolve) => {
      bubbleResolve = resolve;
      bubble.textContent = '';
      const p = document.createElement('div'); p.textContent = text; bubble.append(p);
      const interactive = !!(opts.choices || opts.input);
      if (opts.choices) {
        const row = document.createElement('div'); row.className = 'row';
        for (const c of opts.choices) {
          const b = document.createElement('button'); b.textContent = c.label;
          b.addEventListener('click', () => closeBubble(c.value));
          row.append(b);
        }
        bubble.append(row);
      }
      if (opts.input) {
        const row = document.createElement('div'); row.className = 'row';
        const inp = document.createElement('input'); inp.type = 'text'; inp.maxLength = 300; inp.placeholder = opts.placeholder || T('sayPh');
        const go = document.createElement('button'); go.textContent = T('send');
        const submit = () => { const v = inp.value.trim(); closeBubble(v || null); };
        inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') closeBubble(null); e.stopPropagation(); });
        go.addEventListener('click', submit);
        row.append(inp, go); bubble.append(row);
        setTimeout(() => { api.focus(); inp.focus(); }, 60);
      }
      if (interactive) {
        const x = document.createElement('button'); x.className = 'x'; x.textContent = '×'; x.title = T('close');
        x.addEventListener('click', () => closeBubble(null)); bubble.append(x);
      }
      S.bubbleOpen = true;
      bubble.classList.add('show'); placeBubble();
      if (opts.emotion) emote(opts.emotion, opts.emotionMs || (interactive ? 0 : 6000));
      // talk animation
      clearTimeout(talkTimer);
      if (opts.talk !== false) { svg.classList.add('talking'); talkTimer = setTimeout(() => svg.classList.remove('talking'), Math.min(4500, 400 + text.length * 45)); }
      const ttl = opts.ttl || (interactive ? 90000 : Math.max(5000, 1800 + text.length * 65));
      bubbleTimer = setTimeout(() => closeBubble(null), ttl);
    }).finally(() => { if (mine === sayId) svg.classList.remove('talking'); });
  }

  /* ---------------- activities ---------------- */
  async function doActivity(name) {
    const token = ++S.token;
    const alive = () => token === S.token && !S.sleeping && !S.dragging;
    const hold = async (act, emo, ms) => { setAct(act); if (emo) emote(emo, 0); await waitFor(ms); if (token === S.token) { setAct(null); setEmo(baseEmo()); } };
    switch (name) {
      case 'wander': await moveTo(S.homeX + rand(-220, 320), S.homeY + rand(-20, 30)); if (alive()) await waitFor(rand(1500, 4000)); break;
      case 'roam': await moveTo(rand(8, maxX()), S.homeY + rand(-40, 40)); if (alive()) await waitFor(rand(4000, 9000)); if (alive()) await moveTo(S.homeX + rand(0, 200), S.homeY); break;
      case 'read': await hold('read', null, rand(25000, 45000)); break;
      case 'game':
        await hold('game', null, rand(22000, 40000));
        if (alive()) {
          if (Math.random() < 0.55) { emote('happy', 4000); setAct('jump'); await waitFor(900); } // won
          else { emote('angry', 3000); setAct('shake'); await waitFor(1800); emote('surprised', 1200); await waitFor(1300); } // lost
          if (token === S.token) { setAct(null); setEmo(baseEmo()); }
        }
        break;
      case 'look': await hold('look', null, 6000); break;
      case 'dance': await hold(L.pick(DANCES), 'happy', 8000); break;
      case 'sigh': await hold('sigh', 'sad', 8000); break;
      case 'toy': await hold('toy', 'happy', rand(15000, 28000)); break;
      case 'bone': await hold('bone', null, rand(20000, 35000)); break;
      case 'sniff':
        root.classList.add('sniffing');
        await moveTo(S.homeX + rand(-200, 260), S.homeY + rand(-15, 20), 45);
        if (alive()) { await waitFor(rand(1500, 3000)); }
        root.classList.remove('sniffing');
        break;
    }
    root.classList.remove('walking', 'sniffing');
  }

  let idleBusy = false;
  async function idleLoop() {
    for (;;) {
      await new Promise((r) => setTimeout(r, rand(12000, 35000)));
      if (S.sleeping || S.dragging || S.bubbleOpen || idleBusy || S.mimicAct) continue;
      idleBusy = true;
      try { await doActivity(L.pickActivity(Math.random(), { mood: S.mood.value })); } catch { /* keep living */ }
      idleBusy = false;
      if (!S.sleeping) { setAct(null); setEmo(baseEmo()); }
    }
  }

  /* ---------------- the user is away: look for food ---------------- */
  let hunting = false;
  /** Roams the whole screen, sniffing for food, until the user is back or something else takes over (chat, poke, drag, bedtime, kennel). */
  async function foodHunt() {
    hunting = true; interrupt(); idleBusy = true;
    const token = S.token;
    delete svg.dataset.act; // not mirroring the user while they are away
    setEmo(baseEmo());
    try {
      while (hunting && token === S.token && !S.sleeping && !S.dragging) {
        const spot = L.huntSpot(Math.random(), Math.random(), maxX(), maxY());
        root.classList.add('sniffing');
        await moveTo(spot.x, spot.y, 55);
        if (!hunting || token !== S.token) break;
        await waitFor(rand(1200, 2600)); // sniff sniff
        root.classList.remove('sniffing');
        if (hunting && token === S.token && Math.random() < L.CRUMB_CHANCE) { // found a crumb!
          emote('happy', 0); setAct('jump'); await waitFor(700);
          if (token === S.token) { setAct('bone'); await waitFor(rand(2500, 4000)); }
          if (token === S.token) { delete svg.dataset.act; setEmo(baseEmo()); }
        }
      }
    } finally {
      if (token === S.token) root.classList.remove('sniffing', 'walking'); // only tidy up if the hunt still owns the dog
      if (token !== S.token && hunting) { // something else took over; it owns idleBusy from here (bedtime does not, so release it)
        hunting = false;
        if (S.sleeping) idleBusy = false;
      }
    }
  }
  /** The user is back: stop sniffing and trot home, glad to see them. */
  async function endHunt() {
    hunting = false; interrupt();
    const token = S.token;
    root.classList.remove('sniffing');
    delete svg.dataset.act; // e.g. still chewing a found crumb
    emote('happy', 3000);
    await moveTo(S.homeX, S.homeY, 110);
    if (token === S.token) { idleBusy = false; setAct(null); setEmo(baseEmo()); } // else whoever interrupted the trot home takes over
  }
  async function huntLoop() {
    for (;;) {
      await pause(5000);
      let idleSec = 0;
      try { idleSec = await api.idleSeconds(); } catch { continue; }
      if (hunting) { if (L.userBack(idleSec)) await endHunt(); continue; }
      if (S.bubbleOpen || S.dragging || idleBusy) continue;
      if (L.wantsFoodHunt({ idleSec, sleeping: S.sleeping, hidden: S.hidden, inCave: S.inCave, cat: S.cat })) foodHunt();
    }
  }

  /* ---------------- sleep ---------------- */
  async function goToSleep(announce) {
    if (S.sleeping) return;
    interrupt();
    S.sleeping = true;
    await walkTo(S.homeX + 20, 120);
    setAct('sleep'); emote('sleepy', 0);
    if (announce) await say(T('sleepNote'), { emotion: 'sleepy', ttl: 6000 });
    setAct('sleep'); setEmo('sleepy');
  }
  function wakeUp(text) {
    S.sleeping = false; setAct(null); setEmo(baseEmo());
    if (text) say(text, { emotion: 'happy' });
  }

  /* ---------------- conversations ---------------- */
  async function askName() {
    const n = (S.data.nameAsked || 0) + 1;
    S.data = await api.setStore({ nameAsked: n });
    setAct('wave');
    const name = await say(T('askName'), { emotion: 'happy', input: true, placeholder: T('namePh') });
    setAct(null);
    if (name) {
      const clean = name.replace(/[<>]/g, '').slice(0, 30);
      S.data = await api.setStore({ name: clean });
      S.mood.adjust(20);
      await say(T('nice', { name: clean }), { emotion: 'love', ttl: 9000 });
    } else {
      await say(T('nameLater'), { emotion: 'neutral', ttl: 4000 });
    }
  }

  async function askDay() {
    const today = L.dayKey(new Date());
    S.data = await api.setStore({ askedDay: today });
    const v = await say(L.greeting('evening', S.data.name, null, S.lang) + T('howDay'), {
      emotion: 'happy', input: true, placeholder: T('dayPh'), ttl: 60000,
      choices: [{ label: T('rGreat'), value: 'great' }, { label: T('rOkay'), value: 'okay' }, { label: T('rBad'), value: 'bad' }] });
    if (!v) return;
    S.lastInteract = Date.now();
    const rating = ['great', 'okay', 'bad'].includes(v) ? v : null; // a typed answer is free text
    const r = L.dayReaction(rating || 'okay', S.lang);
    let text = r.text, emotion = r.emotion;
    if (rating) { S.mood.adjust(r.mood); if (r.dance) setAct(L.pick(DANCES)); if (r.hug) setAct('hug'); }
    const scripted = () => { if (!rating) { const f = L.fallbackReply(v, S.lang); text = f.text; emotion = f.emotion; } };
    if (S.ai) {
      // The model writes the reaction itself and can use what Mars has learned (e.g. what you did today).
      say('...', { emotion: 'neutral', ttl: 95000, talk: false });
      const prompt = rating ? `Your friend just answered your evening question "How was your day?" with: ${rating}. React in your own words, warmly, and if you know something relevant about their day, mention it lightly.` : v;
      const reply = await sniffFor(api.chat(prompt, { ...ctx(), kind: rating ? 'checkin' : undefined }));
      if (reply && reply.text) {
        text = reply.text; emotion = reply.emotion;
        if (!rating) S.mood.adjust({ happy: 6, love: 10, sad: -6, angry: -4 }[reply.emotion] || 0);
      } else scripted();
    } else scripted();
    const more = await say(text, { emotion, choices: [{ label: T('tellMore'), value: 'chat' }, { label: T('thanks'), value: null }], ttl: 20000, emotionMs: 8000 });
    setAct(null);
    if (more === 'chat') await chatLoop(T('tellAll'));
  }

  async function greet(now) {
    const key = L.greetingKey(now), p = L.periodOf(now);
    S.data = await api.setStore({ greeted: key });
    if (!S.data.name && (S.data.nameAsked || 0) < 3) { await askName(); return; }
    if (p === 'evening') { setAct('wave'); await askDay(); setAct(null); return; }
    if (p === 'night') {
      await say(L.greeting('night', S.data.name, null, S.lang), { emotion: 'sleepy', ttl: 8000 });
      if (L.shouldSleep(now)) await goToSleep(false);
      return;
    }
    if (S.dayMood === 'bad') { // a bad day: still says hi, just without the big wave
      setAct('sigh'); await say(L.greeting(p, S.data.name, null, S.lang) + T('badDay'), { emotion: 'grumpy', ttl: 8000, emotionMs: 8000 }); setAct(null); return;
    }
    setAct('wave'); setTimeout(() => { if (svg.dataset.act === 'wave') setAct(null); }, 2800);
    await say(L.greeting(p, S.data.name, null, S.lang), { emotion: 'happy', ttl: 7000 });
  }

  async function chatLoop(first) {
    interrupt(); idleBusy = true;
    let msg = first || (S.ai ? T('chatAsk') : T('chatNoAi'));
    let emotion = 'happy';
    try {
      for (;;) {
        const text = await say(msg, { emotion, input: true, placeholder: T('chatPh') });
        if (!text) break;
        S.lastInteract = Date.now();
        const pet = L.callsPetName(text);
        say('...', { emotion: pet ? 'happy' : 'neutral', ttl: 95000, talk: false });
        const answer = S.ai ? api.chat(text, ctx()) : null; // ask right away; hops and sniffing pass the time
        if (pet) await hopAround(5, 'love');
        let reply = answer ? await sniffFor(answer) : null;
        if (!reply || !reply.text) reply = pet ? { emotion: 'love', text: T('petName') } : L.fallbackReply(text, S.lang);
        S.mood.adjust({ happy: 6, love: 10, sad: -6, angry: -4 }[reply.emotion] || 0);
        msg = reply.text; emotion = reply.emotion;
      }
    } finally { idleBusy = false; setEmo(baseEmo()); }
  }

  /* ---------------- interactions ---------------- */
  function noteInteraction() {
    S.lastInteract = Date.now();
    if (S.lonely) { S.lonely = false; S.mood.adjust(25); emote('love', 4000); say(T('lonelyBack'), { ttl: 4500 }); return true; }
    return false;
  }

  async function onPoke() {
    if (S.sleeping && Date.now() >= S.awakeUntil) {
      S.awakeUntil = Date.now() + 90000;
      S.sleeping = false; interrupt(); setAct(null); emote('angry', 3500);
      say(T('pokeWake'), { emotion: 'angry', ttl: 4000 });
      setTimeout(() => { if (!S.bubbleOpen) emote('sleepy', 8000); }, 4200);
      return;
    }
    if (noteInteraction()) return;
    interrupt(); idleBusy = false;
    const lvl = pokes.register(Date.now());
    if (lvl === 'ok') {
      S.mood.adjust(4); emote('surprised', 500); setTimeout(() => emote('happy', 3000), 520);
      setAct('jump'); setTimeout(() => { if (svg.dataset.act === 'jump') setAct(null); }, 700);
      say(T('pokeOk'), { ttl: 2200, emotionMs: 2500 });
    } else if (lvl === 'annoyed') {
      S.mood.adjust(-10); emote('angry', 4000);
      say(T('pokeAnnoyed'), { emotion: 'angry', ttl: 2800, emotionMs: 4000 });
    } else {
      S.mood.adjust(-25); pokes.reset(); S.sulk = true;
      setAct('shake'); emote('angry', 12000);
      say(T('pokeAngry'), { emotion: 'angry', ttl: 3500, emotionMs: 12000 });
      setTimeout(() => { if (svg.dataset.act === 'shake') setAct(null); }, 2200);
      setTimeout(async () => {
        S.sulk = false; if (S.sleeping || S.bubbleOpen) return;
        const v = await say(T('sorry'), { emotion: 'sad', choices: [{ label: T('sorryYes'), value: 'yes' }, { label: T('sorryNo'), value: null }], ttl: 20000, emotionMs: 6000 });
        if (v === 'yes') { S.mood.adjust(40); setAct('jump'); await say(T('bestFriends'), { emotion: 'love', ttl: 3500 }); setAct(null); }
      }, 15000);
    }
  }

  async function setQuiet(min) {
    S.quietUntil = Date.now() + min * 60000;
    S.data = await api.setStore({ quietUntil: S.quietUntil });
    await say(T('quietOn', { t: T('q' + min) }), { emotion: 'neutral', ttl: 4000 });
  }
  const fantasy = {
    async howareyou() {
      const e = S.mood.emotion();
      const t = { happy: T('hGreat'), sad: T('hSad'), grumpy: T('hGrumpy'), neutral: T('hNeutral') }[e] || T('hNeutral');
      const v = await say(t, { emotion: e, choices: [{ label: T('chatBtn'), value: 'chat' }, { label: T('ok'), value: null }], ttl: 15000 });
      if (v === 'chat') await chatLoop(T('soChat'));
    },
    async know() {
      const m = await api.memorySummary();
      const t = !m.on ? T('knowOff')
        : m.text ? T('knowHas') + m.text
        : T('knowNone');
      await say(t.slice(0, 600), { emotion: m.text ? 'happy' : 'neutral', ttl: 20000 });
    },
    async lang() { S.data = await api.getStore(); S.lang = S.data.lang || 'en'; await say(T('langSet'), { emotion: 'happy', ttl: 4000 }); },
    async quiet30() { await setQuiet(30); },
    async quiet60() { await setQuiet(60); },
    async quiet120() { await setQuiet(120); },
    async quietOff() { S.quietUntil = 0; S.data = await api.setStore({ quietUntil: 0 }); await say(T('quietOff'), { emotion: 'happy', ttl: 3500 }); },
    async forgot() { await say(T('forgot'), { emotion: 'surprised', ttl: 6000 }); },
    async fact() { await say(T('facts'), { emotion: 'happy', ttl: 11000 }); },
    async dance() { interrupt(); idleBusy = true; await say(T('watch'), { emotion: 'happy', ttl: 1800 }); await doActivity('dance'); idleBusy = false; },
    async treat() {
      interrupt(); idleBusy = true; noteInteraction();
      S.mood.adjust(15); setAct('jump'); emote('love', 4500);
      await pause(650); setAct('wave');
      await say(T('treat'), { emotion: 'love', ttl: 4000, emotionMs: 4500 });
      setAct(null); idleBusy = false;
    },
    async chat() { if (!noteInteraction()) { /* fine */ } await chatLoop(); },
  };

  /* ---------------- input wiring ---------------- */
  let clickTimer = null, down = null;
  hit.addEventListener('mousedown', (e) => { if (e.button !== 0 || S.inCave) return; down = { x: e.clientX, y: e.clientY, sx: S.x, sy: S.y, moved: false }; });
  window.addEventListener('mousemove', (e) => {
    if (!down) return;
    const dx = e.clientX - down.x, dy = e.clientY - down.y;
    if (!down.moved && Math.hypot(dx, dy) > 5) { down.moved = true; S.dragging = true; interrupt(); idleBusy = true; root.classList.add('dragging'); emote('surprised', 0); closeBubble(null); }
    if (down.moved) { S.x = clampX(down.sx + dx); S.y = clampY(down.sy - dy); place(); }
  });
  window.addEventListener('mouseup', () => {
    if (!down) return;
    const moved = down.moved; down = null;
    if (moved) {
      S.dragging = false; idleBusy = false; root.classList.remove('dragging'); S.lastInteract = Date.now();
      S.homeX = Math.round(S.x); S.homeY = Math.round(S.y); // wherever you drop Mars becomes the new home spot
      api.setStore({ home: { x: S.homeX, y: S.homeY } }).then((d) => { S.data = d; });
      if (S.sleeping) { setAct('sleep'); setEmo('sleepy'); } // dropped while asleep: keep sleeping
      else { emote('happy', 2500); setAct('jump'); setTimeout(() => setAct(null), 700); }
    }
    else { clearTimeout(clickTimer); clickTimer = setTimeout(onPoke, 240); }
  });
  hit.addEventListener('dblclick', () => { clearTimeout(clickTimer); if (S.sleeping && Date.now() >= S.awakeUntil) { onPoke(); return; } fantasy.chat(); });
  hit.addEventListener('contextmenu', (e) => { e.preventDefault(); api.contextMenu(); });
  api.onMenu((id) => { if (S.sleeping && Date.now() >= S.awakeUntil) { S.awakeUntil = Date.now() + 90000; S.sleeping = false; setAct(null); setEmo(baseEmo()); } if (fantasy[id]) fantasy[id](); });
  /* ---- hiding: Mars trots into the kennel in the nearest bottom corner; showing: back out again ---- */
  function goHome() {
    if (S.inCave) return (S.homeAnim || Promise.resolve()).then(() => api.homeDone());
    S.inCave = true; S.hidden = true; interrupt(); idleBusy = true; closeBubble(null); down = null;
    S.dragging = false; root.classList.remove('dragging');
    S.homeAnim = (async () => {
      const side = L.caveSide(S.x, window.innerWidth);
      cave.classList.remove('left', 'right'); cave.classList.add(side, 'show');
      setAct(null); if (!S.sleeping) emote('happy', 0);
      await pause(350);
      // the body centre (120 px from the left of the box, 71 px up) onto the kennel door (126 px from the screen edge, 25 px up)
      const tx = side === 'left' ? 126 - 120 : window.innerWidth - 126 - 120, ty = 25 - 71;
      const dist = Math.hypot(tx - S.x, ty - S.y);
      await moveTo(tx, ty, Math.max(320, dist / 1.5), { free: true, keepFace: true });
      root.classList.add('in-cave');
      await pause(600);
      cave.classList.remove('show');
      await pause(450);
    })();
    return S.homeAnim.then(() => api.homeDone());
  }
  async function comeOut() {
    if (!S.inCave) return false;
    if (S.homeAnim) await S.homeAnim; // shown again while still walking in: finish that first
    S.homeAnim = null;
    const side = L.caveSide(S.x, window.innerWidth);
    cave.classList.remove('left', 'right'); cave.classList.add(side, 'show');
    await pause(450);
    root.classList.remove('in-cave');
    await pause(550);
    const dist = Math.hypot(S.homeX - S.x, S.homeY - S.y);
    await moveTo(S.homeX, S.homeY, Math.max(240, dist / 1.8));
    cave.classList.remove('show');
    S.inCave = false; idleBusy = false;
    if (S.sleeping) { setAct('sleep'); setEmo('sleepy'); } else { setAct(null); setEmo(baseEmo()); }
    return true;
  }
  api.onGoHome(goHome);
  api.onHidden(() => { S.hidden = true; });
  api.onShown(async () => {
    S.hidden = false;
    const away = Date.now() - S.lastTick > 120000;
    await comeOut();
    if (away && !S.sleeping) { emote('love', 4000); say(T('back'), { ttl: 4500 }); }
    S.lastTick = Date.now(); placeBubble();
  });

  /* ---- copy what the user is doing ---- */
  async function setCategory(cat) {
    S.cat = cat; S.mimicAct = L.MIMIC_ACT[cat] || null;
    if (S.sleeping || S.dragging || sniffing) return; // after sniffing, setAct(null) picks up the new mimic act
    interrupt(); idleBusy = false;
    if (S.mimicAct) {
      await walkTo(S.homeX + rand(0, 120));
      if (S.cat === cat && !S.sleeping) {
        setAct(S.mimicAct); setEmo(baseEmo());
        if (cat === 'game') emote('happy', 2500);
        if (cat === 'watch' && !isQuiet() && !S.bubbleOpen) say(T('sing'), { ttl: 2600, talk: false });
      }
    }
    else { setAct(null); setEmo(baseEmo()); }
  }
  api.onActivity((s) => {
    const cat = L.classifyApp(s.name, s.full, s.media);
    if (s.name === 'electron' || s.name === 'Mars' || s.name === 'mars') return; // our own window: no change
    if (cat === S.cat) { S.pend = { cat, n: 0 }; return; }
    S.pend = (S.pend && S.pend.cat === cat) ? { cat, n: S.pend.n + 1 } : { cat, n: 1 };
    if (S.pend.n >= (cat === 'other' ? 5 : 3)) { S.pend = { cat, n: 0 }; setCategory(cat); }
  });
  // While the user games, Mars has wins and fails too.
  setInterval(() => {
    if (S.cat !== 'game' || S.sleeping || S.bubbleOpen || S.dragging || S.inCave || Math.random() > 0.45) return;
    if (Math.random() < 0.55) { emote('happy', 3000); setAct('jump'); setTimeout(() => { if (svg.dataset.act === 'jump') setAct(null); }, 700); }
    else { emote('angry', 2500); setAct('shake'); setTimeout(() => { if (svg.dataset.act === 'shake') setAct(null); }, 1800); }
  }, 22000);

  // While a video plays Mars howls along; a short line now and then (rare, never in quiet mode).
  setInterval(() => {
    if (S.cat !== 'watch' || S.sleeping || S.bubbleOpen || S.dragging || S.inCave || S.hidden || isQuiet() || Math.random() > 0.12) return;
    say(T('sing'), { ttl: 2400, talk: false });
  }, 40000);

  // Click-through everywhere except the dog and an open bubble.
  let interactive = false;
  window.addEventListener('mousemove', (e) => {
    const on = !!(down || (e.target.closest && e.target.closest('.hit, .bubble.show')));
    if (on !== interactive) { interactive = on; api.ignoreMouse(!on); }
  });
  window.addEventListener('resize', () => {
    const h = L.clampPos({ x: S.homeX, y: S.homeY }, window.innerWidth, window.innerHeight); S.homeX = h.x; S.homeY = h.y;
    if (S.inCave) return;
    S.x = clampX(S.x); S.y = clampY(S.y); place();
  });

  // Blinking
  (function blinkLoop() {
    setTimeout(() => {
      if (!S.sleeping) { svg.classList.add('blink'); setTimeout(() => svg.classList.remove('blink'), 140); }
      blinkLoop();
    }, rand(2200, 6000));
  })();

  /* ---------------- the daily rhythm ---------------- */
  async function tick() {
    if (S.quietUntil && !isQuiet()) { S.quietUntil = 0; api.setStore({ quietUntil: 0 }); }
    if (S.hidden) return; // hidden from the tray: no greetings, chatter or sleep announcements nobody can see
    const now = new Date();
    S.lastTick = now.getTime();
    ensureDayMood(now);
    S.mood.decay(1);
    const swing = S.sleeping || S.inCave ? 0 : L.moodSwing(S.dayMood);
    if (swing) { // a mood swing: sometimes Mars mutters about it, briefly, never in quiet mode or during a game
      S.mood.adjust(swing);
      if (!S.bubbleOpen && !idleBusy && !isQuiet() && S.cat !== 'game' && Math.random() < 0.35) say(T(swing > 0 ? 'swingUp' : 'swingDown'), { emotion: swing > 0 ? 'happy' : 'grumpy', ttl: 3500, emotionMs: 5000 });
    }
    if (!S.sulk && !S.bubbleOpen && !S.sleeping && !svg.classList.contains('talking') && !svg.dataset.act) setEmo(baseEmo());
    if (S.dragging) return;

    const wantSleep = L.shouldSleep(now);
    if (!wantSleep && S.sleeping) { wakeUp(null); S.data = await api.setStore({ greeted: '' }); }
    if (wantSleep && !S.sleeping && now.getTime() >= S.awakeUntil && !S.bubbleOpen) {
      const key = L.greetingKey(now) + '-slept';
      const announce = S.data.slept !== key && !isQuiet(); S.data = await api.setStore({ slept: key });
      await goToSleep(announce); return;
    }
    if (S.sleeping || S.bubbleOpen || idleBusy) return;
    if (S.cat === 'game') return; // never interrupt a game with greetings or chatter; they wait

    const key = L.greetingKey(now);
    if (S.data.greeted !== key && !isQuiet()) { idleBusy = true; interrupt(); try { await greet(now); } finally { idleBusy = false; setAct(null); setEmo(baseEmo()); } return; }

    if (!S.lonely && !isQuiet() && now.getTime() - S.lastInteract > 2 * 3600 * 1000) {
      S.lonely = true; S.mood.adjust(-40); emote('sad', 0);
      say(T('lonelyNote'), { emotion: 'sad', ttl: 8000, emotionMs: 20000 });
      return;
    }
    if (now.getTime() > S.nextChatter) {
      S.nextChatter = now.getTime() + rand(25, 55) * 60000;
      if (Math.random() < 0.7 && !isQuiet()) say(T('chatter'), { ttl: 7000, emotion: S.mood.emotion() === 'sad' ? 'sad' : 'happy', emotionMs: 5000 });
    }
  }

  /** One mood per day, kept in the store so a restart does not reroll it. */
  function ensureDayMood(now) {
    const day = L.dayKey(now);
    if (S.dayMoodDay === day) return;
    let dm = S.data.dayMood;
    if (!dm || dm.day !== day || !(dm.kind in L.DAY_MOOD_BASE)) {
      dm = { day, kind: L.pickDayMood().kind };
      api.setStore({ dayMood: dm }).then((d) => { S.data = d; });
    }
    S.dayMoodDay = day; S.dayMood = dm.kind; S.mood.base = L.DAY_MOOD_BASE[dm.kind];
  }

  (async function boot() {
    S.data = await api.getStore();
    S.lang = S.data.lang || 'en'; S.quietUntil = S.data.quietUntil || 0;
    const h = L.clampPos(S.data.home, window.innerWidth, window.innerHeight);
    S.homeX = S.x = h.x; S.homeY = S.y = h.y; place();
    ensureDayMood(new Date()); S.mood.value = S.mood.base; setEmo(baseEmo());
    S.ai = (await api.aiStatus()).available;
    // Happy to see you: hops at every start, a real party (with hearts) the very first time.
    const firstEver = !S.data.metAt;
    if (firstEver) S.data = await api.setStore({ metAt: new Date().toISOString() });
    await pause(700);
    idleBusy = true;
    try { await hopAround(L.welcomeHops(firstEver), firstEver ? 'love' : 'happy'); } finally { idleBusy = false; }
    setTimeout(tick, 1500);
    setInterval(tick, 20000);
    idleLoop();
    huntLoop();
    if (L.shouldSleep(new Date())) { /* tick handles the nap after the greeting */ }
  })();
})();
