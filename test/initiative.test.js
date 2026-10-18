const test = require("node:test");
const assert = require("node:assert");
const I = require("../js/initiative.js");

// rng que não embaralha: o baralho fica 1..10 na ordem.
const noShuffle = () => 0.9999999;

function combat(names) {
  const c = I.create();
  names.forEach((n) => I.addEntry(c, typeof n === "string" ? { name: n } : n));
  return c;
}

test("cada combatente compra uma carta diferente e a menor age primeiro", () => {
  const c = combat(["Nirmena", "Tyrgar", "Orc"]);
  assert.strictEqual(I.deal(c), null);
  const cards = c.entries.map((e) => e.card);
  assert.strictEqual(new Set(cards).size, 3);
  assert.strictEqual(c.phase, "running");
  assert.strictEqual(c.round, 1);
  assert.strictEqual(I.current(c).card, Math.min(...cards));
});

test("quem tem carta extra compra antes e escolhe", () => {
  const c = combat(["Orc", { name: "Ylva", extra: 1 }]);
  const pending = I.deal(c, noShuffle);
  const ylva = c.entries[1];
  assert.strictEqual(pending, ylva.id);
  assert.deepStrictEqual(ylva.options, [1, 2]);
  assert.strictEqual(c.entries[0].card, null, "o orc ainda não comprou");
  assert.strictEqual(c.phase, "dealing");

  I.choose(c, ylva.id, 2, noShuffle);
  assert.strictEqual(ylva.card, 2);
  // a carta 1 voltou ao baralho e o orc compra depois
  assert.ok(c.entries[0].card !== null);
  assert.ok(c.entries[0].card !== 2);
  assert.strictEqual(c.phase, "running");
});

test("escolha padrão fica com a menor carta", () => {
  const c = combat([{ name: "Ylva", extra: 2 }]);
  const id = I.deal(c, noShuffle);
  I.chooseBest(c, id);
  assert.strictEqual(c.entries[0].card, 1);
  assert.strictEqual(c.deck.length, 9);
});

test("turnos avançam e viram rodada, zerando as ações", () => {
  const c = combat(["A", "B"]);
  I.deal(c);
  const [first, second] = I.sorted(c);
  I.toggleAction(c, first.id, "fast");
  assert.strictEqual(first.fast, true);
  I.next(c);
  assert.strictEqual(c.currentId, second.id);
  I.next(c);
  assert.strictEqual(c.round, 2);
  assert.strictEqual(c.currentId, first.id);
  assert.strictEqual(first.fast, false);
});

test("troca entre personagens vale na hora; fintar só na próxima rodada", () => {
  const c = combat(["A", "B"]);
  I.deal(c);
  const [a, b] = c.entries;
  const ca = a.card, cb = b.card;
  I.swap(c, a.id, b.id, false);
  assert.deepStrictEqual([a.card, b.card], [cb, ca]);

  I.swap(c, a.id, b.id, true);
  assert.deepStrictEqual([a.card, b.card], [cb, ca], "ainda não trocou");
  I.next(c); I.next(c); // fecha a rodada
  assert.deepStrictEqual([a.card, b.card], [ca, cb]);
});

test("mais de dez combatentes: quem sobra fica sem carta", () => {
  const names = Array.from({ length: 12 }, (_, i) => "C" + i);
  const c = combat(names);
  I.deal(c);
  assert.strictEqual(I.sorted(c).length, 10);
  assert.strictEqual(I.waiting(c).length, 2);
});

test("quem entra no meio do combate compra do que sobrou", () => {
  const c = combat(["A", "B"]);
  I.deal(c);
  const late = I.addLate(c, { name: "Lobo" });
  assert.ok(late.card !== null);
  assert.strictEqual(new Set(c.entries.map((e) => e.card)).size, 3);
});

test("remover devolve a carta ao baralho", () => {
  const c = combat(["A", "B"]);
  I.deal(c);
  const before = c.deck.length;
  I.removeEntry(c, c.entries[0].id);
  assert.strictEqual(c.deck.length, before + 1);
  assert.strictEqual(c.entries.length, 1);
});
