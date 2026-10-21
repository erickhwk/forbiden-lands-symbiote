/*
 * Bestiário do Mestre: lista, ficha da criatura, ataque, gerador de demônio
 * e Iniciativa.
 *
 * Os dados moram em bestiary.js (FLBestiary). A Força de cada cópia fica na
 * entrada da Iniciativa (initiative.js: hp/hpMax). Os demônios gerados ficam
 * em app.bestiaryCustom e são salvos junto com o combate. Usa app.js, gm.js e
 * combat.js (app, render, save, toast, esc, ICON, actions, chat, clean,
 * addCombatant, afterCombatChange, readGroup, trayError).
 */
"use strict";

var B = window.FLBestiary;

app.bestiary = { q: "", src: "", open: null, from: null, entryId: null, pick: null, roll: null, rolling: false, qty: 1, group: true, str: null, enc: null, confirmDel: false };
app.bestiaryCustom = app.bestiaryCustom || [];

var KIND_LABEL = { monstro: "Monstro", comum: "Combatente", animal: "Animal" };

/* ------------------------------------------------------------------ */
/* Lista                                                              */
/* ------------------------------------------------------------------ */

function renderBestiary() {
  var st = app.bestiary;
  if (st.open && B.get(st.open)) return renderMonster(B.get(st.open));
  st.open = null;

  var html = '<header><p class="eyebrow">Painel do Mestre</p><h1 class="title">Bestiário</h1></header>' +
    '<label class="sr-only" for="f-best-q">Buscar</label>' +
    '<input id="f-best-q" class="field" type="search" data-best="q" placeholder="Buscar criatura" value="' + esc(st.q) + '">' +
    '<nav class="shield-tabs" aria-label="Livro">' + [["", "Todos"], ["gm", "Guia do Mestre"], ["bob", "Book of Beasts"]].map(function (t) {
      return '<button data-action="bestSrc" data-src="' + t[0] + '" aria-pressed="' + (st.src === t[0]) + '">' + t[1] + "</button>";
    }).join("") + "</nav>" +
    '<div class="row" style="gap:8px;flex-wrap:wrap">' +
      '<button class="btn-ghost slim" data-action="bestEncounter">' + ICON.die + "Sortear criatura (D66" + (st.src === "bob" ? ", Book of Beasts" : st.src === "gm" ? ", Guia" : "") + ")</button>" +
      '<button class="btn-ghost slim" data-action="bestDemon">' + ICON.spark + "Gerar demônio</button>" +
    "</div>";

  if (st.enc) {
    var em = st.enc.id === "demonio" ? null : B.get(st.enc.id);
    html += '<div class="shield-result"><div class="row between"><strong>' + (em ? esc(em.name) : "Demônio") + '</strong><span class="stat-num sm">' + st.enc.code + "</span></div>" +
      '<div class="row" style="gap:8px">' +
        (em ? '<button class="btn-add slim" data-action="bestOpen" data-id="' + em.id + '">Abrir ficha</button>'
            : '<button class="btn-add slim" data-action="bestDemon">' + ICON.spark + "Gerar o demônio</button>") +
        '<button class="link-btn inline" data-action="bestEncClear">Fechar</button></div></div>';
  }

  html += '<details class="late best-rules"><summary>Monstros em combate</summary><ul class="shield-notes">' +
      B.RULES.map(function (r) { return "<li>" + esc(r) + "</li>"; }).join("") + "</ul>" +
      '<p class="eyebrow" style="margin:10px 0 4px">Mortos-vivos e insetoides</p><ul class="shield-notes">' +
      B.COMMON_RULES.map(function (r) { return "<li>" + esc(r) + "</li>"; }).join("") + "</ul>" +
      '<p class="eyebrow" style="margin:10px 0 4px">Animais</p><ul class="shield-notes">' +
      B.ANIMAL_RULES.map(function (r) { return "<li>" + esc(r) + "</li>"; }).join("") + "</ul></details>";

  var found = B.search(st.q, st.src);
  if (!found.length) return html + '<p class="muted" style="margin:0">Nenhuma criatura com esse nome.</p>';

  [["monstro", "Monstros"], ["comum", "Mortos-vivos e insetoides"], ["animal", "Animais"]].forEach(function (k) {
    var group = found.filter(function (m) { return m.kind === k[0]; });
    if (!group.length) return;
    html += '<section class="stack" aria-label="' + k[1] + '"><h2 class="eyebrow">' + k[1] + "</h2>" +
      '<div class="best-list">' + group.map(renderBestRow).join("") + "</div></section>";
  });
  return html;
}

