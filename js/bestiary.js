/*
 * Bestiário: fichas limpas de monstros e animais.
 *
 * Só números e mecânica (atributos, armadura, perícias, ataques com dados e
 * dano). Os efeitos estão resumidos com palavras nossas; descrições e
 * ambientação ficam no livro. Página = Guia do Mestre (edição brasileira).
 *
 * Puro: não toca no DOM nem na API do TaleSpire.
 *
 * Ataque: { name, dice, dmg, type, range, fx, fear, block, dodge }
 *   dice  = Dados Base
 *   dmg   = Dano de Arma (0 quando não causa dano direto)
 *   fear  = ataque de medo: cada sucesso tira 1 de Astúcia
 *   block = pode ser bloqueado (por regra, ataque de monstro não pode)
 *   dodge = false quando não pode ser esquivado
 */
(function (root) {
  "use strict";

  var RANGE = { maos: "Ao alcance das mãos", perto: "Perto", curta: "Curta", longe: "Longe" };
  var TYPE = { cort: "cortante", esmag: "esmagamento", perf: "perfurante", atip: "atípico" };

  var RULES = [
    "Ataque de monstro é ação lenta e, se nada disser o contrário, é ao alcance das mãos.",
    "Cada sucesso além do primeiro soma +1 ao dano. A rolagem não pode ser forçada.",
    "Monstro não enfraquece ferido. A Força só diz quanto dano aguenta; a 0 está Acabado e morre, sem ferimento grave.",
    "Imune a medo e a magias que causam dano em Astúcia ou Empatia. Não pode ser Manipulado.",
    "Os ataques podem ser esquivados, mas não bloqueados, salvo quando o ataque diz que pode.",
    "Não pode ser Agarrado nem Fintado. Com quatro patas ou mais, não pode ser Derrubado.",
    "Derrubar um bípede ou Desarmar: se a Força do monstro passa do dobro da sua, precisa de um sucesso a mais; do triplo, dois a mais, e assim por diante.",
    "Combinações ocultas não se usam contra monstros.",
    "Para deixar um monstro mais duro, ele pode agir duas ou três vezes por rodada (compre essas cartas de iniciativa)."
  ];

  var ANIMAL_RULES = [
    "Animal ataca com Força + Luta, como um PNJ, e pode ser bloqueado.",
    "Bando (ratos, morcegos) conta como uma criatura só; cada ataque contra ele tira no máximo 1 de Força."
  ];

  var LIST = [
    {
      id: "urso-cinzento", name: "Urso Cinzento", kind: "monstro", page: 116,
      str: 14, agi: 2, armor: 4, armorNote: "pelagem", move: 2,
      skills: [["Patrulha", 3]],
      traits: [
        { name: "Fúria bestial", half: true, text: "Quando a Força cai para a metade, ataca de graça todos ao alcance das mãos: 7 dados, dano 1 cortante. Não gasta a ação dele." }
      ],
      attacks: [
        { name: "Garras", dice: 9, dmg: 2, type: "cort", range: "perto", fx: "" },
        { name: "Mordida", dice: 10, dmg: 2, type: "esmag", range: "maos", fx: "", block: true },
        { name: "Patada", dice: 8, dmg: 1, type: "esmag", range: "maos", fx: "Se acertar, joga o alvo para Perto, caído." },
        { name: "Varrida", dice: 7, dmg: 1, type: "cort", range: "maos", all: true, fx: "" },
        { name: "Rugido", dice: 7, fear: true, range: "perto", all: true, fx: "" },
        { name: "Abraço", dice: 9, dmg: 1, type: "esmag", range: "maos", fx: "Se acertar, o alvo fica Agarrado e precisa se libertar." }
      ]
    },
    {
      id: "warg-da-noite", name: "Warg da Noite", kind: "monstro", page: 122,
      str: 8, agi: 4, armor: 3, armorNote: "pelagem", move: 2,
      skills: [["Patrulha", 5], ["Furtividade", 4]],
      traits: [
        { name: "Some na morte", text: "Quem ele mata vira névoa negra e não sobra nada, nem rubi élfico. Quando morre, ele também se desfaz. Não deixa rastros." }
      ],
      attacks: [
        { name: "Garras", dice: 8, dmg: 1, type: "cort", range: "maos", fx: "" },
        { name: "Mordida gelada", dice: 7, dmg: 2, type: "cort", range: "maos", fx: "No mais próximo. Se acertar, o alvo fica Hipotérmico.", block: true },
        { name: "Sacudida", dice: 7, dmg: 1, type: "cort", range: "maos", fx: "Se acertar, joga o alvo para Perto, caído." },
        { name: "Bote", dice: 8, dmg: 1, type: "cort", range: "maos", fx: "Se acertar, derruba e emenda na hora outro ataque: 6 dados, dano 2 cortante, sem esquiva." },
        { name: "Trava a mandíbula", dice: 7, dmg: 2, type: "esmag", range: "maos", fx: "Se acertar, o alvo fica Agarrado." },
        { name: "Na garganta", dice: 10, dmg: 2, type: "cort", range: "maos", fx: "Também tira metade do dano (para cima) em Empatia, e o alvo fica Hipotérmico.", block: true }
      ]
    },
    {
      id: "lobo", name: "Lobo", kind: "animal", page: 126,
      str: 4, agi: 4, move: 2,
      skills: [["Luta", 3], ["Movimentação", 3], ["Patrulha", 5]],
      weapon: { name: "Mordida", dmg: 1, type: "cort" }
    },
    {
      id: "javali", name: "Javali", kind: "animal", page: 126,
      str: 4, agi: 2, move: 1,
      skills: [["Luta", 3], ["Patrulha", 3]],
      weapon: { name: "Presas", dmg: 1, type: "esmag" }
    }
  ];

  function fold(s) {
    return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  }

  function get(id) {
    for (var i = 0; i < LIST.length; i++) if (LIST[i].id === id) return LIST[i];
    return null;
  }

  function search(q) {
    var f = fold(q).trim();
    var out = LIST.filter(function (m) { return !f || fold(m.name).indexOf(f) !== -1; });
    return out.sort(function (a, b) {
      if (a.kind !== b.kind) return a.kind === "monstro" ? -1 : 1;
      return a.name.localeCompare(b.name, "pt");
    });
  }

  function skill(m, name) {
    var s = (m.skills || []).filter(function (x) { return x[0] === name; })[0];
    return s ? s[1] : 0;
  }

  /* Ataque de animal: Força + Luta. Vira um ataque no mesmo formato dos monstros. */
  function animalAttack(m) {
    return { name: m.weapon.name, dice: m.str, skill: skill(m, "Luta"), dmg: m.weapon.dmg, type: m.weapon.type, range: "maos", fx: "", block: true, push: true };
  }

  /*
   * Resultado de um ataque: sixes = quantos 6 saíram.
   * Monstro: acerta com 1 sucesso; cada sucesso extra soma +1 ao dano.
   * Medo: cada sucesso tira 1 de Astúcia.
   */
  function resolve(atk, sixes) {
    var n = Math.max(0, sixes | 0);
    if (atk.fear) return { hit: n > 0, dmg: n, attr: "Astúcia" };
    if (!atk.dmg) return { hit: n > 0, dmg: 0, attr: "" };
    return { hit: n > 0, dmg: n > 0 ? atk.dmg + n - 1 : 0, attr: "Força" };
  }

  function rangeName(k) { return RANGE[k] || k || ""; }
  function typeName(k) { return TYPE[k] || k || ""; }

  /* "9 dados · dano 2 cortante" */
  function attackLine(a) {
    var dice = a.dice + (a.skill ? "+" + a.skill : "") + " dados";
    if (a.fear) return dice + " · medo";
    return dice + (a.dmg ? " · dano " + a.dmg + (a.type ? " " + typeName(a.type) : "") : "");
  }

  var api = {
    RULES: RULES,
    ANIMAL_RULES: ANIMAL_RULES,
    LIST: LIST,
    get: get,
    search: search,
    animalAttack: animalAttack,
    resolve: resolve,
    rangeName: rangeName,
    typeName: typeName,
    attackLine: attackLine,
    fold: fold
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.FLBestiary = api;
})(typeof window !== "undefined" ? window : this);
