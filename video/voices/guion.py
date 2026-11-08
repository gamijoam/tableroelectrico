# Guion de la voz en off. La escritura busca la pronunciación correcta (bréiker, pe de efe).
import json, subprocess, sys
L = [
 ("hook", "¿Todavía armas tableros a ojo? Un error de cableado cuesta tiempo, material... y seguridad."),
 ("brand", "Te presento Taller de Tableros: diseña, cablea y prueba tus tableros, antes de tocar un cable."),
 ("disena", "Arma tu caja de bréikers o tu tablero de riel, monofásico o trifásico, tal como quedará en la obra."),
 ("cablea", "Cablea la pared desde el bréiker hasta el aparato, y mira cómo fluye la corriente por cada cable."),
 ("prueba", "Simula cortocircuitos y sobrecargas, sin ningún peligro. Equivócate aquí, no en la obra."),
 ("diag", "Si algo no enciende, la aplicación te dice por qué: qué borne no recibe fase, y qué lo está cortando."),
 ("motores", "Aprende a arrancar motores con contactor, relé térmico y paro de emergencia."),
 ("calcula", "La calculadora te dice qué bréiker, qué cable y qué estabilizador o inversor necesitas, en segundos."),
 ("cotiza", "Y cuando todo está listo, genera el presupuesto y un pe de efe profesional con tu logo."),
 ("telefono", "Funciona en la computadora, en la tableta y en el teléfono, para llevarla a cualquier obra."),
 ("beneficios", "Ahorra tiempo, evita errores costosos y cotiza como un profesional. Hecha para el electricista de verdad."),
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
