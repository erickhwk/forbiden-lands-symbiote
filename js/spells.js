/*
 * Grimório: aba Magia e tela de lançar.
 *
 * A regra mora em magic.js (FLMagic). Este arquivo usa as funções de app.js
 * (app, render, save, toast, esc, ICON, actions, rollInjury, trayError…).
 *
 * A aba se preenche sozinha pelos talentos mágicos da ficha: cada Caminho
 * abre as magias da disciplina até a categoria dele, e Druidas e Feiticeiros
 * ganham as magias gerais até a categoria do caminho mais alto.
 *
 * app.cast:
 *   spellId, pfv, ingredient, grimoire, safe
 *   phase: "setup" | "tray" | "result" | "mishapTray"
 *   rollId, values, result, mishap, mishapNote, posted
 */
"use strict";

var M = window.FLMagic;

var PSYCHIC_TALENT = "poder-mental";

function magicAccess() { return M.access(app.sheet.talentList, app.sheet.profession); }

function showMagicTab() {
  return M.hasMagic(app.sheet.talentList, app.sheet.profession) || M.FULL_CASTERS.indexOf(app.sheet.profession) !== -1;
}

function hasPsychic() { return app.sheet.talentList.some(function (t) { return t.id === PSYCHIC_TALENT; }); }

function spellTags(sp) {
  return '<span class="chip-s">Cat. ' + sp.rank + "</span>" +
    (sp.kind !== "lenta" ? '<span class="chip-s' + (sp.kind === "ritual" ? " warn" : "") + '">' + M.KIND_LABEL[sp.kind] + "</span>" : "");
}

function ingredientLabel(sp) {
  return sp.path === "simbolismo" ? "Símbolo desenhado ou gravado" : (sp.ingredient || "Nenhum");
}

/* ------------------------------------------------------------------ */
/* Aba Magia                                                          */
/* ------------------------------------------------------------------ */

function renderMagic() {
  var acc = magicAccess(), s = app.sheet;
  var owned = M.PATHS.filter(function (p) { return p.talent && acc[p.key]; });
  var html = '<section role="tabpanel" aria-label="Magia" class="stack">';

  html += '<div class="card spell-intro"><div class="row between"><h2 class="eyebrow">Caminhos mágicos</h2>' +
    '<span class="small muted">' + E.plural(s.willpower, "PFV", "PFV") + "</span></div>";
  if (owned.length) {
    html += owned.map(function (p) {
      var t = talentById(p.talent);
      return '<div class="list-row"><div class="grow"><div class="item-name">' + esc(C.talent(p.talent).name) + "</div>" +
        '<div class="small muted">' + esc(p.name) + " · Categoria " + t.rank + "</div></div>" +
        (app.evolve
          ? '<span class="level">' + t.rank + "</span>" + evolveTalentButton(t)
          : '<button class="btn-step" data-action="talentRank" data-id="' + esc(t.id) + '" data-delta="-1" aria-label="Diminuir categoria"' + (t.rank <= 1 ? " disabled" : "") + ">−</button>" +
            '<span class="level">' + t.rank + "</span>" +
            '<button class="btn-step" data-action="talentRank" data-id="' + esc(t.id) + '" data-delta="1" aria-label="Aumentar categoria"' + (t.rank >= 3 ? " disabled" : "") + ">+</button>") +
        "</div>";
    }).join("");
    if (acc.geral) html += '<p class="small muted" style="margin:6px 0 0">Magia Geral na categoria ' + acc.geral + ", a do seu caminho mais alto.</p>";
    else html += '<p class="small muted" style="margin:6px 0 0">Magia Geral é só para Druidas e Feiticeiros.</p>';
  } else {
    html += '<p class="small muted" style="margin:0">Escolha um caminho mágico para abrir o grimório. Com categoria 1, você lança as magias de categoria 1 da disciplina.</p>';
  }
  var free = M.PATHS.filter(function (p) {
    if (!p.talent || acc[p.key]) return false;
    var c = C.talent(p.talent);
    return !s.profession || c.profession === s.profession || M.FULL_CASTERS.indexOf(s.profession) === -1;
  });
  if (free.length && !app.evolve) {
    html += '<div class="adder" style="margin-top:10px"><label for="f-add-path" class="sr-only">Adicionar caminho mágico</label>' +
      '<select id="f-add-path" class="field grow"><option value="">Adicionar caminho…</option>' +
      free.map(function (p) { return '<option value="' + p.talent + '">' + esc(C.talent(p.talent).name) + " (" + esc(p.name) + ")</option>"; }).join("") +
      '</select><button class="btn-add" data-action="pathAdd">Adicionar</button></div>';
  }
  html += "</div>";

  M.PATHS.forEach(function (p) {
    var rank = acc[p.key];
    if (!rank) return;
    var list = M.SPELLS.filter(function (sp) { return sp.path === p.key; });
    var open = list.filter(function (sp) { return sp.rank <= rank; });
    var risky = list.filter(function (sp) { return sp.rank === rank + 1; });
    html += '<div class="spell-group"><div class="row between"><h3>' + esc(p.name) + '</h3><span class="small muted">até categoria ' + rank + "</span></div>" +
      open.map(spellRow).join("") +
      (risky.length
        ? '<details class="late"><summary>Uma categoria acima · lançamento arriscado (' + risky.length + ")</summary>" + risky.map(spellRow).join("") + "</details>"
        : "") +
      "</div>";
  });

  return html + "</section>";
}

