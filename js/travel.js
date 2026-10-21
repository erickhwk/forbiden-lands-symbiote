/*
 * Jornada: Quartos de Dia, atividades do grupo e necessidades do dia.
 *
 * A regra mora em journey.js (FLJourney). Este arquivo usa app.js, combat.js
 * e gm.js (app, render, save, toast, esc, ICON, actions, syncSend,
 * makeRequest, onlineSheets…).
 *
 * Sincronização:
 *   mestre -> todos  { t: "jn", d: dia, q: Quarto, s: estação, l: 1 se claro, a: { fim do id: atividade } }
 *   mestre -> ficha  { t: "cd", c: condição }   marca uma condição na ficha (Faminto, Desidratado, Insone)
 *
 * app.journey (salvo junto da ficha do Mestre):
 *   day, q (0-3), season, terrain, walked (Quartos caminhados hoje),
 *   acts { clientId: atividade }, needs { clientId: { ate, drank, slept } }, review
 */
"use strict";

var JY = window.FLJourney;

var NEED_COND = { ate: ["faminto", "Faminto"], drank: ["sedento", "Desidratado"], slept: ["exausto", "Insone"] };

function newJourney() {
  return { day: 1, q: 0, season: "primavera", terrain: "planicies", walked: 0, acts: {}, needs: {}, review: false };
}

function jy() {
  if (!app.journey) app.journey = newJourney();
  return app.journey;
}

function needsOf(id) {
  var j = jy();
  if (!j.needs[id]) j.needs[id] = { ate: false, drank: false, slept: false };
  return j.needs[id];
}

function signed(n) { return n > 0 ? "+" + n : n < 0 ? "−" + Math.abs(n) : "0"; }

function jName(id) { return app.table.sheets[id] ? app.table.sheets[id].name : "?"; }

/* ------------------------------------------------------------------ */
/* Tela do Mestre                                                     */
/* ------------------------------------------------------------------ */

