import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

if (typeof window !== "undefined") {
  const originalWarn = console.warn;
  console.warn = (...args: any[]) => {
    if (typeof args[0] === "string" && args[0].includes("THREE.Clock")) return;
    originalWarn.apply(console, args);
  };
}

interface ImageShapeParticlesProps {
  imageUrl: string;
  className?: string;
  particleSize?: number;
  resolution?: number;
  sectionRef: React.RefObject<HTMLElement | null>;
  boundsRef: React.RefObject<HTMLDivElement | null>;
}

const ParticlesMesh = ({
  positions,
  colors,
  origins,
  scatters,
  particleSize,
  mouseRef,
  scrollRef,
}: {
  positions: Float32Array;
  colors: Float32Array;
  origins: Float32Array;
  scatters: Float32Array;
  particleSize: number;
  mouseRef: React.RefObject<{ x: number; y: number }>;
  scrollRef: React.RefObject<number>;
}) => {
  const pointsRef = useRef<THREE.Points>(null);

  useFrame(() => {
    if (!pointsRef.current) return;

    const mouseX = mouseRef.current.x;
    const mouseY = mouseRef.current.y;
    const radius = 30;
    const scrollFactor = scrollRef.current;

    const parallaxY = -(window.scrollY * 0.15);

    const positionsAttr = pointsRef.current.geometry.attributes.position;
    const posArray = positionsAttr.array as Float32Array;

    for (let i = 0; i < posArray.length; i += 3) {
      const px = posArray[i];
      const py = posArray[i + 1];

      const ox = origins[i];
      const oy = origins[i + 1];
      const ease = origins[i + 2];

      const sx = scatters[i];
      const sy = scatters[i + 1];

      const currentOriginY = oy + parallaxY * (1 - scrollFactor);

      const targetX = ox + (sx - ox) * scrollFactor;
      const targetY = currentOriginY + (sy - currentOriginY) * scrollFactor;

      const dx = mouseX - px;
      const dy = mouseY - py;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < radius) {
        const force = (radius - distance) / radius;
        const forceDirectionX = dx / distance;
        const forceDirectionY = dy / distance;

        posArray[i] -= forceDirectionX * force * 5;
        posArray[i + 1] -= forceDirectionY * force * 5;
      } else {
        posArray[i] += (targetX - px) * ease;
        posArray[i + 1] += (targetY - py) * ease;
      }
    }

    positionsAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 4]}
          count={colors.length / 4}
          array={colors}
          itemSize={4}
        />
      </bufferGeometry>
      <pointsMaterial
        size={particleSize * 1.5}
        vertexColors
        transparent={true}
        depthWrite={false}
        sizeAttenuation={false}
      />
    </points>
  );
};

