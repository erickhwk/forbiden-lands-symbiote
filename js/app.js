/*
 * Ficha Forbidden Lands — interface e integração com o TaleSpire.
 *
 * Toda a regra de dados mora em engine.js (FLEngine). Este arquivo cuida de:
 *   - estado e persistência da ficha
 *   - desenhar as telas (ficha, montar rolagem, resultado)
 *   - colocar dados na bandeja, ler o resultado e postar no chat
 *
 * Fora do TaleSpire (abrindo o index.html no navegador) a ficha funciona
 * em "modo navegador": salva no localStorage e rola os dados ali mesmo.
 */
"use strict";

var E = window.FLEngine;

/* ------------------------------------------------------------------ */
/* Dados fixos do sistema                                             */
/* ------------------------------------------------------------------ */

var ATTRS = [
  { key: "forca", name: "Força", skills: [["potencia", "Potência"], ["resistencia", "Resistência"], ["combate", "Combate"], ["oficios", "Ofícios"]] },
  { key: "agilidade", name: "Agilidade", skills: [["furtividade", "Furtividade"], ["prestidigitacao", "Prestidigitação"], ["movimento", "Movimento"], ["pontaria", "Pontaria"]] },
  { key: "astucia", name: "Astúcia", skills: [["exploracao", "Exploração"], ["conhecimento", "Conhecimento"], ["sobrevivencia", "Sobrevivência"], ["perspicacia", "Perspicácia"]] },
  { key: "empatia", name: "Empatia", skills: [["manipulacao", "Manipulação"], ["atuacao", "Atuação"], ["cura", "Cura"], ["animais", "Lidar com Animais"]] }
];

var CONDITIONS = [["faminto", "Faminto"], ["sedento", "Sedento"], ["exausto", "Exausto"], ["congelando", "Congelando"]];

var MAX_SKILL = 5;
var MAX_ATTR = 6;
var MAX_WP = 10;
var LOCAL_KEY = "ficha-forbidden-lands";

function attrByKey(key) { return ATTRS.filter(function (a) { return a.key === key; })[0]; }
function skillName(key) {
  for (var i = 0; i < ATTRS.length; i++) {
    for (var j = 0; j < ATTRS[i].skills.length; j++) if (ATTRS[i].skills[j][0] === key) return ATTRS[i].skills[j][1];
  }
  return key;
}

function defaultSheet() {
  var sheet = {
    version: 1,
    name: "",
    kin: "",
    profession: "",
    attrs: {},
    skills: {},
    willpower: 0,
    conditions: {},
    gear: [],
    talents: ""
  };
  ATTRS.forEach(function (a) {
    sheet.attrs[a.key] = { cur: 2, max: 2 };
    a.skills.forEach(function (s) { sheet.skills[s[0]] = 0; });
  });
  CONDITIONS.forEach(function (c) { sheet.conditions[c[0]] = false; });
  return sheet;
}

/* Junta uma ficha salva com os padrões, para tolerar versões antigas. */
function migrate(saved) {
  var base = defaultSheet();
  if (!saved || typeof saved !== "object") return base;
  ["name", "kin", "profession", "talents"].forEach(function (k) { if (typeof saved[k] === "string") base[k] = saved[k]; });
  if (typeof saved.willpower === "number") base.willpower = clamp(saved.willpower, 0, MAX_WP);
  ATTRS.forEach(function (a) {
    var s = saved.attrs && saved.attrs[a.key];
    if (s) base.attrs[a.key] = { cur: clamp(s.cur | 0, 0, MAX_ATTR), max: clamp(s.max | 0, 1, MAX_ATTR) };
    a.skills.forEach(function (sk) {
      if (saved.skills && typeof saved.skills[sk[0]] === "number") base.skills[sk[0]] = clamp(saved.skills[sk[0]], 0, MAX_SKILL);
    });
  });
  CONDITIONS.forEach(function (c) { if (saved.conditions) base.conditions[c[0]] = !!saved.conditions[c[0]]; });
  if (Array.isArray(saved.gear)) {
    base.gear = saved.gear.map(function (g) {
      return { id: String(g.id || uid()), name: String(g.name || ""), bonus: clamp(g.bonus | 0, 0, 10) };
    });
  }
  return base;
}

/* ------------------------------------------------------------------ */
/* Estado                                                             */
/* ------------------------------------------------------------------ */

var app = {
  started: false,
  ts: false,          // API do TaleSpire disponível
  sheet: defaultSheet(),
  tab: "skills",
  view: "sheet",      // "sheet" | "roll"
  roll: null
};

/*
 * app.roll:
 *   label, attrKey, skillKey, gearId, modifier, artifact (0|8|10|12)
 *   phase: "setup" | "tray" | "result" | "pushTray"
 *   mode: "tray" | "local"
 *   trayGroups: grupos colocados na bandeja (para casar com o resultado)
 *   pushGroups: grupos a re-rolar ao forçar
 *   rollId, dice, result, pushed, posted, notice
 */

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
function uid() { return Math.random().toString(36).slice(2, 10); }

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/* ------------------------------------------------------------------ */
/* Persistência                                                       */
/* ------------------------------------------------------------------ */

