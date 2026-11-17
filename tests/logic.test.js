'use strict';
const test = require('node:test');
const assert = require('node:assert');
const L = require('../src/logic');
const { createAI } = require('../main/ai');
const { readEnv } = require('../main/store');

const at = (h, m = 0) => new Date(2026, 10, 16, h, m);

test('periodOf maps hours to periods', () => {
  assert.strictEqual(L.periodOf(at(5)), 'morning');
  assert.strictEqual(L.periodOf(at(11, 59)), 'morning');
  assert.strictEqual(L.periodOf(at(12)), 'afternoon');
  assert.strictEqual(L.periodOf(at(18)), 'evening');
  assert.strictEqual(L.periodOf(at(22)), 'night');
  assert.strictEqual(L.periodOf(at(3)), 'night');
});

test('shouldSleep between 23:00 and 06:00', () => {
  assert.ok(L.shouldSleep(at(23)));
  assert.ok(L.shouldSleep(at(2)));
  assert.ok(!L.shouldSleep(at(6)));
  assert.ok(!L.shouldSleep(at(22, 59)));
});

test('greetingKey: night after midnight belongs to the previous day', () => {
  assert.strictEqual(L.greetingKey(at(23)), '2026-11-16-night');
  assert.strictEqual(L.greetingKey(new Date(2026, 10, 17, 1)), '2026-11-16-night');
  assert.strictEqual(L.greetingKey(at(9)), '2026-11-16-morning');
});

test('greeting uses the name and the period', () => {
  assert.match(L.greeting('morning', 'Eric', () => 0), /Good morning, Eric/);
  assert.doesNotMatch(L.greeting('evening', '', () => 0), /\{n\}|, !/);
});

test('Mood clamps, decays and maps to emotions', () => {
  const m = new L.Mood();
  assert.strictEqual(m.emotion(), 'neutral');
  m.adjust(500); assert.strictEqual(m.value, 100); assert.strictEqual(m.emotion(), 'happy');
  m.adjust(-300); assert.strictEqual(m.value, -100); assert.strictEqual(m.emotion(), 'sad');
  m.decay(60); m.decay(60); assert.strictEqual(m.value, 0);
});

test('PokeTracker: annoyed at 3, angry at 5, resets after the window', () => {
  const p = new L.PokeTracker(10000);
  assert.strictEqual(p.register(0), 'ok');
  assert.strictEqual(p.register(1000), 'ok');
  assert.strictEqual(p.register(2000), 'annoyed');
  assert.strictEqual(p.register(3000), 'annoyed');
  assert.strictEqual(p.register(4000), 'angry');
  assert.strictEqual(p.register(60000), 'ok');
});

test('pickActivity never dances when very sad, and always returns a known activity', () => {
  const known = ['wander', 'sniff', 'toy', 'bone', 'read', 'game', 'look', 'dance', 'sigh', 'roam'];
  for (let i = 0; i < 300; i++) {
    const a = L.pickActivity(Math.random(), { mood: -60 });
    assert.ok(known.includes(a));
    assert.notStrictEqual(a, 'dance');
  }
  assert.ok(known.includes(L.pickActivity(0.999, {})));
});

test('dayReaction covers great / okay / bad', () => {
  assert.strictEqual(L.dayReaction('great').emotion, 'happy');
  assert.strictEqual(L.dayReaction('okay').emotion, 'neutral');
  assert.strictEqual(L.dayReaction('bad').emotion, 'sad');
});

test('parseReply reads the emotion tag, strips markdown, caps length', () => {
  assert.deepStrictEqual(L.parseReply('[love] You **rock**!'), { emotion: 'love', text: 'You rock!' });
  assert.strictEqual(L.parseReply('[bogus] hi').emotion, 'neutral');
  assert.strictEqual(L.parseReply('no tag').text, 'no tag');
  assert.ok(L.parseReply('x'.repeat(1000)).text.length <= 320);
});

