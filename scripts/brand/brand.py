"""Genera los activos de marca de Diapasón a partir de logo.json."""
import json, sys, os, math
import uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

OUT = sys.argv[1]; os.makedirs(OUT, exist_ok=True)
L = json.load(open('logo.json'))
W, H = L['viewBox'][2], L['viewBox'][3]
BASE = L['baseline']
INK_L, INK_R = L['inkLeft'], L['inkRight']
SLOGAN = 'La agenda inteligente para profesores de música'
INK, BRASS, BRASS_LIGHT, NAVY, SLATE = '#141A2C', '#B07F30', '#DBB66A', '#1F2740', '#4D5D84'

# ---------- eslogan en contornos (Instrument Sans 500), justificado al ancho de la palabra
fpath = 'font/ISans500.ttf'
blob = hb.Blob.from_file_path(fpath); face = hb.Face(blob); font = hb.Font(face)
buf = hb.Buffer(); buf.add_str(SLOGAN); buf.guess_segment_properties(); hb.shape(font, buf, {'kern': True, 'liga': False})
tt = TTFont(fpath); gs = tt.getGlyphSet(); order = tt.getGlyphOrder(); upm = tt['head'].unitsPerEm
TRACK = 0.03 * upm
adv = [p.x_advance for p in buf.glyph_positions]
n = len(adv)
natural = sum(adv) + TRACK * (n - 1)
scale = (INK_R - INK_L) / natural            # unidades logo por unidad de fuente
size = scale * upm
GAP = 150                                    # separación bajo el descendente de la p
s_base = BASE - L['descender'] + GAP + 0.72 * size * 1.0   # línea base del eslogan (coord. SVG)
x = 0; parts = []
for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
    pen = SVGPathPen(gs)
    gs[order[info.codepoint]].draw(TransformPen(pen, (scale, 0, 0, -scale, INK_L + (x + pos.x_offset) * scale, s_base - pos.y_offset * scale)))
    parts.append(pen.getCommands()); x += pos.x_advance + TRACK
slogan_d = ''.join(parts)
LOCK_H = s_base + 0.25 * size + 40
print('slogan size (logo units)', round(size), 'cap ratio vs word', round(0.72 * size / 720, 3))

# ---------- marca: solo el diapasón (centrado en su propio lienzo)
fx = L['forkCx']
fork_top_svg = BASE - L['forkTop']
mark_vb = [fx - 260, fork_top_svg - 20, 520, BASE - fork_top_svg + 40]

def svg(vb, body, title='Diapasón'):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{" ".join(str(round(v,1)) for v in vb)}" role="img" aria-label="{title}">'
            f'<title>{title}</title>{body}</svg>\n')

