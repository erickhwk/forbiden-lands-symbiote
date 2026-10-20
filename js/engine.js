/*
 * Motor de regras de dados do Forbidden Lands.
 *
 * Puro: não toca no DOM nem na API do TaleSpire. Recebe e devolve dados,
 * então pode ser reaproveitado por outra interface (um app de celular,
 * um bot, testes) sem mudanças.
 *
 * Um dado é sempre { type, sides, value }.
 *   type: "attribute" | "skill" | "gear" | "artifact" | "negative"
 */
(function (root) {
  "use strict";

  var TYPES = {
    attribute: { label: "Atributo", sides: 6 },
    skill: { label: "Perícia", sides: 6 },
    gear: { label: "Equipamento", sides: 6 },
    artifact: { label: "Artefato", sides: null }, // d8, d10 ou d12
    negative: { label: "Negativo", sides: 6 }
  };

  var ARTIFACT_SIDES = [8, 10, 12];

  /* Quantos sucessos um dado vale. Dados negativos devolvem 0: eles anulam, não somam. */
  function successesOf(die) {
    if (die.type === "negative") return 0;
    if (die.value < 6) return 0;
    if (die.type !== "artifact") return 1;
    if (die.value >= 12) return 4;
    if (die.value >= 10) return 3;
    if (die.value >= 8) return 2;
    return 1;
  }

  /* Dano (1) só existe em dados de atributo e de equipamento. */
  function isBane(die) {
    return die.value === 1 && (die.type === "attribute" || die.type === "gear");
  }

  function cancelsSuccess(die) {
    return die.type === "negative" && die.value >= 6;
  }

  /* Ao forçar, re-rola todo dado que não mostra sucesso nem dano. */
  function isLocked(die) {
    return die.value >= 6 || isBane(die);
  }

  /*
   * Monta a lista de grupos a rolar.
   *   attribute: valor atual do atributo
   *   skill:     nível da perícia (0 se rolar só atributo)
   *   modifier:  bônus/penalidade; mexe nos dados de perícia
   *   gear:      bônus do equipamento
   *   artifacts: lista de lados, ex. [8] ou [10, 8]
   * Se perícia + modificador ficar negativo, vira dados negativos.
   */
  function buildPool(opts) {
    var attribute = Math.max(0, opts.attribute | 0);
    var skillTotal = (opts.skill | 0) + (opts.modifier | 0);
    var gear = Math.max(0, opts.gear | 0);
    var artifacts = (opts.artifacts || []).filter(function (s) {
      return ARTIFACT_SIDES.indexOf(s) !== -1;
    });

    var groups = [];
    if (attribute > 0) groups.push({ type: "attribute", sides: 6, count: attribute });
    if (skillTotal > 0) groups.push({ type: "skill", sides: 6, count: skillTotal });
    if (skillTotal < 0) groups.push({ type: "negative", sides: 6, count: -skillTotal });
    if (gear > 0) groups.push({ type: "gear", sides: 6, count: gear });
    artifacts.forEach(function (sides) {
      groups.push({ type: "artifact", sides: sides, count: 1 });
    });
    return groups;
  }

  function totalDice(groups) {
    return groups.reduce(function (n, g) { return n + g.count; }, 0);
  }

  /* Notação que o TaleSpire entende para um grupo, ex. "5d6" ou "1d10". */
  function notation(group) {
    return group.count + "d" + group.sides;
  }

  function rollDie(sides, rng) {
    return 1 + Math.floor((rng || Math.random)() * sides);
  }

  /* Rola localmente (sem dados 3D). */
  function rollGroups(groups, rng) {
    var dice = [];
    groups.forEach(function (g) {
      for (var i = 0; i < g.count; i++) {
        dice.push({ type: g.type, sides: g.sides, value: rollDie(g.sides, rng) });
      }
    });
    return dice;
  }

  /*
   * Avalia uma rolagem.
   * Danos só têm efeito se a rolagem foi forçada (regra do Forbidden Lands):
   * cada 1 em atributo causa 1 de dano naquele atributo e dá 1 de Força de
   * Vontade; cada 1 em equipamento reduz o bônus do item em 1.
   */
  function evaluate(dice, pushed) {
    var successes = 0, cancelled = 0, attrBanes = 0, gearBanes = 0;
    dice.forEach(function (d) {
      successes += successesOf(d);
      if (cancelsSuccess(d)) cancelled++;
      if (isBane(d) && d.type === "attribute") attrBanes++;
      if (isBane(d) && d.type === "gear") gearBanes++;
    });
    var net = Math.max(0, successes - cancelled);
    return {
      successes: net,
      rawSuccesses: successes,
      cancelled: cancelled,
      attrBanes: attrBanes,
      gearBanes: gearBanes,
      pushed: !!pushed,
      attributeDamage: pushed ? attrBanes : 0,
      willpowerGained: pushed ? attrBanes : 0,
      gearDamage: pushed ? gearBanes : 0,
      canPush: !pushed && pushIndices(dice).length > 0
    };
  }

  /* Índices dos dados que voltam para a mão ao forçar. */
  function pushIndices(dice) {
    var out = [];
    dice.forEach(function (d, i) { if (!isLocked(d)) out.push(i); });
    return out;
  }

  /*
   * Agrupa os índices a forçar por tipo/lados, para montar a bandeja.
   * Devolve [{ type, sides, count, indices: [..] }].
   */
  function pushGroups(dice) {
    var map = {}, order = [];
    pushIndices(dice).forEach(function (i) {
      var d = dice[i], key = d.type + ":" + d.sides;
      if (!map[key]) { map[key] = { type: d.type, sides: d.sides, count: 0, indices: [] }; order.push(key); }
      map[key].count++;
      map[key].indices.push(i);
    });
    return order.map(function (k) { return map[k]; });
  }

  /* Substitui os valores re-rolados. newValues segue a ordem de pushGroups. */
  function applyPush(dice, groups, valuesPerGroup) {
    var next = dice.map(function (d) { return { type: d.type, sides: d.sides, value: d.value }; });
    groups.forEach(function (g, gi) {
      var values = valuesPerGroup[gi] || [];
      g.indices.forEach(function (diceIndex, j) {
        if (values[j] != null) next[diceIndex].value = values[j];
      });
    });
    return next;
  }

  function pushLocally(dice, rng) {
    var groups = pushGroups(dice);
    var values = groups.map(function (g) {
      var v = [];
      for (var i = 0; i < g.count; i++) v.push(rollDie(g.sides, rng));
      return v;
    });
    return applyPush(dice, groups, values);
  }

  /* Dados agrupados por tipo, na ordem de exibição. */
  function byType(dice) {
    var order = ["attribute", "skill", "negative", "gear", "artifact"];
    return order.map(function (t) {
      return { type: t, label: TYPES[t].label, dice: dice.filter(function (d) { return d.type === t; }) };
    }).filter(function (g) { return g.dice.length > 0; });
  }

  /* Dano de um golpe: Dano da Arma mais 1 por sucesso além do primeiro. Sem sucesso, sem dano. */
  function attackDamage(weaponDamage, successes) {
    if (successes < 1) return 0;
    return Math.max(0, weaponDamage | 0) + successes - 1;
  }

  /*
   * Rolagem de armadura (não pode ser forçada).
   * values: faces dos dados de armadura; damage: dano recebido.
   * Cada 6 reduz 1 de dano. Se algum dano passar, cada 1 desgasta a armadura em 1;
   * se a armadura absorver tudo, os 1 não fazem nada.
   */
  function armorRoll(values, damage) {
    var sixes = values.filter(function (v) { return v === 6; }).length;
    var ones = values.filter(function (v) { return v === 1; }).length;
    var taken = Math.max(0, (damage | 0) - sixes);
    return { blocked: Math.min(sixes, damage | 0), taken: taken, armorLoss: taken > 0 ? ones : 0, sixes: sixes, ones: ones };
  }

  function plural(n, one, many) { return n + " " + (n === 1 ? one : many); }

  var api = {
    TYPES: TYPES,
    ARTIFACT_SIDES: ARTIFACT_SIDES,
    buildPool: buildPool,
    totalDice: totalDice,
    notation: notation,
    rollGroups: rollGroups,
    evaluate: evaluate,
    pushIndices: pushIndices,
    pushGroups: pushGroups,
    applyPush: applyPush,
    pushLocally: pushLocally,
    successesOf: successesOf,
    isBane: isBane,
    isLocked: isLocked,
    cancelsSuccess: cancelsSuccess,
    byType: byType,
    attackDamage: attackDamage,
    armorRoll: armorRoll,
    plural: plural
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.FLEngine = api;
})(typeof window !== "undefined" ? window : this);
