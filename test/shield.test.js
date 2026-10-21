const test = require("node:test");
const assert = require("node:assert");
const S = require("../js/shield.js");

test("cada tabela cobre todos os resultados do dado, sem buracos", () => {
  S.TABLES.forEach((t) => {
    const codes = t.die === "d66" ? S.d66Codes() : [1, 2, 3, 4, 5, 6];
    codes.forEach((c) => assert.ok(S.lookup(t, c), t.key + " " + c));
  });
});

test("faixas do livro: desbravar 22-26 é Perdidos, acampamento 41-42 é Incêndio", () => {
  assert.strictEqual(S.lookup(S.table("desbravar"), 24).name, "Perdidos");
  assert.strictEqual(S.lookup(S.table("acampamento"), 42).name, "Incêndio!");
  assert.strictEqual(S.lookup(S.table("caca"), 5).name, "Javali");
});

test("pedidos de rolagem usam chaves de perícia da ficha", () => {
  const skills = ["potencia", "resistencia", "combate", "oficios", "furtividade", "prestidigitacao", "movimento", "pontaria",
    "exploracao", "conhecimento", "sobrevivencia", "perspicacia", "manipulacao", "atuacao", "cura", "animais"];
  S.TABLES.forEach((t) => t.rows.forEach((r) => { if (r[4]) assert.ok(skills.includes(r[4].c), t.key + " " + r[2]); }));
});

test("tabelas de consulta têm linhas do mesmo tamanho do cabeçalho", () => {
  S.SECTIONS.forEach((s) => s.blocks.forEach((b) => {
    if (b.table) b.table.forEach((row) => assert.strictEqual(row.length, b.table[0].length, s.key + " " + b.title));
  }));
});

test("busca ignora acentos e maiúsculas", () => {
  const r = S.search("ESQUIVAR");
  assert.ok(r.length > 0);
  assert.ok(S.search("afogamento").some((x) => x.block.title.includes("afogamento")));
  assert.strictEqual(S.search("").length, S.SECTIONS.reduce((n, s) => n + s.blocks.length, 0));
});