function renderJourney() {
  var j = jy(), live = onlineSheets();
  if (j.review) return renderDayEnd();
  var light = JY.isLight(j.season, j.q), t = JY.terrain(j.terrain), mv = JY.moves(j.terrain);

  var html = '<header class="row between"><div><p class="eyebrow">Painel do Mestre</p><h1 class="title">Jornada</h1></div>' +
    (app.jyResetAsk
      ? '<span class="row" style="gap:6px"><button class="btn-ghost slim danger-text" data-action="jyReset">Confirmar</button>' +
        '<button class="btn-ghost slim" data-action="jyResetNo">Cancelar</button></span>'
      : '<button class="btn-ghost slim" data-action="jyResetAsk">Nova jornada</button>') + "</header>";

  html += '<section class="card stack-sm">' +
    '<div class="row between"><div class="jy-now"><span class="stat-num">Dia ' + j.day + "</span>" +
      '<span class="jy-quarter">' + JY.QUARTERS[j.q] + "</span></div>" +
      '<span class="chip-s' + (light ? "" : " warn") + '">' + (light ? "Claro" : "Escuro") + "</span></div>" +
    '<div class="jy-quarters" aria-hidden="true">' + JY.QUARTERS.map(function (q, i) {
      return '<span class="' + (i < j.q ? "past" : i === j.q ? "on" : "") + (JY.isLight(j.season, i) ? "" : " dark") + '">' + q + "</span>";
    }).join("") + "</div>" +
    '<div class="seg" role="group" aria-label="Estação">' + JY.SEASONS.map(function (s) {
      return '<button data-action="jySeason" data-s="' + s.key + '" aria-pressed="' + (j.season === s.key) + '">' + s.name + "</button>";
    }).join("") + "</div>" +
    '<label class="sr-only" for="f-jy-t">Terreno</label><select id="f-jy-t" class="field" data-jy="terrain">' + JY.TERRAINS.map(function (x) {
      return '<option value="' + x.key + '"' + (x.key === j.terrain ? " selected" : "") + ">" + x.name + "</option>";
    }).join("") + "</select>" +
    '<div class="small muted">' + JY.MOVE_LABEL[t.move] +
      (mv.foot ? " · " + E.plural(mv.foot, "hexágono", "hexágonos") + " por Quarto a pé" + (mv.mounted > mv.foot ? ", " + mv.mounted + " montado" : "") : "") +
      " · Coletar " + (t.forage == null ? "—" : signed(t.forage + JY.season(j.season).forage)) + " · Caçar " + (t.hunt == null ? "—" : signed(t.hunt)) + "</div>" +
  "</section>";

  var walkers = live.filter(function (id) { var a = JY.activity(j.acts[id]); return a && a.walk; });
  if (!light && walkers.length) {
    html += '<div class="notice warn">' + ICON.warn + "<span>Escuro: Desbravar rola com −2, e quem caminha sem enxergar no escuro rola Patrulha; se falhar, cai e sofre 1 de dano em Força.</span></div>" +
      '<button class="btn-ghost slim" data-action="jyAsk" data-what="escuro">Pedir Patrulha a quem caminha</button>';
  }
  var fm = JY.forcedMarch(j.walked);
  if (fm && walkers.length) {
    html += '<div class="notice error">' + ICON.warn + "<span>O grupo já caminhou " + j.walked + " Quartos hoje. Caminhar de novo é marcha forçada: Resiliência" +
      (fm.mod ? " " + signed(fm.mod) : "") + "; quem falhar sofre 1 de dano em Agilidade e precisa Descansar ou Dormir." +
      (fm.sleepless ? " O quarto Quarto caminhando deixa todos Insones." : "") + "</span></div>" +
      '<button class="btn-ghost slim" data-action="jyAsk" data-what="marcha">Pedir Resiliência' + (fm.mod ? " " + signed(fm.mod) : "") + " a quem caminha</button>";
  } else if (j.walked) {
    html += '<p class="small muted" style="margin:0">Caminharam ' + E.plural(j.walked, "Quarto", "Quartos") + " hoje. Dois por dia sem problema.</p>";
  }

  html += '<h2 class="eyebrow" style="margin:4px 0 0">O que cada um faz neste Quarto</h2>';
  if (!live.length) {
    html += '<p class="muted" style="margin:0">Nenhuma ficha de jogador aberta na mesa agora.</p>';
  } else {
    html += '<section class="list" aria-label="Atividades">' + live.map(function (id) {
      var a = JY.activity(j.acts[id]);
      return '<div class="list-row jy-row"><div class="grow"><strong>' + esc(jName(id)) + "</strong>" +
        (a && a.hint ? '<div class="small muted">' + esc(a.hint) + "</div>" : "") + "</div>" +
        '<select class="field jy-act" data-jy-act="' + esc(id) + '" aria-label="Atividade de ' + esc(jName(id)) + '"><option value="">—</option>' +
        JY.ACTIVITIES.map(function (x) { return '<option value="' + x.key + '"' + (j.acts[id] === x.key ? " selected" : "") + ">" + x.name + "</option>"; }).join("") +
        "</select></div>";
    }).join("") + "</section>";
    var acts = {};
    live.forEach(function (id) { acts[id] = j.acts[id] || ""; });
    JY.check(acts).forEach(function (w) { html += '<div class="notice">' + ICON.warn + "<span>" + esc(w) + "</span></div>"; });
    var asks = activityAsks(live);
    if (asks.length) {
      html += '<div class="jy-asks">' + asks.map(function (a) {
        return '<button class="btn-add slim" data-action="jyAsk" data-what="act" data-act="' + a.key + '"' + (a.mod == null ? " disabled" : "") + ">" + ICON.die +
          esc(a.label) + "</button>";
      }).join("") + "</div>";
    }
  }

  html += '<h2 class="eyebrow" style="margin:4px 0 0">Necessidades do dia ' + j.day + "</h2>";
  if (live.length) {
    html += '<section class="list" aria-label="Necessidades">' + live.map(function (id) {
      var n = needsOf(id);
      return '<div class="list-row"><strong class="grow">' + esc(jName(id)) + "</strong>" +
        [["ate", "Comeu"], ["drank", "Bebeu"], ["slept", "Dormiu"]].map(function (k) {
          return '<button class="chip-btn jy-need' + (n[k[0]] ? " on" : "") + '" data-action="jyNeed" data-id="' + esc(id) + '" data-k="' + k[0] + '" aria-pressed="' + !!n[k[0]] + '">' + k[1] + "</button>";
        }).join("") + "</div>";
    }).join("") + "</section>" +
    '<button class="btn-ghost slim" data-action="jyAsk" data-what="refeicao">Pedir Comida e Água a todos</button>' +
    '<p class="small muted" style="margin:0">Quem consome Comida ou Água pelo pedido fica marcado sozinho. Dormir é marcado ao passar um Quarto em que a pessoa Dorme.</p>';
  }

  var next = j.q < 3 ? JY.QUARTERS[j.q + 1] : null;
  html += '<div class="actions"><button class="btn-primary" data-action="jyNext">' + ICON.chevron +
    (next ? "Passar para " + next : "Encerrar o dia " + j.day) + "</button></div>";
  return html;
}

