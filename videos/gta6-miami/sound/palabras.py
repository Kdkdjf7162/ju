"""Tiempos de cada palabra de la voz (faster-whisper) -> sound/palabras.json"""
import json, sys
from faster_whisper import WhisperModel
m = WhisperModel("small", device="cpu", compute_type="int8")
segs, info = m.transcribe(sys.argv[1], language="es", word_timestamps=True, beam_size=5,
    initial_prompt="GTA 6, Rockstar, Instagram, Miami, Vice City, Ocean Beach, South Beach, Little Cuba, Pequeña Habana, Everglades, básquetbol.")
out = []
for s in segs:
    for w in s.words:
        out.append({"w": w.word.strip(), "s": round(w.start, 3), "e": round(w.end, 3), "p": round(w.probability, 3)})
json.dump(out, open(sys.argv[2], "w"), ensure_ascii=False, indent=0)
print(len(out), "palabras;", " ".join(f"{o['w']}@{o['s']}" for o in out))
