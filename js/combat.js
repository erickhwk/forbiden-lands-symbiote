/*
 * Iniciativa: tela do mestre e sincronização com as fichas dos jogadores.
 *
 * A regra do baralho mora em initiative.js (FLInitiative). Este arquivo usa
 * as funções de app.js (app, render, save, toast, esc, ICON, actions).
 *
 * Sincronização (TS.sync, mensagens de até 500 caracteres, em JSON):
 *   ficha -> mestre  { t: "hi", x: cartas extras do talento, d: resumo (summary.js) }
 *                    também enviado sempre que a ficha muda
 *   mestre -> todos  { t: "who" }              pede que as fichas se apresentem
 *   mestre -> todos  { t: "st", ... }          estado do combate (ordem, rodada, vez)
 *   mestre -> ficha  { t: "ch", id, o: [...] } escolha entre cartas extras
 *   ficha -> mestre  { t: "pk", id, c }        carta escolhida
 *   mestre -> todos  { t: "end" }              fim do combate
 *   mestre -> ficha  { t: "xp", n, r }         XP (e Reputação) do fim de sessão; libera o Orgulho
 *   ficha -> mestre  { t: "xpok", n, r }       recebido
 */
"use strict";

var I = window.FLInitiative;

var FAST_TALENT = "rapido-como-um-raio";

/* Estado de combate do lado do jogador (o que o mestre mandou). */
app.table = { sheets: {}, combat: null, choose: null };

/* ------------------------------------------------------------------ */
/* Identidade: mestre ou jogador                                      */
/* ------------------------------------------------------------------ */

/* Nunca falha: sem a API de jogadores, a ficha abre como jogador comum. */
function detectRole() {
  if (!app.ts) { app.canGM = true; return Promise.resolve(); }
  function safe(fn) {
    try { return Promise.resolve(fn()).catch(function () {}); } catch (e) { return Promise.resolve(); }
  }
  var me = safe(function () {
    return TS.clients.whoAmI().then(function (c) { app.clientId = c.id; });
  });
  var gm = safe(function () {
    return TS.players.whoAmI().then(function (p) {
      return TS.players.getMoreInfo([p.id]);
    }).then(function (info) {
      app.canGM = !!(info && info[0] && info[0].rights && info[0].rights.canGm);
    });
  });
  return Promise.all([me, gm]);
}

/* ------------------------------------------------------------------ */
/* Sincronização                                                      */
/* ------------------------------------------------------------------ */

function syncSend(msg, target) {
  if (!app.ts || !TS.sync) return;
  var text = JSON.stringify(msg);
  if (text.length > 500) { console.warn("Mensagem de sync grande demais", text.length); return; }
  TS.sync.send(text, target || "board").catch(function (err) { console.warn("sync", err); });
}

function fastExtra() {
  var t = app.sheet.talentList.filter(function (x) { return x.id === FAST_TALENT; })[0];
  return t ? t.rank : 0;
}

/* A ficha se apresenta ao mestre. */
function sayHello() {
  if (!app.ts || !app.sheet.name) return;
  var st = loadStatus();
  var d = window.FLSummary.encode(app.sheet, { loadUsed: st.used, loadCap: st.capacity, armor: wornArmor().value });
  syncSend({ t: "hi", x: fastExtra(), d: d }, "gms");
}

/* A ficha avisa o Mestre a cada mudança (agrupando mudanças seguidas). */
var helloTimer = null;
function scheduleHello() {
  if (!app.ts) return;
  clearTimeout(helloTimer);
  helloTimer = setTimeout(sayHello, 800);
}

/* Chamado pelo TaleSpire (nome declarado no manifest.json). */
function handleSyncMessage(ev) {
  if (!ev || !ev.payload) return;
  var from = ev.payload.fromClient || {};
  if (app.clientId && from.id === app.clientId) return;
  var msg;
  try { msg = JSON.parse(ev.payload.str); } catch (e) { return; }
  if (!msg || !msg.t) return;

  if (app.canGM) {
    if (msg.t === "hi") {
      var sum = msg.d ? window.FLSummary.decode(msg.d) : null;
      var name = sum ? sum.name : msg.n;
      app.table.sheets[from.id] = { name: name, extra: msg.x | 0, player: from.player ? from.player.name : "", sum: sum, at: Date.now(), online: true };
      linkSheet(from.id, { n: name });
      render();
      return;
    }
    if (msg.t === "rr") { receiveRequestResult(from.id, msg); return; }
    if (msg.t === "xpok") {
      var g = app.grant;
      if (g && g.sent[from.id]) { g.ok[from.id] = true; render(); }
      return;
    }
    if (msg.t === "pk" && app.combat) {
      var e = I.find(app.combat, msg.id);
      if (e && e.clientId === from.id && e.options) {
        I.choose(app.combat, msg.id, msg.c);
        afterCombatChange();
      }
      return;
    }
  }

  if (msg.t === "who") { sayHello(); return; }
  if (msg.t === "xp") { receiveXp(msg); return; }
  if (msg.t === "rq") { receiveRequest(msg); return; }
  if (msg.t === "jn") { receiveJourney(msg); return; }
  if (msg.t === "cd") { receiveCondition(msg); return; }
  if (msg.t === "st") { app.table.combat = msg; app.table.choose = null; render(); return; }
  if (msg.t === "ch") { app.table.choose = msg; render(); return; }
  if (msg.t === "end") { app.table.combat = null; app.table.choose = null; render(); return; }
}

