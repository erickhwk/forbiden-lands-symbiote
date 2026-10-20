const test = require("node:test");
const assert = require("node:assert");
const I = require("../js/injuries.js");

test("cada tabela cobre o D66 inteiro, de 11 a 66", () => {
  for (const t of Object.keys(I.TABLES)) {
    for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) {
      assert.ok(I.lookup(t, a * 10 + b), t + " " + (a * 10 + b));
    }
  }
});

test("tipo de dano escolhe a tabela", () => {
  assert.strictEqual(I.BY_DAMAGE.corte, "laceracao");
  assert.strictEqual(I.BY_DAMAGE.perfuracao, "perfuracao");
  assert.strictEqual(I.BY_DAMAGE.esmagamento, "concussivo");
});

test("ferimento letal traz prazo e modificador da Cura", () => {
  const r = I.lookup("perfuracao", 61);
  assert.strictEqual(r.lethal, true);
  assert.strictEqual(r.limit, "D6 minutos");
  assert.strictEqual(r.healMod, -1);
  assert.strictEqual(I.lookup("laceracao", 11).lethal, false);
});

test("morte imediata é reconhecida", () => {
  assert.strictEqual(I.lookup("perfuracao", 64).instant, true);
  assert.strictEqual(I.lookup("laceracao", 44).instant, false);
});

test("regra do elmo só nos resultados certos", () => {
  assert.ok(I.helmetApplies("laceracao", 65));
  assert.ok(!I.helmetApplies("laceracao", 64));
  assert.ok(I.helmetApplies("concussivo", 66));
  assert.ok(!I.helmetApplies("horror", 66));
});

test("prazo e tempo de cura rolados", () => {
  assert.strictEqual(I.rollLimit("D6 horas", () => 0.99), "6 horas");
  assert.strictEqual(I.rollLimit("D6 horas", () => 0), "1 hora");
  assert.strictEqual(I.rollDice("2D6", () => 0.99), 12);
  assert.strictEqual(I.rollDice("perm"), null);
  assert.strictEqual(I.halve(7), 4);
});
