"""Junta la app en un solo archivo para poder usarla dentro del chat de Claude."""
import pathlib, re, sys

root = pathlib.Path(__file__).parent
out = pathlib.Path(sys.argv[1])
html = (root / 'index.html').read_text()
body = re.search(r'<body>(.*?)<script', html, re.S).group(1)
css = (root / 'styles.css').read_text()
js = ''.join((root / f).read_text() for f in ['db.js', 'phases.js', 'app.js'])
assert '</script' not in js

extra_css = """
/* Dentro del chat */
header { top: env(safe-area-inset-top, 0px); }
body::before { content: ""; position: fixed; inset: 0 0 auto; height: env(safe-area-inset-top, 0px); z-index: 10; background: var(--bg); }
"""
out.write_text(f"""<title>Impacto K9 Pista</title>
<style>
{css}{extra_css}</style>
{body.strip()}
<script>
window.IMPACTO_ARTIFACT = true;
{js}</script>
""")
print(out, out.stat().st_size)