/* Chamado pelo TaleSpire (nome declarado no manifest.json). */
function handleSyncClientEvent(ev) {
  if (!ev || !ev.kind) return;
  if (ev.kind === "clientConnected") {
    if (app.canGM) { syncSend({ t: "who" }); if (app.combat && app.combat.phase !== "setup") broadcastState(); broadcastJourney(); }
    else sayHello();
  }
  if (ev.kind === "clientDisconnected" && app.canGM && ev.payload) {
    // Mantém o último resumo, marcado como sem sinal.
    var sh = app.table.sheets[ev.payload.clientId];
    if (sh) sh.online = false;
    render();
  }
}

/* Se a ficha que se apresentou já está no combate pelo nome, liga as duas. */
function linkSheet(clientId, msg) {
  if (!app.combat) return;
  app.combat.entries.forEach(function (e) {
    if (!e.clientId && e.kind === "pc" && e.name === msg.n) e.clientId = clientId;
  });
}

/* Estado compacto para os jogadores: [carta, nome, final do id do cliente]. */
function broadcastState() {
  var c = app.combat;
  if (!c || !app.ts) return;
  var nameLen = 18, msg;
  do {
    msg = {
      t: "st", r: c.round, p: c.phase,
      cur: c.currentId ? I.sorted(c).map(function (e) { return e.id; }).indexOf(c.currentId) : -1,
      o: I.sorted(c).map(function (e) {
        return [e.card, label(e).slice(0, nameLen), e.clientId ? e.clientId.slice(-6) : ""];
      })
    };
    nameLen -= 4;
  } while (JSON.stringify(msg).length > 480 && nameLen > 2);
  syncSend(msg);
  I.choosing(c).forEach(function (e) {
    if (e.clientId) syncSend({ t: "ch", id: e.id, o: e.options }, e.clientId);
  });
}

function label(e) { return e.name + (e.count > 1 ? " ×" + e.count : ""); }

/* ------------------------------------------------------------------ */
/* Chat                                                               */
/* ------------------------------------------------------------------ */

function chat(text) {
  if (app.ts) TS.chat.send(text, "board").catch(function () {});
}

function chatOrder() {
  var s = I.sorted(app.combat);
  chat("<b>Iniciativa</b> · " + s.map(function (e) { return e.card + " " + clean(label(e)); }).join(" · "));
}

function chatTurn() {
  var cur = I.current(app.combat);
  if (cur) chat("Rodada " + app.combat.round + " · vez de <b>" + clean(label(cur)) + "</b>");
}

function clean(s) { return String(s).replace(/[<>]/g, ""); }

/* Depois de qualquer mudança: salvar, avisar jogadores, redesenhar. */
function afterCombatChange(opts) {
  var c = app.combat;
  var justStarted = c && c.phase === "running" && !c.announced;
  if (justStarted) { c.announced = true; chatOrder(); chatTurn(); }
  else if (opts && opts.turn) chatTurn();
  save();
  broadcastState();
  render();
}

/* ------------------------------------------------------------------ */
/* Tela do mestre                                                     */
/* ------------------------------------------------------------------ */

function renderModeBar() { return renderGmNav(); }

/* ---------- Grupo: o estado de cada personagem ---------- */

var ATTR_SHORT = [["forca", "For"], ["agilidade", "Agi"], ["astucia", "Ast"], ["empatia", "Emp"]];
var COND_LABEL = { faminto: "Faminto", sedento: "Desidratado", exausto: "Insone", congelando: "Hipotérmico" };
var RES_LABEL = [["comida", "Comida"], ["agua", "Água"], ["flechas", "Flechas"], ["tochas", "Tochas"], ["oleo", "Óleo"]];