function spellRow(sp) {
  var st = M.castStatus(sp.rank, magicAccess()[sp.path], false);
  return '<div class="spell-row' + (st.status === "risky" ? " risky" : "") + '">' +
    '<details class="spell"><summary><span class="item-name">' + esc(sp.name) + "</span>" + spellTags(sp) + "</summary>" +
      '<div class="spell-body"><div class="small">' + esc(sp.effect) + "</div>" +
      '<div class="small muted">' + esc(sp.range) + " · " + esc(sp.duration) + " · Ingrediente: " + esc(ingredientLabel(sp)) + "</div></div></details>" +
    '<button class="btn-add slim" data-action="castOpen" data-spell="' + sp.id + '"' + (app.evolve ? " disabled" : "") + ">" + ICON.spark + "Lançar</button>" +
  "</div>";
}

/* ------------------------------------------------------------------ */
/* Tela de lançar                                                     */
/* ------------------------------------------------------------------ */

function castState(c) {
  var sp = M.spellById(c.spellId);
  var rank = magicAccess()[sp.path] || 0;
  var st = M.castStatus(sp.rank, rank, c.grimoire);
  var psychic = hasPsychic();
  var counted = M.countedWp(c.pfv, psychic);
  var safe = Math.min(c.safe, st.safeMax, counted);
  return { sp: sp, rank: rank, st: st, psychic: psychic, counted: counted, safe: safe, dice: M.baseDice(c.pfv, psychic, safe) };
}