export const ImageShapeParticles = ({
  imageUrl,
  className = "",
  particleSize = 2.2,
  resolution = 10,
  sectionRef,
  boundsRef,
}: ImageShapeParticlesProps) => {
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const scrollRef = useRef(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [geometryData, setGeometryData] = useState<{
    positions: Float32Array;
    colors: Float32Array;
    origins: Float32Array;
    scatters: Float32Array;
  } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const section = sectionRef.current;
    const bounds = boundsRef.current;
    if (!container || !section || !bounds) return;

    let isMounted = true;
    let resizeTimeout: ReturnType<typeof setTimeout>;

    const loadParticles = () => {
      const sectionRect = section.getBoundingClientRect();
      const boundsRect = bounds.getBoundingClientRect();

      const boundsLeft = boundsRect.left - sectionRect.left;
      const boundsTop = boundsRect.top - sectionRect.top;

      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        if (!isMounted) return;

        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, boundsRect.width);
        canvas.height = Math.max(1, boundsRect.height);
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;

        ctx.filter = "hue-rotate(-20deg) brightness(2.5) saturate(3.5) contrast(1.5)";

        const imgRatio = img.width / img.height;
        const canvasRatio = canvas.width / canvas.height;
        let drawWidth = canvas.width;
        let drawHeight = canvas.height;

        if (canvasRatio > imgRatio) {
          drawWidth = canvas.height * imgRatio;
        } else {
          drawHeight = canvas.width / imgRatio;
        }

        const drawX = (canvas.width - drawWidth) / 2;
        const drawY = (canvas.height - drawHeight) / 2;

        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        const tempPositions: number[] = [];
        const tempColors: number[] = [];
        const tempOrigins: number[] = [];
        const tempScatters: number[] = [];

        for (let y = 0; y < canvas.height; y += resolution) {
          for (let x = 0; x < canvas.width; x += resolution) {
            const index = (y * canvas.width + x) * 4;
            const alpha = data[index + 3];

            if (alpha > 50) {
              const yPercent = y / canvas.height;
              let alphaMultiplier = 1;
              if (yPercent > 0.6) {
                alphaMultiplier = 1 - (yPercent - 0.6) / 0.3;
                if (alphaMultiplier < 0) alphaMultiplier = 0;
              }

              if (alphaMultiplier > 0.05) {
                const glX = (boundsLeft + x) - sectionRect.width / 2;
                const glY = -((boundsTop + y) - sectionRect.height / 2);

                const startX = glX + (Math.random() - 0.5) * 200;
                const startY = glY + (Math.random() - 0.5) * 200;
                tempPositions.push(startX, startY, 0);

                const ease = 0.05 + Math.random() * 0.05;
                tempOrigins.push(glX, glY, ease);

                const scatterX = (Math.random() - 0.5) * sectionRect.width * 1.5;
                const scatterY = (Math.random() - 0.5) * sectionRect.height * 1.5;
                tempScatters.push(scatterX, scatterY, 0);

                tempColors.push(
                  data[index] / 255,
                  data[index + 1] / 255,
                  data[index + 2] / 255,
                  alphaMultiplier
                );
              }
            }
          }
        }

        setGeometryData({
          positions: new Float32Array(tempPositions),
          colors: new Float32Array(tempColors),
          origins: new Float32Array(tempOrigins),
          scatters: new Float32Array(tempScatters),
        });
      };
      img.src = imageUrl;
    };

    loadParticles();

    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        loadParticles();
      }, 200);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      isMounted = false;
      window.removeEventListener("resize", handleResize);
    };
  }, [imageUrl, resolution, sectionRef, boundsRef]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll = window.innerHeight * 1.2;
      let factor = scrollY / maxScroll;
      if (factor > 1) factor = 1;
      if (factor < 0) factor = 0;

      const easeFactor = factor < 0.5 ? 2 * factor * factor : 1 - Math.pow(-2 * factor + 2, 2) / 2;
      scrollRef.current = easeFactor;
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      if (
        e.clientX >= rect.left && e.clientX <= rect.right &&
        e.clientY >= rect.top && e.clientY <= rect.bottom
      ) {
        mouseRef.current.x = (e.clientX - rect.left) - rect.width / 2;
        mouseRef.current.y = -((e.clientY - rect.top) - rect.height / 2);
      } else {
        mouseRef.current.x = -1000;
        mouseRef.current.y = -1000;
      }
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  if (!mounted) return null;

  return (
    <div ref={containerRef} className={`relative w-full h-full ${className}`}>
      {geometryData && (
        <div
          className="absolute inset-0 w-full h-full"
          style={{ filter: "drop-shadow(0px 0px 8px rgba(160, 100, 255, 0.6)) drop-shadow(0px 0px 15px rgba(255, 255, 255, 0.2)) saturate(1.5)" }}
        >
          <Canvas
            orthographic
            camera={{ zoom: 1, position: [0, 0, 100] }}
            gl={{ alpha: true, antialias: false, powerPreference: "high-performance" }}
          >
            <ParticlesMesh
              positions={geometryData.positions}
              colors={geometryData.colors}
              origins={geometryData.origins}
              scatters={geometryData.scatters}
              particleSize={particleSize}
              mouseRef={mouseRef}
              scrollRef={scrollRef}
            />
          </Canvas>
        </div>
      )}
    </div>
  );
};