/* Alertas que pedem atenção do Mestre agora. */
function groupAlerts() {
  var out = [];
  Object.keys(app.table.sheets).forEach(function (id) {
    var sh = app.table.sheets[id], s = sh.sum;
    if (!s) return;
    s.injuries.forEach(function (x) { if (x.lethal) out.push({ id: id, text: sh.name + ": " + x.name + " (letal" + (x.limit ? ", Cura em até " + x.limit : "") + ")", level: 2 }); });
    ATTR_SHORT.forEach(function (a) {
      if (s.attrs[a[0]].max && s.attrs[a[0]].cur === 0) out.push({ id: id, text: sh.name + ": " + attrByKey(a[0]).name + " Acabada", level: 1 });
    });
  });
  return out.sort(function (a, b) { return b.level - a.level; });
}

function renderGroup() {
  var ids = Object.keys(app.table.sheets);
  var html = '<header class="row between"><div><p class="eyebrow">Painel do Mestre</p><h1 class="title">Grupo</h1></div>' +
    '<button class="btn-ghost slim" data-action="grantRefresh">Atualizar</button></header>';
  if (!app.ts) {
    return html + '<div class="notice">' + ICON.warn + "<span>Fora do TaleSpire não há fichas de jogadores para acompanhar.</span></div>";
  }
  var alerts = groupAlerts();
  if (alerts.length) {
    html += '<section class="banner" role="alert"><div class="banner-title">' + ICON.warn + "<span>Atenção</span></div>" +
      alerts.map(function (a) { return '<div class="banner-item">' + esc(a.text) + "</div>"; }).join("") + "</section>";
  }
  if (!ids.length) {
    return html + '<p class="muted" style="margin:0">Nenhuma ficha de jogador apareceu ainda. As fichas aparecem aqui quando os jogadores abrem o Symbiote no mesmo tabuleiro e preenchem o nome.</p>';
  }
  html += ids.map(function (id) { return renderMember(id, app.table.sheets[id]); }).join("");
  return html;
}

function renderMember(id, sh) {
  var s = sh.sum;
  var off = sh.online === false;
  var html = '<section class="card member' + (off ? " off" : "") + '" aria-label="' + esc(sh.name) + '">' +
    '<div class="row between"><div><strong class="member-name">' + esc(sh.name) + "</strong>" +
      (sh.player ? ' <span class="small muted">' + esc(sh.player) + "</span>" : "") + "</div>" +
      '<span class="small ' + (off ? "muted" : "online") + '">' + (off ? "sem sinal · " + ago(sh.at) : "ao vivo") + "</span></div>";
  if (!s) return html + '<div class="small muted">Esta ficha ainda é de uma versão antiga e não manda resumo.</div></section>';

  html += '<div class="member-attrs">' + ATTR_SHORT.map(function (a) {
    var v = s.attrs[a[0]], broken = v.max && v.cur === 0, hurt = v.cur < v.max;
    return '<div class="mattr' + (broken ? " broken" : hurt ? " hurt" : "") + '"><span class="small muted">' + a[1] + "</span>" +
      '<span class="mattr-num">' + v.cur + '<span class="stat-of">/' + v.max + "</span></span></div>";
  }).join("") + "</div>";

  var chips = [];
  if (s.willpower) chips.push('<span class="chip-s">PFV ' + s.willpower + "</span>");
  if (s.armor) chips.push('<span class="chip-s">Armadura ' + s.armor + "</span>");
  s.conditions.forEach(function (c) { chips.push('<span class="chip-s warn">' + COND_LABEL[c] + "</span>"); });
  if (s.loadCap && s.loadUsed > s.loadCap) chips.push('<span class="chip-s warn">Sobrecarregado ' + W.fmt(s.loadUsed) + "/" + s.loadCap + "</span>");
  if (chips.length) html += '<div class="chips">' + chips.join("") + "</div>";

  if (s.injuries.length) {
    html += '<div class="member-inj">' + s.injuries.map(function (x) {
      var heal = x.heal === -1 ? "permanente" : x.heal === -2 ? "" : x.heal === 0 ? "curando" : x.heal + (x.heal === 1 ? " dia" : " dias");
      return '<div class="' + (x.lethal ? "lethal-line" : "small") + '">' + (x.lethal ? ICON.warn : "") + "<span>" + esc(x.name) +
        (x.lethal ? " · <strong>letal" + (x.limit ? ", até " + esc(x.limit) : "") + "</strong>" : heal ? ' <span class="muted">· ' + heal + "</span>" : "") + "</span></div>";
    }).join("") + "</div>";
  }

  html += '<div class="member-res small">' + RES_LABEL.filter(function (r) { return r[0] !== "oleo" || s.resources.oleo; }).map(function (r) {
    var d = s.resources[r[0]];
    return '<span class="' + (d === 0 && (r[0] === "comida" || r[0] === "agua") ? "warn-text" : d ? "" : "muted") + '">' + r[1] + " " + (d ? "D" + d : "—") + "</span>";
  }).join("") + '<span class="muted">XP ' + s.xp + "/" + s.xpTotal + " · Rep " + s.reputation + "</span></div>";
  return html + "</section>";
}

