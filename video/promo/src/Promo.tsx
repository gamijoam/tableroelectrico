import React from "react";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { Brand, Cta, Feature, Hook, Phone } from "./Scenes";
import { C } from "./theme";
import { Sequence, staticFile } from "remotion";
import { Audio } from "@remotion/media";
import voz from "./voz.json";

/* Video publicitario de Taller de Tableros (1920×1080, 30 fps) con voz en off.
   Cada escena dura lo que necesita su frase (mínimo lo indicado) más la transición. */
const T = 15;
const FPS = 30;
type Clave = keyof typeof voz;
const dur = (k: Clave, min: number) => Math.max(min, Math.ceil((0.3 + voz[k] + 0.35) * FPS) + T);
const ORDEN: [Clave, number][] = [["hook", 90], ["brand", 90], ["disena", 90], ["cablea", 90], ["prueba", 90], ["diag", 90], ["calcula", 90], ["cotiza", 90], ["telefono", 90], ["cierre", 180]];
const D = Object.fromEntries(ORDEN.map(([k, m]) => [k, dur(k, m)])) as Record<Clave, number>;
export const PROMO_FRAMES = ORDEN.reduce((a, [k]) => a + D[k], 0) - (ORDEN.length - 1) * T;

/* Voz de la escena: empieza 0,3 s después de que la escena aparece */
const Voz: React.FC<{ k: Clave }> = ({ k }) => (
  <Sequence name={`Voz ${k}`} from={Math.round(0.3 * FPS)} layout="none">
    <Audio src={staticFile(`voz/${k}.mp3`)} />
  </Sequence>
);
const slideIn = () => <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={linearTiming({ durationInFrames: T })} />;
const fadeIn = () => <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />;

export const Promo: React.FC = () => (
  <TransitionSeries>
    <TransitionSeries.Sequence name="Gancho" durationInFrames={D.hook}>
      <Voz k="hook" />
      <Hook />
    </TransitionSeries.Sequence>
    {fadeIn()}
    <TransitionSeries.Sequence name="Marca" durationInFrames={D.brand}>
      <Voz k="brand" />
      <Brand />
    </TransitionSeries.Sequence>
    {slideIn()}
    <TransitionSeries.Sequence name="Diseña" durationInFrames={D.disena}>
      <Voz k="disena" />
      <Feature img="board.png" kicker="1 · DISEÑA" title="Componentes que se ven como los reales" side="left" focus={[0.42, 0.45]} zoom={1.14}
        bullets={["Caja de breakers o riel DIN", "Supervisores, contactores y DPS", "Monofásico, bifásico o trifásico"]} />
    </TransitionSeries.Sequence>
    {slideIn()}
    <TransitionSeries.Sequence name="Cablea" durationInFrames={D.cablea}>
      <Voz k="cablea" />
      <Feature img="wall-flow.png" kicker="2 · CABLEA" title="Mira cómo fluye la energía" side="right" focus={[0.5, 0.45]} zoom={1.35}
        bullets={["Tablero, pared y sub-tableros", "Cablea el tablero de cerca", "Colores, calibres y tubería"]} />
    </TransitionSeries.Sequence>
    {slideIn()}
    <TransitionSeries.Sequence name="Prueba" durationInFrames={D.prueba}>
      <Voz k="prueba" />
      <Feature img="grid.png" kicker="3 · PRUEBA" title="Bajones, subidas y cortocircuitos" side="left" focus={[0.62, 0.3]} zoom={1.3} accent={C.red}
        bullets={["Supervisor que corta por voltaje", "Estabilizador que se sobrecarga", "Breakers que disparan de verdad"]} />
    </TransitionSeries.Sequence>
    {slideIn()}
    <TransitionSeries.Sequence name="Diagnostica" durationInFrames={D.diag}>
      <Voz k="diag" />
      <Feature img="diag.png" kicker="4 · DIAGNOSTICA" title="Te dice por qué no enciende" side="right" focus={[0.25, 0.42]} zoom={1.3}
        bullets={["Qué cable está mal y por qué", "Cómo corregirlo", "Multímetro virtual"]} />
    </TransitionSeries.Sequence>
    {slideIn()}
    <TransitionSeries.Sequence name="Calcula" durationInFrames={D.calcula}>
      <Voz k="calcula" />
      <Feature img="calc.png" kicker="5 · CALCULA" title="Breaker, cable y respaldo en segundos" side="left" fit="contain" focus={[0.5, 0.5]} zoom={1.03}
        bullets={["Caída de tensión incluida", "Estabilizador, UPS e inversor", "La caja completa de una casa"]} />
    </TransitionSeries.Sequence>
    {slideIn()}
    <TransitionSeries.Sequence name="Cotiza" durationInFrames={D.cotiza}>
      <Voz k="cotiza" />
      <Feature img="uni.png" kicker="6 · COTIZA" title="Unifilar, presupuesto y WhatsApp" side="right" focus={[0.5, 0.5]} zoom={1.28} accent={C.green}
        bullets={["Unifilar automático", "PDF con tu logo", "Envíalo por WhatsApp"]} />
    </TransitionSeries.Sequence>
    {fadeIn()}
    <TransitionSeries.Sequence name="Teléfono" durationInFrames={D.telefono}>
      <Voz k="telefono" />
      <Phone />
    </TransitionSeries.Sequence>
    {fadeIn()}
    <TransitionSeries.Sequence name="Cierre" durationInFrames={D.cierre}>
      <Voz k="cierre" />
      <Cta />
    </TransitionSeries.Sequence>
  </TransitionSeries>
);
