# Guía de shorts animados

Basada en **"GTA 6 o Miami"** (66 s, el mejor resultado hasta ahora). Referencia técnica: `videos/gta6-miami/`.
Antes de hacer un video nuevo, lee las secciones 1, 5, 9 y 12.

---

## 1. Fórmula del short

- **Gancho en los primeros 2 s:** título grande y una frase con dato o pregunta. Se entiende aunque no haya sonido.
- **Un dato verificable**, con fuentes de prensa, explicado en menos de 15 s.
- **El dato se muestra, no solo se dice:** mapa, comparación, contador, pantalla de celular, calendario.
- **Clímax con silencio:** 0,5 s sin música ni voz antes del golpe más fuerte.
- **Remate con pregunta** para que la gente comente.
- **Loop:** el último cuadro empalma con el primero (la última frase retoma el gancho).
- **Duración:** 55–70 s. Un cambio visual (texto, píldora, subtítulo o corte) cada 1–1,5 s.
- **Ritmo de voz:** unas 3 palabras por segundo (GTA: 194 palabras en 65 s).

## 2. Color

Tokens (`videos/gta6-miami/public/film.html`):

| Token | Hex | Significado en el video |
|---|---|---|
| Navy | `#0B0B1E` | Fondo y bordes |
| Rosa | `#FF2E93` | "GTA", juego, IA (acento principal) |
| Cian | `#22E4FF` | Real, Miami, vida real |
| Amarillo | `#FFD000` | Palabra activa de los subtítulos, pistas, atención |
| Verde | `#2BFF88` | Confirmación: ✓, "YA SALIÓ", "CALCADA" |
| Rojo | `#FF3B4A` | Tachados y cruces |
| Violeta | `#B45CFF` | Secundario (story, detalles) |

- **Cada color tiene un significado fijo** dentro del video. Si todo brilla, nada se destaca.
- **Fondo:** degradé navy con 150 partículas que suben lento. La grilla neón aparece solo cuando hay contexto de ciudad. Viñeta oscura en los bordes y grano de película al 6 %.
- **Tarjetas de vidrio:** degradé `rgba(46,34,104,.78)` → `rgba(13,11,36,.88)`, borde de 3 px del color del tema, radio 26–36 px y halo del mismo color.
- **Píldoras de contexto:** fondo `rgba(11,10,30,.82)`, borde blanco al 16 %, punto neón de 20 px con halo, texto 800 en mayúsculas. Van arriba al centro, a y ≈ 250 px ("1 semana antes", "¿juego o real?", "11 de noviembre").
- **Sellos:** bloque de color sólido, texto 900, radio 22 px ("YA SALIÓ", "CALCADA ✓", "6 DE 6 ✓", "QUE MIAMI 😂").

## 3. Tipografía y subtítulos

- **Montserrat 800 y 900**, archivos locales en `public/`. Se cargan con `document.fonts.load()` antes de medir o dibujar. Si no, las medidas salen mal.
- **Títulos:** 58–300 px, mayúsculas, interletrado −0,02 em, interlínea 0,95. Solo el título principal lleva efecto cromático (sombra cian a la izquierda y rosa a la derecha).
- **Tamaño mínimo:** nada que haya que leer por debajo de 30 px en un canvas de 1080 px. Las etiquetas chicas son decoración.
- **Subtítulos:**
  - 1–3 palabras (máximo ~18 caracteres, 22 si hace falta).
  - Mayúsculas, blanco con contorno negro de 6 px (sombra en 8 direcciones).
  - Palabra activa en amarillo con pop de escala 1,1 que decae en 0,12 s.
  - Centro en y ≈ 1385 px.
- **Zona segura (regla práctica):** deja libres unos 200 px arriba y 350 px abajo. La app pone el título y los botones ahí.
- **Corte por significado:** nunca cierres un bloque con "de, del, un, una, sin, que, y, la, el, los, en, a, su, lo, es, con, por, al, ya, no, muy, más". Mantén juntos los nombres propios: "GTA 6", "Vice City", "Ocean Beach", "South Beach", "Little Cuba", "Pequeña Habana", "vida real", "20 segundos".
- **Se ocultan** cuando un título grande debe leerse solo (la revelación "ERA GTA 6").
- **Origen:** se generan desde las palabras de Whisper (tiempos exactos). Revisa las palabras: Whisper confundió "acera" con "cera" y lo corregimos a mano en `tools/subtitulos.py`.

