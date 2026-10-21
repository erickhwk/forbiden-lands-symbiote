/*
 * Painel do Mestre: home de cards e pedidos de rolagem.
 *
 * Usa as funções de app.js e combat.js (app, render, save, toast, esc, ICON,
 * actions, syncSend, groupAlerts, I…).
 *
 * Pedidos de rolagem (TS.sync, JSON de até 500 caracteres):
 *   mestre -> ficha  { t: "rq", id, k: "s"|"a"|"r", c: chave, m: modificador, n: motivo }
 *                    k = perícia, atributo ou recurso (Dado de Recurso)
 *   ficha -> mestre  { t: "rr", id, s: sucessos, p: 1 se forçada }       perícia/atributo
 *                    { t: "rr", id, v: valor, b: dado antes, a: depois }  recurso
 *                    { t: "rr", id, x: 1 }                                ignorou
 *                    { t: "rr", id, x: 2 }                                recurso já acabado
 */
"use strict";

var RQ_KINDS = [["s", "Perícia"], ["a", "Atributo"], ["r", "Recurso"]];
var MAX_REQUESTS = 6;

app.requests = [];        // mestre: pedidos feitos nesta sessão (mais novo primeiro)
app.rqForm = null;        // mestre: formulário do pedido
app.table.requests = [];  // jogador: pedidos esperando rolagem
app.resRequest = {};      // jogador: recurso -> id do pedido

/* ------------------------------------------------------------------ */
/* Navegação                                                          */
/* ------------------------------------------------------------------ */

function renderGmNav() {
  if (!app.canGM || !app.ts || app.mode === "home") return "";
  if (app.mode === "bestiary" && app.bestiary.open) return "";
  return '<div class="gm-back"><button class="link-btn inline" data-action="mode" data-mode="home">' + ICON.back + "<span>Painel do Mestre</span></button></div>";
}

/* ------------------------------------------------------------------ */
/* Home                                                               */
/* ------------------------------------------------------------------ */

function onlineSheets() {
  return Object.keys(app.table.sheets).filter(function (id) { return app.table.sheets[id].online !== false; });
}

