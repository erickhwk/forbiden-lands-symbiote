/*
 * Resumo da ficha para o painel do Mestre.
 *
 * Puro: monta um objeto compacto que cabe numa mensagem do TS.sync
 * (500 caracteres de JSON) e o lê de volta. Se não couber, vai tirando
 * detalhes: primeiro os efeitos dos ferimentos, depois ferimentos que não
 * são letais, por fim corta nomes.
 *
 * Formato (chaves curtas para caber):
 *   n  nome            a  [cur,max] × 4 (Força, Agilidade, Astúcia, Empatia)
 *   w  Força de Vontade c  condições ativas (bits: 1 faminto, 2 desidratado, 4 insone, 8 hipotérmico)
 *   i  ferimentos [[nome, letal pendente 0/1, prazo, dias (-1 permanente, -2 sem prazo)]]
 *   r  Dados de Recurso [comida, água, flechas, tochas]
 *   l  carga [usado × 2, capacidade]     ar Valor de Armadura vestido
 *   x  [XP disponível, total]            rp Reputação
 */
(function (root) {
  "use strict";

  var ATTRS = ["forca", "agilidade", "astucia", "empatia"];
  var CONDS = ["faminto", "sedento", "exausto", "congelando"];
  var RES = ["comida", "agua", "flechas", "tochas", "oleo"];
  var LIMIT = 440;  // deixa folga para o envelope da mensagem (500 no total)

  function encode(sheet, derived) {
    derived = derived || {};
    var a = [];
    ATTRS.forEach(function (k) {
      var v = sheet.attrs && sheet.attrs[k] || { cur: 0, max: 0 };
      a.push(v.cur | 0, v.max | 0);
    });
    var c = 0;
    CONDS.forEach(function (k, i) { if (sheet.conditions && sheet.conditions[k]) c |= 1 << i; });
    var injuries = (sheet.injuries || []).map(function (x) {
      return [String(x.name || ""), x.lethal && !x.saved ? 1 : 0, String(x.limit || ""), x.perm ? -1 : x.heal == null ? -2 : x.heal | 0];
    });
    var out = {
      n: String(sheet.name || "Personagem"),
      a: a,
      w: sheet.willpower | 0,
      c: c,
      i: injuries,
      r: RES.map(function (k) { return (sheet.resources && sheet.resources[k]) | 0; }),
      l: [Math.round((derived.loadUsed || 0) * 2), derived.loadCap | 0],
      ar: derived.armor | 0,
      x: [sheet.xp | 0, sheet.xpTotal | 0],
      rp: sheet.reputation | 0
    };
    return fit(out);
  }

  function size(o) { return JSON.stringify(o).length; }

  function fit(o) {
    if (size(o) <= LIMIT) return o;
    // 1. ferimentos sem prazo de morte saem primeiro
    o.i = o.i.filter(function (x) { return x[1]; }).concat(o.i.filter(function (x) { return !x[1]; }));
    while (size(o) > LIMIT && o.i.length && !o.i[o.i.length - 1][1]) o.i.pop();
    // 2. encurta nomes
    var len = 24;
    while (size(o) > LIMIT && len > 6) {
      o.i.forEach(function (x) { x[0] = x[0].slice(0, len); });
      o.n = o.n.slice(0, Math.max(len, 12));
      len -= 4;
    }
    // 3. último recurso: só os letais
    while (size(o) > LIMIT && o.i.length) o.i.pop();
    return o;
  }

  function decode(d) {
    if (!d || !Array.isArray(d.a)) return null;
    var attrs = {};
    ATTRS.forEach(function (k, i) { attrs[k] = { cur: d.a[i * 2] | 0, max: d.a[i * 2 + 1] | 0 }; });
    var conds = CONDS.filter(function (k, i) { return (d.c | 0) & (1 << i); });
    var res = {};
    RES.forEach(function (k, i) { res[k] = (d.r && d.r[i]) | 0; });
    return {
      name: String(d.n || "Personagem"),
      attrs: attrs,
      willpower: d.w | 0,
      conditions: conds,
      injuries: (d.i || []).map(function (x) {
        return { name: String(x[0] || ""), lethal: !!x[1], limit: String(x[2] || ""), heal: x[3] };
      }),
      resources: res,
      loadUsed: ((d.l && d.l[0]) | 0) / 2,
      loadCap: (d.l && d.l[1]) | 0,
      armor: d.ar | 0,
      xp: (d.x && d.x[0]) | 0,
      xpTotal: (d.x && d.x[1]) | 0,
      reputation: d.rp | 0
    };
  }

  var api = { encode: encode, decode: decode, LIMIT: LIMIT, size: size };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.FLSummary = api;
})(typeof window !== "undefined" ? window : this);
