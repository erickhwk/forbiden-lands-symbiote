const test = require("node:test");
const assert = require("node:assert");
const C = require("../js/encumbrance.js");

test("capacidade é o dobro da Força base", () => {
  assert.strictEqual(C.capacity(3, 0), 6);
  assert.strictEqual(C.capacity(5, 0), 10);
});

test("Empacotador soma 2, 5 e 10 itens", () => {
  assert.deepStrictEqual([1, 2, 3].map((r) => C.capacity(3, r)), [8, 11, 16]);
});

test("pesos: pequeno e recipientes não contam, leve vale meio, pesado vale dois", () => {
  const items = [
    { weight: "pequeno" }, { weight: "nenhum" },
    { weight: "leve" }, { weight: "leve" },
    { weight: "normal" }, { weight: "pesado" }
  ];
  assert.strictEqual(C.load(items), 4);
});

test("item sem peso conta como normal; quantidade multiplica", () => {
  assert.strictEqual(C.load([{}, { weight: "leve", qty: 3 }]), 2.5);
});

test("sobrecarregado só acima da capacidade", () => {
  const items = Array.from({ length: 6 }, () => ({ weight: "normal" }));
  assert.strictEqual(C.status(items, 3, 0).over, false);
  items.push({ weight: "leve" });
  const s = C.status(items, 3, 0);
  assert.strictEqual(s.over, true);
  assert.strictEqual(s.used, 6.5);
});

test("formatação de meio item", () => {
  assert.deepStrictEqual([0, 0.5, 3, 3.5].map(C.fmt), ["0", "½", "3", "3½"]);
});