function renderHome() {
  var ids = Object.keys(app.table.sheets), live = onlineSheets();
  var alerts = groupAlerts();
  var html = '<header class="row between"><div><p class="eyebrow">Painel do Mestre</p><h1 class="title">Mesa</h1></div>' +
    '<button class="btn-icon sm gear" data-action="settingsOpen" aria-label="Configurações" title="Configurações">' + ICON.gear + "</button></header>" + renderNews();

  if (alerts.length) {
    html += '<button class="banner home-alert" data-action="mode" data-mode="group">' +
      '<div class="banner-title">' + ICON.warn + "<span>" + E.plural(alerts.length, "alerta", "alertas") + "</span></div>" +
      alerts.slice(0, 3).map(function (a) { return '<div class="banner-item">' + esc(a.text) + "</div>"; }).join("") + "</button>";
  }

  var cards = [];

  var conds = 0;
  ids.forEach(function (id) { var s = app.table.sheets[id].sum; if (s) conds += s.conditions.length; });
  cards.push(homeCard("group", ICON.users, "Grupo",
    ids.length ? E.plural(live.length, "ficha ao vivo", "fichas ao vivo") + (ids.length > live.length ? " · " + (ids.length - live.length) + " sem sinal" : "") : "Nenhuma ficha ainda",
    alerts.length ? E.plural(alerts.length, "alerta", "alertas") : conds ? E.plural(conds, "condição", "condições") : "Tudo em ordem",
    alerts.length ? "bad" : conds ? "warn" : ""));

  var c = app.combat, cur = c && c.phase === "running" ? I.current(c) : null;
  cards.push(homeCard("combat", ICON.cards, "Iniciativa",
    !c || (!c.entries.length && c.phase === "setup") ? "Sem combate" : c.phase === "setup" ? "Montando · " + E.plural(c.entries.length, "combatente", "combatentes") : "Rodada " + c.round,
    cur ? "Vez de " + label(cur) : c && c.phase !== "setup" ? "Escolhendo cartas" : "Comprar cartas",
    c && c.phase !== "setup" ? "live" : ""));

  var j = app.journey;
  cards.push(homeCard("journey", ICON.map, "Jornada",
    j ? "Dia " + j.day + " · " + JY.QUARTERS[j.q] : "Quartos de Dia e atividades",
    j ? JY.season(j.season).name + " · " + JY.terrain(j.terrain).name + (JY.isLight(j.season, j.q) ? "" : " · escuro") : "Comer, beber e dormir",
    j ? "live" : ""));

  var rq = app.requests[0];
  cards.push(homeCard("rolls", ICON.die, "Pedir rolagem",
    rq ? requestTitle(rq) : "Peça a um ou mais jogadores",
    rq ? requestProgress(rq) : "Perícia, atributo ou recurso",
    rq && requestPending(rq) ? "live" : ""));

  var foes = c ? c.entries.filter(function (e) { return e.mon; }) : [];
  cards.push(homeCard("bestiary", ICON.claw, "Bestiário",
    E.plural(B.LIST.filter(function (m) { return m.kind === "monstro"; }).length, "monstro", "monstros") + " e animais",
    foes.length ? E.plural(foes.length, "criatura", "criaturas") + " no combate" : "Ataques e Força na Iniciativa",
    foes.length ? "live" : ""));

  cards.push(homeCard("shield", ICON.shield, "Escudo do Mestre",
    "Combate, perigos, social e jornada",
    "Tabelas de infortúnio para rolar",
    ""));

  var g = app.grant, sent = g ? Object.keys(g.sent).length : 0;
  cards.push(homeCard("session", ICON.star, "Fim de sessão",
    sent ? g.xp + " XP para " + E.plural(sent, "personagem", "personagens") : "Conceder XP",
    sent ? Object.keys(g.ok).length + " de " + sent + " receberam" : "Reputação e Orgulho",
    ""));

  html += '<nav class="home-cards" aria-label="Ferramentas do Mestre">' + cards.join("") + "</nav>";

  html += '<button class="card home-sheet" data-action="mode" data-mode="sheet">' +
    '<span class="avatar sm" aria-hidden="true">' + esc(initials(app.sheet.name)) + "</span>" +
    '<span class="grow"><strong>Minha ficha</strong><span class="small muted">' + esc(app.sheet.name || "Personagem do Mestre, se quiser jogar com um") + "</span></span>" +
    ICON.chevron + "</button>";
  return html;
}

function homeCard(mode, icon, title, line1, line2, tone) {
  return '<button class="card home-card' + (tone ? " " + tone : "") + '" data-action="mode" data-mode="' + mode + '">' +
    '<span class="home-icon">' + icon + "</span>" +
    '<strong class="home-title">' + esc(title) + "</strong>" +
    '<span class="small">' + esc(line1) + "</span>" +
    '<span class="small muted home-line2">' + (tone === "live" ? '<span class="dot-live"></span>' : "") + esc(line2) + "</span>" +
  "</button>";
}

/* ------------------------------------------------------------------ */
/* Pedir rolagem (Mestre)                                             */
/* ------------------------------------------------------------------ */

function rqName(k, c) {
  if (k === "s") return skillName(c);
  if (k === "a") return attrByKey(c).name;
  var r = R.kind(c);
  return r ? r.name : c;
}

function requestTitle(rq) {
  return rqName(rq.k, rq.c) + (rq.k !== "r" && rq.m ? " " + (rq.m > 0 ? "+" : "−") + Math.abs(rq.m) : "");
}

function requestPending(rq) {
  return Object.keys(rq.who).some(function (id) { return rq.who[id].st === "wait"; });
}

function requestProgress(rq) {
  var ids = Object.keys(rq.who);
  var done = ids.filter(function (id) { return rq.who[id].st !== "wait"; }).length;
  return done === ids.length ? "Todos responderam" : done + " de " + ids.length + " rolaram";
}

