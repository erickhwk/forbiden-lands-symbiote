/*
 * Escudo do Mestre: referência rápida e tabelas para rolar.
 *
 * Puro: não toca no DOM nem na API do TaleSpire.
 * Nomes, números e faixas de dados seguem o Manual do Jogador; os textos estão
 * resumidos com palavras próprias.
 *
 * SECTIONS: blocos de consulta. Cada bloco tem `table` ([[coluna, coluna…]],
 * a primeira linha é o cabeçalho) e/ou `notes` (frases curtas).
 *
 * TABLES: tabelas para rolar. die: "d66" | "d6"; rows: [de, até, nome, efeito, pedido?]
 * pedido = { c: perícia, m: modificador } (o Mestre pode pedir a rolagem a todos).
 */
(function (root) {
  "use strict";

  var SECTIONS = [
    {
      key: "combate", title: "Combate",
      blocks: [
        { title: "Na sua vez", notes: [
          "Uma ação lenta e uma rápida, ou duas rápidas. As ações voltam no começo de cada rodada.",
          "Esquivar e Bloquear são reações: quebram a ordem, mas gastam as ações da rodada. Sem ações, não dá para reagir.",
          "Ajudar custa uma ação do mesmo tipo e precisa ser declarado antes da rolagem.",
          "Iniciativa: cartas de 1 a 10. Surpresa compra duas e fica com uma. Trocar cartas entre jogadores só no começo do combate ou da rodada; com inimigo, só por Fintar."
        ] },
        { title: "Ações lentas", table: [
          ["Ação", "Precisa de", "Rola"],
          ["Golpear", "Arma de corte ou esmagamento", "Luta"],
          ["Estocar", "Arma pontiaguda", "Luta"],
          ["Socar, chutar, morder", "Estar desarmado", "Luta"],
          ["Agarrar", "Estar desarmado", "Luta"],
          ["Libertar-se", "Ter sido agarrado", "Luta (disputada)"],
          ["Atirar", "Arma à distância", "Pontaria"],
          ["Persuadir", "O alvo ouvir você", "Manipulação"],
          ["Provocar", "O alvo ouvir você", "Atuação"],
          ["Lançar magia", "Ser Druida ou Feiticeiro", "—"],
          ["Fugir", "Nenhum inimigo ao alcance das mãos", "Movimentação"],
          ["Arrastar-se", "Estar caído", "—"],
          ["Investir", "Distância Perto", "Talento Investida"],
          ["Curar outro", "Nenhum inimigo ao alcance das mãos", "Cura ou Atuação"]
        ] },
        { title: "Ações rápidas", table: [
          ["Ação", "Precisa de", "Rola"],
          ["Esquivar", "—", "Movimentação"],
          ["Bloquear", "Escudo ou arma de aparar", "Luta"],
          ["Desembainhar", "—", "—"],
          ["Arremeter arma", "Arma pesada, logo antes do golpe (+1 de dano)", "—"],
          ["Levantar-se", "Estar caído", "—"],
          ["Derrubar", "—", "Luta"],
          ["Desarmar", "Alvo com arma na mão", "Luta"],
          ["Fintar", "Inimigo ao alcance das mãos", "—"],
          ["Correr", "Nenhum inimigo ao alcance das mãos", "Movimentação em zona acidentada"],
          ["Recuar", "Inimigo ao alcance das mãos", "Movimentação"],
          ["Ataque atracado", "Estar agarrando", "Luta"],
          ["Preparar arma", "Arco ou funda", "—"],
          ["Mirar (+1)", "Alvo a Curta ou mais", "—"],
          ["Palavra de poder", "Ser Druida ou Feiticeiro", "—"],
          ["Usar item", "Varia", "Varia"]
        ] },
        { title: "Ataque e defesa", table: [
          ["Defesa", "contra Golpear", "contra Estocar", "contra Soco"],
          ["Bloquear com arma", "—", "−2", "+2"],
          ["Bloquear com escudo", "—", "+2", "+2"],
          ["Esquivar", "+2", "—", "—"]
        ], notes: [
          "Bloquear com arma sem a característica aparar: −2. Esquivar e continuar de pé: −2 (senão, cai).",
          "Cada sucesso da defesa anula um sucesso do ataque.",
          "Dano: Dano da Arma + 1 por sucesso além do primeiro. Desarmado causa 1.",
          "Alvo caído: +2 nos ataques corpo a corpo contra ele.",
          "Derrubar alguém mais forte exige dois sucessos. Desarmar arma de duas mãos também.",
          "Recuar e falhar: o inimigo ganha um ataque livre que não dá para defender.",
          "Agarrado: os dois caem, o alvo solta a arma e só pode tentar se libertar."
        ] },
        { title: "Emboscada e ataque furtivo", table: [
          ["Distância", "Modificador da Furtividade"],
          ["Ao alcance das mãos", "−2"], ["Perto", "−1"], ["Curta", "0"], ["Longa", "+1"]
        ], notes: [
          "Furtividade disputada contra a Patrulha do alvo. Sucesso: uma ação livre (lenta ou rápida) antes da iniciativa, que não pode ser esquivada nem bloqueada.",
          "Emboscada (esperando o alvo passar): +2. Em grupo, rola quem tem menos Furtividade contra quem tem mais Patrulha."
        ] },
        { title: "Combate à distância", table: [
          ["Distância do alvo", "Modificador"],
          ["Ao alcance das mãos", "−3 (ou +3 contra alvo indefeso ou desatento)"],
          ["Perto", "0"], ["Curta", "−1"], ["Longa", "−2"], ["Distante", "−3, e é preciso Mirar"]
        ], notes: [
          "Arco e funda precisam de Preparar arma; besta precisa ser carregada (ação lenta) antes de cada tiro.",
          "Mirar dá +1 e vale só nesta rodada. Não dá para Mirar em quem está ao alcance das mãos e sabe de você.",
          "Para bloquear um tiro: escudo, ou arma de aparar com categoria 2 no talento da arma.",
          "Ferimento grave: flecha e faca de arremesso são perfuração; funda e pedra, trauma concussivo."
        ] },
        { title: "Montado", notes: [
          "Só armas de uma mão. Ataques contra alguém montado têm −1; o atacante escolhe o cavaleiro ou a montaria.",
          "Rolagens de Movimentação viram Adestramento com a Agilidade do animal; forçar não dá Força de Vontade.",
          "Atirar montado exige o talento Mestre da Montaria. A montaria corre o Valor de Movimento dela só em zonas abertas."
        ] }
      ]
    },
    {
      key: "distancia", title: "Zonas e distância",
      blocks: [
        { title: "Distâncias", table: [
          ["Distância", "O que é", "Terreno típico"],
          ["Ao alcance das mãos", "Colado em você", "—"],
          ["Perto", "Alguns passos, na mesma zona", "Sala pequena, túnel"],
          ["Curta", "Até 25 m, zona vizinha", "Floresta densa, pântano, salão"],
          ["Longa", "Até 100 m, quatro zonas", "Floresta, colina, ruínas"],
          ["Distante", "Até onde a vista alcança", "Planície, montanha"]
        ] },
        { title: "Zonas e fronteiras", notes: [
          "Apertada: armas pesadas com −2 e sem Arremeter arma.",
          "Acidentada: Correr para dentro pede Movimentação; quem falha chega, mas cai.",
          "Aberta: boa para montarias, que só usam o Valor de Movimento inteiro em zonas abertas.",
          "Escura ou nebulosa: tiros dentro dela com −2, e não dá para atirar através dela.",
          "Fronteira bloqueada: não se passa andando. Obscurecida: não se atira através, mas se passa.",
          "Correr leva de uma zona à vizinha, ou entre Perto e ao alcance das mãos. Com inimigo ao alcance das mãos, é preciso Recuar.",
          "Uma porta de madeira comum aguenta 5 de dano."
        ] },
        { title: "Fugir do conflito", table: [
          ["Situação", "Modificador da Movimentação"],
          ["Inimigo mais próximo Perto", "−1"], ["Curta", "0"], ["Longa", "+1"],
          ["Zona aberta", "−1"], ["Zona acidentada", "+1"]
        ], notes: [
          "Só sem inimigo ao alcance das mãos, sem estar preso ou cercado, e voltando por onde veio. Se falhar, continua no combate e pode tentar na próxima rodada."
        ] }
      ]
    },
    {
      key: "dano", title: "Dano e perigos",
      blocks: [
        { title: "Dificuldade e ajuda", table: [
          ["Dificuldade", "Modificador"],
          ["Trivial", "+3"], ["Simples", "+2"], ["Fácil", "+1"], ["Regular", "0"],
          ["Dispendioso", "−1"], ["Difícil", "−2"], ["Formidável", "−3"]
        ], notes: [
          "Cada ajudante dá +1, até +3. O ajudante precisa estar presente e poder ajudar de verdade.",
          "Rolagem em grupo: rola quem é mais apto, os outros ajudam. Se falhar, ninguém tenta de novo.",
          "Rolagem disputada: vence quem tiver sucesso e mais sucessos; cada sucesso do oponente anula um seu. Só o atacante força."
        ] },
        { title: "Armadura e cobertura", table: [
          ["Cobertura", "Valor de Armadura"],
          ["Móveis", "3"], ["Porta de madeira", "4"], ["Tronco de árvore", "5"], ["Parede de madeira", "6"], ["Parede de pedra", "8"]
        ], notes: [
          "Armadura: um dado por ponto de Valor; cada 6 tira 1 de dano. Não se força. Se algum dano passar, cada 1 tira 1 do Valor.",
          "Cobertura só vale contra tiros, não se desgasta e é rolada antes da armadura. Abrigar-se é uma ação rápida."
        ] },
        { title: "Acabado e recuperação", notes: [
          "Cura (Força, Agilidade) ou Atuação (Astúcia, Empatia), ação lenta sem inimigo ao alcance das mãos: cada sucesso devolve 1 ponto. Cada pessoa tenta uma vez.",
          "Sem ajuda, volta com 1 ponto depois de D6 horas. O resto volta Descansando ou Dormindo um Quarto de Dia, se nenhuma condição impedir.",
          "Ferimento letal: alguém precisa ter sucesso em Cura antes do prazo. Curar a si mesmo, depois de se levantar, tem −2.",
          "Golpe de misericórdia em ser inteligente: falhar numa rolagem de Empatia pura, gastar 1 PFV e sofrer 1 de dano em Empatia (Sangue Frio dispensa)."
        ] },
        { title: "Medo, queda e afogamento", notes: [
          "Ataque de medo: Dados Base; cada 6 causa 1 de dano em Astúcia. Alcance Perto, salvo indicação.",
          "Queda de 3 m ou mais em chão duro: o Mestre rola um Dado Base por metro menos 2; cada 6 causa 1 de dano em Força. Armadura de metal não protege.",
          "Na água: Resiliência a cada turno (15 min) para boiar, a cada rodada com armadura de metal.",
          "Afundando: Resiliência a cada rodada para segurar o ar; falhar causa 1 de dano em Força por rodada. Acabado assim, morre em D6 minutos."
        ] },
        { title: "Escuridão", notes: [
          "Correr na escuridão total pede Movimentação; quem falha costuma sofrer 1 de dano.",
          "Atacar alguém ao alcance das mãos exige antes um sucesso em Patrulha, sem gastar ação.",
          "Não dá para atirar a Curta ou mais. Ao alcance das mãos ou Perto, só com sucesso em Patrulha, e todo tiro no escuro tem −2."
        ] },
        { title: "Luz", table: [
          ["Fonte", "Ilumina", "Dura"],
          ["Tocha", "Perto", "Rola o Dado de Recurso de Tochas a cada turno (15 min)"],
          ["Lanterna", "Perto", "Um Quarto de Dia, com óleo"],
          ["Lamparina a óleo", "Perto, só em ambiente fechado", "Um Quarto de Dia, com óleo"],
          ["Vela de sebo", "Ao alcance das mãos", "Um Quarto de Dia"]
        ], notes: [
          "Regra da mesa: o óleo de lâmpada é Dado de Recurso. Role a cada Quarto de Dia com a lanterna ou a lamparina acesa; com 1 ou 2, desce um passo."
        ] },
        { title: "Veneno", table: [
          ["Veneno", "Efeito total (1 por rodada até Acabado)", "Efeito limitado"],
          ["Letal", "Força (ferimento atípico)", "1 em Força"],
          ["Paralisante", "Agilidade", "1 em Agilidade"],
          ["Sonífero", "Astúcia (inconsciente por D6 horas)", "1 em Astúcia"],
          ["Alucinógeno", "Empatia", "1 em Empatia"]
        ], notes: [
          "Potência 3 é fraco, 6 é forte, 9 ou mais é terrível. O Mestre rola Dados Base iguais à Potência contra a Resiliência da vítima; se o veneno vencer, efeito total. Antídoto a tempo interrompe.",
          "Em arma de corte ou pontiaguda: aplicar é ação lenta; fica um Quarto de Dia ou até acertar alguém."
        ] },
        { title: "Doença", notes: [
          "Rolagem de adoecimento: Resiliência disputada contra a Virulência (3 é o comum).",
          "Doente: no dia seguinte, 1 de dano em Força e Agilidade; não recupera esses atributos; nova rolagem por dia, e cada falha causa mais 1 em cada.",
          "Acabado em Força estando doente: morre no dia seguinte. Um sucesso na rolagem cura. Quem cuida pode rolar Cura no lugar do doente."
        ] },
        { title: "Condições", table: [
          ["Condição", "Quando", "Efeito"],
          ["Faminto", "Um dia sem comer", "Não recupera Força; 1 de dano em Força por semana"],
          ["Desidratado", "Um dia sem beber", "Não recupera nada; 1 de dano em Força e Agilidade por dia"],
          ["Insone", "Um dia sem dormir um Quarto", "Não recupera Astúcia; 1 de dano em Astúcia por dia"],
          ["Hipotérmico", "Falhar em Resiliência no frio", "1 em Força e Astúcia na hora; Acabado assim, morre na próxima rolagem"]
        ], notes: [
          "Frio: um dia frio de outono pede uma Resiliência por dia; no fundo do inverno, uma por hora. Cobertores dão Dados de Equipamento."
        ] }
      ]
    },
    {
      key: "social", title: "Conflito social",
      blocks: [
        { title: "Manipular", notes: [
          "Manipulação disputada contra o Discernimento do alvo, ação lenta. O pedido precisa ser razoável; ninguém age contra os próprios interesses.",
          "Se funcionar, o alvo faz o que foi pedido (pode cobrar algo em troca) ou parte para a violência.",
          "Monstros, em geral, não negociam. Grupos: fale com o líder."
        ] },
        { title: "Posição de negociação", table: [
          ["+1 para cada", "−1 para cada"],
          ["Mais gente do seu lado", "Mais gente do lado dele"],
          ["O pedido não custa nada a ele", "Pedido valioso ou perigoso"],
          ["Ele está ferido em algum atributo", "Ele não ganha nada ajudando"],
          ["Você já o ajudou antes", "Vocês mal se entendem"],
          ["Argumento muito bom (o Mestre decide)", "Distância Curta ou maior"]
        ], notes: [
          "Reputação: maior que a dele dá +1; o dobro dá +2. Vale o mesmo a favor dele."
        ] }
      ]
    },
    {
      key: "jornada", title: "Jornada",
      blocks: [
        { title: "Terreno", table: [
          ["Terreno", "Movimento", "Coletar", "Caçar"],
          ["Planícies", "Aberto", "−1", "+1"], ["Floresta", "Aberto", "+1", "+1"],
          ["Floresta Sombria", "Dificultoso", "−1", "0"], ["Colinas", "Aberto", "0", "0"],
          ["Montanhas", "Dificultoso", "−2", "−1"], ["Montanhas Altas", "Intransponível", "—", "—"],
          ["Lago/Rio", "Barco ou balsa", "—", "0"], ["Pântano", "Balsa", "+1", "−1"],
          ["Charco", "Dificultoso", "−1", "0"], ["Ruínas", "Dificultoso", "−2", "−1"]
        ], notes: [
          "A pé: 2 hexágonos por Quarto em terreno aberto, 1 em dificultoso. Montado: 3 no aberto; no dificultoso não ajuda.",
          "Coletar por estação: primavera −1, verão 0, outono +1, inverno −2."
        ] },
        { title: "Luz por estação", table: [
          ["Quarto", "Primavera", "Verão", "Outono", "Inverno"],
          ["Manhã", "Claro", "Claro", "Claro", "Escuro"],
          ["Dia", "Claro", "Claro", "Claro", "Claro"],
          ["Anoitecer", "Escuro", "Claro", "Escuro", "Escuro"],
          ["Noite", "Escuro", "Escuro", "Escuro", "Escuro"]
        ], notes: [
          "No escuro, Desbravar tem −2, e quem caminha sem ver no escuro rola Patrulha ou cai e sofre 1 em Força."
        ] },
        { title: "Atividades", notes: [
          "Desbravar: uma pessoa, junto com Caminhar; Sobrevivência a cada hexágono novo; falha traz infortúnio. Hexágono já visitado não pede rolagem.",
          "Vigiar: uma pessoa, sem ajuda; Patrulha quando surge uma ameaça. O Mestre costuma rolar encontro a cada Quarto caminhado e uma vez por dia parado.",
          "Coletar: Sobrevivência; sucesso dá Vegetais (um por 6) ou água para encher os cantis até D12. Vegetais estragam no mesmo dia.",
          "Caçar: precisa de arma à distância ou armadilha. Sobrevivência acha a presa; Pontaria ou Sobrevivência abate, com a dificuldade do animal.",
          "Pescar: rio, lago ou mar, com equipamento de pesca; Sobrevivência, um Peixe por 6.",
          "Acampar: uma pessoa rola Sobrevivência, os outros ajudam. Falha: o Mestre rola um infortúnio em segredo e o solta quando quiser.",
          "Dormir sem acampar: cada um rola Sobrevivência; quem falha não dorme. Todos rolam frio.",
          "Explorar não combina com Descansar ou Dormir no mesmo Quarto."
        ] },
        { title: "Marcha forçada", notes: [
          "Dois Quartos caminhando por dia sem problema.",
          "Terceiro Quarto: todos rolam Resiliência; quem falha sofre 1 em Agilidade e precisa Descansar ou Dormir.",
          "Quarto Quarto: Resiliência com −2, e todos ficam Insones.",
          "Montado: Adestramento com a Força do animal; falhar deixa o animal manco."
        ] }
      ]
    }
  ];

  /* Pedidos de rolagem que os infortúnios costumam exigir. */
  var ASK = {
    potencia: { c: "potencia", m: 0 }, movimentacao: { c: "movimento", m: 0 }, resiliencia: { c: "resistencia", m: 0 },
    sobrevivencia: { c: "sobrevivencia", m: 0 }, artesanato: { c: "oficios", m: 0 }
  };

  var TABLES = [
    { key: "desbravar", title: "Infortúnios de Desbravar", die: "d66", rows: [
      [11, 12, "Areia movediça", "Todos atolam: Potência para sair; cada falha causa 1 em Agilidade e pede outra tentativa. Quem sai pode ajudar. Nenhum progresso neste Quarto.", ASK.potencia],
      [13, 21, "Caminho bloqueado", "Rochas, troncos, mato ou inundação. Potência ou Movimentação para passar; cada falha causa 1 em Força. Quem passa pode ajudar. Nenhum progresso neste Quarto.", ASK.potencia],
      [22, 26, "Perdidos", "Andaram em círculos: nenhum progresso. O desbravador precisa de sucesso em Sobrevivência para sair do hexágono (uma tentativa por Quarto).", ASK.sobrevivencia],
      [31, 32, "Tornozelo torcido", "O desbravador sofre o ferimento grave 25–26 de trauma concussivo."],
      [33, 34, "Roupas rasgadas", "Botas ou manto rasgados: role contra o frio. Artesanato conserta.", ASK.resiliencia],
      [35, 36, "Deslizamento", "O chão cede: Movimentação; quem falha sofre ataque de 4 Dados Base, Dano 1 (trauma concussivo).", ASK.movimentacao],
      [41, 45, "Temporal", "Chuva ou nevasca forte: todos rolam frio e precisam se abrigar. Nenhum progresso neste Quarto.", ASK.resiliencia],
      [46, 52, "Neblina", "Um hexágono a menos neste Quarto (no dificultoso, ficam no lugar), e 1 de dano em Empatia em cada um."],
      [53, 54, "Ninho de vespas", "Cada um rola Movimentação ou sofre ataque de 4 Dados Base em Agilidade.", ASK.movimentacao],
      [55, 61, "Enxame de mosquitos", "Ataque de 4 Dados Base em Empatia."],
      [62, 64, "Animal selvagem", "Um lobo, urso ou outro animal se sente ameaçado e ataca."],
      [65, 66, "Animal persistente", "Um bicho pequeno segue o grupo e arruma confusão: barulho na hora errada, come a comida, rouba algo."]
    ] },
    { key: "coleta", title: "Infortúnios de Coleta", die: "d6", rows: [
      [1, 1, "Venenoso", "Uma unidade de Vegetais é venenosa (Potência 3); só se descobre na refeição."],
      [2, 2, "Sanguessugas", "1 de dano em Força. Cura remove; se falhar, mais 1 de dano, mas sai assim mesmo."],
      [3, 3, "Tornozelo torcido", "Ferimento grave 25–26 de trauma concussivo."],
      [4, 4, "Roupas rasgadas", "Role contra o frio. Artesanato conserta.", ASK.resiliencia],
      [5, 5, "Animal selvagem", "Um lobo, urso ou outro animal se sente ameaçado e ataca."],
      [6, 6, "Animal persistente", "Um bicho pequeno segue o grupo e arruma confusão."]
    ] },
    { key: "caca", title: "Caça: que animal?", die: "d6", rows: [
      [1, 1, "Rato", "Dificuldade +1 · arma ou armadilha · Carne 1"],
      [2, 2, "Corvo", "Dificuldade 0 · arma · Carne 1"],
      [3, 3, "Coelho", "Dificuldade +1 · arma ou armadilha · Carne 2, Pele 1"],
      [4, 4, "Raposa", "Dificuldade −1 · arma ou armadilha · Carne 3, Pele 1"],
      [5, 5, "Javali", "Dificuldade −1 · arma · Carne 4, Pele 2 · ataca se o caçador falhar"],
      [6, 6, "Cervo", "Dificuldade 0 · arma · Carne 5, Pele 3"]
    ] },
    { key: "caca-inf", title: "Infortúnios de Caça", die: "d6", rows: [
      [1, 1, "Tornozelo torcido", "Ferimento grave 25–26 de trauma concussivo."],
      [2, 2, "Equipamento perdido", "Some um equipamento ou arma; o Mestre escolhe."],
      [3, 3, "Roupas rasgadas", "Role contra o frio. Artesanato conserta.", ASK.resiliencia],
      [4, 4, "Armadilha", "Pisa na armadilha de outro caçador: 1 de dano em Força e Movimentação para sair.", ASK.movimentacao],
      [5, 5, "Animal selvagem", "Um lobo, urso ou outro animal se sente ameaçado e ataca."],
      [6, 6, "Presa doente", "Abate um animal doente: quem comer a carne pega doença de Virulência 3."]
    ] },
    { key: "pesca", title: "Infortúnios de Pesca", die: "d6", rows: [
      [1, 1, "Anzol ou rede presa", "Potência para recuperar; se falhar, perde o equipamento.", ASK.potencia],
      [2, 2, "Anzol no dedo", "1 de dano em Força. Com rede, role de novo."],
      [3, 3, "Equipamento quebrado", "Artesanato conserta, ou é preciso outro.", ASK.artesanato],
      [4, 4, "Enxame de mosquitos", "Ataque de 4 Dados Base em Empatia."],
      [5, 5, "Caldo!", "Cai na água: regras de afogamento.", ASK.resiliencia],
      [6, 6, "Atacado", "Um peixe ou enguia morde: 1 de dano em Força."]
    ] },
    { key: "acampamento", title: "Infortúnios de Acampamento", die: "d66", secret: true, rows: [
      [11, 13, "Água estragada", "Todos descem um passo no Dado de Recurso de água."],
      [14, 16, "Comida podre", "Todos descem um passo no Dado de Recurso de comida."],
      [21, 25, "Local ruim", "Ninguém dorme até achar outro lugar para acampar."],
      [26, 32, "Temporal", "O acampamento alaga: todos rolam frio e ninguém dorme esta noite.", ASK.resiliencia],
      [33, 36, "O fogo apaga", "Lenha úmida: todos rolam frio.", ASK.resiliencia],
      [41, 42, "Incêndio!", "Cada um sofre ataque de 5 Dados Base, Dano 1, e rola Movimentação para salvar o equipamento; quem falha perde um item.", ASK.movimentacao],
      [43, 45, "Formigas", "Todos sofrem 1 em Agilidade e ninguém dorme."],
      [46, 51, "Piolhos", "Alguém ao acaso: 1 em Agilidade por dia e não dorme. Cura resolve."],
      [52, 54, "Enxame de mosquitos", "Ataque de 4 Dados Base em Empatia."],
      [55, 56, "Animal selvagem", "Um lobo, urso ou outro animal se sente ameaçado e ataca."],
      [61, 63, "Equipamento perdido", "Alguém ao acaso perde um item; o Mestre decide se dá para achar."],
      [64, 66, "Equipamento quebrado", "Um item de alguém ao acaso quebra; Artesanato conserta."]
    ] },
    { key: "maritima", title: "Infortúnios da Viagem Marítima", die: "d6", rows: [
      [1, 1, "Erro de navegação", "Fora do curso: nenhum progresso neste Quarto."],
      [2, 2, "Vendaval", "O barco inclina e um item importante cai na água."],
      [3, 3, "Redemoinho", "O capitão rola Sobrevivência; se falhar, o barco encalha e precisa de Artesanato.", ASK.sobrevivencia],
      [4, 4, "Vazamento", "Artesanato conserta em um turno, com o barco andando; sem conserto, afunda em D6 horas.", ASK.artesanato],
      [5, 5, "Ao mar!", "Alguém (o Mestre escolhe) cai na água: regras de afogamento.", ASK.resiliencia],
      [6, 6, "Encalhe", "Abandonar o barco ou consertar com Artesanato, na margem.", ASK.artesanato]
    ] }
  ];

  function d66Codes() {
    var out = [];
    for (var t = 1; t <= 6; t++) for (var u = 1; u <= 6; u++) out.push(t * 10 + u);
    return out;
  }

  function table(key) { return TABLES.filter(function (t) { return t.key === key; })[0] || null; }

  function lookup(tbl, code) {
    var row = tbl.rows.filter(function (r) { return code >= r[0] && code <= r[1]; })[0];
    return row ? { code: code, name: row[2], effect: row[3], ask: row[4] || null } : null;
  }

  /* Texto sem acentos e em minúsculas, para a busca. */
  function fold(s) {
    return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  }

  /* Blocos que batem com a busca (em título, células ou notas). */
  function search(query) {
    var q = fold(query).trim();
    var out = [];
    SECTIONS.forEach(function (sec) {
      sec.blocks.forEach(function (b) {
        var hay = fold([b.title].concat(b.notes || [], (b.table || []).map(function (r) { return r.join(" "); })).join(" "));
        if (!q || hay.indexOf(q) !== -1) out.push({ section: sec, block: b });
      });
    });
    return out;
  }

  var api = { SECTIONS: SECTIONS, TABLES: TABLES, table: table, lookup: lookup, d66Codes: d66Codes, search: search, fold: fold };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.FLShield = api;
})(typeof window !== "undefined" ? window : this);
