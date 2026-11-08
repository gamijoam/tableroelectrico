# Guion de la voz en off. La escritura busca la pronunciación correcta (bréiker, pe de efe).
import json, subprocess, sys
L = [
 ("hook", "¿Todavía armas tableros a ojo? Un error de cableado sale caro."),
 ("brand", "Taller de Tableros: diseña, cablea y prueba, antes de tocar un cable."),
 ("disena", "Arma tu caja de bréikers o tu riel, con componentes que se ven como los reales."),
 ("cablea", "Cablea el tablero, la pared y los subtableros, y mira cómo fluye la corriente."),
 ("prueba", "Simula cortocircuitos, bajones y subidas de luz, con supervisor y estabilizador."),
 ("diag", "Si algo no enciende, te dice exactamente por qué, y cómo corregirlo."),
 ("calcula", "La calculadora te dice qué bréiker, qué cable y qué estabilizador necesitas."),
 ("cotiza", "Además, crea el diagrama uni filar, el presupuesto y el pe de efe, para enviar por guatsap."),
 ("telefono", "Instálala en tu teléfono y úsala sin internet, en cualquier obra."),
 ("cierre", "Taller de Tableros. Diseña, cablea, prueba y cotiza. ¡Pruébalo hoy!"),
]
out = {}
for k, t in L:
    wav = f"/tmp/voz-{k}.wav"; mp3 = f"promo/public/voz/{k}.mp3"
    subprocess.run([".tts/bin/piper", "-m", "voices/es_MX-claude-high.onnx", "-f", wav, "--length-scale", "0.93", "--sentence-silence", "0.25"], input=t.encode(), check=True, capture_output=True)
    # limpieza: quita silencio inicial, normaliza volumen, un poco de cuerpo
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", wav, "-af", "silenceremove=start_periods=1:start_threshold=-62dB:start_silence=0.08,areverse,silenceremove=start_periods=1:start_threshold=-70dB:start_silence=0.25,areverse,highpass=f=70,acompressor=threshold=-20dB:ratio=3:attack=5:release=80,loudnorm=I=-16:TP=-1.5:LRA=7", "-ar", "44100", "-b:a", "160k", mp3], check=True)
    d = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", mp3], capture_output=True, text=True).stdout)
    out[k] = round(d, 2); print(k, out[k])
json.dump(out, open("promo/src/voz.json", "w"), indent=1)
