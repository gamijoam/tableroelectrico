# Video publicitario

Video de ~1 min 22 s (1920×1080, 30 fps) hecho con código en [Remotion](https://www.remotion.dev),
con capturas reales de la aplicación y voz en off generada con [Piper TTS](https://github.com/rhasspy/piper).
El resultado final está en [`../media/taller-de-tableros-promo.mp4`](../media/taller-de-tableros-promo.mp4).

## Estructura

```
promo/                    Proyecto Remotion
  src/Promo.tsx           Orden de las escenas, transiciones y voz de cada una
  src/Scenes.tsx          Diseño y animación de cada escena
  src/theme.ts            Colores y fuentes (las mismas de la app)
  src/voz.json            Duración de cada frase (la escena dura lo que dura su voz)
  public/                 Capturas de la app, fuentes (Barlow Condensed, IBM Plex Sans) y voz (voz/*.mp3)
voices/guion.py           Guion de la voz en off: genera public/voz/*.mp3 y src/voz.json
voices/descargar-voz.sh   Descarga el modelo de voz es_MX "claude" (licencia Apache-2.0)
skills-lock.json          Skills de Remotion para agentes (reinstalar con `npx skills experimental_install`)
```

## Ver y editar

```bash
cd promo
npm i
npx remotion studio      # vista previa interactiva
npx remotion render Promo out/taller-de-tableros-promo.mp4
```

Los textos en pantalla están en `src/Promo.tsx` y `src/Scenes.tsx`.

## Cambiar la voz en off (desde la carpeta `video/`)

```bash
python3 -m venv .tts && .tts/bin/pip install piper-tts
sh voices/descargar-voz.sh
.tts/bin/python voices/guion.py   # edita las frases dentro del script antes de correrlo
```

Luego vuelve a renderizar. Las escenas se ajustan solas al largo de cada frase.

## Licencias

- Remotion es gratis para personas y empresas de hasta 3 personas; empresas más grandes necesitan
  [licencia de empresa](https://www.remotion.pro/license).
- Voz: modelo Piper es_MX "claude", licencia Apache-2.0.
- Fuentes: Barlow Condensed e IBM Plex Sans, licencia SIL Open Font License.