function renderCast() {
  var c = app.cast;
  if (c.phase === "result" || c.phase === "mishapTray") return renderCastResult();
  var k = castState(c), sp = k.sp, wp = app.sheet.willpower;
  var busy = c.phase === "tray";

  var html = '<div class="back">' +
    '<button class="btn-icon sm" data-action="castClose" aria-label="Voltar para a ficha"' + (busy ? " disabled" : "") + ">" + ICON.back + "</button>" +
    '<div><p class="eyebrow">' + esc(M.pathByKey(sp.path).name) + " · categoria " + sp.rank + "</p>" +
    '<h1 class="title">' + esc(sp.name) + "</h1></div></div>";

  html += '<section class="card stack-sm"><div class="row" style="gap:6px;flex-wrap:wrap">' + spellTags(sp) +
    '<span class="chip-s">' + esc(sp.range) + '</span><span class="chip-s">' + esc(sp.duration) + "</span></div>" +
    '<div class="small">' + esc(sp.effect) + "</div></section>";

  if (k.st.status === "risky") {
    html += '<div class="notice error">' + ICON.warn + "<span>Lançamento arriscado: a magia está uma categoria acima do seu caminho. O infortúnio mágico é garantido.</span></div>";
  } else if (k.st.status === "blocked") {
    html += '<div class="notice error">' + ICON.warn + "<span>Duas categorias acima do seu caminho: não dá para lançar.</span></div>";
  }
  if (sp.kind === "ritual") html += '<div class="notice">' + ICON.warn + "<span>Ritual: leva cerca de um Quarto de Dia e não serve em combate.</span></div>";

  html += '<section class="pool" aria-label="Como lançar">';
  html += '<div class="card"><div class="pool-row"><span class="chip chip-attribute"></span>' +
    '<div class="label"><strong>Força de Vontade</strong><span class="small muted">Você tem ' + wp +
    (k.psychic ? " · Poder Mental: contam " + k.counted : "") + "</span></div>" +
    '<button class="btn-step" data-action="castPfv" data-delta="-1" aria-label="Menos PFV"' + (busy || c.pfv <= 1 ? " disabled" : "") + ">−</button>" +
    '<span class="count">' + c.pfv + "</span>" +
    '<button class="btn-step" data-action="castPfv" data-delta="1" aria-label="Mais PFV"' + (busy || c.pfv >= wp ? " disabled" : "") + ">+</button></div></div>";

  html += '<div class="card"><div class="pool-row"><span class="chip chip-artifact"></span>' +
    '<div class="label"><strong>Ingrediente</strong><span class="small muted">' + esc(ingredientLabel(sp)) + " · +1 no Nível de Poder, gasto ao lançar</span></div></div>" +
    '<div class="seg" role="group" aria-label="Ingrediente">' +
      '<button data-action="castIngr" data-on="0" aria-pressed="' + !c.ingredient + '"' + (busy ? " disabled" : "") + ">Sem</button>" +
      '<button data-action="castIngr" data-on="1" aria-pressed="' + !!c.ingredient + '"' + (busy ? " disabled" : "") + ">Com</button></div>" +
    (sp.path === "simbolismo" ? '<p class="small muted" style="margin:8px 0 0">Desenhar leva alguns minutos e não dá no calor do combate; gravar em pedra leva um Quarto de Dia ou mais.</p>' : "") +
    "</div>";

  html += '<div class="card"><div class="pool-row"><span class="chip chip-gear"></span>' +
    '<div class="label"><strong>Lendo do grimório</strong><span class="small muted">A magia conta um passo abaixo. Em combate, ler custa uma ação rápida.</span></div></div>' +
    '<div class="seg" role="group" aria-label="Grimório">' +
      '<button data-action="castGrim" data-on="0" aria-pressed="' + !c.grimoire + '"' + (busy ? " disabled" : "") + ">De cabeça</button>" +
      '<button data-action="castGrim" data-on="1" aria-pressed="' + !!c.grimoire + '"' + (busy ? " disabled" : "") + ">Do grimório</button></div></div>";

  if (k.st.safeMax > 0) {
    html += '<div class="card"><div class="pool-row"><span class="chip chip-negative"></span>' +
      '<div class="label"><strong>Lançamento seguro</strong><span class="small muted">Até ' + E.plural(k.st.safeMax, "dado", "dados") +
      " a menos: menos risco de infortúnio, menos chance de sobrecarga</span></div>" +
      '<button class="btn-step" data-action="castSafe" data-delta="-1" aria-label="Rolar mais dados"' + (busy || k.safe <= 0 ? " disabled" : "") + ">−</button>" +
      '<span class="count">' + k.safe + "</span>" +
      '<button class="btn-step" data-action="castSafe" data-delta="1" aria-label="Rolar menos dados"' + (busy || k.safe >= Math.min(k.st.safeMax, k.counted) ? " disabled" : "") + ">+</button></div></div>";
  }
  html += "</section>";

  var base = k.counted + (c.ingredient ? 1 : 0);
  html += '<section aria-label="Resumo"><div class="row between" style="margin-bottom:8px">' +
    '<span class="eyebrow">Nível de Poder ' + base + (c.ingredient ? " (com ingrediente)" : "") + "</span>" +
    '<span style="font-family:var(--display);font-size:18px;font-weight:600">' + (k.dice ? E.plural(k.dice, "Dado Base", "Dados Base") : "sem rolagem") + "</span></div>" +
    '<div class="tray-preview" aria-hidden="true">' + new Array(k.dice + 1).join('<span class="tray-attribute"></span>') + "</div>" +
    '<p class="small muted" style="margin:8px 0 0">Cada 6 soma 1 ao poder. Qualquer 1 é infortúnio mágico. Não dá para forçar.</p></section>';

  var can = k.st.status !== "blocked" && wp >= c.pfv && c.pfv >= 1;
  html += '<div class="actions">';
  if (c.notice) html += '<div class="notice error">' + esc(c.notice) + "</div>";
  if (wp < 1) html += '<div class="notice error">' + ICON.warn + "<span>Sem Força de Vontade. Você ganha PFV ao forçar rolagens.</span></div>";
  if (busy) {
    html += '<div class="notice" role="status">' + ICON.tray + "<span>Dados Base na bandeja. Pegue e jogue no tabuleiro.</span></div>" +
      '<button class="btn-ghost" data-action="castCancelTray">Cancelar</button>';
  } else if (!k.dice) {
    html += '<button class="btn-primary" data-action="castGo" data-local="1"' + (can ? "" : " disabled") + ">" + ICON.spark + "Lançar sem rolar</button>" +
      '<p class="small muted" style="margin:0">Com zero dados, a magia simplesmente funciona.</p>';
  } else if (app.ts) {
    html += '<button class="btn-primary" data-action="castGo"' + (can ? "" : " disabled") + ">" + ICON.die + "Colocar na bandeja</button>" +
      '<button class="link-btn" data-action="castGo" data-local="1"' + (can ? "" : " disabled") + ">Rolar aqui, sem dados 3D</button>";
  } else {
    html += '<button class="btn-primary" data-action="castGo" data-local="1"' + (can ? "" : " disabled") + ">" + ICON.die + "Lançar</button>";
  }
  return html + "</div>";
}