function ago(t) {
  if (!t) return "";
  var m = Math.round((Date.now() - t) / 60000);
  return m < 1 ? "agora" : m < 60 ? "há " + m + " min" : "há " + Math.round(m / 60) + " h";
}

function renderCombat() {
  if (!app.combat) app.combat = I.create();
  var c = app.combat;
  if (c.phase === "setup") return renderSetup(c);
  return renderRunning(c);
}

function renderSetup(c) {
  var html = '<header class="row between"><h1 class="title">Iniciativa</h1>' +
    '<span class="small muted">' + E.plural(c.entries.length, "combatente", "combatentes") + "</span></header>";

  html += '<p class="small muted" style="margin:0">Monte o combate e compre as cartas. Quem tem cartas extras compra antes e escolhe uma; as outras voltam ao baralho.</p>';

  html += '<section class="list" aria-label="Combatentes">' + (c.entries.length ? c.entries.map(function (e) {
    return '<div class="list-row">' +
      '<div class="grow">' +
        '<input class="plain-input" data-bind="combat.name" data-id="' + e.id + '" aria-label="Nome" value="' + esc(e.name) + '">' +
        '<div class="small muted">' +
          '<button class="link-btn inline" data-action="combatKind" data-id="' + e.id + '">' + (e.kind === "pc" ? "Personagem jogador" : "PNJ") + "</button>" +
          (e.count > 1 ? " · grupo de " + e.count : "") +
          (e.clientId ? " · ficha ligada" : "") +
          (e.hpMax ? " · Força " + e.hpMax : "") +
        "</div>" +
      "</div>" +
      '<span class="small muted" title="Cartas extras: surpresa, Rápido como um Raio…">+cartas</span>' +
      '<button class="btn-step" data-action="combatExtra" data-id="' + e.id + '" data-delta="-1" aria-label="Menos cartas extras"' + (e.extra <= 0 ? " disabled" : "") + ">−</button>" +
      '<span class="level">' + e.extra + "</span>" +
      '<button class="btn-step" data-action="combatExtra" data-id="' + e.id + '" data-delta="1" aria-label="Mais cartas extras"' + (e.extra >= 3 ? " disabled" : "") + ">+</button>" +
      '<button class="btn-icon sm" data-action="combatRemove" data-id="' + e.id + '" aria-label="Remover ' + esc(e.name) + '">' + ICON.close + "</button>" +
    "</div>";
  }).join("") : '<p class="muted" style="margin:0">Ninguém no combate ainda.</p>') + "</section>";

  html += renderAdders(c);

  if (c.entries.length > I.DECK_SIZE) {
    html += '<div class="notice warn">' + ICON.warn + "<span>Mais de " + I.DECK_SIZE + " combatentes: junte PNJs iguais num grupo, que compra uma carta só.</span></div>";
  }
  html += '<div class="actions"><button class="btn-primary" data-action="combatDeal"' + (c.entries.length ? "" : " disabled") + ">" + ICON.cards + "Comprar cartas</button>" +
    '<p class="small muted" style="margin:0">Surpresa: +1 carta para quem ataca de surpresa. Rápido como um Raio já vem da ficha do jogador.</p></div>';
  return html;
}

function renderAdders(c) {
  var added = {};
  c.entries.forEach(function (e) { if (e.clientId) added[e.clientId] = true; });
  var sheets = Object.keys(app.table.sheets).filter(function (id) { return !added[id] && app.table.sheets[id].online !== false; });

  var html = '<section class="stack" aria-label="Adicionar combatentes"><h2 class="eyebrow">Adicionar</h2>';
  if (app.ts) {
    html += '<div class="chips">' +
      (sheets.length
        ? sheets.map(function (id) {
            var s = app.table.sheets[id];
            return '<button class="chip-btn" data-action="combatAddSheet" data-client="' + esc(id) + '">' + ICON.plus + esc(s.name) +
              (s.extra ? ' <span class="muted">+' + s.extra + "</span>" : "") + "</button>";
          }).join("")
        : '<span class="small muted">' + (Object.keys(app.table.sheets).length
            ? "Todas as fichas abertas na mesa já estão no combate."
            : "Nenhuma ficha de jogador aberta na mesa agora. Elas aparecem aqui quando os jogadores abrem a ficha.") + "</span>") +
      "</div>" +
      '<div class="row" style="gap:8px;flex-wrap:wrap">' +
        '<button class="btn-ghost slim" data-action="combatFromQueue">Da fila do TaleSpire</button>' +
        '<button class="btn-ghost slim" data-action="combatFromSelection">Minis selecionados</button>' +
      "</div>";
  }
  html += '<div class="adder">' +
    '<label for="f-combat-name" class="sr-only">Nome do combatente</label>' +
    '<input id="f-combat-name" class="field grow" placeholder="Nome (ex.: Orc)">' +
    '<label for="f-combat-count" class="sr-only">Quantidade</label>' +
    '<select id="f-combat-count" class="field" style="width:auto;margin-top:0" title="Quantos iguais (um grupo compra uma carta)">' +
      [1, 2, 3, 4, 5, 6, 8, 10].map(function (n) { return '<option value="' + n + '">×' + n + "</option>"; }).join("") +
    "</select>" +
    '<label for="f-combat-hp" class="sr-only">Força (opcional)</label>' +
    '<input id="f-combat-hp" class="field" type="number" min="1" max="99" inputmode="numeric" placeholder="Força" title="Força de cada um (opcional), para descontar o dano" style="width:76px;margin-top:0">' +
    '<button class="btn-add" data-action="combatAddManual">Adicionar</button></div>' +
    '<p class="small muted" style="margin:0">Monstros e animais entram pelo <button class="link-btn inline" data-action="mode" data-mode="bestiary">Bestiário</button>, já com a Força.</p>' +
  "</section>";
  return html;
}

