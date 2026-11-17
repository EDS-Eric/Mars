'use strict';
/* Optional AI brain. Runs in the main process so the API key never reaches the renderer.
 * Uses the fastest Claude model (Haiku 5.5). Without a key every call returns null and the
 * renderer falls back to scripted replies. */
const { parseReply } = require('../src/logic');

const MODEL = 'claude-haiku-5-5';
const OLLAMA_TIMEOUT_MS = 90000;
const MAX_HISTORY = 12;

const PERSONA = [
  "You are Mars, a friendly cartoon Australian cobberdog (chocolate brown, curly fur, small amber eyes, a red MARS tag, one year old) who lives on the user's Windows screen. " +
  "The user sometimes calls you Marsi, your nickname: you love it.",
  'You are their friend, not an assistant. You love walks, treats, cuddles on the couch, belly rubs and your soft plush toy.',
  'Reply in 1-2 short sentences (max 35 words). Be warm, playful and loyal; a dog pun or a *wag* now and then, never every time. Never needy or clingy.',
  'Start every reply with exactly one feeling tag that matches how you feel: [happy] [sad] [angry] [love] [surprised] [sleepy] [grumpy] [neutral].',
  'No markdown. You cannot see the screen or do tasks; you are just a good friend. If the user writes Dutch, answer in Dutch.',
].join(' ');

function createAI({ apiKey, client, model = MODEL, ollamaModel = '', ollamaHost = 'http://127.0.0.1:11434', fetchImpl } = {}) {
  let sdk = client || null;
  const history = [];

  function getClient() {
    if (sdk) return sdk;
    if (!apiKey) return null;
    const Anthropic = require('@anthropic-ai/sdk');
    sdk = new Anthropic({ apiKey, timeout: 15000, maxRetries: 1 });
    return sdk;
  }

  async function call(c, params) {
    try {
      return await c.messages.create({ ...params, thinking: { type: 'disabled' }, output_config: { effort: 'low' } });
    } catch (e) {
      if (e && e.status === 400) return await c.messages.create(params); // model rejected the speed settings: retry plain
      throw e;
    }
  }

  /** ctx: {name, period, emotion}. Returns {emotion, text} or null (no key / error / refusal). */
  let queue = Promise.resolve();
  /** Calls are serialised so overlapping requests cannot corrupt the rolling history. */
  function chat(userText, ctx = {}) {
    const run = queue.then(() => chatOnce(userText, ctx));
    queue = run.catch(() => {});
    return run;
  }

  async function chatOnce(userText, ctx) {
    const useOllama = !client && !apiKey && !!ollamaModel;
    const c = useOllama ? null : getClient();
    if ((!c && !useOllama) || !String(userText || '').trim()) return null;
    history.push({ role: 'user', content: String(userText).slice(0, 600) });
    while (history.length > MAX_HISTORY) history.shift();
    while (history.length && history[0].role !== 'user') history.shift();
    const system = `${PERSONA}\nContext: it is ${ctx.period || 'day'}; your current mood is ${ctx.emotion || 'neutral'}.` +
      (ctx.name ? ` The user's name is ${ctx.name}.` : '') +
      // Mars's own mood of the day (the dog's state, not the user's data).
      (ctx.dayMood === 'bad' ? ' Today is a bad day for you: you feel a bit grey and grumpy, but you stay kind to your friend and never take it out on them.'
        : ctx.dayMood === 'good' ? ' Today is a really good day for you.' : '') +
      (ctx.lang === 'nl' ? ' Always answer in Dutch (Nederlands), informal (je/jij), whatever language the user writes in.' : '') +
      // What Mars has learned about the user goes to the LOCAL model only, never to the cloud.
      (useOllama && ctx.memory ? ` What you have learned about your friend (use it naturally, do not recite it): ${String(ctx.memory).slice(0, 700)}` : '');
    try {
      if (useOllama) {
        const f = fetchImpl || fetch;
        const r = await f(ollamaHost.replace(/[/]$/, '') + '/api/chat', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ model: ollamaModel, stream: false, think: false, keep_alive: '30m', options: { num_predict: 120 },
            messages: [{ role: 'system', content: system }, ...history] }),
          signal: AbortSignal.timeout(OLLAMA_TIMEOUT_MS), // local models on small GPUs can need 20-60 s
        });
        if (!r.ok) { history.pop(); return null; }
        const data = await r.json();
        const text = data && data.message && data.message.content;
        if (!text || !String(text).trim()) { history.pop(); return null; }
        history.push({ role: 'assistant', content: String(text) });
        return parseReply(String(text));
      }
      const res = await call(c, { model, max_tokens: 200, system, messages: history.slice() });
      if (res.stop_reason === 'refusal') { history.pop(); return null; }
      const block = (res.content || []).find((b) => b.type === 'text');
      if (!block) { history.pop(); return null; }
      const reply = parseReply(block.text);
      history.push({ role: 'assistant', content: block.text });
      return reply;
    } catch (e) {
      history.pop();
      return null;
    }
  }

  return { chat, available: () => !!(sdk || apiKey || ollamaModel), reset: () => { history.length = 0; }, _history: history };
}

module.exports = { createAI, MODEL, PERSONA };
