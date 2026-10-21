const test = require("node:test");
const assert = require("node:assert");
const B = require("../js/bestiary.js");
const I = require("../js/initiative.js");

test("cada monstro tem tabela de seis ataques", () => {
  B.LIST.filter((m) => m.kind === "monstro").forEach((m) => {
    assert.strictEqual(m.attacks.length, 6, m.name);
    m.attacks.forEach((a) => assert.ok(a.dice === "str" || a.dice >= 0, m.name + " " + a.name));
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
  const a = B.attacks(B.get("lobo"))[0];
  assert.strictEqual(a.dice, 4);
  assert.strictEqual(a.skill, 3);
  assert.strictEqual(B.attackLine(a), "4+3 dados · dano 1 cortante");
});

test("busca ignora acento e põe monstros antes de animais", () => {
  assert.deepStrictEqual(B.search("urso").map((m) => m.id), ["urso-cinzento", "urso"]);
  assert.deepStrictEqual(B.search("mantic").map((m) => m.id), ["manticora"]);
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

test("esqueleto: Força + Luta + bônus da espada", () => {
  const a = B.attacks(B.get("esqueleto"))[0];
  assert.strictEqual(B.attackLine(a), "3+3+2 dados · dano 2 cortante");
});

test("ataque que rola a Força do bando", () => {
  const a = B.get("harpias").attacks[1];
  assert.strictEqual(B.baseDice(a, 9), 9);
  assert.strictEqual(B.baseDice({ dice: 7 }, 9), 7);
});

test("dano em outro atributo conta 1 por sucesso", () => {
  assert.deepStrictEqual(B.resolve({ dice: 7, attr: "Empatia" }, 3), { hit: true, dmg: 3, attr: "Empatia" });
});

test("tabela de encontro cobre 11 a 66", () => {
  for (let t = 1; t <= 6; t++) for (let u = 1; u <= 6; u++) {
    const id = B.encounter(t * 10 + u);
    assert.ok(id === "demonio" || B.get(id), t * 10 + u + " → " + id);
  }
});

test("ids únicos", () => {
  const ids = B.LIST.map((m) => m.id);
  assert.strictEqual(new Set(ids).size, ids.length);
});

test("gerador de demônio cobre todas as faixas e produz fichas válidas", () => {
  ["forms", "abilities", "attacks", "specials", "weaknesses"].forEach((k) => {
    for (let t = 1; t <= 6; t++) for (let u = 1; u <= 6; u++) {
      const code = t * 10 + u;
      assert.ok(B.DEMON[k].some((r) => code >= r[0] && code <= r[1]), k + " " + code);
    }
  });
  let seed = 7;
  const rng = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  for (let i = 0; i < 300; i++) {
    const d = B.demon(rng);
    assert.ok(d.str >= 3 && d.str <= 24, "Força " + d.str);
    assert.ok(d.attacks.length >= 2, "ataques");
    d.attacks.forEach((a) => {
      assert.ok(a.dice > 0, a.name);
      assert.ok(a.fear || a.dmg >= 1, a.name + " dano");
    });
    assert.ok(d.traits.some((t) => t.weak), "fraqueza");
  }
});

test("demônio gerado entra na busca e no get", () => {
  const d = B.demon(() => 0.5);
  B.setCustom([d]);
  assert.strictEqual(B.get(d.id), d);
  assert.strictEqual(B.search("")[0].id, d.id);
  B.setCustom([]);
  assert.strictEqual(B.get(d.id), null);
});
