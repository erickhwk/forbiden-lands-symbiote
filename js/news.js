/*
 * Novidades: na primeira vez que a ficha abre numa versão nova, mostra o que
 * mudou, lido do CHANGELOG.md publicado junto com a ficha.
 *
 * A versão já vista fica na ficha (sheet.seenVersion). Fichas que nunca viram
 * novidades recebem só as da versão atual. Sem o arquivo (por exemplo, sem
 * internet), não mostra nada.
 */
"use strict";

app.news = null; // [{ v, items: [texto] }] da versão mais nova para a mais antiga

function parseChangelog(text) {
  var out = [], cur = null;
  String(text).split(/\r?\n/).forEach(function (line) {
    var h = /^##\s+(\d+\.\d+\.\d+)\s*$/.exec(line);
    if (h) { cur = { v: h[1], items: [] }; out.push(cur); return; }
    var b = /^-\s+(.*)$/.exec(line);
    if (b && cur) cur.items.push(b[1]);
  });
  return out;
}

function cmpVersion(a, b) {
  var x = String(a).split(".").map(Number), y = String(b).split(".").map(Number);
  for (var i = 0; i < 3; i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0); }
  return 0;
}

/* Versões ainda não vistas, até a atual (no máximo três, para não virar um muro de texto). */
function unseenNews() {
  if (!app.news) return [];
  var seen = app.sheet.seenVersion;
  if (seen && cmpVersion(seen, APP_VERSION) >= 0) return [];
  return app.news.filter(function (n) {
    return cmpVersion(n.v, APP_VERSION) <= 0 && (seen ? cmpVersion(n.v, seen) > 0 : n.v === APP_VERSION);
  }).slice(0, 3);
}

function renderNews() {
  var list = unseenNews();
  if (!list.length) return "";
  return '<section class="card news" aria-label="Novidades">' +
    '<div class="row between"><h2 class="news-title">' + ICON.spark + "<span>Novidades da versão " + esc(list[0].v) + "</span></h2></div>" +
    list.map(function (n, i) {
      return (i ? '<p class="eyebrow" style="margin:6px 0 0">Versão ' + esc(n.v) + "</p>" : "") +
        '<ul class="news-list">' + n.items.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul>";
    }).join("") +
    '<button class="btn-add slim" data-action="newsSeen">Entendi</button>' +
  "</section>";
}

function loadNews() {
  if (typeof fetch !== "function") return;
  fetch("CHANGELOG.md?v=" + encodeURIComponent(APP_VERSION), { cache: "no-cache" }).then(function (r) {
    return r.ok ? r.text() : "";
  }).then(function (text) {
    if (!text) return;
    app.news = parseChangelog(text);
    render();
  }).catch(function () { /* sem novidades: tudo bem */ });
}

Object.assign(actions, {
  newsSeen: function () { app.sheet.seenVersion = APP_VERSION; save(); }
});

loadNews();
