import React from "react";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { Benefits, Brand, Cta, Feature, Hook, Phone } from "./Scenes";
import { C } from "./theme";

/* Video publicitario de Taller de Tableros (1920×1080, 30 fps, ~53 s) */
export const PROMO_FRAMES = 1590;
const T = 15;

export const Promo: React.FC = () => (
  <TransitionSeries>
    <TransitionSeries.Sequence name="Gancho" durationInFrames={120}>
      <Hook />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
    <TransitionSeries.Sequence name="Marca" durationInFrames={105}>
      <Brand />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={linearTiming({ durationInFrames: T })} />
    <TransitionSeries.Sequence name="Diseña" durationInFrames={150}>
      <Feature img="board.png" kicker="1 · DISEÑA" title="Tu tablero tal como quedará en obra" side="left" focus={[0.25, 0.55]}
        bullets={["Caja de breakers o riel DIN", "120/240 V y 208Y/120 V", "Breakers, contactores, supervisores y más"]} />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={linearTiming({ durationInFrames: T })} />
    <TransitionSeries.Sequence name="Cablea" durationInFrames={165}>
      <Feature img="wall-flow.png" kicker="2 · CABLEA" title="Mira cómo fluye la energía" side="right" focus={[0.55, 0.6]} zoom={1.25}
        markers={[{ x: 0.6, y: 0.59, label: "Corriente por la fase", at: 1.6 }, { x: 0.775, y: 0.395, label: "240 V · 8,3 A", at: 2.6 }]}
        bullets={["Arrastra del breaker al aparato", "Colores y calibres según norma", "Tubería automática y ordenada"]} />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={linearTiming({ durationInFrames: T })} />
    <TransitionSeries.Sequence name="Prueba" durationInFrames={150}>
      <Feature img="short.png" kicker="3 · PRUEBA" title="Equivócate aquí, no en la obra" side="left" focus={[0.3, 0.7]} accent={C.red}
        markers={[{ x: 0.255, y: 0.902, label: "¡Cortocircuito!", at: 1.2 }]}
        bullets={["Cortocircuitos sin riesgo", "Disparos por sobrecarga y GFCI", "Equipos quemados por mal voltaje"]} />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={linearTiming({ durationInFrames: T })} />
    <TransitionSeries.Sequence name="Diagnostica" durationInFrames={150}>
      <Feature img="diag.png" kicker="4 · DIAGNOSTICA" title="Te dice por qué no funciona" side="right" focus={[0.65, 0.45]}
        markers={[{ x: 0.437, y: 0.73, label: "Interruptor apagado", at: 1.4 }, { x: 0.85, y: 0.37, label: "Lo que recibe cada borne", at: 2.4 }]}
        bullets={["Qué borne no recibe fase o neutro", "Qué breaker o interruptor lo corta", "Multímetro virtual"]} />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={linearTiming({ durationInFrames: T })} />
    <TransitionSeries.Sequence name="Motores" durationInFrames={150}>
      <Feature img="motor.png" kicker="5 · MOTORES" title="Arranque de bombas paso a paso" side="left" focus={[0.35, 0.6]} accent={C.green}
        markers={[{ x: 0.35, y: 0.53, label: "Contactor cerrado", at: 1.4 }, { x: 0.3, y: 0.79, label: "Piloto de marcha", at: 2.4 }]}
        bullets={["Contactor, térmico y retención", "Paro de emergencia y supervisor", "Falta de fase y giro invertido"]} />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={linearTiming({ durationInFrames: T })} />
    <TransitionSeries.Sequence name="Calcula" durationInFrames={165}>
      <Feature img="calc.png" kicker="6 · CALCULA" title="Breaker, cable y respaldo en segundos" side="right" fit="contain" focus={[0.5, 0.5]} zoom={1.03}
        bullets={["Caída de tensión incluida", "Estabilizador, UPS e inversor", "La caja completa de una casa"]} />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={linearTiming({ durationInFrames: T })} />
    <TransitionSeries.Sequence name="Cotiza" durationInFrames={135}>
      <Feature img="quote.png" kicker="7 · COTIZA" title="Presupuesto en $ y PDF con tu logo" side="left" focus={[0.8, 0.45]} zoom={1.15}
        bullets={["Materiales, mano de obra e IVA", "Unifilar y cuadro de cargas", "Listo para enviar al cliente"]} />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
    <TransitionSeries.Sequence name="Teléfono" durationInFrames={135}>
      <Phone />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
    <TransitionSeries.Sequence name="Beneficios" durationInFrames={180}>
      <Benefits />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />
    <TransitionSeries.Sequence name="Cierre" durationInFrames={150}>
      <Cta />
    </TransitionSeries.Sequence>
  </TransitionSeries>
);
