import React from "react";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { Benefits, Brand, Cta, Feature, Hook, Phone } from "./Scenes";
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
const ORDEN: [Clave, number][] = [["hook", 120], ["brand", 105], ["disena", 150], ["cablea", 165], ["prueba", 150], ["diag", 150], ["motores", 150], ["calcula", 165], ["cotiza", 135], ["telefono", 135], ["beneficios", 180], ["cierre", 150]];
const D = Object.fromEntries(ORDEN.map(([k, m]) => [k, dur(k, m)])) as Record<Clave, number>;
export const PROMO_FRAMES = ORDEN.reduce((a, [k]) => a + D[k], 0) - (ORDEN.length - 1) * T;

/* Voz de la escena: empieza 0,3 s después de que la escena aparece */
const Voz: React.FC<{ k: Clave }> = ({ k }) => (
  <Sequence name={`Voz ${k}`} from={Math.round(0.3 * FPS)} layout="none">
    <Audio src={staticFile(`voz/${k}.mp3`)} />
  </Sequence>
);

export const Promo: React.FC = () => (
  <TransitionSeries>
    <TransitionSeries.Sequence name="Gancho" durationInFrames={D.hook}>
      <Voz k="hook" />
      <Hook />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
    <TransitionSeries.Sequence name="Marca" durationInFrames={D.brand}>
      <Voz k="brand" />
      <Brand />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={linearTiming({ durationInFrames: T })} />
    <TransitionSeries.Sequence name="Diseña" durationInFrames={D.disena}>
      <Voz k="disena" />
      <Feature img="board.png" kicker="1 · DISEÑA" title="Tu tablero tal como quedará en obra" side="left" focus={[0.25, 0.55]}
        bullets={["Caja de breakers o riel DIN", "120/240 V y 208Y/120 V", "Breakers, contactores, supervisores y más"]} />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={linearTiming({ durationInFrames: T })} />
    <TransitionSeries.Sequence name="Cablea" durationInFrames={D.cablea}>
      <Voz k="cablea" />
      <Feature img="wall-flow.png" kicker="2 · CABLEA" title="Mira cómo fluye la energía" side="right" focus={[0.55, 0.6]} zoom={1.25}
        markers={[{ x: 0.6, y: 0.59, label: "Corriente por la fase", at: 1.6 }, { x: 0.775, y: 0.395, label: "240 V · 8,3 A", at: 2.6 }]}
        bullets={["Arrastra del breaker al aparato", "Colores y calibres según norma", "Tubería automática y ordenada"]} />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={linearTiming({ durationInFrames: T })} />
    <TransitionSeries.Sequence name="Prueba" durationInFrames={D.prueba}>
      <Voz k="prueba" />
      <Feature img="short.png" kicker="3 · PRUEBA" title="Equivócate aquí, no en la obra" side="left" focus={[0.3, 0.7]} accent={C.red}
        markers={[{ x: 0.255, y: 0.902, label: "¡Cortocircuito!", at: 1.2 }]}
        bullets={["Cortocircuitos sin riesgo", "Disparos por sobrecarga y GFCI", "Equipos quemados por mal voltaje"]} />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={linearTiming({ durationInFrames: T })} />
    <TransitionSeries.Sequence name="Diagnostica" durationInFrames={D.diag}>
      <Voz k="diag" />
      <Feature img="diag.png" kicker="4 · DIAGNOSTICA" title="Te dice por qué no funciona" side="right" focus={[0.65, 0.45]}
        markers={[{ x: 0.437, y: 0.73, label: "Interruptor apagado", at: 1.4 }, { x: 0.85, y: 0.37, label: "Lo que recibe cada borne", at: 2.4 }]}
        bullets={["Qué borne no recibe fase o neutro", "Qué breaker o interruptor lo corta", "Multímetro virtual"]} />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={linearTiming({ durationInFrames: T })} />
    <TransitionSeries.Sequence name="Motores" durationInFrames={D.motores}>
      <Voz k="motores" />
      <Feature img="motor.png" kicker="5 · MOTORES" title="Arranque de bombas paso a paso" side="left" focus={[0.35, 0.6]} accent={C.green}
        markers={[{ x: 0.35, y: 0.53, label: "Contactor cerrado", at: 1.4 }, { x: 0.3, y: 0.79, label: "Piloto de marcha", at: 2.4 }]}
        bullets={["Contactor, térmico y retención", "Paro de emergencia y supervisor", "Falta de fase y giro invertido"]} />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={linearTiming({ durationInFrames: T })} />
    <TransitionSeries.Sequence name="Calcula" durationInFrames={D.calcula}>
      <Voz k="calcula" />
      <Feature img="calc.png" kicker="6 · CALCULA" title="Breaker, cable y respaldo en segundos" side="right" fit="contain" focus={[0.5, 0.5]} zoom={1.03}
        bullets={["Caída de tensión incluida", "Estabilizador, UPS e inversor", "La caja completa de una casa"]} />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={linearTiming({ durationInFrames: T })} />
    <TransitionSeries.Sequence name="Cotiza" durationInFrames={D.cotiza}>
      <Voz k="cotiza" />
      <Feature img="quote.png" kicker="7 · COTIZA" title="Presupuesto en $ y PDF con tu logo" side="left" focus={[0.8, 0.45]} zoom={1.15}
        bullets={["Materiales, mano de obra e IVA", "Unifilar y cuadro de cargas", "Listo para enviar al cliente"]} />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
    <TransitionSeries.Sequence name="Teléfono" durationInFrames={D.telefono}>
      <Voz k="telefono" />
      <Phone />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
    <TransitionSeries.Sequence name="Beneficios" durationInFrames={D.beneficios}>
      <Voz k="beneficios" />
      <Benefits />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
    <TransitionSeries.Sequence name="Cierre" durationInFrames={D.cierre}>
      <Voz k="cierre" />
      <Cta />
    </TransitionSeries.Sequence>
  </TransitionSeries>
);
