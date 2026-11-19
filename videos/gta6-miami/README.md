# GTA 6 o Miami (short, 66 s)

Short de motion graphics + escenas 3D a código, al estilo del canal Lonutico, sincronizado a la voz palabra por palabra.

| Archivo | Qué es |
|---|---|
| `public/film.html` + `public/film.js` | Toda la animación: escenas, rótulos, subtítulos, efectos. Cada cuadro es función del tiempo. |
| `public/street.js` | La calle 3D estilo Vice City (three.js): hoteles neón, palmeras, autos, muñecos. |
| `public/timeline.js` | Línea de tiempo maestra (la usan la animación y el sonido). |
| `tools/subtitulos.py` | Palabras de la voz (`sound/palabras.json`) → subtítulos de 1–3 palabras (`public/tl.js`). |
| `sound/mix_gta6.py` | Mezcla: voz + música + 121 efectos colocados desde la línea de tiempo. |
| `render.js` | Render cuadro a cuadro con 3 navegadores en paralelo (~7 min para 1980 cuadros). |

Re-render: `node render.js --workers 3`, después `python3 -I sound/mix_gta6.py <kenney> <sfx-kit>` y ffmpeg (ver el historial de la sesión).
