// Rode com: node --test test/
const test = require("node:test");
const assert = require("node:assert");
const E = require("../js/engine.js");

const d = (type, value, sides = 6) => ({ type, sides, value });

test("monta o pool com atributo, perícia, equipamento e artefato", () => {
  const groups = E.buildPool({ attribute: 5, skill: 3, modifier: -1, gear: 2, artifacts: [10] });
  assert.deepStrictEqual(groups, [
    { type: "attribute", sides: 6, count: 5 },
    { type: "skill", sides: 6, count: 2 },
    { type: "gear", sides: 6, count: 2 },
    { type: "artifact", sides: 10, count: 1 }
  ]);
});

test("perícia + modificador negativo vira dados negativos", () => {
  const groups = E.buildPool({ attribute: 3, skill: 0, modifier: -2 });
  assert.deepStrictEqual(groups[1], { type: "negative", sides: 6, count: 2 });
});

test("dados de artefato valem mais sucessos nas faces altas", () => {
  assert.strictEqual(E.successesOf(d("artifact", 7, 8)), 1);
  assert.strictEqual(E.successesOf(d("artifact", 8, 8)), 2);
  assert.strictEqual(E.successesOf(d("artifact", 10, 10)), 3);
  assert.strictEqual(E.successesOf(d("artifact", 12, 12)), 4);
  assert.strictEqual(E.successesOf(d("artifact", 5, 12)), 0);
});

test("danos não têm efeito sem forçar", () => {
  const r = E.evaluate([d("attribute", 6), d("attribute", 1), d("gear", 1)], false);
  assert.strictEqual(r.successes, 1);
  assert.strictEqual(r.attrBanes, 1);
  assert.strictEqual(r.attributeDamage, 0);
  assert.strictEqual(r.gearDamage, 0);
});

test("danos contam depois de forçar e dão Força de Vontade", () => {
  const r = E.evaluate([d("attribute", 1), d("attribute", 1), d("gear", 1), d("skill", 6)], true);
  assert.strictEqual(r.successes, 1);
  assert.strictEqual(r.attributeDamage, 2);
  assert.strictEqual(r.willpowerGained, 2);
  assert.strictEqual(r.gearDamage, 1);
  assert.strictEqual(r.canPush, false);
});

test("1 em perícia não é dano e volta ao forçar", () => {
  const dice = [d("attribute", 6), d("attribute", 1), d("attribute", 3), d("skill", 1), d("gear", 4)];
  assert.deepStrictEqual(E.pushIndices(dice), [2, 3, 4]);
});

test("dados negativos anulam sucessos sem ficar abaixo de zero", () => {
  const r = E.evaluate([d("attribute", 6), d("negative", 6), d("negative", 6)], false);
  assert.strictEqual(r.successes, 0);
  assert.strictEqual(r.cancelled, 2);
});

test("aplicar forçar troca só os dados re-rolados", () => {
  const dice = [d("attribute", 6), d("attribute", 3), d("skill", 2), d("gear", 1), d("gear", 5)];
  const groups = E.pushGroups(dice);
  assert.deepStrictEqual(groups.map((g) => [g.type, g.indices]), [
    ["attribute", [1]],
    ["skill", [2]],
    ["gear", [4]]
  ]);
  const next = E.applyPush(dice, groups, [[1], [6], [6]]);
  assert.deepStrictEqual(next.map((x) => x.value), [6, 1, 6, 1, 6]);
  const r = E.evaluate(next, true);
  assert.strictEqual(r.successes, 3);
  assert.strictEqual(r.attributeDamage, 1);
  assert.strictEqual(r.gearDamage, 1);
});

test("rolagem local respeita os lados", () => {
  let i = 0;
  const rng = () => [0, 0.999][i++ % 2];
  const dice = E.rollGroups([{ type: "artifact", sides: 12, count: 2 }], rng);
  assert.deepStrictEqual(dice.map((x) => x.value), [1, 12]);
});