## 4. Escenas (plantillas reutilizables)

Tiempos del video GTA. Cada escena se puede reusar con otro texto.

| Tiempo (s) | Escena | Qué se ve | Movimiento | Sonido |
|---|---|---|---|---|
| 0–2,1 | Gancho | Calle 3D al atardecer, "GTA 6" con efecto cromático y sello verde "YA SALIÓ" | El título entra con escala y se achica al salir | Golpe grave; pop en "salió" |
| 1,9–4,3 | Calendario | Fichas del 11 al 19 de noviembre; el 19 con "🚀 lanzamiento"; flecha "≈ 1 SEMANA ANTES" | Fichas en cascada; desenfoque por velocidad | Clicks suaves |
| 4,1–7,2 | Pantalla partida | La misma toma arriba y abajo; "¿JUEGO?" rosa y "¿VIDA REAL?" cian; un "?" amarillo | La línea divisoria se abre | Whoosh y pop |
| 7,3–8,7 | Fecha | Tarjeta "NOVIEMBRE 11 · 2026" | Gira en 3D y entra | Sonido de hoja |
| 8,3–17 | Celular | Publicación: 0:20, progreso, "✓ PUBLICADO"; reloj de 20 s; REC; la cámara sigue un auto "🏎️ LUJO" y un peatón "🚶 PEATÓN" | El celular se acerca y se abre a pantalla completa | Blips digitales; click |
| 16,7–22,9 | Comentarios | Dos columnas (ES REAL cian, ES IA rosa) y barra de tira y afloja | Burbujas alternadas; se ilumina el lado que habla | Notificaciones a cada lado |
| 22,5–24,1 | Story | Aro "R" y story con campo vacío "0 PALABRAS" | Empuje lento de cámara | Swish |
| 27,25–27,8 | Silencio | Música bajo el agua; mute total de 0,5 s | Quieto | Nada |
| 27,8–29 | Revelación | "ERA GTA 6" con grietas, flash, glitch y HUD de juego | Golpe de cámara y zoom | Golpe, vidrio roto, sub-bass |
| 30,4–35 | Florida | Contorno cian que se dibuja; Vice City rosa que se calca encima; "¿INSPIRADA?" tachado; "CALCADA ✓" | Dibujo progresivo | Marcador, cuchillo, tono |
| 34,6–43,9 | Mapa de Miami | 6 pines con ✓; tarjeta "EN GTA 6 = EN LA VIDA REAL"; "6 DE 6 ✓" | La cámara del mapa se acerca a cada pin | Tono ascendente por pin |
| 43,8–48 | La pista | Lupa; "NO FUE POR LOS GRÁFICOS" tachado; chips 4K, LUCES, REFLEJOS | La lupa se mueve como buscando | Clicks; tachado |
| 48–61 | Comparación | Arriba, el real (más gente, colores que se apagan en vivo); abajo, GTA (poca gente, colores vivos); "LO DELATÓ"; "MÁS VACÍA ✓ MÁS BONITA ✓" | Whip horizontal entre las dos mitades | Pops de gente |
| 61–63,7 | CTA | Botones "🎮 JUEGO" y "🌴 REAL" con cursor; "💬 DÍMELO EN LOS COMENTARIOS" | El cursor se mueve y "pulsa" | Clicks y notificación |
| 63,6–66 | Loop | "PORQUE GTA 6 YA SALIÓ" → "GTA 6 YA SALIÓ" | Empalme con el cuadro 0 | Golpe y pop |

Pines del mapa: rosa = Ocean Beach / South Beach; cian = Little Cuba / Pequeña Habana; amarillo = Port Vice City / Puerto de Miami; violeta = Aeropuerto VCI / MIA; naranja = Sahara Arena / Kaseya Center; verde = Grassrivers / Everglades.