function renderRunning(c) {
  var html = '<header class="row between"><div><p class="eyebrow">Iniciativa</p>' +
    '<h1 class="title">' + (c.phase === "dealing" ? "Comprando cartas" : "Rodada " + c.round) + "</h1></div>" +
    '<button class="link-btn" data-action="combatEnd">Encerrar combate</button></header>';

  var choosing = I.choosing(c);
  if (choosing.length) {
    html += choosing.map(function (e) {
      return '<div class="banner choose">' +
        '<div class="banner-title">' + ICON.cards + "<span>" + esc(label(e)) + " escolhe uma carta</span></div>" +
        (e.clientId ? '<div class="banner-item small">O jogador pode escolher pela ficha dele. Ou escolha aqui.</div>' : "") +
        '<div class="card-pick">' + e.options.map(function (n) {
          return '<button class="init-card pick" data-action="combatChoose" data-id="' + e.id + '" data-card="' + n + '" aria-label="Ficar com a carta ' + n + '">' + n + "</button>";
        }).join("") + "</div></div>";
    }).join("");
  }

  var cur = I.current(c);
  html += '<section class="init-list" aria-label="Ordem de iniciativa">' + I.sorted(c).map(function (e) {
    var isCur = cur && cur.id === e.id && c.phase === "running";
    var swapping = c.pendingSwaps.some(function (p) { return p[0] === e.id || p[1] === e.id; });
    var out = I.down(e);
    return '<div class="init-row' + (isCur ? " current" : "") + (out ? " out" : "") + '"' + (isCur ? ' aria-current="true"' : "") + ">" +
      '<span class="init-card">' + e.card + "</span>" +
      '<div class="grow"><div class="item-name">' + esc(label(e)) + "</div>" +
        '<div class="small muted">' + (out ? "Acabado" : e.mon ? (B.get(e.mon) && B.get(e.mon).kind === "animal" ? "Animal" : "Monstro") : e.kind === "pc" ? "Personagem jogador" : "PNJ") + (swapping ? " · fintou: troca na próxima rodada" : "") + "</div></div>" +
      '<button class="act' + (e.fast ? " on" : "") + '" data-action="combatAct" data-id="' + e.id + '" data-which="fast" aria-pressed="' + e.fast + '" title="Ação rápida">Rápida</button>' +
      '<button class="act' + (e.slow ? " on" : "") + '" data-action="combatAct" data-id="' + e.id + '" data-which="slow" aria-pressed="' + e.slow + '" title="Ação lenta">Lenta</button>' +
      (e.hp || e.mon ? '<div class="init-extra">' + renderHpLines(e) + (out ? "" : renderMonButtons(e)) + "</div>" : "") +
    "</div>";
  }).join("") + "</section>";

  var left = I.waiting(c);
  if (left.length && !choosing.length) {
    html += '<div class="notice warn">' + ICON.warn + "<span>Sem carta: " + left.map(function (e) { return esc(label(e)); }).join(", ") +
      ". O baralho acabou; junte PNJs em grupos ou tire alguém.</span></div>";
  }

  if (c.phase === "running") {
    html += '<div class="actions"><button class="btn-primary" data-action="combatNext">' + ICON.next + "Próxima vez</button>" +
      '<button class="link-btn" data-action="combatPrev">Voltar uma vez</button></div>';
    html += renderSwap(c);
    html += '<details class="late"><summary>Alguém entrou no combate</summary>' + renderAdders(c) + "</details>";
  }
  return html;
}

