const test = require("node:test");
const assert = require("node:assert");
const S = require("../js/summary.js");

const sheet = {
  name: "Ylva Corvo-de-Cinza",
  attrs: { forca: { cur: 0, max: 4 }, agilidade: { cur: 5, max: 5 }, astucia: { cur: 3, max: 3 }, empatia: { cur: 2, max: 2 } },
  willpower: 3,
  conditions: { faminto: true, sedento: false, exausto: true, congelando: false },
  injuries: [{ name: "Pulmão perfurado", lethal: true, saved: false, limit: "3 dias", heal: 5 }],
  resources: { comida: 8, agua: 6, flechas: 10, tochas: 0 },
  xp: 6, xpTotal: 12, reputation: 2
};

test("ida e volta preserva o essencial", () => {
  const d = S.decode(JSON.parse(JSON.stringify(S.encode(sheet, { loadUsed: 7.5, loadCap: 8, armor: 3 }))));
  assert.strictEqual(d.name, "Ylva Corvo-de-Cinza");
  assert.deepStrictEqual(d.attrs.forca, { cur: 0, max: 4 });
  assert.deepStrictEqual(d.conditions, ["faminto", "exausto"]);
  assert.deepStrictEqual(d.injuries[0], { name: "Pulmão perfurado", lethal: true, limit: "3 dias", heal: 5 });
  assert.strictEqual(d.loadUsed, 7.5);
  assert.strictEqual(d.armor, 3);
  assert.deepStrictEqual([d.xp, d.xpTotal, d.reputation], [6, 12, 2]);
});

test("ferimento salvo não aparece como letal pendente", () => {
  const s2 = Object.assign({}, sheet, { injuries: [{ name: "X", lethal: true, saved: true, heal: 2 }] });
  assert.strictEqual(S.decode(S.encode(s2)).injuries[0].lethal, false);
});

test("muitos ferimentos ainda cabem na mensagem, mantendo os letais", () => {
  const many = [];
  for (let i = 0; i < 30; i++) many.push({ name: "Ferimento comprido número " + i, lethal: i === 29, saved: false, limit: "6 horas", heal: 9 });
  const enc = S.encode(Object.assign({}, sheet, { injuries: many }));
  assert.ok(S.size(enc) <= S.LIMIT, "tamanho " + S.size(enc));
  assert.ok(S.decode(enc).injuries.some((x) => x.lethal));
});