test('fallbackReply always answers', () => {
  for (const t of ['hi', 'I feel sad', 'thanks', 'tell me a joke', 'quantum physics', '']) {
    const r = L.fallbackReply(t);
    assert.ok(r.text && L.EMOTIONS.includes(r.emotion));
  }
});

test('AI: no key -> null (scripted fallback is used)', async () => {
  assert.strictEqual(await createAI({}).chat('hello'), null);
});

test('AI: parses the reply, keeps a rolling history, uses Haiku 5.5', async () => {
  const calls = [];
  const client = { messages: { create: async (p) => { calls.push(p); return { stop_reason: 'end_turn', content: [{ type: 'text', text: '[happy] Hi friend!' }] }; } } };
  const ai = createAI({ client });
  const r = await ai.chat('hello', { name: 'Eric', period: 'morning', emotion: 'neutral' });
  assert.deepStrictEqual(r, { emotion: 'happy', text: 'Hi friend!' });
  assert.strictEqual(calls[0].model, 'claude-haiku-5-5');
  assert.match(calls[0].system, /Eric/);
  for (let i = 0; i < 20; i++) await ai.chat('again ' + i);
  assert.ok(ai._history.length <= 12);
  assert.strictEqual(ai._history[0].role, 'user');
});

test('AI: refusal and errors give null and do not poison the history', async () => {
  const refuse = createAI({ client: { messages: { create: async () => ({ stop_reason: 'refusal', content: [] }) } } });
  assert.strictEqual(await refuse.chat('x'), null);
  assert.strictEqual(refuse._history.length, 0);
  const boom = createAI({ client: { messages: { create: async () => { throw new Error('network'); } } } });
  assert.strictEqual(await boom.chat('x'), null);
  assert.strictEqual(boom._history.length, 0);
});

test('AI: a 400 on the speed settings retries without them', async () => {
  let n = 0;
  const client = { messages: { create: async (p) => {
    n++;
    if (p.thinking) { const e = new Error('bad'); e.status = 400; throw e; }
    return { stop_reason: 'end_turn', content: [{ type: 'text', text: '[neutral] ok' }] };
  } } };
  const r = await createAI({ client }).chat('hi');
  assert.strictEqual(r.text, 'ok'); assert.strictEqual(n, 2);
});

test('readEnv ignores a missing file', () => {
  assert.deepStrictEqual(readEnv('does-not-exist.env'), {});
});

test('classifyApp: office, IDE, browser, reader, games, fullscreen heuristic', () => {
  assert.strictEqual(L.classifyApp('WINWORD'), 'work');
  assert.strictEqual(L.classifyApp('EXCEL.EXE'), 'work');
  assert.strictEqual(L.classifyApp('Code'), 'work');
  assert.strictEqual(L.classifyApp('chrome'), 'browse');
  assert.strictEqual(L.classifyApp('chrome', true), 'browse'); // fullscreen video in a browser is not a game
  assert.strictEqual(L.classifyApp('SumatraPDF'), 'read');
  assert.strictEqual(L.classifyApp('cs2'), 'game');
  assert.strictEqual(L.classifyApp('FortniteClient-Win64-Shipping'), 'game');
  assert.strictEqual(L.classifyApp('SomeNewGame', true), 'game');
  assert.strictEqual(L.classifyApp('SomeNewGame', false), 'other');
  assert.strictEqual(L.classifyApp('explorer', true), 'other'); // the desktop is "fullscreen" too
  assert.strictEqual(L.classifyApp('vlc', true), 'other');
  assert.strictEqual(L.classifyApp('', true), 'other');
});

test('MIMIC_ACT maps categories to activities', () => {
  assert.strictEqual(L.MIMIC_ACT.game, 'game');
  assert.strictEqual(L.MIMIC_ACT.work, 'laptop');
  assert.strictEqual(L.MIMIC_ACT.browse, 'laptop');
  assert.strictEqual(L.MIMIC_ACT.other, null);
});

