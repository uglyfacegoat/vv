import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useEffect, useState, useMemo } from "react";
import { useTheme } from "./ThemeProvider";

type ShapeType =
  | "glassSphere"
  | "wireframeCube"
  | "glowRing"
  | "diamond"
  | "hexagon"
  | "floatingCard"
  | "torus"
  | "triangle";

interface FloatingShape {
  id: number;
  x: number;
  y: number;
  size: number;
  type: ShapeType;
  colorIdx: number;
  delay: number;
  duration: number;
  depth: number; // 0.3 = far away, 1.0 = close — affects parallax intensity and blur
  rotateOffset: number;
}

const SHAPE_TYPES: ShapeType[] = [
  "glassSphere",
  "wireframeCube",
  "glowRing",
  "diamond",
  "hexagon",
  "floatingCard",
  "torus",
  "triangle",
];

interface ColorSet {
  primary: string;
  glow: string;
  stroke: string;
  fill: string;
}

const LIGHT_COLORS: ColorSet[] = [
  { primary: "#8b5cf6", glow: "rgba(139,92,246,0.35)", stroke: "rgba(139,92,246,0.3)", fill: "rgba(139,92,246,0.06)" },
  { primary: "#3b82f6", glow: "rgba(59,130,246,0.35)", stroke: "rgba(59,130,246,0.3)", fill: "rgba(59,130,246,0.06)" },
  { primary: "#06b6d4", glow: "rgba(6,182,212,0.35)", stroke: "rgba(6,182,212,0.3)", fill: "rgba(6,182,212,0.06)" },
  { primary: "#6366f1", glow: "rgba(99,102,241,0.35)", stroke: "rgba(99,102,241,0.25)", fill: "rgba(99,102,241,0.05)" },
  { primary: "#a855f7", glow: "rgba(168,85,247,0.3)", stroke: "rgba(168,85,247,0.25)", fill: "rgba(168,85,247,0.05)" },
];

const DARK_COLORS: ColorSet[] = [
  { primary: "#8b5cf6", glow: "rgba(139,92,246,0.5)", stroke: "rgba(139,92,246,0.4)", fill: "rgba(139,92,246,0.08)" },
  { primary: "#3b82f6", glow: "rgba(59,130,246,0.5)", stroke: "rgba(59,130,246,0.4)", fill: "rgba(59,130,246,0.08)" },
  { primary: "#06b6d4", glow: "rgba(6,182,212,0.5)", stroke: "rgba(6,182,212,0.4)", fill: "rgba(6,182,212,0.08)" },
  { primary: "#6366f1", glow: "rgba(99,102,241,0.5)", stroke: "rgba(99,102,241,0.35)", fill: "rgba(99,102,241,0.07)" },
  { primary: "#a855f7", glow: "rgba(168,85,247,0.45)", stroke: "rgba(168,85,247,0.35)", fill: "rgba(168,85,247,0.07)" },
];

function generateShapes(count: number): FloatingShape[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 5 + Math.random() * 90,
    y: 5 + Math.random() * 90,
    size: 35 + Math.random() * 70,
    type: SHAPE_TYPES[i % SHAPE_TYPES.length],
    colorIdx: i % LIGHT_COLORS.length,
    delay: Math.random() * 4,
    duration: 10 + Math.random() * 14,
    depth: 0.3 + Math.random() * 0.7,
    rotateOffset: Math.random() * 360,
  }));
}

/* ── Individual shape renderers ── */