function castGo(local) {
  var c = app.cast, k = castState(c);
  if (app.sheet.willpower < c.pfv) { toast("Pontos de Força de Vontade insuficientes."); return; }
  c.notice = null;
  if (!k.dice || local || !app.ts) {
    var v = [];
    for (var i = 0; i < k.dice; i++) v.push(1 + Math.floor(Math.random() * 6));
    resolveCast(v);
    return;
  }
  c.phase = "tray";
  render();
  TS.dice.putDiceInTray([{ name: "Dados Base", roll: k.dice + "d6" }], true).then(function (rollId) {
    if (app.cast === c) { c.rollId = rollId; app.resRolls[rollId] = "__cast"; }
  }).catch(function (err) {
    console.error(err);
    if (app.cast !== c) return;
    c.phase = "setup";
    c.notice = trayError(err);
    render();
  });
}

function resolveCast(values) {
  var c = app.cast, k = castState(c), s = app.sheet;
  c.values = values;
  c.result = M.resolve({ pfv: c.pfv, psychic: k.psychic, values: values, ingredient: c.ingredient, risky: k.st.status === "risky" });
  c.risky = k.st.status === "risky";
  c.safeUsed = k.safe;
  s.willpower = Math.max(0, s.willpower - c.pfv);
  c.phase = "result";
  save();
  render();
  chatCast();
}

function chatCast() {
  if (!app.ts) return;
  var c = app.cast, r = c.result, sp = M.spellById(c.spellId);
  var who = (app.sheet.name || "Personagem").replace(/[<>]/g, "");
  var parts = [c.pfv + " PFV" + (r.base !== c.pfv ? " (contam " + r.base + ")" : "")];
  if (r.overcharge) parts.push("+" + r.overcharge + " sobrecarga");
  if (r.ingredient) parts.push("+1 ingrediente");
  var text = "<b>" + who + "</b> lançou <b>" + sp.name + "</b> · <color=#D4793A><b>Nível de Poder " + r.power + "</b></color>" +
    " <size=85%>(" + parts.join(", ") + ")</size>";
  if (c.risky) text += "\n<size=85%>Lançamento arriscado</size>";
  if (r.mishap) text += "\n<color=#E0604E><b>INFORTÚNIO MÁGICO</b></color>";
  if (c.values.length) text += "\n<size=85%><color=#A89C88>" + c.values.join(" ") + "</color></size>";
  TS.chat.send(text, "board").catch(function () {});
}