function renderSwap(c) {
  var s = I.sorted(c);
  if (s.length < 2) return "";
  function opts(selected) {
    return s.map(function (e, i) {
      return '<option value="' + e.id + '"' + (i === selected ? " selected" : "") + ">" + e.card + " · " + esc(label(e)) + "</option>";
    }).join("");
  }
  return '<section class="stack" aria-label="Trocar cartas"><h2 class="eyebrow">Trocar cartas</h2>' +
    '<div class="swap">' +
      '<select id="f-swap-a" class="field grow" aria-label="Primeiro combatente">' + opts(0) + "</select>" +
      '<select id="f-swap-b" class="field grow" aria-label="Segundo combatente">' + opts(1) + "</select>" +
    "</div>" +
    '<div class="row" style="gap:8px">' +
      '<button class="btn-add" data-action="combatSwap" data-feint="0">Trocar agora</button>' +
      '<button class="btn-ghost slim" data-action="combatSwap" data-feint="1">Fintar (vale na próxima rodada)</button>' +
    "</div>" +
    '<p class="small muted" style="margin:0">Entre personagens jogadores, só no começo do combate ou de uma rodada.</p>' +
  "</section>";
}

/* ---------- Sessão: o Mestre concede XP ---------- */

/*
 * app.grant: { xp, rep: {clientId: true}, skip: {clientId: true}, sent: {...}, ok: {...} }
 * Só as fichas abertas na mesa recebem. Quem não estiver com a ficha aberta
 * pode somar à mão com o + do card de Experiência.
 */
function renderSession() {
  if (!app.grant) app.grant = { xp: 5, rep: {}, skip: {}, sent: {}, ok: {} };
  var g = app.grant;
  var ids = Object.keys(app.table.sheets).filter(function (id) { return app.table.sheets[id].online !== false; });
  var html = '<header><p class="eyebrow">Fim de sessão</p><h1 class="title">Conceder XP</h1></header>' +
    '<p class="small muted" style="margin:0">O XP vai para as fichas abertas na mesa agora. Cada ficha soma o XP, ganha a Reputação marcada e libera o Orgulho para a próxima sessão.</p>' +
    '<section class="card stat"><div class="row between"><span class="eyebrow">XP para cada um</span>' +
      '<div class="stepper" style="gap:10px">' +
        '<button class="btn-step" data-action="grantXp" data-delta="-1" aria-label="Menos XP"' + (g.xp <= 0 ? " disabled" : "") + ">−</button>" +
        '<span class="stat-num">' + g.xp + "</span>" +
        '<button class="btn-step" data-action="grantXp" data-delta="1" aria-label="Mais XP"' + (g.xp >= 10 ? " disabled" : "") + ">+</button>" +
      "</div></div>" +
      '<div class="small muted">O livro dá de 0 a 10 por sessão; a média costuma ficar perto de 5.</div></section>';

  if (!app.ts) {
    html += '<div class="notice">' + ICON.warn + "<span>Fora do TaleSpire não há fichas de jogadores para receber.</span></div>";
    return html;
  }
  html += '<section class="list" aria-label="Quem recebe">' + (ids.length ? ids.map(function (id) {
    var sh = app.table.sheets[id], got = g.ok[id], sent = g.sent[id];
    return '<div class="list-row">' +
      '<label class="check grow"><input type="checkbox" data-grant-who="' + esc(id) + '"' + (g.skip[id] ? "" : " checked") + (sent ? " disabled" : "") + "> " +
        "<span><strong>" + esc(sh.name) + "</strong>" + (sh.player ? ' <span class="small muted">' + esc(sh.player) + "</span>" : "") + "</span></label>" +
      '<label class="check small"><input type="checkbox" data-grant-rep="' + esc(id) + '"' + (g.rep[id] ? " checked" : "") + (sent ? " disabled" : "") + "> +1 Reputação</label>" +
      (got ? '<span class="small" style="color:var(--success)">' + ICON.check + " recebeu</span>" : sent ? '<span class="small muted">enviado…</span>' : "") +
    "</div>";
  }).join("") : '<p class="muted" style="margin:0">Nenhuma ficha de jogador aberta na mesa agora. Peça para os jogadores abrirem a ficha.</p>') + "</section>";

  var chosen = ids.filter(function (id) { return !g.skip[id] && !g.sent[id]; });
  html += '<div class="actions"><button class="btn-primary" data-action="grantSend"' + (chosen.length ? "" : " disabled") + ">" + ICON.star +
    "Conceder " + g.xp + " XP" + (chosen.length ? " para " + E.plural(chosen.length, "personagem", "personagens") : "") + "</button>" +
    (Object.keys(g.sent).length ? '<button class="link-btn" data-action="grantReset">Nova concessão</button>' : "") +
    '<button class="link-btn" data-action="grantRefresh">Atualizar lista de fichas</button></div>';
  return html;
}