function renderRequests() {
  if (!app.rqForm) app.rqForm = { k: "s", c: "exploracao", m: 0, n: "", skip: {} };
  var f = app.rqForm, live = onlineSheets();
  var html = '<header class="row between"><div><p class="eyebrow">Painel do Mestre</p><h1 class="title">Pedir rolagem</h1></div></header>';

  html += '<section class="card stack-sm">' +
    '<div class="seg" role="group" aria-label="Tipo">' + RQ_KINDS.map(function (k) {
      return '<button data-action="rqKind" data-k="' + k[0] + '" aria-pressed="' + (f.k === k[0]) + '">' + k[1] + "</button>";
    }).join("") + "</div>";

  var opts;
  if (f.k === "s") {
    opts = ATTRS.map(function (a) {
      return '<optgroup label="' + a.name + '">' + a.skills.map(function (sk) {
        return '<option value="' + sk[0] + '"' + (sk[0] === f.c ? " selected" : "") + ">" + sk[1] + "</option>";
      }).join("") + "</optgroup>";
    }).join("");
  } else if (f.k === "a") {
    opts = ATTRS.map(function (a) { return '<option value="' + a.key + '"' + (a.key === f.c ? " selected" : "") + ">" + a.name + "</option>"; }).join("");
  } else {
    opts = R.KINDS.map(function (k) { return '<option value="' + k.key + '"' + (k.key === f.c ? " selected" : "") + ">" + k.name + "</option>"; }).join("");
  }
  html += '<label class="sr-only" for="f-rq-c">O que rolar</label><select id="f-rq-c" class="field" data-rq="c">' + opts + "</select>";

  if (f.k !== "r") {
    html += '<div class="row between"><span>Modificador</span><div class="stepper" style="gap:8px">' +
      '<button class="btn-step" data-action="rqMod" data-delta="-1" aria-label="Penalidade">−</button>' +
      '<span class="stat-num" style="font-size:22px;min-width:34px;text-align:center">' + (f.m > 0 ? "+" : f.m < 0 ? "−" : "") + Math.abs(f.m) + "</span>" +
      '<button class="btn-step" data-action="rqMod" data-delta="1" aria-label="Bônus">+</button></div></div>';
  } else {
    html += '<p class="small muted" style="margin:0">Cada ficha rola o próprio Dado de Recurso, como no botão Usar: com 1 ou 2, ele desce um passo.</p>';
  }
  html += '<label class="sr-only" for="f-rq-n">Motivo</label><input id="f-rq-n" class="field" data-rq="n" maxlength="80" placeholder="Motivo (opcional), ex.: atravessando o rio" value="' + esc(f.n) + '">';
  html += "</section>";

  if (!live.length) {
    html += '<p class="muted" style="margin:0">Nenhuma ficha de jogador aberta na mesa agora. Elas aparecem quando os jogadores abrem o Symbiote no mesmo tabuleiro.</p>';
  } else {
    html += '<section class="list" aria-label="Quem rola">' + live.map(function (id) {
      var sh = app.table.sheets[id];
      return '<div class="list-row"><label class="check grow"><input type="checkbox" data-rq-who="' + esc(id) + '"' + (f.skip[id] ? "" : " checked") + "> " +
        "<span><strong>" + esc(sh.name) + "</strong>" + (sh.player ? ' <span class="small muted">' + esc(sh.player) + "</span>" : "") + "</span></label></div>";
    }).join("") + "</section>";
  }
  var chosen = live.filter(function (id) { return !f.skip[id]; });
  html += '<div class="actions"><button class="btn-primary" data-action="rqSend"' + (chosen.length ? "" : " disabled") + ">" + ICON.die +
    "Pedir " + esc(requestTitle(f)) + (chosen.length ? " · " + E.plural(chosen.length, "jogador", "jogadores") : "") + "</button></div>";

  if (app.requests.length) {
    html += '<div class="row between"><h2 class="eyebrow" style="margin:0">Pedidos desta sessão</h2>' +
      '<button class="link-btn inline" data-action="rqClear">Limpar</button></div>';
    html += app.requests.map(renderRequestCard).join("");
  }
  return html;
}