function renderCastResult() {
  var c = app.cast, r = c.result, sp = M.spellById(c.spellId);
  var waiting = c.phase === "mishapTray";
  var html = '<header><div class="row between"><p class="eyebrow">' + esc(sp.name) + " · " + esc(app.sheet.name || "Personagem") + "</p>" +
    (app.ts ? '<span class="row small muted" style="gap:6px">' + ICON.check + "No chat da mesa</span>" : "") + "</div>" +
    '<div class="big"><span class="n">' + r.power + '</span><span class="w">de poder</span></div></header>';

  var lines = [];
  lines.push([E.plural(c.pfv, "PFV gasto", "PFV gastos") + (r.base !== c.pfv ? " (contam " + r.base + ")" : "") + " · restam " + app.sheet.willpower, "var(--accent)"]);
  if (r.overcharge) lines.push(["+" + r.overcharge + " de sobrecarga (" + (r.overcharge === 1 ? "um 6" : r.overcharge + " seis") + ")", "var(--success)"]);
  if (r.ingredient) lines.push(["+1 do ingrediente, que foi gasto", "var(--success)"]);
  if (c.safeUsed) lines.push(["Lançamento seguro: " + E.plural(c.safeUsed, "dado", "dados") + " a menos", "var(--info)"]);
  if (!c.values.length) lines.push(["Sem rolagem: a magia funciona como pretendido", "var(--info)"]);
  html += '<section class="consequences" aria-label="Resultado">' + lines.map(function (l) {
    return '<div><span class="mark" style="background:' + l[1] + '"></span>' + esc(l[0]) + "</div>";
  }).join("") + "</section>";

  html += '<section class="card stack-sm"><div class="small">' + esc(sp.effect) + "</div></section>";

  if (c.values.length) {
    html += '<section class="card dice-groups" aria-label="Dados rolados"><div><span class="small muted">Dados Base</span><div class="dice-row">' +
      c.values.map(function (v) {
        var cls = "die die-attribute" + (v === 6 ? " success" : v === 1 ? " bane" : " dim");
        return '<span class="' + cls + '" role="img" aria-label="' + v + (v === 6 ? ", sobrecarga" : v === 1 ? ", infortúnio" : "") + '">' + v + "</span>";
      }).join("") + "</div></div>" +
      '<div class="legend"><span><i style="outline:2px solid var(--success)"></i>Sobrecarga</span>' +
      '<span><i style="outline:2px dashed var(--bane)"></i>Infortúnio</span></div></section>';
  }

  if (r.mishap) {
    html += '<section class="banner" role="alert"><div class="banner-title">' + ICON.warn + "<span>Infortúnio mágico</span></div>";
    if (c.mishap) {
      html += '<div class="banner-item"><strong>' + c.mishap.code + ".</strong> " + esc(c.mishap.text) + "</div>" +
        (c.mishapNote ? '<div class="banner-item small">' + esc(c.mishapNote) + "</div>" : "");
      if (c.mishap.auto && c.mishap.auto.injury && !c.injuryDone) {
        html += '<button class="btn-add danger" data-action="castInjury">' + ICON.die + "Rolar ferimento grave · " + J.LABELS[c.mishap.auto.injury] + "</button>";
      }
    } else if (waiting) {
      html += '<div class="notice" role="status">' + ICON.tray + "<span>Dezena e unidade na bandeja. Jogue no tabuleiro.</span></div>";
    } else {
      html += '<div class="banner-item">' + (c.risky ? "O lançamento arriscado traz um infortúnio." : "Saiu 1 nos Dados Base.") + " Role D66 na tabela de infortúnios.</div>" +
        '<button class="btn-add danger" data-action="castMishap">' + ICON.die + "Rolar infortúnio (D66)</button>";
    }
    html += "</section>";
  }

  html += '<div class="actions">';
  if (waiting) html += '<button class="btn-ghost" data-action="castMishapCancel">Cancelar</button>';
  else html += '<button class="' + (r.mishap && !c.mishap ? "btn-ghost" : "btn-primary") + '" data-action="castClose">Voltar para a ficha</button>';
  return html + "</div>";
}

function rollMishap(local) {
  var c = app.cast;
  if (local || !app.ts) { applyMishap(1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)); return; }
  c.phase = "mishapTray";
  render();
  TS.dice.putDiceInTray([{ name: "Dezena", roll: "1d6" }, { name: "Unidade", roll: "1d6" }], true).then(function (rollId) {
    if (app.cast === c) app.resRolls[rollId] = "__mishap";
  }).catch(function (err) {
    console.error(err);
    if (app.cast !== c) return;
    c.phase = "result";
    toast(trayError(err));
    render();
  });
}

