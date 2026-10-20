/*
 * Magia do Forbidden Lands.
 *
 * Puro: não toca no DOM nem na API do TaleSpire.
 *   - Cada disciplina é ligada a um talento (Caminho da Cura, do Sangue…).
 *     Com categoria N no talento, você lança as magias de categoria até N.
 *   - Magias gerais: só para conjuradores completos (Druida e Feiticeiro).
 *     A categoria delas é a do caminho mágico mais alto que o personagem tem.
 *   - Lançamento arriscado: uma categoria acima é possível, com infortúnio
 *     mágico garantido. Duas acima, não dá.
 *   - Lançamento seguro: abaixo da sua categoria, pode rolar um dado a menos
 *     por ponto de diferença. Com zero dados, a magia só funciona.
 *   - Lendo de um grimório, a magia conta como um passo abaixo.
 *   - Nível de Poder = PFV gastos; cada 6 nos Dados Base soma 1 (sobrecarga);
 *     ingrediente soma 1. Qualquer 1 é infortúnio mágico (D66). Não se força.
 *   - Poder Mental (meio-elfo): o primeiro PFV conta como dois.
 *
 * Nomes, categorias, alcance, duração e ingredientes seguem o Manual do
 * Jogador; os efeitos estão resumidos com palavras próprias.
 */