function GlassSphere({ size, color }: { size: number; color: ColorSet }) {
  return (
    <div
      className="relative rounded-full"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.25), ${color.fill} 50%, transparent 70%)`,
        boxShadow: `0 0 ${size * 0.6}px ${color.glow}, inset 0 0 ${size * 0.3}px rgba(255,255,255,0.1)`,
        border: `1px solid ${color.stroke}`,
        backdropFilter: "blur(4px)",
      }}
    >
      {/* Specular highlight */}
      <div
        className="absolute rounded-full"
        style={{
          width: size * 0.35,
          height: size * 0.2,
          top: "18%",
          left: "22%",
          background: "rgba(255,255,255,0.35)",
          filter: "blur(3px)",
          borderRadius: "50%",
          transform: "rotate(-20deg)",
        }}
      />
      {/* Bottom reflection */}
      <div
        className="absolute rounded-full"
        style={{
          width: size * 0.5,
          height: size * 0.15,
          bottom: "18%",
          left: "25%",
          background: `linear-gradient(90deg, transparent, ${color.stroke}, transparent)`,
          filter: "blur(4px)",
        }}
      />
    </div>
  );
}

function WireframeCube({ size, color }: { size: number; color: ColorSet }) {
  const s = size * 0.7;
  const h = s / 2;
  const off = s * 0.3;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ filter: `drop-shadow(0 0 ${size * 0.15}px ${color.glow})` }}>
      {/* Back face */}
      <polygon
        points={`${h - h / 2 + off},${h - h / 2 + off} ${h + h / 2 + off},${h - h / 2 + off} ${h + h / 2 + off},${h + h / 2 + off} ${h - h / 2 + off},${h + h / 2 + off}`}
        fill={color.fill}
        stroke={color.stroke}
        strokeWidth="0.8"
        opacity="0.5"
      />
      {/* Front face */}
      <polygon
        points={`${h - h / 2},${h - h / 2} ${h + h / 2},${h - h / 2} ${h + h / 2},${h + h / 2} ${h - h / 2},${h + h / 2}`}
        fill={color.fill}
        stroke={color.stroke}
        strokeWidth="1"
      />
      {/* Connecting edges */}
      <line x1={h - h / 2} y1={h - h / 2} x2={h - h / 2 + off} y2={h - h / 2 + off} stroke={color.stroke} strokeWidth="0.8" />
      <line x1={h + h / 2} y1={h - h / 2} x2={h + h / 2 + off} y2={h - h / 2 + off} stroke={color.stroke} strokeWidth="0.8" />
      <line x1={h + h / 2} y1={h + h / 2} x2={h + h / 2 + off} y2={h + h / 2 + off} stroke={color.stroke} strokeWidth="0.8" />
      <line x1={h - h / 2} y1={h + h / 2} x2={h - h / 2 + off} y2={h + h / 2 + off} stroke={color.stroke} strokeWidth="0.8" />
    </svg>
  );
}

function GlowRing({ size, color }: { size: number; color: ColorSet }) {
  const r = size * 0.4;
  const cx = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <linearGradient id={`ring-grad-${color.primary}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={color.primary} stopOpacity="0.6" />
          <stop offset="50%" stopColor={color.primary} stopOpacity="0.1" />
          <stop offset="100%" stopColor={color.primary} stopOpacity="0.5" />
        </linearGradient>
      </defs>
      <circle
        cx={cx}
        cy={cx}
        r={r}
        fill="none"
        stroke={`url(#ring-grad-${color.primary})`}
        strokeWidth={size * 0.06}
        style={{ filter: `drop-shadow(0 0 ${size * 0.12}px ${color.glow})` }}
      />
      <circle
        cx={cx}
        cy={cx}
        r={r * 0.7}
        fill="none"
        stroke={color.stroke}
        strokeWidth={size * 0.02}
        strokeDasharray={`${r * 0.5} ${r * 0.8}`}
        opacity="0.4"
      />
    </svg>
  );
}