function renderBestRow(m) {
  var inFight = monstersInCombat(m.id).length;
  return '<button class="best-row" data-action="bestOpen" data-id="' + m.id + '">' +
    '<span class="grow"><span class="best-name">' + esc(m.name) + "</span>" +
    '<span class="small muted">Força ' + m.str + (m.strNote ? "*" : "") + " · Agilidade " + m.agi + (m.armor ? " · Armadura " + m.armor : "") + (m.move ? " · Movimento " + m.move : "") + "</span></span>" +
    (m.custom ? '<span class="chip-s">gerado</span>' : "") +
    (inFight ? '<span class="chip-s warn">no combate</span>' : "") +
    ICON.chevron + "</button>";
}

function monstersInCombat(id) {
  var c = app.combat;
  return c ? c.entries.filter(function (e) { return e.mon === id; }) : [];
}

/* ------------------------------------------------------------------ */
/* Ficha                                                              */
/* ------------------------------------------------------------------ */

/* Força atual para ataques que rolam a Força (bando de harpias). */
function currentStr(m) {
  var st = app.bestiary, e = st.entryId && app.combat ? I.find(app.combat, st.entryId) : null;
  if (e && e.hp) return Math.max.apply(null, e.hp);
  return st.str || m.str;
}

function renderMonster(m) {
  var st = app.bestiary;
  var html = '<div class="gm-back"><button class="link-btn inline" data-action="bestBack">' + ICON.back +
    "<span>" + (st.from === "combat" ? "Iniciativa" : "Bestiário") + "</span></button></div>";

  html += '<header><p class="eyebrow">' + KIND_LABEL[m.kind] + (m.group ? " · " + esc(m.group) : "") + " · " + B.sourceName(m.src) + " p. " + m.page + "</p>" +
    '<h1 class="title">' + esc(m.name) + "</h1></header>";

  var stats = [["Força", m.str], ["Agilidade", m.agi]];
  if (m.wits) stats.push(["Astúcia", m.wits]);
  if (m.emp) stats.push(["Empatia", m.emp]);
  stats.push(["Armadura", m.armor || "—"], ["Movimento", m.move || "—"]);
  html += '<section class="best-stats" style="grid-template-columns:repeat(' + Math.min(stats.length, 6) + ',minmax(0,1fr))">' + stats.map(function (s) {
    return '<div class="mattr"><span class="small muted">' + s[0] + '</span><span class="mattr-num">' + s[1] + "</span></div>";
  }).join("") + "</section>";

  var notes = [];
  if (m.strNote) notes.push("Força " + m.strNote);
  if (m.armorNote) notes.push("Armadura: " + m.armorNote);
  if (m.moveNote) notes.push("Movimento " + m.moveNote);
  if (m.gear) notes.push("Equipamento: " + m.gear);
  if (m.extraCards) notes.push("+" + m.extraCards + " carta de iniciativa");
  if (notes.length) html += '<p class="small muted" style="margin:0">' + esc(notes.join(" · ")) + "</p>";

  if ((m.skills || []).length) html += '<div class="chips">' + m.skills.map(function (s) { return '<span class="chip-s">' + esc(s[0]) + " " + s[1] + "</span>"; }).join("") + "</div>";

  (m.traits || []).forEach(function (t) {
    html += '<div class="best-trait' + (t.weak ? " weak" : "") + '"><strong>' + esc(t.name) + ".</strong> " + esc(t.text) + "</div>";
  });

  html += renderAttacks(m);
  html += renderAddToCombat(m);
  if (m.custom) html += renderCustomTools(m);
  return html;
}