## 5. Movimiento y cámara

**Curvas** (de las skills claude-motion y motion-doctrine):
- Entradas: `bezier(.16,1,.3,1)`, 0,4–0,85 s.
- Salidas: `bezier(.6,0,.9,.35)`, la mitad de la entrada (0,25–0,4 s).
- Movimientos entre dos estados: `bezier(.65,0,.35,1)`.
- Rebote en sellos y pines: back con c = 1,65, 0,35–0,5 s.
- Escalonado: 0,09 s entre palabras; 0,17–0,36 s entre ítems de una lista.

**Lectura:** mínimo 1 s para una frase corta; +0,25 s por cada palabra extra a partir de la tercera. El título final dura 2 s o más.

**Clímax:** pausa de 0,3–0,75 s antes del golpe. En la historia de Rockstar, 0,5 s sin música ni voz.

**Transiciones:**
- **Nada se pisa:** la salida termina antes de que empiece la entrada. Lo corregimos en el anuncio y en GTA.
- **Un objeto cruza el corte:** el número sube a la cabecera, las tarjetas vuelan al celular, el celular se acerca, la lupa se mueve. Así el ojo no pierde el hilo.
- **Una dirección por tramo:** lo que sale a la izquierda entra por la derecha. No cambies de eje sin una causa.
- **Destellos:** un barrido rosa → cian y un flash blanco por cambio importante, máximo uno por beat.

**Cámara 3D:**
- **Altura de persona** (1,3–1,7 m), como si grabara con un celular. Nada de movimiento tipo dron.
- **Temblor leve y determinista:** roll de hasta 1,1°. Sin números aleatorios.
- **Cada toma con su propia dirección y velocidad.** No repitas el mismo dolly.
- **La cámara reacciona 10–14 cuadros después de la causa:** primero aparece el auto, después la cámara lo sigue.
- **Golpes:** temblor de 0,5 s que decae al cuadrado. Intensidad 1 en la revelación y 0,25–0,7 en golpes secundarios.
- **Un solo foco por cuadro.**
- **Cortes:** de escena cada 3 s aprox.; de texto y píldoras, cada 1–1,5 s.

**Determinismo:** todo el video es función del tiempo, `t = frame / 30`. No uses `Math.random()` ni `Date`, así cada cuadro se puede volver a renderizar igual.

## 6. Sonido

- **Solo cuando algo pasa en pantalla.** GTA tuvo 121 efectos en 66 s. Para el próximo, apunta a 60–80 y deja silencios.
- **Efectos reales primero:**
  - Kenney (CC0) para impactos, vidrio, clicks, cuchillo, papel y tarjetas.
  - wyzowl/sfx-kit (CC0) para whoosh, pops, tonos, notificaciones y risers.
  - Evita tonos sintéticos en momentos narrativos. El usuario pidió sonidos reales, no robóticos.
- **Cada efecto cae en el pico visual:** el script alinea cada archivo por su pico. Earshot confirmó ±25 ms en casi todos.
- **Música:** generada con vidIQ (`vidiq_generate_music`), instrumental, 118–120 BPM, synthwave.
  - Va a −8 dB y baja 50 % cuando habla la voz (ataque 30 ms, salida 300 ms).
  - En el silencio se vuelve "bajo el agua" (lowpass 650 Hz) y se corta antes de la revelación.
  - Arranca 0,29 s después del inicio del archivo (ajuste manual; revisa con earshot).
- **Pregunta antes de poner música.** En un video el usuario pidió sin música de fondo.
- **Niveles:**
  - Premezcla: voz a −16 LUFS; efectos a −30 % cuando habla la voz.
  - Master: loudnorm en 2 pasadas a −14 LUFS integrados, −1,5 dBTP, LRA 11.
- **Picos:** la música de vidIQ llega a +0,5 dBTP. Limita antes de exportar.
- **QA:** `earshot timeline` con los tiempos de cada efecto. Corrige todo "near" (más de 40 ms) y todo "NO HIT".

