const test = require("node:test");
const assert = require("node:assert");
const J = require("../js/journey.js");

test("luz por estação segue a tabela do livro", () => {
  const dark = (s) => [0, 1, 2, 3].filter((q) => !J.isLight(s, q)).map((q) => J.QUARTERS[q]);
  assert.deepStrictEqual(dark("verao"), ["Noite"]);
  assert.deepStrictEqual(dark("primavera"), ["Anoitecer", "Noite"]);
  assert.deepStrictEqual(dark("outono"), ["Anoitecer", "Noite"]);
  assert.deepStrictEqual(dark("inverno"), ["Manhã", "Anoitecer", "Noite"]);
});

test("caminhada: 2 a pé e 3 montado no aberto, 1 no dificultoso", () => {
  assert.deepStrictEqual(J.moves("planicies"), { foot: 2, mounted: 3 });
  assert.deepStrictEqual(J.moves("floresta-sombria"), { foot: 1, mounted: 1 });
  assert.deepStrictEqual(J.moves("lago-rio"), { foot: 0, mounted: 0 });
});

test("marcha forçada: 3º Quarto pede Resiliência, 4º com −2 e Insone", () => {
  assert.strictEqual(J.forcedMarch(1), null);
  assert.deepStrictEqual(J.forcedMarch(2), { mod: 0, sleepless: false });
  assert.deepStrictEqual(J.forcedMarch(3), { mod: -2, sleepless: true });
});

test("modificadores: desbravar no escuro, coletar com terreno e estação, caçar com terreno", () => {
  assert.strictEqual(J.activityMod("desbravar", "floresta", "inverno", 0), -2);
  assert.strictEqual(J.activityMod("desbravar", "floresta", "inverno", 1), 0);
  assert.strictEqual(J.activityMod("coletar", "floresta", "outono", 1), 2);
  assert.strictEqual(J.activityMod("coletar", "montanhas", "inverno", 1), -4);
  assert.strictEqual(J.activityMod("coletar", "lago-rio", "verao", 1), null);
  assert.strictEqual(J.activityMod("cacar", "planicies", "inverno", 1), 1);
});

test("avisa atividade solo repetida, grupo dividido e falta de vigia", () => {
  const w = J.check({ a: "desbravar", b: "desbravar", c: "descansar" });
  assert.ok(w.some((x) => x.includes("Só uma pessoa")));
  assert.ok(w.some((x) => x.includes("Nem todos")));
  assert.ok(w.some((x) => x.includes("vigiando")));
  assert.deepStrictEqual(J.check({ a: "desbravar", b: "vigiar", c: "caminhar" }), []);
});
