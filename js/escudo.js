/*
 * Escudo do Mestre: consulta rápida e tabelas para rolar na bandeja.
 *
 * Os dados moram em shield.js (FLShield). As tabelas de infortúnio mágico
 * (magic.js) e de ferimentos graves (injuries.js) entram aqui também, para
 * o Mestre rolar para os PNJs. Usa app.js e gm.js (app, render, save, toast,
 * esc, ICON, actions, makeRequest, onlineSheets…).
 */
"use strict";

var SH = window.FLShield;

var SHIELD_TABS = [["combate", "Combate"], ["distancia", "Zonas"], ["dano", "Dano e perigos"], ["social", "Social"], ["jornada", "Jornada"], ["tabelas", "Tabelas"]];

app.shield = { tab: "combate", q: "", last: {}, rolling: null };

/* Todas as tabelas roláveis: as do escudo, infortúnio mágico e ferimentos graves. */
function shieldTables() {
  var out = SH.TABLES.slice();
  out.push({ key: "magia", title: "Infortúnio mágico", die: "d66", rows: M.MISHAPS.map(function (m) { return [m[0], m[1], "", m[2]]; }) });
  Object.keys(J.TABLES).forEach(function (k) {
    if (!J.LABELS[k] || k === "outros") return;
    out.push({
      key: "fer-" + k, title: "Ferimento grave · " + J.LABELS[k], die: "d66", npc: true,
      rows: J.TABLES[k].map(function (r) {
        var tail = (r[3] ? " Letal: Cura em até " + r[4] + "." : "") + (r[6] === "perm" ? " Permanente." : r[6] ? " Cura em " + r[6] + " dias." : "");
        return [r[0], r[1], r[2], r[5] + tail];
      })
    });
  });
  return out;
}

function shieldTable(key) { return shieldTables().filter(function (t) { return t.key === key; })[0] || null; }

/* ------------------------------------------------------------------ */
/* Tela                                                               */
/* ------------------------------------------------------------------ */

function renderShield() {
  var st = app.shield;
  var html = '<header><p class="eyebrow">Painel do Mestre</p><h1 class="title">Escudo do Mestre</h1></header>' +
    '<label class="sr-only" for="f-shield-q">Buscar</label>' +
    '<input id="f-shield-q" class="field" type="search" data-shield="q" placeholder="Buscar regra (ex.: esquivar, queda, veneno)" value="' + esc(st.q) + '">';

  if (st.q.trim()) {
    var found = SH.search(st.q);
    html += '<p class="small muted" style="margin:0">' + E.plural(found.length, "resultado", "resultados") + "</p>";
    return html + found.map(function (f) { return renderBlock(f.block, f.section.title); }).join("");
  }

  html += '<nav class="shield-tabs" aria-label="Seções do escudo">' + SHIELD_TABS.map(function (t) {
    return '<button data-action="shieldTab" data-tab="' + t[0] + '" aria-pressed="' + (st.tab === t[0]) + '">' + t[1] + "</button>";
  }).join("") + "</nav>";

  if (st.tab === "tabelas") return html + renderRollTables();
  var sec = SH.SECTIONS.filter(function (s) { return s.key === st.tab; })[0];
  return html + sec.blocks.map(function (b) { return renderBlock(b); }).join("");
}

function renderBlock(b, sectionTitle) {
  var html = '<section class="card shield-block"><h2 class="shield-h">' + esc(b.title) +
    (sectionTitle ? ' <span class="small muted">· ' + esc(sectionTitle) + "</span>" : "") + "</h2>";
  if (b.table) {
    html += '<table class="ref-table"><thead><tr>' + b.table[0].map(function (c) { return "<th>" + esc(c) + "</th>"; }).join("") + "</tr></thead><tbody>" +
      b.table.slice(1).map(function (r) { return "<tr>" + r.map(function (c) { return "<td>" + esc(c) + "</td>"; }).join("") + "</tr>"; }).join("") +
      "</tbody></table>";
  }
  if (b.notes) html += '<ul class="shield-notes">' + b.notes.map(function (n) { return "<li>" + esc(n) + "</li>"; }).join("") + "</ul>";
  return html + "</section>";
}