function renderRequestCard(rq) {
  var html = '<section class="card rq-card"><div class="row between"><strong>' + esc(requestTitle(rq)) + "</strong>" +
    '<span class="small muted">' + ago(rq.at) + "</span></div>" +
    (rq.n ? '<div class="small muted">' + esc(rq.n) + "</div>" : "");
  html += Object.keys(rq.who).map(function (id) {
    var w = rq.who[id], txt, cls = "muted";
    if (w.st === "wait") txt = "aguardando…";
    else if (w.st === "skip") txt = "ignorou";
    else if (w.st === "empty") { txt = "já tinha acabado"; cls = "bad"; }
    else if (rq.k === "r") {
      txt = "D" + w.b + ": " + w.v + " · " + (w.a === w.b ? "continua D" + w.b : w.a ? "desceu para D" + w.a : "acabou");
      cls = w.a === w.b ? "ok" : "bad";
    } else {
      txt = E.plural(w.s, "sucesso", "sucessos") + (w.p ? " · forçada" : "");
      cls = w.s ? "ok" : "bad";
    }
    return '<div class="rq-row"><span>' + esc(w.name) + '</span><span class="rq-res ' + cls + '">' + esc(txt) + "</span></div>";
  }).join("");
  return html + "</section>";
}

function sendRequest() {
  var f = app.rqForm;
  var ids = onlineSheets().filter(function (id) { return !f.skip[id]; });
  var rq = makeRequest(f.k, f.c, f.k === "r" ? 0 : f.m, f.n, ids);
  if (rq) toast("Pedido enviado: " + requestTitle(rq) + ".");
}

/* Envia um pedido para as fichas `ids` e guarda na lista do Mestre. */
function makeRequest(k, c, m, note, ids) {
  ids = (ids || []).filter(function (id) { return app.table.sheets[id]; });
  if (!ids.length) return null;
  var rq = { id: uid().slice(0, 6), k: k, c: c, m: m | 0, n: String(note || "").trim().slice(0, 80), at: Date.now(), who: {} };
  ids.forEach(function (id) {
    rq.who[id] = { name: app.table.sheets[id].name, st: "wait" };
    syncSend({ t: "rq", id: rq.id, k: rq.k, c: rq.c, m: rq.m, n: rq.n }, id);
  });
  app.requests.unshift(rq);
  app.requests = app.requests.slice(0, MAX_REQUESTS);
  return rq;
}

/* Mestre recebe o resultado de uma ficha. */
function receiveRequestResult(fromId, msg) {
  var rq = app.requests.filter(function (r) { return r.id === msg.id; })[0];
  if (!rq || !rq.who[fromId]) return;
  var w = rq.who[fromId];
  if (msg.x) w.st = msg.x === 2 ? "empty" : "skip";
  else if (rq.k === "r") { w.st = "done"; w.v = msg.v; w.b = msg.b; w.a = msg.a; }
  else { w.st = "done"; w.s = msg.s | 0; w.p = !!msg.p; }
  if (rq.k === "r" && typeof journeyMeal === "function") journeyMeal(fromId, rq.c, w.st === "done");
  render();
}

/* ------------------------------------------------------------------ */
/* Pedidos na ficha do jogador                                        */
/* ------------------------------------------------------------------ */

function receiveRequest(msg) {
  var valid = msg.k === "s" ? ATTRS.some(function (a) { return a.skills.some(function (s) { return s[0] === msg.c; }); })
    : msg.k === "a" ? !!attrByKey(msg.c)
    : msg.k === "r" ? !!R.kind(msg.c) : false;
  if (!valid) return;
  app.table.requests = app.table.requests.filter(function (r) { return r.id !== msg.id; });
  app.table.requests.push({ id: msg.id, k: msg.k, c: msg.c, m: msg.m | 0, n: String(msg.n || "").slice(0, 80) });
  render();
  toast("O Mestre pediu uma rolagem de " + requestTitle(msg) + ".");
}