## 7. Guion y voz

- **Español neutro:** "tú", "acera", "básquetbol". Nada de voseo ni modismos regionales. Lo pidió el usuario.
- **Frases cortas**, un dato concreto por frase y una pregunta al final.
- **Confirma el estado del tema antes de escribir.** En GTA, el juego salió el 19/11/2026 y el guion tuvo que decir "ya salió" (el usuario lo corrigió).
- **ElevenLabs v3:** los audio tags van en inglés: `[excited]`, `[whispers]`, `[sarcastic]`, `[laughs]`, `[curious]`, `[impressed]`, `[mischievously]`. Genera 2 o 3 tomas y elige.
- **Cualquier cambio de palabra en la voz reabre todo:** vuelve a correr `palabras.py` y `subtitulos.py`, actualiza `timeline.js` y renderiza otra vez.

## 8. Pipeline (con comandos)

1. **Investigar.** `WebSearch` en modo extended para noticias recientes; busca al menos dos fuentes por dato. Para canales de referencia, usa vidIQ (`vidiq_channel_stats`, `vidiq_channel_videos`, `vidiq_video_transcript`, `vidiq_watch_shortform_content`). Anota las fuentes.
2. **Guion** de 55–70 s, en español neutro, con gancho y loop.
3. **Voz** en ElevenLabs. Guárdala como `videos/<proyecto>/public/voz-original.mp3`.
4. **Palabras** (desde la carpeta del proyecto; necesita faster-whisper instalado):
   `HF_HUB_DISABLE_XET=1 python3 -I sound/palabras.py public/voz-original.mp3 sound/palabras.json`
   El script usa un prompt con nombres propios para reducir errores.
5. **Subtítulos** (desde la raíz del proyecto): `python3 -I tools/subtitulos.py` → `public/tl.js`. Lee la lista de frases y corrige a mano lo mal transcrito.
6. **Línea de tiempo:** `public/timeline.js`, con los tiempos de las palabras clave de `palabras.json`. Cada escena arranca 0,2–0,3 s antes de la palabra que la nombra.
7. **Mapa** (si hay un estado o país): desde `tools/`, `node florida.mjs` (usa us-atlas y d3-geo) → `public/florida.json`. Después conviértelo a `public/florida-data.js`.
8. **Escenas:** `public/film.js`, una función por escena. Usa `S()` para posicionar por centro y `measure()` antes de posicionar.
9. **Revisión:** `NODE_PATH=$(npm root -g) node render.js --stills 66,90,...` (40 cuadros tardan ~12 s). Arma hojas de contacto y corrige. Revisa 3 o 4 hojas, no una sola.
10. **Render completo:** `NODE_PATH=$(npm root -g) node render.js --workers 3` (≈7,5 min para 1980 cuadros en 4 núcleos, sin GPU). Para re-renderizar un tramo: `--ranges 245-515,670-832`.
11. **Música y efectos:** `python3 -I sound/mix_gta6.py <carpeta_kenney> <carpeta_sfxkit>` → `sound/out/mix_pre.wav`. Después, loudnorm en 2 pasadas a −14 LUFS → `sound/out/mix.wav`.
12. **Glitches y mux:**
    ```
    ffmpeg -y -framerate 30 -i out/frames/f%04d.jpg -i sound/out/mix.wav \
      -vf "rgbashift=rh=-18:bh=18:gv=5:enable='between(t,27.80,27.94)',rgbashift=rh=-9:bh=9:enable='between(t,21.12,21.25)',rgbashift=rh=-11:bh=11:enable='between(t,32.10,32.18)',rgbashift=rh=-15:bh=15:gv=-4:enable='between(t,47.32,47.43)',rgbashift=rh=-8:bh=8:enable='between(t,56.00,56.07)',noise=alls=24:allf=t:enable='between(t,27.80,27.90)+between(t,47.32,47.40)',format=yuv420p" \
      -c:v libx264 -preset slow -crf 17 -c:a aac -b:a 192k -ar 48000 -shortest master.mp4
    ```
    Los tiempos de los glitches son fijos. Si cambias la línea de tiempo, muévelos.
