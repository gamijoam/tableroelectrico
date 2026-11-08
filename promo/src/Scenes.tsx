import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { C, display, sans } from "./theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;


/* Fondo oscuro con cuadrícula técnica y un brillo que se mueve despacio */
export const Backdrop: React.FC<{ tint?: string }> = ({ tint = C.blue }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: C.ink }}>
      <AbsoluteFill
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.045) 1px,transparent 1px)",
          backgroundSize: "48px 48px",
          translate: `0px ${interpolate(frame, [0, 300], [0, -48])}px`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(900px 600px at ${interpolate(frame, [0, 240], [20, 80])}% 30%, ${tint}55, transparent 70%)`,
        }}
      />
    </AbsoluteFill>
  );
};

/* Rayo del logo de energía */
const Bolt: React.FC<{ size: number; color?: string }> = ({ size, color = C.energy }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M13 2 4 14h7l-1 8 9-12h-7z" fill={color} />
  </svg>
);

/* Logo de la app */
export const Logo: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 34 34">
    <rect x="7" y="2" width="20" height="30" rx="3" fill={C.blue} />
    <rect x="12" y="9" width="10" height="13" rx="2" fill="#fff" />
    <rect x="13.5" y="10.5" width="7" height="6" rx="1" fill={C.ink2} />
    <rect x="7" y="25" width="20" height="2" fill="#fff" opacity=".5" />
  </svg>
);

/* Texto que entra subiendo, con retraso en segundos */
const Rise: React.FC<{ delay: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  delay,
  children,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay * fps, fps, config: { damping: 200 } });
  return (
    <div style={{ opacity: p, translate: `0px ${interpolate(p, [0, 1], [40, 0])}px`, ...style }}>
      {children}
    </div>
  );
};

/* 1) Gancho */
export const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const flash = interpolate(frame, [1.6 * fps, 1.7 * fps, 2.1 * fps], [0, 1, 0], clamp);
  return (
    <AbsoluteFill>
      <Backdrop tint={C.red} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 28 }}>
        <Rise delay={0}>
          <div style={{ fontFamily: display, fontWeight: 800, fontSize: 112, color: "#fff", textAlign: "center", lineHeight: 1, textTransform: "uppercase", maxWidth: 1500 }}>
            ¿Sigues armando tableros <span style={{ color: C.energy }}>a ojo</span>?
          </div>
        </Rise>
        <Rise delay={0.9}>
          <div style={{ fontFamily: sans, fontSize: 40, color: "#d7dee1", textAlign: "center", maxWidth: 1300, lineHeight: 1.35 }}>
            Un cable mal puesto cuesta tiempo, material… y seguridad.
          </div>
        </Rise>
      </AbsoluteFill>
      <AbsoluteFill style={{ backgroundColor: "#fff6c8", opacity: flash * 0.55 }} />
      <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 90, opacity: flash }}>
        <Bolt size={120} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* 2) Marca */
export const Brand: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 14, stiffness: 120 } });
  return (
    <AbsoluteFill>
      <Backdrop />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 26 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 34, scale: interpolate(pop, [0, 1], [0.7, 1]), opacity: pop }}>
          <Logo size={170} />
          <div style={{ fontFamily: display, fontWeight: 800, fontSize: 150, color: "#fff", textTransform: "uppercase", letterSpacing: 2, lineHeight: 0.95 }}>
            Taller de
            <br />
            Tableros
          </div>
        </div>
        <Rise delay={0.6}>
          <div style={{ fontFamily: sans, fontSize: 42, color: "#d7dee1", textAlign: "center", maxWidth: 1400 }}>
            Diseña, cablea y prueba tableros eléctricos{" "}
            <b style={{ color: C.energy, fontWeight: 600 }}>antes de tocar un cable.</b>
          </div>
        </Rise>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export type Marker = { x: number; y: number; label: string; at: number };

/* Escena de función: texto a un lado y la captura real de la app al otro, con acercamiento lento */
export const Feature: React.FC<{
  img: string;
  kicker: string;
  title: string;
  bullets: string[];
  side?: "left" | "right";
  focus?: [number, number];
  zoom?: number;
  markers?: Marker[];
  accent?: string;
  fit?: "cover" | "contain";
}> = ({ img, kicker, title, bullets, side = "left", focus = [0.5, 0.5], zoom = 1.18, markers = [], accent = C.energy, fit = "cover" }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 200 } });
  const W = 1120,
    H = 630;
  const textCol = (
    <div style={{ width: 610, display: "flex", flexDirection: "column", gap: 22 }}>
      <Rise delay={0.1}>
        <div style={{ fontFamily: display, fontWeight: 700, fontSize: 34, letterSpacing: 6, color: accent }}>{kicker}</div>
      </Rise>
      <Rise delay={0.25}>
        <div style={{ fontFamily: display, fontWeight: 800, fontSize: 84, lineHeight: 0.98, color: "#fff", textTransform: "uppercase" }}>{title}</div>
      </Rise>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 12 }}>
        {bullets.map((b, i) => (
          <Rise key={b} delay={0.7 + i * 0.35}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, fontFamily: sans, fontSize: 32, color: "#e3e9eb" }}>
              <div style={{ width: 14, height: 14, borderRadius: 4, backgroundColor: accent, flex: "none" }} />
              {b}
            </div>
          </Rise>
        ))}
      </div>
    </div>
  );
  const shot = (
    <div
      style={{
        width: W,
        height: H,
        borderRadius: 18,
        overflow: "hidden",
        position: "relative",
        boxShadow: "0 40px 90px rgba(0,0,0,.55), 0 0 0 2px rgba(255,255,255,.08)",
        opacity: enter,
        translate: `${interpolate(enter, [0, 1], [side === "left" ? 120 : -120, 0])}px 0px`,
        rotate: `${interpolate(enter, [0, 1], [side === "left" ? 3 : -3, 0])}deg`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          transformOrigin: `${focus[0] * 100}% ${focus[1] * 100}%`,
          scale: interpolate(frame, [0, durationInFrames], [1, zoom], { ...clamp, easing: Easing.inOut(Easing.quad) }),
        }}
      >
        <Img src={staticFile(img)} style={{ width: W, height: H, objectFit: fit, backgroundColor: "#e9ece9" }} />
        {markers.map((m) => {
          const p = spring({ frame: frame - m.at * fps, fps, config: { damping: 12 } });
          const pulse = interpolate(Math.sin((frame - m.at * fps) / 6), [-1, 1], [1, 1.25]);
          return (
            <div key={m.label} style={{ position: "absolute", left: m.x * W, top: m.y * H, opacity: p }}>
              <div style={{ position: "absolute", left: -38, top: -38, width: 76, height: 76, borderRadius: 99, border: `5px solid ${accent}`, scale: p * pulse, boxShadow: `0 0 30px ${accent}` }} />
              <div style={{ position: "absolute", ...(m.x > 0.62 ? { right: 50 } : { left: 50 }), top: -26, whiteSpace: "nowrap", fontFamily: sans, fontWeight: 600, fontSize: 24, color: C.ink, backgroundColor: accent, padding: "8px 14px", borderRadius: 10, scale: p }}>
                {m.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
  return (
    <AbsoluteFill>
      <Backdrop tint={accent === C.energy ? C.blue : accent} />
      <AbsoluteFill style={{ flexDirection: side === "left" ? "row" : "row-reverse", alignItems: "center", justifyContent: "center", gap: 70, padding: "0 70px" }}>
        {textCol}
        {shot}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* Teléfono */
export const Phone: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame, fps, config: { damping: 200 } });
  return (
    <AbsoluteFill>
      <Backdrop tint={C.green} />
      <AbsoluteFill style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 120 }}>
        <div style={{ width: 700, display: "flex", flexDirection: "column", gap: 22 }}>
          <Rise delay={0.1}>
            <div style={{ fontFamily: display, fontWeight: 700, fontSize: 34, letterSpacing: 6, color: C.energy }}>EN LA OBRA</div>
          </Rise>
          <Rise delay={0.25}>
            <div style={{ fontFamily: display, fontWeight: 800, fontSize: 92, lineHeight: 0.98, color: "#fff", textTransform: "uppercase" }}>Desde tu teléfono o tablet</div>
          </Rise>
          <Rise delay={0.8}>
            <div style={{ fontFamily: sans, fontSize: 34, color: "#e3e9eb", lineHeight: 1.4 }}>
              Muéstrale al cliente cómo quedará su tablero y prueba el circuito ahí mismo.
            </div>
          </Rise>
        </div>
        <div
          style={{
            width: 390,
            height: 844,
            borderRadius: 56,
            padding: 14,
            backgroundColor: "#0b0d0e",
            boxShadow: "0 50px 100px rgba(0,0,0,.6), 0 0 0 3px #3a3f43",
            translate: `0px ${interpolate(p, [0, 1], [200, 0])}px`,
            rotate: `${interpolate(frame, [0, 4 * fps], [-4, 2], clamp)}deg`,
            opacity: p,
          }}
        >
          <Img src={staticFile("phone.png")} style={{ width: 362, height: 816, borderRadius: 44, objectFit: "cover", objectPosition: "top" }} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const ICONS: Record<string, React.ReactNode> = {
  time: <path d="M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />,
  shield: <path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6zM8.5 12l2.5 2.5 4.5-5" />,
  doc: <path d="M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6" />,
  book: <path d="M4 5c3-1.5 5.5-1.5 8 0 2.5-1.5 5-1.5 8 0v14c-3-1.5-5.5-1.5-8 0-2.5-1.5-5-1.5-8 0zM12 5v14" />,
};

/* Beneficios */
export const Benefits: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const items: [string, string, string][] = [
    ["time", "Ahorra horas", "Calcula breakers, cables y respaldo en segundos, no en una tarde."],
    ["shield", "Evita errores costosos", "Cortos, sobrecargas y conexiones invertidas se ven antes de la obra."],
    ["doc", "Cotiza como profesional", "Presupuesto en $ y PDF con unifilar y tu logo, listo para enviar."],
    ["book", "Aprende y enseña", "Ideal para aprendices, técnicos y escuelas de electricidad."],
  ];
  return (
    <AbsoluteFill>
      <Backdrop />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 56, padding: 90 }}>
        <Rise delay={0}>
          <div style={{ fontFamily: display, fontWeight: 800, fontSize: 92, color: "#fff", textTransform: "uppercase", textAlign: "center" }}>
            Hecho para el electricista <span style={{ color: C.energy }}>del día a día</span>
          </div>
        </Rise>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30, width: 1600 }}>
          {items.map(([ic, t, d], i) => {
            const p = spring({ frame: frame - (0.6 + i * 0.3) * fps, fps, config: { damping: 15 } });
            return (
              <div key={t} style={{ display: "flex", gap: 28, alignItems: "center", backgroundColor: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 22, padding: "30px 34px", opacity: p, scale: interpolate(p, [0, 1], [0.85, 1]) }}>
                <div style={{ width: 96, height: 96, borderRadius: 22, backgroundColor: C.blue, display: "grid", placeItems: "center", flex: "none" }}>
                  <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke={C.energy} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {ICONS[ic]}
                  </svg>
                </div>
                <div>
                  <div style={{ fontFamily: display, fontWeight: 700, fontSize: 50, color: "#fff", textTransform: "uppercase" }}>{t}</div>
                  <div style={{ fontFamily: sans, fontSize: 28, color: "#c9d2d6", lineHeight: 1.35 }}>{d}</div>
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* Cierre */
export const Cta: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 13 } });
  const steps = ["Diseña", "Cablea", "Prueba", "Cotiza"];
  return (
    <AbsoluteFill>
      <Backdrop tint={C.blue} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 30, scale: interpolate(pop, [0, 1], [0.8, 1]), opacity: pop }}>
          <Logo size={140} />
          <div style={{ fontFamily: display, fontWeight: 800, fontSize: 130, color: "#fff", textTransform: "uppercase" }}>Taller de Tableros</div>
        </div>
        <div style={{ display: "flex", gap: 22 }}>
          {steps.map((s, i) => {
            const p = spring({ frame: frame - (0.5 + i * 0.18) * fps, fps, config: { damping: 200 } });
            return (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 22, opacity: p, translate: `0px ${interpolate(p, [0, 1], [30, 0])}px` }}>
                {i > 0 && <Bolt size={34} />}
                <div style={{ fontFamily: display, fontWeight: 700, fontSize: 56, color: "#e3e9eb", textTransform: "uppercase", letterSpacing: 3 }}>{s}</div>
              </div>
            );
          })}
        </div>
        <Rise delay={1.4}>
          <div style={{ fontFamily: display, fontWeight: 800, fontSize: 62, color: C.ink, backgroundColor: C.energy, padding: "20px 56px", borderRadius: 18, textTransform: "uppercase", scale: interpolate(Math.sin(frame / 8), [-1, 1], [1, 1.04]) }}>
            Pruébalo hoy
          </div>
        </Rise>
        <Rise delay={1.8}>
          <div style={{ fontFamily: sans, fontSize: 30, color: C.muted }}>PC · tablet · teléfono — hecho en y para Venezuela</div>
        </Rise>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