/* Na ficha do jogador: recebe o XP do Mestre. */
function receiveXp(msg) {
  var s = app.sheet, n = Math.max(0, msg.n | 0), r = msg.r ? 1 : 0;
  s.xp += n; s.xpTotal += n;
  if (r) s.reputation = clamp(s.reputation + 1, 0, MAX_REP);
  s.prideUsedSession = false;
  save();
  render();
  toast("O Mestre concedeu " + n + " XP" + (r ? " e +1 de Reputação" : "") + ". O Orgulho está disponível de novo.");
  syncSend({ t: "xpok", n: n, r: r }, "gms");
}

/* ---------- Visão do jogador ---------- */

function renderPlayerCombat() {
  var st = app.table.combat, ch = app.table.choose;
  if (!st && !ch) return "";
  var mine = app.clientId ? app.clientId.slice(-6) : "";
  var html = '<section class="banner table" aria-label="Combate">';
  if (ch) {
    html += '<div class="banner-title">' + ICON.cards + "<span>Escolha sua carta de iniciativa</span></div>" +
      '<div class="card-pick">' + ch.o.map(function (n) {
        return '<button class="init-card pick" data-action="playerPick" data-card="' + n + '" aria-label="Ficar com a carta ' + n + '">' + n + "</button>";
      }).join("") + "</div>";
  }
  if (st && st.o && st.o.length) {
    var myEntry = st.o.filter(function (o) { return o[2] && o[2] === mine; })[0];
    var cur = st.cur >= 0 ? st.o[st.cur] : null;
    var myTurn = cur && myEntry && cur === myEntry;
    html += '<div class="banner-title">' + ICON.cards + "<span>" + (st.p === "running" ? "Combate · rodada " + st.r : "Comprando cartas") + "</span></div>" +
      '<div class="row between">' +
        (myEntry ? '<span>Sua carta: <strong class="init-inline">' + myEntry[0] + "</strong></span>" : '<span class="muted">Você ainda não tem carta</span>') +
        (cur ? '<span class="' + (myTurn ? "your-turn" : "muted") + '">' + (myTurn ? "Sua vez!" : "Vez de " + esc(cur[1])) + "</span>" : "") +
      "</div>" +
      '<div class="mini-order">' + st.o.map(function (o, i) {
        return '<span class="' + (i === st.cur ? "on" : "") + (o === myEntry ? " me" : "") + '">' + o[0] + " " + esc(o[1]) + "</span>";
      }).join("") + "</div>";
  }
  return html + "</section>";
}

/* ------------------------------------------------------------------ */
/* Ações                                                              */
/* ------------------------------------------------------------------ */

