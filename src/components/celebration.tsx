"use client";

import { useCallback, useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  spin: number;
  angle: number;
  size: number;
  color: string;
  shape: 0 | 1 | 2;
  life: number;
};

/**
 * Canvas confetti — leaves, petals and sparks rather than plain rectangles, so
 * a celebration still looks like it belongs to this app. Everything is drawn
 * on one canvas and torn down when the last particle dies, so an idle board
 * costs nothing.
 */
export function useCelebration() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particles = useRef<Particle[]>([]);
  const raf = useRef<number | null>(null);

  const ensureCanvas = useCallback(() => {
    if (canvasRef.current) return canvasRef.current;
    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    Object.assign(canvas.style, {
      position: "fixed",
      inset: "0",
      width: "100%",
      height: "100%",
      pointerEvents: "none",
      zIndex: "70",
    });
    document.body.appendChild(canvas);
    canvasRef.current = canvas;
    return canvas;
  }, []);

  const teardown = useCallback(() => {
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = null;
    canvasRef.current?.remove();
    canvasRef.current = null;
    particles.current = [];
  }, []);

  useEffect(() => teardown, [teardown]);

  // The frame loop schedules itself, so it is held in a ref rather than
  // referring to its own binding.
  const loopRef = useRef<() => void>(() => {});

  const loop = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;
    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    particles.current = particles.current.filter((p) => {
      p.life -= 1;
      p.vy += 0.16; // gravity
      p.vx *= 0.995;
      p.x += p.vx;
      p.y += p.vy;
      p.angle += p.spin;
      if (p.life <= 0 || p.y > height + 40) return false;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.globalAlpha = Math.min(1, p.life / 28);
      ctx.fillStyle = p.color;

      if (p.shape === 0) {
        // Leaf: two mirrored arcs meeting at a point.
        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.quadraticCurveTo(p.size * 0.72, 0, 0, p.size);
        ctx.quadraticCurveTo(-p.size * 0.72, 0, 0, -p.size);
        ctx.fill();
      } else if (p.shape === 1) {
        ctx.fillRect(-p.size / 2, -p.size / 3, p.size, (p.size * 2) / 3);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      return true;
    });

    if (particles.current.length > 0) {
      raf.current = requestAnimationFrame(() => loopRef.current());
    } else {
      teardown();
    }
  }, [teardown]);

  useEffect(() => {
    loopRef.current = loop;
  }, [loop]);

  /**
   * @param origin  Normalised 0–1 coordinates for the burst centre.
   * @param colors  Team colours to throw.
   * @param power   1 = a quick award, 3 = a new leader.
   */
  const celebrate = useCallback(
    (origin: { x: number; y: number }, colors: string[], power = 1) => {
      if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

      const canvas = ensureCanvas();
      if (!canvas.getContext("2d")) return;

      const count = Math.round(38 * power);
      const cx = origin.x * window.innerWidth;
      const cy = origin.y * window.innerHeight;
      const palette = colors.length > 0 ? colors : ["#3f9142", "#c9922a", "#2b8fd6"];

      for (let i = 0; i < count; i++) {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * (Math.PI * 0.95);
        const speed = (4 + Math.random() * 7) * (0.7 + power * 0.22);
        particles.current.push({
          x: cx + (Math.random() - 0.5) * 40,
          y: cy + (Math.random() - 0.5) * 20,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          spin: (Math.random() - 0.5) * 0.28,
          angle: Math.random() * Math.PI * 2,
          size: 5 + Math.random() * 7,
          color: palette[Math.floor(Math.random() * palette.length)],
          shape: Math.floor(Math.random() * 3) as 0 | 1 | 2,
          life: 90 + Math.random() * 60,
        });
      }
      // Cap the particle budget so a rapid-fire teacher can't tank the frame rate.
      if (particles.current.length > 600) {
        particles.current = particles.current.slice(-600);
      }
      if (raf.current === null) raf.current = requestAnimationFrame(() => loopRef.current());
    },
    [ensureCanvas],
  );

  return celebrate;
}
