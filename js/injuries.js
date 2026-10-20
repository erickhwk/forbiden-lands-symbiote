/*
 * Ferimentos Graves do Forbidden Lands.
 *
 * Puro: não toca no DOM nem na API do TaleSpire.
 *   - Rola-se D66 na tabela do último tipo de dano: laceração (corte),
 *     perfuração, trauma concussivo (esmagamento) ou horror (Astúcia).
 *   - Letal: alguém precisa ter sucesso em Cura antes do prazo, ou o
 *     personagem morre. Alguns pedem a Cura com -1.
 *   - O efeito dura o tempo de cura, em dias. Um sucesso em Cura durante a
 *     recuperação corta o tempo que falta pela metade.
 *   - Elmo: certos resultados (65 em laceração, 64 em perfuração, 64-66 em
 *     concussivo) rolam o Valor de Armadura do elmo; com algum 6, o ferimento
 *     vira 11-12 de trauma concussivo e o elmo cai para zero.
 *
 * Nomes, D66, letalidade e tempos seguem o Manual do Jogador; os efeitos
 * estão resumidos com palavras próprias.
 */
(function (root) {
  "use strict";

  // [de, até, nome, letal, prazo, efeito, cura, modificador da Cura]
  // cura: "" = não precisa, "perm" = permanente, ou dados em dias ("D6", "2D6"...).
  var TABLES = {"laceracao": [
      [11, 12, "Testa sangrando", 0, "", "Nenhum.", ""],
      [13, 14, "Nariz cortado", 0, "", "-1 em Manipulação.", "D6"],
      [15, 16, "Dedo da mão cortado", 0, "", "Não usa armas de duas mãos.", "D6"],
      [21, 22, "Dedo do pé cortado", 0, "", "Correr vira ação lenta.", "2D6"],
      [23, 24, "Coxa sangrando", 0, "", "Correr vira ação lenta.", "D6"],
      [25, 26, "Boca cortada", 0, "", "-2 em Manipulação.", "D6"],
      [31, 32, "Tendão cortado", 0, "", "Correr vira ação lenta.", "2D6"],
      [33, 34, "Ombro ferido", 0, "", "Não usa armas de duas mãos.", "2D6"],
      [35, 36, "Orelha cortada", 0, "", "-1 em Patrulha.", "D6"],
      [41, 42, "Pálpebra cortada", 0, "", "-2 em Pontaria e Patrulha.", "2D6"],
      [43, 44, "Pulmão perfurado", 1, "D6 dias", "-2 em Resiliência e Movimentação.", "D6"],
      [45, 46, "Pé decepado", 1, "D6 dias", "Correr vira ação lenta.", "perm"],
      [51, 52, "Abdômen sangrando", 1, "D6 horas", "1 de dano a cada rolagem de Potência, Movimentação e Luta.", "D6"],
      [53, 54, "Intestino perfurado", 1, "D6 horas", "Doença com Virulência 6.", "2D6"],
      [55, 56, "Braço decepado", 1, "D6 horas", "Não usa armas de duas mãos.", "perm", -1],
      [61, 62, "Perna decepada", 1, "D6 horas", "Correr vira ação lenta.", "perm", -1],
      [63, 64, "Garganta cortada", 1, "D6 rodadas", "-2 em Resiliência.", "D6", -1],
      [65, 65, "Crânio atravessado", 1, "", "Morte imediata.", ""],
      [66, 66, "Decapitação", 1, "", "Morte imediata.", ""]
    ],
    "perfuracao": [
      [11, 13, "Orelha perfurada", 0, "", "Nenhum.", ""],
      [14, 16, "Pé trespassado", 0, "", "Correr vira ação lenta.", "D6"],
      [21, 23, "Mão perfurada", 0, "", "Não usa armas de duas mãos.", "D6"],
      [24, 26, "Bochecha perfurada", 0, "", "-1 em Manipulação.", "D6"],
      [31, 33, "Coxa empalada", 0, "", "Correr vira ação lenta.", "2D6"],
      [34, 34, "Tendão rompido", 0, "", "Correr vira ação lenta.", "3D6"],
      [35, 41, "Ombro empalado", 0, "", "Não usa armas de duas mãos.", "2D6"],
      [42, 43, "Pálpebra perfurada", 0, "", "-2 em Pontaria e Patrulha.", "2D6"],
      [44, 45, "Virilha perfurada", 0, "", "1 de dano a cada rolagem de Movimentação ou Luta.", "2D6"],
      [46, 51, "Pulmão perfurado", 1, "D6 dias", "-2 em Resiliência e Movimentação.", "D6"],
      [52, 54, "Abdômen sangrando", 1, "D6 horas", "1 de dano a cada rolagem de Potência, Movimentação e Luta.", "D6"],
      [55, 56, "Intestino rompido", 1, "D6 horas", "Doença com Virulência 6.", "2D6"],
      [61, 61, "Artéria do braço perfurada", 1, "D6 minutos", "Não usa armas de duas mãos.", "D6", -1],
      [62, 62, "Artéria da perna perfurada", 1, "D6 minutos", "Correr vira ação lenta.", "D6", -1],
      [63, 63, "Pescoço empalado", 1, "D6 rodadas", "-2 em Resiliência.", "2D6", -1],
      [64, 64, "Crânio perfurado", 1, "", "Morte imediata.", ""],
      [65, 66, "Coração empalado", 1, "", "Morte imediata.", ""]
    ],
    "concussivo": [
      [11, 12, "Atordoado", 0, "", "Nenhum.", ""],
      [13, 14, "Esbaforido", 0, "", "Nenhum.", ""],
      [15, 16, "Concussão", 0, "", "-2 em Patrulha.", "D6"],
      [21, 22, "Nariz quebrado", 0, "", "-1 em Manipulação.", "D6"],
      [23, 24, "Dedos das mãos quebrados", 0, "", "Não usa armas de duas mãos.", "D6"],
      [25, 26, "Dedos dos pés quebrados", 0, "", "Correr vira ação lenta.", "D6"],
      [31, 33, "Dentes quebrados", 0, "", "-1 em Manipulação.", "D6"],
      [34, 36, "Acerto na virilha", 0, "", "1 de dano a cada rolagem de Movimentação ou Luta.", "D6"],
      [41, 43, "Costelas quebradas", 0, "", "-2 em Movimentação e Luta.", "2D6"],
      [44, 45, "Braço quebrado", 0, "", "Não usa armas de duas mãos.", "2D6"],
      [46, 51, "Perna quebrada", 0, "", "Correr vira ação lenta.", "2D6"],
      [52, 53, "Olho saiu da órbita", 0, "", "-2 em Pontaria e Patrulha.", "2D6"],
      [54, 55, "Pé esmagado", 1, "D6 dias", "Correr vira ação lenta.", "3D6"],
      [56, 61, "Cotovelo esmagado", 1, "D6 dias", "Não usa armas de duas mãos.", "perm"],
      [62, 63, "Joelho esmagado", 1, "D6 dias", "Correr vira ação lenta.", "perm"],
      [64, 64, "Pescoço quebrado", 0, "", "Paralisado do pescoço para baixo. Se não receber Cura a tempo, fica permanente.", "3D6"],
      [65, 66, "Crânio esmagado", 1, "", "Morte imediata.", ""]
    ],
    "horror": [
      [11, 16, "Tremedeira", 0, "", "-1 em todas as rolagens de Agilidade.", "D6"],
      [21, 21, "Cabelo branco", 0, "", "Nenhum.", "perm"],
      [22, 24, "Ansiedade", 0, "", "-1 em todas as rolagens de Astúcia.", "D6"],
      [25, 31, "Taciturno", 0, "", "-1 em todas as rolagens de Empatia.", "D6"],
      [32, 35, "Pesadelos", 0, "", "Role Discernimento a cada Quarto de Dia dormindo. Se falhar, o sono não conta.", "D6"],
      [36, 41, "Noturno", 0, "", "Só consegue dormir enquanto é dia.", "2D6"],
      [42, 43, "Fobia", 0, "", "Medo de algo ligado ao que o deixou Acabado (o Mestre decide). 1 de dano em Astúcia a cada rodada a distância Perto disso.", "2D6"],
      [44, 45, "Alcoolismo", 0, "", "Precisa beber vinho ou cerveja todo dia, senão sofre 1 de dano em Agilidade.", "3D6"],
      [46, 51, "Claustrofobia", 0, "", "1 de dano em Astúcia a cada turno (15 minutos) em lugar fechado.", "2D6"],
      [52, 52, "Mitomania", 0, "", "Mente sem parar, sobre qualquer coisa. Interprete.", "2D6"],
      [53, 54, "Paranoia", 0, "", "Tem certeza de que alguém o persegue. Interprete.", "2D6"],
      [55, 55, "Esquizofrenia", 0, "", "Acredita firmemente em algo falso, como uma ascendência não existir. Interprete.", "3D6"],
      [56, 56, "Alucinações", 0, "", "Role Discernimento a cada Quarto de Dia. Se falhar, tem uma alucinação forte (o Mestre decide).", "3D6"],
      [61, 62, "Personalidade alterada", 0, "", "A personalidade muda de forma profunda. Combine com o Mestre e interprete.", "perm"],
      [63, 63, "Amnésia", 0, "", "Perde a memória e não reconhece os companheiros. Interprete.", "D6"],
      [64, 65, "Catatonia", 0, "", "Fica olhando o vazio, sem reagir a nada.", "D6"],
      [66, 66, "Ataque cardíaco", 1, "", "Morte imediata, de puro medo.", ""]]};

  var LABELS = { laceracao: "Laceração", perfuracao: "Perfuração", concussivo: "Trauma concussivo", horror: "Horror", outros: "Outros" };
  var BY_DAMAGE = { corte: "laceracao", perfuracao: "perfuracao", esmagamento: "concussivo" };
  var HELMET = { laceracao: [65], perfuracao: [64], concussivo: [64, 65, 66] };

  function lookup(table, d66) {
    var rows = TABLES[table] || [];
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      if (d66 >= r[0] && d66 <= r[1]) {
        return { table: table, d66: d66, name: r[2], lethal: !!r[3], limit: r[4], effect: r[5], heal: r[6], healMod: r[7] || 0,
                 instant: r[5].indexOf("Morte imediata") === 0 };
      }
    }
    return null;
  }

  function d66(tens, units) { return tens * 10 + units; }

  function helmetApplies(table, code) {
    return (HELMET[table] || []).indexOf(code) !== -1;
  }

  /* "2D6" -> 2 dados de 6 lados. */
  function parseDice(text) {
    var m = /^(\d*)D(\d+)/i.exec(text || "");
    return m ? { n: +(m[1] || 1), sides: +m[2] } : null;
  }

  function rollDice(text, rng) {
    var p = parseDice(text);
    if (!p) return null;
    var t = 0;
    for (var i = 0; i < p.n; i++) t += 1 + Math.floor((rng || Math.random)() * p.sides);
    return t;
  }

  /* Prazo do letal: "D6 horas" -> "4 horas". */
  function rollLimit(text, rng) {
    if (!text) return "";
    var n = rollDice(text, rng);
    var unit = text.replace(/^\d*D\d+\s*/i, "");
    if (n === 1) unit = unit.replace(/s$/, "").replace(/õe$/, "ão");
    return n + " " + unit;
  }

  /* Cuidados com sucesso em Cura: o tempo que falta cai pela metade (arredonda para cima). */
  function halve(days) { return Math.ceil(days / 2); }

  var api = { TABLES: TABLES, LABELS: LABELS, BY_DAMAGE: BY_DAMAGE, lookup: lookup, d66: d66, helmetApplies: helmetApplies, rollDice: rollDice, rollLimit: rollLimit, halve: halve };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.FLInjuries = api;
})(typeof window !== "undefined" ? window : this);
