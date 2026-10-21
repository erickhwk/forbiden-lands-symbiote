#!/usr/bin/env python3
"""
Prepara uma versão: python3 tools/release.py 0.9.0 [pasta-de-saída]

- grava a versão no manifest.json, package.json, online/manifest.json e js/app.js
- carimba ?v=<versão> nos css/js do index.html, para o navegador do TaleSpire
  não ficar preso numa versão antiga em cache (GitHub Pages)
- gera dois zips na pasta de saída (padrão: dist/):
    ficha-forbidden-lands-<v>.zip         Symbiote completo (local)
    ficha-forbidden-lands-online-<v>.zip  só manifest + ícone, carrega do GitHub Pages (ramo publicado)
    ficha-forbidden-lands-teste.zip       "Ficha FL (teste)": carrega o ramo main, para o Mestre
                                          testar antes de levar para o publicado
"""
import json, os, re, sys, zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
v = sys.argv[1]
out = sys.argv[2] if len(sys.argv) > 2 else os.path.join(ROOT, "dist")
os.makedirs(out, exist_ok=True)

def edit_json(path):
    p = os.path.join(ROOT, path)
    with open(p, encoding="utf-8") as f: data = json.load(f)
    data["version"] = v
    with open(p, "w", encoding="utf-8") as f: f.write(json.dumps(data, ensure_ascii=False, indent=2) + "\n")

for path in ["manifest.json", "package.json", "online/manifest.json"]: edit_json(path)

def sub(path, pattern, repl):
    p = os.path.join(ROOT, path)
    with open(p, encoding="utf-8") as f: s = f.read()
    s2 = re.sub(pattern, repl, s)
    with open(p, "w", encoding="utf-8") as f: f.write(s2)

sub("js/app.js", r'var APP_VERSION = "[^"]*";', 'var APP_VERSION = "%s";' % v)
sub("index.html", r'((?:href|src)="(?:css|js)/[^"?]+)(\?v=[^"]*)?"', r'\1?v=%s"' % v)

def zipdir(name, entries):
    path = os.path.join(out, name)
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as z:
        for src, arc in entries:
            full = os.path.join(ROOT, src)
            if os.path.isdir(full):
                for base, _, files in os.walk(full):
                    for fn in sorted(files):
                        fp = os.path.join(base, fn)
                        z.write(fp, os.path.join(arc, os.path.relpath(fp, full)))
            else:
                z.write(full, arc)
    print(path)

zipdir("ficha-forbidden-lands-%s.zip" % v,
       [(x, x) for x in ["manifest.json", "index.html", "icon.png", "README.md", "LICENSE", "css", "js", "fonts"]])
test = json.load(open(os.path.join(ROOT, "online/manifest.json"), encoding="utf-8"))
test["name"] = "Ficha FL (teste)"
test["summary"] = "Versão em teste da Ficha Forbidden Lands (ramo main). Só para o Mestre conferir antes de publicar."
test["entryPoint"] = "https://raw.githack.com/erickhwk/forbiden-lands-symbiote/main/index.html"
test_path = os.path.join(out, "manifest-teste.json")
with open(test_path, "w", encoding="utf-8") as f: f.write(json.dumps(test, ensure_ascii=False, indent=2) + "\n")
path = os.path.join(out, "ficha-forbidden-lands-teste.zip")
with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as z:
    z.write(test_path, "manifest.json")
    z.write(os.path.join(ROOT, "icon.png"), "icon.png")
    z.write(os.path.join(ROOT, "online/README.md"), "README.md")
os.remove(test_path)
print(path)

zipdir("ficha-forbidden-lands-online-%s.zip" % v,
       [("online/manifest.json", "manifest.json"), ("icon.png", "icon.png"), ("online/README.md", "README.md"), ("LICENSE", "LICENSE")])
