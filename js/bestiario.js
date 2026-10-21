/*
 * Bestiário do Mestre: lista, ficha do monstro, ataque e Iniciativa.
 *
 * Os dados moram em bestiary.js (FLBestiary). A Força de cada cópia fica na
 * entrada da Iniciativa (initiative.js: hp/hpMax). Usa app.js, gm.js e
 * combat.js (app, render, save, toast, esc, ICON, actions, chat, clean,
 * addCombatant, afterCombatChange, readGroup, trayError).
 */
"use strict";

var B = window.FLBestiary;

app.bestiary = { q: "", open: null, from: null, pick: null, roll: null, rolling: false, qty: 1, group: true, added: null };

/* ------------------------------------------------------------------ */
/* Lista                                                              */
/* ------------------------------------------------------------------ */

function renderBestiary() {
  var st = app.bestiary;
  if (st.open && B.get(st.open)) return renderMonster(B.get(st.open));

  var html = '<header><p class="eyebrow">Painel do Mestre</p><h1 class="title">Bestiário</h1></header>' +
    '<label class="sr-only" for="f-best-q">Buscar</label>' +
    '<input id="f-best-q" class="field" type="search" data-best="q" placeholder="Buscar criatura" value="' + esc(st.q) + '">' +
    '<details class="late best-rules"><summary>Monstros em combate</summary><ul class="shield-notes">' +
      B.RULES.map(function (r) { return "<li>" + esc(r) + "</li>"; }).join("") + "</ul>" +
      '<p class="eyebrow" style="margin:10px 0 4px">Animais</p><ul class="shield-notes">' +
      B.ANIMAL_RULES.map(function (r) { return "<li>" + esc(r) + "</li>"; }).join("") + "</ul></details>";

  var found = B.search(st.q);
  if (!found.length) return html + '<p class="muted" style="margin:0">Nenhuma criatura com esse nome.</p>';

  ["monstro", "animal"].forEach(function (kind) {
    var group = found.filter(function (m) { return m.kind === kind; });
    if (!group.length) return;
    html += '<section class="stack" aria-label="' + (kind === "monstro" ? "Monstros" : "Animais") + '">' +
      '<h2 class="eyebrow">' + (kind === "monstro" ? "Monstros" : "Animais") + "</h2>" +
      '<div class="best-list">' + group.map(function (m) {
        var inFight = monstersInCombat(m.id);
        return '<button class="best-row" data-action="bestOpen" data-id="' + m.id + '">' +
          '<span class="grow"><span class="best-name">' + esc(m.name) + "</span>" +
          '<span class="small muted">Força ' + m.str + " · Agilidade " + m.agi + (m.armor ? " · Armadura " + m.armor : "") + " · Movimento " + m.move + "</span></span>" +
          (inFight ? '<span class="chip-s warn">no combate</span>' : "") +
          ICON.chevron + "</button>";
      }).join("") + "</div></section>";
  });
  return html;
}

function monstersInCombat(id) {
  var c = app.combat;
  return c ? c.entries.filter(function (e) { return e.mon === id; }) : [];
}

/* ------------------------------------------------------------------ */
/* Ficha                                                              */
/* ------------------------------------------------------------------ */

function monsterAttacks(m) {
  return m.kind === "animal" ? [B.animalAttack(m)] : m.attacks;
}

function renderMonster(m) {
  var st = app.bestiary;
  var html = '<div class="gm-back"><button class="link-btn inline" data-action="bestBack">' + ICON.back +
    "<span>" + (st.from === "combat" ? "Iniciativa" : "Bestiário") + "</span></button></div>";

  html += '<header><p class="eyebrow">' + (m.kind === "monstro" ? "Monstro" : "Animal") + " · Guia do Mestre p. " + m.page + "</p>" +
    '<h1 class="title">' + esc(m.name) + "</h1></header>";

  var stats = [["Força", m.str], ["Agilidade", m.agi]];
  if (m.wits) stats.push(["Astúcia", m.wits]);
  if (m.emp) stats.push(["Empatia", m.emp]);
  stats.push(["Armadura", m.armor || "—"], ["Movimento", m.move]);
  html += '<section class="best-stats" style="grid-template-columns:repeat(' + stats.length + ',minmax(0,1fr))">' + stats.map(function (s) {
    return '<div class="mattr"><span class="small muted">' + s[0] + '</span><span class="mattr-num">' + s[1] + "</span></div>";
  }).join("") + "</section>";

  var chips = (m.skills || []).map(function (s) { return '<span class="chip-s">' + esc(s[0]) + " " + s[1] + "</span>"; });
  if (m.armorNote) chips.push('<span class="chip-s">Armadura de ' + esc(m.armorNote) + "</span>");
  if (chips.length) html += '<div class="chips">' + chips.join("") + "</div>";

  (m.traits || []).forEach(function (t) {
    html += '<div class="best-trait"><strong>' + esc(t.name) + ".</strong> " + esc(t.text) + "</div>";
  });

  html += renderAttacks(m);
  html += renderAddToCombat(m);
  return html;
}

