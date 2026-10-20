# Ficha Forbidden Lands (Symbiote do TaleSpire)

Ficha de personagem de Forbidden Lands que roda dentro do TaleSpire como Symbiote. Os dados são rolados de verdade na bandeja do jogo, e a ficha interpreta o resultado do jeito do Forbidden Lands: conta sucessos, marca os danos, deixa forçar a rolagem e posta tudo no chat da mesa.

## O que tem

- Atributos com dano (clique nos quadradinhos), Força de Vontade e condições. Cada condição ativa mostra o que causa, tem botão para aplicar o dano periódico (Hipotérmico já tira 1 de Força e de Astúcia ao começar) e avisa quando você tenta recuperar um atributo que ela bloqueia.
- Reputação e Experiência ficam no topo da aba Histórico.
- Reputação de 0 a 10, que acompanha a idade (Jovem 0, Adulto 1, Idoso 2) e tem botão para rolar se o personagem é reconhecido. Experiência com XP disponível e total ganho. O botão "Evoluir" abre um modo em que cada perícia e talento mostra o custo do livro (perícia: 5 × o novo nível; talento: 3 × a nova categoria; talento novo: 3), desconta o XP ao tocar, deixa desfazer e avisa no chat ao concluir.
- Fim de sessão (aba Sessão, só para quem pode ser mestre): o Mestre escolhe quanto XP dar e para quem, marca +1 de Reputação para quem fez algo lendário, e as fichas abertas dos jogadores recebem na hora e liberam o Orgulho.
- Aviso claro quando um atributo fica Acabado: o que acontece com o personagem e como ele volta. O chat da mesa também avisa.
- As 16 perícias, com nível e botão de rolar.
- Ascendência e profissão escolhidas em lista. A ascendência já adiciona o talento dela.
- Moedas de cobre, prata e ouro, com o valor total; cada 100 moedas pesam meio item na carga.
- Consumíveis (comida, água, flechas e tochas) como Dados de Recurso, de D6 a D12. O botão Usar rola o dado na bandeja do TaleSpire: com 1 ou 2 ele desce um passo, e com 1 ou 2 no D6 o recurso acaba. O resultado vai para o chat. Ao escolher a profissão, a ficha preenche os dados iniciais dela.
- Carga calculada sozinha: capacidade de Força base × 2 (mais o talento Empacotador), peso de cada item do livro (pequeno, leve, normal, pesado ou sem peso para recipientes) e aviso de sobrecarga com o que ela causa.
- Equipamento escolhido do catálogo, com o Bônus de Equipamento do livro. Item que chega a bônus 0 aparece como quebrado, e item danificado pode ser reparado com um clique.
- Talentos escolhidos do catálogo (da ascendência, da profissão e gerais), com categoria 1 a 3.
- Aba Histórico: idade, aparência (rosto, corpo, roupas), Orgulho, Segredo Sombrio, relacionamentos e anotações.
- Antes de forçar, a ficha avisa se forçar vai ou pode deixar o atributo Acabado ou quebrar o item.
- Montagem da rolagem: atributo atual, perícia, modificador (sai dos dados de perícia; abaixo de zero vira dados negativos), equipamento e dado de artefato (d8, d10 ou d12).
- Rolagem na bandeja do TaleSpire. O resultado nativo fica oculto, porque a soma dos d6 não significa nada no Forbidden Lands, e a ficha posta a interpretação no chat da mesa.
- Forçar: só os dados que não deram sucesso nem 1 em atributo/equipamento voltam para a bandeja. Depois de forçar, a ficha aplica o dano no atributo, soma a Força de Vontade e reduz o bônus do equipamento.
- Orgulho: quando um teste de perícia falha, um botão rola o D12 extra do Orgulho (uma vez por sessão). Se mesmo assim falhar, a ficha marca o Orgulho como perdido.
- Gastar Pontos de Força de Vontade direto pela ficha (1, 2 ou 3, indicando o talento ou a magia). O gasto aparece no chat da mesa.
- Dano no ataque: em Luta e Pontaria, o resultado mostra o dano (Dano da Arma mais 1 por sucesso extra; desarmado é 1) e manda para o chat.
- Armadura: a ficha soma a armadura e o elmo vestidos. "Fui atingido" rola a armadura na bandeja (cada 6 reduz 1 de dano), aplica o resto na Força e, se algum dano passou, desgasta a armadura pelos 1 rolados (você escolhe se a armadura ou o elmo).
- Ferimentos Graves: quando a Força ou a Astúcia fica Acabada, a ficha rola o D66 na bandeja na tabela certa (laceração, perfuração ou trauma concussivo pelo tipo do golpe; horror para Astúcia), aplica a regra do elmo e anota o ferimento com efeito, prazo se for letal e dias de cura (com "Cuidados" para cortar pela metade). Ficar Acabado ao forçar não gera ferimento; dano atípico (fogo, frio) tem opção própria.
- Rolar sem dados 3D, se precisar.
- Painel do Mestre: quem tem permissão de Mestre abre direto no painel, com Grupo, Iniciativa e Sessão (a ficha de personagem fica a um clique). O Grupo mostra ao vivo, a partir das fichas abertas dos jogadores, atributos, quem está Acabado, ferimentos (com alerta para os letais), condições, Força de Vontade, armadura, sobrecarga, consumíveis, XP e Reputação; quem fecha o Symbiote aparece como sem sinal.
- Iniciativa com o baralho de 10 cartas (aba só para quem pode ser mestre): montar o combate com as fichas abertas na mesa, a fila do TaleSpire, os minis selecionados ou nomes escritos; grupos de PNJs iguais; cartas extras por surpresa ou Rápido como um Raio, com escolha da carta; rodadas, vez de cada um, marcação de ação rápida e lenta, troca de cartas e FINTAR. A ordem e a vez aparecem no chat e na ficha de cada jogador. O chat marca essas rolagens como "rolado na ficha".

