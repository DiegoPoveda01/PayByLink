'use client';

import { useEffect, useRef } from 'react';

type Star = {
  x: number;
  y: number;
  r: number; // radius
  alpha: number; // current alpha
  baseAlpha: number; // base alpha
  twinkleSpeed: number; // twinkle speed
  vx: number; // horizontal drift
  vy: number; // vertical drift
  color: [number, number, number]; // rgb
  phase: number; // random phase offset
};

export function StarfieldBackground({
  starCount = 300,
  maxRadius = 1.6,
  minRadius = 0.6,
  drift = 0.02,
  twinkle = 0.4,
}: {
  starCount?: number;
  maxRadius?: number;
  minRadius?: number;
  drift?: number;
  twinkle?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const starsRef = useRef<Star[]>([]);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));

    const palette: [number, number, number][] = [
      [255, 255, 255], // white
      [180, 240, 255], // soft cyan
      [160, 200, 255], // soft blue
      [210, 255, 250], // minty
    ];

    const resize = () => {
      const { innerWidth: w, innerHeight: h } = window;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      // Recreate stars on resize to fill area
      starsRef.current = Array.from({ length: starCount }, () => {
        const color = palette[Math.floor(Math.random() * palette.length)];
        const r = minRadius + Math.random() * (maxRadius - minRadius);
        return {
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: r * dpr,
          alpha: 0.8,
          baseAlpha: 0.6 + Math.random() * 0.4,
          twinkleSpeed: 0.5 + Math.random() * 1.2,
          vx: (Math.random() - 0.5) * drift * dpr,
          vy: (Math.random() - 0.5) * drift * dpr,
          color,
          phase: Math.random() * Math.PI * 2,
        } as Star;
      });
    };

    resize();
    let lastTime = performance.now();

    const step = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000); // clamp dt
      lastTime = now;

      // Clear with transparent to allow underlying gradient
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const stars = starsRef.current;
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        // Update position
        s.x += s.vx;
        s.y += s.vy;
        // Wrap around
        if (s.x < 0) s.x = canvas.width;
        if (s.x > canvas.width) s.x = 0;
        if (s.y < 0) s.y = canvas.height;
        if (s.y > canvas.height) s.y = 0;

        // Twinkle
        s.alpha = s.baseAlpha + Math.sin(now * 0.001 * s.twinkleSpeed + s.phase) * twinkle;
        const a = Math.max(0.15, Math.min(1, s.alpha));

        // Draw star
        // Using a simple circle with slight glow
        ctx.beginPath();
        ctx.fillStyle = `rgba(${s.color[0]}, ${s.color[1]}, ${s.color[2]}, ${a})`;
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(step);
    };

    const onResize = () => resize();
    window.addEventListener('resize', onResize);
    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', onResize);
    };
  }, [starCount, maxRadius, minRadius, drift, twinkle]);

    // Wrapper fixed canvas
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <canvas ref={canvasRef} />
    </div>
  );
}
