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
var C = window.FLCatalog;
var W = window.FLEncumbrance;
var R = window.FLResources;
var J = window.FLInjuries;

/* ------------------------------------------------------------------ */
/* Dados fixos do sistema                                             */
/* ------------------------------------------------------------------ */

var ATTRS = [
// As chaves ficaram da primeira versão para não perder fichas salvas;
// os nomes seguem o Manual do Jogador.
  { key: "forca", name: "Força", skills: [["potencia", "Potência"], ["resistencia", "Resiliência"], ["combate", "Luta"], ["oficios", "Artesanato"]] },
  { key: "agilidade", name: "Agilidade", skills: [["furtividade", "Furtividade"], ["prestidigitacao", "Artimanha"], ["movimento", "Movimentação"], ["pontaria", "Pontaria"]] },
  { key: "astucia", name: "Astúcia", skills: [["exploracao", "Patrulha"], ["conhecimento", "Tradição"], ["sobrevivencia", "Sobrevivência"], ["perspicacia", "Discernimento"]] },
  { key: "empatia", name: "Empatia", skills: [["manipulacao", "Manipulação"], ["atuacao", "Atuação"], ["cura", "Cura"], ["animais", "Adestramento"]] }
];

var CONDITIONS = [["faminto", "Faminto"], ["sedento", "Desidratado"], ["exausto", "Insone"], ["congelando", "Hipotérmico"]];

var AGES = [["jovem", "Jovem"], ["adulto", "Adulto"], ["idoso", "Idoso"]];

var MAX_SKILL = 5;
var MAX_REP = 10;
var AGE_REP = { jovem: 0, adulto: 1, idoso: 2 };  // Reputação inicial por idade
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
    talentList: [],   // [{ id, rank }] do catálogo, ou { id: "custom-…", name, rank }
    // Histórico
    age: "",          // "jovem" | "adulto" | "idoso"
    face: "",
    body: "",
    clothes: "",
    reputation: 0,    // 0 a 10 (o livro não tem teto; a ficha para em 10)
    coins: { cobre: 0, prata: 0, ouro: 0 },
    xp: 0,            // XP disponível para gastar
    xpTotal: 0,       // XP ganho na vida do personagem
    pride: "",
    prideUsedSession: false,  // já usado nesta sessão
    prideLost: false,         // perdido: falhou mesmo com o Orgulho
    darkSecret: "",
    relationships: "",
    resources: R.empty(), // Dados de Recurso: { comida: 8, agua: 6, ... } (0 = não tem)
    injuries: [],     // Ferimentos Graves em andamento
    lastDtype: "corte", // tipo do último golpe recebido: corte | perfuracao | esmagamento
    injuryRolled: { forca: false, astucia: false }, // já rolou o ferimento desta vez que ficou Acabado
    talents: ""       // anotações livres (o nome da chave ficou da primeira versão)
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
  ["name", "talents", "face", "body", "clothes", "pride", "darkSecret", "relationships"].forEach(function (k) { if (typeof saved[k] === "string") base[k] = saved[k]; });
  if (AGES.some(function (a) { return a[0] === saved.age; })) base.age = saved.age;
  base.prideUsedSession = !!saved.prideUsedSession;
  base.reputation = clamp(saved.reputation | 0, 0, MAX_REP);
  if (saved.coins) ["cobre", "prata", "ouro"].forEach(function (k) { base.coins[k] = Math.max(0, saved.coins[k] | 0); });
  if (Array.isArray(saved.injuries)) {
    base.injuries = saved.injuries.filter(function (x) { return x && x.name; }).map(function (x) {
      return { id: String(x.id || uid()), table: String(x.table || ""), code: x.code | 0, name: String(x.name), effect: String(x.effect || ""),
        lethal: !!x.lethal, instant: !!x.instant, limit: String(x.limit || ""), healMod: x.healMod | 0, saved: !!x.saved,
        heal: x.heal == null ? null : Math.max(0, x.heal | 0), perm: !!x.perm, note: String(x.note || "") };
    });
  }
  if (J.BY_DAMAGE[saved.lastDtype]) base.lastDtype = saved.lastDtype;
  if (saved.injuryRolled) base.injuryRolled = { forca: !!saved.injuryRolled.forca, astucia: !!saved.injuryRolled.astucia };
  base.xpTotal = Math.max(0, saved.xpTotal | 0);
  base.xp = clamp(saved.xp | 0, 0, Math.max(base.xpTotal, saved.xp | 0));
  if (base.xp > base.xpTotal) base.xpTotal = base.xp;
  base.prideLost = !!saved.prideLost;
  base.kin = catalogId(C.KINS, saved.kin);
  base.profession = catalogId(C.PROFESSIONS, saved.profession);
  if (Array.isArray(saved.talentList)) {
    base.talentList = saved.talentList.filter(function (t) { return t && t.id; }).map(function (t) {
      var out = { id: String(t.id), rank: clamp(t.rank | 0 || 1, 1, 3) };
      if (!C.talent(out.id)) out.name = String(t.name || "Talento");
      return out;
    });
  }
  if (typeof saved.willpower === "number") base.willpower = clamp(saved.willpower, 0, MAX_WP);
  ATTRS.forEach(function (a) {
    var s = saved.attrs && saved.attrs[a.key];
    if (s) base.attrs[a.key] = { cur: clamp(s.cur | 0, 0, MAX_ATTR), max: clamp(s.max | 0, 1, MAX_ATTR) };
    a.skills.forEach(function (sk) {
      if (saved.skills && typeof saved.skills[sk[0]] === "number") base.skills[sk[0]] = clamp(saved.skills[sk[0]], 0, MAX_SKILL);
    });
  });
  CONDITIONS.forEach(function (c) { if (saved.conditions) base.conditions[c[0]] = !!saved.conditions[c[0]]; });
  if (saved.resources && typeof saved.resources === "object") {
    R.KINDS.forEach(function (k) { base.resources[k.key] = R.norm(saved.resources[k.key]); });
  }
  if (Array.isArray(saved.gear)) {
    base.gear = saved.gear.map(function (g) {
      var bonus = clamp(g.bonus | 0, 0, 10);
      var base = g.base == null ? bonus : clamp(g.base | 0, bonus, 10);
      var out = { id: String(g.id || uid()), name: String(g.name || ""), bonus: bonus, base: base, info: String(g.info || "") };
      // Fichas antigas não marcavam itens sem bônus: usa o catálogo, ou bônus 0 sem histórico.
      var cat = C.gearByName && C.gearByName(out.name);
      var isArmor = g.kind === "armor" || (cat && cat.kind === "armor");
      out.nb = g.nb != null ? !!g.nb : isArmor ? g.kind !== "armor" : cat ? cat.bonus == null : (bonus === 0 && base === 0);
      if (out.nb) { out.bonus = 0; out.base = 0; }
      out.weight = W.WEIGHTS[g.weight] ? g.weight : guessWeight(out.name);
      if (!out.info && cat && cat.info) out.info = cat.info;
      // Armas e armaduras do catálogo (fichas até a 0.3.0 não guardavam isso).
      out.kind = g.kind || (cat && cat.kind) || "";
      if (out.kind === "weapon") {
        out.dmg = g.dmg != null ? clamp(g.dmg | 0, 0, 10) : cat ? cat.dmg : 1;
        out.melee = g.melee != null ? !!g.melee : cat ? !!cat.melee : true;
      }
      if (out.kind === "armor") {
        out.part = g.part || (cat && cat.part) || "corpo";
        if (g.kind !== "armor" && cat) { out.nb = false; out.bonus = cat.armor; out.base = cat.armor; }
        out.worn = g.worn != null ? !!g.worn : true;
      }
      return out;
    });
  }
  // A versão de teste da carga tinha consumíveis como itens: viram Dados de Recurso.
  base.gear = base.gear.filter(function (g) {
    var k = R.KINDS.filter(function (x) { return x.name === g.name; })[0];
    if (!k || g.info.indexOf("Consumível") !== 0) return true;
    if (!base.resources[k.key]) base.resources[k.key] = 6;
    return false;
  });
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
  mode: "sheet",      // "sheet" | "combat" (só para quem pode ser mestre)
  canGM: false,
  clientId: null,
  combat: null,       // combate do mestre (initiative.js)
  resRolls: {},       // rollId -> chave do consumível sendo usado na bandeja
  lastRes: null,      // último uso de consumível, para mostrar na aba
  hit: null,          // painel "Fui atingido": { dmg, phase, values, result }
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

/* Aceita um id do catálogo ou o nome escrito (fichas antigas guardavam texto). */
function catalogId(list, value) {
  if (!value) return "";
  var v = String(value).trim().toLowerCase();
  for (var i = 0; i < list.length; i++) {
    if (list[i].id === v || list[i].name.toLowerCase() === v) return list[i].id;
  }
  return "";
}

/* Atributos em 0: o personagem está quebrado. */
function brokenAttrs() {
  return ATTRS.filter(function (a) { return app.sheet.attrs[a.key].cur === 0; });
}

/* O que significa cada atributo Acabado (resumo, sem texto do livro). */
var BROKEN_EFFECT = {
  forca: "Nocauteado: só consegue se arrastar e não rola perícias. Role um ferimento grave pelo tipo de dano sofrido.",
  agilidade: "Colapso de exaustão: só consegue se arrastar e não rola perícias.",
  astucia: "Paralisado de medo ou confusão: pode correr para um lugar seguro, mais nada, e não rola perícias. Role na tabela de horror, a não ser que tenha acabado por forçar uma rolagem.",
  empatia: "Desaba em desespero: não se comunica com ninguém até recuperar 1 ponto."
};
var BROKEN_RECOVERY = {
  forca: "Cura", agilidade: "Cura", astucia: "Atuação", empatia: "Atuação"
};
/* Atributos que impedem rolar perícias quando Acabados. */
var BLOCKS_SKILLS = { forca: true, agilidade: true, astucia: true };

function talentName(t) {
  var c = C.talent(t.id);
  return c ? c.name : t.name;
}
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
    if (!raw) return;
    var data = JSON.parse(raw);
    // A partir da 0.3.0 o arquivo guarda { sheet, combat }; antes, só a ficha.
    if (data && data.sheet) {
      app.sheet = migrate(data.sheet);
      if (data.combat && Array.isArray(data.combat.entries)) app.combat = data.combat;
    } else {
      app.sheet = migrate(data);
    }
  }).catch(function (err) {
    console.warn("Ficha nova (nada salvo ainda ou falha ao ler):", err);
  });
}

var saveTimer = null;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(function () {
    var raw = JSON.stringify({ v: 2, sheet: app.sheet, combat: app.combat || null });
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
  loadSheet().then(detectRole).catch(function (err) { console.warn(err); }).then(function () {
    render();
    if (!app.ts) return;
    sayHello();
    if (app.canGM) {
      syncSend({ t: "who" });
      if (app.combat && app.combat.phase !== "setup") broadcastState();
    }
  });
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
  shield: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6l7-3z"></path></svg>',
  copy: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"></rect><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"></path></svg>',
  star: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3z"></path></svg>',
  crack: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 2L9 10h5l-4 12"></path><path d="M6 6l-2 2M18 14l2 2"></path></svg>',
  close: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"></path></svg>',
  warn: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.5L2.5 20h19L12 3.5z"></path><path d="M12 10v4.5M12 17.5v.01"></path></svg>',
  cards: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="6" width="11" height="15" rx="2"></rect><path d="M8 6V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2h-5"></path></svg>',
  plus: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"></path></svg>',
  next: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"></path></svg>',
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
  var body = app.view === "roll" ? renderRoll()
    : app.mode === "combat" && app.canGM ? renderCombat()
    : app.mode === "session" && app.canGM ? renderSession()
    : renderSheet();
  root.innerHTML = '<div class="app">' + (app.view === "roll" ? "" : renderModeBar()) + body + "</div>";
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
    renderPlayerCombat(),
    renderBrokenBanner(),
    renderAttrs(),
    renderArmor(),
    renderInjuries(),
    renderWillpower(),
    renderRepXp(),
    renderConditions(),
    renderEvolveBar(),
    renderTabs(),
    app.tab === "skills" ? renderSkills()
      : app.tab === "gear" ? renderGear()
      : app.tab === "talents" ? renderTalents()
      : renderBackground()
  ].join("");
}

