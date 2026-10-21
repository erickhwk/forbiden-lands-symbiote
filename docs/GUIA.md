# Guia da Ficha Forbidden Lands

Este guia mostra, tela por tela, como usar a ficha dentro do TaleSpire. A primeira parte é para quem joga. A segunda é para o Mestre.

Nas imagens estão Ylva Corvo-de-Cinza, uma caçadora humana, e Tyrgar Pedra-Funda, um anão. Os dois foram criados só para este guia.

## Sumário

- [Antes de começar](#antes-de-começar)
- **Para quem joga**
  - [A ficha](#a-ficha)
  - [Rolando dados](#rolando-dados)
  - [Forçar e Orgulho](#forçar-e-orgulho)
  - [Ataque, armadura e dano](#ataque-armadura-e-dano)
  - [Acabado e Ferimentos Graves](#acabado-e-ferimentos-graves)
  - [Condições](#condições)
  - [Equipamento, carga e moedas](#equipamento-carga-e-moedas)
  - [Consumíveis](#consumíveis)
  - [Talentos](#talentos)
  - [Magia](#magia)
  - [Reputação, XP e Evoluir](#reputação-xp-e-evoluir)
  - [Cópia de segurança](#cópia-de-segurança)
- **Para o Mestre**
  - [A mesa](#a-mesa)
  - [Grupo](#grupo)
  - [Iniciativa](#iniciativa)
  - [Pedir rolagem](#pedir-rolagem)
  - [Jornada](#jornada)
  - [Fim de sessão](#fim-de-sessão)
- [Dúvidas comuns](#dúvidas-comuns)

---

## Antes de começar

**Instalação.** Cada pessoa da mesa instala na própria máquina. O jeito mais fácil é pelo mod.io: assine o Symbiote "Ficha Forbidden Lands" e o TaleSpire baixa sozinho. Para instalar à mão, veja o [README](../README.md#instalar).

**Em toda sessão:**

1. Ative os Symbiotes em Configurações → Modding (basta fazer uma vez).
2. Abra o painel de Symbiotes e clique em "Ficha Forbidden Lands".
3. Entre no mesmo tabuleiro que o resto do grupo.

A ficha é salva por campanha, no próprio TaleSpire. Você não precisa deixá-la na frente o tempo todo, mas o Symbiote precisa estar ativo para o Mestre ver você no painel e para receber XP e avisos de combate.

---

# Para quem joga

## A ficha

<img src="img/01-ficha.png" width="330" align="right">

No topo ficam o nome, a ascendência e a profissão. Ao escolher a ascendência, o talento dela entra sozinho na ficha. Ao escolher a profissão, entram os Dados de Recurso iniciais dela. O selo **Na mesa** indica que a ficha está ligada ao TaleSpire.

**Atributos.** O número grande é o valor atual e o pequeno é o máximo. Cada quadradinho é um ponto. Clique em um quadradinho para marcar dano ou para recuperar. Use os botões − e + de "Máximo" para acertar o valor de criação. O ícone de dado rola o atributo puro.

**Armadura.** Mostra a soma da armadura e do elmo vestidos. O botão **Fui atingido** é explicado [mais abaixo](#ataque-armadura-e-dano).

**Força de Vontade.** Os quadradinhos laranja são seus pontos. Para gastar, escolha em "Gastar em…" o talento ou a magia e clique em −1, −2 ou −3. O gasto aparece no chat da mesa.

**Condições.** Clique para ligar ou desligar. Veja [Condições](#condições).

Embaixo ficam as abas **Perícias**, **Equipamento**, **Talentos** e **Histórico**. Uma bolinha vermelha na aba avisa que há algo para olhar, por exemplo sobrecarga.

<br clear="right">

### Perícias

<img src="img/02-pericias.png" width="330" align="right">

As 16 perícias ficam agrupadas pelo atributo, que mostra quantos dados ele rola agora. Use − e + para o nível da perícia. O ícone de dado abre a rolagem.

<br clear="right">

## Rolando dados

<img src="img/03-montar-rolagem.png" width="330" align="right">

Ao clicar no dado de uma perícia, abre a tela de montar a rolagem. Cada linha pode ser ligada ou desligada:

- **Atributo**: já vem com o valor atual (com o dano descontado).
- **Perícia**: o nível, com o **modificador** do Mestre. Um modificador negativo tira dados de perícia e, abaixo de zero, vira dados negativos.
- **Equipamento**: escolha a arma ou ferramenta. O bônus dela entra como dados pretos.
- **Artefato**: d8, d10 ou d12, para talentos, armas raras ou magia.

A faixa "Vai para a bandeja" mostra os dados com as cores de cada tipo. Clique em **Colocar na bandeja**.

<br clear="right">

<img src="img/04-na-bandeja.png" width="330">

Agora pegue os dados na bandeja do TaleSpire e jogue no tabuleiro como sempre. A ficha espera o resultado. **Rolar aqui, sem dados 3D** serve para quando a bandeja estiver com problema.

<img src="img/05-resultado.png" width="330" align="right">

**O resultado** aparece na ficha e vai para o chat da mesa:

- O número grande é o total de sucessos.
- Contorno amarelo é um **sucesso** (6).
- Contorno tracejado vermelho é **dano**: um 1 em atributo ou equipamento. Esse dano só conta se você forçar.
- Os dados cinzas são os que podem voltar para a bandeja se você forçar.

Em ataques com Luta ou Pontaria, a caixa vermelha mostra o **dano do golpe**: o dano da arma mais 1 por sucesso além do primeiro.

<br clear="right">

## Forçar e Orgulho

Antes de forçar, a ficha avisa o que pode acontecer. Por exemplo: "Forçar causa pelo menos 1 de dano em Agilidade", ou "pode deixar Astúcia Acabada".

Clique em **Forçar**. A ficha coloca na bandeja **só** os dados que podem ser re-rolados. Jogue de novo.

<img src="img/06-forcada.png" width="330" align="right">

Depois de forçar, a ficha faz as contas sozinha:

- cada 1 em atributo vira 1 de dano no atributo e 1 de Força de Vontade;
- cada 1 em equipamento tira 1 do bônus do item.

A lista colorida mostra tudo o que mudou.

<br clear="right">

<img src="img/07-orgulho.png" width="330" align="right">

**Orgulho.** Quando um teste de perícia falha, aparece **Usar Orgulho**, que rola o D12 extra. O botão só aparece se você preencheu o Orgulho no Histórico e ainda não o usou na sessão. Se mesmo assim a rolagem falhar, a ficha marca o Orgulho como perdido. O Mestre libera o Orgulho de novo no fim da sessão.

Quando estiver satisfeito, clique em **Aceitar resultado**.

<br clear="right">

## Ataque, armadura e dano

<img src="img/08-fui-atingido.png" width="330" align="right">

Quando um ataque acertar seu personagem, clique em **Fui atingido**, logo abaixo da armadura:

1. Coloque o **dano do ataque**.
2. Escolha o **tipo do golpe**: Corte, Perfuração ou Esmagamento. Ele define a tabela de ferimento se a Força ficar Acabada.
3. Clique em **Rolar armadura** e jogue os dados da bandeja.

<br clear="right">

<img src="img/09-armadura.png" width="330" align="right">

A ficha resolve o resto:

- cada 6 bloqueia 1 de dano;
- o resto do dano sai da Força;
- se algum dano passou, cada 1 rolado desgasta a armadura. Você escolhe se quem sofre é a armadura ou o elmo.

A armadura só protege de dano físico de ataque. Dano por forçar, frio ou fome você marca direto nos quadradinhos.

<br clear="right">

## Acabado e Ferimentos Graves

<img src="img/10-acabado.png" width="330" align="right">

Quando um atributo chega a zero, aparece um aviso vermelho no topo da ficha, e o chat da mesa avisa também. O aviso diz o que acontece com o personagem e como ele volta.

Se a **Força** ou a **Astúcia** ficar Acabada por dano, a ficha pede para rolar um **Ferimento Grave**:

- **Força**: a tabela segue o tipo do último golpe (laceração, perfuração ou trauma). Já vem marcado o tipo que você escolheu no "Fui atingido".
- **Astúcia**: a tabela é a de horror.
- **Dano atípico (fogo, frio…)** tem uma opção própria.
- **Foi ao forçar**: não rola ferimento, como manda o livro.

<br clear="right">

<img src="img/11-ferimento.png" width="330" align="right">

A ficha rola o D66 na bandeja, aplica a regra do elmo e mostra o ferimento, que fica anotado na ficha.

<br clear="right">

<img src="img/12-ferimentos.png" width="330" align="right">

Os ferimentos ficam logo abaixo da armadura.

**Ferimento letal.** O prazo aparece em destaque. Quando alguém tiver sucesso na Cura, clique em **Salvo pela Cura**.

**Dias de cura.** Use **−1** a cada dia que passar. **Cuidados: metade** corta pela metade o tempo que falta. **Curado** remove o ferimento.

<br clear="right">

## Condições

<img src="img/13-condicoes.png" width="330" align="right">

Clique em uma condição para ativá-la. Ela fica destacada e mostra o que causa.

O link de baixo aplica o dano periódico, por exemplo "Passou um dia: aplicar 1 Astúcia". A ficha também avisa se você tentar recuperar um atributo que a condição bloqueia.

<br clear="right">

## Equipamento, carga e moedas

Na aba **Equipamento**:

<img src="img/14-carga-moedas.png" width="330">

**Carga.** É calculada sozinha: Força máxima × 2, mais o talento Empacotador. Cada item pesa o que o livro diz (pequeno, leve, normal, pesado ou nada). A barra fica vermelha na sobrecarga, e a ficha explica o que isso causa.

<img src="img/15-moedas.png" width="330">

**Moedas.** Cobre, prata e ouro, com o valor total. Cada 100 moedas pesam meio item.

<img src="img/17-itens.png" width="330" align="right">

**Itens.** Escolha do catálogo do livro. O bônus, o peso, o dano e o tipo de golpe já vêm preenchidos.

- Armaduras e elmos têm a opção "vestido".
- Item com bônus 0 aparece como quebrado.
- Item danificado pode ser reparado com um clique.

<br clear="right">

## Consumíveis

<img src="img/16-consumiveis.png" width="330" align="right">

Comida, água, flechas e tochas são **Dados de Recurso**, de D6 a D12.

Clique em **Usar** para rolar o dado na bandeja:

- com 1 ou 2, ele desce um passo;
- com 1 ou 2 no D6, o recurso acaba.

O resultado vai para o chat. Achou ou comprou uma unidade? Use o **+** para subir um passo.

<br clear="right">

## Talentos

<img src="img/18-talentos.png" width="330" align="right">

Na aba **Talentos**, escolha da lista (de ascendência, de profissão e gerais) e clique em **Adicionar**. Use − e + para a categoria (1 a 3). O × remove o talento.

O talento da ascendência entra sozinho. Rápido como um Raio e Empacotador já mudam a iniciativa e a carga.

<br clear="right">

## Magia

<img src="img/28-magia.png" width="330" align="right">

A aba **Magia** aparece para Druidas, Feiticeiros e para quem tiver algum caminho mágico. Ela se monta sozinha a partir dos caminhos e das categorias deles:

- Cada caminho abre as magias da disciplina dele até a sua categoria. Por exemplo, Caminho do Sangue 2 abre as magias de Sangue de categoria 1 e 2.
- Druidas e Feiticeiros ganham também a **Magia Geral**, na categoria do caminho mais alto. Com Sangue 2 e Morte 1, a Magia Geral vai até a categoria 2.
- Escolha o caminho em **Adicionar caminho** e ajuste a categoria com − e +. No modo Evoluir, o custo em XP aparece ali também.
- Toque no nome da magia para ver o efeito, o alcance, a duração e o ingrediente.
- **Uma categoria acima** guarda as magias que você só consegue lançar de forma arriscada.

<br clear="right">

<img src="img/29-lancar-magia.png" width="330" align="right">

**Lançar** abre a tela da magia:

- **Força de Vontade**: quantos PFV gastar. Esse é o Nível de Poder básico, e também o número de Dados Base. O meio-elfo com Poder Mental já conta um a mais.
- **Ingrediente**: soma 1 ao poder e é gasto. No Simbolismo, o ingrediente é o símbolo desenhado ou gravado.
- **Do grimório**: a magia conta como uma categoria abaixo. Em combate, ler custa uma ação rápida.
- **Lançamento seguro**: aparece quando a magia está abaixo da sua categoria. Cada ponto de diferença deixa rolar um dado a menos. Com zero dados, a magia só funciona.
- Uma magia uma categoria acima da sua mostra o aviso de **lançamento arriscado**: o infortúnio é garantido.

Coloque na bandeja e jogue os Dados Base.

<br clear="right">

<img src="img/30-poder.png" width="330" align="right">

O resultado mostra o **Nível de Poder** final:

- os PFV gastos, que já saem da ficha;
- cada 6 soma 1 de **sobrecarga**;
- o ingrediente soma 1.

Se sair algum 1, ou se o lançamento foi arriscado, vem o **infortúnio mágico**. Clique em **Rolar infortúnio (D66)** e jogue a dezena e a unidade. A ficha aplica sozinha o que for mecânico: dano no atributo, a condição ou +1 de Reputação. Quando o infortúnio pede um ferimento grave, aparece o botão para rolá-lo. O resto fica para você e o Mestre.

Tudo vai para o chat da mesa. A rolagem de magia não pode ser forçada.

<br clear="right">

## Reputação, XP e Evoluir

No topo da aba **Histórico**:

<img src="img/19-reputacao-xp.png" width="330">

- **Reputação** de 0 a 10. O ícone de dado rola para ver se alguém reconhece o personagem.
- **Experiência**: o número grande é o XP disponível e o pequeno é o total já ganho. Quem dá XP normalmente é o Mestre, pelo painel dele.

<img src="img/20-evoluir.png" width="330" align="right">

**Evoluir** abre o modo de gastar XP. Cada perícia e talento mostra o próximo nível e o custo do livro:

- perícia custa 5 × o novo nível;
- talento custa 3 × a nova categoria;
- talento novo custa 3.

Toque no custo para comprar. **Desfazer a última** volta atrás, e **Concluir** fecha e avisa no chat.

Pelo livro, gasta-se XP descansando ou dormindo, e atributos não evoluem com XP.

<br clear="right">

## Cópia de segurança

<img src="img/21-copia.png" width="330" align="right">

No fim da aba Histórico:

- **Exportar ficha** copia a ficha inteira como texto. Cole num bloco de notas ou mande para você mesmo.
- **Importar ficha** traz a cópia de volta.
- **Limpar ficha** recomeça do zero. Ela pede confirmação antes.

**Faça uma cópia antes de atualizar o Symbiote.** Também serve para levar a ficha para outra campanha ou outro computador.

<br clear="right">

---

# Para o Mestre

Quem tem permissão de Mestre no TaleSpire abre a ficha direto no **painel do Mestre**. Tudo o que aparece nele vem das fichas **abertas** dos jogadores no mesmo tabuleiro.

## A mesa

<img src="img/31-home.png" width="330" align="right">

A tela inicial do painel tem um card para cada ferramenta, com o estado ao vivo:

- **Grupo**: quantas fichas estão ao vivo e se há alertas;
- **Iniciativa**: se há combate, a rodada e de quem é a vez;
- **Jornada**: dia, Quarto, estação e terreno;
- **Pedir rolagem**: quantos jogadores já rolaram o último pedido;
- **Fim de sessão**: XP concedido.

Os alertas urgentes, como um ferimento letal, aparecem no topo. **Minha ficha** abre uma ficha comum, se você também quiser jogar com um personagem. Em qualquer ferramenta, **← Painel do Mestre** volta para cá.

<br clear="right">

## Grupo

<img src="img/22-grupo.png" width="330" align="right">

O Grupo mostra cada personagem ao vivo, com o nome do jogador ao lado. Cada cartão traz:

- **atributos**, em destaque quando estão com dano ou Acabados;
- Força de Vontade, armadura, sobrecarga e condições;
- **ferimentos**, com o prazo dos letais;
- consumíveis, XP e Reputação.

A caixa **Atenção** junta o que é urgente, como um ferimento letal com prazo correndo.

Quando um jogador fecha o Symbiote, o cartão dele aparece sem sinal. **Atualizar** pede de novo os dados de todo mundo.

<br clear="right">

## Iniciativa

<img src="img/23-iniciativa-montar.png" width="330" align="right">

**Montar o combate.** As fichas abertas na mesa já entram sozinhas. Para adicionar mais gente:

- **Da fila do TaleSpire** traz quem está na fila de iniciativa do jogo;
- **Minis selecionados** traz as miniaturas selecionadas no tabuleiro;
- o campo de nome cria PNJs, inclusive em grupo (×2, ×3…), e um grupo usa uma carta só.

**+cartas** dá cartas extras, por exemplo para quem ataca de surpresa. Rápido como um Raio já vem da ficha do jogador.

Clique em **Comprar cartas**.

<br clear="right">

<img src="img/24-jogador-escolhe.png" width="330">

Quem tem cartas extras escolhe uma na própria ficha, e as outras voltam ao baralho. O Mestre também pode escolher pelo jogador no painel. Para os PNJs, quem escolhe é o Mestre.

<img src="img/25-iniciativa-rodada.png" width="330" align="right">

**Durante o combate:**

- A ordem segue as cartas. **Próxima vez** passa a vez e **Voltar uma vez** desfaz.
- **Rápida** e **Lenta** marcam as ações que cada um já usou na rodada.
- **Trocar cartas** troca a carta de dois combatentes. Entre personagens jogadores, só no começo do combate ou da rodada.
- **Fintar** marca uma troca que vale na próxima rodada.
- **Alguém entrou no combate** adiciona gente no meio da luta.
- **Encerrar combate** fecha tudo.

A ordem e a vez de cada um vão para o chat da mesa.

<br clear="right">

<img src="img/26-jogador-combate.png" width="330">

Na ficha de cada jogador aparece uma faixa com a carta dele, a ordem da rodada e de quem é a vez.

## Pedir rolagem

<img src="img/32-pedir.png" width="330" align="right">

Para pedir uma rolagem a um ou mais jogadores:

1. Escolha **Perícia**, **Atributo** ou **Recurso** (comida, água, flechas ou tochas).
2. Ajuste o **modificador** e, se quiser, escreva o motivo.
3. Marque quem rola e clique em **Pedir**.

Os resultados chegam no card do pedido: quantos sucessos cada um tirou, se forçou, ou como ficou o Dado de Recurso.

<br clear="right">

<img src="img/33-jogador-pedido.png" width="330">

Na ficha do jogador aparece o pedido. **Rolar** abre a rolagem já montada, com a perícia e o modificador. **Ignorar** avisa o Mestre. Se o recurso pedido já acabou, a ficha avisa isso no lugar de rolar.

## Jornada

<img src="img/34-jornada.png" width="330" align="right">

A Jornada acompanha a viagem pelo mapa, Quarto de Dia por Quarto de Dia:

- **Dia e Quarto**: Manhã, Dia, Anoitecer e Noite, com a luz de cada um pela **estação**.
- **Terreno**: mostra quantos hexágonos dá para caminhar por Quarto e os modificadores de Coletar e Caçar, já somados à estação.
- **Atividades**: escolha o que cada um faz no Quarto: Caminhar, Desbravar, Vigiar, Coletar, Caçar, Pescar, Acampar, Descansar, Dormir ou Explorar. A tela avisa se duas pessoas fazem uma atividade de uma pessoa só, se o grupo se divide ou se ninguém vigia.
- **Rolagens prontas**: cada atividade gera o botão do pedido de rolagem com o modificador certo, por exemplo Desbravar com −2 no escuro.
- **Escuro e marcha forçada**: no escuro, um botão pede Patrulha a quem caminha. Depois de dois Quartos caminhando no dia, o terceiro pede Resiliência e o quarto pede Resiliência −2 e deixa todos Insones.
- **Necessidades do dia**: **Pedir Comida e Água a todos** rola o Dado de Recurso de cada um e marca quem comeu e bebeu. Quem Dorme num Quarto fica marcado como dormiu. Você também pode marcar à mão.

**Passar para o próximo Quarto** avança e avisa no chat.

<br clear="right">

<img src="img/35-fim-dia.png" width="330" align="right">

Ao encerrar a Noite, a tela mostra quem fica **Faminto**, **Desidratado** ou **Insone**. **Marcar condições** marca tudo na ficha de cada jogador e começa o dia seguinte.

<br clear="right">

<img src="img/36-jogador-jornada.png" width="330">

Na ficha do jogador aparece uma faixa com o dia, o Quarto, a estação e a atividade dele.

## Fim de sessão

<img src="img/27-sessao.png" width="330" align="right">

Na aba **Sessão**:

1. Escolha quanto **XP** dar para cada um. O livro fala de 0 a 10 por sessão, e o comum fica perto de 5.
2. Desmarque quem não deve receber.
3. Marque **+1 Reputação** para quem fez algo lendário.
4. Clique em **Conceder**.

As fichas abertas recebem na hora, somam o XP, ganham a Reputação marcada e liberam o Orgulho para a próxima sessão. Cada ficha confirma o recebimento.

Se alguém não aparece na lista, peça para o jogador abrir a ficha e clique em **Atualizar lista de fichas**.

<br clear="right">

---

## Dúvidas comuns

**Preciso deixar a ficha aberta?**
Não precisa deixá-la na tela, mas o Symbiote precisa estar ativo e você precisa estar no mesmo tabuleiro. Sem isso, o Mestre não vê você no Grupo e você não recebe XP nem a carta de iniciativa.

**Preciso atualizar o Symbiote?**
Não. A ficha carrega da internet, e cada versão nova chega sozinha na próxima vez que você abre o Symbiote. O número da versão aparece no fim da aba Histórico.

**Remover o Symbiote apaga a ficha?**
Sim. As fichas ficam salvas na pasta do Symbiote, por campanha. Só remova se for reinstalar, e faça uma [cópia de segurança](#cópia-de-segurança) antes.

**O TaleSpire mostra a soma dos dados. Está errado?**
A soma dos d6 não significa nada no Forbidden Lands, por isso a ficha esconde o resultado nativo. Vale o que aparece na ficha e no chat.

**Rolei e a ficha não reagiu.**
Confira se você jogou os dados que a ficha colocou na bandeja, e não dados de outra rolagem. Se a bandeja estiver com problema, cancele e use **Rolar aqui, sem dados 3D**.

**Mudei meu nome no TaleSpire.**
O painel do Mestre mostra o nome do personagem, com o nome do jogador ao lado. Mudar o nome de usuário não atrapalha nada.

**Achei um erro ou tenho uma ideia.**
Abra uma issue no [repositório do GitHub](https://github.com/erickhwk/forbiden-lands-symbiote/issues).

---

*Forbidden Lands é marca da Free League Publishing. Esta ficha é um projeto de fã, sem afiliação.*