function renderAttacks(m) {
  var st = app.bestiary, list = B.attacks(m), table = m.kind === "monstro";
  var many = list.length > 1;
  var html = '<section class="card best-attacks"><div class="row between"><h2 class="shield-h">' +
    (table ? (m.custom ? "Ataques" : "Ataques monstruosos") : "Ataque") + "</h2>" +
    (table && many ? '<button class="btn-add slim" data-action="bestPick">' + ICON.die + (list.length === 6 ? "Sortear D6" : "Sortear") + "</button>" : "") + "</div>";
  if (table && many) html += '<p class="small muted" style="margin:0">Sorteie ou toque no ataque que quer usar.</p>';

  html += '<ol class="atk-list">' + list.map(function (a, i) {
    var sel = st.pick === i || !many;
    var tags = [B.rangeName(a.range) + (a.all ? ", todos" : "")];
    if (a.block && table) tags.push("pode ser bloqueado");
    if (a.dodge === false) tags.push("sem esquiva");
    var out = '<li class="atk' + (sel ? " sel" : "") + (a.fear || a.attr ? " fear" : "") + '">' +
      '<button class="atk-head" data-action="bestSelect" data-i="' + i + '"' + (many ? "" : " disabled") + ">" +
        (table && many ? '<span class="atk-n">' + (i + 1) + "</span>" : "") +
        '<span class="grow"><span class="atk-name">' + esc(a.name) + "</span>" +
          '<span class="atk-line">' + esc(B.attackLine(a, a.dice === "str" ? currentStr(m) : null)) + ' <span class="muted">· ' + esc(tags.join(" · ")) + "</span></span>" +
          (a.fx ? '<span class="atk-fx">' + esc(a.fx) + "</span>" : "") +
        "</span></button>";
    if (sel) out += renderAttackRoll(m, a, i);
    return out + "</li>";
  }).join("") + "</ol>";
  return html + "</section>";
}

function renderAttackRoll(m, a, i) {
  var st = app.bestiary, r = st.roll && st.roll.i === i ? st.roll : null;
  var html = '<div class="atk-roll' + (B.attacks(m).length > 1 && m.kind === "monstro" ? "" : " flat") + '">';
  var base = B.baseDice(a, currentStr(m));
  if (!base) {
    return html + '<div class="row" style="gap:8px;flex-wrap:wrap">' +
      (st.roll && st.roll.i === i && st.roll.posted ? '<span class="small muted">' + ICON.check + " no chat</span>" : '<button class="btn-ghost slim" data-action="bestChat" data-i="' + i + '">Mostrar no chat</button>') +
      '<span class="small muted">Sem rolagem de ataque.</span></div></div>';
  }
  if (r) {
    var res = B.resolve(a, r.sixes);
    html += '<div class="atk-dice">' + r.values.map(function (v, k) {
      var kind = k < r.base ? "die-attribute" : k < r.base + r.skill ? "die-skill" : "die-gear";
      return '<span class="die ' + kind + (v === 6 ? " success" : "") + '">' + v + "</span>";
    }).join("") + "</div>" +
      '<div class="atk-result ' + (res.hit ? "atk-hit" : "atk-miss") + '">' +
        (res.hit
          ? "<strong>" + E.plural(r.sixes, "sucesso", "sucessos") + "</strong> · " + (res.dmg ? res.dmg + " de dano em " + res.attr : "acertou")
          : "<strong>Errou.</strong> Nenhum 6.") +
        (res.hit && res.attr === "Força" && r.sixes > 1 ? '<span class="small muted"> (' + a.dmg + " + " + (r.sixes - 1) + " pelos sucessos extras)</span>" : "") +
      "</div>" +
      '<div class="row" style="gap:8px;flex-wrap:wrap">' +
        (r.posted ? '<span class="small muted">' + ICON.check + " no chat</span>" : '<button class="btn-ghost slim" data-action="bestChat" data-i="' + i + '">Mostrar no chat</button>') +
        '<button class="link-btn inline" data-action="bestRoll" data-i="' + i + '">Rolar de novo</button>' +
      "</div>";
  } else if (st.rolling) {
    html += '<div class="notice" role="status">' + ICON.tray + "<span>Na sua bandeja. Jogue no tabuleiro.</span></div>" +
      '<button class="btn-ghost slim" data-action="bestCancel">Cancelar</button>';
  } else {
    var total = base + (a.skill || 0) + (a.gear || 0);
    html += '<div class="row" style="gap:10px;flex-wrap:wrap">' +
      '<button class="btn-primary slim" data-action="bestRoll" data-i="' + i + '">' + ICON.die + "Rolar " + E.plural(total, "dado", "dados") + "</button>" +
      (app.ts ? '<button class="link-btn inline" data-action="bestRoll" data-i="' + i + '" data-local="1">rolar aqui</button>' : "") +
      "</div>" +
      '<p class="small muted" style="margin:0">' + (a.fear ? "Cada 6 tira 1 de Astúcia." : a.attr ? "Cada 6 tira 1 de " + a.attr + "." : m.kind === "monstro" ? "Cada 6 além do primeiro soma +1 de dano. Não dá para forçar." : "Força + Luta" + (a.gear ? " + arma" : "") + ", como um PNJ. Pode forçar.") + "</p>";
  }
  return html + "</div>";
}

