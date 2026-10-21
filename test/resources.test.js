const test = require("node:test");
const assert = require("node:assert");
const R = require("../js/resources.js");

test("1 ou 2 desce um passo; 3 ou mais mantém", () => {
  assert.deepStrictEqual(R.use(10, 2), { value: 2, before: 10, after: 8, dropped: true, empty: false });
  assert.deepStrictEqual(R.use(10, 1).after, 8);
  assert.deepStrictEqual(R.use(10, 3), { value: 3, before: 10, after: 10, dropped: false, empty: false });
});

test("1 ou 2 no D6 esgota o recurso", () => {
  const r = R.use(6, 1);
  assert.strictEqual(r.after, 0);
  assert.strictEqual(r.empty, true);
});

test("sem dado não dá para usar", () => {
  assert.strictEqual(R.use(0, 4), null);
});

test("subir e descer passos respeita D6 a D12", () => {
  assert.strictEqual(R.step(0, 1), 6);
  assert.strictEqual(R.step(12, 1), 12);
  assert.strictEqual(R.step(6, -1), 0);
  assert.strictEqual(R.step(8, 1), 10);
});

test("dados iniciais da profissão", () => {
  assert.deepStrictEqual(R.startFor("cacador"), { comida: 8, agua: 8, flechas: 10, tochas: 0, oleo: 0 });
  assert.deepStrictEqual(R.startFor("ladino"), { comida: 6, agua: 6, flechas: 0, tochas: 0, oleo: 0 });
  assert.deepStrictEqual(R.startFor(""), R.empty());
});

test("na carga, cada consumível com dado vale um item", () => {
  assert.strictEqual(R.loadOf({ comida: 12, agua: 6, flechas: 0, tochas: 0 }), 2);
});

test("rolagem local respeita os lados", () => {
  assert.strictEqual(R.roll(8, () => 0.9999), 8);
  assert.strictEqual(R.roll(8, () => 0), 1);
});

test("óleo (regra da mesa) só aparece com lanterna, lamparina ou óleo guardado", () => {
  const oleo = R.kind("oleo");
  assert.strictEqual(R.shows(oleo, { oleo: 0 }, ["Arco Longo"]), false);
  assert.strictEqual(R.shows(oleo, { oleo: 0 }, ["Lanterna"]), true);
  assert.strictEqual(R.shows(oleo, { oleo: 0 }, ["Lamparina a Óleo"]), true);
  assert.strictEqual(R.shows(oleo, { oleo: 6 }, []), true);
  assert.strictEqual(R.shows(R.kind("tochas"), { tochas: 0 }, []), true);
  assert.strictEqual(R.loadOf({ comida: 8, oleo: 6 }), 2);
});