Object.assign(actions, {
  grantXp: function (el) { app.grant.xp = clamp(app.grant.xp + (+el.dataset.delta), 0, 10); },

  grantRefresh: function () { syncSend({ t: "who" }); toast("Pedindo para as fichas abertas se apresentarem…"); },

  grantReset: function () { app.grant = null; },

  grantSend: function () {
    var g = app.grant, names = [], reps = [];
    Object.keys(app.table.sheets).forEach(function (id) {
      if (g.skip[id] || g.sent[id] || app.table.sheets[id].online === false) return;
      syncSend({ t: "xp", n: g.xp, r: g.rep[id] ? 1 : 0 }, id);
      g.sent[id] = true;
      names.push(app.table.sheets[id].name);
      if (g.rep[id]) reps.push(app.table.sheets[id].name);
    });
    if (names.length) {
      chat("<b>Fim de sessão</b> · <color=#E8B84A><b>+" + g.xp + " XP</b></color> para " + names.map(clean).join(", ") +
        (reps.length ? " · +1 Reputação: " + reps.map(clean).join(", ") : ""));
    }
  },

  mode: function (el) { app.mode = el.dataset.mode; window.scrollTo(0, 0); },

  combatKind: function (el) {
    var e = I.find(app.combat, el.dataset.id);
    if (e) e.kind = e.kind === "pc" ? "npc" : "pc";
    save();
  },

  combatExtra: function (el) {
    var e = I.find(app.combat, el.dataset.id);
    if (e) e.extra = clamp(e.extra + (+el.dataset.delta), 0, 3);
    save();
  },

  combatRemove: function (el) {
    I.removeEntry(app.combat, el.dataset.id);
    afterCombatChange();
    return false;
  },

  combatAddManual: function () {
    var input = document.getElementById("f-combat-name");
    var count = +document.getElementById("f-combat-count").value || 1;
    var name = input && input.value.trim();
    if (!name) { toast("Escreva o nome do combatente."); return false; }
    var hp = +(document.getElementById("f-combat-hp") || {}).value || 0;
    addCombatant({ name: name, kind: "npc", count: count, hpMax: hp });
    return false;
  },

  combatAddSheet: function (el) {
    var id = el.dataset.client, s = app.table.sheets[id];
    if (s) addCombatant({ name: s.name, kind: "pc", extra: s.extra, clientId: id });
    return false;
  },

  combatFromQueue: function () {
    TS.initiative.getQueue().then(function (q) {
      var items = (q && q.items) || [];
      if (!items.length) { toast("A fila de iniciativa do TaleSpire está vazia."); return; }
      var have = {};
      app.combat.entries.forEach(function (e) { if (e.key) have[e.key] = true; });
      items.forEach(function (it) { if (!have[it.id]) addCombatant({ name: it.name, kind: "npc", key: it.id }, true); });
      afterCombatChange();
    }).catch(function () { toast("Não consegui ler a fila do TaleSpire."); });
    return false;
  },

  combatFromSelection: function () {
    TS.creatures.getSelectedCreatures().then(function (sel) {
      if (!sel || !sel.length) { toast("Selecione minis no tabuleiro primeiro."); return null; }
      return TS.creatures.getMoreInfo(sel.map(function (s) { return s.id; }));
    }).then(function (infos) {
      if (!infos) return;
      var have = {};
      app.combat.entries.forEach(function (e) { if (e.key) have[e.key] = true; });
      infos.forEach(function (ci) {
        if (!have[ci.id]) addCombatant({ name: ci.name || "Mini", kind: "npc", key: ci.id }, true);
      });
      afterCombatChange();
    }).catch(function () { toast("Não consegui ler os minis selecionados."); });
    return false;
  },

  combatDeal: function () {
    I.deal(app.combat);
    app.combat.announced = false;
    afterCombatChange();
    return false;
  },

  combatChoose: function (el) {
    I.choose(app.combat, el.dataset.id, +el.dataset.card);
    afterCombatChange();
    return false;
  },

  combatNext: function () {
    I.next(app.combat);
    afterCombatChange({ turn: true });
    return false;
  },

  combatPrev: function () {
    I.prev(app.combat);
    afterCombatChange({ turn: true });
    return false;
  },

  combatAct: function (el) {
    I.toggleAction(app.combat, el.dataset.id, el.dataset.which);
    save();
  },

  combatSwap: function (el) {
    var a = document.getElementById("f-swap-a").value, b = document.getElementById("f-swap-b").value;
    if (a === b) { toast("Escolha dois combatentes diferentes."); return false; }
    var feint = el.dataset.feint === "1";
    I.swap(app.combat, a, b, feint);
    var ea = I.find(app.combat, a), eb = I.find(app.combat, b);
    chat(clean(label(ea)) + " e " + clean(label(eb)) + (feint ? " vão trocar de iniciativa na próxima rodada (fintar)." : " trocaram de iniciativa."));
    afterCombatChange();
    return false;
  },

  combatEnd: function () {
    if (app.combat && app.combat.phase !== "setup") chat("<b>Fim do combate</b>");
    var keep = app.combat ? app.combat.entries : [];
    app.combat = I.create();
    // mantém a lista de combatentes para o próximo combate, sem as cartas
    keep.forEach(function (e) {
      I.addEntry(app.combat, { name: e.name, kind: e.kind, extra: e.kind === "pc" ? e.extra : 0, count: e.count, clientId: e.clientId, key: e.key });
    });
    syncSend({ t: "end" });
    save();
    render();
    return false;
  },

  playerPick: function (el) {
    var ch = app.table.choose;
    if (!ch) return false;
    syncSend({ t: "pk", id: ch.id, c: +el.dataset.card }, "gms");
    app.table.choose = null;
    toast("Carta escolhida: " + el.dataset.card + ".");
  }
});

function addCombatant(data, quiet) {
  var c = app.combat;
  if (c.phase === "setup") I.addEntry(c, data);
  else I.addLate(c, data);
  var input = document.getElementById("f-combat-name");
  if (input) input.value = "";
  if (!quiet) afterCombatChange();
}

document.addEventListener("change", function (ev) {
  var el = ev.target, g = app.grant;
  if (!g || !el.dataset) return;
  if (el.dataset.grantWho) { if (el.checked) delete g.skip[el.dataset.grantWho]; else g.skip[el.dataset.grantWho] = true; render(); }
  if (el.dataset.grantRep) { if (el.checked) g.rep[el.dataset.grantRep] = true; else delete g.rep[el.dataset.grantRep]; render(); }
});

document.addEventListener("input", function (ev) {
  var el = ev.target;
  if (el.dataset && el.dataset.bind === "combat.name" && app.combat) {
    var e = I.find(app.combat, el.dataset.id);
    if (e) { e.name = el.value; save(); }
  }
});

document.addEventListener("keydown", function (ev) {
  if (ev.key === "Enter" && ev.target && ev.target.id === "f-combat-name") {
    ev.preventDefault();
    actions.combatAddManual();
  }
});