test('ollama provider: replies via local /api/chat, no key needed, errors -> null', async () => {
  const { createAI } = require('../main/ai');
  const calls = [];
  const ok = createAI({ ollamaModel: 'llama3.2', fetchImpl: async (url, o) => { calls.push([url, JSON.parse(o.body)]); return { ok: true, json: async () => ({ message: { content: '[happy] Hi friend!' } }) }; } });
  assert.equal(ok.available(), true);
  const r = await ok.chat('hello', { name: 'Eric' });
  assert.equal(r.emotion, 'happy');
  assert.match(calls[0][0], /\/api\/chat$/);
  assert.equal(calls[0][1].model, 'llama3.2');
  const bad = createAI({ ollamaModel: 'x', fetchImpl: async () => { throw new Error('down'); } });
  assert.equal(await bad.chat('hello'), null);
});

test('learning: samples aggregate, facts extracted, summary built, own process ignored', () => {
  const mem = L.emptyMemory();
  const evening = new Date(2026, 10, 16, 20, 0);
  for (let i = 0; i < 400; i++) L.recordSample(mem, 'Code.exe', 'work', 5, evening);
  for (let i = 0; i < 200; i++) L.recordSample(mem, 'valorant-win64-shipping', 'game', 5, evening);
  L.recordSample(mem, 'electron', 'other', 5, evening);
  L.recordSample(mem, 'bad name!', 'other', 5, evening);
  assert.equal(mem.apps.electron, undefined);
  assert.equal(Object.keys(mem.apps).length, 2);
  assert.deepEqual(L.extractFacts('I love cooking pasta. Nice weather today. My dog is called Max!'), ['I love cooking pasta', 'My dog is called Max']);
  L.addFacts(mem, ['I love cooking pasta', 'i love cooking pasta']);
  assert.equal(mem.facts.length, 1);
  const s = L.summarizeMemory(mem);
  assert.match(s, /code/); assert.match(s, /evening they mostly work/); assert.match(s, /cooking pasta/);
  assert.equal(L.summarizeMemory(L.emptyMemory()), '');
});

test('learned memory goes to the local model only, never to Claude', async () => {
  const { createAI } = require('../main/ai');
  let local = null; let cloud = null;
  const o = createAI({ ollamaModel: 'm', fetchImpl: async (u, r) => { local = JSON.parse(r.body); return { ok: true, json: async () => ({ message: { content: 'hi' } }) }; } });
  await o.chat('hello', { memory: 'SECRETHABIT' });
  assert.match(local.messages[0].content, /SECRETHABIT/);
  const c = createAI({ client: { messages: { create: async (p) => { cloud = p; return { content: [{ type: 'text', text: 'hi' }] }; } } } });
  await c.chat('hello', { memory: 'SECRETHABIT' });
  assert.doesNotMatch(String(cloud.system), /SECRETHABIT/);
});

test('parseReply: small local models write the tag without brackets', () => {
  assert.deepEqual(L.parseReply('neutral It sounds fun'), { emotion: 'neutral', text: 'It sounds fun' });
  assert.deepEqual(L.parseReply('happy: Great!'), { emotion: 'happy', text: 'Great!' });
  assert.deepEqual(L.parseReply('(sad) oh no'), { emotion: 'sad', text: 'oh no' });
  assert.equal(L.parseReply('Happy to help').text, 'Happy to help');
});

test('languages: Dutch has every English key; greeting/fallback/dayReaction speak Dutch', () => {
  for (const k of Object.keys(L.STR.en)) assert.ok(k in L.STR.nl, 'nl missing ' + k);
  for (const k of Object.keys(L.STR.nl)) assert.ok(k in L.STR.en, 'en missing ' + k);
  for (const p of ['morning', 'afternoon', 'evening', 'night']) assert.ok(L.STR.nl.greet[p].length >= 2);
  assert.match(L.greeting('morning', 'Eric', () => 0, 'nl'), /Goedemorgen, Eric/);
  assert.match(L.greeting('morning', 'Eric', () => 0), /Good morning, Eric/);
  assert.match(L.fallbackReply('ik ben moe', 'nl').text, /spijt/);
  assert.match(L.dayReaction('great', 'nl').text, /Yes/);
  assert.equal(L.tr('nl', 'nice', { name: 'Eric' }).includes('Eric'), true);
  assert.equal(L.tr('xx', 'ok'), 'OK');
});