13. **Entrega liviana** (para celular, menos de 50 MB):
    `ffmpeg -i master.mp4 -c:v libx264 -preset slow -crf 21 -pix_fmt yuv420p -maxrate 9M -bufsize 18M -c:a copy -movflags +faststart entrega.mp4`
    (66 s ≈ 41 MB).
14. **Verificación:** `earshot timeline entrega.mp4 --cues "..."`. Mira el cuadro 0 y el último, para confirmar el loop.
15. **Entrega:** `SendUserFile` con el mp4, notificación push, commit y push a la rama de trabajo.

## 9. Errores que ya pasaron (y cómo se evitan)

- **Textos superpuestos en transiciones** (anuncio y GTA). Evítalo: la salida termina antes de que empiece la entrada.
- **Whisper transcribe mal palabras** ("cera" por "acera"). Revisa `palabras.json` antes de cortar subtítulos.
- **Fuentes sin cargar** dan medidas en 0. Carga la fuente antes del primer cuadro.
- **Elementos sin medir:** usa `measure()` antes de posicionar; si no, el centro queda mal.
- **Pantalla partida 3D:** cada mitad es una vista con su propio rectángulo (scissor). Los rótulos atados a objetos 3D se proyectan después del render.
- **Capas del mapa:** el mapa de Leonida tiene que quedar encima del contorno real para que se vea el calce.
- **Bloom global** (brillo en toda la imagen): lavaba el contraste y teñía todo de magenta. Descartado. El neón con sombras de texto y el brillo SVG alcanzan.
- **Música con pico de +0,5 dBTP:** normalizar y limitar.
- **MP4 de 99 MB:** demasiado para el celular. La entrega con CRF 21 pesa 41 MB.
- **Rumores:** se dejaron fuera (qué personajes aparecen en el clip, qué hotel es cuál) porque no estaban confirmados.
- **Sitios bloqueados** desde la sesión (Dexerto, Forbes, Yahoo, YouTube directo): usa resúmenes de búsqueda y anota la fuente.

## 10. Contenido y honestidad

- **Cada dato, con al menos una fuente** de prensa o una oficial. Lista las fuentes en `sound/CREDITOS.md` y en la descripción.
- **Atribuye bien:** usa "según", "varios medios" o "fans que lo analizaron" cuando la fuente sea un análisis y no un hecho oficial.
- **Lo que se recrea** (celular, comentarios, story, mapa) debe marcarse como recreación o ejemplo. O usa capturas reales, citadas.
- **Sin material con derechos:** nada de clips de juegos, logos ni música de terceros. Lo visual se hace con código o con assets libres.
- **Sin cifras, reseñas ni testimonios inventados.**
- **Pendiente de corregir en GTA:**
  - "está prácticamente calcada": las fuentes hablan de análisis de la comunidad y de disputa. Mejor: "se parece muchísimo".
  - "lo único que delató a GTA 6 es...": una fuente también cita la cámara temblorosa del clip. Mejor: "lo que lo delató fue la gente".
  - Los comentarios en pantalla son ejemplos redactados por mí y la story es una recreación. Hay que marcarlo en pantalla.

## 11. Cómo evitar que se noten repetidos

- **Cambia el escenario 3D:** calle, playa, desierto, nieve, ciudad de noche. `street.js` es el set de Vice City. Un set nuevo puede seguir la misma API: `init`, `render(t, views)`, `info`, `pickPerson`, `personPos`.
- **Cambia el gancho:** dato, pregunta, comparación o sorpresa.
- **Cambia el acento del gancho** dentro de la paleta (rosa, cian o verde).
- **Cambia la cámara:** dirección, velocidad y altura de cada toma.
- **Cambia el remate:** pregunta, reto, ranking o "parte 2".
- **Cambia el paquete de sonido** (familias distintas) y la densidad.
- **Mantén la firma:** píldoras de contexto, subtítulos amarillos, Montserrat y loop. Eso es marca, no repetición.

## 12. Checklist antes de publicar