function renderAddToCombat(m) {
  var st = app.bestiary, already = monstersInCombat(m.id), unit = m.copies ? m.copies.unit : null;
  var str = st.str || m.str, many = st.qty > 1;
  var html = '<section class="card best-add"><h2 class="shield-h">Pôr na Iniciativa</h2>' +
    (m.copies ? '<p class="small muted" style="margin:0">' + esc(m.copies.hint) + "</p>" : "") +
    '<div class="row" style="gap:10px;flex-wrap:wrap;align-items:center">' +
      '<label class="sr-only" for="f-best-qty">Quantos</label>' +
      '<select id="f-best-qty" class="field" data-best="qty" style="width:auto;margin-top:0">' +
        [1, 2, 3, 4, 5, 6, 8].map(function (n) { return '<option value="' + n + '"' + (st.qty === n ? " selected" : "") + ">×" + n + (unit ? " " + unit + (n > 1 ? "s" : "") : "") + "</option>"; }).join("") +
      "</select>" +
      '<label class="best-str">Força <input id="f-best-str" class="field" type="number" min="1" max="99" inputmode="numeric" data-best="str" value="' + str + '"></label>' +
      '<button class="btn-add" data-action="bestAdd">' + ICON.plus + "Adicionar</button>" +
    "</div>" +
    (many && !unit ? '<label class="check small"><input type="checkbox" data-best="group"' + (st.group ? " checked" : "") + "> Uma carta para o grupo (agem juntos)</label>" : "") +
    '<p class="small muted" style="margin:0">' + (unit ? "Cada " + unit + " entra com a sua carta e a sua Força." :
      "Cada um entra com Força " + str + " para você ir descontando o dano." + (many ? (st.group ? " O grupo compra uma carta só." : " Cada um compra a sua carta.") : "")) +
      (m.extraCards ? " Compra +" + m.extraCards + " carta." : "") + "</p>";
  if (already.length) {
    html += '<div class="small">' + ICON.check + " Já no combate: " + already.map(function (e) {
      return esc(e.name) + (e.hp ? " (" + e.hp.join(", ") + ")" : "");
    }).join("; ") + ' <button class="link-btn inline" data-action="bestToCombat">Ver Iniciativa</button></div>';
  }
  return html + "</section>";
}

