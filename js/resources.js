/*
 * Dados de Recurso do Forbidden Lands: comida, água, flechas e tochas.
 *
 * Puro: não toca no DOM nem na API do TaleSpire.
 *   - Cada consumível é um dado: D6, D8, D10 ou D12 (0 = não tem).
 *   - Ao usar, rola o dado. Com 1 ou 2 ele desce um passo; no D6, acaba.
 *   - Encontrar, comprar ou ganhar uma unidade sobe um passo (até D12).
 *   - Para a carga, cada consumível que ainda tem dado vale um item normal.
 */
(function (root) {
  "use strict";

  var STEPS = [0, 6, 8, 10, 12];

  var KINDS = [
    { key: "comida", name: "Comida", verb: "comeu", gone: "a comida acabou" },
    { key: "agua", name: "Água", verb: "bebeu", gone: "a água acabou" },
    { key: "flechas", name: "Flechas", verb: "disparou uma flecha", gone: "as flechas acabaram" },
    { key: "tochas", name: "Tochas", verb: "acendeu uma tocha", gone: "as tochas acabaram" }
  ];

  // Dados iniciais por profissão (Manual do Jogador, capítulo 2).
  var START = {
    cacador: { comida: 8, agua: 8, flechas: 10 },
    druida: { comida: 8, agua: 8 },
    feiticeiro: { comida: 6, agua: 8 },
    ginete: { comida: 8, agua: 8, flechas: 10 },
    guerreiro: { comida: 8, agua: 6 },
    ladino: { comida: 6, agua: 6 },
    mascate: { comida: 8, agua: 8 },
    menestrel: { comida: 8, agua: 6 }
  };

  function norm(sides) {
    return STEPS.indexOf(sides) === -1 ? 0 : sides;
  }

  function step(sides, delta) {
    var i = STEPS.indexOf(norm(sides));
    return STEPS[Math.max(0, Math.min(STEPS.length - 1, i + delta))];
  }

  /* Resultado de usar: { value, before, after, dropped, empty }. */
  function use(sides, value) {
    var before = norm(sides);
    if (!before) return null;
    var dropped = value <= 2;
    var after = dropped ? step(before, -1) : before;
    return { value: value, before: before, after: after, dropped: dropped, empty: after === 0 };
  }

  function roll(sides, rng) {
    return 1 + Math.floor((rng || Math.random)() * norm(sides));
  }

  function empty() {
    var r = {};
    KINDS.forEach(function (k) { r[k.key] = 0; });
    return r;
  }

  function startFor(professionId) {
    var r = empty(), s = START[professionId] || {};
    Object.keys(s).forEach(function (k) { r[k] = s[k]; });
    return r;
  }

  /* Quantos itens os consumíveis ocupam na carga. */
  function loadOf(res) {
    return KINDS.filter(function (k) { return norm(res && res[k.key]) > 0; }).length;
  }

  function kind(key) { return KINDS.filter(function (k) { return k.key === key; })[0] || null; }

  var api = { STEPS: STEPS, KINDS: KINDS, START: START, step: step, use: use, roll: roll, empty: empty, startFor: startFor, loadOf: loadOf, kind: kind, norm: norm };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.FLResources = api;
})(typeof window !== "undefined" ? window : this);