test('learning: today so far appears in the summary', () => {
  const mem = L.emptyMemory(); const d = new Date(2026, 10, 16, 20, 0);
  for (let i = 0; i < 150; i++) L.recordSample(mem, 'code', 'work', 5, d);
  assert.match(L.summarizeMemory(mem, d), /Today so far they spent 13m on work/);
  assert.doesNotMatch(L.summarizeMemory(mem, new Date(2026, 10, 17, 9)), /Today so far/);
});

/* ---- 0.5.0: mood of the day, mood swings, position ---- */
const seq = (...v) => { let i = 0; return () => v[i++ % v.length]; };

test('Mood drifts back to the base of the day and shows grumpy between sad and neutral', () => {
  const m = new L.Mood(0, -40);
  for (let i = 0; i < 100; i++) m.decay(1);
  assert.strictEqual(m.value, -40);
  assert.strictEqual(m.emotion(), 'grumpy');
  m.adjust(-30); assert.strictEqual(m.emotion(), 'sad');
  m.adjust(100); for (let i = 0; i < 200; i++) m.decay(1);
  assert.strictEqual(m.value, -40); // cheering up helps, but the bad day comes back
  assert.ok(L.EMOTIONS.includes('grumpy'));
});

test('pickDayMood: good / normal / bad with their bases', () => {
  assert.deepStrictEqual(L.pickDayMood(() => 0.1), { kind: 'good', base: 20 });
  assert.deepStrictEqual(L.pickDayMood(() => 0.5), { kind: 'normal', base: 0 });
  assert.deepStrictEqual(L.pickDayMood(() => 0.9), { kind: 'bad', base: -40 });
});

test('moodSwing is rare, sized 20-45, and leans with the day', () => {
  assert.strictEqual(L.moodSwing('normal', seq(0.5)), 0);
  assert.strictEqual(L.moodSwing('normal', seq(0.007)), 0);
  assert.notStrictEqual(L.moodSwing('bad', seq(0.007, 0, 0.9)), 0); // bad days swing more often
  assert.strictEqual(L.moodSwing('bad', seq(0, 0, 0.5)), -20); // bad day: mostly down
  assert.strictEqual(L.moodSwing('good', seq(0, 1, 0.5)), 45); // good day: mostly up
  let n = 0; for (let i = 0; i < 20000; i++) { const d = L.moodSwing('normal'); if (d) { n++; assert.ok(Math.abs(d) >= 20 && Math.abs(d) <= 45); } }
  assert.ok(n > 40 && n < 250, 'about 0.6% of ticks, got ' + n);
});

test('clampPos keeps Mars on screen and caveSide picks the nearest corner', () => {
  assert.deepStrictEqual(L.clampPos({ x: 5000, y: 5000 }, 1920, 1040), { x: 1920 - 228, y: 1040 - 198 });
  assert.deepStrictEqual(L.clampPos({ x: -50, y: -9 }, 1920, 1040), { x: 0, y: 0 });
  assert.deepStrictEqual(L.clampPos(null, 1920, 1040), { x: 24, y: 4 });
  assert.deepStrictEqual(L.clampPos({ x: 'a', y: NaN }, 1920, 1040), { x: 24, y: 4 });
  assert.strictEqual(L.caveSide(100, 1920), 'left');
  assert.strictEqual(L.caveSide(1500, 1920), 'right');
});