function renderAttacks(m) {
  var st = app.bestiary, list = monsterAttacks(m), table = m.kind === "monstro";
  var html = '<section class="card best-attacks"><div class="row between"><h2 class="shield-h">' + (table ? "Ataques monstruosos" : "Ataque") + "</h2>" +
    (table ? '<button class="btn-add slim" data-action="bestPick">' + ICON.die + "Sortear D6</button>" : "") + "</div>";
  if (table) html += '<p class="small muted" style="margin:0">Sorteie ou toque no ataque que quer usar.</p>';

  html += '<ol class="atk-list">' + list.map(function (a, i) {
    var sel = st.pick === i || !table;
    var tags = [B.rangeName(a.range) + (a.all ? ", todos" : "")];
    if (a.block) tags.push("pode ser bloqueado");
    var out = '<li class="atk' + (sel ? " sel" : "") + (a.fear ? " fear" : "") + '">' +
      '<button class="atk-head" data-action="bestSelect" data-i="' + i + '"' + (table ? "" : " disabled") + ">" +
        (table ? '<span class="atk-n">' + (i + 1) + "</span>" : "") +
        '<span class="grow"><span class="atk-name">' + esc(a.name) + "</span>" +
          '<span class="atk-line">' + esc(B.attackLine(a)) + ' <span class="muted">· ' + esc(tags.join(" · ")) + "</span></span>" +
          (a.fx ? '<span class="atk-fx">' + esc(a.fx) + "</span>" : "") +
        "</span></button>";
    if (sel) out += renderAttackRoll(m, a, i);
    return out + "</li>";
  }).join("") + "</ol>";
  return html + "</section>";
}

function renderAttackRoll(m, a, i) {
  var st = app.bestiary, r = st.roll && st.roll.i === i ? st.roll : null;
  var html = '<div class="atk-roll">';
  if (r) {
    var res = B.resolve(a, r.sixes);
    html += '<div class="atk-dice">' + r.values.map(function (v) {
      return '<span class="die die-attribute' + (v === 6 ? " success" : "") + '">' + v + "</span>";
    }).join("") + "</div>" +
      '<div class="atk-result ' + (res.hit ? "atk-hit" : "atk-miss") + '">' +
        (res.hit
          ? "<strong>" + E.plural(r.sixes, "sucesso", "sucessos") + "</strong> · " + (res.dmg ? res.dmg + " de dano em " + res.attr : "acertou")
          : "<strong>Errou.</strong> Nenhum 6.") +
        (res.hit && !a.fear && a.dmg && r.sixes > 1 ? '<span class="small muted"> (' + a.dmg + " + " + (r.sixes - 1) + " pelos sucessos extras)</span>" : "") +
      "</div>" +
      '<div class="row" style="gap:8px;flex-wrap:wrap">' +
        (r.posted ? '<span class="small muted">' + ICON.check + " no chat</span>" : '<button class="btn-ghost slim" data-action="bestChat">Mostrar no chat</button>') +
        '<button class="link-btn inline" data-action="bestRoll" data-i="' + i + '">Rolar de novo</button>' +
      "</div>";
  } else if (st.rolling) {
    html += '<div class="notice" role="status">' + ICON.tray + "<span>Na sua bandeja. Jogue no tabuleiro.</span></div>" +
      '<button class="btn-ghost slim" data-action="bestCancel">Cancelar</button>';
  } else {
    html += '<div class="row" style="gap:10px;flex-wrap:wrap">' +
      '<button class="btn-primary slim" data-action="bestRoll" data-i="' + i + '">' + ICON.die + "Rolar " + a.dice + (a.skill ? "+" + a.skill : "") + " dados</button>" +
      (app.ts ? '<button class="link-btn inline" data-action="bestRoll" data-i="' + i + '" data-local="1">rolar aqui</button>' : "") +
      "</div>" +
      '<p class="small muted" style="margin:0">' + (a.fear ? "Cada 6 tira 1 de Astúcia." : m.kind === "monstro" ? "Cada 6 além do primeiro soma +1 de dano. Não dá para forçar." : "Força + Luta, como um PNJ.") + "</p>";
  }
  return html + "</div>";
}

