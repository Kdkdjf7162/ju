# Cuando encuentras dinero en un pantalón viejo (9 s)
Imágenes generadas con Higgsfield (gpt_image_2_6, ~2,5 créditos) en capas separadas: fondo, cabeza, torso, brazo, pantalón y billete (assets/).
La animación es por código (public/film.js): caras dibujadas en SVG sobre la cabeza, brazos con pivote en el hombro,
billete que se rompe en pedazos con física, cámara con zoom y temblor.
Render: `node render.js --dir frames` y luego ffmpeg (ver ig-cortes/README.md). Todavía sin sonido.