function renderHeader() {
  var s = app.sheet;
  return '<header class="who">' +
    '<div class="avatar" id="avatar" aria-hidden="true">' + esc(initials(s.name)) + "</div>" +
    '<div class="grow">' +
      '<label class="eyebrow" for="f-name" style="position:absolute;left:-9999px">Nome</label>' +
      '<input id="f-name" class="plain-input name" data-bind="name" placeholder="Nome do personagem" value="' + esc(s.name) + '">' +
      '<div class="row" style="gap:6px">' +
        selectHtml("kin", "Ascendência", C.KINS, s.kin) +
        selectHtml("profession", "Profissão", C.PROFESSIONS, s.profession) +
      "</div>" +
    "</div>" +
    (app.ts
      ? '<span class="pill"><span class="dot"></span>Na mesa</span>'
      : '<span class="pill offline" title="Aberto fora do TaleSpire"><span class="dot"></span>Navegador</span>') +
  "</header>";
}

function selectHtml(field, label, list, value) {
  return '<select class="plain-select" data-select="' + field + '" aria-label="' + label + '">' +
    '<option value="">' + label + "…</option>" +
    list.map(function (o) {
      return '<option value="' + o.id + '"' + (o.id === value ? " selected" : "") + ">" + esc(o.name) + "</option>";
    }).join("") + "</select>";
}

function renderBrokenBanner() {
  var broken = brokenAttrs();
  if (!broken.length) return "";
  return '<section class="banner" role="alert">' +
    '<div class="banner-title">' + ICON.warn + "<span>Fora de ação</span></div>" +
    broken.map(function (a) {
      return '<div class="banner-item"><strong>' + a.name + " Acabada.</strong> " + esc(BROKEN_EFFECT[a.key]) + "</div>" +
        injuryPrompt(a.key);
    }).join("") +
    (app.lastInjury ? renderLastInjury() : "") +
    '<div class="banner-foot">Para voltar: outro personagem rola ' +
    unique(broken.map(function (a) { return BROKEN_RECOVERY[a.key]; })).join(" ou ") +
    " em você (ação lenta) e cada sucesso devolve 1 ponto. Sem ajuda, você volta com 1 ponto depois de D6 horas. Marque a recuperação clicando nos quadradinhos do atributo.</div>" +
  "</section>";
}

/* ---------- Ferimentos Graves ---------- */

var DTYPES = [["corte", "Corte"], ["perfuracao", "Perfuração"], ["esmagamento", "Esmagamento"]];

function dtypeToggle(current, action) {
  return '<div class="seg dtype" role="group" aria-label="Tipo do golpe">' + DTYPES.map(function (d) {
    return '<button data-action="' + action + '" data-dtype="' + d[0] + '" aria-pressed="' + (current === d[0]) + '">' + d[1] + "</button>";
  }).join("") + "</div>";
}

function injuryPrompt(key) {
  var s = app.sheet;
  if (key !== "forca" && key !== "astucia") return "";
  if (s.injuryRolled[key] || app.injuryPending) {
    return app.injuryPending ? '<div class="notice" role="status">' + ICON.tray + "<span>Dados do ferimento na bandeja (dezena e unidade).</span></div>" : "";
  }
  if (key === "astucia") {
    return '<div class="injury-ask"><button class="btn-add danger" data-action="injRoll" data-table="horror">' + ICON.die + "Rolar ferimento de horror (D66)</button>" +
      '<button class="link-btn inline" data-action="injSkip" data-attr="astucia">Foi ao forçar: não rola</button></div>';
  }
  var table = J.BY_DAMAGE[s.lastDtype];
  return '<div class="injury-ask"><span class="small">Tipo do último golpe:</span>' + dtypeToggle(s.lastDtype, "injDtype") +
    '<button class="btn-add danger" data-action="injRoll" data-table="' + table + '">' + ICON.die + "Rolar ferimento grave · " + J.LABELS[table] + "</button>" +
    '<div class="row" style="gap:14px;flex-wrap:wrap">' +
      '<button class="link-btn inline" data-action="injAtypical">Dano atípico (fogo, frio…)</button>' +
      '<button class="link-btn inline" data-action="injSkip" data-attr="forca">Foi ao forçar: não rola</button></div></div>';
}

function renderLastInjury() {
  var x = app.lastInjury;
  return '<div class="injury-new"><div class="row between"><strong>' + esc(x.name) + '</strong><span class="small muted">' + J.LABELS[x.table] + " · " + x.code + "</span></div>" +
    '<div class="small">' + esc(x.effect) + "</div>" +
    (x.note ? '<div class="small muted">' + esc(x.note) + "</div>" : "") +
    (x.instant ? '<div class="small" style="color:#FF9C8C"><strong>O personagem morre.</strong></div>'
      : x.stored ? '<div class="small muted">Anotado em Ferimentos, logo abaixo da armadura.</div>' : '<div class="small muted">Sem efeito duradouro.</div>') +
    '<button class="link-btn inline" data-action="injDismiss">Ok</button></div>';
}

function rollInjury(table) {
  if (!app.ts) { applyInjury(table, 1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)); return; }
  app.injuryPending = true;
  render();
  TS.dice.putDiceInTray([{ name: "Dezena", roll: "1d6" }, { name: "Unidade", roll: "1d6" }], true).then(function (rollId) {
    app.resRolls[rollId] = "__inj:" + table;
  }).catch(function (err) {
    console.error(err);
    app.injuryPending = false;
    toast(trayError(err));
    render();
  });
}

function applyInjury(table, tens, units) {
  app.injuryPending = false;
  var s = app.sheet;
  var code = J.d66(tens, units);
  var row = J.lookup(table, code);
  if (!row) { render(); return; }
  var note = "";
  // Regra do elmo: certos resultados rolam o Valor de Armadura do elmo; um 6 troca por 11-12 concussivo.
  var head = wornArmor().head;
  if (J.helmetApplies(table, code) && head && head.bonus > 0) {
    var v = [];
    for (var i = 0; i < head.bonus; i++) v.push(1 + Math.floor(Math.random() * 6));
    if (v.indexOf(6) !== -1) {
      note = "O elmo salvou (" + v.join(" ") + "): era " + row.name + ". " + (head.name || "Elmo") + " ficou com Valor de Armadura 0.";
      if (head.base == null) head.base = head.bonus;
      head.bonus = 0;
      row = J.lookup("concussivo", 11);
      table = "concussivo"; code = 11;
    } else {
      note = "O elmo não ajudou (" + v.join(" ") + ").";
    }
  }
  var heal = row.heal && row.heal !== "perm" ? J.rollDice(row.heal) : null;
  var injury = {
    id: uid(), table: table, code: code, name: row.name, effect: row.effect, lethal: row.lethal, instant: row.instant,
    limit: row.lethal && row.limit ? J.rollLimit(row.limit) : "", healMod: row.healMod, saved: false,
    heal: heal, perm: row.heal === "perm", note: note
  };
  var lasting = injury.instant || injury.lethal || injury.perm || (heal != null && row.effect !== "Nenhum.");
  if (lasting && !injury.instant) s.injuries.push(injury);
  s.injuryRolled[table === "horror" ? "astucia" : "forca"] = true;
  app.lastInjury = injury;
  injury.stored = lasting && !injury.instant;
  save();
  render();
  chatInjury(injury);
}

function chatInjury(x) {
  if (!app.ts) return;
  var who = (app.sheet.name || "Personagem").replace(/[<>]/g, "");
  var text = "<b>" + who + "</b> · ferimento grave (" + J.LABELS[x.table] + (x.code ? " " + x.code : "") + "): <color=#E0604E><b>" + clean(x.name) + "</b></color>";
  if (x.instant) text += " · <color=#E0604E><b>morte imediata</b></color>";
  else if (x.lethal) text += " · <color=#E0604E><b>LETAL</b></color>, Cura em até " + x.limit + (x.healMod ? " (" + x.healMod + ")" : "");
  if (x.effect && x.effect !== "Nenhum." && !x.instant) text += "\n<size=85%>" + clean(x.effect) + (x.perm ? " Permanente." : x.heal ? " Cura em " + x.heal + " dias." : "") + "</size>";
  if (x.note) text += "\n<size=85%><color=#A89C88>" + clean(x.note) + "</color></size>";
  TS.chat.send(text, "board").catch(function () {});
}

function renderInjuries() {
  var list = app.sheet.injuries;
  if (!list.length) return "";
  return '<section class="card injuries" aria-label="Ferimentos graves"><h2 class="eyebrow">Ferimentos graves</h2>' + list.map(function (x) {
    var danger = x.lethal && !x.saved;
    var html = '<div class="injury' + (danger ? " lethal" : "") + '">' +
      '<div class="row between"><strong>' + esc(x.name) + '</strong><span class="small muted">' + (J.LABELS[x.table] || "") + "</span></div>" +
      '<div class="small">' + esc(x.effect) + "</div>";
    if (danger) {
      html += '<div class="small lethal-line">' + ICON.warn + "<span>Letal: alguém precisa ter sucesso em Cura em até <strong>" + esc(x.limit || "pouco tempo") + "</strong>" +
        (x.healMod ? " (Cura com " + x.healMod + ")" : "") + ", ou o personagem morre. Cada pessoa tenta só uma vez.</span></div>" +
        '<button class="btn-add" data-action="injSaved" data-id="' + esc(x.id) + '">Salvo pela Cura</button>';
    }
    html += '<div class="row between injury-heal">';
    if (x.perm) html += '<span class="small muted">Permanente</span>';
    else if (x.heal != null) {
      html += '<span class="small">Cura em <strong>' + E.plural(x.heal, "dia", "dias") + "</strong></span>" +
        '<span class="row" style="gap:6px">' +
          '<button class="btn-step" data-action="injDay" data-id="' + esc(x.id) + '" aria-label="Passou um dia"' + (x.heal <= 0 ? " disabled" : "") + ">−1</button>" +
          '<button class="link-btn inline" data-action="injCare" data-id="' + esc(x.id) + '" title="Sucesso em Cura durante a recuperação">Cuidados: metade</button>' +
        "</span>";
    } else html += "<span></span>";
    html += '<button class="link-btn inline" data-action="injRemove" data-id="' + esc(x.id) + '">' + (x.perm ? "Remover" : "Curado") + "</button></div>";
    return html + "</div>";
  }).join("") + "</section>";
}

function injuryById(id) { return app.sheet.injuries.filter(function (x) { return x.id === id; })[0] || null; }

function unique(list) { return list.filter(function (v, i) { return list.indexOf(v) === i; }); }