function renderAddToCombat(m) {
  var st = app.bestiary, already = monstersInCombat(m.id);
  var html = '<section class="card best-add"><h2 class="shield-h">Pôr na Iniciativa</h2>' +
    '<div class="row" style="gap:10px;flex-wrap:wrap;align-items:center">' +
      '<label class="sr-only" for="f-best-qty">Quantos</label>' +
      '<select id="f-best-qty" class="field" data-best="qty" style="width:auto;margin-top:0">' +
        [1, 2, 3, 4, 5, 6, 8].map(function (n) { return '<option value="' + n + '"' + (st.qty === n ? " selected" : "") + ">×" + n + "</option>"; }).join("") +
      "</select>" +
      (st.qty > 1 ? '<label class="check small"><input type="checkbox" data-best="group"' + (st.group ? " checked" : "") + "> Uma carta para o grupo</label>" : "") +
      '<button class="btn-add" data-action="bestAdd">' + ICON.plus + "Adicionar</button>" +
    "</div>" +
    '<p class="small muted" style="margin:0">Cada um entra com Força ' + m.str + " para você ir descontando o dano." +
      (st.qty > 1 ? (st.group ? " O grupo compra uma carta só e age junto." : " Cada um compra a sua carta.") : "") + "</p>";
  if (already.length) {
    html += '<div class="small">' + ICON.check + " Já no combate: " + already.map(function (e) {
      return esc(e.name) + (e.hp ? " (" + e.hp.join(", ") + ")" : "");
    }).join("; ") + ' <button class="link-btn inline" data-action="bestToCombat">Ver Iniciativa</button></div>';
  }
  return html + "</section>";
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
  if (!e.mon) return "";
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
  var a = monsterAttacks(m)[i];
  st.pick = i;
  st.roll = null;
  if (local || !app.ts) {
    var vals = [];
    for (var k = 0; k < a.dice + (a.skill || 0); k++) vals.push(1 + Math.floor(Math.random() * 6));
    applyBestRoll(i, vals);
    return;
  }
  st.rolling = true;
  render();
  var dice = [{ name: "Base", roll: a.dice + "d6" }];
  if (a.skill) dice.push({ name: "Perícia", roll: a.skill + "d6" });
  TS.dice.putDiceInTray(dice, true).then(function (rollId) {
    app.resRolls[rollId] = "__mon:" + i;
  }).catch(function (err) {
    console.error(err);
    st.rolling = false;
    toast(trayError(err));
    render();
  });
}

function applyBestRoll(i, values) {
  var st = app.bestiary;
  st.rolling = false;
  st.roll = { i: i, values: values, sixes: values.filter(function (v) { return v === 6; }).length, posted: false };
  render();
}

/* Chamado por handleResourceRoll (app.js) para "__mon:…". */
function handleMonRoll(i, ev) {
  if (ev.kind === "rollResults") {
    var all = [];
    (ev.payload.resultsGroups || []).map(readGroup).forEach(function (g) { all = all.concat(g.values); });
    if (all.length) { applyBestRoll(i, all); return; }
  }
  app.bestiary.rolling = false;
  render();
}

function openMonster(id, from) {
  var st = app.bestiary;
  if (st.open !== id) { st.pick = null; st.roll = null; st.qty = 1; st.group = true; }
  st.open = id;
  st.from = from || null;
  app.mode = "bestiary";
  window.scrollTo(0, 0);
}

Object.assign(actions, {
  bestOpen: function (el) { openMonster(el.dataset.id); },
  bestBack: function () {
    var st = app.bestiary;
    if (st.from === "combat") { st.from = null; app.mode = "combat"; }
    else st.open = null;
    window.scrollTo(0, 0);
  },
  bestPick: function () {
    var st = app.bestiary;
    st.pick = Math.floor(Math.random() * 6);
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
  bestChat: function () {
    var st = app.bestiary, m = B.get(st.open), r = st.roll;
    if (!m || !r) return;
    var a = monsterAttacks(m)[r.i], res = B.resolve(a, r.sixes);
    chat("<b>" + clean(m.name) + "</b>: " + clean(a.name) + (m.kind === "monstro" ? " (D6: " + (r.i + 1) + ")" : "") + "\n<size=85%>" +
      (res.hit ? r.sixes + (r.sixes === 1 ? " sucesso" : " sucessos") + (res.dmg ? " · " + res.dmg + " de dano em " + res.attr : "") : "Errou") +
      (res.hit && a.fx ? ". " + clean(a.fx) : "") + "</size>");
    r.posted = true;
  },
  bestAdd: function () {
    var st = app.bestiary, m = B.get(st.open);
    if (!m) return;
    if (!app.combat) app.combat = I.create();
    var n = st.qty;
    if (n > 1 && !st.group) {
      var have = monstersInCombat(m.id).length;
      for (var k = 1; k <= n; k++) addCombatant({ name: m.name + " " + (have + k), kind: "npc", mon: m.id, hpMax: m.str }, true);
    } else {
      addCombatant({ name: m.name, kind: "npc", count: n, mon: m.id, hpMax: m.str }, true);
    }
    afterCombatChange();
    toast(n > 1 ? n + "× " + m.name + " na Iniciativa." : m.name + " na Iniciativa.");
    return false;
  },
  bestToCombat: function () { app.bestiary.from = null; app.mode = "combat"; window.scrollTo(0, 0); },
  hpStep: function (el) {
    I.setHp(app.combat, el.dataset.id, +el.dataset.i, +el.dataset.delta);
    save();
  },
  monSheet: function (el) {
    var e = I.find(app.combat, el.dataset.id);
    if (e && e.mon) openMonster(e.mon, "combat");
  },
  monAttack: function (el) {
    var e = I.find(app.combat, el.dataset.id), m = e && B.get(e.mon);
    if (!m) return;
    openMonster(m.id, "combat");
    app.bestiary.pick = m.kind === "monstro" ? Math.floor(Math.random() * 6) : 0;
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
  else return;
  render();
});
