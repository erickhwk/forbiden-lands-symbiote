/*
 * Baralho de iniciativa do Forbidden Lands.
 *
 * Puro: não toca no DOM nem na API do TaleSpire. Guarda tudo num objeto de
 * combate simples (dá para salvar como JSON) e o altera no lugar.
 *
 * Regras cobertas:
 *   - Baralho de 10 cartas (1 a 10). Cada combatente compra uma; grupos de
 *     PNJs iguais compram uma carta para o grupo.
 *   - Quem tem cartas extras (surpresa, talentos) compra antes, escolhe uma,
 *     e as outras voltam ao baralho, que é embaralhado antes dos demais.
 *   - A ordem vale para o combate todo. A carta 1 age primeiro.
 *   - Troca entre personagens vale na hora (começo da rodada); FINTAR vale a
 *     partir da rodada seguinte.
 */
(function (root) {
  "use strict";

  var DECK_SIZE = 10;

  function shuffle(cards, rng) {
    var a = cards.slice(), r = rng || Math.random;
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(r() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function freshDeck(rng) {
    var cards = [];
    for (var i = 1; i <= DECK_SIZE; i++) cards.push(i);
    return shuffle(cards, rng);
  }

  function create() {
    return { phase: "setup", round: 0, deck: [], entries: [], currentId: null, pendingSwaps: [], seq: 1 };
  }

  function find(c, id) {
    for (var i = 0; i < c.entries.length; i++) if (c.entries[i].id === id) return c.entries[i];
    return null;
  }

  /*
   * data: { name, kind: "pc"|"npc", extra, count, clientId, key, mon, hpMax }
   * extra = cartas além da primeira (surpresa, talento).
   * count > 1 = grupo de PNJs iguais, que compra uma carta só.
   * mon = id no bestiário; hpMax = Força de cada cópia (PNJ). hp guarda a
   * Força atual de cada cópia do grupo.
   */
  function addEntry(c, data) {
    var e = {
      id: "e" + (c.seq++),
      name: String(data.name || "Combatente"),
      kind: data.kind === "pc" ? "pc" : "npc",
      extra: Math.max(0, data.extra | 0),
      count: Math.max(1, data.count | 0 || 1),
      clientId: data.clientId || null,
      key: data.key || null,
      mon: data.mon || null,
      hpMax: Math.max(0, data.hpMax | 0),
      hp: null,
      card: null,
      options: null,
      fast: false,
      slow: false
    };
    if (e.hpMax) { e.hp = []; for (var i = 0; i < e.count; i++) e.hp.push(e.hpMax); }
    c.entries.push(e);
    return e;
  }

  /* Muda a Força de uma cópia (idx) entre 0 e o máximo. */
  function setHp(c, id, idx, delta) {
    var e = find(c, id);
    if (!e || !e.hp || idx < 0 || idx >= e.hp.length) return null;
    e.hp[idx] = Math.max(0, Math.min(e.hpMax, e.hp[idx] + delta));
    return e.hp[idx];
  }

  /* Todas as cópias Acabadas? */
  function down(e) {
    return !!(e && e.hp && e.hp.length && e.hp.every(function (h) { return h === 0; }));
  }

  function removeEntry(c, id) {
    var e = find(c, id);
    if (!e) return;
    if (e.card != null && c.phase !== "setup") c.deck = c.deck.concat([e.card]);
    if (e.options) c.deck = c.deck.concat(e.options);
    c.entries = c.entries.filter(function (x) { return x.id !== id; });
    if (c.currentId === id) {
      var s = sorted(c);
      c.currentId = s.length ? s[0].id : null;
    }
  }

  /* Quem tem cartas extras compra primeiro; o resto, na ordem em que entrou. */
  function drawOrder(c) {
    var withExtra = c.entries.filter(function (e) { return e.extra > 0; });
    var rest = c.entries.filter(function (e) { return e.extra === 0; });
    return withExtra.concat(rest);
  }

  /* Começa a compra do zero. */
  function deal(c, rng) {
    c.deck = freshDeck(rng);
    c.entries.forEach(function (e) { e.card = null; e.options = null; e.fast = false; e.slow = false; });
    c.pendingSwaps = [];
    c.phase = "dealing";
    c.round = 0;
    c.currentId = null;
    return continueDeal(c, rng);
  }

  /*
   * Compra até alguém precisar escolher entre cartas. Devolve o id de quem
   * está escolhendo, ou null quando todos têm carta (ou o baralho acabou).
   */
  function continueDeal(c, rng) {
    var order = drawOrder(c);
    for (var i = 0; i < order.length; i++) {
      var e = order[i];
      if (e.card != null) continue;
      if (e.options) return e.id;
      var n = Math.min(1 + e.extra, c.deck.length);
      if (n === 0) continue; // sem cartas: fica de fora até alguém sair
      var opts = c.deck.splice(0, n);
      if (opts.length === 1) e.card = opts[0];
      else { e.options = opts.sort(function (a, b) { return a - b; }); return e.id; }
    }
    if (c.phase === "dealing") start(c);
    return null;
  }

  function start(c) {
    c.phase = "running";
    c.round = 1;
    var s = sorted(c);
    c.currentId = s.length ? s[0].id : null;
  }

  /* Escolhe uma das cartas compradas; as outras voltam e o baralho é embaralhado. */
  function choose(c, id, card, rng) {
    var e = find(c, id);
    if (!e || !e.options || e.options.indexOf(card) === -1) return null;
    var back = e.options.filter(function (x) { return x !== card; });
    e.card = card;
    e.options = null;
    c.deck = shuffle(c.deck.concat(back), rng);
    var wasRunning = c.phase === "running";
    var pending = continueDeal(c, rng);
    if (wasRunning && !c.currentId) start(c);
    return pending;
  }

  /* Escolha padrão: a menor carta (agir antes). */
  function chooseBest(c, id, rng) {
    var e = find(c, id);
    if (!e || !e.options) return null;
    return choose(c, id, Math.min.apply(null, e.options), rng);
  }

  /* Combatente que entra com o combate em andamento compra do que sobrou. */
  function addLate(c, data, rng) {
    var e = addEntry(c, data);
    if (c.phase === "running") continueDeal(c, rng);
    return e;
  }

  function sorted(c) {
    return c.entries.filter(function (e) { return e.card != null; })
      .sort(function (a, b) { return a.card - b.card; });
  }

  function current(c) { return c.currentId ? find(c, c.currentId) : null; }

  function waiting(c) {
    return c.entries.filter(function (e) { return e.card == null && !e.options; });
  }

  function choosing(c) {
    return c.entries.filter(function (e) { return !!e.options; });
  }

  function next(c) {
    var s = sorted(c);
    if (!s.length) return;
    var i = indexOf(s, c.currentId);
    if (i === -1 || i + 1 >= s.length) newRound(c);
    else c.currentId = s[i + 1].id;
  }

  function prev(c) {
    var s = sorted(c);
    var i = indexOf(s, c.currentId);
    if (i > 0) c.currentId = s[i - 1].id;
  }

  function newRound(c) {
    c.round++;
    c.pendingSwaps.forEach(function (p) { swapNow(c, p[0], p[1]); });
    c.pendingSwaps = [];
    c.entries.forEach(function (e) { e.fast = false; e.slow = false; });
    var s = sorted(c);
    c.currentId = s.length ? s[0].id : null;
  }

  function indexOf(list, id) {
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return i;
    return -1;
  }

  function swapNow(c, a, b) {
    var ea = find(c, a), eb = find(c, b);
    if (!ea || !eb || ea.card == null || eb.card == null) return false;
    var t = ea.card; ea.card = eb.card; eb.card = t;
    return true;
  }

  /* feint = FINTAR: a troca só vale na próxima rodada. */
  function swap(c, a, b, feint) {
    if (a === b) return false;
    if (feint) { c.pendingSwaps.push([a, b]); return true; }
    return swapNow(c, a, b);
  }

  function toggleAction(c, id, which) {
    var e = find(c, id);
    if (e && (which === "fast" || which === "slow")) e[which] = !e[which];
  }

  var api = {
    DECK_SIZE: DECK_SIZE,
    create: create,
    addEntry: addEntry,
    addLate: addLate,
    removeEntry: removeEntry,
    deal: deal,
    choose: choose,
    chooseBest: chooseBest,
    sorted: sorted,
    current: current,
    waiting: waiting,
    choosing: choosing,
    next: next,
    prev: prev,
    swap: swap,
    toggleAction: toggleAction,
    setHp: setHp,
    down: down,
    find: find,
    shuffle: shuffle
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.FLInitiative = api;
})(typeof window !== "undefined" ? window : this);
