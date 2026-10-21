/*
 * Jornadas do Forbidden Lands.
 *
 * Puro: não toca no DOM nem na API do TaleSpire.
 *   - O dia tem quatro Quartos: Manhã, Dia, Anoitecer e Noite. Em cada um,
 *     cada aventureiro escolhe uma atividade.
 *   - Luz por estação: no verão só a Noite é escura; na primavera e no outono,
 *     Anoitecer e Noite; no inverno, tudo menos o Dia.
 *   - Caminhar: 2 hexágonos por Quarto em terreno aberto (3 montado), 1 em
 *     terreno dificultoso (montaria não ajuda).
 *   - Marcha forçada: 2 Quartos por dia sem problema; o 3º pede Resiliência,
 *     o 4º Resiliência −2 e deixa Insone.
 *   - No escuro, Desbravar rola com −2.
 *   - Coletar e Caçar: Sobrevivência modificada pelo terreno (e Coletar
 *     também pela estação).
 *   - Comer e beber uma vez por dia; dormir ao menos um Quarto por dia.
 *
 * Nomes e números seguem o Manual do Jogador.
 */
(function (root) {
  "use strict";

  var QUARTERS = ["Manhã", "Dia", "Anoitecer", "Noite"];

  /* [chave, nome, Quartos claros, modificador de Coletar] */
  var SEASONS = [
    { key: "primavera", name: "Primavera", light: [true, true, false, false], forage: -1 },
    { key: "verao", name: "Verão", light: [true, true, true, false], forage: 0 },
    { key: "outono", name: "Outono", light: [true, true, false, false], forage: 1 },
    { key: "inverno", name: "Inverno", light: [false, true, false, false], forage: -2 }
  ];

  /* move: "aberto" | "dificil" | "barco" | "balsa" | "bloqueado"; forage/hunt: null = não dá */
  var TERRAINS = [
    { key: "planicies", name: "Planícies", move: "aberto", forage: -1, hunt: 1 },
    { key: "floresta", name: "Floresta", move: "aberto", forage: 1, hunt: 1 },
    { key: "floresta-sombria", name: "Floresta Sombria", move: "dificil", forage: -1, hunt: 0 },
    { key: "colinas", name: "Colinas", move: "aberto", forage: 0, hunt: 0 },
    { key: "montanhas", name: "Montanhas", move: "dificil", forage: -2, hunt: -1 },
    { key: "lago-rio", name: "Lago/Rio", move: "barco", forage: null, hunt: 0 },
    { key: "pantano", name: "Pântano", move: "balsa", forage: 1, hunt: -1 },
    { key: "charco", name: "Charco", move: "dificil", forage: -1, hunt: 0 },
    { key: "ruinas", name: "Ruínas", move: "dificil", forage: -2, hunt: -1 }
  ];

  var MOVE_LABEL = { aberto: "Terreno aberto", dificil: "Terreno dificultoso", barco: "Requer barco ou balsa", balsa: "Requer balsa" };

  /*
   * Atividades. walk: conta como caminhar; solo: só uma pessoa do grupo;
   * sleep: conta como dormir; skill/mod: rolagem que o Mestre pode pedir.
   */
  var ACTIVITIES = [
    { key: "caminhar", name: "Caminhar", walk: true },
    { key: "desbravar", name: "Caminhar e Desbravar", walk: true, solo: true, skill: "sobrevivencia", hint: "Sobrevivência a cada hexágono novo" },
    { key: "vigiar", name: "Caminhar e Vigiar", walk: true, solo: true, skill: "exploracao", hint: "Patrulha quando surgir uma ameaça" },
    { key: "vigiar-parado", name: "Manter Vigília", solo: true, skill: "exploracao", hint: "Patrulha quando surgir uma ameaça" },
    { key: "coletar", name: "Coletar", skill: "sobrevivencia", hint: "Sobrevivência (terreno e estação)" },
    { key: "cacar", name: "Caçar", skill: "sobrevivencia", hint: "Sobrevivência (terreno); precisa de arma a distância ou armadilha" },
    { key: "pescar", name: "Pescar", skill: "sobrevivencia", hint: "Sobrevivência; precisa de rio ou lago" },
    { key: "acampar", name: "Montar Acampamento", solo: true, skill: "sobrevivencia", hint: "Sobrevivência; os outros podem ajudar" },
    { key: "descansar", name: "Descansar" },
    { key: "dormir", name: "Dormir", sleep: true },
    { key: "explorar", name: "Explorar" },
    { key: "outro", name: "Outra coisa" }
  ];

  function season(key) { return SEASONS.filter(function (s) { return s.key === key; })[0] || SEASONS[0]; }
  function terrain(key) { return TERRAINS.filter(function (t) { return t.key === key; })[0] || TERRAINS[0]; }
  function activity(key) { return ACTIVITIES.filter(function (a) { return a.key === key; })[0] || null; }

  function isLight(seasonKey, quarter) { return season(seasonKey).light[quarter]; }

  /* Hexágonos por Quarto: { foot, mounted } (0 = não dá a pé). */
  function moves(terrainKey) {
    var t = terrain(terrainKey);
    if (t.move === "aberto") return { foot: 2, mounted: 3 };
    if (t.move === "dificil") return { foot: 1, mounted: 1 };
    return { foot: 0, mounted: 0 };
  }

  /* Marcha forçada: o que o próximo Quarto caminhando exige, dado quantos já caminharam hoje. */
  function forcedMarch(walkedToday) {
    if (walkedToday < 2) return null;
    if (walkedToday === 2) return { mod: 0, sleepless: false };
    return { mod: -2, sleepless: true };
  }

  /* Modificador da Sobrevivência para cada atividade. */
  function activityMod(actKey, terrainKey, seasonKey, quarter) {
    var t = terrain(terrainKey);
    if (actKey === "desbravar") return isLight(seasonKey, quarter) ? 0 : -2;
    if (actKey === "coletar") return t.forage == null ? null : t.forage + season(seasonKey).forage;
    if (actKey === "cacar") return t.hunt == null ? null : t.hunt;
    return 0;
  }

  /* Problemas na escolha das atividades: atividades de uma pessoa só repetidas, grupo dividido. */
  function check(acts) {
    var out = [], count = {}, ids = Object.keys(acts);
    ids.forEach(function (id) { var k = acts[id]; if (k) count[k] = (count[k] || 0) + 1; });
    ACTIVITIES.forEach(function (a) {
      if (a.solo && count[a.key] > 1) out.push("Só uma pessoa pode " + a.name.replace("Caminhar e ", "").toLowerCase() + ".");
    });
    var walking = ids.filter(function (id) { var a = activity(acts[id]); return a && a.walk; }).length;
    var chosen = ids.filter(function (id) { return acts[id]; }).length;
    if (walking && walking < chosen) out.push("Nem todos estão caminhando: o grupo só avança junto.");
    if ((count.desbravar || 0) && (count.vigiar || 0) === 0 && (count["vigiar-parado"] || 0) === 0) out.push("Ninguém está vigiando: ameaças pegam o grupo de surpresa.");
    return out;
  }

  function anyWalking(acts) {
    return Object.keys(acts).some(function (id) { var a = activity(acts[id]); return a && a.walk; });
  }

  var api = {
    QUARTERS: QUARTERS, SEASONS: SEASONS, TERRAINS: TERRAINS, ACTIVITIES: ACTIVITIES, MOVE_LABEL: MOVE_LABEL,
    season: season, terrain: terrain, activity: activity, isLight: isLight, moves: moves,
    forcedMarch: forcedMarch, activityMod: activityMod, check: check, anyWalking: anyWalking
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.FLJourney = api;
})(typeof window !== "undefined" ? window : this);