function renderAttrs() {
  return '<section class="attrs" aria-label="Atributos">' + ATTRS.map(function (a) {
    var v = app.sheet.attrs[a.key];
    var broken = v.cur === 0;
    var pips = "";
    for (var i = 0; i < v.max; i++) {
      pips += '<button class="pip' + (i < v.cur ? "" : " off") + '" data-action="setAttr" data-attr="' + a.key + '" data-value="' + (i + 1) +
        '" aria-label="' + a.name + " em " + (i + 1) + '"></button>';
    }
    return '<div class="card attr' + (broken ? " broken" : "") + '">' +
      '<div class="row between" style="align-items:flex-start">' +
        "<div>" +
          '<p class="eyebrow">' + a.name + (broken ? ' <span class="badge">Acabada</span>' : "") + "</p>" +
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
    '<div class="wp">' + boxes + "</div>" +
    '<div class="spend">' +
      '<label for="f-wp-for" class="sr-only">Gastar em</label>' +
      '<select id="f-wp-for" class="field grow"><option value="">Gastar em…</option>' +
        app.sheet.talentList.map(function (t) {
          var nm = C.talent(t.id) ? C.talent(t.id).name : (t.name || "Talento");
          return '<option value="' + esc(t.id) + '">' + esc(nm) + "</option>";
        }).join("") +
        '<option value="magia">Magia</option><option value="outro">Outra coisa</option>' +
      "</select>" +
      [1, 2, 3].map(function (n) {
        return '<button class="btn-spend" data-action="spendWp" data-n="' + n + '" aria-label="Gastar ' + n + ' PFV"' + (wp < n ? " disabled" : "") + ">−" + n + "</button>";
      }).join("") +
    "</div></section>";
}

/* ---------- Armadura e dano recebido ---------- */

function renderArmor() {
  var w = wornArmor(), h = app.hit;
  var parts = [];
  if (w.body) parts.push(esc(w.body.name || "Armadura") + " " + w.body.bonus);
  if (w.head) parts.push(esc(w.head.name || "Elmo") + " " + w.head.bonus);
  var html = '<section class="card armor" aria-label="Armadura">' +
    '<div class="row between">' +
      '<div><p class="eyebrow">Armadura</p>' +
        '<div class="row" style="gap:8px;align-items:baseline"><span class="stat-num">' + w.value + "</span>" +
        '<span class="small muted">' + (parts.length ? parts.join(" + ") : "nenhuma vestida") + "</span></div></div>" +
      (h ? "" : '<button class="btn-add" data-action="hitOpen">' + ICON.shield + "Fui atingido</button>") +
    "</div>";
  if (h) html += renderHit(h, w);
  return html + "</section>";
}

function renderHit(h, w) {
  var html = '<div class="hit">';
  if (h.phase === "setup") {
    html += '<div class="row between"><span>Dano do ataque</span><div class="stepper" style="gap:8px">' +
      '<button class="btn-step" data-action="hitDmg" data-delta="-1" aria-label="Menos dano"' + (h.dmg <= 1 ? " disabled" : "") + ">−</button>" +
      '<span class="stat-num" style="font-size:24px;min-width:28px">' + h.dmg + "</span>" +
      '<button class="btn-step" data-action="hitDmg" data-delta="1" aria-label="Mais dano">+</button></div></div>' +
      '<div class="row between"><span>Tipo do golpe</span></div>' + dtypeToggle(app.sheet.lastDtype, "hitDtype") +
      '<p class="small muted" style="margin:0">Só para dano físico de ataque. A armadura não protege de outros tipos de dano nem do dano por forçar. O tipo decide a tabela se a Força ficar Acabada.</p>' +
      '<div class="row" style="gap:8px">' +
        (w.value
          ? '<button class="btn-add" data-action="hitRoll">' + ICON.die + "Rolar armadura (" + E.plural(w.value, "dado", "dados") + ")</button>"
          : '<button class="btn-add" data-action="hitApply">Receber ' + h.dmg + " em Força</button>") +
        '<button class="btn-ghost slim" data-action="hitClose">Cancelar</button></div>';
  } else if (h.phase === "tray") {
    html += '<div class="notice" role="status">' + ICON.tray + "<span>Dados de armadura na bandeja. Jogue no tabuleiro.</span></div>" +
      '<button class="btn-ghost slim" data-action="hitClose">Cancelar</button>';
  } else {
    var r = h.result, a = app.sheet.attrs.forca;
    if (h.values) {
      html += '<div class="dice-row">' + h.values.map(function (v) {
        var cls = "die die-gear" + (v === 6 ? " success" : v === 1 && r.armorLoss ? " bane" : " dim");
        return '<span class="' + cls + '" role="img" aria-label="' + v + '">' + v + "</span>";
      }).join("") + "</div>";
    }
    html += '<div class="consequences">' +
      (h.values ? '<div><span class="mark" style="background:var(--success)"></span>A armadura bloqueou ' + r.blocked + " de " + h.dmg + "</div>" : "") +
      '<div><span class="mark" style="background:' + (r.taken ? "var(--bane)" : "var(--info)") + '"></span>' +
        (r.taken ? r.taken + " de dano em Força (agora " + a.cur + "/" + a.max + ")" : "Nenhum dano passou") + "</div>" +
      (h.armorNote ? '<div><span class="mark" style="background:var(--bane)"></span>' + esc(h.armorNote) + "</div>" : "") +
      (h.brokeStrength ? '<div><span class="mark" style="background:var(--bane)"></span><strong>Força Acabada: role o ferimento grave no aviso do topo</strong></div>' : "") +
    "</div>";
    if (h.chooseLoss) {
      html += '<p class="small" style="margin:0">A armadura perde ' + r.armorLoss + " (um ponto por 1 rolado). Qual peça sofre?</p>" +
        '<div class="row" style="gap:8px;flex-wrap:wrap">' +
          '<button class="btn-add danger" data-action="hitLoss" data-part="corpo">' + esc(w.body.name || "Armadura") + "</button>" +
          '<button class="btn-add danger" data-action="hitLoss" data-part="cabeca">' + esc(w.head.name || "Elmo") + "</button></div>";
    } else {
      html += '<button class="btn-ghost slim" data-action="hitClose">Fechar</button>';
    }
  }
  return html + "</div>";
}

function rollArmor() {
  var h = app.hit, n = wornArmor().value;
  if (!app.ts) {
    var v = [];
    for (var i = 0; i < n; i++) v.push(1 + Math.floor(Math.random() * 6));
    resolveHit(v);
    return;
  }
  h.phase = "tray";
  render();
  TS.dice.putDiceInTray([{ name: "Armadura", roll: n + "d6" }], true).then(function (rollId) {
    app.resRolls[rollId] = "__armor";
  }).catch(function (err) {
    console.error(err);
    if (app.hit) app.hit.phase = "setup";
    toast(trayError(err));
    render();
  });
}

/* values = faces da armadura (ou null sem armadura). Aplica o dano em Força. */
function resolveHit(values) {
  var h = app.hit;
  if (!h) return;
  var w = wornArmor();
  var r = values ? E.armorRoll(values, h.dmg) : { blocked: 0, taken: h.dmg, armorLoss: 0 };
  h.values = values; h.result = r; h.phase = "result";
  var a = app.sheet.attrs.forca, wasUp = a.cur > 0;
  a.cur = Math.max(0, a.cur - r.taken);
  h.brokeStrength = wasUp && a.cur === 0;
  if (h.brokeStrength) app.sheet.injuryRolled.forca = false;
  if (r.armorLoss) {
    if (w.body && w.head) h.chooseLoss = true;
    else applyArmorLoss((w.body || w.head).part);
  }
  save();
  render();
  chatHit();
}

function applyArmorLoss(part) {
  var h = app.hit, w = wornArmor();
  var piece = part === "cabeca" ? w.head : w.body;
  if (!piece) return;
  var loss = Math.min(h.result.armorLoss, piece.bonus);
  if (piece.base == null) piece.base = piece.bonus;
  piece.bonus -= loss;
  h.chooseLoss = false;
  h.armorNote = (piece.name || "Armadura") + (piece.bonus === 0 ? " quebrou" : " perdeu " + loss + " de Valor de Armadura (agora " + piece.bonus + ")");
  save();
}

function chatHit() {
  if (!app.ts) return;
  var h = app.hit, r = h.result, a = app.sheet.attrs.forca;
  var who = (app.sheet.name || "Personagem").replace(/[<>]/g, "");
  var text = "<b>" + who + "</b> foi atingido (" + h.dmg + ")" +
    (h.values ? " · armadura bloqueou " + r.blocked : "") + " · " +
    (r.taken ? "<color=#E0604E><b>" + r.taken + " de dano em Força</b></color>" : "<color=#5FB3BD>nenhum dano</color>") +
    (r.armorLoss ? " · armadura desgastou " + r.armorLoss : "");
  if (h.brokeStrength) text += "\n<color=#E0604E><b>FORÇA ACABADA · fora de ação</b></color>";
  if (h.values) text += "\n<size=85%><color=#A89C88>" + h.values.join(" ") + "</color></size>";
  TS.chat.send(text, "board").catch(function () {});
}

function renderRepXp() {
  var s = app.sheet;
  return '<section class="card repxp" aria-label="Reputação e experiência">' +
    '<div class="stat-row">' +
      '<span class="eyebrow">Reputação</span>' +
      '<div class="stepper">' +
        '<button class="btn-step" data-action="rep" data-delta="-1" aria-label="Diminuir Reputação"' + (s.reputation <= 0 ? " disabled" : "") + ">−</button>" +
        '<span class="stat-num">' + s.reputation + "</span>" +
        '<button class="btn-step" data-action="rep" data-delta="1" aria-label="Aumentar Reputação"' + (s.reputation >= MAX_REP ? " disabled" : "") + ">+</button>" +
      "</div>" +
      '<button class="btn-icon sm" data-action="repRoll" aria-label="Rolar Reputação" title="Ser reconhecido: role ' + s.reputation + 'd6, um 6 basta"' + (s.reputation ? "" : " disabled") + ">" + ICON.die + "</button>" +
    "</div>" +
    (app.lastRep ? '<div class="res-note' + (app.lastRep.known ? " good" : "") + '">' + esc(repText(app.lastRep)) + "</div>"
      : app.repPending ? '<div class="res-note">' + ICON.tray + "<span>Na bandeja.</span></div>" : "") +
    '<div class="stat-row">' +
      '<span class="eyebrow">Experiência</span>' +
      '<div class="stepper">' +
        '<button class="btn-step" data-action="xp" data-delta="-1" aria-label="Tirar 1 XP"' + (s.xp <= 0 ? " disabled" : "") + ">−</button>" +
        '<span class="stat-num" title="disponível / total ganho">' + s.xp + '<span class="stat-of">/' + s.xpTotal + "</span></span>" +
        '<button class="btn-step" data-action="xp" data-delta="1" aria-label="Ganhar 1 XP">+</button>' +
      "</div>" +
      (app.evolve ? '<span class="small muted">evoluindo</span>'
        : '<button class="btn-add slim" data-action="evolveStart"' + (s.xp ? "" : ' disabled title="Sem XP para gastar"') + ">Evoluir</button>") +
    "</div>" +
    '<div class="small muted">XP disponível / total ganho</div>' +
  "</section>";
}

/* ---------- Evoluir com XP ---------- */

/*
 * Modo explícito: enquanto ativo, perícias e talentos mostram o custo no
 * botão e cada compra desconta XP. Dá para desfazer as compras do modo.
 *   Perícia: 5 × o novo nível. Talento: 3 × a nova categoria. Talento novo: 3.
 */
function skillCost(level) { return 5 * (level + 1); }
function talentCost(rank) { return 3 * (rank + 1); }

function spendEvolve(cost, entry, what) {
  var s = app.sheet;
  if (s.xp < cost) { toast(what + " custa " + cost + " XP; você tem " + s.xp + "."); render(); return false; }
  s.xp -= cost;
  entry.cost = cost;
  entry.what = what;
  app.evolve.log.push(entry);
  return true;
}

function renderEvolveBar() {
  if (!app.evolve) return "";
  var log = app.evolve.log, spent = log.reduce(function (n, e) { return n + e.cost; }, 0);
  return '<section class="evolve-bar" aria-label="Evoluindo com XP">' +
    '<div class="row between"><strong>Evoluindo com XP</strong><span><strong class="init-inline">' + app.sheet.xp + "</strong> XP</span></div>" +
    '<div class="small muted">Perícia: 5 × o novo nível · Talento: 3 × a nova categoria · Talento novo: 3. ' +
      "Toque no custo ao lado de cada perícia ou talento. Pelo livro, gasta-se XP descansando ou dormindo.</div>" +
    (log.length ? '<div class="small">' + log.map(function (e) { return esc(e.what) + " (" + e.cost + ")"; }).join(" · ") + "</div>" : "") +
    '<div class="row" style="gap:8px">' +
      '<button class="btn-add" data-action="evolveDone">Concluir' + (spent ? " · " + spent + " XP" : "") + "</button>" +
      (log.length ? '<button class="btn-ghost slim" data-action="evolveUndo">Desfazer a última</button>' : "") +
    "</div></section>";
}

function evolveSkillButton(k, lvl) {
  if (lvl >= MAX_SKILL) return '<span class="evo-cost max">máx.</span>';
  var cost = skillCost(lvl), can = app.sheet.xp >= cost;
  return '<button class="evo-cost" data-action="evoSkill" data-skill="' + k + '"' + (can ? "" : " disabled") +
    ' aria-label="Subir ' + skillName(k) + " para " + (lvl + 1) + " por " + cost + ' XP">→ ' + (lvl + 1) + " · " + cost + " XP</button>";
}

function evolveTalentButton(t) {
  if (t.rank >= 3) return '<span class="evo-cost max">máx.</span>';
  var cost = talentCost(t.rank), can = app.sheet.xp >= cost;
  return '<button class="evo-cost" data-action="evoTalent" data-id="' + esc(t.id) + '"' + (can ? "" : " disabled") +
    ' aria-label="Subir ' + esc(talentName(t)) + " para a categoria " + (t.rank + 1) + " por " + cost + ' XP">→ ' + (t.rank + 1) + " · " + cost + " XP</button>";
}

function repText(r) {
  return r.known
    ? "Reconhecido! (" + r.values.join(" ") + ")"
    : "Ninguém o reconhece (" + r.values.join(" ") + ")";
}

/* Ser reconhecido: role tantos d6 quanto a Reputação; um 6 basta. */
function rollReputation() {
  var n = app.sheet.reputation;
  if (!n) return;
  app.lastRep = null;
  if (!app.ts) {
    var v = [];
    for (var i = 0; i < n; i++) v.push(1 + Math.floor(Math.random() * 6));
    applyReputation(v);
    return;
  }
  TS.dice.putDiceInTray([{ name: "Reputação", roll: n + "d6" }], true).then(function (rollId) {
    app.resRolls[rollId] = "__rep";
    app.repPending = true;
    render();
  }).catch(function (err) { console.error(err); toast(trayError(err)); });
}

function applyReputation(values) {
  app.repPending = false;
  app.lastRep = { values: values, known: values.indexOf(6) !== -1 };
  render();
  if (app.ts) {
    var who = (app.sheet.name || "Personagem").replace(/[<>]/g, "");
    TS.chat.send("<b>" + who + "</b> · Reputação " + app.sheet.reputation + ": " +
      (app.lastRep.known ? "<color=#E8B84A><b>reconhecido!</b></color>" : "ninguém o reconhece") +
      " <size=85%><color=#A89C88>(" + values.join(" ") + ")</color></size>", "board").catch(function () {});
  }
}

/*
 * Efeitos das condições (resumo próprio do Manual do Jogador, capítulo 5).
 * blocks: atributos que não se recuperam (exceto por magia).
 * tick: dano periódico, aplicado pelo botão.
 */
var CONDITION_INFO = {
  faminto: { blocks: ["forca"], tick: { label: "Passou uma semana", dmg: { forca: 1 } },
    text: "Não recupera Força (só por magia). 1 de dano em Força por semana; Acabado assim, morre depois de mais uma semana sem comer. Comer acaba com a condição." },
  sedento: { blocks: ["forca", "agilidade", "astucia", "empatia"], tick: { label: "Passou um dia", dmg: { forca: 1, agilidade: 1 } },
    text: "Não recupera nenhum atributo (só por magia). 1 de dano em Força e Agilidade por dia; Acabado assim, morre depois de mais um dia sem água. Beber acaba com a condição." },
  exausto: { blocks: ["astucia"], tick: { label: "Passou um dia", dmg: { astucia: 1 } },
    text: "Não recupera Astúcia (só por magia). 1 de dano em Astúcia por dia; se ficar Acabado assim, desmaia e dorme. Dormir um Quarto de Dia acaba com a condição." },
  congelando: { blocks: ["forca", "astucia"], tick: { label: "Falhou em Resiliência", dmg: { forca: 1, astucia: 1 } },
    text: "Não recupera Força nem Astúcia. Role Resiliência nos intervalos do frio; cada falha causa 1 de dano em Força e Astúcia. Acabado assim, morre na próxima rolagem. Pode alucinar." }
};

function applyConditionDamage(cond, label) {
  var dmg = CONDITION_INFO[cond].tick.dmg, parts = [], broke = [];
  Object.keys(dmg).forEach(function (k) {
    var a = app.sheet.attrs[k], was = a.cur;
    a.cur = Math.max(0, a.cur - dmg[k]);
    if (was > a.cur) parts.push((was - a.cur) + " em " + attrByKey(k).name);
    if (was > 0 && a.cur === 0) broke.push(attrByKey(k).name);
  });
  toast(label + ": " + (parts.length ? parts.join(", ") : "nenhum dano (já em 0)") + (broke.length ? " · " + broke.join(" e ") + " Acabada" : "") + ".");
  if (app.ts && parts.length) {
    var who = (app.sheet.name || "Personagem").replace(/[<>]/g, "");
    TS.chat.send("<b>" + who + "</b> · " + label + ": <color=#E0604E>" + parts.join(", ") + "</color>" +
      (broke.length ? "\n<color=#E0604E><b>" + broke.join(" e ").toUpperCase() + " ACABADA</b></color>" : ""), "board").catch(function () {});
  }
}

function blockedBy(attrKey) {
  return CONDITIONS.filter(function (c) {
    return app.sheet.conditions[c[0]] && CONDITION_INFO[c[0]].blocks.indexOf(attrKey) !== -1;
  }).map(function (c) { return c[1]; });
}

function renderConditions() {
  var active = CONDITIONS.filter(function (c) { return app.sheet.conditions[c[0]]; });
  return '<section aria-label="Condições"><h2 class="eyebrow" style="margin-bottom:8px">Condições</h2><div class="conds">' +
    CONDITIONS.map(function (c) {
      return '<button class="toggle" data-action="toggleCond" data-cond="' + c[0] + '" aria-pressed="' + !!app.sheet.conditions[c[0]] + '">' + c[1] + "</button>";
    }).join("") + "</div>" +
    (active.length ? '<div class="cond-info">' + active.map(function (c) {
      var info = CONDITION_INFO[c[0]];
      var dmg = Object.keys(info.tick.dmg).map(function (k) { return info.tick.dmg[k] + " " + attrByKey(k).name; }).join(", ");
      return '<div class="cond-item"><strong>' + c[1] + ".</strong> " + esc(info.text) +
        '<button class="link-btn inline" data-action="condTick" data-cond="' + c[0] + '">' + info.tick.label + ": aplicar " + dmg + "</button></div>";
    }).join("") + "</div>" : "") +
  "</section>";
}

function renderTabs() {
  var tabs = [["skills", "Perícias"], ["gear", "Equipamento"], ["talents", "Talentos"], ["background", "Histórico"]];
  return '<nav class="tabs" role="tablist" aria-label="Seções da ficha">' + tabs.map(function (t) {
    var warn = t[0] === "gear" && loadStatus().over;
    return '<button role="tab" data-action="tab" data-tab="' + t[0] + '" aria-selected="' + (app.tab === t[0]) + '"' +
      (warn ? ' title="Sobrecarregado"' : "") + ">" + t[1] + (warn ? ' <span class="dot-warn" aria-label="sobrecarregado"></span>' : "") + "</button>";
  }).join("") + "</nav>";
}

function renderSkills() {
  return '<section class="skill-groups" role="tabpanel" aria-label="Perícias">' + ATTRS.map(function (a) {
    var cur = app.sheet.attrs[a.key].cur;
    return '<div class="skill-group">' +
      '<div class="row between"><h3>' + a.name + "</h3>" +
        (cur === 0
          ? '<span class="badge">Acabada</span>'
          : '<span class="small muted">' + E.plural(cur, "dado", "dados") + " de atributo</span>") +
      "</div>" +
      a.skills.map(function (sk) {
        var lvl = app.sheet.skills[sk[0]];
        return '<div class="skill-row">' +
          '<span class="name">' + sk[1] + "</span>" +
          (app.evolve
            ? '<span class="level" aria-label="Nível ' + lvl + '">' + lvl + "</span>" + evolveSkillButton(sk[0], lvl)
            : '<button class="btn-step" data-action="skill" data-skill="' + sk[0] + '" data-delta="-1" aria-label="Diminuir ' + sk[1] + '"' + (lvl <= 0 ? " disabled" : "") + ">−</button>" +
              '<span class="level" aria-label="Nível ' + lvl + '">' + lvl + "</span>" +
              '<button class="btn-step" data-action="skill" data-skill="' + sk[0] + '" data-delta="1" aria-label="Aumentar ' + sk[1] + '"' + (lvl >= MAX_SKILL ? " disabled" : "") + ">+</button>") +
          '<button class="btn-icon sm" data-action="openRoll" data-attr="' + a.key + '" data-skill="' + sk[0] + '" aria-label="Rolar ' + sk[1] + '">' + ICON.die + "</button>" +
        "</div>";
      }).join("") +
    "</div>";
  }).join("") + "</section>";
}

function renderGear() {
  var rows = app.sheet.gear.map(function (g) {
    var broken = !g.nb && g.bonus === 0;
    var damaged = !g.nb && g.base != null && g.bonus < g.base;
    var sub, armor = g.kind === "armor";
    var where = g.part === "cabeca" ? "Cabeça" : "Corpo";
    if (g.nb) sub = g.info ? esc(g.info) : "Sem Bônus de Equipamento";
    else if (armor && broken) sub = '<span class="badge">Quebrada</span> não protege até ser consertada';
    else if (armor && damaged) sub = "Danificada · Valor de Armadura " + g.bonus + " de " + g.base + " · " + where;
    else if (armor) sub = "Valor de Armadura " + g.bonus + " · " + where;
    else if (broken) sub = '<span class="badge">Quebrado</span> não dá dados até ser reparado';
    else if (damaged) sub = "Danificado · bônus " + g.bonus + " de " + g.base + (g.info ? " · " + esc(g.info) : "");
    else sub = g.info ? esc(g.info) : "Bônus de Equipamento";
    if (armor) {
      sub += ' · <button class="link-btn inline" data-action="gearWear" data-id="' + esc(g.id) + '" aria-pressed="' + !!g.worn + '">' +
        (g.worn ? "Vestida" : "Guardada (vestir)") + "</button>";
    }
    if (damaged) sub += ' · <button class="link-btn inline" data-action="gearRepair" data-id="' + esc(g.id) + '">Reparar</button>';
    // Só itens fora do catálogo podem ganhar bônus (os do livro já vêm certos).
    if (g.nb && !(C.gearByName && C.gearByName(g.name))) {
      sub += ' · <button class="link-btn inline" data-action="gearGiveBonus" data-id="' + esc(g.id) + '">Tem bônus</button>';
    }

    var controls = g.nb ? "" :
      '<button class="btn-step btn-damage" data-action="gearDamage" data-id="' + esc(g.id) + '" title="Danificar (−1 de bônus)" aria-label="Danificar ' + esc(g.name || "item") + ', menos 1 de bônus"' + (g.bonus <= 0 ? " disabled" : "") + ">" + ICON.crack + "</button>" +
      '<button class="btn-step" data-action="gearBonus" data-id="' + esc(g.id) + '" data-delta="-1" aria-label="Diminuir bônus"' + (g.bonus <= 0 ? " disabled" : "") + ">−</button>" +
      '<span class="level" aria-label="Bônus ' + g.bonus + '">' + g.bonus + "</span>" +
      '<button class="btn-step" data-action="gearBonus" data-id="' + esc(g.id) + '" data-delta="1" aria-label="Aumentar bônus">+</button>';

    return '<div class="list-row' + (broken ? " broken" : "") + '">' +
      '<div class="grow">' +
        '<input class="plain-input" data-bind="gear.name" data-id="' + esc(g.id) + '" aria-label="Nome do item" placeholder="Nome do item" value="' + esc(g.name) + '">' +
        '<div class="small muted">' + sub + "</div>" +
      "</div>" +
      weightSelect(g) +
      controls +
      '<button class="btn-icon sm" data-action="gearRemove" data-id="' + esc(g.id) + '" aria-label="Remover ' + esc(g.name || "item") + '">' + ICON.close + "</button>" +
    "</div>";
  }).join("");

  var picker = '<option value="">Escolha um item…</option>' +
    C.GEAR.map(function (grp) {
      return '<optgroup label="' + esc(grp.group) + '">' + grp.items.map(function (it) {
        var bits = [];
        if (it.bonus != null) bits.push("bônus " + it.bonus);
        if (it.weight && it.weight !== "normal") bits.push(W.WEIGHTS[it.weight].label.toLowerCase());
        return '<option value="' + it.id + '">' + esc(it.name) + (bits.length ? " (" + bits.join(", ") + ")" : "") + "</option>";
      }).join("") + "</optgroup>";
    }).join("") +
    '<option value="__custom">Outro item (escrever o nome)</option>';

  return '<section role="tabpanel" aria-label="Equipamento" class="stack">' +
    renderLoad() +
    renderCoins() +
    renderResources() +
    '<h2 class="section-title">Itens</h2>' +
    '<div class="list">' + (rows || '<p class="muted" style="margin:0">Nenhum item ainda.</p>') + "</div>" +
    '<div class="adder"><label for="f-add-gear" class="sr-only">Adicionar item</label>' +
      '<select id="f-add-gear" class="field grow">' + picker + "</select>" +
      '<button class="btn-add" data-action="gearAdd">Adicionar</button></div>' +
    '<p class="small muted" style="margin:0">O Bônus de Equipamento vira dados na rolagem. Se você forçar e tirar 1 neles, o bônus cai; em 0 o item quebra. Mochila, saco, cantil e aljava não contam na carga.</p>' +
  "</section>";
}

/* ---------- Consumíveis (Dados de Recurso) ---------- */

/* Moedas: uma a uma não pesam; cada 100 moedas valem meio item (100 leve, 200 normal, 400 pesado). */
function coinTotal() { var c = app.sheet.coins; return c.cobre + c.prata + c.ouro; }
function coinWeight() { return Math.floor(coinTotal() / 100) * 0.5; }

function renderCoins() {
  var c = app.sheet.coins, w = coinWeight();
  var value = c.cobre + c.prata * 10 + c.ouro * 100; // em cobre
  return '<section class="stack" aria-label="Moedas"><div class="row between"><h2 class="section-title" style="margin:0">Moedas</h2>' +
    '<span class="small muted">' + (w ? "pesam " + W.fmt(w) + " na carga" : "ainda não pesam") + "</span></div>" +
    '<div class="coins">' + [["cobre", "Cobre"], ["prata", "Prata"], ["ouro", "Ouro"]].map(function (k) {
      return '<label class="coin"><span class="small muted">' + k[1] + "</span>" +
        '<input class="field" type="number" min="0" inputmode="numeric" data-coin="' + k[0] + '" value="' + c[k[0]] + '"></label>';
    }).join("") + "</div>" +
    '<p class="small muted" style="margin:0">Valem ' + fmtMoney(value) + ". 10 cobres = 1 prata, 10 pratas = 1 ouro. A cada 100 moedas, meio item de carga.</p></section>";
}

function fmtMoney(copper) {
  var o = Math.floor(copper / 100), p = Math.floor((copper % 100) / 10), c = copper % 10, out = [];
  if (o) out.push(o + " ouro");
  if (p) out.push(p + (p === 1 ? " prata" : " pratas"));
  if (c || !out.length) out.push(c + (c === 1 ? " cobre" : " cobres"));
  return out.join(", ");
}

function renderResources() {
  var res = app.sheet.resources;
  var busy = Object.keys(app.resRolls).length > 0;
  var rows = R.KINDS.map(function (k) {
    var d = res[k.key];
    var pending = Object.keys(app.resRolls).some(function (id) { return app.resRolls[id] === k.key; });
    var last = app.lastRes && app.lastRes.key === k.key ? app.lastRes : null;
    var note = "";
    if (pending) note = '<div class="res-note">' + ICON.tray + "<span>D" + d + " na bandeja. Jogue no tabuleiro.</span></div>";
    else if (last) note = '<div class="res-note' + (last.dropped ? " bad" : "") + '">' + esc(resText(last)) + "</div>";
    return '<div class="res-row' + (d ? "" : " none") + '">' +
      '<div class="grow"><div class="item-name">' + k.name + "</div>" + note + "</div>" +
      '<button class="btn-step" data-action="resStep" data-key="' + k.key + '" data-delta="-1" aria-label="Diminuir Dado de Recurso de ' + k.name + '"' + (d ? "" : " disabled") + ">−</button>" +
      '<span class="res-die' + (d ? "" : " empty") + '" aria-label="' + (d ? "D" + d : "sem dado") + '">' + (d ? "D" + d : "—") + "</span>" +
      '<button class="btn-step" data-action="resStep" data-key="' + k.key + '" data-delta="1" aria-label="Aumentar Dado de Recurso de ' + k.name + '"' + (d >= 12 ? " disabled" : "") + ">+</button>" +
      '<button class="btn-use" data-action="resUse" data-key="' + k.key + '"' + (d && !busy ? "" : " disabled") + ">Usar</button>" +
    "</div>";
  }).join("");
  return '<section class="stack res" aria-label="Consumíveis">' +
    '<div class="row between"><h2 class="section-title" style="margin:0">Consumíveis</h2>' +
    '<span class="small muted">cada um com dado vale 1 item</span></div>' +
    '<div class="list">' + rows + "</div>" +
    '<p class="small muted" style="margin:0">Ao usar, rola o Dado de Recurso: com 1 ou 2 ele desce um passo, e no D6 o recurso acaba. Achou ou comprou uma unidade? Use o + para subir um passo.</p>' +
  "</section>";
}

function resText(u) {
  var k = R.kind(u.key);
  if (!u.dropped) return "Rolou " + u.value + " no D" + u.before + ": continua D" + u.before + ".";
  if (u.empty) return "Rolou " + u.value + " no D6: " + k.gone + ".";
  return "Rolou " + u.value + " no D" + u.before + ": desceu para D" + u.after + ".";
}

function useResource(key) {
  var sides = app.sheet.resources[key];
  if (!sides) return;
  if (!app.ts) { applyResource(key, R.roll(sides)); return; }
  var k = R.kind(key);
  app.lastRes = null;
  TS.dice.putDiceInTray([{ name: k.name, roll: "1d" + sides }], true).then(function (rollId) {
    app.resRolls[rollId] = key;
    render();
  }).catch(function (err) {
    console.error(err);
    toast(trayError(err));
  });
}

function handleResourceRoll(ev) {
  var key = app.resRolls[ev.payload.rollId];
  delete app.resRolls[ev.payload.rollId];
  if (key && key.indexOf("__inj:") === 0) {
    if (ev.kind === "rollResults") {
      var groups = (ev.payload.resultsGroups || []).map(readGroup);
      var pair = matchGroups([{ name: "Dezena", count: 1 }, { name: "Unidade", count: 1 }], groups);
      var t = pair[0].values[0], u = pair[1].values[0];
      if (t && u) { applyInjury(key.slice(6), t, u); return; }
    }
    app.injuryPending = false;
    render();
    return;
  }
  if (key === "__armor") {
    if (ev.kind === "rollResults" && app.hit) {
      var ga = (ev.payload.resultsGroups || []).map(readGroup)[0];
      if (ga) { resolveHit(ga.values); return; }
    }
    if (app.hit) app.hit.phase = "setup";
    render();
    return;
  }
  if (key === "__rep") {
    if (ev.kind === "rollResults") {
      var g = (ev.payload.resultsGroups || []).map(readGroup)[0];
      if (g && g.values.length) { applyReputation(g.values); return; }
    }
    app.repPending = false;
    render();
    return;
  }
  if (ev.kind === "rollResults") {
    var values = (ev.payload.resultsGroups || []).map(readGroup)[0];
    var v = values && values.values[0];
    if (v != null) { applyResource(key, v); return; }
  }
  render();
}

function applyResource(key, value) {
  var u = R.use(app.sheet.resources[key], value);
  if (!u) return;
  u.key = key;
  app.sheet.resources[key] = u.after;
  app.lastRes = u;
  save();
  render();
  if (app.ts) {
    var k = R.kind(key);
    var who = (app.sheet.name || "Personagem").replace(/[<>]/g, "");
    var tail = !u.dropped ? "continua D" + u.before
      : u.empty ? "<color=#E0604E><b>" + k.gone + "</b></color>"
      : "<color=#E0604E>desceu para D" + u.after + "</color>";
    TS.chat.send("<b>" + who + "</b> " + k.verb + " · D" + u.before + ": " + u.value + " · " + tail, "board").catch(function () {});
  }
}

function weightSelect(g) {
  return '<label class="sr-only" for="w-' + esc(g.id) + '">Peso de ' + esc(g.name || "item") + "</label>" +
    '<select id="w-' + esc(g.id) + '" class="weight-select w-' + g.weight + '" data-weight="' + esc(g.id) + '" title="Peso na carga">' +
    W.ORDER.map(function (k) {
      return '<option value="' + k + '"' + (g.weight === k ? " selected" : "") + ">" + W.WEIGHTS[k].label + "</option>";
    }).join("") + "</select>";
}

function renderLoad() {
  var st = loadStatus();
  var cap = Math.max(st.capacity, 1);
  var pct = Math.min(100, (st.used / cap) * 100);
  var detail = "Força " + app.sheet.attrs.forca.max + " × 2" + (st.packerBonus ? " + Empacotador " + st.packerBonus : "");
  var html = '<section class="load' + (st.over ? " over" : "") + '" aria-label="Carga">' +
    '<div class="row between"><span class="eyebrow">Carga</span>' +
      '<span class="load-num"><strong>' + W.fmt(st.used) + "</strong> de " + st.capacity + " itens</span></div>" +
    '<div class="load-bar" role="meter" aria-valuemin="0" aria-valuemax="' + st.capacity + '" aria-valuenow="' + st.used + '" aria-label="Carga ' + W.fmt(st.used) + " de " + st.capacity + '"><span style="width:' + pct + '%"></span></div>' +
    '<div class="small muted">' + detail + (st.over ? "" : " · cabem mais " + W.fmt(st.free)) + "</div>" +
  "</section>";
  if (st.over) {
    html += '<div class="banner" role="alert"><div class="banner-title">' + ICON.warn + "<span>Sobrecarregado</span></div>" +
      '<div class="banner-item">' + W.fmt(st.used - st.capacity) + " acima da capacidade. Para correr em combate ou caminhar por um Quarto de Dia, role Resiliência. Se falhar, largue o que carrega, fique parado ou sofra 1 de dano em Agilidade.</div></div>";
  }
  return html;
}

function renderTalents() {
  var s = app.sheet;
  var chosen = {};
  s.talentList.forEach(function (t) { chosen[t.id] = true; });

  var rows = s.talentList.map(function (t) {
    var c = C.talent(t.id);
    var group = !c ? "Personalizado" : c.group === "kin" ? "Ascendência" : c.group === "profession" ? "Profissão" : "Geral";
    var ranked = !c || c.group !== "kin";
    return '<div class="list-row">' +
      '<div class="grow">' +
        (c ? '<div class="item-name">' + esc(c.name) + "</div>"
           : '<input class="plain-input" data-bind="talent.name" data-id="' + esc(t.id) + '" aria-label="Nome do talento" placeholder="Nome do talento" value="' + esc(t.name) + '">') +
        '<div class="small muted">' + group + (ranked ? " · Categoria " + t.rank : "") + "</div>" +
      "</div>" +
      (ranked && app.evolve
        ? '<span class="level" aria-label="Categoria ' + t.rank + '">' + t.rank + "</span>" + evolveTalentButton(t)
        : ranked
        ? '<button class="btn-step" data-action="talentRank" data-id="' + esc(t.id) + '" data-delta="-1" aria-label="Diminuir categoria"' + (t.rank <= 1 ? " disabled" : "") + ">−</button>" +
          '<span class="level" aria-label="Categoria ' + t.rank + '">' + t.rank + "</span>" +
          '<button class="btn-step" data-action="talentRank" data-id="' + esc(t.id) + '" data-delta="1" aria-label="Aumentar categoria"' + (t.rank >= 3 ? " disabled" : "") + ">+</button>"
        : "") +
      '<button class="btn-icon sm" data-action="talentRemove" data-id="' + esc(t.id) + '" aria-label="Remover talento">' + ICON.close + "</button>" +
    "</div>";
  }).join("");

  function opts(list) {
    return list.filter(function (t) { return !chosen[t.id]; }).map(function (t) {
      return '<option value="' + t.id + '">' + esc(t.name) + "</option>";
    }).join("");
  }
  var kin = C.kin(s.kin);
  var groups = [];
  if (kin) groups.push(["Da sua ascendência", C.TALENTS.filter(function (t) { return t.id === kin.talent; })]);
  if (s.profession) groups.push(["Da sua profissão", C.TALENTS.filter(function (t) { return t.profession === s.profession; })]);
  groups.push(["Gerais", C.TALENTS.filter(function (t) { return t.group === "general"; })]);
  groups.push(["De outras profissões", C.TALENTS.filter(function (t) { return t.group === "profession" && t.profession !== s.profession; })]);
  var picker = '<option value="">Escolha um talento…</option>' +
    groups.map(function (g) {
      var o = opts(g[1]);
      return o ? '<optgroup label="' + g[0] + '">' + o + "</optgroup>" : "";
    }).join("") +
    '<option value="__custom">Outro talento (escrever o nome)</option>';

  return '<section role="tabpanel" aria-label="Talentos" class="stack">' +
    '<div class="list">' + (rows || '<p class="muted" style="margin:0">Nenhum talento ainda. Escolher a ascendência já adiciona o talento dela.</p>') + "</div>" +
    '<div class="adder"><label for="f-add-talent" class="sr-only">Adicionar talento</label>' +
      '<select id="f-add-talent" class="field grow">' + picker + "</select>" +
      '<button class="btn-add" data-action="talentAdd">' + (app.evolve ? "Aprender · 3 XP" : "Adicionar") + "</button></div>" +
  "</section>";
}

function prideStatus() {
  var s = app.sheet;
  if (s.prideLost) {
    return '<div class="notice error">' + ICON.warn + '<span class="grow">Orgulho perdido. Jogue uma sessão inteira sem ele, depois escolha outro.</span>' +
      '<button class="link-btn inline" data-action="newPride">Escolher outro</button></div>';
  }
  if (!s.pride.trim()) return "";
  if (s.prideUsedSession) {
    return '<div class="notice">' + ICON.star + '<span class="grow">Já usado nesta sessão.</span>' +
      '<button class="link-btn inline" data-action="newSession">Nova sessão</button></div>';
  }
  return '<div class="notice">' + ICON.star + "<span>Disponível nesta sessão. Use pela tela de resultado quando um teste de perícia falhar.</span></div>";
}

/* ---------- Cópia de segurança ---------- */

var BACKUP_KEY = "ficha-forbidden-lands";

function exportText() {
  return JSON.stringify({ "ficha-forbidden-lands": 1, exportedAt: new Date().toISOString(), sheet: app.sheet });
}

/* Aceita o texto exportado, o arquivo salvo pelo Symbiote ou uma ficha crua. */
function parseImport(text) {
  var data;
  try { data = JSON.parse(String(text || "").trim()); } catch (e) { return null; }
  if (!data || typeof data !== "object") return null;
  var sheet = data.sheet && typeof data.sheet === "object" ? data.sheet : data;
  if (!sheet.attrs && !sheet.skills && !sheet.name) return null;
  return migrate(sheet);
}

function renderBackup() {
  var b = app.backup || {};
  var html = '<h2 class="section-title">Cópia de segurança</h2>' +
    '<p class="small muted" style="margin:0">Guarde uma cópia da ficha antes de atualizar o Symbiote, ou para levá-la a outra campanha ou outro computador. A cópia é um texto: cole num bloco de notas ou numa mensagem para você mesmo.</p>' +
    '<div class="row" style="gap:8px;flex-wrap:wrap">' +
      '<button class="btn-add" data-action="backupExport">' + ICON.copy + "Exportar ficha</button>" +
      '<button class="btn-ghost slim" data-action="backupOpenImport">Importar ficha</button>' +
    "</div>";

  if (b.exported) {
    html += '<div class="bg-field"><label class="eyebrow" for="f-export">Ficha exportada</label>' +
      '<p class="small muted" style="margin:2px 0 6px">' + (b.copied ? "Já está na área de transferência. Se não colar, selecione o texto abaixo e copie." : "Selecione o texto abaixo e copie.") + "</p>" +
      '<textarea id="f-export" class="field mono" rows="4" readonly>' + esc(b.exported) + "</textarea></div>";
  }

  if (b.importing) {
    html += '<div class="bg-field"><label class="eyebrow" for="f-import">Colar ficha</label>' +
      '<textarea id="f-import" class="field mono" rows="4" placeholder="Cole aqui o texto exportado">' + esc(b.text || "") + "</textarea></div>";
    if (b.error) html += '<div class="notice error">' + ICON.warn + "<span>" + esc(b.error) + "</span></div>";
    if (b.preview) {
      html += '<div class="banner"><div class="banner-title">' + ICON.warn + "<span>Substituir a ficha atual?</span></div>" +
        '<div class="banner-item">A ficha <strong>' + esc(app.sheet.name || "sem nome") + "</strong> desta campanha será trocada por <strong>" +
        esc(b.preview.name || "sem nome") + "</strong>. Exporte a atual antes, se quiser guardá-la.</div>" +
        '<div class="row" style="gap:8px"><button class="btn-add danger" data-action="backupConfirm">Substituir</button>' +
        '<button class="btn-ghost slim" data-action="backupCancel">Cancelar</button></div></div>';
    } else {
      html += '<div class="row" style="gap:8px"><button class="btn-add" data-action="backupCheck">Importar</button>' +
        '<button class="btn-ghost slim" data-action="backupCancel">Cancelar</button></div>';
    }
  }
  return html;
}

function copyText(text) {
  if (app.ts && TS.system && TS.system.clipboard) {
    return TS.system.clipboard.setText(text).then(function () { return true; }, function () { return false; });
  }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return false; });
  }
  return Promise.resolve(false);
}

