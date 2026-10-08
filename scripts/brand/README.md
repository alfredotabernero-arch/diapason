# Generador del logotipo de Diapasón

Los contornos del logotipo (`src/components/brand/logoData.js`) y los archivos de `public/brand/` se generan con estos dos scripts. Solo hace falta volver a ejecutarlos si cambias la tipografía, el eslogan o las proporciones del diapasón.

## Proporciones

La «i» es un diapasón en La 440 Hz de acero dibujado a escala real:

| Parte | Medida real | En el logotipo |
|---|---|---|
| Longitud total | 120 mm (modelo estándar Wittner 920) | ≈ 3,9 × altura x |
| Mango | 31 mm | = fuste de la «i» (de la línea base a la altura x), con su remate inferior |
| Curva (horquilla) | 10 mm | radio exterior 10 mm, interior 5 mm |
| Púas | 79 mm, Ø 5 mm | se elevan por encima de la palabra |
| Distancia entre ejes de las púas | 15 mm (hueco de 10 mm) | ancho exterior 20 mm → relación largo/ancho 6 : 1 |

En los iconos pequeños (`favicon.svg`, `icon-*.png`) se mantienen las longitudes, pero el trazo es más grueso para que se lea a 16–48 px.

## Regenerar

```bash
pip install fonttools brotli uharfbuzz
mkdir -p font && cd font
npm pack @fontsource/instrument-serif@5.0.8 @fontsource/instrument-sans@5.2.7
tar xzf fontsource-instrument-serif-5.0.8.tgz && mkdir sans && tar xzf fontsource-instrument-sans-5.2.7.tgz -C sans
python3 -c "from fontTools.ttLib import TTFont as T
for s,d in [('package/files/instrument-serif-latin-400-normal.woff2','IS.ttf'),('sans/package/files/instrument-sans-latin-500-normal.woff2','ISans500.ttf')]:
    f=T(s); f.flavor=None; f.save(d)"
cd ..
python3 build_logo.py font/IS.ttf logo.json   # geometría palabra + diapasón
python3 brand.py out                          # SVG, iconos y logoData.js
cp out/logoData.js ../../src/components/brand/
cp out/diapason-*.svg ../../public/brand/ && cp out/favicon.svg ../../public/
```

Los PNG (`icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png`) se exportan a partir de `diapason-icono.svg` y `diapason-icono-maskable.svg` con cualquier navegador o editor vectorial.