function Diamond({ size, color }: { size: number; color: ColorSet }) {
  const cx = size / 2;
  const h = size * 0.45;
  const w = size * 0.28;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ filter: `drop-shadow(0 0 ${size * 0.15}px ${color.glow})` }}>
      <polygon
        points={`${cx},${cx - h} ${cx + w},${cx} ${cx},${cx + h} ${cx - w},${cx}`}
        fill={color.fill}
        stroke={color.stroke}
        strokeWidth="1"
        strokeLinejoin="round"
      />
      {/* Inner facet lines */}
      <line x1={cx} y1={cx - h} x2={cx} y2={cx + h} stroke={color.stroke} strokeWidth="0.5" opacity="0.4" />
      <line x1={cx - w} y1={cx} x2={cx + w} y2={cx} stroke={color.stroke} strokeWidth="0.5" opacity="0.4" />
      {/* Highlight */}
      <polygon
        points={`${cx},${cx - h} ${cx + w * 0.3},${cx - h * 0.3} ${cx},${cx - h * 0.1} ${cx - w * 0.3},${cx - h * 0.3}`}
        fill="rgba(255,255,255,0.2)"
      />
    </svg>
  );
}

function Hexagon({ size, color }: { size: number; color: ColorSet }) {
  const cx = size / 2;
  const r = size * 0.4;
  const pts = Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    return `${cx + r * Math.cos(angle)},${cx + r * Math.sin(angle)}`;
  }).join(" ");
  const ptsInner = Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    return `${cx + r * 0.6 * Math.cos(angle)},${cx + r * 0.6 * Math.sin(angle)}`;
  }).join(" ");
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ filter: `drop-shadow(0 0 ${size * 0.12}px ${color.glow})` }}>
      <polygon
        points={pts}
        fill={color.fill}
        stroke={color.stroke}
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <polygon
        points={ptsInner}
        fill="none"
        stroke={color.stroke}
        strokeWidth="0.5"
        strokeLinejoin="round"
        opacity="0.35"
      />
      {/* Connect inner to outer */}
      {Array.from({ length: 6 }, (_, i) => {
        const angle = (Math.PI / 3) * i - Math.PI / 2;
        return (
          <line
            key={i}
            x1={cx + r * 0.6 * Math.cos(angle)}
            y1={cx + r * 0.6 * Math.sin(angle)}
            x2={cx + r * Math.cos(angle)}
            y2={cx + r * Math.sin(angle)}
            stroke={color.stroke}
            strokeWidth="0.4"
            opacity="0.25"
          />
        );
      })}
    </svg>
  );
}

function FloatingCard({ size, color }: { size: number; color: ColorSet }) {
  const w = size * 1.2;
  const h = size * 0.75;
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: size * 0.15,
        background: `linear-gradient(135deg, ${color.fill}, rgba(255,255,255,0.03))`,
        border: `1px solid ${color.stroke}`,
        backdropFilter: "blur(8px)",
        boxShadow: `0 ${size * 0.1}px ${size * 0.4}px ${color.glow}, inset 0 1px 0 rgba(255,255,255,0.1)`,
        display: "flex",
        flexDirection: "column" as const,
        padding: size * 0.12,
        gap: size * 0.06,
      }}
    >
      {/* Mini content lines */}
      <div style={{ width: "60%", height: 3, borderRadius: 2, background: color.stroke, opacity: 0.5 }} />
      <div style={{ width: "80%", height: 2, borderRadius: 2, background: color.stroke, opacity: 0.25 }} />
      <div style={{ width: "45%", height: 2, borderRadius: 2, background: color.stroke, opacity: 0.25 }} />
      <div style={{ flex: 1 }} />
      <div style={{ display: "flex", gap: size * 0.05 }}>
        <div style={{ width: size * 0.12, height: size * 0.12, borderRadius: "50%", background: color.stroke, opacity: 0.3 }} />
        <div style={{ width: size * 0.12, height: size * 0.12, borderRadius: "50%", background: color.stroke, opacity: 0.2 }} />
      </div>
    </div>
  );
}

