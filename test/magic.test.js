const test = require("node:test");
const assert = require("node:assert");
const M = require("../js/magic.js");

test("catálogo segue as tabelas do livro", () => {
  const count = {};
  M.SPELLS.forEach((s) => { count[s.path] = (count[s.path] || 0) + 1; });
  assert.deepStrictEqual(count, { geral: 6, cura: 9, metamorfose: 8, consciencia: 9, simbolismo: 9, pedra: 9, sangue: 8, morte: 10 });
  M.SPELLS.forEach((s) => assert.ok(s.rank >= 1 && s.rank <= 3 && s.effect, s.id));
  assert.strictEqual(new Set(M.SPELLS.map((s) => s.id)).size, M.SPELLS.length);
});

test("magia geral: categoria do caminho mais alto, só para druida e feiticeiro", () => {
  const talents = [{ id: "caminho-do-sangue", rank: 2 }, { id: "caminho-da-morte", rank: 1 }, { id: "sortudo", rank: 3 }];
  assert.deepStrictEqual(M.access(talents, "feiticeiro"), { sangue: 2, morte: 1, geral: 2 });
  assert.deepStrictEqual(M.access(talents, "guerreiro"), { sangue: 2, morte: 1 });
  assert.deepStrictEqual(M.access([{ id: "sortudo", rank: 1 }], "druida"), {});
});

test("lançamento normal, seguro, arriscado e impossível", () => {
  assert.deepStrictEqual(M.castStatus(1, 3, false), { status: "ok", eff: 1, safeMax: 2 });
  assert.deepStrictEqual(M.castStatus(2, 2, false), { status: "ok", eff: 2, safeMax: 0 });
  assert.strictEqual(M.castStatus(3, 2, false).status, "risky");
  assert.strictEqual(M.castStatus(3, 1, false).status, "blocked");
});

test("grimório conta a magia um passo abaixo", () => {
  assert.strictEqual(M.castStatus(3, 2, true).status, "ok");
  assert.strictEqual(M.castStatus(3, 1, true).status, "risky");
  assert.strictEqual(M.castStatus(2, 2, true).safeMax, 1);
});

test("Poder Mental: o primeiro PFV conta como dois", () => {
  assert.strictEqual(M.countedWp(2, true), 3);
  assert.strictEqual(M.countedWp(2, false), 2);
  assert.strictEqual(M.baseDice(3, false, 2), 1);
  assert.strictEqual(M.baseDice(1, false, 2), 0);
});

test("exemplo do livro: 2 PFV de meia-elfa, um 6, dois 1 e tocha dão poder 5 com infortúnio", () => {
  const r = M.resolve({ pfv: 2, psychic: true, values: [6, 1, 1], ingredient: true });
  assert.strictEqual(r.power, 5);
  assert.strictEqual(r.overcharge, 1);
  assert.strictEqual(r.mishap, true);
});

test("arriscado sempre traz infortúnio; sem 1, sem infortúnio", () => {
  assert.strictEqual(M.resolve({ pfv: 1, values: [4], risky: true }).mishap, true);
  assert.strictEqual(M.resolve({ pfv: 2, values: [3, 5] }).mishap, false);
});

test("tabela de infortúnios cobre todo o D66", () => {
  for (let t = 1; t <= 6; t++) for (let u = 1; u <= 6; u++) assert.ok(M.mishap(M.d66(t, u)), "" + t + u);
  assert.deepStrictEqual(M.mishap(43).code, 43);
  assert.deepStrictEqual(M.mishap(52).auto, { injury: "horror" });
});
