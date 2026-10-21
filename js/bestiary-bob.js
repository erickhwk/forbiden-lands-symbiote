/*
 * Bestiário: monstros do Book of Beasts (Fria Ligan, 2023).
 *
 * Mesmo formato de bestiary.js: só números e mecânica, efeitos resumidos com
 * palavras nossas. Página = página impressa do livro (em inglês).
 * Carregar antes de bestiary.js.
 */
(function (root) {
  "use strict";

  var LIST = [];

  /* Tabela de encontro (D66), p. 5. */
  var ENCOUNTER = [];

  var api = { src: "bob", LIST: LIST, ENCOUNTER: ENCOUNTER };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.FLBookOfBeasts = api;
})(typeof window !== "undefined" ? window : this);