test('classifyApp: a browser with media playing is "watch" (sing along), without media it is browsing', () => {
  assert.strictEqual(L.classifyApp('chrome', false, true), 'watch');
  assert.strictEqual(L.classifyApp('msedge', true, true), 'watch');
  assert.strictEqual(L.classifyApp('chrome', false, false), 'browse');
  assert.strictEqual(L.classifyApp('winword', false, true), 'work'); // music while working: keeps typing
  assert.strictEqual(L.MIMIC_ACT.watch, 'sing');
  assert.ok(Array.isArray(L.STR.en.sing) && Array.isArray(L.STR.nl.sing));
});

/* ---- Mars: dog activities and words ---- */
test('Mars: idle life includes the plush toy, a bone and sniffing; dog words in both languages', () => {
  const seen = new Set();
  for (let i = 0; i < 2000; i++) seen.add(L.pickActivity(Math.random(), {}));
  for (const a of ['toy', 'bone', 'sniff']) assert.ok(seen.has(a), 'never picked ' + a);
  assert.ok(Array.isArray(L.STR.en.treat) && Array.isArray(L.STR.nl.treat));
  assert.match(L.tr('en', 'askName'), /Mars/);
  assert.match(L.tr('nl', 'askName'), /Mars/);
  assert.ok(L.FACTS.some((f) => /cobberdog/i.test(f)));
  assert.strictEqual(L.classifyApp('mars', true), 'other'); // our own window is never a game
});

test('AI persona is Mars the cobberdog', () => {
  const { PERSONA } = require('../main/ai');
  assert.match(PERSONA, /Mars/); assert.match(PERSONA, /cobberdog/); assert.doesNotMatch(PERSONA, /shark/i);
});

test('food hunt: only after 2 minutes without input, never asleep, hidden, in the kennel, during a video or a game', () => {
  const base = { idleSec: 200, sleeping: false, hidden: false, inCave: false, cat: 'other' };
  assert.ok(L.wantsFoodHunt(base));
  assert.ok(L.wantsFoodHunt({ ...base, cat: 'work' }));
  assert.ok(!L.wantsFoodHunt({ ...base, idleSec: L.HUNT_IDLE_S - 1 }));
  assert.ok(L.wantsFoodHunt({ ...base, idleSec: L.HUNT_IDLE_S }));
  for (const k of ['sleeping', 'hidden', 'inCave']) assert.ok(!L.wantsFoodHunt({ ...base, [k]: true }), k);
  assert.ok(!L.wantsFoodHunt({ ...base, cat: 'watch' }));
  assert.ok(!L.wantsFoodHunt({ ...base, cat: 'game' }));
  assert.ok(L.userBack(0) && L.userBack(2) && !L.userBack(L.BACK_IDLE_S));
});

test('huntSpot covers the whole screen', () => {
  assert.deepStrictEqual(L.huntSpot(0, 0, 1700, 900), { x: 0, y: 0 });
  assert.deepStrictEqual(L.huntSpot(0.5, 0.5, 1700, 900), { x: 850, y: 450 });
  const far = L.huntSpot(0.999, 0.999, 1700, 900); assert.ok(far.x <= 1700 && far.y <= 900 && far.x > 1690);
});

test('callsPetName: "Marsi" as a word, any case; not Mars, not marsipan', () => {
  for (const t of ['Marsi', 'hoi marsi!', 'MARSI?', 'good dog, Marsi.', 'Marsi❤']) assert.ok(L.callsPetName(t), t);
  for (const t of ['Mars', 'marsipan', 'Marsies', '', null, 'smarsi']) assert.ok(!L.callsPetName(t), String(t));
  assert.ok(L.tr('en', 'petName').includes('Marsi') && L.tr('nl', 'petName').includes('Marsi'));
});

test('welcome hops: a bigger party the very first time', () => {
  assert.ok(L.welcomeHops(true) > L.welcomeHops(false));
  assert.ok(L.welcomeHops(false) >= 2);
});

test('AI persona knows the nickname Marsi', () => {
  const { PERSONA } = require('../main/ai');
  assert.match(PERSONA, /Marsi/);
});