/* Rolagens que as atividades escolhidas pedem. */
function activityAsks(live) {
  var j = jy(), byAct = {};
  live.forEach(function (id) {
    var a = JY.activity(j.acts[id]);
    if (a && a.skill) (byAct[a.key] = byAct[a.key] || []).push(id);
  });
  return Object.keys(byAct).map(function (key) {
    var a = JY.activity(key), mod = JY.activityMod(key, j.terrain, j.season, j.q);
    var names = byAct[key].map(jName).join(", ");
    return {
      key: key, ids: byAct[key], mod: mod, skill: a.skill,
      label: a.name.replace("Caminhar e ", "") + " · " + skillName(a.skill) + (mod ? " " + signed(mod) : "") + " (" + names + ")" + (mod == null ? " · não dá neste terreno" : "")
    };
  });
}

function renderDayEnd() {
  var j = jy(), live = onlineSheets(), missing = [];
  live.forEach(function (id) {
    var n = needsOf(id);
    Object.keys(NEED_COND).forEach(function (k) { if (!n[k]) missing.push({ id: id, k: k }); });
  });
  var html = '<header><p class="eyebrow">Jornada</p><h1 class="title">Fim do dia ' + j.day + "</h1></header>";
  if (!missing.length) {
    html += '<p style="margin:0">Todos comeram, beberam e dormiram. Nenhuma condição nova.</p>';
  } else {
    html += '<p class="small muted" style="margin:0">Pelo livro, um dia sem comer deixa Faminto, sem beber deixa Desidratado, e sem dormir ao menos um Quarto deixa Insone.</p>' +
      '<section class="list">' + missing.map(function (m) {
        var verb = m.k === "ate" ? "não comeu" : m.k === "drank" ? "não bebeu" : "não dormiu";
        return '<div class="list-row"><span class="grow"><strong>' + esc(jName(m.id)) + "</strong> " + verb + '</span><span class="chip-s warn">' + NEED_COND[m.k][1] + "</span></div>";
      }).join("") + "</section>";
  }
  html += '<div class="actions">' +
    (missing.length ? '<button class="btn-primary" data-action="jyNewDay" data-apply="1">Marcar condições e começar o dia ' + (j.day + 1) + "</button>" +
      '<button class="btn-ghost" data-action="jyNewDay">Começar o dia ' + (j.day + 1) + " sem marcar</button>"
      : '<button class="btn-primary" data-action="jyNewDay">Começar o dia ' + (j.day + 1) + "</button>") +
    '<button class="link-btn" data-action="jyBack">Voltar à Noite</button></div>';
  return html;
}

/* ------------------------------------------------------------------ */
/* Lógica                                                             */
/* ------------------------------------------------------------------ */

function journeyChanged() {
  save();
  broadcastJourney();
}

function broadcastJourney() {
  if (!app.ts || !app.canGM || !app.journey) return;
  var j = app.journey, a = {};
  onlineSheets().forEach(function (id) { if (j.acts[id]) a[id.slice(-6)] = j.acts[id]; });
  syncSend({ t: "jn", d: j.day, q: j.q, s: j.season, l: JY.isLight(j.season, j.q) ? 1 : 0, a: a });
}

function nextQuarter() {
  var j = jy(), live = onlineSheets();
  var acts = {};
  live.forEach(function (id) { acts[id] = j.acts[id]; });
  if (JY.anyWalking(acts)) j.walked++;
  live.forEach(function (id) {
    var a = JY.activity(j.acts[id]);
    if (a && a.sleep) needsOf(id).slept = true;
  });
  // O quarto Quarto caminhando no mesmo dia tira o sono de todos.
  if (j.walked >= 4) live.forEach(function (id) { needsOf(id).slept = false; });
  if (j.q < 3) { j.q++; journeyChanged(); chatQuarter(); return; }
  j.review = true;
  save();
}

function newDay(apply) {
  var j = jy();
  if (apply) {
    onlineSheets().forEach(function (id) {
      var n = needsOf(id);
      Object.keys(NEED_COND).forEach(function (k) {
        if (!n[k]) syncSend({ t: "cd", c: NEED_COND[k][0] }, id);
      });
    });
  }
  j.day++; j.q = 0; j.walked = 0; j.needs = {}; j.review = false;
  journeyChanged();
  chatQuarter();
}