function renderRollTables() {
  var st = app.shield;
  var html = '<p class="small muted" style="margin:0">Os dados vão para a sua bandeja, sem aparecer no chat. Depois você decide se mostra o resultado para a mesa.</p>';
  return html + shieldTables().map(function (t) {
    var last = st.last[t.key], busy = st.rolling === t.key;
    var out = '<section class="card shield-block" id="tb-' + t.key + '"><div class="row between"><h2 class="shield-h">' + esc(t.title) + "</h2>" +
      '<span class="row" style="gap:6px">' + (t.secret ? '<span class="chip-s warn">em segredo</span>' : "") + (t.npc ? '<span class="chip-s">para PNJs</span>' : "") +
      '<span class="chip-s">' + t.die.toUpperCase() + "</span></span></div>";
    if (last) {
      out += '<div class="shield-result"><div class="row between"><strong>' + (last.name ? esc(last.name) : "Resultado") + '</strong><span class="stat-num sm">' + last.code + "</span></div>" +
        '<div class="small">' + esc(last.effect) + "</div>" +
        '<div class="row" style="gap:8px;flex-wrap:wrap">' +
          (last.posted ? '<span class="small muted">' + ICON.check + " no chat</span>" : '<button class="btn-ghost slim" data-action="shieldChat" data-key="' + t.key + '">Mostrar no chat</button>') +
          (last.ask ? '<button class="btn-add slim" data-action="shieldAsk" data-key="' + t.key + '">' + ICON.die + "Pedir " + esc(skillName(last.ask.c)) + " a todos</button>" : "") +
        "</div></div>";
    }
    out += '<div class="row" style="gap:8px">' +
      (busy ? '<div class="notice" role="status">' + ICON.tray + "<span>Na sua bandeja. Jogue no tabuleiro.</span></div>" +
        '<button class="btn-ghost slim" data-action="shieldCancel">Cancelar</button>'
        : '<button class="btn-add slim" data-action="shieldRoll" data-key="' + t.key + '">' + ICON.die + "Rolar " + t.die.toUpperCase() + "</button>" +
          (app.ts ? '<button class="link-btn inline" data-action="shieldRoll" data-key="' + t.key + '" data-local="1">rolar aqui</button>' : "")) +
      "</div>" +
      '<details class="late"><summary>Ver tabela</summary><table class="ref-table compact"><tbody>' + t.rows.map(function (r) {
        var code = r[0] === r[1] ? r[0] : r[0] + "–" + r[1];
        var hit = last && last.code >= r[0] && last.code <= r[1];
        return '<tr' + (hit ? ' class="row-hit"' : "") + "><td>" + code + "</td><td>" + (r[2] ? "<strong>" + esc(r[2]) + "</strong> " : "") + esc(r[3]) + "</td></tr>";
      }).join("") + "</tbody></table></details>";
    return out + "</section>";
  }).join("");
}

/* ------------------------------------------------------------------ */
/* Rolagens                                                           */
/* ------------------------------------------------------------------ */

function d6() { return 1 + Math.floor(Math.random() * 6); }

function rollShield(key, local) {
  var t = shieldTable(key);
  if (!t) return;
  if (local || !app.ts) {
    applyShieldRoll(key, t.die === "d66" ? [d6(), d6()] : [d6()]);
    return;
  }
  app.shield.rolling = key;
  render();
  var dice = t.die === "d66" ? [{ name: "Dezena", roll: "1d6" }, { name: "Unidade", roll: "1d6" }] : [{ name: t.title.slice(0, 30), roll: "1d6" }];
  TS.dice.putDiceInTray(dice, true).then(function (rollId) {
    app.resRolls[rollId] = "__shield:" + key;
  }).catch(function (err) {
    console.error(err);
    app.shield.rolling = null;
    toast(trayError(err));
    render();
  });
}

function applyShieldRoll(key, values) {
  var t = shieldTable(key);
  app.shield.rolling = null;
  var code = t.die === "d66" ? values[0] * 10 + values[1] : values[0];
  var row = SH.lookup(t, code);
  app.shield.last[key] = row ? { code: code, name: row.name, effect: row.effect, ask: row.ask, posted: false } : null;
  render();
}

/* Chamado por handleResourceRoll (app.js) para "__shield:…". */
function handleShieldRoll(key, ev) {
  var t = shieldTable(key);
  if (t && ev.kind === "rollResults") {
    var groups = (ev.payload.resultsGroups || []).map(readGroup);
    if (t.die === "d66") {
      var pair = matchGroups([{ name: "Dezena", count: 1 }, { name: "Unidade", count: 1 }], groups);
      var a = pair[0].values[0], b = pair[1].values[0];
      if (a && b) { applyShieldRoll(key, [a, b]); return; }
    } else if (groups[0] && groups[0].values[0]) { applyShieldRoll(key, [groups[0].values[0]]); return; }
  }
  app.shield.rolling = null;
  render();
}

Object.assign(actions, {
  shieldTab: function (el) { app.shield.tab = el.dataset.tab; },
  shieldRoll: function (el) { rollShield(el.dataset.key, el.dataset.local === "1"); return false; },
  shieldCancel: function () {
    Object.keys(app.resRolls).forEach(function (id) { if (String(app.resRolls[id]).indexOf("__shield:") === 0) delete app.resRolls[id]; });
    app.shield.rolling = null;
  },
  shieldChat: function (el) {
    var t = shieldTable(el.dataset.key), last = app.shield.last[el.dataset.key];
    if (!t || !last) return;
    chat("<b>" + clean(t.title) + "</b> (" + last.code + ")" + (last.name ? ": <b>" + clean(last.name) + "</b>" : "") + "\n<size=85%>" + clean(last.effect) + "</size>");
    last.posted = true;
  },
  shieldAsk: function (el) {
    var t = shieldTable(el.dataset.key), last = app.shield.last[el.dataset.key];
    if (!t || !last || !last.ask) return;
    var rq = makeRequest("s", last.ask.c, last.ask.m, last.name || t.title, onlineSheets());
    toast(rq ? "Pedido enviado: " + skillName(last.ask.c) + "." : "Nenhuma ficha de jogador aberta na mesa.");
  }
});

document.addEventListener("input", function (ev) {
  var el = ev.target;
  if (!el.dataset || el.dataset.shield !== "q") return;
  app.shield.q = el.value;
  var pos = el.selectionStart;
  render();
  var again = document.getElementById("f-shield-q");
  if (again) { again.focus(); try { again.setSelectionRange(pos, pos); } catch (e) { /* sem seleção */ } }
});
