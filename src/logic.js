/* Mars's pure brain: no DOM, no Electron, so it can be unit-tested with `node --test`.
 * Loaded in the renderer as window.MarsLogic and in tests via require(). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MarsLogic = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const EMOTIONS = ['neutral', 'happy', 'sad', 'angry', 'sleepy', 'surprised', 'love', 'grumpy'];

  /** morning 05-11, afternoon 12-17, evening 18-21, night 22-04 */
  function periodOf(date) {
    const h = date.getHours();
    if (h >= 5 && h < 12) return 'morning';
    if (h >= 12 && h < 18) return 'afternoon';
    if (h >= 18 && h < 22) return 'evening';
    return 'night';
  }

  /** Mars sleeps from 23:00 until 06:00. */
  function shouldSleep(date) {
    const h = date.getHours();
    return h >= 23 || h < 6;
  }

  function dayKey(date) {
    const p = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
  }

  /** The "night" period after midnight belongs to the previous evening's key, so we greet once per night. */
  function greetingKey(date) {
    const d = new Date(date);
    if (periodOf(d) === 'night' && d.getHours() < 5) d.setDate(d.getDate() - 1);
    return `${dayKey(d)}-${periodOf(date)}`;
  }

  const LINES = {
    morning: ['Good morning{n}! *stretches* Ready for a waggy day?', 'Good morning{n}! I hope you slept as well as I did.', 'Rise and shine{n}! Is it walkies time yet?'],
    afternoon: ['Good afternoon{n}! How is your day going?', "Good afternoon{n}! Don't forget a drink of water. I just had mine.", 'Hi{n}! Good afternoon. My tail is wagging, you know.'],
    evening: ['Good evening{n}! You made it through the day.', 'Good evening{n}! Time for the couch and a blanket.'],
    night: ["Good night{n}! You are up late. Don't forget to rest.", "It's very late{n}... shall we both go to our baskets?"],
  };

  const FACTS = [
    'The Australian cobberdog was bred to be a gentle, people-loving companion and therapy dog. Like me!',
    'Cobberdogs have a fleece or wool coat that hardly sheds. Fewer hairs on your couch!',
    "'Cobber' is Australian slang for 'friend' or 'mate'. So my breed is literally 'friend-dog'.",
    "A dog's nose print is unique, just like your fingerprint.",
    'Dogs can smell about 10,000 to 100,000 times better than people.',
    'Dogs dream too. If my paws twitch in my sleep, I am probably chasing something.',
    'A tail wagging more to the right means a happy dog; more to the left, an uneasy one.',
    'Dogs can learn well over a hundred words. My favourites: walk, treat and good dog!',
    'Puppies are born deaf and blind, but they can smell from day one.',
    'Dogs sweat through their paw pads. That is why my paws smell a bit like popcorn.',
  ];

  const CHATTER = [
    "Just sniffing around. Don't mind me!",
    'Remember to stretch your paws... I mean arms.',
    'You are doing great, you know that?',
    'Have you had some water lately?',
    'I like it here. Nice view, comfy floor.',
    'Psst... a short walk is good for you. And for me!',
    '*yawns* Being this fluffy is tiring work.',
    'Did someone say treat? No? Okay...',
  ];

  /* ---- languages: every word Mars says. Arrays = pick one at random; {x} = variable. ---- */
  const STR = {
    en: {
      greet: LINES, facts: FACTS, chatter: CHATTER,
      askName: "Woof! I'm Mars, your new furry friend. I'll hang out down here. What's your name?", namePh: 'Your name',
      nice: 'Nice to meet you, {name}! Double-click me any time to chat. Right-click for more.', nameLater: 'No worries, we can do names later.',
      howDay: ' How was your day?', rGreat: 'Great!', rOkay: 'Okay', rBad: 'Bad', dayPh: 'Or tell me in your own words...',
      tellMore: 'Tell Mars more', thanks: 'Thanks!', tellAll: 'Tell me all about it.',
      chatAsk: "What's on your mind?", chatNoAi: "I'm all ears! Floppy ones. (My brain isn't connected yet, so my answers are simple.)", chatPh: 'Talk to Mars...',
      sayPh: 'Say something...', send: 'Send', close: 'Close',
      lonelyBack: "Yay, you're here! *wiggles* I was a bit lonely.", back: "You're back! I missed you so much!",
      pokeWake: 'Mmmh... I was dreaming about squirrels!', pokeOk: ['Woof!', 'Boop!', 'That tickles!', 'Hi there!', 'Belly rub?', 'Arf!'],
      pokeAnnoyed: 'Hey! Stop poking me...', pokeAngry: 'GRRR! Enough! I am getting really grumpy!',
      sorry: "I'm sorry I growled. Are we still friends?", sorryYes: 'Of course!', sorryNo: 'Hmm...', bestFriends: 'Yay! Best friends! *happy zoomies*',
      lonelyNote: "Psst... it's been quiet. I'm okay, just here if you want to talk.", sleepNote: 'Zzz... off to my basket. Sleep tight!',
      hGreat: "I'm feeling pawsome, thanks for asking!", hSad: "I'm a little down, but a scratch behind the ears helps.", hNeutral: "I'm doing fine, just lying around. How about you?",
      chatBtn: 'Chat', ok: 'OK', soChat: 'So... how are YOU doing?', watch: 'Watch this!',
      knowOff: "I'm not learning right now. You can turn it on in my right-click menu.", knowHas: 'Here is what I have sniffed out: ',
      knowNone: "Not much yet! I'm still getting to know you. Tell me about yourself sometime.", forgot: "Done, I've forgotten everything. Nice to meet you!",
      quietOn: "Okay, I'll be quiet for {t}. I'll still be around.", quietOff: 'Back to normal! I may bark again.',
      q30: '30 minutes', q60: 'an hour', q120: 'two hours', langSet: 'Okay, I speak English now! Woof!',
      day: { great: "Yay! I love hearing that. Let's celebrate with a little dance!", okay: "Okay is okay. Tomorrow can be even better, and I'll be right here.", bad: "Oh no... I'm sorry. Want a cuddle? Or tell me what happened." },
      fbSad: "I'm sorry to hear that. I'm here with you, always. *rests head on your lap*", fbLove: "Aww, you're the best! My tail can't stop wagging.", fbHi: 'Hi hi! *wag wag* Good to see you!',
      badDay: " ...Honestly, I'm having a bit of a grey day today.", hGrumpy: "Honestly? Bad day. Everything feels a bit grey... but you being here helps.",
      swingUp: ['Ooh, suddenly I feel great!', 'Zoomies incoming!', 'Wheee, happy paws!'], swingDown: ['Hmpf.', 'Meh...', 'Sigh. One of those moments.'],
      sing: ['♪ Awoooo ♪', '♫ Woof-woof-woooo ♫', '♪ La-la-awooo! ♪', '♫ Paws up, everybody! ♫'],
      treat: ['Yum! Thank you! *crunch crunch*', 'A treat! You are the best human ever!', 'Om nom nom! More? No? Okay, still happy!'],
      petName: ["Marsi! That's me! *wiggles all over*", 'You said Marsi! *happy zoomies*', 'Marsi is here! *wag wag wag*'],
      fbJoke: 'What do you call a dog magician? A labracadabrador!', fbDefault: "Hmm, I'm a simple dog without my brain connected. Connect a local model (Ollama) or add an API key in .env and we can really talk!",
    },
    nl: {
      greet: {
        morning: ['Goedemorgen{n}! *rekt zich uit* Klaar voor een kwispeldag?', 'Goedemorgen{n}! Ik hoop dat je net zo goed geslapen hebt als ik.', 'Opstaan{n}! Is het al tijd om uit te laten?'],
        afternoon: ['Goedemiddag{n}! Hoe gaat je dag tot nu toe?', 'Goedemiddag{n}! Vergeet niet wat water te drinken. Ik had net mijn bakje.', 'Hoi{n}! Goedemiddag. Mijn staart kwispelt, hoor.'],
        evening: ['Goedenavond{n}! Je hebt de dag doorstaan.', 'Goedenavond{n}! Tijd voor de bank en een dekentje.'],
        night: ['Welterusten{n}! Je bent laat op. Vergeet niet te rusten.', 'Het is erg laat{n}... zullen we allebei naar onze mand gaan?'],
      },
      facts: [
        'De Australian cobberdog is gefokt als lieve, mensgerichte gezelschaps- en therapiehond. Net als ik!',
        'Cobberdogs hebben een vacht van fleece of wol die bijna niet verhaart. Minder haren op je bank!',
        "'Cobber' is Australisch voor 'vriend' of 'maatje'. Mijn ras is dus letterlijk 'vriendhond'.",
        'De neusafdruk van een hond is uniek, net als jouw vingerafdruk.',
        "Honden ruiken zo'n 10.000 tot 100.000 keer beter dan mensen.",
        'Honden dromen ook. Als mijn pootjes trillen in mijn slaap, zit ik vast iets achterna.',
        'Kwispelt een hond meer naar rechts, dan is het een blije hond; meer naar links betekent onrustiger.',
        'Honden kunnen wel meer dan honderd woorden leren. Mijn favorieten: wandelen, koekje en braaf!',
        "Puppy's worden doof en blind geboren, maar ruiken kunnen ze vanaf dag één.",
        'Honden zweten via hun voetzooltjes. Daarom ruiken mijn pootjes een beetje naar popcorn.',
      ],
      chatter: [
        'Ik snuffel even rond. Trek je niets van me aan!', 'Denk aan het rekken van je pootjes... ik bedoel armen.', 'Je doet het geweldig, weet je dat?',
        'Heb je de laatste tijd wat water gedronken?', 'Ik vind het hier fijn. Mooi uitzicht, lekkere vloer.', 'Psst... een kort wandelingetje is goed voor je. En voor mij!',
        '*gaapt* Zo pluizig zijn is best vermoeiend.', 'Zei iemand koekje? Nee? Oké...',
      ],
      askName: 'Woef! Ik ben Mars, je nieuwe harige vriend. Ik hang hier beneden rond. Hoe heet jij?', namePh: 'Jouw naam',
      nice: 'Leuk je te ontmoeten, {name}! Dubbelklik op me om te praten. Rechtermuisknop voor meer.', nameLater: 'Geen zorgen, namen kunnen later wel.',
      howDay: ' Hoe was je dag?', rGreat: 'Top!', rOkay: 'Prima', rBad: 'Slecht', dayPh: 'Of vertel het in je eigen woorden...',
      tellMore: 'Vertel Mars meer', thanks: 'Bedankt!', tellAll: 'Vertel me er alles over.',
      chatAsk: 'Waar denk je aan?', chatNoAi: 'Ik ben een en al oor! Flaporen zelfs. (Mijn brein is nog niet gekoppeld, dus mijn antwoorden zijn simpel.)', chatPh: 'Praat met Mars...',
      sayPh: 'Zeg iets...', send: 'Verstuur', close: 'Sluiten',
      lonelyBack: 'Yes, je bent er! *kwispelt* Ik was een beetje eenzaam.', back: 'Je bent terug! Ik heb je zo gemist!',
      pokeWake: 'Mmmh... ik droomde over eekhoorns!', pokeOk: ['Woef!', 'Boep!', 'Dat kietelt!', 'Hoi daar!', 'Buikje kriebelen?', 'Waf!'],
      pokeAnnoyed: 'Hé! Stop met porren...', pokeAngry: 'GRRR! Genoeg! Ik word echt chagrijnig!',
      sorry: 'Sorry dat ik gromde. Zijn we nog vrienden?', sorryYes: 'Natuurlijk!', sorryNo: 'Hmm...', bestFriends: 'Joepie! Beste vrienden! *rent blije rondjes*',
      lonelyNote: 'Psst... het is stil. Met mij gaat het goed, ik ben er als je wilt praten.', sleepNote: 'Zzz... ik ga naar mijn mand. Slaap lekker!',
      hGreat: 'Het gaat super, bedankt voor het vragen!', hSad: 'Ik voel me wat down, maar een kriebel achter mijn oren helpt.', hNeutral: 'Het gaat prima, ik lig maar wat te liggen. En jij?',
      chatBtn: 'Praten', ok: 'OK', soChat: 'Dus... hoe gaat het met JOU?', watch: 'Kijk eens!',
      knowOff: 'Ik leer nu niet. Je kunt het aanzetten in mijn rechtermuismenu.', knowHas: 'Dit heb ik opgesnuffeld: ',
      knowNone: 'Nog niet veel! Ik leer je nog kennen. Vertel eens iets over jezelf.', forgot: 'Klaar, ik ben alles vergeten. Leuk je te ontmoeten!',
      quietOn: 'Oké, ik ben stil gedurende {t}. Ik blijf wel in de buurt.', quietOff: 'Weer normaal! Ik mag weer blaffen.',
      q30: 'een half uur', q60: 'een uur', q120: 'twee uur', langSet: 'Oké, ik praat nu Nederlands! Woef!',
      day: { great: 'Yes! Dat hoor ik graag. Laten we dansen om het te vieren!', okay: 'Prima is prima. Morgen kan nog beter, en ik ben er gewoon.', bad: 'Oh nee... Dat vind ik jammer. Wil je een knuffel? Of vertel wat er gebeurd is.' },
      fbSad: 'Dat spijt me. Ik ben er voor je, altijd. *legt kop op je schoot*', fbLove: 'Aww, je bent de beste! Mijn staart houdt niet op met kwispelen.', fbHi: 'Hoi hoi! *kwispel kwispel* Fijn je te zien!',
      badDay: ' ...Eerlijk gezegd heb ik vandaag een beetje een grijze dag.', hGrumpy: 'Eerlijk? Slechte dag. Alles voelt een beetje grijs... maar fijn dat jij er bent.',
      swingUp: ['Ooh, ineens voel ik me top!', 'Hier komen de zoomies!', 'Joepie, blije pootjes!'], swingDown: ['Hmpf.', 'Meh...', "Zucht. Zo'n moment."],
      sing: ['♪ Auwoeoe ♪', '♫ Woef-woef-woeoe ♫', '♪ La-la-auwoe! ♪', '♫ Pootjes omhoog, allemaal! ♫'],
      treat: ['Mmm! Dankjewel! *knabbel knabbel*', 'Een koekje! Jij bent de allerbeste!', 'Nom nom nom! Nog eentje? Nee? Oké, nog steeds blij!'],
      petName: ['Marsi! Dat ben ik! *kwispelt helemaal*', 'Je zei Marsi! *blije rondjes*', 'Marsi is er! *kwispel kwispel*'],
      fbJoke: 'Wat zegt een hond op schuurpapier? Ruw! Ruw!', fbDefault: 'Hmm, ik ben maar een simpele hond zonder verbonden brein. Koppel een lokaal model (Ollama) of zet een API-sleutel in .env, dan kunnen we echt praten!',
    },
  };

  /** Translate: tr('nl', 'nice', {name}). Missing keys fall back to English. */
  function tr(lang, key, vars, rand) {
    let v = (STR[lang] && STR[lang][key] !== undefined) ? STR[lang][key] : STR.en[key];
    if (Array.isArray(v)) v = pick(v, rand);
    if (typeof v !== 'string') return v;
    for (const k of Object.keys(vars || {})) v = v.split('{' + k + '}').join(vars[k]);
    return v;
  }

  function pick(list, rand) {
    return list[Math.floor((rand || Math.random)() * list.length) % list.length];
  }

  function greeting(period, name, rand, lang) {
    const n = name ? `, ${name}` : '';
    return pick(((STR[lang] || STR.en).greet)[period], rand).replace('{n}', n);
  }

  /** Mood is a number in [-100, 100] that drifts back to `base` (the mood of the day, see pickDayMood). */
  class Mood {
    constructor(value = 0, base = 0) { this.value = value; this.base = base; }
    adjust(d) { this.value = Math.max(-100, Math.min(100, this.value + d)); return this.value; }
    decay(step = 1) {
      if (this.value > this.base) this.value = Math.max(this.base, this.value - step);
      else if (this.value < this.base) this.value = Math.min(this.base, this.value + step);
    }
    emotion() {
      if (this.value >= 35) return 'happy';
      if (this.value <= -60) return 'sad';
      if (this.value <= -25) return 'grumpy';
      return 'neutral';
    }
  }

  /** Every day has its own mood: 25% good, 55% normal, 20% bad. The base is where the mood drifts back to. */
  const DAY_MOOD_BASE = { good: 20, normal: 0, bad: -40 };
  function pickDayMood(rand) {
    const r = (rand || Math.random)();
    const kind = r < 0.25 ? 'good' : r < 0.8 ? 'normal' : 'bad';
    return { kind, base: DAY_MOOD_BASE[kind] };
  }

  /** Mood swing, checked once per tick (20 s): about one an hour, twice as often on a bad day.
   *  Returns a mood delta (0 = no swing). A bad day swings mostly down, a good day mostly up. */
  function moodSwing(kind, rand) {
    const r = rand || Math.random;
    if (r() >= (kind === 'bad' ? 0.012 : 0.006)) return 0;
    const upChance = kind === 'bad' ? 0.3 : kind === 'good' ? 0.7 : 0.5;
    const size = 20 + Math.round(r() * 25);
    return r() < upChance ? size : -size;
  }

  /** Counts quick pokes. 3+ in the window = annoyed, 5+ = angry. Anything else = ok. */
  class PokeTracker {
    constructor(windowMs = 12000) { this.windowMs = windowMs; this.times = []; }
    register(now) {
      this.times = this.times.filter((t) => now - t < this.windowMs);
      this.times.push(now);
      const n = this.times.length;
      if (n >= 5) return 'angry';
      if (n >= 3) return 'annoyed';
      return 'ok';
    }
    reset() { this.times = []; }
  }

  /** Weighted choice of the next idle activity. ctx: {mood}. rand in [0,1). */
  function pickActivity(rand, ctx = {}) {
    const mood = ctx.mood || 0;
    const table = [
      ['wander', 24], ['sniff', 12], ['toy', 14], ['bone', 10], ['read', 12], ['game', 12], ['look', 12],
      ['dance', mood < -35 ? 0 : 6], ['sigh', mood < -35 ? 20 : 0], ['roam', 6],
    ].filter(([, w]) => w > 0);
    const total = table.reduce((s, [, w]) => s + w, 0);
    let r = rand * total;
    for (const [name, w] of table) { if ((r -= w) < 0) return name; }
    return table[0][0];
  }

  /** Scripted reaction to "how was your day?" */
  function dayReaction(rating, lang) {
    const t = tr(lang, 'day');
    if (rating === 'great') return { emotion: 'happy', mood: 25, text: t.great, dance: true };
    if (rating === 'okay') return { emotion: 'neutral', mood: 5, text: t.okay };
    return { emotion: 'sad', mood: -20, text: t.bad, hug: true };
  }

  /** Offline reply used when there is no API key or the call fails. */
  function fallbackReply(text, lang) {
    const t = String(text || '').toLowerCase();
    if (/\b(sad|tired|bad|awful|lonely|stress|ziek|moe|verdrietig|vermoeid|slecht|eenzaam)\b/.test(t)) return { emotion: 'sad', text: tr(lang, 'fbSad') };
    if (/\b(love|thanks|thank you|great|nice|happy|dank|bedankt|top|lief|fijn|blij)\b/.test(t)) return { emotion: 'love', text: tr(lang, 'fbLove') };
    if (/\b(hi|hello|hey|hoi|hallo)\b/.test(t)) return { emotion: 'happy', text: tr(lang, 'fbHi') };
    if (/\b(joke|grap|mop)\b/.test(t)) return { emotion: 'happy', text: tr(lang, 'fbJoke') };
    return { emotion: 'neutral', text: tr(lang, 'fbDefault') };
  }

  /** Parses "[happy] Hello!" from the model. Unknown or missing tag = neutral. Output is capped. */
  function parseReply(raw) {
    let text = String(raw || '').trim();
    let emotion = 'neutral';
    const m = text.match(/^[[(<]\s*(\w+)\s*[\])>]\s*/) ||
      text.match(/^(happy|sad|angry|love|surprised|sleepy|grumpy|neutral)(?:\s*[:,.-]\s*|\s+(?=[A-Z]))/); // small local models often drop the brackets
    if (m) {
      if (EMOTIONS.includes(m[1].toLowerCase())) emotion = m[1].toLowerCase();
      text = text.slice(m[0].length);
    }
    text = text.replace(/\*\*|__|`/g, '').trim();
    if (text.length > 320) text = text.slice(0, 317).trimEnd() + '...';
    return { emotion, text };
  }

  /* ---- what is the user doing? (foreground app -> category) ---- */
  const WORK_APPS = new Set(['winword', 'excel', 'powerpnt', 'outlook', 'onenote', 'msaccess', 'visio', 'mspub', 'teams', 'ms-teams',
    'code', 'devenv', 'idea64', 'pycharm64', 'webstorm64', 'rider64', 'clion64', 'notepad++', 'notepad', 'wordpad', 'slack', 'soffice',
    'windowsterminal', 'wt', 'cmd', 'powershell', 'pwsh', 'claude']);
  const BROWSE_APPS = new Set(['chrome', 'msedge', 'firefox', 'brave', 'opera', 'vivaldi', 'arc', 'iexplore']);
  const READ_APPS = new Set(['acrord32', 'acrobat', 'sumatrapdf', 'foxitreader', 'foxitphantompdf', 'kindle', 'ebook-viewer', 'readera']);
  const GAME_APPS = new Set(['cs2', 'csgo', 'dota2', 'valorant', 'leagueoflegends', 'league of legends', 'robloxplayerbeta', 'minecraft',
    'eldenring', 'gta5', 'rdr2', 'overwatch', 'wow', 'wow-64', 'destiny2', 'r5apex', 'rocketleague', 'eurotrucks2', 'factorio',
    'stardew valley', 'terraria', 'hades', 'cyberpunk2077', 'witcher3', 'bg3', 'bg3_dx11', 'starfield', 'hollow_knight', 'among us',
    'fallguys_client', 'rustclient', 'fifa23', 'eafc24', 'eafc25', 'eafc26', 'pubg', 'tslgame', 'cod', 'modernwarfare', 'helldivers2']);
  // Fullscreen windows of these are NOT games (desktop shell, video, remote desktop ...).
  const NOT_GAME_FULLSCREEN = new Set(['explorer', 'searchhost', 'shellexperiencehost', 'startmenuexperiencehost', 'lockapp',
    'applicationframehost', 'textinputhost', 'vlc', 'wmplayer', 'mpc-hc64', 'mpc-hc', 'mpv', 'potplayermini64', 'spotify', 'netflix',
    'video.ui', 'dllhost', 'systemsettings', 'taskmgr', 'mstsc', 'teamviewer', 'anydesk', 'obs64', 'electron', 'mars', 'snippingtool']);

  /** name = foreground process name (no .exe), fullscreen = window covers its whole monitor,
   *  media = something is playing (Windows media controls; status only, never the title).
   *  Returns 'game' | 'work' | 'browse' | 'watch' | 'read' | 'other'. 'watch' = a browser in front while media plays (YouTube & co). */
  function classifyApp(name, fullscreen, media) {
    const n = String(name || '').toLowerCase().replace(/\.exe$/, '');
    if (!n) return 'other';
    if (GAME_APPS.has(n) || /-win(64|32)-shipping$/.test(n)) return 'game';
    if (READ_APPS.has(n)) return 'read';
    if (WORK_APPS.has(n)) return 'work';
    if (BROWSE_APPS.has(n)) return media ? 'watch' : 'browse';
    if (fullscreen && !NOT_GAME_FULLSCREEN.has(n)) return 'game'; // borderless/fullscreen unknown app: most likely a game
    return 'other';
  }

  /* ---- position: Mars can live anywhere on the screen ---- */
  const DOG_W = 220, DOG_H = 190;
  /** Keeps a position (x = left, y = distance from the bottom, in px) fully on a screen of w x h. Bad input -> bottom-left. */
  function clampPos(pos, w, h) {
    const num = (v) => (typeof v === 'number' ? v : NaN);
    const x = num(pos && pos.x), y = num(pos && pos.y);
    return {
      x: Math.round(Math.max(0, Math.min(Math.max(0, w - DOG_W - 8), Number.isFinite(x) ? x : 24))),
      y: Math.round(Math.max(0, Math.min(Math.max(0, h - DOG_H - 8), Number.isFinite(y) ? y : 4))),
    };
  }
  /** The kennel appears in the bottom corner nearest to Mars. */
  function caveSide(x, w) { return x + DOG_W / 2 > w / 2 ? 'right' : 'left'; }

  /** Which activity mirrors a category (null = Mars just lives a dog's life). */
  const MIMIC_ACT = { game: 'game', work: 'laptop', browse: 'laptop', watch: 'sing', read: 'read', other: null };

  /* ---- when the user is away: Mars goes looking for food ---- */
  const HUNT_IDLE_S = 120; // no keyboard or mouse for 2 minutes
  const BACK_IDLE_S = 3;   // input again within the last few seconds = the user is back
  /** True when Mars should roam the screen sniffing for food. Never during a video or a game (the user may sit still and watch). */
  function wantsFoodHunt({ idleSec, sleeping, hidden, inCave, cat }) {
    return idleSec >= HUNT_IDLE_S && !sleeping && !hidden && !inCave && cat !== 'watch' && cat !== 'game';
  }
  const userBack = (idleSec) => idleSec < BACK_IDLE_S;
  /** A sniffing spot anywhere on the screen (x from the left, y from the bottom), from two random numbers in [0, 1). */
  const huntSpot = (r1, r2, maxX, maxY) => ({ x: Math.round(r1 * maxX), y: Math.round(r2 * maxY) });
  const CRUMB_CHANCE = 0.25; // per sniffing spot

  /* ---- happy hops ---- */
  /** "Marsi" (the nickname) in a chat message, as a word, any case. */
  const callsPetName = (text) => /(^|[^\p{L}])marsi([^\p{L}]|$)/iu.test(String(text || ''));
  /** How many hops when Mars starts: a real party the very first time. */
  const welcomeHops = (firstEver) => (firstEver ? 7 : 3);

  /* ---- learning about the user (all local; aggregated counters, never a log, never window titles) ---- */
  const MAX_FACTS = 20;
  const CAT_WORDS = { game: 'play games', work: 'work', browse: 'browse the web', watch: 'watch videos', read: 'read', other: 'use other apps' };

  function emptyMemory() { return { v: 1, since: null, seconds: 0, apps: {}, slots: {}, facts: [], today: null }; }

  /** Adds secs seconds of the foreground app. Names are sanitised; unknown/own processes are skipped. */
  function recordSample(mem, name, cat, secs, date) {
    const n = String(name || '').toLowerCase().replace(/\.exe$/, '');
    if (!/^[a-z0-9._-]{1,40}$/.test(n) || n === 'electron' || n === 'mars') return mem;
    if (!mem.since) mem.since = dayKey(date);
    mem.seconds += secs;
    mem.apps[n] = (mem.apps[n] || 0) + secs;
    const k = periodOf(date) + ':' + (CAT_WORDS[cat] ? cat : 'other');
    mem.slots[k] = (mem.slots[k] || 0) + secs;
    const dk = dayKey(date);
    if (!mem.today || mem.today.day !== dk) mem.today = { day: dk, cats: {} };
    const c = CAT_WORDS[cat] ? cat : 'other';
    mem.today.cats[c] = (mem.today.cats[c] || 0) + secs;
    const names = Object.keys(mem.apps);
    if (names.length > 60) { // keep the file small: drop the rarest apps
      names.sort((a, b) => mem.apps[a] - mem.apps[b]).slice(0, names.length - 50).forEach((x) => delete mem.apps[x]);
    }
    return mem;
  }

  const FACT_RES = [
    /\bi(?:'m| am) (?:a|an) [^.!?,;]{2,50}/i,
    /\bi (?:really |also |always )?(?:like|love|hate|enjoy|play|study|live in|work (?:as|at|in|for)|have (?:a|an|two|three|\d+)) [^.!?,;]{2,50}/i,
    /\bmy (?:name|favou?rite [a-z ]{2,15}|job|hobby|hobbies|cat|dog|wife|husband|girlfriend|boyfriend|partner|kids?|children|sister|brother|mom|mum|dad|work|team|birthday)\b[^.!?;]{0,50}/i,
    /\bik (?:hou van|vind|speel|werk|woon|studeer|heb|ben) [^.!?,;]{2,50}/i,
    /\bmijn [a-z]{2,15}\b[^.!?;]{0,50}/i,
  ];
  /** Picks things the user said about themselves out of a chat message. Returns an array of short strings. */
  function extractFacts(text) {
    const out = [];
    for (const sentence of String(text || '').slice(0, 600).split(/(?<=[.!?])\s+|\n/)) {
      for (const re of FACT_RES) {
        const m = sentence.match(re);
        if (m) { out.push(m[0].trim().replace(/\s+/g, ' ').slice(0, 80)); break; }
      }
    }
    return out;
  }

  function addFacts(mem, facts) {
    for (const f of facts || []) {
      if (!f || mem.facts.some((x) => x.toLowerCase() === f.toLowerCase())) continue;
      mem.facts.push(f);
    }
    while (mem.facts.length > MAX_FACTS) mem.facts.shift();
    return mem;
  }

  /** Plain-English summary used in the AI prompt and in "What do you know about me?". Empty string when nothing is known. */
  function summarizeMemory(mem, now) {
    if (!mem) return '';
    const parts = [];
    if (mem.seconds >= 1800) {
      const top = Object.entries(mem.apps).sort((a, b) => b[1] - a[1]).slice(0, 5).filter((e) => e[1] >= 600).map((e) => e[0]);
      if (top.length) parts.push('Apps they use most: ' + top.join(', ') + '.');
      const habits = [];
      for (const p of ['morning', 'afternoon', 'evening', 'night']) {
        const mine = Object.entries(mem.slots).filter((e) => e[0].startsWith(p + ':'));
        const total = mine.reduce((a, e) => a + e[1], 0);
        if (total < 900) continue;
        const best = mine.sort((a, b) => b[1] - a[1])[0];
        habits.push('in the ' + p + ' they mostly ' + CAT_WORDS[best[0].split(':')[1]]);
      }
      if (habits.length) parts.push('Habits: ' + habits.join('; ') + '.');
    }
    if (mem.today && mem.today.day === dayKey(now || new Date())) {
      const NOUN = { game: 'gaming', work: 'work', browse: 'browsing', watch: 'videos', read: 'reading', other: 'other apps' };
      const fmt = (s) => { const m = Math.round(s / 60); return m >= 60 ? Math.floor(m / 60) + 'h' + (m % 60 ? ' ' + (m % 60) + 'm' : '') : m + 'm'; };
      const list = Object.entries(mem.today.cats).filter((e) => e[1] >= 600 && e[0] !== 'other').sort((a, b) => b[1] - a[1]).slice(0, 3);
      if (list.length) parts.push('Today so far they spent ' + list.map((e) => fmt(e[1]) + ' on ' + NOUN[e[0]]).join(', ') + '.');
    }
    if (mem.facts.length) parts.push('Things they told you: ' + mem.facts.join('; ') + '.');
    return parts.join(' ');
  }

  return { DOG_W, DOG_H, clampPos, caveSide, DAY_MOOD_BASE, pickDayMood, moodSwing, STR, tr, emptyMemory, recordSample, extractFacts, addFacts, summarizeMemory, classifyApp, MIMIC_ACT, EMOTIONS, LINES, FACTS, CHATTER, periodOf, shouldSleep, dayKey, greetingKey, greeting, pick, Mood, PokeTracker, pickActivity, dayReaction, fallbackReply, parseReply,
    HUNT_IDLE_S, BACK_IDLE_S, wantsFoodHunt, userBack, huntSpot, CRUMB_CHANCE, callsPetName, welcomeHops };
});
