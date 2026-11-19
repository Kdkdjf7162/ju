# Si GTA 6 fuera tu vida real (36 s, sin voz)

Ficción humorística: un chico comete 6 "delitos" cotidianos, gana 6 estrellas, llega el SWAT, una patrulla lo embiste, lo acribillan y aparece WASTED.

| Archivo | Qué es |
|---|---|
| `public/film.html`, `film.js` | Cámara por tomas, HUD de estrellas, pastillas, mensaje largo, spoiler y WASTED |
| `public/actors1.js`, `actors2.js` | Personaje con esqueleto, policías, SWAT, patrullas, furgón, helicóptero y efectos (fogonazos, trazadoras, casquillos, vidrios); coreografía y cámara lenta |
| `public/set.js` | La calle Vice City (variante de `videos/gta6-miami/public/street.js`) |
| `public/timeline.js` | Línea de tiempo maestra (la usan animación y sonido) |
| `sound/mix.py`, `synth.py` | Mezcla: efectos reales + sintetizados + música, todo desde la misma línea de tiempo |
| `sound/make_shots.py` | Recorta disparos reales de la Free Firearm Sound Library (CC0) → `sound/lib/` |

Render: `NODE_PATH=$(npm root -g) node render.js --workers 3 --dir frames` (≈5,6 min, 1092 cuadros).
Sonido: `python3 -I sound/mix.py <carpeta_kenney> <carpeta_sfxkit>`.
Créditos: `sound/lib/LICENCIA.txt` y `sound/CREDITOS.md`.