function renderBackground() {
  var s = app.sheet;
  function text(key, label, hint, rows) {
    return '<div class="bg-field"><label class="eyebrow" for="f-' + key + '">' + label + "</label>" +
      (hint ? '<p class="small muted" style="margin:2px 0 6px">' + hint + "</p>" : "") +
      '<textarea id="f-' + key + '" class="field" rows="' + (rows || 2) + '" data-bind="' + key + '">' + esc(s[key]) + "</textarea></div>";
  }
  return '<section role="tabpanel" aria-label="Histórico" class="stack">' +
    '<div class="bg-field"><span class="eyebrow">Idade</span>' +
      '<div class="seg" role="group" aria-label="Idade" style="grid-template-columns:repeat(3,minmax(0,1fr));margin-top:8px">' +
      AGES.map(function (a) {
        return '<button data-action="setAge" data-age="' + a[0] + '" aria-pressed="' + (s.age === a[0]) + '">' + a[1] + "</button>";
      }).join("") + "</div></div>" +
    '<h2 class="section-title">Aparência</h2>' +
    text("face", "Rosto", "", 2) +
    text("body", "Corpo", "", 2) +
    text("clothes", "Roupas", "", 2) +
    '<h2 class="section-title">Quem é</h2>' +
    text("pride", "Orgulho", "Uma vez por sessão, ao falhar numa rolagem ligada a ele, role um D12 extra. Se falhar mesmo assim, você perde o Orgulho.", 2) +
    prideStatus() +
    text("darkSecret", "Segredo Sombrio", "", 2) +
    text("relationships", "Relacionamentos", "Uma linha por personagem da mesa.", 4) +
    text("talents", "Anotações", "", 6) +
    renderBackup() +
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

/* Fichas antigas não tinham peso: usa o do catálogo pelo nome, ou normal. */
function guessWeight(name) {
  var it = C.gearByName && C.gearByName(name);
  return it && it.weight ? it.weight : "normal";
}

function packerRank() {
  var t = app.sheet.talentList.filter(function (x) { return x.id === "empacotador"; })[0];
  return t ? t.rank : 0;
}

function loadStatus() {
  var s = app.sheet;
  // Cada consumível que ainda tem dado conta como um item normal.
  var consumables = R.KINDS.filter(function (k) { return s.resources[k.key] > 0; })
    .map(function () { return { weight: "normal" }; });
  // Moedas: meio item a cada 100.
  var coins = [];
  for (var i = 0; i < Math.floor(coinTotal() / 100); i++) coins.push({ weight: "leve" });
  return W.status(s.gear.concat(consumables, coins), s.attrs.forca.max, packerRank());
}

/* Itens com Bônus de Equipamento (os que podem entrar numa rolagem). */
function bonusGear() { return app.sheet.gear.filter(function (g) { return !g.nb && g.kind !== "armor"; }); }

/* Armadura vestida: soma o corpo e o elmo (uma peça de cada). */
function wornArmor() {
  var body = null, head = null;
  app.sheet.gear.forEach(function (g) {
    if (g.kind !== "armor" || !g.worn) return;
    if (g.part === "cabeca") { if (!head) head = g; } else if (!body) body = g;
  });
  return { body: body, head: head, value: (body ? body.bonus : 0) + (head ? head.bonus : 0) };
}

function talentById(id) { return app.sheet.talentList.filter(function (t) { return t.id === id; })[0] || null; }

function focusLast(selector) {
  setTimeout(function () {
    var els = document.querySelectorAll(selector);
    if (els.length) els[els.length - 1].focus();
  }, 0);
}

/* Trocar a ascendência troca o talento de ascendência. */
function setKin(id) {
  var s = app.sheet;
  s.talentList = s.talentList.filter(function (t) {
    var c = C.talent(t.id);
    return !(c && c.group === "kin");
  });
  s.kin = id;
  var kin = C.kin(id);
  if (kin && C.talent(kin.talent)) s.talentList.unshift({ id: kin.talent, rank: 1 });
}

function gearById(id) { return app.sheet.gear.filter(function (g) { return g.id === id; })[0] || null; }

function rollTitle(r) {
  return r.skillKey ? skillName(r.skillKey) : attrByKey(r.attrKey).name;
}

function renderRoll() {
  var r = app.roll;
  if (r.phase === "result" || r.phase === "pushTray" || r.phase === "prideTray") return renderResult();

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

  var blocking = brokenAttrs().filter(function (b) { return BLOCKS_SKILLS[b.key]; });
  if (blocking.length) {
    html += '<div class="banner" role="alert"><div class="banner-title">' + ICON.warn + "<span>Fora de ação</span></div>" +
      '<div class="banner-item">Com ' + blocking.map(function (b) { return b.name; }).join(" e ") +
      " Acabada, a regra não deixa rolar perícias. Role só se o mestre liberar.</div></div>";
  } else if (app.sheet.attrs[r.attrKey].cur === 0) {
    html += '<div class="banner" role="alert"><div class="banner-title">' + ICON.warn + "<span>" + attr.name + " Acabada</span></div>" +
      '<div class="banner-item">Sem dados de atributo nesta rolagem.</div></div>';
  }

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
    bonusGear().map(function (g) {
      return '<option value="' + esc(g.id) + '"' + (g.id === r.gearId ? " selected" : "") + ">" + esc(g.name || "Item sem nome") + (g.bonus === 0 ? " (quebrado)" : " (bônus " + g.bonus + ")") + "</option>";
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

/*
 * O que forçar pode custar. Os 1 já na mesa viram dano com certeza; os dados
 * re-rolados podem trazer mais.
 */
function pushRisks(r) {
  var risks = [];
  var res = r.result;
  var rerolled = E.pushIndices(r.dice).map(function (i) { return r.dice[i]; });
  var count = function (type) { return rerolled.filter(function (d) { return d.type === type; }).length; };

  var attr = attrByKey(r.attrKey), cur = app.sheet.attrs[r.attrKey].cur;
  var sure = res.attrBanes, maybe = sure + count("attribute");
  if (cur > 0 && sure >= cur) {
    risks.push({ sure: true, text: "Forçar vai deixar " + attr.name + " Acabada: " + E.plural(sure, "dado de atributo já mostra", "dados de atributo já mostram") + " 1 e " + attr.name + " está em " + cur + "." });
  } else if (cur > 0 && maybe >= cur) {
    risks.push({ sure: false, text: "Forçar pode deixar " + attr.name + " Acabada (" + attr.name + " em " + cur + ")." });
  } else if (sure > 0) {
    risks.push({ sure: false, text: "Forçar causa pelo menos " + sure + " de dano em " + attr.name + "." });
  }

  var gear = gearById(r.gearId);
  if (gear && gear.bonus > 0) {
    var gSure = res.gearBanes, gMaybe = gSure + count("gear");
    if (gSure >= gear.bonus) risks.push({ sure: true, text: "Forçar vai quebrar " + (gear.name || "o item") + "." });
    else if (gMaybe >= gear.bonus) risks.push({ sure: false, text: "Forçar pode quebrar " + (gear.name || "o item") + "." });
  }
  return risks;
}

/* ---------- Orgulho ---------- */

/* Pode usar: teste de perícia que falhou, Orgulho escrito, ainda não usado nesta sessão. */
function canUsePride(r) {
  var s = app.sheet;
  return !!r.skillKey && r.result.successes === 0 && !r.prideUsed &&
    s.pride.trim() !== "" && !s.prideUsedSession && !s.prideLost;
}

function renderPrideBlock(r) {
  if (canUsePride(r)) {
    return '<button class="btn-pride" data-action="usePride">' + ICON.star + "Usar Orgulho · rolar um D12</button>" +
      '<p class="small muted" style="margin:0">Seu Orgulho: “' + esc(app.sheet.pride.trim()) + "” · uma vez por sessão, se ele tiver a ver com esta rolagem. Se continuar falhando, você perde o Orgulho.</p>";
  }
  if (r.prideUsed && r.result.successes === 0) {
    return '<div class="notice error">' + ICON.warn + "<span>Nem o Orgulho salvou esta rolagem" +
      (r.result.canPush ? ". Se terminar sem sucesso, você perde o Orgulho." : ". Ao voltar para a ficha, você perde o Orgulho.") + "</span></div>";
  }
  if (r.prideUsed) {
    return '<div class="notice warn">' + ICON.star + "<span>O Orgulho virou a rolagem.</span></div>";
  }
  return "";
}

function usePride() {
  var r = app.roll;
  r.prideUsed = true;
  app.sheet.prideUsedSession = true;
  save();
  if (r.mode === "local" || !app.ts) {
    addPrideDie(1 + Math.floor(Math.random() * 12));
    return;
  }
  r.phase = "prideTray";
  render();
  TS.dice.putDiceInTray([{ name: "Orgulho", roll: "1d12" }], true).then(function (rollId) {
    if (app.roll === r) r.rollId = rollId;
  }).catch(function (err) {
    console.error(err);
    if (app.roll !== r) return;
    r.phase = "result";
    r.prideUsed = false;
    app.sheet.prideUsedSession = false;
    save();
    toast(trayError(err));
    render();
  });
}

/* O D12 do Orgulho entra na rolagem como um Dado de Artefato. */
function addPrideDie(value) {
  var r = app.roll;
  var dice = r.dice.map(function (d) { return { type: d.type, sides: d.sides, value: d.value }; });
  dice.push({ type: "artifact", sides: 12, value: value, fresh: true, pride: true });
  r.dice = dice;
  r.result = E.evaluate(dice, r.pushed);
  r.phase = "result";
  r.posted = false;
  render();
  settle(dice);
  postToChat(r);
}

/* Ao fechar a rolagem: se o Orgulho foi usado e mesmo assim falhou, ele é perdido. */
function closeRollPride(r) {
  if (r && r.prideUsed && r.result && r.result.successes === 0 && !app.sheet.prideLost) {
    app.sheet.prideLost = true;
    save();
    toast("Você perdeu o Orgulho. Jogue uma sessão inteira sem ele antes de escolher outro.");
  }
}

function trayPreview(pool) {
  var out = "";
  pool.forEach(function (g) { for (var i = 0; i < g.count; i++) out += '<span class="tray-' + g.type + '"></span>'; });
  return out;
}

/* ---------- Resultado ---------- */

/*
 * Dano do ataque para rolagens de Luta e Pontaria.
 * Luta sem arma é desarmado (Dano 1). Pontaria sem arma não mostra dano.
 */
var ATTACK_SKILLS = { combate: true, pontaria: true };

function attackInfo(r) {
  if (!r.skillKey || !ATTACK_SKILLS[r.skillKey]) return null;
  var g = gearById(r.gearId);
  var weapon = g && g.kind === "weapon" ? g : null;
  // Item fora do catálogo usado na rolagem: não sabemos o dano, melhor não chutar.
  if (g && !weapon) return null;
  if (!weapon && r.skillKey !== "combate") return null;
  var base = weapon ? weapon.dmg : 1;
  var name = weapon ? (weapon.name || "Arma") : "Desarmado";
  return { name: name, base: base, total: E.attackDamage(base, r.result.successes), extra: Math.max(0, r.result.successes - 1) };
}

function renderAttack(r) {
  var a = attackInfo(r);
  if (!a || !r.result.successes) return "";
  return '<section class="damage" aria-label="Dano do ataque">' +
    '<div class="damage-num"><span class="n">' + a.total + '</span><span class="w">de dano</span></div>' +
    '<div class="small muted">' + esc(a.name) + " " + a.base +
      (a.extra ? " + " + E.plural(a.extra, "sucesso extra", "sucessos extras") : "") +
      ". Os sucessos extras também podem virar outros efeitos, se o Mestre permitir.</div>" +
  "</section>";
}

function renderResult() {
  var r = app.roll, res = r.result;
  var waiting = r.phase === "pushTray" || r.phase === "prideTray";
  var name = app.sheet.name || "Personagem";

  var html = '<header><div class="row between"><p class="eyebrow">' + esc(rollTitle(r)) + " · " + esc(name) + (r.pushed ? " · forçada" : "") + "</p>" +
    (r.posted ? '<span class="row small muted" style="gap:6px">' + ICON.check + "No chat da mesa</span>" : "") + "</div>" +
    '<div class="big"><span class="n' + (res.successes ? "" : " zero") + '">' + res.successes + '</span><span class="w">' +
    (res.successes === 1 ? "sucesso" : "sucessos") + "</span></div></header>";

  html += renderAttack(r);

  var lines = [];
  if (r.pushed) {
    var attr = attrByKey(r.attrKey), a = app.sheet.attrs[r.attrKey];
    if (res.attributeDamage) lines.push([res.attributeDamage + " de dano em " + attr.name + " (agora " + a.cur + "/" + a.max + ")", "var(--bane)"]);
    if (res.willpowerGained) lines.push(["+" + res.willpowerGained + " de Força de Vontade (agora " + app.sheet.willpower + ")", "var(--accent)"]);
    if (res.gearDamage && r.gearName) {
      lines.push([r.gearBroken
        ? r.gearName + " quebrou (bônus 0): não dá dados até ser reparado"
        : r.gearName + " perde " + res.gearDamage + " de bônus", "var(--bane)"]);
    }
    if (!lines.length) lines.push(["Forçada sem danos", "var(--info)"]);
  } else if (res.attrBanes || res.gearBanes) {
    lines.push(["Os 1 em atributo e equipamento só contam se você forçar", "var(--muted)"]);
  }
  if (res.cancelled) lines.push([E.plural(res.cancelled, "sucesso anulado", "sucessos anulados") + " por dados negativos", "var(--muted)"]);
  if (r.pushed && r.brokeAttr) {
    var ba = attrByKey(r.attrKey);
    html += '<section class="banner" role="alert"><div class="banner-title">' + ICON.warn + "<span>" + ba.name + " Acabada</span></div>" +
      '<div class="banner-item">' + esc(BROKEN_EFFECT[ba.key]) +
      (ba.key === "astucia" ? " Como foi ao forçar, não precisa rolar na tabela de horror." : "") + "</div></section>";
  }

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
  if (!waiting) html += renderPrideBlock(r);
  if (waiting) {
    html += '<div class="notice" role="status">' + ICON.tray + "<span>" +
      (r.phase === "prideTray" ? "O D12 do Orgulho está na bandeja. Jogue no tabuleiro." : "Dados para forçar na bandeja. Jogue no tabuleiro.") +
      "</span></div>" +
      '<button class="btn-ghost" data-action="cancelPush">Cancelar</button>';
  } else if (res.canPush) {
    var n = E.pushIndices(r.dice).length;
    pushRisks(r).forEach(function (risk) {
      html += '<div class="notice' + (risk.sure ? " error" : " warn") + '">' + ICON.warn + "<span>" + esc(risk.text) + "</span></div>";
    });
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
    var before = a.cur;
    a.cur = a.cur === v ? v - 1 : v;
    var blocked = blockedBy(el.dataset.attr);
    if (a.cur > before && blocked.length) toast(blocked.join(" e ") + ": " + attrByKey(el.dataset.attr).name + " só se recupera por magia.");
    // Recuperou: da próxima vez que ficar Acabado, rola de novo.
    if (a.cur > 0 && app.sheet.injuryRolled[el.dataset.attr] != null) app.sheet.injuryRolled[el.dataset.attr] = false;
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
    // Hipotérmico: 1 de dano em Força e Astúcia assim que a condição começa.
    if (k === "congelando" && app.sheet.conditions[k]) applyConditionDamage(k, "Hipotérmico");
    save();
  },

  condTick: function (el) {
    var k = el.dataset.cond;
    var c = CONDITIONS.filter(function (x) { return x[0] === k; })[0];
    applyConditionDamage(k, c ? c[1] : k);
    save();
  },

  skill: function (el) {
    var k = el.dataset.skill, d = +el.dataset.delta, s = app.sheet;
    var from = s.skills[k], to = clamp(from + d, 0, MAX_SKILL);
    if (to === from) return;
    s.skills[k] = to;
    save();
  },

  gearAdd: function () {
    var sel = document.getElementById("f-add-gear");
    var value = sel ? sel.value : "";
    if (!value) { toast("Escolha um item na lista."); return false; }
    if (value === "__custom") {
      app.sheet.gear.push({ id: uid(), name: "", bonus: 0, base: 0, nb: true, weight: "normal" });
      focusLast('[data-bind="gear.name"]');
    } else {
      var it = C.gear(value);
      var item = { id: uid(), name: it.name, weight: it.weight || "normal", info: it.info || "", kind: it.kind || "" };
      if (it.kind === "armor") {
        item.bonus = item.base = it.armor; item.nb = false; item.part = it.part;
        // Veste se ainda não há outra peça vestida no mesmo lugar.
        item.worn = !app.sheet.gear.some(function (g) { return g.kind === "armor" && g.worn && g.part === it.part; });
      } else {
        var nb = it.bonus == null;
        item.bonus = item.base = nb ? 0 : it.bonus; item.nb = nb;
        if (it.kind === "weapon") { item.dmg = it.dmg; item.melee = it.melee; }
      }
      app.sheet.gear.push(item);
    }
    save();
  },

  /*
   * Item inteiro (bônus = bônus de fábrica): o ajuste muda o item, os dois andam juntos.
   * Item danificado: o ajuste mexe só no bônus atual; ao chegar no de fábrica, volta a ser inteiro.
   */
  gearBonus: function (el) {
    var g = gearById(el.dataset.id);
    if (!g) return;
    if (g.base == null) g.base = g.bonus;
    var intact = g.bonus === g.base;
    g.bonus = clamp(g.bonus + (+el.dataset.delta), 0, 10);
    if (intact || g.bonus > g.base) g.base = g.bonus;
    save();
  },

  /* Dano fora de rolagem (decisão do mestre): baixa só o bônus atual. */
  gearDamage: function (el) {
    var g = gearById(el.dataset.id);
    if (!g || g.bonus <= 0) return;
    if (g.base == null) g.base = g.bonus;
    g.bonus -= 1;
    var what = g.kind === "armor" ? "de Valor de Armadura" : "de bônus";
    toast((g.name || "Item") + (g.bonus === 0 ? " quebrou." : " perdeu 1 " + what + " (" + g.bonus + " de " + g.base + ")."));
    save();
  },

  resStep: function (el) {
    var k = el.dataset.key;
    app.sheet.resources[k] = R.step(app.sheet.resources[k], +el.dataset.delta);
    if (app.lastRes && app.lastRes.key === k) app.lastRes = null;
    save();
  },

  resUse: function (el) { useResource(el.dataset.key); return false; },

  hitOpen: function () { app.hit = { dmg: 1, phase: "setup" }; },
  hitDtype: function (el) { app.sheet.lastDtype = el.dataset.dtype; save(); },
  injDtype: function (el) { app.sheet.lastDtype = el.dataset.dtype; save(); },
  injRoll: function (el) { rollInjury(el.dataset.table); return false; },
  injSkip: function (el) { app.sheet.injuryRolled[el.dataset.attr] = true; save(); },
  injDismiss: function () { app.lastInjury = null; },
  // Dano atípico (tabela "Outros"): inconsciente, letal em D6 dias, sem rolar D66.
  injAtypical: function () {
    var x = { id: uid(), table: "outros", code: 0, name: "Dano atípico", effect: "Inconsciente até morrer ou receber Cura.", lethal: true, instant: false,
      limit: J.rollLimit("D6 dias"), healMod: 0, saved: false, heal: null, perm: false, note: "" };
    app.sheet.injuries.push(x);
    app.sheet.injuryRolled.forca = true;
    x.stored = true;
    app.lastInjury = x;
    save();
    chatInjury(x);
  },
  injSaved: function (el) { var x = injuryById(el.dataset.id); if (x) x.saved = true; save(); },
  injDay: function (el) { var x = injuryById(el.dataset.id); if (x && x.heal > 0) x.heal--; save(); },
  injCare: function (el) {
    var x = injuryById(el.dataset.id);
    if (x && x.heal > 0) { x.heal = J.halve(x.heal); toast("Cuidados com sucesso: faltam " + E.plural(x.heal, "dia", "dias") + "."); }
    save();
  },
  injRemove: function (el) {
    app.sheet.injuries = app.sheet.injuries.filter(function (x) { return x.id !== el.dataset.id; });
    save();
  },
  hitDmg: function (el) { app.hit.dmg = clamp(app.hit.dmg + (+el.dataset.delta), 1, 20); },
  hitRoll: function () { rollArmor(); return false; },
  hitApply: function () { resolveHit(null); return false; },
  hitLoss: function (el) { applyArmorLoss(el.dataset.part); },
  hitClose: function () {
    if (app.hit && app.hit.phase === "tray") {
      Object.keys(app.resRolls).forEach(function (id) { if (app.resRolls[id] === "__armor") delete app.resRolls[id]; });
    }
    app.hit = null;
  },

  gearWear: function (el) {
    var g = gearById(el.dataset.id);
    if (!g) return;
    g.worn = !g.worn;
    // Só uma peça vestida por lugar: vestir esta tira a outra.
    if (g.worn) app.sheet.gear.forEach(function (o) { if (o !== g && o.kind === "armor" && o.part === g.part) o.worn = false; });
    save();
  },

  gearGiveBonus: function (el) {
    var g = gearById(el.dataset.id);
    if (g) { g.nb = false; g.bonus = 1; g.base = 1; }
    save();
  },

  gearRepair: function (el) {
    var g = gearById(el.dataset.id);
    if (g && g.base != null) g.bonus = g.base;
    save();
  },

  setAge: function (el) {
    var s = app.sheet, before = AGE_REP[s.age] || 0;
    s.age = s.age === el.dataset.age ? "" : el.dataset.age;
    // Reputação ainda no valor inicial da idade anterior: acompanha a nova idade.
    if (s.reputation === before) s.reputation = AGE_REP[s.age] || 0;
    save();
  },

  rep: function (el) {
    app.sheet.reputation = clamp(app.sheet.reputation + (+el.dataset.delta), 0, MAX_REP);
    save();
  },

  repRoll: function () { rollReputation(); return false; },

  xp: function (el) {
    var s = app.sheet, d = +el.dataset.delta;
    if (d > 0) {
      s.xp += d; s.xpTotal += d;            // ganhar XP soma nos dois
    } else {
      s.xp = Math.max(0, s.xp + d);         // gastar só tira do disponível
    }
    save();
  },

  evolveStart: function () {
    app.evolve = { log: [] };
    if (app.tab !== "talents") app.tab = "skills";
    setTimeout(function () {
      var bar = document.querySelector(".evolve-bar");
      if (bar && bar.scrollIntoView) bar.scrollIntoView({ block: "start", behavior: "smooth" });
    }, 0);
  },

  evoSkill: function (el) {
    var k = el.dataset.skill, lvl = app.sheet.skills[k];
    if (lvl >= MAX_SKILL) return;
    if (!spendEvolve(skillCost(lvl), { kind: "skill", key: k }, skillName(k) + " " + (lvl + 1))) return false;
    app.sheet.skills[k] = lvl + 1;
    if (lvl === 0) toast("Pelo livro, para aprender uma perícia nova você precisa tê-la usado com sucesso nesta sessão.");
    save();
  },

  evoTalent: function (el) {
    var t = talentById(el.dataset.id);
    if (!t || t.rank >= 3) return;
    if (!spendEvolve(talentCost(t.rank), { kind: "talent", id: t.id }, talentName(t) + " " + (t.rank + 1))) return false;
    t.rank += 1;
    save();
  },

  evolveUndo: function () {
    var e = app.evolve && app.evolve.log.pop();
    if (!e) return;
    var s = app.sheet;
    s.xp += e.cost;
    if (e.kind === "skill") s.skills[e.key] = Math.max(0, s.skills[e.key] - 1);
    if (e.kind === "talent") { var t = talentById(e.id); if (t) t.rank = Math.max(1, t.rank - 1); }
    if (e.kind === "newTalent") s.talentList = s.talentList.filter(function (t) { return t.id !== e.id; });
    toast("Desfeito: " + e.what + ". Voltaram " + e.cost + " XP.");
    save();
  },

  evolveDone: function () {
    var log = app.evolve ? app.evolve.log : [];
    var spent = log.reduce(function (n, e) { return n + e.cost; }, 0);
    app.evolve = null;
    if (!log.length) return;
    toast("Gastou " + spent + " XP. Restam " + app.sheet.xp + ".");
    if (app.ts) {
      var who = (app.sheet.name || "Personagem").replace(/[<>]/g, "");
      TS.chat.send("<b>" + who + "</b> evoluiu: " + log.map(function (e) { return clean(e.what); }).join(", ") +
        " <size=85%><color=#A89C88>(" + spent + " XP)</color></size>", "board").catch(function () {});
    }
  },


  talentAdd: function () {
    var sel = document.getElementById("f-add-talent");
    var value = sel ? sel.value : "";
    if (!value) { toast("Escolha um talento na lista."); return false; }
    // No modo Evoluir, aprender um talento novo custa 3 XP (e um Quarto de Dia de prática).
    var id = value === "__custom" ? "custom-" + uid() : value;
    if (app.evolve && !spendEvolve(3, { kind: "newTalent", id: id }, "aprender " + (value === "__custom" ? "um talento" : talentName({ id: id })))) return false;
    if (value === "__custom") {
      app.sheet.talentList.push({ id: id, name: "", rank: 1 });
      focusLast('[data-bind="talent.name"]');
    } else {
      app.sheet.talentList.push({ id: id, rank: 1 });
    }
    save();
  },

  talentRank: function (el) {
    var t = talentById(el.dataset.id), d = +el.dataset.delta;
    if (!t) return;
    var to = clamp(t.rank + d, 1, 3);
    if (to === t.rank) return;
    t.rank = to;
    save();
  },

  talentRemove: function (el) {
    app.sheet.talentList = app.sheet.talentList.filter(function (t) { return t.id !== el.dataset.id; });
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

  finish: function () { closeRollPride(app.roll); app.view = "sheet"; app.roll = null; },

  usePride: function () { usePride(); return false; },

  newSession: function () {
    app.sheet.prideUsedSession = false;
    save();
    toast("Nova sessão: o Orgulho está disponível de novo.");
  },

  backupExport: function () {
    var text = exportText();
    app.backup = { exported: text, copied: false };
    copyText(text).then(function (ok) {
      if (!app.backup || app.backup.exported !== text) return;
      app.backup.copied = ok;
      render();
      if (ok) toast("Ficha copiada para a área de transferência.");
      var area = document.getElementById("f-export");
      if (area && !ok) area.select();
    });
  },

  backupOpenImport: function () {
    app.backup = { importing: true };
    focusLast("#f-import");
  },

  backupCheck: function () {
    var area = document.getElementById("f-import");
    var text = area ? area.value : "";
    var sheet = parseImport(text);
    app.backup = { importing: true, text: text };
    if (!text.trim()) app.backup.error = "Cole o texto da ficha exportada.";
    else if (!sheet) app.backup.error = "Esse texto não parece uma ficha exportada. Copie o texto inteiro, do primeiro { ao último }.";
    else app.backup.preview = sheet;
  },

  backupConfirm: function () {
    var sheet = app.backup && app.backup.preview;
    if (!sheet) return;
    app.sheet = sheet;
    app.backup = null;
    save();
    toast("Ficha importada: " + (sheet.name || "sem nome") + ".");
    window.scrollTo(0, 0);
  },

  backupCancel: function () { app.backup = null; },

  newPride: function () {
    app.sheet.prideLost = false;
    app.sheet.prideUsedSession = false;
    app.sheet.pride = "";
    save();
    focusLast("#f-pride");
  },

  spendWp: function (el) {
    var n = +el.dataset.n;
    var s = app.sheet;
    if (s.willpower < n) { toast("Pontos de Força de Vontade insuficientes."); return false; }
    var sel = document.getElementById("f-wp-for");
    var reason = sel && sel.value ? sel.options[sel.selectedIndex].text : "";
    s.willpower -= n;
    save();
    toast("Gastou " + n + " PFV" + (reason ? " em " + reason : "") + ". Restam " + s.willpower + ".");
    if (app.ts) {
      var who = (s.name || "Personagem").replace(/[<>]/g, "");
      TS.chat.send("<b>" + who + "</b> gastou <color=#D4793A><b>" + n + " PFV</b></color>" +
        (reason ? " em " + reason.replace(/[<>]/g, "") : "") + " · restam " + s.willpower, "board").catch(function () {});
    }
  }
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
  if (!bind || bind.indexOf("combat.") === 0) return;
  if (bind === "gear.name") {
    var g = gearById(el.dataset.id);
    if (g) g.name = el.value;
  } else if (bind === "talent.name") {
    var t = talentById(el.dataset.id);
    if (t) t.name = el.value;
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
  var field = el.dataset && el.dataset.select;
  if (el.dataset && el.dataset.weight) {
    var gw = gearById(el.dataset.weight);
    if (gw && W.WEIGHTS[el.value]) { gw.weight = el.value; save(); render(); }
    return;
  }
  if (el.dataset && el.dataset.coin) {
    app.sheet.coins[el.dataset.coin] = Math.max(0, Math.floor(+el.value) || 0);
    save();
    // O change dispara no blur; redesenhar na hora quebra o foco do próximo campo.
    setTimeout(render, 0);
    return;
  }
  if (field === "kin") { setKin(el.value); save(); render(); return; }
  if (field === "profession") {
    app.sheet.profession = el.value;
    var res = app.sheet.resources;
    // Ficha nova (sem comida nem água): preenche os dados iniciais da profissão.
    var fresh = !res.comida && !res.agua;
    if (fresh && el.value && R.START[el.value]) {
      var start = R.startFor(el.value);
      R.KINDS.forEach(function (k) { if (!res[k.key]) res[k.key] = start[k.key]; });
      toast("Dados de Recurso iniciais de " + C.profession(el.value).name + " na aba Equipamento.");
    }
    save(); render(); return;
  }
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
  if (ev && ev.payload && app.resRolls[ev.payload.rollId]) { handleResourceRoll(ev); return; }
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
  } else if (r.phase === "prideTray") {
    var pride = matchGroups([{ name: "Orgulho", count: 1 }], results)[0].values[0];
    if (pride == null) { r.phase = "result"; render(); return; }
    addPrideDie(pride);
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
  var wasUp = a.cur > 0;
  a.cur = Math.max(0, a.cur - r.result.attributeDamage);
  r.brokeAttr = wasUp && a.cur === 0;
  // Ficar Acabado só por forçar não gera ferimento grave.
  if (r.brokeAttr && app.sheet.injuryRolled[r.attrKey] === false) app.sheet.injuryRolled[r.attrKey] = true;
  app.sheet.willpower = clamp(app.sheet.willpower + r.result.willpowerGained, 0, MAX_WP);
  var gear = gearById(r.gearId);
  r.gearName = gear ? (gear.name || "Item") : null;
  if (gear) {
    var gearWasUp = gear.bonus > 0;
    if (gear.base == null) gear.base = gear.bonus;
    gear.bonus = Math.max(0, gear.bonus - r.result.gearDamage);
    r.gearBroken = gearWasUp && gear.bonus === 0;
  }
  save();

  render();
  settle(dice);
  postToChat(r);
}

function chatText(r) {
  var res = r.result;
  var who = (app.sheet.name || "Personagem").replace(/[<>]/g, "");
  var label = rollTitle(r) + (r.pushed ? " (forçada)" : "") + (r.prideUsed ? " + Orgulho" : "");
  var color = res.successes ? "#E8B84A" : "#A89C88";
  var text = "<b>" + who + "</b> · " + label + ": <color=" + color + "><b>" + E.plural(res.successes, "sucesso", "sucessos") + "</b></color>";
  var atk = attackInfo(r);
  if (atk && res.successes) text += " · <b>" + atk.total + " de dano</b> <size=85%><color=#A89C88>(" + clean(atk.name) + ")</color></size>";

  if (r.pushed) {
    var parts = [];
    if (res.attributeDamage) parts.push("<color=#E0604E>" + res.attributeDamage + " dano em " + attrByKey(r.attrKey).name + "</color>");
    if (res.willpowerGained) parts.push("+" + res.willpowerGained + " PFV");
    if (res.gearDamage && r.gearName) {
      parts.push("<color=#E0604E>" + r.gearName.replace(/[<>]/g, "") + (r.gearBroken ? " quebrou" : " −" + res.gearDamage) + "</color>");
    }
    if (parts.length) text += " · " + parts.join(" · ");
    if (r.brokeAttr) text += "\n<color=#E0604E><b>" + attrByKey(r.attrKey).name.toUpperCase() + " ACABADA · fora de ação</b></color>";
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
