/*
 * Bestiário: monstros do Book of Beasts (Fria Ligan, 2023).
 *
 * Mesmo formato de bestiary.js: só números e mecânica, efeitos resumidos com
 * palavras nossas. Página = página impressa do livro (em inglês).
 * Carregar antes de bestiary.js.
 */
(function (root) {
  "use strict";

  var LIST = [
{
    id: "anfibio", name: "Anfíbio", kind: "comum", src: "bob", page: 7,
    str: 5, agi: 2, wits: 3, emp: 3, armor: 2, armorNote: "pele grossa de sapo", move: 1, moveNote: "2 na água, 1 em terra",
    skills: [["Resiliência", 2], ["Luta", 3], ["Patrulha", 3], ["Sobrevivência", 3]],
    gear: "Fisga ou arpão, adaga, amuleto de osso de peixe",
    traits: [
      { name: "Afogar", text: "Na água, prefere Agarrar a vítima, muitas vezes em grupo, e puxá-la para o fundo. Quem for puxado faz Resiliência a cada rodada ou começa a se afogar." },
      { name: "Investida contra barco", text: "O grupo bate no casco por baixo. D6: 1–2 molha todos e o equipamento; 3–4 todos fazem Movimentação (não gasta ação) ou caem na água; 5–6 o barco vira e todos caem na água. Quem cai sofre os ataques de afogar." }
    ],
    weapon: { name: "Fisga", bonus: 1, dmg: 3, type: "perf", fx: "Conta como tridente com +1 de dano. Com arpão (lança longa com +1 de dano): bônus 2, dano 2." }
  },
  {
    id: "ameba", name: "Ameba", kind: "monstro", src: "bob", page: 11,
    str: 18, agi: 3, armor: 0, armorNote: "nenhuma, mas resiste a armas", move: 2,
    traits: [
      { name: "Corpo amorfo", text: "Armas físicas causam metade do dano; armas perfurantes, nenhum." },
      { name: "Teme fogo", text: "Fogo causa o dobro de dano. Recua de quem carrega tocha ou outra coisa em chamas." }
    ],
    attacks: [
      { name: "Tentáculo", dice: 8, dmg: 2, type: "esmag", range: "perto", fx: "Um alvo." },
      { name: "Nuvem fétida", dice: 0, range: "perto", all: true, fx: "Todos em Perto fazem Resiliência. Quem falhar cai vomitando e não age até o mesmo ponto da iniciativa na próxima rodada." },
      { name: "Cuspe ácido", dice: 7, dmg: 1, range: "perto", fx: "No alvo de maior Força. Se ferir, veneno letal Potência 7." },
      { name: "Rostos", dice: 8, fear: true, range: "perto", all: true },
      { name: "Chuva de sanguessugas", dice: 9, dmg: 1, type: "perf", range: "perto", all: true, fx: "Só é atacado quem falhar em Movimentação (não gasta ação)." },
      { name: "Absorver", dice: 8, dmg: 1, type: "esmag", range: "perto", fx: "Se acertar, puxa o alvo para dentro: 1 de dano por rodada e morre ao ficar Acabado. Não dá para se soltar; sai com um golpe de 3 ou mais de dano por dentro, ou se a ameba morrer." }
    ]
  },
  {
    id: "basilisco", name: "Basilisco", kind: "monstro", src: "bob", page: 15,
    str: 24, agi: 6, wits: 2, armor: 8, move: 2,
    traits: [
      { name: "Vida presa ao ovo", text: "O ovo de onde nasceu fica no covil, coberto de veneno letal Potência 7 (pega pelo toque), e quebra fácil. Ovo destruído: perde os poderes e vira uma víbora inofensiva (Força 1, mordida dano 1, veneno sonífero Potência 4)." }
    ],
    attacks: [
      { name: "Garras", dice: 7, dmg: 2, type: "cort", range: "perto", fx: "Contra dois alvos." },
      { name: "Bicada", dice: 8, dmg: 2, type: "cort", range: "maos", fx: "Um alvo escolhido." },
      { name: "Canto", dice: 0, range: "perto", all: true, fx: "Todos em Perto fazem Resiliência (não gasta ação). Quem falhar cai e não age até o mesmo ponto da iniciativa na próxima rodada; fica surdo por um quarto de hora." },
      { name: "Chicotada", dice: 7, dmg: 1, type: "cort", range: "perto", all: true },
      { name: "Bafo de sapo", dice: 0, poison: "letal, Potência 7", range: "perto", all: true, fx: "Só quem falhar em Movimentação (não gasta ação). Também perde 1 de Empatia (mínimo 1) até ser tratado com Cura ou magia de cura." },
      { name: "Olhar de pedra", dice: 0, range: "maos", fx: "No alvo de maior Força máxima. Resiliência (não gasta ação) ou vira pedra: não age e morre em 2D6 rodadas. Uma Resiliência por rodada desfaz; Mãos que Curam, Cura da Natureza e Fechar Ferimentos também, enquanto vivo." }
    ]
  },
  {
    id: "homem-do-pantano", name: "Homem do Pântano", kind: "monstro", src: "bob", page: 19,
    str: 12, agi: 3, wits: 1, emp: 1, armor: 0, armorNote: "nenhuma, mas é meio imaterial", move: 1,
    traits: [
      { name: "Meio imaterial", text: "Só magia, armas mágicas e fogo o ferem." },
      { name: "Atraído por tesouros", text: "Sempre ataca quem carrega mais tesouro ou itens mágicos. Jogar um objeto brilhante no pântano o tira da luta." }
    ],
    attacks: [
      { name: "Grito de ódio", dice: 8, fear: true, range: "perto", all: true, fx: "Quem for atingido também fica Hipotérmico." },
      { name: "Raízes no pescoço", dice: 7, dmg: 1, type: "esmag", range: "perto", all: true, fx: "Quem for atingido fica Agarrado." },
      { name: "Pro fundo", dice: 7, dmg: 1, type: "cort", range: "maos", fx: "Se acertar, o alvo fica Agarrado e é puxado para dentro do pântano (afogamento)." },
      { name: "Névoa", dice: 0, range: "perto", all: true, fx: "Todos em Perto têm −2 em ataques e rolagens de combate por D3 rodadas, e fazem Resiliência ou ficam Hipotérmicos." },
      { name: "Abraço gelado", dice: 10, dmg: 2, type: "esmag", range: "perto", fx: "Se acertar, o alvo fica Hipotérmico." },
      { name: "Visão da própria morte", dice: 10, fear: true, range: "maos", fx: "Um alvo escolhido. Se acertar, também fica Hipotérmico." }
    ]
  },
  {
    id: "raptor-terrivel", name: "Raptor Terrível", kind: "monstro", src: "bob", page: 23,
    str: 14, agi: 5, wits: 1, armor: 3, armorNote: "penas", move: 3,
    traits: [
      { name: "Fácil de enganar", text: "Mudar de direção de repente, ziguezaguear ou se jogar atrás de um arbusto pode despistá-lo. O Mestre decide caso a caso; Sobrevivência ajuda." }
    ],
    attacks: [
      { name: "Chute com garra", dice: 9, dmg: 2, type: "cort", range: "perto", fx: "Se acertar, o alvo cai." },
      { name: "Guincho", dice: 7, fear: true, range: "perto", all: true },
      { name: "Trombada", dice: 8, dmg: 2, type: "esmag", range: "maos", fx: "Um alvo escolhido. Se acertar, ele cai." },
      { name: "Varrida de bico", dice: 7, dmg: 2, type: "cort", range: "perto", all: true },
      { name: "Sacudida", dice: 9, dmg: 2, type: "cort", range: "perto", fx: "Se acertar, joga o alvo para Curta, caído." },
      { name: "Bicada no pescoço", dice: 10, dmg: 2, type: "cort", range: "perto", fx: "No alvo que, a critério do Mestre, mais pareça um cavalo bem nutrido." }
    ]
  },
  {
    id: "guardiao-do-portal", name: "Guardião do Portal", kind: "monstro", src: "bob", page: 27,
    str: 24, agi: 4, wits: 4, armor: 5, armorNote: "couro demoníaco", move: 2,
    traits: [
      { name: "Enigma telepático", text: "Quem quer passar enfrenta um enigma em grupo: o aventureiro de maior Astúcia faz rolagem oposta de Astúcia contra ele (+1 se houver druida no grupo). Vencendo, passam ilesos; perdendo, ele ataca." },
      { name: "Preso ao portal", text: "Nunca sai do lugar: se for além de Curta do portal que guarda, se desfaz para sempre." }
    ],
    attacks: [
      { name: "Garras", dice: 8, dmg: 1, type: "cort", range: "perto", fx: "Contra dois alvos." },
      { name: "Mordida", dice: 9, dmg: 2, type: "cort", range: "perto", fx: "Um alvo escolhido." },
      { name: "Cauda", dice: 7, dmg: 1, type: "esmag", range: "perto", all: true, fx: "Quem for atingido cai." },
      { name: "Fome", dice: 0, range: "maos", fx: "Um alvo escolhido faz Resiliência (não gasta ação) ou fica Faminto, com −1 em rolagens de perícia até o fim do combate. Comer não resolve; só Mãos que Curam ou outra magia de cura druídica." },
      { name: "Sede", dice: 0, range: "maos", fx: "Um alvo escolhido faz Resiliência (não gasta ação) ou fica Desidratado, com −2 em ataques e perícias até o fim do combate. Beber não resolve; só Mãos que Curam ou outra magia de cura druídica." },
      { name: "Desfazer a mente", dice: 10, attr: "Astúcia", range: "perto", all: true, fx: "Todos em Perto fazem rolagem oposta de Astúcia contra ele (não gasta ação); só quem perder sofre o ataque. A Astúcia 0, fica catatônico." }
    ]
  },
  {
    id: "espectro-gigante", name: "Espectro Gigante", kind: "monstro", src: "bob", page: 31,
    str: 32, agi: 2, wits: 2, emp: 2, armor: 0, armorNote: "nenhuma, mas é meio imaterial", move: 1,
    traits: [
      { name: "Meio imaterial", text: "Armas não mágicas causam metade do dano; fogo e magia ferem normal." },
      { name: "Sempre volta", text: "Derrotado, some por um Quarto de Dia e retorna. Só Purgar Morto-vivo com Nível de Poder 3 ou mais o destrói de vez." },
      { name: "Estrela vermelha", text: "Role D6 a cada encontro. 1–2: só ataca para se defender e não usa os ataques 5 e 6 (role de novo). 3–4: agressivo, usa todos. 5–6: furioso, +1 Dado Base em todos os ataques." }
    ],
    attacks: [
      { name: "Golpe varrido", dice: 10, dmg: 2, type: "cort", range: "perto", fx: "Contra dois alvos." },
      { name: "Aperto gélido", dice: 9, fear: true, range: "maos", fx: "Um alvo. Se acertar, também fica Hipotérmico." },
      { name: "Rugido", dice: 8, fear: true, range: "perto", all: true },
      { name: "Visão da estrela", dice: 10, fear: true, range: "maos", fx: "Um alvo; depois ele cai no chão." },
      { name: "Redemoinho", dice: 10, dmg: 1, range: "perto", all: true, fx: "Quem for atingido voa para Curta e cai." },
      { name: "Olho vermelho", dice: 12, dmg: 1, range: "maos", fx: "No alvo de maior Força. Além disso, todos em Perto fazem Resiliência (não gasta ação) ou ficam cegos: −2 em ataques até o mesmo ponto da iniciativa na próxima rodada." }
    ]
  },
  {
    id: "aranha-gigante-filhote", name: "Aranha Gigante filhote", kind: "monstro", src: "bob", page: 35,
    str: 15, strNote: "de 10 a 20, conforme o bando", agi: 3, wits: 2, armor: 1, move: 2,
    traits: [
      { name: "Bando", text: "O bando conta como um monstro só; a Força depende de quantos são. Cada ataque contra ele tira no máximo 1 de Força." }
    ],
    attacks: [
      { name: "Mandíbulas", dice: 7, dmg: 1, type: "cort", range: "maos", fx: "Um alvo escolhido." },
      { name: "Patas", dice: 6, dmg: 1, type: "perf", range: "perto", all: true },
      { name: "Cerdas", dice: 0, range: "perto", all: true, fx: "Todos em Perto fazem Resiliência. Quem falhar fica sem fôlego e se coçando, sem agir até o mesmo ponto da iniciativa na próxima rodada." },
      { name: "Ferrão", dice: 6, dmg: 1, type: "perf", range: "maos", fx: "Um alvo escolhido. Se acertar, veneno sonífero Potência 6." },
      { name: "Cuspe grudento", dice: 0, range: "perto", all: true, fx: "Todos em Perto fazem Movimentação (não gasta ação). Quem falhar fica com −2 em ataques até o mesmo ponto da iniciativa na próxima rodada." },
      { name: "Arrastar", dice: 0, range: "maos", fx: "Um alvo escolhido faz rolagem oposta de Potência contra a Força do bando. Se perder, é arrastado uma zona por rodada; pode tentar se soltar uma vez por rodada (ação lenta)." }
    ]
  },
  {
    id: "aranha-gigante-macho", name: "Aranha Gigante macho adulto", kind: "monstro", src: "bob", page: 35,
    str: 16, agi: 6, wits: 3, armor: 3, move: 3,
    attacks: [
      { name: "Mandíbulas", dice: 9, dmg: 2, type: "cort", range: "maos", fx: "Um alvo escolhido." },
      { name: "Patas", dice: 7, dmg: 2, type: "perf", range: "perto", all: true },
      { name: "Cerdas", dice: 0, range: "perto", all: true, fx: "Todos em Perto fazem Resiliência. Quem falhar sufoca (regras de afogamento) até passar em Resiliência (não gasta ação)." },
      { name: "Ferrão", dice: 7, dmg: 1, type: "perf", range: "maos", block: true, fx: "Um alvo escolhido. Se ferir, veneno paralisante Potência 8. Pode ser bloqueado." },
      { name: "Teia", dice: 0, range: "maos", fx: "No alvo de maior Força (ou mais corpulento). Movimentação (não gasta ação) ou fica preso no casulo sem se mover, sofrendo 1 de dano por rodada. Sair exige Potência (ação lenta)." },
      { name: "Salto", dice: 8, dmg: 2, type: "esmag", range: "curta", fx: "Se acertar, o alvo cai." }
    ]
  },
  {
    id: "aranha-gigante-femea", name: "Aranha Gigante fêmea anciã", kind: "monstro", src: "bob", page: 35,
    str: 28, agi: 2, wits: 4, armor: 5, move: 2,
    traits: [
      { name: "Telepatia", text: "Sente todos os seres vivos até Longe. Em Perto, cada aventureiro faz rolagem oposta de Astúcia contra ela; quem perder tem −1 em todas as rolagens até o fim do combate." }
    ],
    attacks: [
      { name: "Mandíbulas", dice: 9, dmg: 3, type: "cort", range: "maos", fx: "Um alvo." },
      { name: "Patas", dice: 8, dmg: 2, type: "perf", range: "perto", all: true },
      { name: "Cerdas", dice: 0, range: "perto", all: true, fx: "Todos em Perto fazem Patrulha (não gasta ação). Quem falhar tem −2 em ataques, como no escuro, até o mesmo ponto da iniciativa na próxima rodada." },
      { name: "Ferrão", dice: 9, dmg: 2, type: "perf", range: "maos", fx: "Um alvo escolhido. Se ferir, veneno letal Potência 10." },
      { name: "Teia", dice: 0, range: "maos", fx: "No alvo de maior Força (ou mais corpulento). Movimentação (não gasta ação) ou fica preso no casulo sem se mover, sofrendo 2 de dano por rodada. Sair exige Potência (ação lenta)." },
      { name: "Sussurro mortal", dice: 9, fear: true, range: "perto", all: true }
    ]
  },
{
    id: "golem-maior", name: "Golem Maior", kind: "monstro", src: "bob", page: 43,
    str: 20, agi: 2, wits: 2, armor: 8, armorNote: "pedra; metade do dano de cortante e perfurante", move: 1,
    traits: [
      { name: "Pedra", text: "Recebe metade do dano de armas cortantes e perfurantes." },
      { name: "Runa da vida", text: "Abatido sem magia, volta com Força cheia em um quarto de hora. Só morre de vez se a runa da testa for destruída: ataque nela com −2 que cause 3 ou mais de dano." }
    ],
    attacks: [
      { name: "Murro", dice: 9, dmg: 1, type: "esmag", range: "maos", fx: "Num alvo escolhido. Se acertar, o alvo cai." },
      { name: "Arremesso", dice: 8, dmg: 1, type: "esmag", range: "perto", fx: "Se acertar, o alvo voa para Curta e cai." },
      { name: "Esmagar", dice: 10, dmg: 2, type: "esmag", range: "maos", fx: "Contra dois alvos; quem for atingido cai." },
      { name: "Runa que prende", dice: 0, range: "perto", all: true, fx: "Cada um rola Discernimento; quem falhar fica paralisado, sem ações, até o mesmo ponto da iniciativa na rodada seguinte." },
      { name: "Runa do medo", dice: 9, fear: true, range: "perto", all: true },
      { name: "Runa que cega", dice: 0, range: "perto", all: true, fx: "Cada um rola Discernimento com −2; quem falhar fica cego (como escuridão total) até o mesmo ponto da iniciativa na rodada seguinte." }
    ]
  },
  {
    id: "diabrete", name: "Diabrete", kind: "monstro", src: "bob", page: 47,
    str: 6, agi: 4, wits: 6, armor: 3, armorNote: "escamas", move: 2,
    traits: [
      { name: "Ferro", text: "Magia, fogo e armas não mágicas sem ferro o ferem normalmente. Arma comum de ferro causa metade do dano; ferro abençoado por sacerdote (Serpente, Igreja do Corvo, Irmãos da Ferrugem) causa o dobro." },
      { name: "Atraído pela magia", text: "Quem tirar três ou mais caveiras (1) ao lançar uma magia atrai D3 diabretes na hora, que atacam o conjurador." }
    ],
    attacks: [
      { name: "Chão liso", dice: 0, range: "perto", all: true, fx: "Quem falhar em Movimentação (não gasta ação) cai." },
      { name: "Braços de chumbo", dice: 0, range: "maos", fx: "Nos dois de maior Força. Cada um rola Discernimento contra a Astúcia dele; quem perder larga a arma e não usa os braços por um Quarto de Dia." },
      { name: "Cabeça de burro", dice: 0, range: "maos", fx: "No alvo com a maior arma. Discernimento contra a Astúcia dele; quem perder só zurra até o mesmo ponto da iniciativa na rodada seguinte e fica com cabeça de burro por um Quarto de Dia: não fala e tem −3 em rolagens de Empatia." },
      { name: "Gases", dice: 0, range: "perto", fx: "Um alvo rola Resiliência (não gasta ação). Se falhar, os outros em Perto têm −2 em perícias por um turno (15 minutos)." },
      { name: "Língua de cobra", dice: 7, fear: true, range: "maos", fx: "Num alvo escolhido. Antes, Discernimento resistido (não gasta ação); só sofre o ataque se falhar, e fica sem falar por um Quarto de Dia." },
      { name: "Sugar magia", dice: 0, range: "maos", fx: "No feiticeiro mais hábil (sem feiticeiro, maior Astúcia). Discernimento contra a Astúcia dele (não gasta ação), uma tentativa por rodada; quem perder fica preso e, por rodada, perde 1 Ponto de Força de Vontade e 1 de Astúcia. Acaba se o diabrete levar 2 ou mais de dano num golpe só." }
    ]
  },
  {
    id: "dragao-de-ferro", name: "Dragão de Ferro", kind: "monstro", src: "bob", page: 51,
    str: 60, agi: 3, wits: 2, emp: 1, armor: 10, move: 3,
    skills: [["Patrulha", 2], ["Discernimento", 1], ["Manipulação", 1]],
    traits: [
      { name: "Guelras", text: "Ataque nos órgãos de respiração do pescoço tem −2; se acertar, a Armadura não conta." }
    ],
    attacks: [
      { name: "Garras", dice: 10, dmg: 2, range: "perto", fx: "Contra três alvos." },
      { name: "Mordida", dice: 12, dmg: 2, type: "cort", range: "perto", fx: "No alvo em Perto com mais metal (armas, armadura)." },
      { name: "Rugido", dice: 10, fear: true, range: "perto", all: true },
      { name: "Chão rachado", dice: 8, dmg: 1, range: "perto", all: true, fx: "Quem falhar em Movimentação (não gasta ação) cai numa fenda: queda de D10 metros. O livro não dá o dano do golpe; aqui está 1." },
      { name: "Cauda", dice: 9, dmg: 2, type: "esmag", range: "perto", all: true, fx: "Quem for atingido cai." },
      { name: "Nuvem ácida", dice: 12, dmg: 2, range: "perto", all: true, fx: "Quem for atingido sofre mais 1 de dano por rodada durante D6 rodadas." }
    ]
  },
  {
    id: "mara", name: "Mara", kind: "monstro", src: "bob", page: 55,
    str: 12, agi: 3, wits: 2, armor: 0, armorNote: "imaterial", move: 1,
    traits: [
      { name: "Imaterial", text: "Só magia e armas mágicas a ferem. Fogo causa metade do dano." },
      { name: "Ataque no sonho", text: "Ataca um adormecido por vez; troca de vítima se for forçada ou se ela ficar Acabada. A vítima não acorda. Quem estiver no mesmo cômodo rola Astúcia uma vez por rodada; se passar, acorda e pode atacar a sombra dela." }
    ],
    attacks: [
      { name: "Montaria", dice: 8, dmg: 1, type: "esmag", range: "maos", fx: "Se causar dano, a vítima rola Astúcia com +1 por rodada de ataque; se passar, acorda e a mara para até ela dormir de novo." },
      { name: "Grito", dice: 8, fear: true, range: "maos", fx: "Se acertar, a vítima fica Hipotérmica." },
      { name: "Beijo", dice: 0, poison: "letal, Potência 7", range: "maos", fx: "A vítima rola Astúcia; só sofre o veneno se falhar." },
      { name: "Mordida", dice: 9, dmg: 2, type: "cort", range: "maos", fx: "Ferida física, visível acordado. Se acertar, a vítima acorda." },
      { name: "Garras do sonho", dice: 10, fear: true, range: "maos", fx: "Se acertar, a vítima acorda, mas só grita, sem agir, por D10 rodadas." },
      { name: "Garras no peito", dice: 10, dmg: 2, type: "perf", range: "maos", fx: "Ferida física; Armadura não protege. Se deixar a vítima Acabada, arranca o coração. Só sara com Mãos que Curam ou outra magia de cura." }
    ]
  },
  {
    id: "draco-do-lodacal", name: "Draco do Lodaçal", kind: "monstro", src: "bob", page: 59,
    str: 32, agi: 3, wits: 5, emp: 2, armor: 8, move: 1, moveNote: "2 no ar e na água, 1 em terra",
    traits: [
      { name: "Atração perigosa", text: "Humano com Astúcia 3 ou menos, a cada rodada em Perto dele, rola Discernimento contra a Astúcia do draco; se perder, não pode atacá-lo nem prejudicá-lo nessa rodada." }
    ],
    attacks: [
      { name: "Mordida", dice: 9, dmg: 2, type: "cort", range: "perto", fx: "Num alvo escolhido." },
      { name: "Garras", dice: 7, dmg: 1, type: "cort", range: "perto", fx: "Contra dois alvos." },
      { name: "Guincho", dice: 7, fear: true, range: "perto", all: true },
      { name: "Chicotada", dice: 7, dmg: 1, type: "esmag", range: "perto", all: true, fx: "Quem for atingido cai." },
      { name: "Pro fundo", dice: 7, dmg: 1, type: "cort", range: "maos", fx: "Se acertar, arrasta o alvo para debaixo d'água (afogamento). Soltar-se exige Potência (ação lenta)." },
      { name: "Nuvem tóxica", dice: 0, poison: "letal, Potência 10", range: "perto", all: true }
    ]
  },
  {
    id: "mumia", name: "Múmia", kind: "monstro", src: "bob", page: 63,
    str: 24, agi: 3, wits: 2, armor: 8, armorNote: "só a que veste: armadura de placas (elmo grande 4)", move: 1,
    skills: [["Potência", 6]], gear: "Montante, armadura de placas, elmo grande, um achado Valioso",
    traits: [
      { name: "Corpo oco", text: "Arma física causa metade do dano; perfurante não causa nenhum. Arma mágica fere normal; fogo causa o dobro." },
      { name: "Fome de entranhas", text: "Sempre ataca quem tem mais Força e o segue se ele recuar. Se ele morrer, gasta uma rodada comendo o coração dele." },
      { name: "Presa à tumba", text: "Perde 2 de Força por rodada que passar além de Perto da entrada da cripta." }
    ],
    attacks: [
      { name: "Golpe senhorial", dice: 12, dmg: 3, type: "cort", range: "maos", fx: "Dano da arma (montante). No alvo de maior Força. Se ferir, joga o alvo para Perto, caído." },
      { name: "Fúria antiga", dice: 9, fear: true, range: "perto", all: true },
      { name: "Frio da morte", dice: 0, poison: "paralisante, Potência 10", range: "maos", dodge: false, fx: "No alvo de maior Força. Ele também fica Hipotérmico." },
      { name: "Sopro da morte", dice: 0, poison: "sonífero, Potência 8", range: "perto", all: true, dodge: false },
      { name: "Espíritos", dice: 10, fear: true, range: "perto", all: true },
      { name: "Aperto no coração", dice: 10, dmg: 1, type: "atip", range: "maos", fx: "No alvo de maior Força, que rola Resiliência (não gasta ação). Se falhar, sofre o ataque e depois um ataque de medo com 10 dados. Se passar, o dano cai pela metade e não há medo." }
    ]
  },
  {
    id: "espirito-da-natureza", name: "Espírito da Natureza", kind: "monstro", src: "bob", page: 67,
    str: 18, agi: 3, wits: 2, emp: 1, armor: 0, armorNote: "parcialmente imaterial", move: 1,
    traits: [
      { name: "Parcialmente imaterial", text: "Fogo e armas não mágicas causam metade do dano." },
      { name: "Sede de oferendas", text: "Com promessa de oferendas, Manipulação contra a Astúcia dele o faz parar de lutar ou mudar de morada." }
    ],
    attacks: [
      { name: "Garras", dice: 7, dmg: 1, type: "cort", range: "perto", block: true, fx: "Contra dois alvos." },
      { name: "Vendaval", dice: 9, dmg: 2, type: "esmag", range: "maos", fx: "Num alvo escolhido. Se acertar, o alvo voa para Curta e cai." },
      { name: "Terremoto", dice: 8, dmg: 1, type: "esmag", range: "perto", all: true, fx: "Só sofre o ataque quem falhar em Movimentação (não gasta ação)." },
      { name: "Ira", dice: 8, fear: true, range: "perto", all: true },
      { name: "Terra e pedras", dice: 10, dmg: 2, type: "esmag", range: "perto", all: true, block: true },
      { name: "Drenar vida", dice: 0, range: "maos", fx: "No alvo de maior Força. Se falhar em Movimentação, fica preso e perde 1 de Força por rodada. Não se solta sozinho; os tentáculos somem se outro causar 3 ou mais de dano no espírito num golpe só." }
    ]
  },
  {
    id: "possessor", name: "Possessor", kind: "monstro", src: "bob", page: 71,
    str: 10, agi: 4, wits: 3, armor: 0, move: 1,
    traits: [
      { name: "Hospedeiro", text: "Entra e sai das vítimas pelas vias aéreas." },
      { name: "Só no hospedeiro", text: "Como névoa, é imune a tudo, até magia, exceto luz forte. Dentro de um hospedeiro sofre dano normal e morre se ele morrer; por isso foge de hospedeiro Acabado, e pode possuir outro corpo próximo." },
      { name: "Sensível à luz", text: "Tocha ou lanterna serve de arma de luta contra ele: bônus +1, dano 1. Cristal de luz de fogo-fátuo: bônus +2, dano 3." }
    ],
    attacks: [
      { name: "Língua", dice: 10, dmg: 2, type: "perf", range: "perto", fx: "Num alvo escolhido. Se acertar, veneno alucinógeno Potência 7." },
      { name: "Garras", dice: 8, dmg: 1, type: "cort", range: "perto", all: true },
      { name: "Bafo", dice: 0, range: "curta", all: true, fx: "Quem falhar em Resiliência pega infecção fúngica demoníaca, Virulência 9." },
      { name: "Névoa sufocante", dice: 10, fear: true, range: "curta", all: true, fx: "Cada um também rola Resiliência; quem falhar sufoca (regras de afogamento)." },
      { name: "Na garganta", dice: 12, dmg: 2, type: "cort", range: "perto", fx: "Num alvo escolhido. Dano em Força e em Astúcia." },
      { name: "Possuir", dice: 0, range: "perto", fx: "Um alvo rola Discernimento; se falhar, vira marionete sem mente do possessor. Tenta se libertar com Discernimento, uma vez por rodada." }
    ]
  },
  {
    id: "rei-dos-ratos", name: "Rei dos Ratos", kind: "monstro", src: "bob", page: 75,
    str: 24, agi: 3, wits: 8, emp: 2, armor: 2, move: 1,
    traits: [
      { name: "Cura ao contrário", text: "Magia de cura (Mãos que Curam, Cura da Natureza etc.) o fere: sofre dano igual ao Nível de Poder." }
    ],
    attacks: [
      { name: "Garras", dice: 6, dmg: 1, type: "cort", range: "maos", fx: "Se causar dano, infecção grave Virulência 6." },
      { name: "Flauta", dice: 7, fear: true, range: "perto", all: true },
      { name: "Aves carniceiras", dice: 8, dmg: 1, type: "cort", range: "maos", fx: "Num alvo escolhido." },
      { name: "Imundície", dice: 0, poison: "letal, Potência 6", range: "perto", all: true, dodge: false, fx: "Toda comida em Perto fica estragada (mesma Potência se comida). O livro não diz o tipo do veneno; aqui está letal." },
      { name: "Redemoinho de ratos", dice: 8, dmg: 1, type: "cort", range: "maos", fx: "Num alvo escolhido." },
      { name: "Praga", dice: 0, range: "perto", all: true, dodge: false, fx: "Doença demoníaca Virulência 7. Quem perder a rolagem resistida ganha furúnculos que estouram na mesma rodada: cada um tira 1 de Força. Magia de cura ou Cura da Natureza evita os furúnculos." }
    ]
  },
{
    id: "troll-das-rochas", name: "Troll das Rochas", kind: "monstro", src: "bob", page: 79,
    str: 28, agi: 2, wits: 2, armor: 8, armorNote: "pele de pedra", move: 1,
    skills: [["Patrulha", 4]],
    traits: [
      { name: "Pele de pedra", text: "Armas cortantes e perfurantes causam metade do dano." },
      { name: "Regeneração", text: "Recupera 1 de Força por rodada." },
      { name: "Luz do sol", text: "Sob sol direto, sofre 5 de dano por rodada." }
    ],
    attacks: [
      { name: "Soco na cabeça", dice: 10, dmg: 2, type: "esmag", range: "maos", fx: "Num alvo escolhido. Se acertar, o alvo cai." },
      { name: "Rugido", dice: 7, fear: true, range: "perto", all: true },
      { name: "Arremesso", dice: 12, dmg: 1, type: "esmag", range: "perto", fx: "Pega um alvo em Perto. Se acertar, ele cai em Curta." },
      { name: "Varrida", dice: 9, dmg: 2, type: "esmag", range: "perto", all: true, fx: "Quem for atingido cai." },
      { name: "Engolir", dice: 8, dmg: 2, type: "cort", range: "maos", fx: "Se acertar, engole o alvo: 1 de dano por rodada; por dentro não há Armadura; sai causando 4 ou mais de dano num golpe." },
      { name: "Esmagar", dice: 8, dmg: 2, type: "esmag", range: "perto", all: true, fx: "Quem for atingido cai." }
    ]
  },
  {
    id: "metamorfo", name: "Metamorfo", kind: "monstro", src: "bob", page: 83,
    str: 12, strNote: "12 na forma própria; imitando alguém, soma a Força da criatura imitada", agi: 3, wits: 2,
    armor: 0, armorNote: "corpo gelatinoso", move: 1,
    traits: [
      { name: "Gelatinoso", text: "Armas físicas não mágicas causam metade do dano; perfurantes, nenhum. Fogo fere normal; magia causa o dobro." },
      { name: "Imitação", text: "Vira a última criatura que devorou, se tiver Força igual ou menor, com a aparência, as perícias físicas, os ataques e a Força dela. Primeiro é preciso zerar a Força da forma imitada; aí ele volta à forma própria e luta com os próprios números." }
    ],
    attacks: [
      { name: "Tentáculo", dice: 7, dmg: 1, type: "esmag", range: "perto", fx: "Se acertar, veneno paralisante Potência 6." },
      { name: "Confusão", dice: 0, range: "perto", all: true, fx: "Todos em Perto rolam Astúcia (não gasta ação). Quem falhar não faz nada até a mesma posição de iniciativa na rodada seguinte." },
      { name: "Rostos dos devorados", dice: 9, fear: true, range: "curta", all: true },
      { name: "Gosma", dice: 0, range: "perto", all: true, fx: "Quem falhar em Resiliência pega doença necrótica Virulência 8." },
      { name: "Engolir", dice: 8, dmg: 2, type: "cort", range: "maos", fx: "No alvo de maior Força. Se acertar, engole: 1 de dano por rodada; sai causando 4 ou mais de dano num golpe ou com ajuda de fora. Se morrer lá dentro, o metamorfo assume a forma dele." },
      { name: "Jato de gosma", dice: 10, dmg: 2, type: "esmag", range: "maos", fx: "Num alvo escolhido. Se acertar, joga o alvo para Perto, caído." }
    ]
  },
  {
    id: "escolopendra", name: "Escolopendra", kind: "monstro", src: "bob", page: 87,
    str: 24, agi: 2, armor: 4, armorNote: "carapaça", move: 1,
    traits: [
      { name: "Atraída por corpos grandes", text: "Sempre ataca o alvo de maior Força, inclusive montarias mais fortes que os aventureiros. Levá-la até um animal maior permite fugir (exige Tradição)." }
    ],
    attacks: [
      { name: "Patas", dice: 8, dmg: 2, type: "cort", range: "perto", fx: "Contra dois alvos." },
      { name: "Mordida", dice: 9, dmg: 2, type: "cort", range: "perto", fx: "Se acertar, veneno paralisante Potência 7." },
      { name: "Chicote", dice: 7, dmg: 1, type: "esmag", range: "perto", all: true, fx: "Quem for atingido cai." },
      { name: "Ferrão", dice: 8, dmg: 2, type: "perf", range: "perto", fx: "Se ferir, veneno letal Potência 9." },
      { name: "Ameaça", dice: 7, fear: true, range: "perto", all: true },
      { name: "Ovos", dice: 8, dmg: 1, type: "perf", range: "perto", fx: "Se acertar, o alvo rola Resiliência; se falhar, os ovos eclodem em D10 rodadas e as larvas o atacam: 9 dados, dano 2 cortante. Magia de cura ou Cura impede." }
    ]
  },
  {
    id: "morte-enxameante", name: "Morte Enxameante", kind: "monstro", src: "bob", page: 91,
    str: 32, agi: 4, wits: 1, armor: 0, move: 3,
    traits: [
      { name: "Enxame", text: "Cada ataque contra o enxame tira no máximo 1 de Força. Fogo e magia de fogo são a exceção e causam o dobro do dano." },
      { name: "Mente coletiva", text: "Age como uma criatura só. Só dá para se comunicar com ele por magia poderosa." }
    ],
    attacks: [
      { name: "Fúria", dice: 7, fear: true, range: "curta", all: true, fx: "Dá +1 na próxima rolagem desta tabela." },
      { name: "Fome", dice: 0, range: "curta", all: true, fx: "Quem falhar em Resiliência perde 1 de Força. Se o enxame estiver ferido, recupera 2 de Força." },
      { name: "Nos olhos", dice: 0, range: "curta", all: true, fx: "Quem falhar em Resiliência não faz nada além de espantar insetos até a mesma posição de iniciativa na rodada seguinte." },
      { name: "Mandíbulas", dice: 7, dmg: 1, type: "cort", range: "curta", all: true, fx: "A Armadura dos alvos conta pela metade." },
      { name: "Nuvem pegajosa", dice: 0, poison: "paralisante, Potência 7", range: "curta", all: true, fx: "Só em quem falhar em Movimentação." },
      { name: "Devorar", dice: 12, dmg: 2, type: "cort", range: "maos", dodge: false, fx: "Num alvo escolhido. O alvo cai." }
    ]
  },
  {
    id: "tupilaq", name: "Tupilaq", kind: "monstro", src: "bob", page: 95,
    str: 24, agi: 2, wits: 1, armor: 0, move: 2,
    traits: [
      { name: "Carne remendada", text: "Armas não mágicas causam metade do dano." },
      { name: "Alvo designado", text: "Tem uma missão: matar um ou mais alvos. Só contra eles usa os números maiores dos ataques; contra os companheiros, não." }
    ],
    attacks: [
      { name: "Mordida", dice: 5, dmg: 1, type: "cort", range: "maos", fx: "Contra alvo designado: 7 dados, dano 2. Se ferir, veneno paralisante Potência 6." },
      { name: "Garras", dice: 6, dmg: 1, type: "cort", range: "maos", fx: "Contra alvo designado: 8 dados, dano 2." },
      { name: "Escuridão", dice: 0, range: "perto", all: true, fx: "Quem falhar em Discernimento (não gasta ação) fica cego (−2) até a mesma posição de iniciativa na rodada seguinte." },
      { name: "Rugido", dice: 7, fear: true, range: "perto", all: true },
      { name: "Investida", dice: 8, dmg: 1, type: "esmag", range: "perto", fx: "Contra alvo designado: 10 dados, dano 2. Se acertar, o alvo cai." },
      { name: "Abraço", dice: 7, dmg: 1, type: "esmag", range: "maos", fx: "Se acertar, o alvo fica Agarrado e, a cada rodada preso, sofre veneno letal Potência 6 (9 contra alvo designado)." }
    ]
  },
  {
    id: "ent-retorcido", name: "Ent Retorcido", kind: "monstro", src: "bob", page: 99,
    str: 36, agi: 3, wits: 1, emp: 1, armor: 10, armorNote: "casca", move: 1,
    traits: [
      { name: "Sensível à música", text: "Atuação bem-sucedida o faz parar no lugar. Acaba se a música parar, se ele for atacado ou se o músico sair de Curta." },
      { name: "Larvas demoníacas", text: "Enxame de larvas com Força 5 e Agilidade 2. A mordida tem dano 1, ignora a Armadura e causa veneno paralisante Potência 6." }
    ],
    attacks: [
      { name: "Rugido", dice: 8, fear: true, range: "curta", all: true },
      { name: "Varrida", dice: 9, dmg: 2, type: "esmag", range: "perto", fx: "Contra dois alvos; quem for atingido cai." },
      { name: "Tentáculos", dice: 10, dmg: 2, type: "esmag", range: "maos", fx: "Se acertar, o alvo fica Agarrado. Os tentáculos têm Força 6." },
      { name: "Esmagar", dice: 11, dmg: 2, type: "esmag", range: "maos" },
      { name: "Engolir", dice: 9, dmg: 2, type: "cort", range: "maos", fx: "Se acertar, engole o alvo; só sai causando 3 ou mais de dano num golpe ou com o ent morto." },
      { name: "Chuva de larvas", dice: 8, dmg: 1, type: "esmag", range: "perto", all: true, fx: "Quem for atingido também leva o ataque do enxame de larvas." }
    ]
  },
  {
    id: "dragao-morto-vivo", name: "Dragão Morto-vivo", kind: "monstro", src: "bob", page: 103,
    str: 48, agi: 4, wits: 6, emp: 3, armor: 0, move: 3,
    skills: [["Patrulha", 3], ["Tradição", 4], ["Discernimento", 3], ["Manipulação", 4]],
    traits: [
      { name: "Esqueleto", text: "Armas perfurantes tiram no máximo 1 por ataque. Outros ataques físicos causam metade do dano; fogo e magia, normal." },
      { name: "Comandar mortos", text: "A qualquer momento controla D10 mortos-vivos. Role D10: 1–4 mortos inquietos, 5–7 esqueletos, 8–10 carniçais." }
    ],
    attacks: [
      { name: "Garras", dice: 8, dmg: 2, range: "perto", fx: "Contra dois alvos." },
      { name: "Mordida", dice: 9, dmg: 2, type: "cort", range: "perto", fx: "Num alvo escolhido. Se acertar, doença (febre) Virulência 6." },
      { name: "Rugido", dice: 8, fear: true, range: "perto", all: true },
      { name: "Chamar os mortos", dice: 0, range: "maos", fx: "Manda D10 mortos-vivos contra os aventureiros (ver Comandar mortos). Sem mortos por perto, eles saem da terra." },
      { name: "Cauda", dice: 7, dmg: 1, type: "esmag", range: "perto", all: true, fx: "Quem for atingido cai." },
      { name: "Chuva de ossos", dice: 10, dmg: 2, type: "perf", range: "perto", all: true, fx: "Os alvos ficam com −2 em todos os ataques até a mesma posição de iniciativa na rodada seguinte." }
    ]
  },
  {
    id: "vampiro", name: "Vampiro", kind: "monstro", src: "bob", page: 107,
    str: 18, agi: 4, wits: 4, emp: 4, armor: 6, armorNote: "só a que veste (cota de malha; grande elmo 4)", move: 1,
    skills: [["Potência", 4], ["Tradição", 4], ["Discernimento", 4]],
    gear: "Espada longa, maça estrela ou outra arma pesada de ferro; cota de malha, grande elmo, escudo grande",
    traits: [
      { name: "Sangue que cura", text: "Para cada ponto de dano em Força que causa, pode recuperar 1 de Força bebendo o sangue derramado, inclusive curando ferimento grave. Cada dia sem beber sangue perde D6 de Força." },
      { name: "Hipnose em massa", text: "Controla D10 PNJs fracos (aldeões, guardas, bandidos). Aventureiros são imunes. Dura D10 dias, até ele morrer ou até ele soltar." }
    ],
    attacks: [
      { name: "Golpe mortal", dice: 10, dmg: 2, type: "cort", range: "maos", fx: "Num alvo escolhido. Dano da arma (espada longa). Se ferir, joga o alvo para Perto, caído." },
      { name: "Névoa", dice: 0, range: "perto", all: true, fx: "Vira névoa. Quem falhar em Resiliência sufoca, com as regras de afogamento." },
      { name: "Golpe invisível", dice: 8, dmg: 2, type: "cort", range: "perto", all: true, dodge: false, fx: "Fica invisível e ataca todos em Perto. Dano da arma (espada longa). Não pode ser bloqueado nem esquivado. Volta a ser visível após uma rodada." },
      { name: "Olhar hipnótico", dice: 0, range: "maos", fx: "Um alvo escolhido rola Discernimento contra a Empatia do vampiro. Se perder, por uma rodada ataca outro aventureiro escolhido com +2 e +1 de dano." },
      { name: "Morcegos", dice: 5, dmg: 2, type: "cort", range: "perto", all: true, fx: "Vira um bando de morcegos (números do bando de morcegos, mas dano 2). Recupera 1 de Força por ponto de dano causado." },
      { name: "Mordida", dice: 10, dmg: 2, type: "cort", range: "maos", fx: "Num alvo escolhido. Se ferir, recupera 1 de Força por ponto de dano. O alvo rola Resiliência; se falhar, veneno paralisante Potência 6." }
    ]
  },
  {
    id: "troll-dagua", name: "Troll d'Água", kind: "monstro", src: "bob", page: 111,
    str: 22, agi: 2, wits: 2, armor: 4, armorNote: "pele escamosa", move: 1,
    skills: [["Furtividade", 6], ["Patrulha", 4]],
    traits: [
      { name: "Regeneração", text: "Recupera 1 de Força por rodada." },
      { name: "Luz do sol", text: "Sob sol direto, sofre 1 de dano por rodada." },
      { name: "Emboscada", text: "Embosca da beira d'água com Furtividade +2. Se os aventureiros passarem em Sobrevivência, notam as marcas e o bônus some; com dois sucessos, ele fica com −2." }
    ],
    attacks: [
      { name: "Garras", dice: 10, dmg: 2, type: "cort", range: "maos", fx: "Se ferir, veneno paralisante Potência 6." },
      { name: "Mordida", dice: 9, dmg: 2, type: "esmag", range: "maos", fx: "O alvo fica Agarrado nas mandíbulas." },
      { name: "Arremesso", dice: 12, dmg: 2, type: "esmag", range: "maos", fx: "Se acertar, o alvo cai em Curta." },
      { name: "Braçada", dice: 8, dmg: 2, type: "esmag", range: "maos", all: true },
      { name: "Bafo d'água", dice: 0, poison: "letal, Potência 7", range: "perto", all: true },
      { name: "Pro fundo", dice: 7, dmg: 2, type: "cort", range: "maos", fx: "Se acertar, Agarrado e puxado para debaixo d'água (afogamento). Se desmaiar, é levado ao covil e comido em D6 dias." }
    ]
  },
  {
    id: "fogo-fatuo", name: "Fogo-fátuo", kind: "monstro", src: "bob", page: 115,
    str: 8, agi: 3, wits: 8, emp: 1, armor: 0, move: 1,
    traits: [
      { name: "Imaterial", text: "Só fogo e armas mágicas o ferem. Enquanto a morada existir, recebe metade de qualquer dano." },
      { name: "Morada", text: "Preso a uma morada (árvore queimada, caldeirão, pilha de lenha). Só some de vez se ela for destruída; senão volta na noite seguinte, mesmo após Purgar Morto-vivo." },
      { name: "Atrair", text: "A vítima precisa vencer Discernimento contra a Astúcia dele. Quem perde o segue até a morte, mas rola de novo sempre que sofrer dano." },
      { name: "Defesa da morada", text: "Só usa a tabela de ataques quando tentam destruir a morada." }
    ],
    attacks: [
      { name: "Riso", dice: 7, fear: true, range: "perto", all: true },
      { name: "Clarão", dice: 0, range: "perto", all: true, fx: "Quem falhar em Movimentação (não gasta ação) fica cego por D3 rodadas." },
      { name: "Atravessar", dice: 8, dmg: 2, type: "esmag", range: "maos", block: true, fx: "Num alvo." },
      { name: "Pesadelos", dice: 9, fear: true, range: "perto", fx: "Um alvo escolhido." },
      { name: "Chamas", dice: 9, dmg: 1, range: "perto", all: true, fx: "Quem for atingido sofre 1 de dano por rodada até apagar o fogo (Movimentação, ação lenta). O livro não dá o dano do golpe; aqui está 1." },
      { name: "Possessão", dice: 0, range: "maos", fx: "Num alvo forte e de Astúcia baixa. Se falhar em Discernimento, o fogo-fátuo o controla e o usa contra o grupo até a mesma posição de iniciativa na rodada seguinte." }
    ]
  },
  {
    id: "sombra-de-lobo", name: "Sombra de Lobo", kind: "monstro", src: "bob", page: 119,
    str: 16, agi: 6, armor: 2, armorNote: "pelagem de trevas, mais a que vestir", move: 2,
    skills: [["Patrulha", 5], ["Potência", 5], ["Furtividade", 4]],
    gear: "Às vezes cota de malha ou armadura de placas; montante ou martelo de guerra pesado",
    traits: [
      { name: "Devorar para curar", text: "Precisa se afastar e comer uma criatura morta sem ser perturbado, por D6 rodadas. Consome até 3 de Força por rodada e recupera o mesmo tanto." },
      { name: "Possessão", text: "Vítima rola Resiliência com −1 por ser vivo que feriu na luta. Depois, rola Resiliência a cada combate ou vira fera por um Quarto de Dia, sem lembrar de nada. Em D10 anos vira Warg da Noite. Só se quebra em duelo em noite de lua cheia, causando ferimento grave com arma consagrada ao Vagante Noturno." }
    ],
    attacks: [
      { name: "Uivo", dice: 8, fear: true, range: "perto", all: true, fx: "Quem for atingido fica Hipotérmico." },
      { name: "Golpe furioso", dice: 9, dmg: 3, type: "cort", range: "maos", fx: "Num alvo escolhido. Dano da arma (montante). Se acertar, joga o alvo para Perto, caído." },
      { name: "Garras", dice: 8, dmg: 1, type: "cort", range: "maos", fx: "Se acertar, o alvo fica Hipotérmico." },
      { name: "Mordida", dice: 7, dmg: 2, type: "cort", range: "maos", fx: "Num alvo escolhido. Se acertar, rola outro ataque: 7 dados, dano 2." },
      { name: "Redemoinho", dice: 7, dmg: 2, range: "perto", all: true, fx: "Quem for atingido fica Hipotérmico." },
      { name: "Golpe com uivo", dice: 8, fear: true, range: "perto", all: true, fx: "Medo em todos os aventureiros. Se afetar o alvo escolhido (em Perto), ele fica paralisado por D3 rodadas, sem bloquear nem esquivar, e leva um golpe: 10 dados, dano da arma (montante: 3)." }
    ]
  }
  ];

  /* Tabela de encontro (D66), p. 5. */
  var ENCOUNTER = [
    [11, 11, "anfibio"], [12, 13, "ameba"], [14, 14, "basilisco"], [15, 15, "homem-do-pantano"], [16, 16, "raptor-terrivel"],
    [21, 22, "guardiao-do-portal"], [23, 23, "espectro-gigante"], [24, 24, "aranha-gigante-filhote"], [25, 25, "aranha-gigante-macho"],
    [26, 26, "aranha-gigante-femea"], [31, 31, "golem-maior"], [32, 34, "diabrete"], [35, 35, "dragao-de-ferro"], [36, 41, "mara"],
    [42, 42, "draco-do-lodacal"], [43, 43, "mumia"], [44, 44, "espirito-da-natureza"], [45, 45, "possessor"], [46, 46, "rei-dos-ratos"],
    [51, 51, "troll-das-rochas"], [52, 52, "metamorfo"], [53, 53, "escolopendra"], [54, 54, "morte-enxameante"], [55, 55, "tupilaq"],
    [56, 56, "ent-retorcido"], [61, 61, "dragao-morto-vivo"], [62, 62, "vampiro"], [63, 63, "troll-dagua"], [64, 65, "fogo-fatuo"],
    [66, 66, "sombra-de-lobo"]
  ];

  var api = { src: "bob", LIST: LIST, ENCOUNTER: ENCOUNTER };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.FLBookOfBeasts = api;
})(typeof window !== "undefined" ? window : this);
