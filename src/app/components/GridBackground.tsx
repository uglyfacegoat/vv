import { useEffect, useRef } from "react";
import { useTheme } from "./ThemeProvider";

export function GridBackground({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { dark } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      draw(rect.width, rect.height);
    };

    const draw = (w: number, h: number) => {
      ctx.clearRect(0, 0, w, h);
      const gap = 60;
      ctx.strokeStyle = dark
        ? "rgba(139, 92, 246, 0.08)"
        : "rgba(139, 92, 246, 0.06)";
      ctx.lineWidth = 1;

      for (let x = 0; x <= w; x += gap) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y <= h; y += gap) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      for (let x = 0; x <= w; x += gap) {
        for (let y = 0; y <= h; y += gap) {
          const dist = Math.sqrt(
            Math.pow(x - w / 2, 2) + Math.pow(y - h / 2, 2)
          );
          const maxDist = Math.sqrt(Math.pow(w / 2, 2) + Math.pow(h / 2, 2));
          const alpha = Math.max(0, (dark ? 0.2 : 0.15) - (dist / maxDist) * (dark ? 0.2 : 0.15));
          ctx.fillStyle = `rgba(139, 92, 246, ${alpha})`;
          ctx.beginPath();
          ctx.arc(x, y, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [dark]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      style={{ opacity: dark ? 0.5 : 0.7 }}
    />
  );
}