function renderCustomTools(m) {
  var st = app.bestiary;
  return '<section class="row" style="gap:10px;flex-wrap:wrap">' +
    '<button class="btn-ghost slim" data-action="bestDemon">' + ICON.spark + "Gerar outro demônio</button>" +
    (st.confirmDel
      ? '<span class="small">Apagar este demônio?</span><button class="btn-ghost slim danger-text" data-action="bestDelete">Apagar</button><button class="link-btn inline" data-action="bestDeleteCancel">Cancelar</button>'
      : '<button class="link-btn inline" data-action="bestDeleteAsk">Apagar este demônio</button>') +
    "</section>";
}

/* ------------------------------------------------------------------ */
/* Força na Iniciativa (usado por combat.js)                          */
/* ------------------------------------------------------------------ */

function renderHpLines(e) {
  if (!e.hp) return "";
  var m = e.mon ? B.get(e.mon) : null;
  var halfTrait = m && (m.traits || []).filter(function (t) { return t.half; })[0];
  var html = '<div class="hp-lines">' + e.hp.map(function (h, i) {
    var pct = Math.round(100 * h / e.hpMax), half = h > 0 && h <= e.hpMax / 2;
    return '<div class="hp-line' + (h === 0 ? " out" : half ? " half" : "") + '">' +
      '<span class="hp-who">' + (e.hp.length > 1 ? "#" + (i + 1) : "Força") + "</span>" +
      '<span class="hp-bar" aria-hidden="true"><i style="width:' + pct + '%"></i></span>' +
      '<span class="hp-num">' + (h === 0 ? "Acabado" : h + '<span class="stat-of">/' + e.hpMax + "</span>") + "</span>" +
      '<button class="btn-step sm" data-action="hpStep" data-id="' + e.id + '" data-i="' + i + '" data-delta="-1" aria-label="Tirar 1 de Força"' + (h === 0 ? " disabled" : "") + ">−</button>" +
      '<button class="btn-step sm" data-action="hpStep" data-id="' + e.id + '" data-i="' + i + '" data-delta="1" aria-label="Devolver 1 de Força"' + (h >= e.hpMax ? " disabled" : "") + ">+</button>" +
    "</div>";
  }).join("") + "</div>";
  if (halfTrait && e.hp.some(function (h) { return h > 0 && h <= e.hpMax / 2; })) {
    html += '<div class="hp-alert">' + ICON.warn + "<span><strong>" + esc(halfTrait.name) + ":</strong> " + esc(halfTrait.text) + "</span></div>";
  }
  return html;
}

function renderMonButtons(e) {
  if (!e.mon || !B.get(e.mon)) return "";
  return '<div class="row" style="gap:8px">' +
    '<button class="btn-ghost slim" data-action="monAttack" data-id="' + e.id + '">' + ICON.die + "Atacar</button>" +
    '<button class="link-btn inline" data-action="monSheet" data-id="' + e.id + '">Ficha</button></div>';
}

/* ------------------------------------------------------------------ */
/* Rolagens                                                           */
/* ------------------------------------------------------------------ */

function bestRoll(i, local) {
  var st = app.bestiary, m = B.get(st.open);
  if (!m) return;
  var a = B.attacks(m)[i], base = B.baseDice(a, currentStr(m)), skill = a.skill || 0, gear = a.gear || 0;
  st.pick = i;
  st.roll = null;
  if (!base) return;
  if (local || !app.ts) {
    var vals = [];
    for (var k = 0; k < base + skill + gear; k++) vals.push(1 + Math.floor(Math.random() * 6));
    applyBestRoll(i, vals, base, skill);
    return;
  }
  st.rolling = true;
  render();
  var dice = [{ name: "Base", roll: base + "d6" }];
  if (skill) dice.push({ name: "Perícia", roll: skill + "d6" });
  if (gear) dice.push({ name: "Arma", roll: gear + "d6" });
  TS.dice.putDiceInTray(dice, true).then(function (rollId) {
    app.resRolls[rollId] = "__mon:" + i;
  }).catch(function (err) {
    console.error(err);
    st.rolling = false;
    toast(trayError(err));
    render();
  });
}

