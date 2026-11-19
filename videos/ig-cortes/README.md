# 1 seguidor = 1 corte (Reels de IG)

Una sandía recibe un corte por cada seguidor, cae en la tabla y se abre en rodajas. Formato diario para crecer la cuenta.

## Hacer el video de cada día
```
node render.js --q 'n=37&dia=2' --dir frames      # n = seguidores reales del día
python3 -I sound/mix.py                           # lee out/tl.json, el sonido se adapta a n
cd sound/out && ffmpeg -y -i mix_pre.wav -af "volume=3.9dB,alimiter=limit=0.82:level=disabled" -ar 48000 mix.wav
ffmpeg -y -framerate 30 -i out/frames/f%04d.jpg -i sound/out/mix.wav -c:v libx264 -crf 20 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest out/video.mp4
```
Opcional: `handle=@tucuenta` agrega el usuario bajo el título. Hasta 40 cortes se ven como rodajas separadas;
con más seguidores el contador sigue subiendo, pero los cortes repiten los mismos planos.
Usa siempre el número real de seguidores: el formato funciona porque es verdad.
