const test = require("node:test");
const assert = require("node:assert");
const B = require("../js/bestiary.js");
const I = require("../js/initiative.js");

test("cada monstro tem tabela de seis ataques", () => {
  B.LIST.filter((m) => m.kind === "monstro").forEach((m) => {
    assert.strictEqual(m.attacks.length, 6, m.name);
    m.attacks.forEach((a) => assert.ok(a.dice > 0, m.name + " " + a.name));
  });
});

test("dano do monstro: +1 por sucesso além do primeiro", () => {
  const a = { dice: 9, dmg: 2 };
  assert.deepStrictEqual(B.resolve(a, 0), { hit: false, dmg: 0, attr: "Força" });
  assert.deepStrictEqual(B.resolve(a, 1), { hit: true, dmg: 2, attr: "Força" });
  assert.deepStrictEqual(B.resolve(a, 3), { hit: true, dmg: 4, attr: "Força" });
});

test("ataque de medo: cada sucesso tira 1 de Astúcia", () => {
  assert.deepStrictEqual(B.resolve({ dice: 7, fear: true }, 2), { hit: true, dmg: 2, attr: "Astúcia" });
});

test("animal ataca com Força + Luta", () => {
  const a = B.animalAttack(B.get("lobo"));
  assert.strictEqual(a.dice, 4);
  assert.strictEqual(a.skill, 3);
  assert.strictEqual(B.attackLine(a), "4+3 dados · dano 1 cortante");
});

test("busca ignora acento e põe monstros antes de animais", () => {
  assert.deepStrictEqual(B.search("urso").map((m) => m.id), ["urso-cinzento"]);
  assert.strictEqual(B.search("")[0].kind, "monstro");
});

test("Força por cópia na Iniciativa", () => {
  const c = I.create();
  const e = I.addEntry(c, { name: "Warg", kind: "npc", count: 3, mon: "warg-da-noite", hpMax: 8 });
  assert.deepStrictEqual(e.hp, [8, 8, 8]);
  I.setHp(c, e.id, 1, -10);
  I.setHp(c, e.id, 0, 5);
  assert.deepStrictEqual(e.hp, [8, 0, 8]);
  assert.strictEqual(I.down(e), false);
  I.setHp(c, e.id, 0, -8); I.setHp(c, e.id, 2, -8);
  assert.strictEqual(I.down(e), true);
  assert.strictEqual(I.addEntry(c, { name: "Orc" }).hp, null);
});