function renderPlayerRequests() {
  var list = app.table.requests;
  if (!list.length) return "";
  return '<section class="banner table" aria-label="Pedidos do Mestre">' + list.map(function (rq) {
    var empty = rq.k === "r" && !app.sheet.resources[rq.c];
    return '<div class="rq-ask"><div class="banner-title">' + ICON.die + "<span>O Mestre pede: " + esc(requestTitle(rq)) + "</span></div>" +
      (rq.n ? '<div class="banner-item small">' + esc(rq.n) + "</div>" : "") +
      (empty ? '<div class="banner-item small">Você não tem mais ' + esc(R.kind(rq.c).name.toLowerCase()) + ".</div>" : "") +
      '<div class="row" style="gap:8px">' +
        (empty ? "" : '<button class="btn-add" data-action="rqRoll" data-id="' + esc(rq.id) + '">' + ICON.die + "Rolar</button>") +
        '<button class="btn-ghost slim" data-action="rqSkip" data-id="' + esc(rq.id) + '">' + (empty ? "Avisar o Mestre" : "Ignorar") + "</button>" +
      "</div></div>";
  }).join("") + "</section>";
}

function takeRequest(id) {
  var rq = app.table.requests.filter(function (r) { return r.id === id; })[0];
  app.table.requests = app.table.requests.filter(function (r) { return r.id !== id; });
  return rq;
}

function attrOfSkill(key) {
  return ATTRS.filter(function (a) { return a.skills.some(function (s) { return s[0] === key; }); })[0];
}

/* Chamado por postToChat (app.js) a cada resultado de rolagem. */
function reportRollToGm(r) {
  if (!r.requestId) return;
  syncSend({ t: "rr", id: r.requestId, s: r.result.successes, p: r.pushed ? 1 : 0 }, "gms");
}

/* Chamado por applyResource (app.js). */
function reportResourceToGm(key, u) {
  var id = app.resRequest[key];
  if (!id) return;
  delete app.resRequest[key];
  syncSend({ t: "rr", id: id, v: u.value, b: u.before, a: u.after }, "gms");
}

Object.assign(actions, {
  rqKind: function (el) {
    var f = app.rqForm;
    f.k = el.dataset.k;
    f.c = f.k === "s" ? "exploracao" : f.k === "a" ? "forca" : "comida";
  },
  rqMod: function (el) { app.rqForm.m = clamp(app.rqForm.m + (+el.dataset.delta), -5, 5); },
  rqSend: function () { sendRequest(); },
  rqClear: function () { app.requests = []; },
  rqRoll: function (el) {
    var rq = takeRequest(el.dataset.id);
    if (!rq) return;
    if (rq.k === "r") {
      app.resRequest[rq.c] = rq.id;
      useResource(rq.c);
      return;
    }
    var attr = rq.k === "s" ? attrOfSkill(rq.c).key : rq.c;
    var prev = app.lastGearId && gearById(app.lastGearId) ? app.lastGearId : null;
    app.roll = { attrKey: attr, skillKey: rq.k === "s" ? rq.c : null, gearId: rq.k === "s" ? prev : null, modifier: rq.m, artifact: 0, phase: "setup", requestId: rq.id };
    app.view = "roll";
    window.scrollTo(0, 0);
  },
  rqSkip: function (el) {
    var rq = takeRequest(el.dataset.id);
    if (rq) syncSend({ t: "rr", id: rq.id, x: rq.k === "r" && !app.sheet.resources[rq.c] ? 2 : 1 }, "gms");
  }
});

document.addEventListener("change", function (ev) {
  var el = ev.target;
  if (el.dataset && el.dataset.rqWho && app.rqForm) {
    app.rqForm.skip[el.dataset.rqWho] = !el.checked;
    render();
  } else if (el.dataset && el.dataset.rq === "c" && app.rqForm) {
    app.rqForm.c = el.value;
    render();
  }
});

document.addEventListener("input", function (ev) {
  var el = ev.target;
  if (el.dataset && el.dataset.rq === "n" && app.rqForm) app.rqForm.n = el.value;
});