A ficha é salva por campanha, no próprio TaleSpire. Na aba Histórico, "Exportar ficha" copia a ficha inteira como texto, "Importar ficha" a traz de volta e "Limpar ficha" recomeça do zero (pedindo confirmação). Guarde uma cópia antes de atualizar o Symbiote, ou use para levar a ficha para outra campanha ou outro computador.

## Instalar

1. No TaleSpire, ative os Symbiotes em Configurações → Modding.
2. No painel de Symbiotes, clique em "Open Symbiotes Directory".
3. Copie esta pasta para lá. O `manifest.json` precisa ficar direto dentro da pasta do Symbiote, por exemplo:

   ```
   Symbiotes/
     ficha-forbidden-lands/
       manifest.json
       index.html
       ...
   ```

   Se baixar o zip do GitHub, tire a pasta extra que ele cria.
4. A ficha aparece no painel de Symbiotes. Cada jogador instala na própria máquina.

## Como rolar

1. Clique no dado ao lado de uma perícia ou de um atributo.
2. Ajuste modificador, equipamento e artefato, e clique em "Colocar na bandeja".
3. Pegue os dados na bandeja do TaleSpire e jogue no tabuleiro.
4. O resultado aparece na ficha e no chat. Se quiser, force: a ficha coloca na bandeja só os dados que podem ser re-rolados.

## Testar fora do TaleSpire

Abra o `index.html` num navegador (de preferência servido, por exemplo com `python3 -m http.server`). A ficha entra em "modo navegador": salva no navegador e rola os dados ali mesmo, sem chat.

Testes do motor de regras:

```
npm test
```

## Estrutura

- `js/engine.js`: motor de regras puro, sem DOM nem API do TaleSpire. Dá para reaproveitar em outra interface.
- `js/initiative.js`: baralho de iniciativa, também puro.
- `js/combat.js`: painel do Mestre (grupo, iniciativa, sessão) e sincronização com as fichas dos jogadores.
- `js/summary.js`: resumo compacto da ficha que vai para o Mestre, também puro.
- `js/encumbrance.js`: cálculo da carga, também puro.
- `js/resources.js`: Dados de Recurso, também puro.
- `js/injuries.js`: tabelas e regras de Ferimentos Graves, também puro.
- `js/app.js`: ficha, telas, bandeja de dados, chat e armazenamento.
- `css/style.css`: visual.
- `manifest.json`: configuração do Symbiote.

## Regras implementadas

- d6 de atributo, perícia e equipamento: 6 é sucesso.
- 1 em atributo ou equipamento é dano, mas só conta se a rolagem for forçada. Cada um causa 1 de dano no atributo (e dá 1 de Força de Vontade) ou tira 1 do bônus do equipamento.
- Dados de artefato: 6–7 vale 1 sucesso, 8–9 vale 2, 10–11 vale 3 e 12 vale 4.
- Dados negativos: cada 6 anula um sucesso.
- Ao forçar, re-rola tudo que não mostra sucesso nem dano.
- Golpe: Dano da Arma mais 1 por sucesso além do primeiro.
- Ferimento Grave: D66 na tabela do último tipo de dano; letal exige Cura antes do prazo; o efeito dura o tempo de cura, e Cuidados com sucesso cortam o que falta pela metade. Os efeitos estão resumidos com palavras próprias.
- Armadura: um dado por ponto de Valor de Armadura (corpo + elmo), cada 6 reduz 1 de dano; não pode ser forçada. Se algum dano passar, cada 1 reduz o Valor de Armadura em 1.

Os nomes de perícias, condições, ascendências, profissões, talentos e itens seguem o Manual do Jogador da edição brasileira. O catálogo fica em `js/catalog.js`, só com nomes e números.

Forbidden Lands é marca da Free League Publishing. Este é um projeto de fã, sem afiliação.
