/*
 * Catálogo do Forbidden Lands: ascendências, profissões, talentos e itens.
 *
 * Só nomes e organização, sem texto de regra. Os nomes em português são
 * tradução livre; ajuste à vontade para bater com a edição da sua mesa.
 *
 * Itens: "bonus" é o bônus de equipamento que entra como dados na rolagem.
 * Os que estão sem bônus entram com 1 e o jogador ajusta na ficha. O mestre
 * pode preencher os valores aqui uma vez e todo mundo recebe pronto.
 */
(function (root) {
  "use strict";

  var KINS = [
    { id: "humano", name: "Humano", talent: "adaptavel" },
    { id: "elfo", name: "Elfo", talent: "paz-interior" },
    { id: "meio-elfo", name: "Meio-elfo", talent: "poder-psiquico" },
    { id: "anao", name: "Anão", talent: "garra" },
    { id: "halfling", name: "Halfling", talent: "dificil-de-pegar" },
    { id: "povo-lobo", name: "Povo-lobo", talent: "instinto-de-caca" },
    { id: "orc", name: "Orc", talent: "inquebravel" },
    { id: "goblin", name: "Goblin", talent: "noturno" }
  ];

  var PROFESSIONS = [
    { id: "druida", name: "Druida" },
    { id: "guerreiro", name: "Guerreiro" },
    { id: "cacador", name: "Caçador" },
    { id: "menestrel", name: "Menestrel" },
    { id: "mascate", name: "Mascate" },
    { id: "cavaleiro", name: "Cavaleiro" },
    { id: "ladino", name: "Ladino" },
    { id: "feiticeiro", name: "Feiticeiro" }
  ];

  // group: "kin" (sem nível), "profession" (com profession) ou "general".
  var TALENTS = [
    { id: "adaptavel", name: "Adaptável", group: "kin" },
    { id: "paz-interior", name: "Paz Interior", group: "kin" },
    { id: "poder-psiquico", name: "Poder Psíquico", group: "kin" },
    { id: "garra", name: "Garra", group: "kin" },
    { id: "dificil-de-pegar", name: "Difícil de Pegar", group: "kin" },
    { id: "instinto-de-caca", name: "Instinto de Caça", group: "kin" },
    { id: "inquebravel", name: "Inquebrável", group: "kin" },
    { id: "noturno", name: "Noturno", group: "kin" },

    { id: "caminho-da-cura", name: "Caminho da Cura", group: "profession", profession: "druida" },
    { id: "caminho-das-formas", name: "Caminho das Formas", group: "profession", profession: "druida" },
    { id: "caminho-da-visao", name: "Caminho da Visão", group: "profession", profession: "druida" },
    { id: "caminho-da-lamina", name: "Caminho da Lâmina", group: "profession", profession: "guerreiro" },
    { id: "caminho-do-inimigo", name: "Caminho do Inimigo", group: "profession", profession: "guerreiro" },
    { id: "caminho-do-escudo", name: "Caminho do Escudo", group: "profession", profession: "guerreiro" },
    { id: "caminho-da-flecha", name: "Caminho da Flecha", group: "profession", profession: "cacador" },
    { id: "caminho-da-fera", name: "Caminho da Fera", group: "profession", profession: "cacador" },
    { id: "caminho-da-floresta", name: "Caminho da Floresta", group: "profession", profession: "cacador" },
    { id: "caminho-do-hino", name: "Caminho do Hino", group: "profession", profession: "menestrel" },
    { id: "caminho-da-cancao", name: "Caminho da Canção", group: "profession", profession: "menestrel" },
    { id: "caminho-do-grito", name: "Caminho do Grito de Guerra", group: "profession", profession: "menestrel" },
    { id: "caminho-do-ouro", name: "Caminho do Ouro", group: "profession", profession: "mascate" },
    { id: "caminho-das-mentiras", name: "Caminho das Mentiras", group: "profession", profession: "mascate" },
    { id: "caminho-das-muitas-coisas", name: "Caminho das Muitas Coisas", group: "profession", profession: "mascate" },
    { id: "caminho-do-companheiro", name: "Caminho do Companheiro", group: "profession", profession: "cavaleiro" },
    { id: "caminho-do-cavaleiro", name: "Caminho do Cavaleiro", group: "profession", profession: "cavaleiro" },
    { id: "caminho-das-planicies", name: "Caminho das Planícies", group: "profession", profession: "cavaleiro" },
    { id: "caminho-da-face", name: "Caminho da Face", group: "profession", profession: "ladino" },
    { id: "caminho-do-assassino", name: "Caminho do Assassino", group: "profession", profession: "ladino" },
    { id: "caminho-do-veneno", name: "Caminho do Veneno", group: "profession", profession: "ladino" },
    { id: "magia-de-sangue", name: "Magia de Sangue", group: "profession", profession: "feiticeiro" },
    { id: "magia-da-morte", name: "Magia da Morte", group: "profession", profession: "feiticeiro" },
    { id: "simbolismo", name: "Simbolismo", group: "profession", profession: "feiticeiro" },
    { id: "canto-da-pedra", name: "Canto da Pedra", group: "profession", profession: "feiticeiro" },

    { id: "ambidestro", name: "Ambidestro", group: "general" },
    { id: "lutador-de-machado", name: "Lutador de Machado", group: "general" },
    { id: "berserker", name: "Berserker", group: "general" },
    { id: "arqueiro-artesao", name: "Fabricante de Arcos", group: "general" },
    { id: "brigao", name: "Brigão", group: "general" },
    { id: "construtor", name: "Construtor", group: "general" },
    { id: "cozinheiro", name: "Cozinheiro", group: "general" },
    { id: "sangue-frio", name: "Sangue-Frio", group: "general" },
    { id: "defensor", name: "Defensor", group: "general" },
    { id: "mata-dragoes", name: "Mata-Dragões", group: "general" },
    { id: "carrasco", name: "Carrasco", group: "general" },
    { id: "pes-rapidos", name: "Pés Rápidos", group: "general" },
    { id: "atirador-rapido", name: "Atirador Rápido", group: "general" },
    { id: "destemido", name: "Destemido", group: "general" },
    { id: "pegada-firme", name: "Pegada Firme", group: "general" },
    { id: "pescador", name: "Pescador", group: "general" },
    { id: "lutador-de-martelo", name: "Lutador de Martelo", group: "general" },
    { id: "herbalista", name: "Herbalista", group: "general" },
    { id: "lutador-montado", name: "Lutador Montado", group: "general" },
    { id: "incorruptivel", name: "Incorruptível", group: "general" },
    { id: "lutador-de-faca", name: "Lutador de Faca", group: "general" },
    { id: "rapido-como-raio", name: "Rápido como um Raio", group: "general" },
    { id: "arrombador", name: "Arrombador", group: "general" },
    { id: "sortudo", name: "Sortudo", group: "general" },
    { id: "mestre-da-caca", name: "Mestre da Caça", group: "general" },
    { id: "investida", name: "Investida", group: "general" },
    { id: "rato-de-carga", name: "Rato de Carga", group: "general" },
    { id: "resistente-a-dor", name: "Resistente à Dor", group: "general" },
    { id: "desbravador", name: "Desbravador", group: "general" },
    { id: "envenenador", name: "Envenenador", group: "general" },
    { id: "intendente", name: "Intendente", group: "general" },
    { id: "saque-rapido", name: "Saque Rápido", group: "general" },
    { id: "marinheiro", name: "Marinheiro", group: "general" },
    { id: "atirador-de-elite", name: "Atirador de Elite", group: "general" },
    { id: "lingua-afiada", name: "Língua Afiada", group: "general" },
    { id: "lutador-de-escudo", name: "Lutador de Escudo", group: "general" },
    { id: "sexto-sentido", name: "Sexto Sentido", group: "general" },
    { id: "ferreiro", name: "Ferreiro", group: "general" },
    { id: "lutador-de-lanca", name: "Lutador de Lança", group: "general" },
    { id: "pes-firmes", name: "Pés Firmes", group: "general" },
    { id: "lutador-de-espada", name: "Lutador de Espada", group: "general" },
    { id: "alfaiate", name: "Alfaiate", group: "general" },
    { id: "curtidor", name: "Curtidor", group: "general" },
    { id: "ameacador", name: "Ameaçador", group: "general" },
    { id: "braco-de-arremesso", name: "Braço de Arremesso", group: "general" },
    { id: "andarilho", name: "Andarilho", group: "general" }
  ];

  var GEAR = [
    { group: "Armas corpo a corpo", items: [
      "Faca", "Adaga", "Espada curta", "Espada larga", "Espada longa", "Espada de duas mãos",
      "Machadinha", "Machado de batalha", "Machado de duas mãos", "Maça", "Martelo de guerra",
      "Mangual", "Porrete", "Cajado", "Lança", "Lança longa", "Alabarda", "Tridente"
    ] },
    { group: "Armas à distância", items: [
      "Funda", "Arco curto", "Arco longo", "Besta leve", "Besta pesada",
      "Dardo", "Lança de arremesso", "Machadinha de arremesso", "Faca de arremesso"
    ] },
    { group: "Proteção", items: [
      "Armadura de couro", "Armadura de couro batido", "Cota de malha", "Armadura de placas",
      "Elmo aberto", "Elmo fechado", "Escudo pequeno", "Escudo grande"
    ] },
    { group: "Ferramentas", items: [
      "Ferramentas de ferreiro", "Ferramentas de carpinteiro", "Gazuas", "Instrumento musical",
      "Kit de ervas", "Vara de pescar", "Rede de pesca", "Corda", "Gancho de escalada", "Lanterna"
    ] }
  ];

  // Bônus conhecidos (preencha aqui para não precisar ajustar na ficha).
  // Ex.: { "Arco longo": 2 }
  var GEAR_BONUS = {};

  function slug(s) {
    return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  var gearItems = [];
  GEAR.forEach(function (g) {
    g.items = g.items.map(function (name) {
      var item = { id: slug(name), name: name, group: g.group, bonus: GEAR_BONUS[name] == null ? null : GEAR_BONUS[name] };
      gearItems.push(item);
      return item;
    });
  });

  function byId(list, id) {
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  var api = {
    KINS: KINS,
    PROFESSIONS: PROFESSIONS,
    TALENTS: TALENTS,
    GEAR: GEAR,
    kin: function (id) { return byId(KINS, id); },
    profession: function (id) { return byId(PROFESSIONS, id); },
    talent: function (id) { return byId(TALENTS, id); },
    gear: function (id) { return byId(gearItems, id); },
    slug: slug
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.FLCatalog = api;
})(typeof window !== "undefined" ? window : this);