function chatQuarter() {
  var j = jy();
  chat("<b>Jornada</b> · Dia " + j.day + " · " + JY.QUARTERS[j.q] + " · " + JY.season(j.season).name +
    (JY.isLight(j.season, j.q) ? "" : " · <color=#E8B84A>escuro</color>"));
}

/* Chamado por receiveRequestResult (gm.js) quando chega o resultado de um recurso. */
function journeyMeal(id, key, consumed) {
  if (!app.journey || !consumed) return;
  if (key === "comida") needsOf(id).ate = true;
  if (key === "agua") needsOf(id).drank = true;
  save();
}

function askJourney(el) {
  var j = jy(), live = onlineSheets(), what = el.dataset.what;
  var walkers = live.filter(function (id) { var a = JY.activity(j.acts[id]); return a && a.walk; });
  var t = JY.terrain(j.terrain).name, rq;
  if (what === "escuro") rq = makeRequest("s", "exploracao", 0, "Caminhando no escuro · " + t, walkers);
  else if (what === "marcha") rq = makeRequest("s", "resistencia", JY.forcedMarch(j.walked).mod, "Marcha forçada", walkers);
  else if (what === "refeicao") {
    makeRequest("r", "comida", 0, "Refeição do dia " + j.day, live);
    rq = makeRequest("r", "agua", 0, "Água do dia " + j.day, live);
  } else if (what === "act") {
    var a = activityAsks(live).filter(function (x) { return x.key === el.dataset.act; })[0];
    if (a && a.mod != null) rq = makeRequest("s", a.skill, a.mod, JY.activity(a.key).name.replace("Caminhar e ", "") + " · " + t, a.ids);
  }
  toast(rq ? "Pedido enviado." : "Ninguém para receber o pedido.");
}

/* ------------------------------------------------------------------ */
/* Visão do jogador                                                   */
/* ------------------------------------------------------------------ */

function renderPlayerJourney() {
  var st = app.table.journey;
  if (!st || (app.canGM && app.mode !== "sheet")) return "";
  var mine = app.clientId ? st.a[app.clientId.slice(-6)] : null, act = mine ? JY.activity(mine) : null;
  return '<section class="card jy-strip" aria-label="Jornada">' +
    '<div class="row between"><strong>Dia ' + st.d + " · " + JY.QUARTERS[st.q] + "</strong>" +
    '<span class="small ' + (st.l ? "muted" : "warn-text") + '">' + JY.season(st.s).name + " · " + (st.l ? "claro" : "escuro") + "</span></div>" +
    (act ? '<div class="small">Sua atividade: <strong>' + esc(act.name) + "</strong>" + (act.hint ? ' <span class="muted">· ' + esc(act.hint) + "</span>" : "") + "</div>" : "") +
  "</section>";
}

function receiveJourney(msg) {
  if (typeof msg.d !== "number" || !(msg.q >= 0 && msg.q <= 3)) return;
  app.table.journey = { d: msg.d, q: msg.q, s: msg.s, l: msg.l, a: msg.a || {} };
  render();
}

function receiveCondition(msg) {
  var name = { faminto: "Faminto", sedento: "Desidratado", exausto: "Insone" }[msg.c];
  if (!name || app.sheet.conditions[msg.c]) return;
  app.sheet.conditions[msg.c] = true;
  save();
  render();
  toast("O Mestre marcou: " + name + ".");
}

Object.assign(actions, {
  jySeason: function (el) { jy().season = el.dataset.s; journeyChanged(); },
  jyNext: function () { nextQuarter(); window.scrollTo(0, 0); },
  jyNewDay: function (el) { newDay(el.dataset.apply === "1"); window.scrollTo(0, 0); },
  jyBack: function () { jy().review = false; },
  jyNeed: function (el) { var n = needsOf(el.dataset.id); n[el.dataset.k] = !n[el.dataset.k]; save(); },
  jyAsk: function (el) { askJourney(el); },
  jyResetAsk: function () { app.jyResetAsk = true; },
  jyResetNo: function () { app.jyResetAsk = false; },
  jyReset: function () {
    app.jyResetAsk = false;
    var old = jy();
    app.journey = newJourney();
    app.journey.season = old.season;
    app.journey.terrain = old.terrain;
    journeyChanged();
    toast("Jornada nova: dia 1, Manhã.");
  }
});

document.addEventListener("change", function (ev) {
  var el = ev.target;
  if (!el.dataset) return;
  if (el.dataset.jy === "terrain") { jy().terrain = el.value; journeyChanged(); render(); }
  else if (el.dataset.jyAct) { jy().acts[el.dataset.jyAct] = el.value || null; journeyChanged(); render(); }
});