P = lambda d, c: ''.join(f'<path d="{x}" fill="{c}"/>' for x in (d if isinstance(d, list) else [d]))
word, fork = L['word'], L['fork']   # fork = [mango, horquilla]
files = {
  'diapason-logo.svg': svg([0, 0, W, H], P(word, INK) + P(fork, BRASS)),
  'diapason-logo-negativo.svg': svg([0, 0, W, H], P(word, '#FFFFFF') + P(fork, BRASS_LIGHT)),
  'diapason-logo-mono.svg': svg([0, 0, W, H], P(word, INK) + P(fork, INK)),
  'diapason-lockup.svg': svg([0, 0, W, LOCK_H], P(word, INK) + P(fork, BRASS) + P(slogan_d, SLATE),
                            'Diapasón — La agenda inteligente para profesores de música'),
  'diapason-lockup-negativo.svg': svg([0, 0, W, LOCK_H], P(word, '#FFFFFF') + P(fork, BRASS_LIGHT) + P(slogan_d, '#C6CEDF'),
                            'Diapasón — La agenda inteligente para profesores de música'),
  'diapason-marca.svg': svg(mark_vb, P(fork, BRASS)),
}
# Diapasón robusto para iconos pequeños: mismas proporciones de longitud
# (mango 31 : curva 10 : púas 79) pero trazo más grueso para que se lea a 16-48 px.
def icon_fork(cx, top, height):
    k = height / 120.0
    t = 9.5 * k                     # grosor de púa
    RO, RI = 2 * t, t               # curva exterior / interior (hueco = 2t)
    hand_w = 1.15 * t
    y_top = top
    y_base = top + height
    y_bend = y_base - 31 * k        # centro inferior de la curva = arranque del mango
    yc = y_bend - RO                # centro de la curva
    foot = 2.6 * t; fh = 0.55 * t   # remate inferior (como la «i»)
    d = (f"M{cx-RO:.1f} {yc:.1f}A{RO:.1f} {RO:.1f} 0 0 0 {cx+RO:.1f} {yc:.1f}"
         f"L{cx+RO:.1f} {y_top:.1f}L{cx+RI:.1f} {y_top:.1f}L{cx+RI:.1f} {yc:.1f}"
         f"A{RI:.1f} {RI:.1f} 0 0 1 {cx-RI:.1f} {yc:.1f}L{cx-RI:.1f} {y_top:.1f}L{cx-RO:.1f} {y_top:.1f}Z"
         f"M{cx-hand_w/2:.1f} {y_bend-RO*0.2:.1f}L{cx+hand_w/2:.1f} {y_bend-RO*0.2:.1f}"
         f"L{cx+hand_w/2:.1f} {y_base-fh*1.6:.1f}Q{cx+hand_w/2:.1f} {y_base-fh:.1f} {cx+foot/2:.1f} {y_base-fh*0.7:.1f}"
         f"L{cx+foot/2:.1f} {y_base:.1f}L{cx-foot/2:.1f} {y_base:.1f}L{cx-foot/2:.1f} {y_base-fh*0.7:.1f}"
         f"Q{cx-hand_w/2:.1f} {y_base-fh:.1f} {cx-hand_w/2:.1f} {y_base-fh*1.6:.1f}Z")
    return [d.split('Z')[0] + 'Z', 'M' + d.split('ZM')[1]]

ICON_FORK = icon_fork(256, 46, 420)
ICON_FORK_MASK = icon_fork(256, 108, 296)
files['diapason-icono.svg'] = svg([0, 0, 512, 512], f'<rect width="512" height="512" rx="112" fill="{NAVY}"/>' + P(ICON_FORK, BRASS_LIGHT))
files['diapason-icono-maskable.svg'] = svg([0, 0, 512, 512], f'<rect width="512" height="512" fill="{NAVY}"/>' + P(ICON_FORK_MASK, BRASS_LIGHT))
files['favicon.svg'] = svg([0, 0, 512, 512], f'<rect width="512" height="512" rx="112" fill="{NAVY}"/>' + P(ICON_FORK, BRASS_LIGHT))

for name, content in files.items():
    open(os.path.join(OUT, name), 'w').write(content)

# Módulo JS para el componente React
js = ('// Archivo generado por scripts/brand: contornos del logotipo de Diapasón.\n'
      '// Palabra en Instrument Serif; la «i» es un diapasón A440 a escala real\n'
      '// (120 mm: mango 31 mm, curva 10 mm, púas 79 mm; Ø púa 5 mm; 15 mm entre ejes).\n'
      f'export const LOGO_VIEWBOX = [0, 0, {round(W)}, {round(H)}];\n'
      f'export const LOCKUP_VIEWBOX = [0, 0, {round(W)}, {round(LOCK_H)}];\n'
      f'export const MARK_VIEWBOX = {json.dumps([round(v, 1) for v in mark_vb])};\n'
      f'export const WORD_PATH = {json.dumps(word)};\n'
      f'export const FORK_PATHS = {json.dumps(fork)};\n'
      f'export const SLOGAN_PATH = {json.dumps(slogan_d)};\n'
      f"export const SLOGAN = {json.dumps(SLOGAN, ensure_ascii=False)};\n")
open(os.path.join(OUT, 'logoData.js'), 'w').write(js)
print('written', sorted(files))