- [ ] 55–70 s, 1080×1920, 30 fps, H.264, AAC 48 kHz.
- [ ] El gancho se entiende sin sonido (título grande en los primeros 2 s).
- [ ] Subtítulos sincronizados (earshot) y sin cortes en palabras débiles.
- [ ] Ninguna transición pisa texto (revisar 3 o 4 hojas de contacto).
- [ ] Cada efecto corresponde a algo visible. Ningún sonido sobre una pantalla vacía.
- [ ] −14 LUFS integrados, pico de −1,5 dBTP o menos.
- [ ] Loop: el último cuadro empalma con el primero.
- [ ] Datos con fuente. Recreaciones marcadas.
- [ ] MP4 de entrega de menos de 50 MB.
- [ ] Título de 60 caracteres o menos, con hashtags (por ejemplo `#gta6 #gtavi #shorts`).

## 13. Herramientas, accesos y costos

- **vidIQ (créditos):** estadísticas del canal 5; videos del canal 5; transcripción 5; outliers 5; análisis de un short 10; música 25 por pista de ~70 s.
  - Saldo el 19/11/2026: 105 de 150. Se renueva el 19/12/2026.
- **Entorno:** Playwright con Chromium (preinstalado), ffmpeg, `earshot` en `/usr/local/bin`, faster-whisper (`pip install faster-whisper`).
- **Bloqueado en la sesión:** YouTube directo (yt-dlp), Dexerto, Forbes, Yahoo, Freesound y Mixkit. Se agregó `yss.ale-ferr.com` al entorno solo para una plantilla de terceros, que no está en el repo.
- **Three.js r128** local: `public/three.min.js`.
- **Bibliotecas de sonido** (no están en el repo y la carpeta temporal se borra):
  - Kenney: `git clone --filter=blob:none --sparse https://github.com/lavenderdotpet/CC0-Public-Domain-Sounds snd/lav`, y luego `git sparse-checkout set kenney_rpgaudio kenney_impactsounds kenney_interfacesounds kenney_casinoaudio kenney_musicjingles kenney_uiaudio metal_interactions`.
  - wyzowl/sfx-kit: clona el repo `wyzowl/sfx-kit` de GitHub y usa su carpeta `sounds/`.
  - Los nombres exactos de cada efecto están en los scripts `sound/mix_*.py`.

## 14. Preferencias del usuario

- Español neutro en guiones y textos. Nada de voseo.
- Respuestas cortas cuando lo pide.
- Al terminar algo largo: notificación push, commit y push a la rama de trabajo.
- Ve y sube los videos desde el celular: archivos livianos y subtítulos grandes.
- Textos simples y entendibles para cualquier público (por ejemplo, la versión de las bolitas en inglés simple, a pedido).
- **Música:** pregunta antes. En un video no quería música de fondo; en GTA sí.
- Cámara normal de Shorts, no de dron.
- Sonidos reales, no robóticos, y solo cuando pasa algo.
- Anuncios: que algo pase en pantalla todo el tiempo, con voz y subtítulos claros. El primer anuncio se quedó corto en movimiento y tenía demasiados sonidos.
- Cuando exista la app: mostrar sus pantallas reales en el video.

## 15. Referencias del repo

- `videos/gta6-miami/`: referencia actual, el mejor resultado.
- `videos/ad-ebook/`: anuncio de 28 s con UI de gastos, tickets y un libro 3D. Aprendizajes: sin superposición de texto y sonido real.
- `videos/semilla/`: 18 s en voxel (estilo Minecraft), con render por cuadros usando el kit voxel.
- `videos/bolitas/`: 20 s en 2D con canvas, render de 21 s. Textos en inglés simple.
- `videos/gta/`: primera versión del GTA (Remotion + three).
- `videos/steve-escuela/`: Steve 2000/2026/2050 (Remotion, render lento).
- `videos/ebook-prueba/`: capítulo de muestra en PDF.
- `docs/referencias/animacion-a-codigo-recursos.md` y `docs/referencias/awesome-claude-video-skills.md`.
