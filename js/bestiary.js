/*
 * Bestiário: fichas limpas de monstros, combatentes e animais.
 *
 * Só números e mecânica (atributos, armadura, perícias, ataques com dados e
 * dano). Os efeitos estão resumidos com palavras nossas e os nomes dos
 * ataques são nossos; descrições e ambientação ficam no livro.
 * Página = Guia do Mestre (edição brasileira).
 *
 * Puro: não toca no DOM nem na API do TaleSpire.
 *
 * kind: "monstro" (tabela de ataques monstruosos), "comum" (luta como
 * pessoa: Força + Luta + arma) ou "animal" (idem).
 *
 * Ataque: { name, dice, dmg, type, range, all, fx, fear, attr, block, dodge, poison }
 *   dice   = Dados Base (0 = sem rolagem; "str" = a Força atual)
 *   dmg    = Dano de Arma (0 quando não causa dano direto)
 *   fear   = ataque de medo: cada sucesso tira 1 de Astúcia
 *   attr   = cada sucesso tira 1 deste atributo (ex.: Empatia)
 *   block  = pode ser bloqueado (por regra, ataque de monstro não pode)
 *   dodge  = false quando não pode ser esquivado
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
    "Os ataques podem ser esquivados, mas não bloqueados, salvo quando o ataque diz que pode. O monstro pode esquivar, e bloquear se tiver arma ou escudo.",
    "Não pode ser Agarrado nem Fintado. Com quatro patas ou mais, não pode ser Derrubado.",
    "Derrubar um bípede: se a Força do monstro passa do dobro da sua, precisa de três sucessos; do triplo, quatro, e assim por diante.",
    "Desarmar: se a Força do monstro passa do dobro da sua, precisa de dois sucessos; do triplo, três, e assim por diante.",
    "Combinações ocultas não se usam contra monstros.",
    "Perícia de monstro: role os Dados de Perícia com os Dados Base do atributo; se ele não tem o atributo, só os de Perícia.",
    "Para deixar um monstro mais duro, ele pode agir duas ou três vezes por rodada (compre essas cartas de iniciativa)."
  ];

  var COMMON_RULES = [
    "Mortos-vivos e insetoides lutam como pessoas: Força + Luta + arma, seguindo as regras normais de combate.",
    "Não têm Astúcia nem Empatia: são imunes a magias que ferem esses atributos e a Manipulação."
  ];

  var ANIMAL_RULES = [
    "Animal ataca com Força + Luta, como um PNJ, e pode ser bloqueado.",
    "Bando (ratos, morcegos) conta como uma criatura só; cada ataque contra ele tira no máximo 1 de Força."
  ];

  var NO_MIND = { name: "Sem mente", text: "Sem Astúcia nem Empatia: imune a magias nesses atributos e a Manipulação." };

  /* Ataque de bote/arremesso para o alto (Grifo, Wyvern). */
  var LIST = [
    /* ---------------- Monstros ---------------- */
    {
      id: "cavaleiro-da-morte", name: "Cavaleiro da Morte", kind: "monstro", page: 76,
      str: 12, agi: 3, wits: 3, emp: 2, armor: 6, armorNote: "só a que veste (cota de malha)", move: 1,
      skills: [["Patrulha", 2]], gear: "Espada longa, cota de malha",
      traits: [
        { name: "Morto resistente", text: "Recebe metade do dano de ataques físicos (arredonde para cima)." },
        { name: "Senhor dos mortos", text: "Comanda mortos-vivos menores." }
      ],
      attacks: [
        { name: "Golpe poderoso", dice: 12, dmg: 2, type: "cort", range: "maos", block: true, fx: "Dano da arma (espada longa). Se ferir, joga o alvo para Perto, caído." },
        { name: "Grito profano", dice: 8, fear: true, range: "perto", all: true },
        { name: "Mão do morto", dice: 8, dmg: 2, type: "esmag", range: "perto", fx: "Ergue o alvo pelo ar e o atira para Curta." },
        { name: "Arco da lâmina", dice: 8, dmg: 2, type: "cort", range: "maos", all: true, block: true, fx: "Dano da arma." },
        { name: "Olhar gelado", dice: 0, poison: "paralisante, Potência 8", range: "maos", fx: "Um alvo." },
        { name: "Portão dos mortos", dice: 12, fear: true, range: "perto", fx: "Um alvo escolhido." }
      ]
    },
    {
      id: "dragao-pequeno", name: "Dragão pequeno", kind: "monstro", page: 84,
      str: 32, agi: 4, wits: 4, emp: 2, armor: 8, move: 3,
      skills: [["Patrulha", 3], ["Tradição", 2], ["Discernimento", 2], ["Manipulação", 2]],
      traits: [
        { name: "Brecha nas escamas", text: "Patrulha bem-sucedida acha uma brecha. Atacar ali tem −3; se acertar, a Armadura conta pela metade nesse golpe." }
      ],
      attacks: "dragao"
    },
    {
      id: "dragao-grande", name: "Dragão grande", kind: "monstro", page: 84,
      str: 48, agi: 4, wits: 6, emp: 3, armor: 12, move: 3,
      skills: [["Patrulha", 3], ["Tradição", 3], ["Discernimento", 4], ["Manipulação", 3]],
      traits: [
        { name: "Brecha nas escamas", text: "Patrulha bem-sucedida acha uma brecha. Atacar ali tem −3; se acertar, a Armadura conta pela metade nesse golpe." }
      ],
      attacks: "dragao"
    },
    {
      id: "dragonete", name: "Dragonete", kind: "monstro", page: 86,
      str: 25, agi: 3, wits: 5, emp: 2, armor: 8, move: 2,
      skills: [["Patrulha", 3]],
      traits: [
        { name: "Atraído pelo brilho", text: "Ataca na hora quem vestir ou segurar algo brilhante, e persegue essa pessoa se ela fugir." }
      ],
      attacks: [
        { name: "Mordida", dice: 10, dmg: 2, type: "cort", range: "maos", fx: "No alvo de maior Força." },
        { name: "Rugido", dice: 7, fear: true, range: "perto", all: true },
        { name: "Garras", dice: 8, dmg: 2, type: "cort", range: "perto", fx: "Contra dois alvos." },
        { name: "Cuspe ácido", dice: 6, dmg: 1, range: "perto", all: true, fx: "Quem for atingido sofre mais 1 de dano por rodada durante D3 rodadas." },
        { name: "Cauda", dice: 8, dmg: 1, type: "esmag", range: "perto", all: true, fx: "Quem for atingido cai." },
        { name: "Engolir", dice: 10, dmg: 1, type: "cort", range: "maos", fx: "No alvo de maior Força, se ele falhar em Movimentação (não gasta ação). Engolido, sofre 1 por rodada; pode atacar por dentro, sem Armadura, e sai se o dragonete morrer." }
      ]
    },
    {
      id: "ent", name: "Ent", kind: "monstro", page: 88,
      str: 16, agi: 3, wits: 5, emp: 3, armor: 6, move: 1,
      traits: [{ name: "Inflamável", text: "Ataques com fogo causam o dobro de dano." }],
      attacks: [
        { name: "Rugido", dice: 7, fear: true, range: "perto", all: true },
        { name: "Pancada do tronco", dice: 8, dmg: 1, type: "esmag", range: "perto", fx: "Contra dois alvos; quem for atingido cai." },
        { name: "Raízes", dice: 9, dmg: 1, type: "esmag", range: "perto", fx: "Se acertar, o alvo fica Agarrado. As raízes têm Força 3." },
        { name: "Esmagar", dice: 10, dmg: 1, type: "esmag", range: "maos" },
        { name: "Abraço do Ent", dice: 8, dmg: 1, type: "esmag", range: "maos", fx: "Se acertar, o alvo fica preso no corpo do Ent; só sai causando 4 de dano num golpe ou com ajuda de fora." },
        { name: "Arremesso de rocha", dice: 12, dmg: 2, type: "esmag", range: "curta", fx: "Se acertar, o alvo cai." }
      ]
    },
    {
      id: "fantasma", name: "Fantasma", kind: "monstro", page: 90,
      str: 8, agi: 3, wits: 3, emp: 2, armor: 0, move: 1,
      traits: [
        { name: "Imaterial", text: "Só fogo e magia o ferem." },
        { name: "Sempre volta", text: "Derrotado, some por um Quarto de Dia e retorna. Só a magia Purgar Morto-vivo o destrói de vez." }
      ],
      attacks: [
        { name: "Golpe espectral", dice: 8, dmg: 2, type: "esmag", range: "maos", fx: "Se acertar, joga o alvo para Perto, caído." },
        { name: "Toque da morte", dice: 9, fear: true, range: "maos", fx: "Se acertar, o alvo fica Hipotérmico." },
        { name: "Grito", dice: 7, fear: true, range: "perto", all: true, fx: "Quem for atingido fica Hipotérmico." },
        { name: "Visão da morte", dice: 10, fear: true, range: "maos", fx: "O alvo cai no chão." },
        { name: "Abraço gélido", dice: 10, dmg: 2, type: "esmag", range: "maos", fx: "Se acertar, o alvo fica Hipotérmico." },
        { name: "Toque gelado", dice: 12, dmg: 1, range: "maos", fx: "Se acertar, o alvo fica Hipotérmico." }
      ]
    },
    {
      id: "gigante", name: "Gigante", kind: "monstro", page: 92,
      str: 24, agi: 2, wits: 2, emp: 2, armor: 4, armorNote: "improvisada, de 2 a 6", move: 1,
      gear: "Tacape ou uma árvore",
      traits: [
        { name: "Arma enorme", text: "Sem a arma, todo ataque cai para dano 1. Nunca bloqueia." },
        { name: "Ponto fraco", text: "Golpe no topo da cabeça causa o dobro de dano. Exige ataque à distância de um lugar alto (−2) ou escalar o gigante (conta como Agarrar, sem os outros efeitos)." }
      ],
      attacks: [
        { name: "Golpe esmagador", dice: 12, dmg: 2, type: "esmag", range: "maos", fx: "Se acertar, o alvo cai." },
        { name: "Rugido", dice: 6, fear: true, range: "perto", all: true },
        { name: "Pisotear", dice: 10, dmg: 1, type: "esmag", range: "perto", fx: "Contra dois alvos; quem for atingido cai." },
        { name: "Varrida", dice: 9, dmg: 2, range: "perto", all: true, fx: "Quem for atingido cai." },
        { name: "Arremesso", dice: 11, dmg: 1, type: "esmag", range: "perto", fx: "Se acertar, o alvo voa para Curta e cai." },
        { name: "Fúria", dice: 10, dmg: 1, type: "esmag", range: "perto", all: true, fx: "Quem for atingido cai." }
      ]
    },
    {
      id: "grifo", name: "Grifo", kind: "monstro", page: 94,
      str: 12, agi: 5, armor: 3, armorNote: "penas", move: 3,
      skills: [["Patrulha", 5]],
      attacks: [
        { name: "Garras", dice: 9, dmg: 2, type: "cort", range: "maos" },
        { name: "Rajada de garras", dice: 6, dmg: 2, type: "cort", range: "maos", block: true, fx: "Três ataques seguidos no mesmo alvo. Pode bloquear, um de cada vez." },
        { name: "Rasante", dice: 6, dmg: 2, type: "cort", range: "maos", all: true, fx: "Quem for atingido cai." },
        { name: "Arremesso no bico", dice: 9, dmg: 1, range: "maos", fx: "Se acertar, o alvo cai em Perto." },
        { name: "Redemoinho", dice: 6, dmg: 1, type: "esmag", range: "perto", all: true, dodge: false, fx: "Quem for atingido cai." },
        { name: "Leva pro alto", dice: 6, dmg: 0, range: "maos", fx: "Se acertar, agarra o alvo e sobe até Curta. No começo da próxima rodada solta: queda de 2D6+10 metros." }
      ]
    },
    {
      id: "harpias", name: "Harpias", kind: "monstro", page: 96,
      str: 12, strNote: "de 8 a 16, conforme o bando", agi: 3, wits: 2, emp: 1, armor: 0, move: 2,
      skills: [["Patrulha", 2], ["Discernimento", 4], ["Manipulação", 2]],
      traits: [
        { name: "Bando", text: "O bando conta como um monstro só. Cada ataque contra ele tira no máximo 1 de Força." },
        { name: "Covardes", half: true, text: "Com a Força do bando na metade, fogem do combate. Podem voltar depois." }
      ],
      attacks: [
        { name: "Ameaças", dice: 6, fear: true, range: "perto", all: true },
        { name: "Do alto", dice: "str", dmg: 1, type: "cort", range: "perto", fx: "Dados = Força atual do bando. No alvo com mais metal. Se acertar, erguem e largam o alvo de D3+3 metros." },
        { name: "Chuva de pedras", dice: 6, dmg: 1, type: "esmag", range: "perto", all: true },
        { name: "Nos olhos", dice: 8, dmg: 2, type: "cort", range: "maos", fx: "Se ferir, o alvo também sofre o ferimento grave pálpebra cortada (laceração, 41–42)." },
        { name: "Revoada", dice: 6, dmg: 1, type: "cort", range: "perto", fx: "Atacam um número de alvos igual à metade da Força do bando (para cima)." },
        { name: "Imundície", dice: 6, attr: "Empatia", range: "perto", all: true, block: true, fx: "Dá para bloquear com escudo." }
      ]
    },
    {
      id: "hidra", name: "Hidra", kind: "monstro", page: 98,
      str: 4, strNote: "por cabeça", agi: 4, armor: 5, move: 2,
      copies: { n: 5, unit: "cabeça", hint: "D3+3 cabeças (4 a 6), cada uma com a sua carta." },
      traits: [
        { name: "Cabeças", text: "D3+3 cabeças, cada uma com Força 4 e a sua carta de iniciativa. Cada cabeça ataca." },
        { name: "Brotam de novo", text: "Cabeça a 0 cai, e nascem duas na rodada seguinte, a menos que o toco seja cauterizado com fogo (tocha e Movimentação, ação lenta)." }
      ],
      attacks: [
        { name: "Mordida", dice: 6, dmg: 2, type: "cort", range: "maos", fx: "No alvo mais próximo." },
        { name: "Grito", dice: 5, fear: true, range: "perto", all: true },
        { name: "Garras", dice: 7, dmg: 1, type: "cort", range: "maos" },
        { name: "Cauda", dice: 6, dmg: 2, type: "perf", range: "perto" },
        { name: "Mordida que prende", dice: 7, dmg: 1, type: "cort", range: "maos", fx: "Se acertar, prende o alvo e repete o ataque a cada rodada com +1 dado, até ele cair ou a cabeça morrer." },
        { name: "Cuspe ácido", dice: 7, dmg: 1, type: "atip", range: "perto", fx: "Se acertar, mais 1 de dano por rodada durante D3 rodadas." }
      ]
    },
    {
      id: "manticora", name: "Mantícora", kind: "monstro", page: 102,
      str: 14, agi: 4, armor: 5, move: 2,
      skills: [["Patrulha", 4]],
      traits: [
        { name: "Ponta da cauda", text: "Arma de esmagamento na ponta da cauda (−3) que cause 3 ou mais de dano esmaga a glândula: ela perde 1 de Agilidade por rodada." }
      ],
      attacks: [
        { name: "Ferrão", dice: 9, dmg: 2, type: "perf", range: "curta", fx: "Se acertar, veneno paralisante Potência 8." },
        { name: "Mordida", dice: 9, dmg: 2, type: "cort", range: "maos" },
        { name: "Garras", dice: 10, dmg: 1, type: "cort", range: "perto", fx: "Se acertar, o alvo cai." },
        { name: "Cauda", dice: 8, dmg: 2, type: "esmag", range: "perto", all: true, fx: "Quem for atingido cai." },
        { name: "Investida", dice: 10, dmg: 2, type: "esmag", range: "perto", fx: "No alvo de maior Força. Se acertar, ele cai." },
        { name: "Chuva de ferrões", dice: 7, dmg: 2, type: "perf", range: "curta", all: true, fx: "Quem for atingido sofre veneno paralisante Potência 8. Uma vez por combate." }
      ]
    },
    {
      id: "minotauro", name: "Minotauro", kind: "monstro", page: 104,
      str: 10, agi: 4, wits: 2, emp: 2, armor: 2, armorNote: "pelagem, mais a que vestir", move: 1,
      skills: [["Patrulha", 3]], gear: "Machado de duas mãos",
      attacks: [
        { name: "Murro", dice: 8, dmg: 1, type: "esmag", range: "maos" },
        { name: "Coice", dice: 9, dmg: 1, type: "esmag", range: "maos", fx: "Se acertar, joga o alvo para Perto, caído." },
        { name: "Chifrada", dice: 10, dmg: 2, type: "perf", range: "maos" },
        { name: "Golpe que racha", dice: 10, dmg: 3, type: "cort", range: "maos", block: true, fx: "Dano da arma (machado de duas mãos). Ignora 3 de Armadura." },
        { name: "Arco do machado", dice: 8, dmg: 3, type: "cort", range: "maos", all: true, fx: "Dano da arma." },
        { name: "Pisotear", dice: 12, dmg: 1, type: "esmag", range: "maos", fx: "Se acertar, o alvo cai." }
      ]
    },
    {
      id: "polvo-gigante", name: "Polvo Gigante", kind: "monstro", page: 108,
      str: 14, agi: 4, armor: 4, move: 1,
      traits: [
        { name: "Cabeça sensível", text: "Esmagamento na cabeça (−2) ignora a Armadura." },
        { name: "Tentáculos", text: "Tem D6+3. Por rodada ataca com até D3 deles numa ação lenta só, cada um sorteando na tabela. Perde um tentáculo a cada 3 de dano." }
      ],
      attacks: [
        { name: "Tentáculo", dice: 7, dmg: 1, type: "esmag", range: "perto", fx: "Se acertar, o alvo fica Agarrado." },
        { name: "Pro fundo", dice: 6, dmg: 1, type: "esmag", range: "perto", fx: "Se acertar, o alvo fica Agarrado e debaixo d'água (afogamento)." },
        { name: "Aperto", dice: 8, dmg: 1, type: "esmag", range: "perto", fx: "Se acertar, Agarrado; repete o ataque toda rodada até ele se soltar." },
        { name: "Chicote", dice: 9, dmg: 1, type: "esmag", range: "perto", fx: "Se acertar, o alvo cai." },
        { name: "Engolir", dice: 8, dmg: 2, type: "cort", range: "perto", fx: "Se acertar, engole o alvo: 1 de dano por rodada, pode atacar por dentro sem Armadura e só sai com o polvo morto." },
        { name: "Tinta", dice: 0, range: "perto", all: true, fx: "Escuridão total para todos em Perto por D6 rodadas." }
      ]
    },
    {
      id: "sangrento", name: "Sangrento", kind: "monstro", page: 110,
      str: 8, agi: 4, armor: 6, move: 1,
      traits: [
        { name: "Névoa", text: "Em forma de névoa é imune a ataque físico. Materializado, armas de cobre ferem normal; as outras, metade do dano (para cima)." },
        { name: "Odeia luz", text: "Tocha ou lanterna ao alcance das mãos tira mais D3 de Força dele." }
      ],
      attacks: [
        { name: "Lâmina", dice: 12, dmg: 2, type: "cort", range: "maos" },
        { name: "Rodopio", dice: 8, dmg: 2, type: "cort", range: "maos", all: true },
        { name: "Estocada dupla", dice: 10, dmg: 2, type: "cort", range: "maos", fx: "Contra dois alvos." },
        { name: "Névoa do medo", dice: 8, fear: true, range: "perto", all: true },
        { name: "Na jugular", dice: 10, dmg: 2, type: "cort", range: "perto", fx: "No alvo de menor Força. Dano em Força e em Astúcia; se acertar, infecção demoníaca Virulência 9." },
        { name: "Sugar a vida", dice: 12, fear: true, range: "perto" }
      ]
    },
    {
      id: "serpente-marinha", name: "Serpente Marinha", kind: "monstro", page: 112,
      str: 18, agi: 3, armor: 5, move: 2, moveNote: "na água",
      traits: [
        { name: "Cauda", text: "Se um ataque na cauda (−2) tirar sangue com arma cortante ou perfurante, a cada ataque dela role D6: de 4 a 6, ela ataca a si mesma." }
      ],
      attacks: [
        { name: "Cauda", dice: 10, dmg: 2, type: "esmag", range: "perto", fx: "Se acertar, o alvo cai. Dano estimado (o livro não dá o número)." },
        { name: "Engolir", dice: 8, dmg: 1, type: "cort", range: "maos", fx: "No alvo de maior Força. Se acertar, engole: 1 de dano por rodada, pode atacar por dentro sem Armadura e sai quando ela morrer." },
        { name: "Mordida", dice: 10, dmg: 2, type: "cort", range: "perto" },
        { name: "Pro fundo", dice: 8, dmg: 2, type: "cort", range: "perto", fx: "Se acertar, Agarrado e puxado para a água (afogamento)." },
        { name: "Desabar", dice: 9, dmg: 1, type: "esmag", range: "perto", fx: "Contra dois alvos; quem for atingido cai no convés ou na água." },
        { name: "Constrição", dice: 11, dmg: 2, type: "esmag", range: "perto", fx: "Se acertar, Agarrado e sofre o mesmo ataque toda rodada, sem gastar a ação dela." }
      ]
    },
    {
      id: "troll", name: "Troll", kind: "monstro", page: 114,
      str: 14, strNote: "de 12 a 16", agi: 2, armor: 4, armorNote: "pele", move: 1,
      skills: [["Patrulha", 4]],
      traits: [
        { name: "Regeneração", text: "Recupera 1 de Força por rodada." },
        { name: "Fedor", text: "Inimigos ao alcance das mãos perdem 1 de Agilidade por rodada." },
        { name: "Luz do sol", text: "Sob sol direto, perde 1 de Força por rodada." }
      ],
      attacks: [
        { name: "Garras", dice: 9, dmg: 1, type: "cort", range: "maos", fx: "Se acertar, doença Virulência 6." },
        { name: "Mordida", dice: 8, dmg: 2, type: "esmag", range: "maos", fx: "O alvo fica Agarrado nas mandíbulas." },
        { name: "Arremesso", dice: 12, dmg: 1, type: "esmag", range: "maos", fx: "Se acertar, o alvo cai em Curta." },
        { name: "Braçada", dice: 8, dmg: 1, type: "esmag", range: "maos", all: true },
        { name: "Boliche", dice: 10, dmg: 1, type: "esmag", range: "maos", fx: "Pega o mais próximo e o atira em outro. Se acertar, o segundo (em Perto) leva um ataque igual; quem for atingido cai." },
        { name: "Bafo", dice: 7, attr: "Empatia", range: "perto", all: true }
      ]
    },
    {
      id: "urso-cinzento", name: "Urso Cinzento", kind: "monstro", page: 116,
      str: 14, agi: 2, armor: 4, armorNote: "pelagem", move: 2,
      skills: [["Patrulha", 3]],
      traits: [
        { name: "Fúria bestial", half: true, text: "Quando a Força cai para a metade, ataca de graça todos ao alcance das mãos: 7 dados, dano 1 cortante. Não gasta a ação dele." }
      ],
      attacks: [
        { name: "Garras", dice: 9, dmg: 2, type: "cort", range: "perto" },
        { name: "Mordida", dice: 10, dmg: 2, type: "esmag", range: "maos", block: true },
        { name: "Patada", dice: 8, dmg: 1, type: "esmag", range: "maos", fx: "Se acertar, joga o alvo para Perto, caído." },
        { name: "Varrida", dice: 7, dmg: 1, type: "cort", range: "maos", all: true },
        { name: "Rugido", dice: 7, fear: true, range: "perto", all: true },
        { name: "Abraço", dice: 9, dmg: 1, type: "esmag", range: "maos", fx: "Se acertar, o alvo fica Agarrado e precisa se libertar." }
      ]
    },
    {
      id: "verme-jovem", name: "Verme do Abismo jovem", kind: "monstro", page: 118,
      str: 14, agi: 2, armor: 4, move: 1,
      traits: "verme", attacks: "verme"
    },
    {
      id: "verme-velho", name: "Verme do Abismo velho", kind: "monstro", page: 118,
      str: 18, agi: 2, armor: 10, move: 2,
      traits: "verme", attacks: "verme"
    },
    {
      id: "vinha-estranguladora", name: "Vinha Estranguladora", kind: "monstro", page: 120,
      str: 8, agi: 3, armor: 0, move: 0,
      traits: [{ name: "Planta", text: "Fica escondida na vegetação. Pode arrancar as raízes e mudar de lugar, devagar." }],
      attacks: [
        { name: "Esporos", dice: 0, poison: "paralisante, Potência 8", range: "perto", fx: "Um alvo." },
        { name: "Enlaçar", dice: 6, dmg: 1, type: "esmag", range: "perto", all: true, fx: "Quem for atingido cai." },
        { name: "Chicote", dice: 8, dmg: 2, type: "esmag", range: "perto", fx: "Se acertar, o alvo cai." },
        { name: "Abraço", dice: 8, dmg: 1, type: "esmag", range: "perto", fx: "Se acertar, o alvo fica Agarrado." },
        { name: "Invasão", dice: 10, dmg: 2, type: "cort", range: "perto", fx: "Dano em Força e em Empatia." },
        { name: "Nuvem venenosa", dice: 0, poison: "paralisante, Potência 8", range: "perto", all: true }
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
        { name: "Garras", dice: 8, dmg: 1, type: "cort", range: "maos" },
        { name: "Mordida gelada", dice: 7, dmg: 2, type: "cort", range: "maos", block: true, fx: "No mais próximo. Se acertar, o alvo fica Hipotérmico." },
        { name: "Sacudida", dice: 7, dmg: 1, type: "cort", range: "maos", fx: "Se acertar, joga o alvo para Perto, caído." },
        { name: "Bote", dice: 8, dmg: 1, type: "cort", range: "maos", fx: "Se acertar, derruba e emenda na hora outro ataque: 6 dados, dano 2 cortante, sem esquiva." },
        { name: "Trava a mandíbula", dice: 7, dmg: 2, type: "esmag", range: "maos", fx: "Se acertar, o alvo fica Agarrado." },
        { name: "Na garganta", dice: 10, dmg: 2, type: "cort", range: "maos", block: true, fx: "Também tira metade do dano (para cima) em Empatia, e o alvo fica Hipotérmico." }
      ]
    },
    {
      id: "wyvern", name: "Wyvern", kind: "monstro", page: 124,
      str: 14, agi: 3, wits: 5, emp: 2, armor: 5, armorNote: "escamas", move: 3,
      traits: [{ name: "Desajeitada no chão", text: "Se for forçada ao chão, ataques contra ela ganham +2." }],
      attacks: [
        { name: "Garras", dice: 7, dmg: 1, type: "cort", range: "perto", fx: "Até dois alvos." },
        { name: "Mordida", dice: 10, dmg: 2, type: "cort", range: "maos", fx: "No mais próximo." },
        { name: "Mergulho", dice: 9, dmg: 2, type: "cort", range: "perto", fx: "Se acertar, o alvo cai." },
        { name: "Cabeçada", dice: 10, dmg: 2, type: "esmag", range: "maos", fx: "Se acertar, o alvo cai." },
        { name: "Sacudida", dice: 9, dmg: 2, type: "cort", range: "maos", fx: "Se acertar, joga o alvo para Perto, caído." },
        { name: "Leva pro alto", dice: 8, dmg: 0, range: "perto", fx: "Se acertar, sobe com o alvo até Curta e o solta na rodada seguinte: queda de 2D6+10 metros." }
      ]
    },

    /* ---------------- Combatentes comuns ---------------- */
    {
      id: "morto-inquieto", name: "Morto inquieto", kind: "comum", group: "Mortos-vivos", page: 106,
      str: 3, agi: 2, armor: 0, move: 1,
      skills: [["Luta", 2], ["Patrulha", 2]],
      traits: [NO_MIND],
      weapon: { name: "Mordida", dmg: 2 }
    },
    {
      id: "esqueleto", name: "Esqueleto", kind: "comum", group: "Mortos-vivos", page: 106,
      str: 3, agi: 2, armor: 3, armorNote: "couro batido (cota de malha: 6) e elmo fechado 3", move: 1,
      skills: [["Luta", 3], ["Patrulha", 3]], gear: "Espada larga enferrujada, couro batido ou cota de malha, elmo fechado",
      traits: [{ name: "Ossudo", text: "Flechas e armas pontiagudas tiram no máximo 1 de Força." }, NO_MIND],
      weapon: { name: "Espada larga", bonus: 2, dmg: 2, type: "cort" }
    },
    {
      id: "carnical", name: "Carniçal", kind: "comum", group: "Mortos-vivos", page: 106,
      str: 4, agi: 2, armor: 0, move: 1,
      skills: [["Luta", 3], ["Patrulha", 3]],
      traits: [NO_MIND],
      weapon: { name: "Mordida", dmg: 2, fx: "Se ferir, infecção Virulência 4." }
    },
    {
      id: "insetoide-trabalhador", name: "Insetoide trabalhador", kind: "comum", group: "Insetoides", page: 100,
      str: 5, agi: 3, armor: 4, move: 1, traits: [{ name: "Trabalhadores e zangões", text: "Mesmos números para os dois." }, NO_MIND],
      weapon: { name: "Mordida", dmg: 1, type: "cort" }
    },
    {
      id: "insetoide-soldado", name: "Insetoide soldado", kind: "comum", group: "Insetoides", page: 100,
      str: 7, agi: 4, armor: 4, move: 2, traits: [NO_MIND],
      weapon: { name: "Mordida", dmg: 2, type: "cort", fx: "Se acertar, veneno paralisante Potência 7." }
    },
    {
      id: "insetoide-rainha", name: "Insetoide rainha", kind: "comum", group: "Insetoides", page: 100,
      str: 14, agi: 3, armor: 6, move: 1, traits: [{ name: "Rainha", text: "Matar a rainha expulsa a colônia." }, NO_MIND],
      weapon: { name: "Mordida", dmg: 2, type: "cort", fx: "Se acertar, veneno letal Potência 8." }
    },

    /* ---------------- Animais ---------------- */
    animal("urso", "Urso", 6, 2, 1, [["Luta", 3], ["Patrulha", 3]], "Garras", 2, "cort"),
    animal("lobo", "Lobo", 4, 4, 2, [["Luta", 3], ["Movimentação", 3], ["Patrulha", 5]], "Mordida", 1, "cort"),
    animal("raposa", "Raposa", 2, 4, 1, [["Luta", 2], ["Movimentação", 2], ["Patrulha", 4]], "Mordida", 1, "cort"),
    animal("cervo", "Cervo", 3, 4, 2, [["Movimentação", 4], ["Patrulha", 4]], "Chifres", 1, "esmag"),
    animal("javali", "Javali", 4, 2, 1, [["Luta", 3], ["Patrulha", 3]], "Presas", 1, "esmag"),
    animal("cavalo-montaria", "Cavalo de montaria", 5, 4, 2, [["Movimentação", 2], ["Patrulha", 3]], "Casco", 1, "esmag"),
    animal("cavalo-guerra", "Cavalo de guerra", 6, 5, 2, [["Luta", 2], ["Movimentação", 3], ["Patrulha", 3]], "Casco", 1, "esmag"),
    animal("burro", "Burro", 3, 3, 2, [["Movimentação", 2], ["Resiliência", 2], ["Patrulha", 3]], "Casco", 1, "esmag"),
    animal("cao-guerra", "Cão de guerra", 5, 3, 2, [["Luta", 3], ["Movimentação", 2], ["Patrulha", 3]], "Mordida", 1, "cort"),
    animal("crocodilo", "Crocodilo", 4, 2, 1, [["Luta", 3], ["Patrulha", 3]], "Mordida", 2, "cort"),
    animal("cao", "Cão", 3, 3, 2, [["Luta", 1], ["Patrulha", 5]], "Mordida", 1, "cort", { page: 127 }),
    animal("gato", "Gato", 1, 5, 1, [["Movimentação", 4], ["Patrulha", 5]], "Garras", 1, "cort", { page: 127 }),
    animal("ratos", "Ratos (bando)", 4, 3, 1, [["Movimentação", 3], ["Patrulha", 4]], "Mordida", 1, "cort", { swarm: true, page: 127 }),
    animal("morcegos", "Morcegos (bando)", 5, 3, 2, [["Movimentação", 3], ["Patrulha", 5]], "Mordida", 1, "cort", { swarm: true, page: 127 }),
    animal("corvo", "Corvo", 1, 3, 2, [["Movimentação", 3], ["Patrulha", 4]], "Bico", 1, "cort", { page: 127 }),
    animal("aguia", "Águia", 3, 5, 3, [["Luta", 3], ["Movimentação", 3], ["Patrulha", 5]], "Garras", 1, "cort", { page: 127 }),
    animal("cobra", "Cobra", 1, 3, 1, [["Luta", 3], ["Patrulha", 4]], "Mordida", 0, "", { fx: "Se acertar, veneno letal Potência 4.", page: 127 }),
    animal("escorpiao-aranha", "Escorpião ou aranha", 1, 3, 1, [["Luta", 2], ["Movimentação", 3], ["Patrulha", 3]], "Ferrão ou quelíceras", 0, "", { fx: "Se acertar, veneno paralisante Potência 6.", page: 127 })
  ];

  function animal(id, name, str, agi, move, skills, wname, dmg, type, extra) {
    var m = { id: id, name: name, kind: "animal", page: extra && extra.page || 126, str: str, agi: agi, armor: 0, move: move, skills: skills,
      weapon: { name: wname, dmg: dmg, type: type, fx: extra && extra.fx } };
    if (extra && extra.swarm) m.traits = [{ name: "Bando", text: "Conta como uma criatura só; cada ataque contra o bando tira no máximo 1 de Força." }];
    return m;
  }

  var SHARED_ATTACKS = {
    dragao: [
      { name: "Garras", dice: 10, dmg: 2, type: "cort", range: "perto", fx: "Contra dois alvos." },
      { name: "Rugido", dice: 8, fear: true, range: "perto", all: true },
      { name: "Vento das asas", dice: 6, dmg: 1, type: "esmag", range: "perto", all: true, dodge: false, fx: "Todos em Perto caem no chão." },
      { name: "Sopro de fogo", dice: 12, dmg: 1, type: "atip", range: "curta", fx: "No alvo de maior Força. Se acertar, ele segue sofrendo o mesmo dano a cada rodada até apagar o fogo (Movimentação, ação rápida)." },
      { name: "Cauda", dice: 8, dmg: 1, type: "esmag", range: "perto", all: true, fx: "Quem for atingido cai." },
      { name: "Tempestade de fogo", dice: 12, dmg: 1, type: "atip", range: "curta", all: true, fx: "Queima como o sopro de fogo. Uma vez por combate." }
    ],
    verme: [
      { name: "Mordida", dice: 9, dmg: 2, type: "cort", range: "maos", fx: "Se acertar, empurra o alvo para Perto." },
      { name: "Rugido", dice: 5, fear: true, range: "perto", all: true },
      { name: "Desabar", dice: 12, dmg: 1, type: "esmag", range: "perto", all: true, fx: "Todos em Perto caem. Quem falhar em Movimentação (não gasta ação) também leva o ataque." },
      { name: "Engolir", dice: 10, dmg: 1, type: "cort", range: "maos", fx: "No alvo de maior Força, se ele falhar em Movimentação (não gasta ação). Engolido: 1 de dano por rodada; por dentro não há Armadura; 4 ou mais de dano por dentro abre a saída." },
      { name: "Corpo", dice: 7, dmg: 1, type: "esmag", range: "perto", all: true, fx: "Quem for atingido cai." },
      { name: "Chão se abre", dice: 0, range: "perto", all: true, fx: "Todos em Perto caem 2D6 metros e ficam caídos." }
    ]
  };
  var SHARED_TRAITS = {
    verme: [
      { name: "Boca", text: "Ataque na boca aberta (−2) ignora a Armadura." },
      { name: "Óleo no chão", text: "Óleo de lâmpada derramado no chão afasta os vermes." }
    ]
  };
  LIST.forEach(function (m) {
    if (typeof m.attacks === "string") m.attacks = SHARED_ATTACKS[m.attacks];
    if (typeof m.traits === "string") m.traits = SHARED_TRAITS[m.traits];
  });

  /* Outros livros (bestiary-bob.js e o que vier). */
  var SOURCES = { gm: "Guia do Mestre", bob: "Book of Beasts" };
  var BOOKS = (typeof module !== "undefined" && module.exports) ? [require("./bestiary-bob.js")] : [root.FLBookOfBeasts].filter(Boolean);
  var ENCOUNTERS = {};
  BOOKS.forEach(function (bk) {
    bk.LIST.forEach(function (m) { m.src = m.src || bk.src; LIST.push(m); });
    if (bk.ENCOUNTER) ENCOUNTERS[bk.src] = bk.ENCOUNTER;
  });
  LIST.forEach(function (m) { if (!m.src) m.src = "gm"; });

  /* Tabela de encontro (D66). */
  var ENCOUNTER_GM = [
    [11, 12, "vinha-estranguladora"], [13, 15, "urso-cinzento"], [16, 22, "warg-da-noite"], [23, 24, "fantasma"],
    [25, 26, "carnical"], [31, 32, "esqueleto"], [33, 34, "morto-inquieto"], [35, 36, "wyvern"], [41, 42, "harpias"],
    [43, 43, "minotauro"], [44, 44, "ent"], [45, 45, "verme-jovem"], [46, 46, "polvo-gigante"], [51, 51, "serpente-marinha"],
    [52, 52, "troll"], [53, 53, "cavaleiro-da-morte"], [54, 54, "insetoide-soldado"], [55, 55, "sangrento"], [56, 56, "manticora"],
    [61, 61, "grifo"], [62, 62, "gigante"], [63, 63, "hidra"], [64, 64, "demonio"], [65, 65, "dragonete"], [66, 66, "dragao-pequeno"]
  ];

  /* ---------------- Demônio (gerador, p. 78) ---------------- */

  var DEMON = {
    page: 78,
    // [de, até, forma, Força = D6 + n, Agilidade, Armadura ("d6" | "d6+3" | null), efeito]
    forms: [
      [11, 24, "Humanoide", 3, 3, "d6"], [25, 26, "Minotauro", 5, 3, "d6"], [31, 32, "Bode", 3, 4, "d6"],
      [33, 34, "Urso", 6, 3, "d6"], [35, 36, "Cobra", 4, 4, "d6"], [41, 42, "Morto-vivo", 3, 3, "d6"],
      [43, 44, "Aranha", 5, 4, "d6"], [45, 46, "Serpente", 3, 4, "d6"], [51, 52, "Lobo", 4, 4, "d6"],
      [53, 54, "Inseto", 2, 3, "d6"], [55, 56, "Lupino", 4, 4, "d6"], [61, 62, "Caranguejo gigante", 5, 2, "d6+3"],
      [63, 63, "Sapo gigante", 5, 2, "d6"], [64, 64, "Polvo", 4, 2, "d6", "Correr é ação lenta para ele."],
      [65, 65, "Névoa", 3, 3, null, "Armas físicas não o ferem."], [66, 66, "Sombra", 3, 3, null, "Armas físicas não o ferem."]
    ],
    // [de, até, nome, efeito, mudança]
    abilities: [
      [11, 12, "Pele de pedra", "Armadura +6.", { armor: 6 }], [13, 14, "Gigante", "Força +2D6.", { str2d6: true }],
      [15, 16, "Corpo em chamas", "Imune a fogo."], [21, 22, "Feito de gelo", "Armadura +2.", { armor: 2 }],
      [23, 24, "Mumificado", "Ataque de medo D6+5.", { fear: true }], [25, 26, "Gosmento", "Passa por aberturas minúsculas."],
      [31, 32, "Beleza sobrenatural", "+2 em Manipulação.", { manip: 2 }], [33, 34, "Coberto de feridas", "Toque infeccioso, Virulência D6+5.", { roll: "d6+5", label: "Virulência" }],
      [35, 36, "Penas", "Armadura +2.", { armor: 2 }], [41, 43, "Asas", "Voa, Movimento 3.", { move: 3 }],
      [44, 45, "Cheio de luz", "Ataque de medo D6+5.", { fear: true }], [46, 46, "Coberto de vinhas", "Armadura +3.", { armor: 3 }],
      [51, 53, "Transparente", "Todo ataque contra ele tem −3."],
      [54, 54, "Coberto de olhos", "Compra uma carta de iniciativa a mais e descarta a pior.", { extra: 1 }],
      [55, 55, "Sem olhos", "Compra uma carta de iniciativa a mais e descarta a melhor.", { extra: 1 }],
      [56, 66, null, null, { again: 2 }]
    ],
    // [de, até, ataque, Dados Base = D6 + n (null = medo), dano, alcance, efeito]
    // Dano: lista de faixas de D6 [até, dano]. O livro repete o 26 em Chifres e
    // Tentáculos e não lista o 56; aqui 26 fica com Chifres e 56 com Arma pesada.
    attacks: [
      [11, 15, "Garras", 4, [[2, 1], [5, 2], [6, 3]], "maos"],
      [16, 22, "Presas", 5, [[2, 1], [5, 2], [6, 3]], "maos"],
      [23, 26, "Chifres", 6, [[4, 2], [6, 3]], "maos"],
      [31, 32, "Tentáculos", 4, [[2, 1], [6, 2]], "perto", "Se acertar, o alvo fica Agarrado."],
      [33, 35, "Fogo", 6, [[4, 1], [6, 2]], "perto", "O alvo segue sofrendo 1 de dano por rodada até apagar o fogo com Movimentação. Dano do golpe estimado (o livro não dá)."],
      [36, 41, "Frio", 5, [[2, 1], [5, 2], [6, 3]], "perto", "O alvo fica Hipotérmico na hora. Dano estimado (o livro não dá)."],
      [42, 45, "Rugido", "d3+6", null, "perto"],
      [46, 51, "Olhar mortal", "d6+5", null, "perto"],
      [52, 56, "Arma pesada", 5, "arma", "maos"],
      [61, 65, null, 0, null, null, null, 3],
      [66, 66, null, 0, null, null, null, 4]
    ],
    weapons: [["Espada longa", 2, "cort"], ["Montante", 3, "cort"], ["Malho", 3, "esmag"], ["Maça estrela", 2, "esmag"], ["Machado de duas mãos", 3, "cort"], ["Tridente", 2, "perf"]],
    specials: [
      [11, 14, "Imune a armas", "Só ataque desarmado e magia o ferem."], [15, 22, "Imune a fogo", "Fogo não o fere."],
      [23, 25, "Imune a frio", "Frio não tem efeito."], [26, 32, "Rápido como um raio", "Compra duas cartas de iniciativa e age nas duas.", { extra: 1 }],
      [33, 34, "Imune a ataques físicos", "Ataque físico não adianta."],
      [35, 36, "Parasita", "Ao tocar a vítima, pode controlá-la, como a magia Titereiro com Nível de Poder 3."],
      [41, 43, "Regenerativo", "Recupera D3 de Força por rodada."],
      [44, 45, "Paralisante", "Quem ele toca sofre veneno paralisante Potência D6+5.", { roll: "d6+5", label: "Potência" }],
      [46, 51, "Venenoso", "Quem ele toca sofre veneno letal Potência D6+5.", { roll: "d6+5", label: "Potência" }],
      [52, 54, "Metamorfo", "Vira qualquer criatura, com uma cópia perfeita exceto por um detalhe pequeno."],
      [55, 56, "Imaterial", "Atravessa matéria sólida."], [61, 62, "Flutuante", "Não toca o chão; flutua até 10 metros de altura."],
      [63, 64, "Teleporte", "Se teleporta até Longe, uma vez a cada duas rodadas."],
      [65, 66, null, null, { again: 2 }]
    ],
    weaknesses: [
      [11, 13, "Água", "Sofre D3 de dano quando atingido por água."], [14, 15, "Fogo", "Recebe o dobro de dano de fogo."],
      [16, 21, "Frio", "Recebe o dobro de dano de frio."],
      [22, 24, "Luz", "Foge de luz forte. Se não puder, perde D3 por rodada perto de uma luz pequena (tocha) e D6 sob uma grande (o sol)."],
      [25, 31, "Prata", "Recebe o dobro de dano de armas de prata."], [32, 33, "Ouro", "Recebe o dobro de dano de armas de ouro."],
      [34, 35, "Crianças", "Precisa se afastar de crianças; se não puder, perde D3 por rodada."],
      [36, 41, "Elfos", "Precisa se afastar de elfos; se não puder, perde D3 por rodada."],
      [42, 43, "Anões", "Precisa se afastar de anões; se não puder, perde D3 por rodada."],
      [44, 52, "Símbolos sagrados", "Precisa se afastar de símbolos sagrados; se não puder, perde D3 por rodada."],
      [53, 56, "Música", "Precisa se afastar da música; se não puder, perde D3 por rodada."],
      [61, 63, "Terra", "Sofre D3 de dano ao tocar terra."], [64, 66, "Madeira", "Recebe o dobro de dano de armas de madeira."]
    ],
    skills: ["Patrulha", "Furtividade", "Movimentação", "Tradição", "Discernimento", "Manipulação"]
  };

  function pick(table, code) {
    for (var i = 0; i < table.length; i++) if (code >= table[i][0] && code <= table[i][1]) return table[i];
    return null;
  }

  /*
   * Gera um demônio. rng opcional (para teste). Devolve uma ficha no mesmo
   * formato das outras, com custom: true.
   */
  function demon(rng) {
    var r = rng || Math.random;
    function d6() { return 1 + Math.floor(r() * 6); }
    function d3() { return 1 + Math.floor(r() * 3); }
    function d66() { return d6() * 10 + d6(); }
    function dice(f) { return f === "d3+6" ? d3() + 6 : f === "d6+5" ? d6() + 5 : f; }

    var f = pick(DEMON.forms, d66());
    var m = {
      id: "demonio-" + Math.floor(r() * 1e9).toString(36), name: "Demônio " + f[2].toLowerCase(), kind: "monstro", src: "gm", page: DEMON.page,
      custom: "demonio", str: d6() + f[3], agi: f[4], wits: 3, emp: 3,
      armor: f[5] === "d6" ? d6() : f[5] === "d6+3" ? d6() + 3 : 0, move: 1,
      skills: [], traits: [], attacks: [], extraCards: 0
    };
    var notes = { form: f[2] };
    if (f[6]) m.traits.push({ name: "Forma de " + f[2].toLowerCase(), text: f[6] });

    function rollMany(table, n, add) {
      for (var i = 0; i < n; i++) {
        var row = pick(table, d66());
        if (row[4] && row[4].again) rollMany(table, row[4].again, add);
        else add(row);
      }
    }

    var manip = 0, fearAura = false;
    rollMany(DEMON.abilities, 1, function (a) {
      var fx = a[4] || {}, text = a[3];
      if (fx.armor) m.armor += fx.armor;
      if (fx.str2d6) { var g = d6() + d6(); m.str += g; text = "Força +" + g + " (2D6)."; }
      if (fx.move) m.move = fx.move;
      if (fx.manip) manip += fx.manip;
      if (fx.extra) m.extraCards += fx.extra;
      if (fx.fear) fearAura = true;
      if (fx.roll) text = text.replace("D6+5", String(d6() + 5));
      m.traits.push({ name: a[2], text: text });
    });

    function addAttacks(n) {
      for (var i = 0; i < n; i++) {
        var row = pick(DEMON.attacks, d66());
        if (row[7]) { addAttacks(row[7]); continue; }
        var atk = { name: row[2], range: row[5] };
        if (typeof row[3] === "string") { atk.dice = dice(row[3]); atk.fear = true; }
        else {
          atk.dice = d6() + row[3];
          if (row[4] === "arma") {
            var w = DEMON.weapons[d6() - 1];
            atk.name = w[0]; atk.dmg = w[1]; atk.type = w[2]; atk.block = true;
          } else {
            var t = d6();
            atk.dmg = row[4].filter(function (x) { return t <= x[0]; })[0][1];
          }
        }
        if (row[6]) atk.fx = row[6];
        m.attacks.push(atk);
      }
    }
    addAttacks(2);
    if (fearAura) m.attacks.push({ name: "Aura de pavor", dice: d6() + 5, fear: true, range: "perto", all: true });

    rollMany(DEMON.specials, 1, function (s) {
      var text = s[3];
      if (s[4] && s[4].roll) text = text.replace("D6+5", String(d6() + 5));
      if (s[4] && s[4].extra) m.extraCards += s[4].extra;
      m.traits.push({ name: s[2], text: text });
    });

    var wk = pick(DEMON.weaknesses, d66());
    m.traits.push({ name: "Fraqueza: " + wk[2].toLowerCase(), text: wk[3], weak: true });

    DEMON.skills.forEach(function (s) {
      var v = d6() - 1 + (s === "Manipulação" ? manip : 0);
      if (v > 0) m.skills.push([s, v]);
    });
    return m;
  }

  /* ---------------- Consulta ---------------- */

  var custom = [];
  function setCustom(list) { custom = Array.isArray(list) ? list : []; }

  function fold(s) {
    return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  }

  function all() { return custom.concat(LIST); }

  function get(id) {
    var l = all();
    for (var i = 0; i < l.length; i++) if (l[i].id === id) return l[i];
    return null;
  }

  var KIND_ORDER = { monstro: 0, comum: 1, animal: 2 };
  function search(q, src) {
    var f = fold(q).trim();
    var out = all().filter(function (m) { return !f || fold(m.name).indexOf(f) !== -1 || fold(m.group).indexOf(f) !== -1; });
    if (src) out = out.filter(function (m) { return m.custom ? src === "gm" : m.src === src; });
    return out.sort(function (a, b) {
      if (a.kind !== b.kind) return KIND_ORDER[a.kind] - KIND_ORDER[b.kind];
      if (!!a.custom !== !!b.custom) return a.custom ? -1 : 1;
      return a.name.localeCompare(b.name, "pt");
    });
  }

  function encounter(code, src) {
    var row = pick(src && src !== "gm" ? ENCOUNTERS[src] || [] : ENCOUNTER_GM, code);
    return row ? row[2] : null;
  }

  function skill(m, name) {
    var s = (m.skills || []).filter(function (x) { return x[0] === name; })[0];
    return s ? s[1] : 0;
  }

  /* Ataque de quem luta como pessoa: Força + Luta + bônus da arma. */
  function weaponAttack(m) {
    var w = m.weapon;
    return { name: w.name, dice: m.str, skill: skill(m, "Luta"), gear: w.bonus || 0, dmg: w.dmg, type: w.type, range: "maos", fx: w.fx || "", block: true, push: true };
  }

  function attacks(m) { return m.kind === "monstro" ? m.attacks : [weaponAttack(m)]; }

  /* Quantos Dados Base: "str" usa a Força atual (bando de harpias). */
  function baseDice(a, str) { return a.dice === "str" ? Math.max(0, str | 0) : a.dice; }

  /*
   * Resultado de um ataque: sixes = quantos 6 saíram.
   * Acerta com 1 sucesso; cada sucesso extra soma +1 ao dano.
   * Medo (ou attr): cada sucesso tira 1 do atributo.
   */
  function resolve(atk, sixes) {
    var n = Math.max(0, sixes | 0);
    if (atk.fear) return { hit: n > 0, dmg: n, attr: "Astúcia" };
    if (atk.attr) return { hit: n > 0, dmg: n, attr: atk.attr };
    if (!atk.dmg) return { hit: n > 0, dmg: 0, attr: "" };
    return { hit: n > 0, dmg: n > 0 ? atk.dmg + n - 1 : 0, attr: "Força" };
  }

  function rangeName(k) { return RANGE[k] || k || ""; }
  function typeName(k) { return TYPE[k] || k || ""; }

  /* "9 dados · dano 2 cortante" */
  function attackLine(a, str) {
    if (!a.dice) return a.poison ? "veneno " + a.poison : "sem rolagem";
    var n = a.dice === "str" ? (str != null ? str + " dados (a Força)" : "dados = Força") : a.dice + (a.skill ? "+" + a.skill : "") + (a.gear ? "+" + a.gear : "") + " dados";
    if (a.dice !== "str" && !a.skill && !a.gear && a.dice === 1) n = "1 dado";
    if (a.fear) return n + " · medo";
    if (a.attr) return n + " · dano em " + a.attr;
    return n + (a.dmg ? " · dano " + a.dmg + (a.type ? " " + typeName(a.type) : "") : "");
  }

  var api = {
    RULES: RULES,
    COMMON_RULES: COMMON_RULES,
    ANIMAL_RULES: ANIMAL_RULES,
    LIST: LIST,
    ENCOUNTER: ENCOUNTER_GM,
    ENCOUNTERS: ENCOUNTERS,
    SOURCES: SOURCES,
    sourceName: function (k) { return SOURCES[k] || k; },
    DEMON: DEMON,
    get: get,
    all: all,
    search: search,
    encounter: encounter,
    demon: demon,
    setCustom: setCustom,
    attacks: attacks,
    weaponAttack: weaponAttack,
    baseDice: baseDice,
    resolve: resolve,
    rangeName: rangeName,
    typeName: typeName,
    attackLine: attackLine,
    fold: fold
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.FLBestiary = api;
})(typeof window !== "undefined" ? window : this);