function applyBestRoll(i, values, base, skill) {
  var st = app.bestiary;
  st.rolling = false;
  st.roll = { i: i, values: values, base: base, skill: skill || 0, sixes: values.filter(function (v) { return v === 6; }).length, posted: false };
  render();
}

/* Chamado por handleResourceRoll (app.js) para "__mon:…". */
function handleMonRoll(i, ev) {
  if (ev.kind === "rollResults") {
    var groups = (ev.payload.resultsGroups || []).map(readGroup);
    function of(name) { var g = groups.filter(function (x) { return x.name === name; })[0]; return g ? g.values : []; }
    var base = of("Base"), skill = of("Perícia"), gear = of("Arma");
    if (!base.length && !skill.length && !gear.length) groups.forEach(function (g) { base = base.concat(g.values); });
    var all = base.concat(skill, gear);
    if (all.length) { applyBestRoll(i, all, base.length, skill.length); return; }
  }
  app.bestiary.rolling = false;
  render();
}

function openMonster(id, from, entryId) {
  var st = app.bestiary, m = B.get(id);
  if (st.open !== id) {
    st.pick = null; st.roll = null; st.confirmDel = false; st.str = null;
    st.qty = m && m.copies ? m.copies.n : 1;
    st.group = !(m && m.copies);
  }
  st.open = id;
  st.from = from || null;
  st.entryId = entryId || null;
  app.mode = "bestiary";
  window.scrollTo(0, 0);
}

function saveCustom() {
  B.setCustom(app.bestiaryCustom);
  save();
}

function rollD66() { return (1 + Math.floor(Math.random() * 6)) * 10 + 1 + Math.floor(Math.random() * 6); }

