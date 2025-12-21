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
  const visibleRef = useRef<boolean>(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Detect quality tier
    const getTier = () => {
      const mem = (navigator as any).deviceMemory || 4;
      const cores = navigator.hardwareConcurrency || 4;
      const isMobile = window.innerWidth < 768 || /Mobi|Android/i.test(navigator.userAgent);
      if (isMobile || mem <= 4 || cores <= 4) return 'low';
      if (mem <= 8 || cores <= 8) return 'medium';
      return 'high';
    };

    const tier = getTier();
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isLow = tier === 'low' || prefersReducedMotion;
    const isMedium = tier === 'medium' && !prefersReducedMotion;
    const isHigh = tier === 'high' && !prefersReducedMotion;

    // Cap device pixel ratio to reduce fill cost
    const dpr = Math.min(1.5, Math.max(1, window.devicePixelRatio || 1));

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
      const count = isLow ? Math.floor(starCount * 0.45) : isMedium ? Math.floor(starCount * 0.7) : starCount;
      starsRef.current = Array.from({ length: count }, () => {
        const color = palette[Math.floor(Math.random() * palette.length)];
        const r = minRadius + Math.random() * (maxRadius - minRadius);
        return {
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: r * dpr,
          alpha: 0.7,
          baseAlpha: 0.55 + Math.random() * 0.35,
          twinkleSpeed: 0.5 + Math.random() * 1.2,
          vx: (Math.random() - 0.5) * drift * (isLow ? 0.6 : 1) * dpr,
          vy: (Math.random() - 0.5) * drift * (isLow ? 0.6 : 1) * dpr,
          color,
          phase: Math.random() * Math.PI * 2,
        } as Star;
      });
      shootersRef.current = [];
      nextShootAtRef.current = performance.now() + ((isLow ? shootFrequency * 1.6 : isMedium ? shootFrequency * 1.2 : shootFrequency) * 1000) * (0.5 + Math.random());
    };

    resize();
    let lastTime = performance.now();

    const step = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000); // clamp dt
      lastTime = now;

      // Clear with transparent to allow underlying gradient
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Pause when not visible
      if (!visibleRef.current) {
        rafRef.current = requestAnimationFrame(step);
        return;
      }

      // Ease parallax towards target
      parallaxRef.current.x += (parallaxRef.current.targetX - parallaxRef.current.x) * 0.06;
      parallaxRef.current.y += (parallaxRef.current.targetY - parallaxRef.current.y) * 0.06;

      const stars = starsRef.current;
      ctx.save();
      if (isHigh) ctx.globalCompositeOperation = 'lighter';
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
        const a = Math.max(0.1, Math.min(0.95, s.alpha));

        // Parallax offset based on star size (larger stars move more)
        const parallaxScale = isLow ? 0.1 : isMedium ? 0.15 : 0.2;
        const px = parallaxRef.current.x * (parallaxScale + s.r * 0.04);
        const py = parallaxRef.current.y * (parallaxScale + s.r * 0.04);

        // Draw star with subtle glow
        ctx.beginPath();
        ctx.fillStyle = `rgba(${s.color[0]}, ${s.color[1]}, ${s.color[2]}, ${a})`;
        ctx.shadowColor = `rgba(${s.color[0]}, ${s.color[1]}, ${s.color[2]}, ${Math.min(isLow ? 0.25 : 0.4, a)})`;
        ctx.shadowBlur = isLow ? 2 : isMedium ? 4 : 6;
        ctx.arc(s.x + px, s.y + py, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Shooting stars
      if (shootingStars && !prefersReducedMotion && now >= nextShootAtRef.current) {
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
          maxLife: (isLow ? 900 : 1400) + Math.random() * (isLow ? 500 : 800),
          length: (isLow ? 60 : 80) * dpr,
          width: (isLow ? 1.2 : 1.5) * dpr,
          color: [200, 240, 255],
        });
        nextShootAtRef.current = now + ((isLow ? shootFrequency * 1.5 : shootFrequency) * 1000) * (0.6 + Math.random());
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
      if (prefersReducedMotion) return;
      const { innerWidth: w, innerHeight: h } = window;
      const nx = (e.clientX / w - 0.5) * 2; // -1..1
      const ny = (e.clientY / h - 0.5) * 2;
      const amp = isLow ? 4 : isMedium ? 6 : 8;
      parallaxRef.current.targetX = nx * amp * dpr;
      parallaxRef.current.targetY = ny * amp * dpr;
    };
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    const onVisibility = () => {
      visibleRef.current = !document.hidden;
      if (!visibleRef.current) {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      } else {
        if (!rafRef.current) rafRef.current = requestAnimationFrame(step);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [starCount, maxRadius, minRadius, drift, twinkle, shootingStars, shootFrequency]);

    // Wrapper fixed canvas
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <canvas ref={canvasRef} />
    </div>
  );
}