function loadSheet() {
  var read = app.ts
    ? TS.localStorage.campaign.getBlob()
    : new Promise(function (resolve) {
        try { resolve(window.localStorage.getItem(LOCAL_KEY)); } catch (e) { resolve(null); }
      });
  return read.then(function (raw) {
    if (raw) app.sheet = migrate(JSON.parse(raw));
  }).catch(function (err) {
    console.warn("Ficha nova (nada salvo ainda ou falha ao ler):", err);
  });
}

var saveTimer = null;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(function () {
    var raw = JSON.stringify(app.sheet);
    if (app.ts) {
      TS.localStorage.campaign.setBlob(raw).catch(function (err) {
        console.error("Falha ao salvar", err);
        toast("Não consegui salvar a ficha.");
      });
    } else {
      try { window.localStorage.setItem(LOCAL_KEY, raw); } catch (e) { /* modo privado: segue sem salvar */ }
    }
  }, 400);
}

/* ------------------------------------------------------------------ */
/* Inicialização                                                      */
/* ------------------------------------------------------------------ */

function start(withTaleSpire) {
  var switching = app.started && withTaleSpire && !app.ts;
  if (app.started && !switching) return;
  app.started = true;
  app.ts = !!withTaleSpire;
  loadSheet().then(render);
}

/* Chamado pelo TaleSpire (nome declarado no manifest.json). */
function onStateChangeEvent(msg) {
  if (msg && msg.kind === "hasInitialized") start(typeof TS !== "undefined" && !!TS.dice);
}

document.addEventListener("DOMContentLoaded", function () {
  render();
  // No TaleSpire a API é injetada depois do DOM e avisa por hasInitialized.
  // Sem ela, depois de um instante, assume que está num navegador comum.
  setTimeout(function () {
    if (!app.started && typeof TS === "undefined") start(false);
  }, 1200);
});

/* ------------------------------------------------------------------ */
/* Ícones                                                             */
/* ------------------------------------------------------------------ */

var ICON = {
  die: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="3"></rect><circle cx="8.5" cy="8.5" r="1.3" fill="currentColor"></circle><circle cx="12" cy="12" r="1.3" fill="currentColor"></circle><circle cx="15.5" cy="15.5" r="1.3" fill="currentColor"></circle></svg>',
  back: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"></path></svg>',
  push: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.3 5.7"></path><path d="M20 5v6h-6"></path></svg>',
  check: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5FB3BD" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg>',
  close: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"></path></svg>',
  tray: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5FB3BD" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M12 3v4M12 17v4M3 12h4M17 12h4"></path><circle cx="12" cy="12" r="3"></circle></svg>'
};

/* ------------------------------------------------------------------ */
/* Desenho                                                            */
/* ------------------------------------------------------------------ */

function render() {
  var root = document.getElementById("app");
  if (!app.started) {
    root.innerHTML = '<div class="app"><p class="muted">Carregando a ficha…</p></div>';
    return;
  }
  root.innerHTML = '<div class="app">' + (app.view === "roll" ? renderRoll() : renderSheet()) + "</div>";
}

