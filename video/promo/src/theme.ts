import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

/* Fuentes locales (en public/fonts): las mismas de la aplicación */
export const display = "Barlow Condensed";
export const sans = "IBM Plex Sans";
for (const w of ["600", "700", "800"]) loadFont({ family: display, url: staticFile(`fonts/BarlowCondensed-${w}-latin.woff2`), weight: w });
for (const w of ["400", "500", "600"]) loadFont({ family: sans, url: staticFile(`fonts/IBMPlexSans-${w}-latin.woff2`), weight: w });

/* Mismos colores de la aplicación */
export const C = {
  ink: "#0f1518",
  ink2: "#1d2326",
  paper: "#f4f5f2",
  blue: "#1c5fa8",
  blueSoft: "#5ea2ec",
  energy: "#ffe14d",
  green: "#2f9e44",
  red: "#e0302a",
  muted: "#9aa7ac",
};