(function (root) {
  "use strict";

  var PATHS = [
    { key: "geral", name: "Magia Geral", talent: null },
    { key: "cura", name: "Cura", talent: "caminho-da-cura" },
    { key: "metamorfose", name: "Metamorfose", talent: "caminho-do-metamorfo" },
    { key: "consciencia", name: "Consciência", talent: "caminho-da-visao" },
    { key: "simbolismo", name: "Simbolismo", talent: "caminho-dos-simbolos" },
    { key: "pedra", name: "Canção da Pedra", talent: "caminho-das-rochas" },
    { key: "sangue", name: "Magia de Sangue", talent: "caminho-do-sangue" },
    { key: "morte", name: "Magia da Morte", talent: "caminho-da-morte" }
  ];

  var FULL_CASTERS = ["druida", "feiticeiro"];

  var KIND_LABEL = { lenta: "Ação lenta", palavra: "Palavra de poder", ritual: "Ritual", livre: "Não gasta ação" };

  /* [id, nome, disciplina, categoria, tipo, alcance, duração, ingrediente, efeito] */
  var RAW = [
    ["selo-magico", "Selo Mágico", "geral", 1, "lenta", "Ao Alcance das Mãos", "Um Quarto de Dia", "Pedaço de giz",
      "Protege uma pessoa ou um lugar do tamanho de um humano. Magias lançadas contra o alvo nesse período perdem Nível de Poder igual ao do selo."],
    ["sentir-magia", "Sentir Magia", "geral", 1, "lenta", "Curto", "Imediata", "Vara de adivinhação",
      "Conjuradores já percebem magia por perto; esta magia revela que tipo de magia é. Também é o único jeito de achar magia obscurecida, se o seu Nível de Poder for pelo menos o dela."],
    ["dissipar-magia", "Dissipar Magia", "geral", 2, "palavra", "Curto", "Imediata", "Pó de ferro",
      "Reação, fora da ordem de iniciativa: tira da magia do oponente o Nível de Poder desta. Se ela chegar a zero, não faz nada. Os dois rolam sobrecarga e infortúnio; decida os PFV antes."],
    ["obscurecer-magia", "Obscurecer Magia", "geral", 2, "livre", "Pessoal", "Imediata", "Pedaço de tecido",
      "Junto com outra magia, custa 1 PFV a mais (que não soma ao Nível de Poder) e não é uma ação. A magia passa despercebida; só Sentir Magia com poder igual ou maior a encontra."],
    ["vincular-magia", "Vincular Magia", "geral", 3, "ritual", "Pessoal", "Variada", "Pena de escrita ou pequeno cinzel",
      "Guarda uma magia (não ritual) num objeto, disparada como você definir. PFV extra, que entram nos dados mas não no poder: +1 dura um dia ou até disparar; +2 para sempre até disparar; +5 fica para sempre e dispara uma vez por dia pagando PFV igual ao poder."],
    ["transferencia", "Transferência", "geral", 3, "lenta", "Ao Alcance das Mãos", "Imediata", "Uma gota do seu sangue",
      "Custa 1 PFV e permite dar ou tomar quantos PFV quiser de alguém. Se o alvo resiste, o limite é o Nível de Poder. Os PFV gastos para lançar não são transferidos."],

    ["cura-da-natureza", "Cura da Natureza", "cura", 1, "lenta", "Ao Alcance das Mãos", "Imediata", "Ervas medicinais",
      "Cura uma doença ou um veneno em você ou em outra pessoa, se o Nível de Poder for pelo menos a Virulência ou a Potência dividida por 3 (para baixo)."],
    ["maos-que-curam", "Mãos que Curam", "cura", 1, "lenta", "Ao Alcance das Mãos", "Imediata", "Argila",
      "Cura pontos de Força ou Agilidade de outra pessoa igual ao Nível de Poder. Não serve em você nem em ferimentos graves."],
    ["purificar-espirito", "Purificar Espírito", "cura", 1, "lenta", "Ao Alcance das Mãos", "Imediata", "Vela acesa",
      "Cura pontos de Astúcia ou Empatia de outra pessoa igual ao Nível de Poder. Não serve em você."],
    ["banir-demonios", "Banir Demônios", "cura", 2, "lenta", "Perto", "Imediata", "Símbolo sagrado",
      "Causa dano em Força igual ao Nível de Poder num demônio verdadeiro, mesmo nos que ignoram armas. Não afeta criaturas só com traços demoníacos."],
    ["fechar-ferimentos", "Fechar Ferimentos", "cura", 2, "lenta", "Ao Alcance das Mãos", "Imediata", "Musgo branco",
      "Cura um ferimento grave na hora. Letal pede Nível de Poder 2. Membros perdidos não voltam."],
    ["purgar-morto-vivo", "Purgar Morto-vivo", "cura", 2, "lenta", "Perto", "Imediata", "Símbolo sagrado",
      "Causa dano em Força igual ao Nível de Poder num morto-vivo."],
    ["mestre-do-clima", "Mestre do Clima", "cura", 3, "lenta", "Distante", "Um Quarto de Dia", "Pena",
      "Muda o clima do hexágono. Poder 1: mudança leve. Poder 2: clima forte mas possível na estação. Poder 3: clima fora da estação."],
    ["ressurreicao", "Ressurreição", "cura", 3, "lenta", "Ao Alcance das Mãos", "Imediata", "Item do alvo",
      "Traz um morto de volta à vida de verdade. Poder 1 no mesmo Quarto de Dia, 2 no mesmo dia, 3 em até uma semana; depois disso, não dá. O ressuscitado perde 1 de Empatia para sempre."],
    ["serenidade", "Serenidade", "cura", 3, "lenta", "Perto", "Imediata", "Amuleto",
      "Num conflito social, o alvo faz o que você pede sem rolagem de Manipulação e sem nada em troca, mas não age contra os próprios interesses. Só humanoides vivos."],

    ["lingua-dos-animais", "Língua dos Animais", "metamorfose", 1, "lenta", "Perto", "Um turno (15 minutos)", "Garra ou presa",
      "Fala com mamíferos: uma pergunta por Nível de Poder sobre o que viram, ouviram ou farejaram. Eles não mentem, mas entendem o mundo do jeito deles."],
    ["olhos-de-falcao", "Olhos de Falcão", "metamorfose", 1, "lenta", "Distante", "Um turno (15 minutos)", "Garra de pássaro",
      "Enxerga como um falcão: vê detalhes até a distância Distante, a ponto de reconhecer pessoas."],
    ["patas-de-gato", "Patas de Gato", "metamorfose", 1, "lenta", "Pessoal", "Imediata", "Garra de gato",
      "No lugar de rolar Furtividade, você tem sucesso automático; cada Nível de Poder vale um sucesso."],
    ["garra-de-urso", "Garra de Urso", "metamorfose", 2, "lenta", "Ao Alcance das Mãos", "Imediata", "Garra de urso",
      "Golpe que acerta sempre, com dano igual ao Nível de Poder. Não dá para bloquear nem esquivar; a armadura conta."],
    ["mestre-das-feras", "Mestre das Feras", "metamorfose", 2, "lenta", "Perto", "Um turno (15 minutos)", "Garra ou presa",
      "Controla um animal (não monstro) com Força até o dobro do Nível de Poder. Precisa de um passo a mais se ele estiver agitado ou em combate, e outro para ações fora da natureza dele."],
    ["velocidade-do-cervo", "Velocidade do Cervo", "metamorfose", 2, "livre", "Pessoal", "Imediata", "Chifre de cervo",
      "Não é uma ação: você Corre com Valor de Movimento igual ao Nível de Poder mais um. Role sobrecarga e infortúnio antes de se mover."],
    ["alma-primitiva", "Alma Primitiva", "metamorfose", 3, "lenta", "Longo", "Um turno (15 minutos)", "Garra ou presa",
      "Desperta uma emoção animal no alvo, se o Nível de Poder for pelo menos a Astúcia dele. Para multidões: pequena 2, grande 3, uma aldeia inteira 4."],
    ["forma-animal", "Forma Animal", "metamorfose", 3, "lenta", "Pessoal", "Imediata", "Garra ou presa",
      "Vira um animal com Força até o dobro do Nível de Poder: ganha Força, Agilidade e ataques dele, mas não fala e fica com Astúcia e Empatia 1. Voltar exige lançar de novo."],

    ["luminifera", "Luminífera", "consciencia", 1, "lenta", "Perto", "Um turno por Nível de Poder", "Varinha (reutilizável)",
      "Uma luz forte acaba com todas as sombras na sua Zona."],
    ["palavras-ao-vento", "Palavras ao Vento", "consciencia", 1, "lenta", "Distante", "Um turno por Nível de Poder", "Funil ou concha marinha",
      "Ouve sons de um lugar que você vê, até a distância Distante, como se estivesse lá."],
    ["visao-da-verdade", "Visão da Verdade", "consciencia", 1, "lenta", "Distante", "Uma rodada", "Lupa ou lente de aumento",
      "Vê detalhes de longe, no escuro, através de fumaça e neblina, e enxerga através de disfarces e metamorfoses. Precisa de linha de visão."],
    ["caminho-da-verdade", "Caminho da Verdade", "consciencia", 2, "lenta", "Pessoal", "Imediata", "Balança (reutilizável)",
      "Diante de uma decisão difícil, o Mestre diz qual escolha acha a mais sábia."],
    ["visao-remota", "Visão Remota", "consciencia", 2, "lenta", "Varia", "Um turno (15 minutos)", "Mapa",
      "Vê o que acontece agora num lugar que você sabe onde fica. Poder 1 até Longo, 2 no mesmo hexágono, 3 mais longe; +2 se você nunca esteve lá. As visões são vagas."],
    ["visoes-do-passado", "Visões do Passado", "consciencia", 2, "lenta", "Curto", "Um turno (15 minutos)", "Objeto daquele tempo",
      "Vê o que aconteceu onde você está. Poder 1: um dia atrás. 2: um ano. 3: séculos. As visões são vagas."],
    ["divinacao", "Divinação", "consciencia", 3, "ritual", "Perto", "Um turno (15 minutos)", "Bola de cristal ou vísceras de peixe",
      "Visões do futuro: pergunte ao Mestre sobre você ou alguém presente no ritual. A resposta é curta e muitas vezes enigmática."],
    ["intuicao", "Intuição", "consciencia", 3, "lenta", "Pessoal", "Imediata", "Item relacionado",
      "Uma pergunta de sim ou não sobre qualquer coisa. O Mestre responde sim, não ou talvez, sem mentir."],
    ["telepatia", "Telepatia", "consciencia", 3, "lenta", "Perto", "Um turno (15 minutos)", "Item da vítima",
      "Lê os pensamentos de superfície (memórias profundas pedem poder 2 ou mais) ou envia os seus, até Longo se souber onde o alvo está. Pensamentos de dor causam dano em Empatia ou Astúcia igual ao poder. Não afeta monstros."],

    ["amedrontar", "Amedrontar", "simbolismo", 1, "lenta", "Curto", "Imediata", "",
      "O símbolo causa dano em Astúcia igual ao Nível de Poder. Não afeta monstros."],
    ["incitar", "Incitar", "simbolismo", 1, "lenta", "Curto", "Imediata", "",
      "A vítima rola Discernimento com −Nível de Poder; se falhar, gasta suas ações correndo até o símbolo. Não afeta monstros."],
    ["paralisar", "Paralisar", "simbolismo", 1, "lenta", "Curto", "Imediata", "",
      "A vítima perde ações: poder 1 a rápida, 2 a lenta, 3 as duas, 4 também as ações bônus de talentos. Não afeta monstros."],
    ["cegar", "Cegar", "simbolismo", 2, "lenta", "Curto", "Um Quarto de Dia", "",
      "A vítima rola Discernimento com −Nível de Poder; se falhar, fica como em escuridão total. Animais são afetados direto; monstros, não."],
    ["ilusao", "Ilusão", "simbolismo", 2, "lenta", "Curto", "Um turno (15 minutos)", "",
      "Uma pessoa vê ou ouve algo que não existe, ou deixa de ver algo. Poder 1 objeto pequeno, 2 do tamanho de alguém, 3 de uma casa. Discernimento com −poder revela. Não afeta monstros."],
    ["truque-da-mente", "Truque da Mente", "simbolismo", 2, "palavra", "Curto", "Uma rodada", "",
      "Um PNJ deixa de fazer uma pequena ação, como se tivesse se distraído. Não funciona em combate."],
    ["portal", "Portal", "simbolismo", 3, "ritual", "Perto", "Um Quarto de Dia por Nível de Poder", "",
      "Abre uma passagem para outro mundo, cheio de demônios, ou de lá para qualquer lugar das Terras Proibidas. Detalhes com o Mestre."],
    ["runa-do-poder", "Runa do Poder", "simbolismo", 3, "ritual", "Ao Alcance das Mãos", "Imediata", "",
      "Carrega um símbolo desenhado ou gravado com PFV, para gastar depois em magias. Outros conjuradores de runas também podem usá-lo."],
    ["titereiro", "Titereiro", "simbolismo", 3, "lenta", "Perto", "Uma rodada", "",
      "A vítima rola Discernimento com −Nível de Poder; se falhar, você controla uma ação rápida e uma lenta dela na próxima vez dela. Não afeta monstros."],

    ["atordoar", "Atordoar", "pedra", 1, "lenta", "Curto", "Imediata", "Chifre",
      "Sua voz causa 1 de dano em Agilidade por Nível de Poder, dividido como quiser entre os alvos. Cada sucesso deles em Discernimento anula 1. Não afeta monstros."],
    ["po-das-profundezas", "Pó das Profundezas", "pedra", 1, "lenta", "Perto", "Uma rodada", "Um punhado de areia",
      "Uma nuvem de poeira cobre a Zona e bloqueia a visão; você foge do combate sem rolar Movimentação. Só em montanha ou caverna."],
    ["voz-da-montanha", "Voz da Montanha", "pedra", 1, "ritual", "Varia", "Um Quarto de Dia", "Flauta",
      "A montanha responde perguntas simples. Passado: 1 dia (poder 1), 1 ano (2), mais (3). Agora: Curto (1), Longo (2), o hexágono (3). Só em montanha ou caverna."],
    ["forjador-da-pedra", "Forjador da Pedra", "pedra", 2, "ritual", "Varia", "Imediata", "Lira",
      "Molda pedra em construções rudes: parede, ponte, escada. Poder 1 na sua Zona; cada ponto a mais estende por outra Zona."],
    ["ruir", "Ruir", "pedra", 2, "lenta", "Perto", "Imediata", "Harpa",
      "Desfaz muros e fortificações: um Nível de Poder por meio metro de espessura."],
    ["tempestade-de-rochas", "Tempestade de Rochas", "pedra", 2, "lenta", "Curto", "Imediata", "Seixos",
      "Arremessa pedras soltas: dano em Força igual ao Nível de Poder; a armadura conta."],
    ["cancao-do-ferro", "Canção do Ferro", "pedra", 3, "ritual", "Varia", "Imediata", "Martelo",
      "Molda metal: dobra grades, abre algemas ou cria armas de metal com bônus igual ao poder (até +3), se tiver a matéria-prima."],
    ["invocar-golem", "Invocar Golem", "pedra", 3, "lenta", "Perto", "Um Quarto de Dia", "Figura de pedra",
      "Um golem que obedece ordens simples à vista: Força 2, Agilidade 1, Armadura 3 com poder 1. Cada ponto a mais dá +1 em Força e Armadura ou mais um golem. Só em montanha ou caverna."],
    ["terremoto", "Terremoto", "pedra", 3, "lenta", "Curto", "Imediata", "Tambor",
      "O chão treme e racha: derruba muros ou causa dano em Força igual ao Nível de Poder."],

    ["andarilho-do-fogo", "Andarilho do Fogo", "sangue", 1, "lenta", "Pessoal", "Um Quarto de Dia", "Uma gota de sangue",
      "Você fica imune a calor, frio e dano de fogo."],
    ["esquentar-o-sangue", "Esquentar o Sangue", "sangue", 1, "lenta", "Curto", "Um turno (15 minutos)", "Um cálice de vinho",
      "Desperta uma emoção forte no alvo (desejo, medo, raiva), que ele precisa extravasar. Não funciona em combate nem em monstros."],
    ["imolacao", "Imolação", "sangue", 2, "lenta", "Perto", "Imediata", "Tocha ou fogo aberto",
      "O sangue do alvo pega fogo: dano em Força igual ao Nível de Poder e mais 1 por rodada até ele apagar com Movimentação (ação lenta). Armadura não protege."],
    ["vincular-demonio", "Vincular Demônio", "sangue", 2, "lenta", "Curto", "Um Quarto de Dia", "Pentagrama",
      "Submete um demônio à sua vontade. Ele resiste com Discernimento com −Nível de Poder, e costuma não gostar."],
    ["vinculo-de-sangue", "Vínculo de Sangue", "sangue", 2, "lenta", "Ao Alcance das Mãos", "Imediata", "Sangue, seu ou do alvo",
      "Passa pontos de atributo, iguais ao poder, de ou para alguém da sua ascendência, sem passar do máximo. Pode pôr de pé quem está Acabado. Quem não quer resiste com Discernimento com −poder."],
    ["canalizar-o-sangue", "Canalizar o Sangue", "sangue", 3, "lenta", "Pessoal", "Uma rodada", "Uma vítima viva",
      "Você ganha PFV igual ao dobro do Nível de Poder, que somem se não forem usados na próxima rodada. O sacrifício, se usado, morre antes."],
    ["maldicao-do-sangue", "Maldição do Sangue", "sangue", 3, "ritual", "Ilimitado", "Um Quarto de Dia por Nível de Poder", "Cabelo ou parte do corpo da vítima",
      "Amaldiçoa um humanoide vivo cujo nome e paradeiro você sabe: dano igual ao poder num atributo à sua escolha, 1 ponto por Quarto de Dia."],
    ["vincular-a-alma", "Vincular a Alma", "sangue", 3, "ritual", "Ao Alcance das Mãos", "Variada", "Faca de sacrifício",
      "Prende a alma da vítima num objeto se ela falhar em Discernimento com −poder: um Quarto de Dia, um dia com poder 2, para sempre com 3. O corpo fica inconsciente. Dissipar Magia liberta."],

    ["apodrecer", "Apodrecer", "morte", 1, "lenta", "Perto", "Imediata", "Comida podre",
      "Estraga uma unidade de comida por Nível de Poder, que vira veneno com Potência igual ao poder × 3."],
    ["arrepio-do-tumulo", "Arrepio do Túmulo", "morte", 1, "lenta", "Ao Alcance das Mãos", "Uma rodada por Nível de Poder", "Um pedaço de cristal",
      "A vítima fica Hipotérmica e sofre 1 de dano em Força e Astúcia por rodada, até o total igual ao Nível de Poder em cada. Não afeta monstros."],
    ["contaminar", "Contaminar", "morte", 1, "lenta", "Ao Alcance das Mãos", "Imediata", "Animal doente",
      "Um humanoide vivo pega uma doença com Virulência igual ao Nível de Poder × 3."],
    ["olhar-de-carnical", "Olhar de Carniçal", "morte", 1, "lenta", "Curto", "Imediata", "Capuz",
      "Dano em Empatia igual ao Nível de Poder num humanoide vivo."],
    ["erguer-os-mortos", "Erguer os Mortos", "morte", 2, "ritual", "Perto", "Um Quarto de Dia", "Pertence do morto",
      "Ergue um morto-vivo de categoria 1. Cada poder além do primeiro dá mais um morto-vivo ou +1 categoria a todos. Também controla mortos inquietos."],
    ["falar-com-os-mortos", "Falar com os Mortos", "morte", 2, "lenta", "Perto", "Um turno (15 minutos)", "Parte do corpo do morto",
      "Perto do túmulo ou do lugar da morte, e sabendo o nome, você faz perguntas simples ao morto. Ele nem sempre coopera. Não serve em mortos-vivos."],
    ["mao-da-perdicao", "Mão da Perdição", "morte", 2, "lenta", "Perto", "Imediata", "Mão decepada",
      "Aperta o coração da vítima: dano em Força igual ao Nível de Poder num humanoide vivo. +1 PFV (fora do poder) estende para Curto."],
    ["o-peso-das-eras", "O Peso das Eras", "morte", 3, "lenta", "Ao Alcance das Mãos", "Imediata", "Escalpo com cabelo branco",
      "A vítima envelhece 10 anos por Nível de Poder. Se mudar de faixa de idade, perde 1 ponto de atributo para sempre; se chegar ao dobro da idade adulta máxima, morre. Não afeta elfos nem monstros."],
    ["roubar-vida", "Roubar Vida", "morte", 3, "ritual", "Perto", "Imediata", "Um animal vivo",
      "Você ganha PFV igual ao dobro do Nível de Poder, e toda planta e todo ser vivo na sua Zona morre. Só onde há vegetação."],
    ["terror", "Terror", "morte", 3, "lenta", "Curto", "Imediata", "Crânio",
      "Dano em Astúcia e em Empatia igual ao Nível de Poder num humanoide vivo."]
  ];

  var SPELLS = RAW.map(function (r) {
    return { id: r[0], name: r[1], path: r[2], rank: r[3], kind: r[4], range: r[5], duration: r[6], ingredient: r[7], effect: r[8] };
  });

  /* Infortúnios mágicos (D66): [de, até, texto, efeito automático] */
  var MISHAPS = [
    [11, 13, "Alguém viu sua magia e espalhou a história: +1 de Reputação.", { rep: 1 }],
    [14, 15, "A magia deixa você Faminto.", { cond: "faminto" }],
    [16, 21, "A magia deixa você Desidratado.", { cond: "sedento" }],
    [22, 23, "Você não consegue dormir por D6 dias e fica Insone.", { cond: "exausto" }],
    [24, 25, "A magia drena sua energia: 1 de dano em Agilidade.", { dmg: { agilidade: 1 } }],
    [26, 31, "A magia fere seu corpo: 1 de dano em Força.", { dmg: { forca: 1 } }],
    [32, 33, "O poder sobe à cabeça e os outros parecem formigas: 1 de dano em Empatia.", { dmg: { empatia: 1 } }],
    [34, 35, "Visões demoníacas: 1 de dano em Astúcia.", { dmg: { astucia: 1 } }],
    [36, 41, "Uma doença mágica com Virulência 2D6 ameaça você e quem estiver ao alcance das mãos pelo próximo Quarto de Dia.", null],
    [42, 45, "A magia também atinge um amigo ou outra vítima sem querer; uma magia de ajuda também beneficia um inimigo.", null],
    [46, 46, "Sua aparência muda para sempre. O Mestre decide como.", null],
    [51, 51, "Você fica cego, como em escuridão total, pelo próximo dia inteiro.", null],
    [52, 55, "A magia devasta sua mente: role um ferimento grave de horror.", { injury: "horror" }],
    [56, 56, "A força da magia quebra seus ossos: role um ferimento grave de trauma concussivo.", { injury: "concussivo" }],
    [61, 61, "Um demônio de outra dimensão é atraído e aparece no próximo Quarto de Dia.", null],
    [62, 65, "A magia sai ao contrário: ataque atinge você, proteção ou cura ferem, metamorfose dá errado, invocações se voltam contra você. O Mestre decide.", null],
    [66, 66, "Uma fenda se abre e um demônio puxa você para outra dimensão. O personagem se perde; pode voltar como PNJ, mudado, em D66 dias.", null]
  ];

  function d66(tens, units) { return tens * 10 + units; }

  function mishap(code) {
    var row = MISHAPS.filter(function (m) { return code >= m[0] && code <= m[1]; })[0];
    return row ? { code: code, text: row[2], auto: row[3] } : null;
  }

  function pathByTalent(id) { return PATHS.filter(function (p) { return p.talent === id; })[0] || null; }
  function pathByKey(key) { return PATHS.filter(function (p) { return p.key === key; })[0] || null; }
  function spellById(id) { return SPELLS.filter(function (s) { return s.id === id; })[0] || null; }

  /* talentList: [{id, rank}], profession: id. Devolve { chave da disciplina: categoria }. */
  function access(talentList, profession) {
    var out = {}, top = 0;
    (talentList || []).forEach(function (t) {
      var p = pathByTalent(t.id);
      if (!p) return;
      var rank = Math.max(1, Math.min(3, t.rank | 0));
      out[p.key] = Math.max(out[p.key] || 0, rank);
      top = Math.max(top, rank);
    });
    if (top && FULL_CASTERS.indexOf(profession) !== -1) out.geral = top;
    return out;
  }

  function hasMagic(talentList, profession) { return Object.keys(access(talentList, profession)).length > 0; }

  /*
   * Situação de uma magia para quem tem categoria `talentRank` na disciplina.
   *   ok      : pode lançar; `safeMax` dados podem ser tirados (lançamento seguro)
   *   risky   : uma categoria acima; infortúnio garantido
   *   blocked : duas ou mais acima
   */
  function castStatus(spellRank, talentRank, fromGrimoire) {
    var eff = Math.max(0, spellRank - (fromGrimoire ? 1 : 0));
    if (!talentRank) return { status: "blocked", eff: eff, safeMax: 0 };
    if (eff > talentRank + 1) return { status: "blocked", eff: eff, safeMax: 0 };
    if (eff === talentRank + 1) return { status: "risky", eff: eff, safeMax: 0 };
    return { status: "ok", eff: eff, safeMax: talentRank - eff };
  }

  /* PFV que contam (Poder Mental: o primeiro PFV conta como dois). */
  function countedWp(pfv, psychic) { return pfv > 0 ? pfv + (psychic ? 1 : 0) : 0; }

  /* Dados Base a rolar. */
  function baseDice(pfv, psychic, safeDrop) { return Math.max(0, countedWp(pfv, psychic) - (safeDrop | 0)); }

  /* Resultado: values são os Dados Base; o Nível de Poder base são os PFV que contam. */
  function resolve(o) {
    var values = o.values || [];
    var base = countedWp(o.pfv, o.psychic);
    var sixes = values.filter(function (v) { return v === 6; }).length;
    var ones = values.filter(function (v) { return v === 1; }).length;
    return {
      base: base,
      overcharge: sixes,
      ingredient: o.ingredient ? 1 : 0,
      power: base + sixes + (o.ingredient ? 1 : 0),
      ones: ones,
      mishap: ones > 0 || !!o.risky
    };
  }

  var api = {
    PATHS: PATHS, SPELLS: SPELLS, MISHAPS: MISHAPS, KIND_LABEL: KIND_LABEL, FULL_CASTERS: FULL_CASTERS,
    pathByKey: pathByKey, pathByTalent: pathByTalent, spellById: spellById,
    access: access, hasMagic: hasMagic, castStatus: castStatus, countedWp: countedWp, baseDice: baseDice,
    resolve: resolve, d66: d66, mishap: mishap
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.FLMagic = api;
})(typeof window !== "undefined" ? window : this);