function applyMishap(tens, units) {
  var c = app.cast, s = app.sheet;
  if (!c) return;
  c.phase = "result";
  var m = M.mishap(M.d66(tens, units));
  c.mishap = m;
  var note = [], broke = [];
  var a = m && m.auto;
  if (a && a.rep) { s.reputation = Math.min(MAX_REP, (s.reputation | 0) + a.rep); note.push("Reputação agora " + s.reputation + "."); }
  if (a && a.cond) { s.conditions[a.cond] = true; note.push("Condição marcada na ficha."); }
  if (a && a.dmg) {
    Object.keys(a.dmg).forEach(function (key) {
      var at = s.attrs[key], was = at.cur;
      at.cur = Math.max(0, at.cur - a.dmg[key]);
      if (was > 0 && at.cur === 0) {
        broke.push(attrByKey(key).name);
        if (key === "forca" || key === "astucia") s.injuryRolled[key] = false;
      }
    });
    note.push("Dano marcado na ficha" + (broke.length ? ": " + broke.join(" e ") + " Acabada." : "."));
  }
  c.mishapNote = note.join(" ");
  save();
  render();
  if (app.ts && m) {
    var who = (s.name || "Personagem").replace(/[<>]/g, "");
    TS.chat.send("<b>" + who + "</b> · infortúnio mágico (" + m.code + "): <color=#E0604E>" + clean(m.text) + "</color>" +
      (broke.length ? "\n<color=#E0604E><b>" + broke.join(" e ").toUpperCase() + " ACABADA</b></color>" : ""), "board").catch(function () {});
  }
}

/* Chamado por handleResourceRoll (app.js) para "__cast" e "__mishap". */
function handleCastRoll(key, ev) {
  var c = app.cast;
  if (!c) return;
  var g = ev.kind === "rollResults" ? (ev.payload.resultsGroups || []).map(readGroup) : null;
  if (key === "__cast") {
    if (g && g[0] && c.phase === "tray") { resolveCast(g[0].values); return; }
    if (c.phase === "tray") { c.phase = "setup"; c.notice = "Os dados saíram da bandeja sem rolar."; }
    render();
    return;
  }
  if (g && c.phase === "mishapTray") {
    var pair = matchGroups([{ name: "Dezena", count: 1 }, { name: "Unidade", count: 1 }], g);
    var t = pair[0].values[0], u = pair[1].values[0];
    if (t && u) { applyMishap(t, u); return; }
  }
  if (c.phase === "mishapTray") c.phase = "result";
  render();
}

function clearCastRolls() {
  Object.keys(app.resRolls).forEach(function (id) {
    if (app.resRolls[id] === "__cast" || app.resRolls[id] === "__mishap") delete app.resRolls[id];
  });
}

Object.assign(actions, {
  pathAdd: function () {
    var sel = document.getElementById("f-add-path");
    if (!sel || !sel.value) { toast("Escolha um caminho na lista."); return false; }
    if (!talentById(sel.value)) app.sheet.talentList.push({ id: sel.value, rank: 1 });
    save();
  },
  castOpen: function (el) {
    var sp = M.spellById(el.dataset.spell);
    if (!sp) return false;
    var st = M.castStatus(sp.rank, magicAccess()[sp.path], false);
    app.cast = { spellId: sp.id, pfv: Math.max(1, Math.min(sp.rank, app.sheet.willpower || 1)), ingredient: false, grimoire: false, safe: 0, phase: "setup", values: [] };
    if (st.status === "blocked") app.cast.grimoire = true;
    app.view = "cast";
    window.scrollTo(0, 0);
  },
  castClose: function () {
    clearCastRolls();
    app.cast = null;
    app.view = "sheet";
  },
  castPfv: function (el) { var c = app.cast; c.pfv = clamp(c.pfv + (+el.dataset.delta), 1, Math.max(1, app.sheet.willpower)); },
  castIngr: function (el) { app.cast.ingredient = el.dataset.on === "1"; },
  castGrim: function (el) { app.cast.grimoire = el.dataset.on === "1"; app.cast.safe = 0; },
  castSafe: function (el) { var c = app.cast, k = castState(c); c.safe = clamp(k.safe + (+el.dataset.delta), 0, Math.min(k.st.safeMax, k.counted)); },
  castGo: function (el) { castGo(el.dataset.local === "1"); return false; },
  castCancelTray: function () { clearCastRolls(); app.cast.phase = "setup"; },
  castMishap: function () { rollMishap(false); return false; },
  castMishapCancel: function () { clearCastRolls(); app.cast.phase = "result"; },
  castInjury: function () {
    var c = app.cast;
    c.injuryDone = true;
    rollInjury(c.mishap.auto.injury);
    clearCastRolls();
    app.cast = null;
    app.view = "sheet";
    if (app.ts) toast("Ferimento grave: dezena e unidade na bandeja.");
  }
});
