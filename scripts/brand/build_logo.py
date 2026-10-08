"""Genera el logotipo de Diapasón: palabra en Instrument Serif con la «i»
sustituida por un diapasón A440 a escala real (Wittner 120 mm; púas 79 mm,
Ø 5 mm, 15 mm entre ejes). El mango coincide con el fuste de la i."""
import json, math, sys
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.pointInsidePen import PointInsidePen

f = TTFont(sys.argv[1]); out = sys.argv[2]
gs = f.getGlyphSet(); cmap = f.getBestCmap(); hmtx = f['hmtx']
XH = f['OS/2'].sxHeight                       # 510
# --- medidas del diapasón (mm) -> unidades de fuente: mango = altura x
HANDLE_MM, PRONG_MM, PRONG_D_MM, AXIS_MM = 31.0, 79.0, 5.0, 15.0   # 31+10+79 = 120 mm
k = XH / HANDLE_MM
H = XH                                         # mango: línea base -> altura x
T_HANDLE = 68                                  # grosor del fuste de la i en la fuente
TP = PRONG_D_MM * k                            # grosor de cada púa
RC = AXIS_MM / 2 * k                           # radio del eje de la curva
RO, RI = RC + TP / 2, RC - TP / 2              # radio exterior / interior
YB = H + RO                                    # centro de la curva
TOP = YB + PRONG_MM * k                        # extremo de las púas

def fork_path(cx, flip):
    """flip(x, y) -> coordenadas SVG"""
    def P(x, y): X, Y = flip(x, y); return f"{X:.1f} {Y:.1f}"
    hl, hr = cx - T_HANDLE / 2, cx + T_HANDLE / 2
    yj = YB - math.sqrt(RO**2 - (T_HANDLE / 2)**2) + 1   # unión mango-curva
    # Mango = fuste real de la «i» (con su remate inferior), prolongado hasta la curva
    o = cx - 113          # el eje del fuste de la i está en x=113 dentro del glifo
    Q = lambda a, b, c, d: f"Q{P(o+a,b)} {P(o+c,d)}"
    handle = (f"M{P(o+30,0)}" + Q(15,0,15,11) + Q(15,20,28,23) + f"L{P(o+40,25)}"
              + Q(65,29,72,37.5) + Q(79,46,79,67) + f"L{P(o+79,yj)}L{P(o+147,yj)}L{P(o+147,67)}"
              + Q(147,46,153,37) + Q(159,28,176,26) + f"L{P(o+201,23)}" + Q(212,21,212,12) + Q(212,0,197,0) + "Z")
    # U: exterior izquierda -> abajo -> derecha, púa derecha, interior, púa izquierda
    u = (f"M{P(cx-RO,YB)}A{RO:.1f} {RO:.1f} 0 0 0 {P(cx+RO,YB)}"
         f"L{P(cx+RO,TOP)}L{P(cx+RI,TOP)}L{P(cx+RI,YB)}"
         f"A{RI:.1f} {RI:.1f} 0 0 1 {P(cx-RI,YB)}"
         f"L{P(cx-RI,TOP)}L{P(cx-RO,TOP)}Z")
    return [handle, u]

def fork_left_edge(y, cx):
    if y < H: return cx - T_HANDLE / 2
    if y < YB: return cx - math.sqrt(max(0, RO**2 - (YB - y)**2))
    return cx - RO

def right_ink(glyph, y, x0, x1):
    g = gs[glyph]
    for x in range(x1, x0, -2):
        p = PointInsidePen(gs, (x, y)); g.draw(p)
        if p.getResult(): return x
    return None

word = 'Diapasón'
glyphs = [cmap[ord(c)] for c in word]
GAP = 46        # holgura mínima entre la curva del diapasón y la D
pieces, x = [], 0
fork_cx = None
for i, g in enumerate(glyphs):
    adv, lsb = hmtx[g]
    if word[i] == 'i':
        # posición mínima del eje para no tocar la D (prev glyph en x_prev)
        xprev, gprev = pieces[-1][1], pieces[-1][0]
        need = 0
        for y in range(int(H), 721, 6):
            r = right_ink(gprev, y, 0, hmtx[gprev][0] + 20)
            if r is None: continue
            # cx tal que fork_left_edge(y,cx) >= xprev + r + GAP
            off = (fork_left_edge(y, 0))           # negativo
            need = max(need, xprev + r + GAP - off)
        normal_cx = x + 113                          # eje del fuste de la i en la fuente
        fork_cx = max(need, normal_cx)
        pieces.append(('FORK', fork_cx))
        x = fork_cx + T_HANDLE / 2 + 75            # mismo blanco derecho que la i
        continue
    pieces.append((g, x))
    x += adv
width = x

ASC = TOP + 30; DESC = -215
VB_W, VB_H = width, ASC - DESC
flip = lambda X, Y: (X, ASC - Y)
word_d = []
for g, px in pieces:
    if g == 'FORK': continue
    pen = SVGPathPen(gs)
    gs[g].draw(TransformPen(pen, (1, 0, 0, -1, px, ASC)))
    word_d.append(pen.getCommands())
fork_d = fork_path(fork_cx, flip)

from fontTools.pens.boundsPen import BoundsPen
def gb(g):
    b = BoundsPen(gs); gs[g].draw(b); return b.bounds
ink_left = pieces[0][1] + gb(pieces[0][0])[0]
ink_right = pieces[-1][1] + gb(pieces[-1][0])[2]
data = dict(inkLeft=ink_left, inkRight=ink_right, descender=gb(cmap[ord('p')])[1], viewBox=[0, 0, round(VB_W), round(VB_H)], word=''.join(word_d), fork=fork_d,
            baseline=ASC, xHeight=XH, capHeight=720, forkTop=TOP, forkCx=fork_cx,
            outerWidth=2 * RO, prong=TP)
json.dump(data, open(out, 'w'))
print({k: (round(v, 1) if isinstance(v, float) else v) for k, v in data.items() if k not in ('word', 'fork')})
print('ratio length/width', round(TOP / (2 * RO), 2), ' handle/total', round(H / TOP, 3))