function Torus({ size, color }: { size: number; color: ColorSet }) {
  const cx = size / 2;
  const rx = size * 0.4;
  const ry = size * 0.15;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ filter: `drop-shadow(0 0 ${size * 0.1}px ${color.glow})` }}>
      <ellipse cx={cx} cy={cx} rx={rx} ry={ry} fill="none" stroke={color.stroke} strokeWidth={size * 0.07} opacity="0.3" />
      <ellipse
        cx={cx}
        cy={cx}
        rx={rx}
        ry={ry}
        fill="none"
        stroke={color.primary}
        strokeWidth={size * 0.04}
        strokeDasharray={`${rx * 1.5} ${rx * 2}`}
        opacity="0.6"
      />
    </svg>
  );
}

function Triangle({ size, color }: { size: number; color: ColorSet }) {
  const cx = size / 2;
  const h = size * 0.42;
  const w = size * 0.36;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ filter: `drop-shadow(0 0 ${size * 0.12}px ${color.glow})` }}>
      <polygon
        points={`${cx},${cx - h} ${cx + w},${cx + h * 0.6} ${cx - w},${cx + h * 0.6}`}
        fill={color.fill}
        stroke={color.stroke}
        strokeWidth="1"
        strokeLinejoin="round"
      />
      {/* Inner triangle */}
      <polygon
        points={`${cx},${cx - h * 0.5} ${cx + w * 0.5},${cx + h * 0.3} ${cx - w * 0.5},${cx + h * 0.3}`}
        fill="none"
        stroke={color.stroke}
        strokeWidth="0.6"
        strokeLinejoin="round"
        opacity="0.3"
      />
    </svg>
  );
}

function ShapeRenderer({ shape, color }: { shape: FloatingShape; color: ColorSet }) {
  switch (shape.type) {
    case "glassSphere":
      return <GlassSphere size={shape.size} color={color} />;
    case "wireframeCube":
      return <WireframeCube size={shape.size} color={color} />;
    case "glowRing":
      return <GlowRing size={shape.size} color={color} />;
    case "diamond":
      return <Diamond size={shape.size} color={color} />;
    case "hexagon":
      return <Hexagon size={shape.size} color={color} />;
    case "floatingCard":
      return <FloatingCard size={shape.size} color={color} />;
    case "torus":
      return <Torus size={shape.size} color={color} />;
    case "triangle":
      return <Triangle size={shape.size} color={color} />;
    default:
      return null;
  }
}

/* ── Main component ── */

interface FloatingElementsProps {
  count?: number;
  interactive?: boolean;
  animatePulse?: boolean;
  motionScale?: number;
}

