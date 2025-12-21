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

type ShootingStar = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // ms elapsed
  maxLife: number; // ms
  length: number; // pixels
  width: number; // line width
  color: [number, number, number];
};

export function StarfieldBackground({
  starCount = 300,
  maxRadius = 1.6,
  minRadius = 0.6,
  drift = 0.02,
  twinkle = 0.4,
  shootingStars = true,
  shootFrequency = 8, // average seconds between shooting stars
}: {
  starCount?: number;
  maxRadius?: number;
  minRadius?: number;
  drift?: number;
  twinkle?: number;
  shootingStars?: boolean;
  shootFrequency?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const starsRef = useRef<Star[]>([]);
  const shootersRef = useRef<ShootingStar[]>([]);
  const rafRef = useRef<number | null>(null);
  const nextShootAtRef = useRef<number>(0);
  const parallaxRef = useRef<{ x: number; y: number; targetX: number; targetY: number }>({ x: 0, y: 0, targetX: 0, targetY: 0 });

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
      shootersRef.current = [];
      nextShootAtRef.current = performance.now() + (shootFrequency * 1000) * (0.5 + Math.random());
    };

    resize();
    let lastTime = performance.now();

    const step = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000); // clamp dt
      lastTime = now;

      // Clear with transparent to allow underlying gradient
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Ease parallax towards target
      parallaxRef.current.x += (parallaxRef.current.targetX - parallaxRef.current.x) * 0.06;
      parallaxRef.current.y += (parallaxRef.current.targetY - parallaxRef.current.y) * 0.06;

      const stars = starsRef.current;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
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
        const a = Math.max(0.12, Math.min(1, s.alpha));

        // Parallax offset based on star size (larger stars move more)
        const px = parallaxRef.current.x * (0.2 + s.r * 0.05);
        const py = parallaxRef.current.y * (0.2 + s.r * 0.05);

        // Draw star with subtle glow
        ctx.beginPath();
        ctx.fillStyle = `rgba(${s.color[0]}, ${s.color[1]}, ${s.color[2]}, ${a})`;
        ctx.shadowColor = `rgba(${s.color[0]}, ${s.color[1]}, ${s.color[2]}, ${Math.min(0.4, a)})`;
        ctx.shadowBlur = 6;
        ctx.arc(s.x + px, s.y + py, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Shooting stars
      if (shootingStars && now >= nextShootAtRef.current) {
        const speed = (80 + Math.random() * 80) * dpr; // px/s
        const angle = (Math.PI / 4) + (Math.random() - 0.5) * (Math.PI / 8); // roughly top-left to bottom-right
        const vx = Math.cos(angle) * speed * dt;
        const vy = Math.sin(angle) * speed * dt;
        const startX = Math.random() * canvas.width * 0.3; // spawn in left third
        const startY = Math.random() * canvas.height * 0.3; // spawn in top third
        shootersRef.current.push({
          x: startX,
          y: startY,
          vx,
          vy,
          life: 0,
          maxLife: 1400 + Math.random() * 800,
          length: 80 * dpr,
          width: 1.5 * dpr,
          color: [200, 240, 255],
        });
        nextShootAtRef.current = now + (shootFrequency * 1000) * (0.6 + Math.random());
      }

      // Render shooting stars with trail
      if (shootersRef.current.length) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let i = shootersRef.current.length - 1; i >= 0; i--) {
          const sh = shootersRef.current[i];
          sh.life += dt * 1000;
          sh.x += sh.vx;
          sh.y += sh.vy;

          const lifeT = Math.min(1, sh.life / sh.maxLife);
          const tail = sh.length * (0.6 + 0.4 * (1 - lifeT));
          const tailX = sh.x - (sh.vx !== 0 ? (sh.vx / Math.hypot(sh.vx, sh.vy)) * tail : 0);
          const tailY = sh.y - (sh.vy !== 0 ? (sh.vy / Math.hypot(sh.vx, sh.vy)) * tail : 0);

          const grad = ctx.createLinearGradient(sh.x, sh.y, tailX, tailY);
          grad.addColorStop(0, `rgba(${sh.color[0]}, ${sh.color[1]}, ${sh.color[2]}, ${0.9 * (1 - lifeT)})`);
          grad.addColorStop(1, `rgba(${sh.color[0]}, ${sh.color[1]}, ${sh.color[2]}, 0.0)`);

          ctx.lineWidth = sh.width;
          ctx.strokeStyle = grad;
          ctx.beginPath();
          ctx.moveTo(sh.x, sh.y);
          ctx.lineTo(tailX, tailY);
          ctx.stroke();

          // Small head glow
          ctx.beginPath();
          ctx.fillStyle = `rgba(${sh.color[0]}, ${sh.color[1]}, ${sh.color[2]}, ${0.8 * (1 - lifeT)})`;
          ctx.shadowColor = `rgba(${sh.color[0]}, ${sh.color[1]}, ${sh.color[2]}, 0.6)`;
          ctx.shadowBlur = 12;
          ctx.arc(sh.x, sh.y, 2.2 * dpr, 0, Math.PI * 2);
          ctx.fill();

          if (sh.life >= sh.maxLife || sh.x > canvas.width + tail || sh.y > canvas.height + tail) {
            shootersRef.current.splice(i, 1);
          }
        }
        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(step);
    };

    const onResize = () => resize();
    window.addEventListener('resize', onResize);
    const onMouseMove = (e: MouseEvent) => {
      const { innerWidth: w, innerHeight: h } = window;
      const nx = (e.clientX / w - 0.5) * 2; // -1..1
      const ny = (e.clientY / h - 0.5) * 2;
      parallaxRef.current.targetX = nx * 8 * dpr;
      parallaxRef.current.targetY = ny * 8 * dpr;
    };
    window.addEventListener('mousemove', onMouseMove);
    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, [starCount, maxRadius, minRadius, drift, twinkle, shootingStars, shootFrequency]);

    // Wrapper fixed canvas
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <canvas ref={canvasRef} />
    </div>
  );
}
