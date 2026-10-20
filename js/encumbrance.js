/*
 * Carga do Forbidden Lands.
 *
 * Puro: não toca no DOM nem na API do TaleSpire.
 *   - Capacidade: o dobro da Força base (o máximo, não o valor atual com
 *     dano), mais os itens extras do talento Empacotador.
 *   - Peso de cada item: pequeno não conta, leve vale meio, normal vale um,
 *     pesado vale dois. "nenhum" é para recipientes (mochila, saco, cantil),
 *     que não contam.
 *   - Acima da capacidade o personagem está sobrecarregado.
 */
(function (root) {
  "use strict";

  var WEIGHTS = {
    nenhum: { label: "Não pesa", value: 0 },
    pequeno: { label: "Pequeno", value: 0 },
    leve: { label: "Leve", value: 0.5 },
    normal: { label: "Normal", value: 1 },
    pesado: { label: "Pesado", value: 2 }
  };
  var ORDER = ["pequeno", "leve", "normal", "pesado", "nenhum"];

  // Empacotador: categoria 1, 2 e 3 dão 2, 5 e 10 itens a mais no total.
  var PACKER_BONUS = [0, 2, 5, 10];

  function weightOf(item) {
    var w = WEIGHTS[item && item.weight] || WEIGHTS.normal;
    var qty = Math.max(1, (item && item.qty) | 0 || 1);
    return w.value * qty;
  }

  function capacity(strengthMax, packerRank) {
    var rank = Math.max(0, Math.min(3, packerRank | 0));
    return Math.max(0, strengthMax | 0) * 2 + PACKER_BONUS[rank];
  }

  function load(items) {
    return (items || []).reduce(function (sum, it) { return sum + weightOf(it); }, 0);
  }

  function status(items, strengthMax, packerRank) {
    var cap = capacity(strengthMax, packerRank);
    var used = load(items);
    return {
      used: used,
      capacity: cap,
      free: cap - used,
      over: used > cap,
      packerBonus: PACKER_BONUS[Math.max(0, Math.min(3, packerRank | 0))]
    };
  }

  /* Mostra meio item como "½": 3.5 -> "3½". */
  function fmt(n) {
    var whole = Math.floor(n), half = n - whole >= 0.5;
    if (!half) return String(whole);
    return (whole ? whole : "") + "½";
  }

  var api = { WEIGHTS: WEIGHTS, ORDER: ORDER, PACKER_BONUS: PACKER_BONUS, weightOf: weightOf, capacity: capacity, load: load, status: status, fmt: fmt };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.FLEncumbrance = api;
})(typeof window !== "undefined" ? window : this);