export function FloatingElements({
  count = 10,
  interactive = true,
  animatePulse = true,
  motionScale = 1,
}: FloatingElementsProps) {
  const { dark } = useTheme();
  const colors = dark ? DARK_COLORS : LIGHT_COLORS;
  const [reducedMode, setReducedMode] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");

    const recalc = () => {
      const lowCpu = (navigator.hardwareConcurrency ?? 8) <= 4;
      const lowMem = ((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8) <= 4;
      setReducedMode(media.matches || lowCpu || lowMem);
    };

    recalc();
    media.addEventListener("change", recalc);
    return () => media.removeEventListener("change", recalc);
  }, []);

  const effectiveInteractive = interactive && !reducedMode;
  const effectivePulse = animatePulse && !reducedMode;
  const effectiveMotionScale = reducedMode ? motionScale * 0.55 : motionScale;
  const effectiveCount = reducedMode ? Math.max(3, Math.floor(count * 0.6)) : count;
  const shapes = useMemo(() => generateShapes(effectiveCount), [effectiveCount]);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { stiffness: 20, damping: 44 });
  const smoothY = useSpring(mouseY, { stiffness: 20, damping: 44 });

  useEffect(() => {
    if (!effectiveInteractive) {
      mouseX.set(0);
      mouseY.set(0);
      return;
    }

    let raf = 0;
    let lastX = 0;
    let lastY = 0;

    const flush = () => {
      raf = 0;
      mouseX.set(lastX);
      mouseY.set(lastY);
    };

    const handleMouseMove = (e: MouseEvent) => {
      lastX = (e.clientX / window.innerWidth - 0.5) * 2;
      lastY = (e.clientY / window.innerHeight - 0.5) * 2;
      if (!raf) {
        raf = window.requestAnimationFrame(flush);
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => {
      if (raf) {
        window.cancelAnimationFrame(raf);
      }
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [effectiveInteractive, mouseX, mouseY]);

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{ perspective: 1200, contain: "layout paint style", transform: "translateZ(0)" }}
    >
      {shapes.map((shape) => (
        <FloatingItem
          key={shape.id}
          shape={shape}
          color={colors[shape.colorIdx]}
          smoothX={smoothX}
          smoothY={smoothY}
          interactive={effectiveInteractive}
          animatePulse={effectivePulse}
          motionScale={effectiveMotionScale}
        />
      ))}
    </div>
  );
}

function FloatingItem({
  shape,
  color,
  smoothX,
  smoothY,
  interactive,
  animatePulse,
  motionScale,
}: {
  shape: FloatingShape;
  color: ColorSet;
  smoothX: ReturnType<typeof useSpring>;
  smoothY: ReturnType<typeof useSpring>;
  interactive: boolean;
  animatePulse: boolean;
  motionScale: number;
}) {
  const depth = shape.depth;
  const parallaxRange = interactive ? 32 * depth * motionScale : 0;
  const rotationRange = interactive ? 10 * depth * motionScale : 0;

  // Mouse-driven 3D translation
  const tx = useTransform(smoothX, [-1, 1], [-parallaxRange, parallaxRange]);
  const ty = useTransform(smoothY, [-1, 1], [-parallaxRange, parallaxRange]);

  // Mouse-driven 3D rotation
  const rotX = useTransform(smoothY, [-1, 1], [rotationRange, -rotationRange]);
  const rotY = useTransform(smoothX, [-1, 1], [-rotationRange, rotationRange]);

  // Compute blur and opacity based on depth (far = blurrier, more transparent)
  const blurVal = interactive && depth < 0.45 ? 1.5 : 0;
  const opacityVal = 0.45 + depth * 0.45;
  const driftY = 11 * depth * motionScale;
  const driftX = 6 * depth * motionScale;
  const driftRot = 6 * motionScale;

  return (
    <motion.div
      className="absolute"
      style={{
        left: `${shape.x}%`,
        top: `${shape.y}%`,
        x: tx,
        y: ty,
        rotateX: rotX,
        rotateY: rotY,
        filter: blurVal > 0 ? `blur(${blurVal}px)` : undefined,
        transformStyle: "preserve-3d",
        willChange: "transform, opacity",
      }}
    >
      <motion.div
        animate={{
          y: [0, -driftY, 0, driftY * 0.8, 0],
          x: [0, driftX, 0, -driftX, 0],
          rotateZ: [
            shape.rotateOffset,
            shape.rotateOffset + driftRot,
            shape.rotateOffset,
            shape.rotateOffset - driftRot,
            shape.rotateOffset,
          ],
          scale: [1, 1.02 + depth * 0.03, 1, 0.985, 1],
        }}
        transition={{
          duration: shape.duration,
          repeat: Infinity,
          delay: shape.delay,
          ease: "easeInOut",
        }}
        style={{ opacity: opacityVal, willChange: "transform, opacity" }}
      >
        {/* Pulse glow behind shape */}
        {animatePulse && (
          <motion.div
            className="absolute"
            style={{
              inset: -shape.size * 0.3,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${color.glow}, transparent 70%)`,
              zIndex: -1,
              willChange: "transform, opacity",
            }}
            animate={{ opacity: [0.28, 0.54, 0.28], scale: [0.92, 1.08, 0.92] }}
            transition={{ duration: shape.duration * 0.5, repeat: Infinity, delay: shape.delay }}
          />
        )}
        <ShapeRenderer shape={shape} color={color} />
      </motion.div>
    </motion.div>
  );
}
