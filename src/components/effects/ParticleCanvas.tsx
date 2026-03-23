/**
 * ParticleCanvas — interactive canvas-based particle constellation system.
 * Particles form a network with connecting lines and react to mouse movement.
 * After mouse moves away, particles spring back to their original positions.
 * Uses requestAnimationFrame for 60fps, GPU-accelerated via Canvas API.
 * Particle count adapts to viewport width (fewer on mobile).
 */
import { useEffect, useRef, useCallback, type JSX } from "react";

interface Particle {
  x: number;
  y: number;
  originX: number;
  originY: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  isStar?: boolean;
}

interface ParticleCanvasProps {
  className?: string;
  particleColor?: string;
  starColor?: string;
  lineColor?: string;
  maxParticles?: number;
  starCount?: number;
  connectionDistance?: number;
  mouseRadius?: number;
}

export const ParticleCanvas = ({
  className = "",
  particleColor = "rgba(100, 160, 255, 0.6)",
  starColor = "rgba(255, 255, 255, 0.8)",
  lineColor = "rgba(100, 160, 255, 0.15)",
  maxParticles = 120,
  starCount = 80,
  connectionDistance = 140,
  mouseRadius = 180,
}: ParticleCanvasProps): JSX.Element => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);

  const initParticles = useCallback(
    (width: number, height: number) => {
      const count = width < 768 ? Math.floor(maxParticles * 0.4) : maxParticles;
      const sCount = width < 768 ? Math.floor(starCount * 0.4) : starCount;
      const particles: Particle[] = [];

      // Main constellation particles
      for (let i = 0; i < count; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        particles.push({
          x,
          y,
          originX: x,
          originY: y,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          radius: Math.random() * 2 + 1,
          opacity: Math.random() * 0.5 + 0.3,
        });
      }

      // Loose stars
      for (let i = 0; i < sCount; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        particles.push({
          x,
          y,
          originX: x,
          originY: y,
          vx: (Math.random() - 0.5) * 0.1,
          vy: (Math.random() - 0.5) * 0.1,
          radius: Math.random() * 1.5 + 0.5,
          opacity: Math.random() * 0.8 + 0.2,
          isStar: true,
        });
      }

      particlesRef.current = particles;
    },
    [maxParticles, starCount],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      width = rect?.width ?? window.innerWidth;
      height = rect?.height ?? window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      initParticles(width, height);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const rect = canvas.getBoundingClientRect();
        mouseRef.current = {
          x: e.touches[0].clientX - rect.left,
          y: e.touches[0].clientY - rect.top,
        };
      }
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 };
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      const particles = particlesRef.current;
      const mouse = mouseRef.current;
      const mouseRadiusSq = mouseRadius * mouseRadius;
      const connectionDistSq = connectionDistance * connectionDistance;

      // Pre-compute index where stars begin (core particles first)
      let coreEnd = particles.length;
      for (let i = 0; i < particles.length; i++) {
        if (particles[i].isStar) {
          coreEnd = i;
          break;
        }
      }

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Mouse repulsion — use squared distance to avoid sqrt
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const distSq = dx * dx + dy * dy;
        if (distSq < mouseRadiusSq && distSq > 0) {
          const dist = Math.sqrt(distSq);
          const force = ((mouseRadius - dist) / mouseRadius) * 1.2;
          p.vx += (dx / dist) * force * 0.5;
          p.vy += (dy / dist) * force * 0.5;
        }

        // Spring force back to origin — soft elastic return (only for core particles)
        if (!p.isStar) {
          const springStrength = 0.008;
          const toOriginX = p.originX - p.x;
          const toOriginY = p.originY - p.y;
          p.vx += toOriginX * springStrength;
          p.vy += toOriginY * springStrength;
        }

        // Damping
        p.vx *= 0.96;
        p.vy *= 0.96;

        p.x += p.vx;
        p.y += p.vy;

        // Soft boundary — push back instead of wrapping
        if (p.x < -20) p.vx += 0.5;
        if (p.x > width + 20) p.vx -= 0.5;
        if (p.y < -20) p.vy += 0.5;
        if (p.y > height + 20) p.vy -= 0.5;

        // Draw particle with glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        if (p.isStar) {
          ctx.fillStyle = starColor.replace(/[\d.]+\)$/, `${p.opacity})`);
        } else {
          ctx.fillStyle = particleColor.replace(/[\d.]+\)$/, `${p.opacity})`);
        }
        ctx.fill();

        // Draw connections — only between core particles, use squared distance first
        if (i < coreEnd) {
          for (let j = i + 1; j < coreEnd; j++) {
            const p2 = particles[j];
            const cdx = p.x - p2.x;
            const cdy = p.y - p2.y;
            const cdistSq = cdx * cdx + cdy * cdy;
            if (cdistSq < connectionDistSq) {
              const cdist = Math.sqrt(cdistSq);
              const alpha = 1 - cdist / connectionDistance;
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.strokeStyle = lineColor.replace(
                /[\d.]+\)$/,
                `${alpha * 0.35})`,
              );
              ctx.lineWidth = 0.6;
              ctx.stroke();
            }
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleMouseLeave);
    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleMouseLeave);
    };
  }, [
    initParticles,
    particleColor,
    starColor,
    lineColor,
    connectionDistance,
    mouseRadius,
  ]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ zIndex: 1 }}
      aria-hidden="true"
    />
  );
};