function initials(name) {
  var parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

function renderSheet() {
  var s = app.sheet;
  return [
    renderHeader(),
    renderAttrs(),
    renderWillpower(),
    renderConditions(),
    renderTabs(),
    app.tab === "skills" ? renderSkills() : app.tab === "gear" ? renderGear() : renderTalents()
  ].join("");
}

function renderHeader() {
  var s = app.sheet;
  return '<header class="who">' +
    '<div class="avatar" id="avatar" aria-hidden="true">' + esc(initials(s.name)) + "</div>" +
    '<div class="grow">' +
      '<label class="eyebrow" for="f-name" style="position:absolute;left:-9999px">Nome</label>' +
      '<input id="f-name" class="plain-input name" data-bind="name" placeholder="Nome do personagem" value="' + esc(s.name) + '">' +
      '<div class="row" style="gap:4px">' +
        '<input class="plain-input sub" data-bind="kin" aria-label="Linhagem" placeholder="Linhagem" value="' + esc(s.kin) + '">' +
        '<input class="plain-input sub" data-bind="profession" aria-label="Profissão" placeholder="Profissão" value="' + esc(s.profession) + '">' +
      "</div>" +
    "</div>" +
    (app.ts
      ? '<span class="pill"><span class="dot"></span>Na mesa</span>'
      : '<span class="pill offline" title="Aberto fora do TaleSpire"><span class="dot"></span>Navegador</span>') +
  "</header>";
}

function renderAttrs() {
  return '<section class="attrs" aria-label="Atributos">' + ATTRS.map(function (a) {
    var v = app.sheet.attrs[a.key];
    var pips = "";
    for (var i = 0; i < v.max; i++) {
      pips += '<button class="pip' + (i < v.cur ? "" : " off") + '" data-action="setAttr" data-attr="' + a.key + '" data-value="' + (i + 1) +
        '" aria-label="' + a.name + " em " + (i + 1) + '"></button>';
    }
    return '<div class="card attr">' +
      '<div class="row between" style="align-items:flex-start">' +
        "<div>" +
          '<p class="eyebrow">' + a.name + "</p>" +
          '<div class="attr-value">' + v.cur + '<span class="max"> / ' + v.max + "</span></div>" +
        "</div>" +
        '<button class="btn-icon" data-action="openRoll" data-attr="' + a.key + '" aria-label="Rolar ' + a.name + '"' + (v.cur === 0 ? " disabled" : "") + ">" + ICON.die + "</button>" +
      "</div>" +
      '<div class="pips">' + pips + "</div>" +
      '<div class="attr-max">Máximo ' +
        '<button class="btn-step" data-action="attrMax" data-attr="' + a.key + '" data-delta="-1" aria-label="Diminuir máximo de ' + a.name + '">−</button>' +
        '<button class="btn-step" data-action="attrMax" data-attr="' + a.key + '" data-delta="1" aria-label="Aumentar máximo de ' + a.name + '">+</button>' +
      "</div>" +
    "</div>";
  }).join("") + "</section>";
}

function renderWillpower() {
  var wp = app.sheet.willpower, boxes = "";
  for (var i = 1; i <= MAX_WP; i++) {
    boxes += '<button class="' + (i <= wp ? "on" : "") + '" data-action="setWp" data-value="' + i + '" aria-label="Força de Vontade ' + i + '"></button>';
  }
  return '<section aria-label="Força de Vontade">' +
    '<div class="row between" style="margin-bottom:8px"><h2 class="eyebrow">Força de Vontade</h2>' +
    '<span style="font-family:var(--display);font-size:18px;font-weight:600">' + wp + "</span></div>" +
    '<div class="wp">' + boxes + "</div></section>";
}

function renderConditions() {
  return '<section aria-label="Condições"><h2 class="eyebrow" style="margin-bottom:8px">Condições</h2><div class="conds">' +
    CONDITIONS.map(function (c) {
      return '<button class="toggle" data-action="toggleCond" data-cond="' + c[0] + '" aria-pressed="' + !!app.sheet.conditions[c[0]] + '">' + c[1] + "</button>";
    }).join("") + "</div></section>";
}

function renderTabs() {
  var tabs = [["skills", "Perícias"], ["gear", "Equipamento"], ["talents", "Talentos"]];
  return '<nav class="tabs" role="tablist" aria-label="Seções da ficha">' + tabs.map(function (t) {
    return '<button role="tab" data-action="tab" data-tab="' + t[0] + '" aria-selected="' + (app.tab === t[0]) + '">' + t[1] + "</button>";
  }).join("") + "</nav>";
}

function renderSkills() {
  return '<section class="skill-groups" role="tabpanel" aria-label="Perícias">' + ATTRS.map(function (a) {
    var cur = app.sheet.attrs[a.key].cur;
    return '<div class="skill-group">' +
      '<div class="row between"><h3>' + a.name + '</h3><span class="small muted">' + E.plural(cur, "dado", "dados") + " de atributo</span></div>" +
      a.skills.map(function (sk) {
        var lvl = app.sheet.skills[sk[0]];
        return '<div class="skill-row">' +
          '<span class="name">' + sk[1] + "</span>" +
          '<button class="btn-step" data-action="skill" data-skill="' + sk[0] + '" data-delta="-1" aria-label="Diminuir ' + sk[1] + '"' + (lvl <= 0 ? " disabled" : "") + ">−</button>" +
          '<span class="level" aria-label="Nível ' + lvl + '">' + lvl + "</span>" +
          '<button class="btn-step" data-action="skill" data-skill="' + sk[0] + '" data-delta="1" aria-label="Aumentar ' + sk[1] + '"' + (lvl >= MAX_SKILL ? " disabled" : "") + ">+</button>" +
          '<button class="btn-icon sm" data-action="openRoll" data-attr="' + a.key + '" data-skill="' + sk[0] + '" aria-label="Rolar ' + sk[1] + '">' + ICON.die + "</button>" +
        "</div>";
      }).join("") +
    "</div>";
  }).join("") + "</section>";
}

function renderGear() {
  var rows = app.sheet.gear.map(function (g) {
    return '<div class="gear-row">' +
      '<input class="field grow" data-bind="gear.name" data-id="' + esc(g.id) + '" aria-label="Nome do item" placeholder="Item" value="' + esc(g.name) + '">' +
      '<button class="btn-step" data-action="gearBonus" data-id="' + esc(g.id) + '" data-delta="-1" aria-label="Diminuir bônus"' + (g.bonus <= 0 ? " disabled" : "") + ">−</button>" +
      '<span class="level" style="width:22px;text-align:center;font-family:var(--display);font-size:18px;font-weight:600" aria-label="Bônus ' + g.bonus + '">' + g.bonus + "</span>" +
      '<button class="btn-step" data-action="gearBonus" data-id="' + esc(g.id) + '" data-delta="1" aria-label="Aumentar bônus">+</button>' +
      '<button class="btn-icon sm" data-action="gearRemove" data-id="' + esc(g.id) + '" aria-label="Remover item">' + ICON.close + "</button>" +
    "</div>";
  }).join("");
  return '<section role="tabpanel" aria-label="Equipamento" style="display:flex;flex-direction:column;gap:12px">' +
    '<p class="small muted" style="margin:0">O bônus do item vira dados de equipamento. Se você forçar e tirar 1 neles, o bônus cai.</p>' +
    '<div class="gear-list">' + (rows || '<p class="muted" style="margin:0">Nenhum item ainda.</p>') + "</div>" +
    '<button class="btn-ghost" data-action="gearAdd">Adicionar item</button>' +
  "</section>";
}

function renderTalents() {
  return '<section role="tabpanel" aria-label="Talentos">' +
    '<label class="eyebrow" for="f-talents" style="display:block;margin-bottom:8px">Talentos e anotações</label>' +
    '<textarea id="f-talents" class="field" data-bind="talents" placeholder="Um talento por linha">' + esc(app.sheet.talents) + "</textarea>" +
  "</section>";
}

/* ---------- Montar rolagem ---------- */

function currentPool(r) {
  var attr = app.sheet.attrs[r.attrKey];
  var skill = r.skillKey ? app.sheet.skills[r.skillKey] : 0;
  var gear = gearById(r.gearId);
  return E.buildPool({
    attribute: attr.cur,
    skill: skill,
    modifier: r.modifier,
    gear: gear ? gear.bonus : 0,
    artifacts: r.artifact ? [r.artifact] : []
  });
}

function gearById(id) { return app.sheet.gear.filter(function (g) { return g.id === id; })[0] || null; }

function rollTitle(r) {
  return r.skillKey ? skillName(r.skillKey) : attrByKey(r.attrKey).name;
}

function renderRoll() {
  var r = app.roll;
  if (r.phase === "result" || r.phase === "pushTray") return renderResult();

  var attr = attrByKey(r.attrKey);
  var pool = currentPool(r);
  var total = E.totalDice(pool);
  var skillLvl = r.skillKey ? app.sheet.skills[r.skillKey] : 0;
  var skillTotal = skillLvl + r.modifier;
  var busy = r.phase === "tray";

  var html = '<div class="back">' +
    '<button class="btn-icon sm" data-action="closeRoll" aria-label="Voltar para a ficha"' + (busy ? " disabled" : "") + ">" + ICON.back + "</button>" +
    '<div><p class="eyebrow">' + attr.name + (r.skillKey ? " + " + skillName(r.skillKey) : "") + "</p>" +
    '<h1 class="title">Rolar ' + esc(rollTitle(r)) + "</h1></div></div>";

  html += '<section class="pool" aria-label="Dados da rolagem">';

  html += '<div class="card pool-row"><span class="chip chip-attribute"></span>' +
    '<div class="label"><strong>Atributo</strong><span class="small muted">' + attr.name + " (valor atual)</span></div>" +
    '<span class="count">' + app.sheet.attrs[r.attrKey].cur + "</span></div>";

  html += '<div class="card"><div class="pool-row">' +
    '<span class="chip ' + (skillTotal < 0 ? "chip-negative" : "chip-skill") + '"></span>' +
    '<div class="label"><strong>' + (skillTotal < 0 ? "Dados negativos" : "Perícia") + "</strong>" +
    '<span class="small muted">' + (r.skillKey ? skillName(r.skillKey) + " " + skillLvl : "Sem perícia") +
    " · modificador " + (r.modifier > 0 ? "+" : "") + r.modifier + "</span></div>" +
    '<button class="btn-step" data-action="mod" data-delta="-1" aria-label="Penalidade −1"' + (busy ? " disabled" : "") + ">−</button>" +
    '<span class="count">' + Math.abs(skillTotal) + "</span>" +
    '<button class="btn-step" data-action="mod" data-delta="1" aria-label="Bônus +1"' + (busy ? " disabled" : "") + ">+</button>" +
    "</div></div>";

  var gear = gearById(r.gearId);
  html += '<div class="card"><div class="pool-row"><span class="chip chip-gear"></span>' +
    '<div class="label"><strong>Equipamento</strong><span class="small muted">' + (gear ? esc(gear.name || "Item") + " · bônus " + gear.bonus : "Nenhum") + "</span></div>" +
    '<span class="count">' + (gear ? gear.bonus : 0) + "</span></div>" +
    '<label for="f-gear" style="position:absolute;left:-9999px">Equipamento usado</label>' +
    '<select id="f-gear" class="field" data-bind="roll.gear"' + (busy ? " disabled" : "") + '><option value="">Sem equipamento</option>' +
    app.sheet.gear.map(function (g) {
      return '<option value="' + esc(g.id) + '"' + (g.id === r.gearId ? " selected" : "") + ">" + esc(g.name || "Item sem nome") + " (bônus " + g.bonus + ")</option>";
    }).join("") + "</select></div>";

  html += '<div class="card"><div class="pool-row"><span class="chip chip-artifact"></span>' +
    '<div class="label"><strong>Artefato</strong><span class="small muted">Talento, arma rara ou magia</span></div></div>' +
    '<div class="seg" role="group" aria-label="Dado de artefato">' +
    [[0, "Nenhum"], [8, "d8"], [10, "d10"], [12, "d12"]].map(function (o) {
      return '<button data-action="artifact" data-sides="' + o[0] + '" aria-pressed="' + (r.artifact === o[0]) + '"' + (busy ? " disabled" : "") + ">" + o[1] + "</button>";
    }).join("") + "</div></div>";

  html += "</section>";

  html += '<section aria-label="Resumo"><div class="row between" style="margin-bottom:8px">' +
    '<span class="eyebrow">' + (busy ? "Na bandeja" : "Vai para a bandeja") + "</span>" +
    '<span style="font-family:var(--display);font-size:18px;font-weight:600">' + E.plural(total, "dado", "dados") + "</span></div>" +
    '<div class="tray-preview" aria-hidden="true">' + trayPreview(pool) + "</div></section>";

  html += '<div class="actions">';
  if (r.notice) html += '<div class="notice' + (r.noticeError ? " error" : "") + '">' + esc(r.notice) + "</div>";
  if (busy) {
    html += '<div class="notice" role="status">' + ICON.tray + "<span>Dados na bandeja. Pegue e jogue no tabuleiro do TaleSpire.</span></div>" +
      '<button class="btn-ghost" data-action="cancelTray">Cancelar</button>';
  } else if (app.ts) {
    html += '<button class="btn-primary" data-action="toTray"' + (total ? "" : " disabled") + ">" + ICON.die + "Colocar na bandeja</button>" +
      '<button class="link-btn" data-action="rollLocal"' + (total ? "" : " disabled") + ">Rolar aqui, sem dados 3D</button>";
  } else {
    html += '<button class="btn-primary" data-action="rollLocal"' + (total ? "" : " disabled") + ">" + ICON.die + "Rolar</button>" +
      '<p class="small muted" style="margin:0">Fora do TaleSpire, os dados rolam aqui mesmo.</p>';
  }
  html += "</div>";
  return html;
}

function trayPreview(pool) {
  var out = "";
  pool.forEach(function (g) { for (var i = 0; i < g.count; i++) out += '<span class="tray-' + g.type + '"></span>'; });
  return out;
}

/* ---------- Resultado ---------- */

function renderResult() {
  var r = app.roll, res = r.result;
  var waiting = r.phase === "pushTray";
  var name = app.sheet.name || "Personagem";

  var html = '<header><div class="row between"><p class="eyebrow">' + esc(rollTitle(r)) + " · " + esc(name) + (r.pushed ? " · forçada" : "") + "</p>" +
    (r.posted ? '<span class="row small muted" style="gap:6px">' + ICON.check + "No chat da mesa</span>" : "") + "</div>" +
    '<div class="big"><span class="n' + (res.successes ? "" : " zero") + '">' + res.successes + '</span><span class="w">' +
    (res.successes === 1 ? "sucesso" : "sucessos") + "</span></div></header>";

  var lines = [];
  if (r.pushed) {
    var attr = attrByKey(r.attrKey), a = app.sheet.attrs[r.attrKey];
    if (res.attributeDamage) lines.push([res.attributeDamage + " de dano em " + attr.name + " (agora " + a.cur + "/" + a.max + ")", "var(--bane)"]);
    if (res.willpowerGained) lines.push(["+" + res.willpowerGained + " de Força de Vontade (agora " + app.sheet.willpower + ")", "var(--accent)"]);
    if (res.gearDamage && r.gearName) lines.push([r.gearName + " perde " + res.gearDamage + " de bônus", "var(--bane)"]);
    if (!lines.length) lines.push(["Forçada sem danos", "var(--info)"]);
  } else if (res.attrBanes || res.gearBanes) {
    lines.push(["Os 1 em atributo e equipamento só contam se você forçar", "var(--muted)"]);
  }
  if (res.cancelled) lines.push([E.plural(res.cancelled, "sucesso anulado", "sucessos anulados") + " por dados negativos", "var(--muted)"]);
  if (lines.length) {
    html += '<section class="consequences" aria-label="Consequências">' + lines.map(function (l) {
      return '<div><span class="mark" style="background:' + l[1] + '"></span>' + esc(l[0]) + "</div>";
    }).join("") + "</section>";
  }

  html += '<section class="card dice-groups" aria-label="Dados rolados">' + E.byType(r.dice).map(function (g) {
    return "<div><span class=\"small muted\">" + g.label + "</span><div class=\"dice-row\">" + g.dice.map(function (d) {
      var cls = ["die", "die-" + d.type];
      var desc = String(d.value);
      if (E.successesOf(d) > 0) { cls.push("success"); desc += ", sucesso"; }
      else if (E.cancelsSuccess(d)) { cls.push("cancel"); desc += ", anula um sucesso"; }
      else if (E.isBane(d)) { cls.push("bane"); desc += ", dano"; }
      else if (!r.pushed) cls.push("dim");
      if (d.fresh) cls.push("fresh");
      return '<span class="' + cls.join(" ") + '" role="img" aria-label="' + desc + '">' + d.value + "</span>";
    }).join("") + "</div></div>";
  }).join("") +
  '<div class="legend"><span><i style="outline:2px solid var(--success)"></i>Sucesso</span>' +
  '<span><i style="outline:2px dashed var(--bane)"></i>Dano</span>' +
  (r.pushed ? "" : '<span><i style="background:var(--text);opacity:.5"></i>Pode forçar</span>') + "</div></section>";

  html += '<div class="actions">';
  if (waiting) {
    html += '<div class="notice" role="status">' + ICON.tray + "<span>Dados para forçar na bandeja. Jogue no tabuleiro.</span></div>" +
      '<button class="btn-ghost" data-action="cancelPush">Cancelar</button>';
  } else if (res.canPush) {
    var n = E.pushIndices(r.dice).length;
    html += '<button class="btn-primary" data-action="push">' + ICON.push + "Forçar · re-rolar " + E.plural(n, "dado", "dados") + "</button>" +
      '<p class="small muted" style="margin:0">Sucessos e 1 em atributo/equipamento ficam. Depois de forçar, cada 1 em atributo vira 1 de dano e 1 de Força de Vontade.</p>' +
      '<button class="btn-ghost" data-action="finish">Aceitar resultado</button>';
  } else {
    html += '<button class="btn-primary" data-action="finish">Voltar para a ficha</button>';
  }
  html += "</div>";
  return html;
}

/* ------------------------------------------------------------------ */
/* Ações                                                              */
/* ------------------------------------------------------------------ */

var actions = {
  tab: function (el) { app.tab = el.dataset.tab; },

  setAttr: function (el) {
    var a = app.sheet.attrs[el.dataset.attr], v = +el.dataset.value;
    a.cur = a.cur === v ? v - 1 : v;
    save();
  },

  attrMax: function (el) {
    var a = app.sheet.attrs[el.dataset.attr];
    a.max = clamp(a.max + (+el.dataset.delta), 1, MAX_ATTR);
    a.cur = Math.min(a.cur, a.max);
    if (+el.dataset.delta > 0) a.cur = Math.min(a.cur + 1, a.max);
    save();
  },

  setWp: function (el) {
    var v = +el.dataset.value;
    app.sheet.willpower = app.sheet.willpower === v ? v - 1 : v;
    save();
  },

  toggleCond: function (el) {
    var k = el.dataset.cond;
    app.sheet.conditions[k] = !app.sheet.conditions[k];
    save();
  },

  skill: function (el) {
    var k = el.dataset.skill;
    app.sheet.skills[k] = clamp(app.sheet.skills[k] + (+el.dataset.delta), 0, MAX_SKILL);
    save();
  },

  gearAdd: function () {
    app.sheet.gear.push({ id: uid(), name: "", bonus: 1 });
    save();
    setTimeout(function () {
      var inputs = document.querySelectorAll('[data-bind="gear.name"]');
      if (inputs.length) inputs[inputs.length - 1].focus();
    }, 0);
  },

  gearBonus: function (el) {
    var g = gearById(el.dataset.id);
    if (g) g.bonus = clamp(g.bonus + (+el.dataset.delta), 0, 10);
    save();
  },

  gearRemove: function (el) {
    app.sheet.gear = app.sheet.gear.filter(function (g) { return g.id !== el.dataset.id; });
    save();
  },

  openRoll: function (el) {
    var prev = app.lastGearId && gearById(app.lastGearId) ? app.lastGearId : null;
    app.roll = {
      attrKey: el.dataset.attr,
      skillKey: el.dataset.skill || null,
      gearId: el.dataset.skill ? prev : null,
      modifier: 0,
      artifact: 0,
      phase: "setup"
    };
    app.view = "roll";
    window.scrollTo(0, 0);
  },

  closeRoll: function () { app.view = "sheet"; app.roll = null; },

  mod: function (el) { app.roll.modifier = clamp(app.roll.modifier + (+el.dataset.delta), -10, 10); },

  artifact: function (el) { app.roll.artifact = +el.dataset.sides; },

  toTray: function () { putPoolInTray(); return false; },

  rollLocal: function () {
    var r = app.roll;
    r.mode = "local";
    r.notice = null;
    showFirstResult(E.rollGroups(currentPool(r)));
  },

  cancelTray: function () { app.roll.phase = "setup"; app.roll.rollId = null; },

  push: function () { pushRoll(); return false; },

  cancelPush: function () { app.roll.phase = "result"; app.roll.rollId = null; },

  finish: function () { app.view = "sheet"; app.roll = null; }
};

document.addEventListener("click", function (ev) {
  var el = ev.target.closest("[data-action]");
  if (!el || el.disabled) return;
  var fn = actions[el.dataset.action];
  if (!fn) return;
  var result = fn(el);
  if (result !== false) render();
});

document.addEventListener("input", function (ev) {
  var el = ev.target, bind = el.dataset && el.dataset.bind;
  if (!bind) return;
  if (bind === "gear.name") {
    var g = gearById(el.dataset.id);
    if (g) g.name = el.value;
  } else if (bind === "roll.gear") {
    return; // tratado no change
  } else {
    app.sheet[bind] = el.value;
    if (bind === "name") {
      var av = document.getElementById("avatar");
      if (av) av.textContent = initials(el.value);
    }
  }
  save();
});

document.addEventListener("change", function (ev) {
  var el = ev.target;
  if (el.dataset && el.dataset.bind === "roll.gear" && app.roll) {
    app.roll.gearId = el.value || null;
    app.lastGearId = app.roll.gearId;
    render();
  }
});

/* ------------------------------------------------------------------ */
/* Bandeja de dados do TaleSpire                                      */
/* ------------------------------------------------------------------ */

function trayError(err) {
  var cause = err && err.cause;
  var map = {
    notInBoard: "Entre num tabuleiro para rolar.",
    unsupportedDieCount: "Dados demais para a bandeja de uma vez.",
    noDiceSpecified: "Nenhum dado para rolar.",
    rateLimited: "O TaleSpire pediu um respiro. Tente de novo em instantes."
  };
  return map[cause] || "Não consegui colocar os dados na bandeja" + (cause ? " (" + cause + ")" : "") + ".";
}

function putPoolInTray() {
  var r = app.roll;
  var pool = currentPool(r);
  var groups = pool.map(function (g) { return { type: g.type, sides: g.sides, count: g.count, name: E.TYPES[g.type].label }; });
  var descriptors = groups.map(function (g) { return { name: g.name, roll: E.notation(g) }; });

  r.mode = "tray";
  r.notice = null;
  r.trayGroups = groups;
  r.phase = "tray";
  render();

  // true = resultado "quieto": o TaleSpire não mostra a soma dos d6, que não
  // significa nada no Forbidden Lands. O mestre ainda consegue conferir.
  TS.dice.putDiceInTray(descriptors, true).then(function (rollId) {
    if (app.roll === r) r.rollId = rollId;
  }).catch(function (err) {
    console.error(err);
    if (app.roll !== r) return;
    r.phase = "setup";
    r.notice = trayError(err);
    r.noticeError = true;
    render();
  });
}

function pushRoll() {
  var r = app.roll;
  if (r.mode === "local") {
    var before = r.dice;
    var after = E.pushLocally(before);
    finishPush(markFresh(after, E.pushIndices(before)));
    return;
  }
  var groups = E.pushGroups(r.dice).map(function (g) {
    g.name = "Forçar " + E.TYPES[g.type].label;
    return g;
  });
  r.pushGroups = groups;
  r.phase = "pushTray";
  render();

  var descriptors = groups.map(function (g) { return { name: g.name, roll: E.notation(g) }; });
  TS.dice.putDiceInTray(descriptors, true).then(function (rollId) {
    if (app.roll === r) r.rollId = rollId;
  }).catch(function (err) {
    console.error(err);
    if (app.roll !== r) return;
    r.phase = "result";
    toast(trayError(err));
    render();
  });
}

function markFresh(dice, indices) {
  return dice.map(function (d, i) {
    return { type: d.type, sides: d.sides, value: d.value, fresh: indices.indexOf(i) !== -1 };
  });
}

/* Chamado pelo TaleSpire (nome declarado no manifest.json). */
function handleRollResult(ev) {
  var r = app.roll;
  if (!r || !ev || !ev.payload || !r.rollId || ev.payload.rollId !== r.rollId) return;

  if (ev.kind === "rollRemoved") {
    r.rollId = null;
    if (r.phase === "tray") { r.phase = "setup"; r.notice = "Os dados saíram da bandeja sem rolar."; r.noticeError = false; }
    if (r.phase === "pushTray") { r.phase = "result"; }
    render();
    return;
  }
  if (ev.kind !== "rollResults") return;

  var results = (ev.payload.resultsGroups || []).map(readGroup);
  r.rollId = null; // ignora se alguém jogar os mesmos dados de novo

  if (r.phase === "tray") {
    var dice = [];
    matchGroups(r.trayGroups, results).forEach(function (pair) {
      pair.values.forEach(function (v) { dice.push({ type: pair.group.type, sides: pair.group.sides, value: v, fresh: true }); });
    });
    showFirstResult(dice);
  } else if (r.phase === "pushTray") {
    var values = matchGroups(r.pushGroups, results).map(function (pair) { return pair.values; });
    var next = E.applyPush(r.dice, r.pushGroups, values);
    var rerolled = [];
    r.pushGroups.forEach(function (g) { rerolled = rerolled.concat(g.indices); });
    finishPush(markFresh(next, rerolled));
  }
}

/* Extrai os valores de um grupo de resultado do TaleSpire (árvore de operações). */
function readGroup(group) {
  var values = [];
  (function walk(node) {
    if (!node) return;
    if (Array.isArray(node.results)) values = values.concat(node.results);
    if (Array.isArray(node.operands)) node.operands.forEach(walk);
  })(group.result);
  return { name: group.name, values: values };
}

/* Casa os grupos enviados com os recebidos, pelo nome e, na falta, pela ordem. */
function matchGroups(sent, received) {
  var used = {};
  return sent.map(function (g, i) {
    var idx = -1;
    for (var j = 0; j < received.length; j++) {
      if (!used[j] && received[j].name === g.name) { idx = j; break; }
    }
    if (idx === -1 && received[i] && !used[i]) idx = i;
    if (idx !== -1) used[idx] = true;
    return { group: g, values: idx === -1 ? [] : received[idx].values.slice(0, g.count) };
  });
}

/* ------------------------------------------------------------------ */
/* Resultado, consequências e chat                                    */
/* ------------------------------------------------------------------ */

function showFirstResult(dice) {
  var r = app.roll;
  r.dice = dice;
  r.pushed = false;
  r.result = E.evaluate(dice, false);
  r.phase = "result";
  r.posted = false;
  render();
  settle(dice);
  postToChat(r);
}

/* A animação de "dado novo" roda só no primeiro desenho do resultado. */
function settle(dice) {
  dice.forEach(function (d) { d.fresh = false; });
}

function finishPush(dice) {
  var r = app.roll;
  r.dice = dice;
  r.pushed = true;
  r.result = E.evaluate(dice, true);
  r.phase = "result";
  r.posted = false;

  var a = app.sheet.attrs[r.attrKey];
  a.cur = Math.max(0, a.cur - r.result.attributeDamage);
  app.sheet.willpower = clamp(app.sheet.willpower + r.result.willpowerGained, 0, MAX_WP);
  var gear = gearById(r.gearId);
  r.gearName = gear ? (gear.name || "Item") : null;
  if (gear) gear.bonus = Math.max(0, gear.bonus - r.result.gearDamage);
  save();

  render();
  settle(dice);
  postToChat(r);
}

function chatText(r) {
  var res = r.result;
  var who = (app.sheet.name || "Personagem").replace(/[<>]/g, "");
  var label = rollTitle(r) + (r.pushed ? " (forçada)" : "");
  var color = res.successes ? "#E8B84A" : "#A89C88";
  var text = "<b>" + who + "</b> · " + label + ": <color=" + color + "><b>" + E.plural(res.successes, "sucesso", "sucessos") + "</b></color>";

  if (r.pushed) {
    var parts = [];
    if (res.attributeDamage) parts.push("<color=#E0604E>" + res.attributeDamage + " dano em " + attrByKey(r.attrKey).name + "</color>");
    if (res.willpowerGained) parts.push("+" + res.willpowerGained + " FdV");
    if (res.gearDamage && r.gearName) parts.push("<color=#E0604E>" + r.gearName.replace(/[<>]/g, "") + " −" + res.gearDamage + "</color>");
    if (parts.length) text += " · " + parts.join(" · ");
  }

  var abbr = { attribute: "A", skill: "P", negative: "N", gear: "E", artifact: "Art" };
  var faces = E.byType(r.dice).map(function (g) {
    return abbr[g.type] + " " + g.dice.map(function (d) { return d.value; }).join(" ");
  }).join(" | ");
  text += "\n<size=85%><color=#A89C88>" + faces + (r.mode === "local" ? " · rolado na ficha" : "") + "</color></size>";
  return text;
}

function postToChat(r) {
  if (!app.ts) return;
  TS.chat.send(chatText(r), "board").then(function () {
    if (app.roll === r) { r.posted = true; render(); }
  }).catch(function (err) {
    console.error("Falha no chat", err);
    toast("Não consegui postar no chat da mesa.");
  });
}

/* ------------------------------------------------------------------ */
/* Aviso rápido                                                       */
/* ------------------------------------------------------------------ */

var toastTimer = null;
function toast(msg) {
  var el = document.getElementById("toast");
  if (!el) return;
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { el.hidden = true; }, 4000);
}