Object.assign(actions, {
  bestOpen: function (el) { app.bestiary.enc = null; openMonster(el.dataset.id); },
  bestBack: function () {
    var st = app.bestiary;
    if (st.from === "combat") { st.from = null; st.entryId = null; app.mode = "combat"; }
    else st.open = null;
    window.scrollTo(0, 0);
  },
  bestEncounter: function () {
    var code = rollD66(), src = app.bestiary.src === "bob" ? "bob" : "gm";
    app.bestiary.enc = { code: code, id: B.encounter(code, src) };
  },
  bestSrc: function (el) { app.bestiary.src = el.dataset.src; app.bestiary.enc = null; },
  bestEncClear: function () { app.bestiary.enc = null; },
  bestDemon: function () {
    var m = B.demon();
    app.bestiaryCustom.unshift(m);
    app.bestiary.enc = null;
    saveCustom();
    openMonster(m.id, app.bestiary.from);
    toast(m.name + " gerado. Ele fica guardado no Bestiário.");
  },
  bestDeleteAsk: function () { app.bestiary.confirmDel = true; },
  bestDeleteCancel: function () { app.bestiary.confirmDel = false; },
  bestDelete: function () {
    var st = app.bestiary;
    app.bestiaryCustom = app.bestiaryCustom.filter(function (m) { return m.id !== st.open; });
    saveCustom();
    st.open = null; st.confirmDel = false; st.from = null;
  },
  bestPick: function () {
    var st = app.bestiary, m = B.get(st.open);
    if (!m) return;
    st.pick = Math.floor(Math.random() * B.attacks(m).length);
    st.roll = null;
  },
  bestSelect: function (el) {
    var st = app.bestiary, i = +el.dataset.i;
    if (st.pick !== i) st.roll = null;
    st.pick = i;
  },
  bestRoll: function (el) { bestRoll(+el.dataset.i, el.dataset.local === "1"); return false; },
  bestCancel: function () {
    Object.keys(app.resRolls).forEach(function (id) { if (String(app.resRolls[id]).indexOf("__mon:") === 0) delete app.resRolls[id]; });
    app.bestiary.rolling = false;
  },
  bestChat: function (el) {
    var st = app.bestiary, m = B.get(st.open);
    if (!m) return;
    var i = +el.dataset.i, a = B.attacks(m)[i], r = st.roll && st.roll.i === i ? st.roll : null;
    var head = "<b>" + clean(m.name) + "</b>: " + clean(a.name) + (m.kind === "monstro" && B.attacks(m).length === 6 ? " (D6: " + (i + 1) + ")" : "");
    var body;
    if (!r) body = (a.poison ? "Veneno " + a.poison + ". " : "") + (a.fx || "");
    else {
      var res = B.resolve(a, r.sixes);
      body = (res.hit ? r.sixes + (r.sixes === 1 ? " sucesso" : " sucessos") + (res.dmg ? " · " + res.dmg + " de dano em " + res.attr : "") : "Errou") +
        (res.hit && a.fx ? ". " + a.fx : "");
    }
    chat(head + "\n<size=85%>" + clean(body) + "</size>");
    if (r) r.posted = true; else st.roll = { i: i, values: [], sixes: 0, posted: true, none: true };
  },
  bestAdd: function () {
    var st = app.bestiary, m = B.get(st.open);
    if (!m) return;
    if (!app.combat) app.combat = I.create();
    var n = st.qty, str = Math.max(1, st.str || m.str), unit = m.copies ? m.copies.unit : null;
    var extra = m.extraCards || 0;
    if (n > 1 && (unit || !st.group)) {
      var have = monstersInCombat(m.id).length;
      for (var k = 1; k <= n; k++) {
        addCombatant({ name: m.name + (unit ? " · " + unit + " " : " ") + (have + k), kind: "npc", mon: m.id, hpMax: str, extra: extra }, true);
      }
    } else {
      addCombatant({ name: m.name, kind: "npc", count: n, mon: m.id, hpMax: str, extra: extra }, true);
    }
    afterCombatChange();
    toast(n > 1 ? n + "× " + m.name + " na Iniciativa." : m.name + " na Iniciativa.");
    return false;
  },
  bestToCombat: function () { app.bestiary.from = null; app.bestiary.entryId = null; app.mode = "combat"; window.scrollTo(0, 0); },
  hpStep: function (el) {
    I.setHp(app.combat, el.dataset.id, +el.dataset.i, +el.dataset.delta);
    save();
  },
  monSheet: function (el) {
    var e = I.find(app.combat, el.dataset.id);
    if (e && e.mon) openMonster(e.mon, "combat", e.id);
  },
  monAttack: function (el) {
    var e = I.find(app.combat, el.dataset.id), m = e && B.get(e.mon);
    if (!m) return;
    openMonster(m.id, "combat", e.id);
    var n = B.attacks(m).length;
    app.bestiary.pick = n > 1 ? Math.floor(Math.random() * n) : 0;
    app.bestiary.roll = null;
  }
});

document.addEventListener("input", function (ev) {
  var el = ev.target;
  if (!el.dataset || el.dataset.best !== "q") return;
  app.bestiary.q = el.value;
  var pos = el.selectionStart;
  render();
  var again = document.getElementById("f-best-q");
  if (again) { again.focus(); try { again.setSelectionRange(pos, pos); } catch (e) { /* sem seleção */ } }
});

document.addEventListener("change", function (ev) {
  var el = ev.target;
  if (!el.dataset || !el.dataset.best) return;
  if (el.dataset.best === "qty") app.bestiary.qty = +el.value;
  else if (el.dataset.best === "group") app.bestiary.group = el.checked;
  else if (el.dataset.best === "str") app.bestiary.str = Math.max(1, Math.min(99, +el.value || 0)) || null;
  else return;
  // O campo de Força dispara "change" no blur, às vezes no meio de outro clique.
  setTimeout(render, 0);
});
