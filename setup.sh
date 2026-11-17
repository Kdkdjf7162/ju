#!/bin/bash
# Instala las herramientas de linea de comandos que usan las skills (idempotente).
pip install -q yt-dlp 'markitdown[all]' graphifyy || true
command -v ffmpeg >/dev/null || (apt-get install -y ffmpeg >/dev/null 2>&1 || true)
echo "yt-dlp $(yt-dlp --version 2>/dev/null) | markitdown OK | graphify OK | ffmpeg: $(command -v ffmpeg || echo falta)"
