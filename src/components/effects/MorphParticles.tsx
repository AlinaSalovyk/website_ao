import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface MorphParticlesProps {
    images: string[];
    targetRefs: React.RefObject<HTMLDivElement | null>[];
    sectionRef: React.RefObject<HTMLElement | null>;
    particleSize?: number;
    resolution?: number;
}

const ParticlesMesh = ({
    geomData,
    targetRefs,
    sectionRef,
    particleSize,
}: {
    geomData: any;
    targetRefs: React.RefObject<HTMLDivElement | null>[];
    sectionRef: React.RefObject<HTMLElement | null>;
    particleSize: number;
}) => {
    const pointsRef = useRef<THREE.Points>(null);

    const currentPos = useRef(new Float32Array(geomData.maxCount * 3));
    const currentCol = useRef(new Float32Array(geomData.maxCount * 4));

    const circleTexture = useMemo(() => {
        const canvas = document.createElement("canvas");
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext("2d");
        if (ctx) {
            const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
            gradient.addColorStop(0, "rgba(255,255,255,1)");
            gradient.addColorStop(0.8, "rgba(255,255,255,1)");
            gradient.addColorStop(1, "rgba(255,255,255,0)");
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 64, 64);
        }
        return new THREE.CanvasTexture(canvas);
    }, []);

    useFrame((state) => {
        if (!pointsRef.current || !sectionRef.current) return;

        const time = state.clock.elapsedTime;
        const sectionRect = sectionRef.current.getBoundingClientRect();
        const viewportCenterY = window.innerHeight / 2;

        const targets = targetRefs.map((ref) => {
            if (!ref.current) return null;
            const rect = ref.current.getBoundingClientRect();
            const targetCenterY = rect.top + rect.height / 2;
            const distToCenter = Math.abs(viewportCenterY - targetCenterY);
            const glX = rect.left + rect.width / 2 - (sectionRect.left + sectionRect.width / 2);
            const glY = -(rect.top + rect.height / 2 - (sectionRect.top + sectionRect.height / 2));

            return { glX, glY, width: rect.width, height: rect.height, distToCenter };
        });

        let minDist = Infinity;
        let activeTargetIdx = -1;

        targets.forEach((t, idx) => {
            if (t && t.distToCenter < minDist) {
                minDist = t.distToCenter;
                activeTargetIdx = idx;
            }
        });

        let activeF = 0;
        const assembleRadius = window.innerHeight * 0.6;
        const perfectRadius = 150;

        if (minDist < perfectRadius) {
            activeF = 1;
        } else if (minDist < assembleRadius) {
            const f = 1 - (minDist - perfectRadius) / (assembleRadius - perfectRadius);
            activeF = f * f * (3 - 2 * f);
        }

        const scatterF = 1 - activeF;
        const activeTarget = targets[activeTargetIdx];

        const posAttr = pointsRef.current.geometry.attributes.position;
        const colAttr = pointsRef.current.geometry.attributes.color;
        const pArr = posAttr.array as Float32Array;
        const cArr = colAttr.array as Float32Array;

        const currP = currentPos.current;
        const currC = currentCol.current;

        for (let i = 0; i < geomData.maxCount; i++) {
            const i3 = i * 3;
            const i4 = i * 4;

            const rand1 = geomData.randoms[i3];
            const rand2 = geomData.randoms[i3 + 1];
            const rand3 = geomData.randoms[i3 + 2];

            const angle = rand1 * Math.PI * 2 + time * 0.2;
            const radius = rand2 * window.innerWidth * 1.2;
            const hVortex = (rand3 - 0.5) * sectionRect.height * 1.5;

            const noiseX = Math.cos(angle) * radius;
            const noiseY = hVortex + Math.sin(time + rand2 * 10) * 100;
            const noiseZ = Math.sin(angle) * radius * 0.5;

            let targetX = noiseX;
            let targetY = noiseY;
            let targetZ = noiseZ;

            let targetR = 0.2 * scatterF;
            let targetG = 0.1 * scatterF;
            let targetB = 0.5 * scatterF;
            let targetA = 0.2 * scatterF;

            if (activeF > 0 && activeTarget) {
                const figPos = geomData[`pos${activeTargetIdx + 1}`];
                const figCol = geomData[`col${activeTargetIdx + 1}`];

                const uniformScale = Math.min(activeTarget.width, activeTarget.height);

                const assembledX = activeTarget.glX + figPos[i3] * uniformScale;
                const assembledY = activeTarget.glY + figPos[i3 + 1] * uniformScale;
                const assembledZ = figPos[i3 + 2] * uniformScale * 0.3;

                targetX = noiseX * scatterF + assembledX * activeF;
                targetY = noiseY * scatterF + assembledY * activeF;
                targetZ = noiseZ * scatterF + assembledZ * activeF;

                targetR += figCol[i4] * activeF;
                targetG += figCol[i4 + 1] * activeF;
                targetB += figCol[i4 + 2] * activeF;
                targetA += Math.min(1.0, figCol[i4 + 3] * 1.2) * activeF;
            }

            const lerpSpeed = activeF > 0.5 ? 0.15 : 0.05;

            currP[i3] += (targetX - currP[i3]) * lerpSpeed;
            currP[i3 + 1] += (targetY - currP[i3 + 1]) * lerpSpeed;
            currP[i3 + 2] += (targetZ - currP[i3 + 2]) * lerpSpeed;

            pArr[i3] = currP[i3];
            pArr[i3 + 1] = currP[i3 + 1];
            pArr[i3 + 2] = currP[i3 + 2];

            currC[i4] += (targetR - currC[i4]) * 0.1;
            currC[i4 + 1] += (targetG - currC[i4 + 1]) * 0.1;
            currC[i4 + 2] += (targetB - currC[i4 + 2]) * 0.1;
            currC[i4 + 3] += (targetA - currC[i4 + 3]) * 0.1;

            cArr[i4] = currC[i4];
            cArr[i4 + 1] = currC[i4 + 1];
            cArr[i4 + 2] = currC[i4 + 2];
            cArr[i4 + 3] = currC[i4 + 3];
        }

        posAttr.needsUpdate = true;
        colAttr.needsUpdate = true;
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" args={[currentPos.current, 3]} count={geomData.maxCount} itemSize={3} />
                <bufferAttribute attach="attributes-color" args={[currentCol.current, 4]} count={geomData.maxCount} itemSize={4} />
            </bufferGeometry>
            <pointsMaterial
                size={particleSize}
                map={circleTexture}
                vertexColors
                transparent={true}
                blending={THREE.NormalBlending}
                depthWrite={false}
                sizeAttenuation={false}
            />
        </points>
    );
};

export const MorphParticles = ({
    images,
    targetRefs,
    sectionRef,
    particleSize = 1.5,
    resolution = 2,
}: MorphParticlesProps) => {
    const [geometryData, setGeometryData] = useState<any>(null);

    useEffect(() => {
        let isMounted = true;

        const extractPixels = (imgUrl: string) => {
            return new Promise<any>((resolve) => {
                const img = new Image();
                img.crossOrigin = "Anonymous";
                img.onload = () => {
                    const canvas = document.createElement("canvas");
                    const canvasSize = 600;
                    canvas.width = canvasSize;
                    canvas.height = canvasSize;
                    const ctx = canvas.getContext("2d", { willReadFrequently: true });
                    if (!ctx) return resolve({ pos: [], col: [] });

                    ctx.filter = "contrast(1.1) saturate(1.2)";

                    const imgRatio = img.width / img.height;
                    let drawWidth = canvasSize;
                    let drawHeight = canvasSize;

                    if (imgRatio > 1) {
                        drawHeight = canvasSize / imgRatio;
                    } else {
                        drawWidth = canvasSize * imgRatio;
                    }

                    const drawX = (canvasSize - drawWidth) / 2;
                    const drawY = (canvasSize - drawHeight) / 2;

                    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

                    const data = ctx.getImageData(0, 0, canvasSize, canvasSize).data;
                    const pos = [], col = [];

                    for (let y = 0; y < canvasSize; y += resolution) {
                        for (let x = 0; x < canvasSize; x += resolution) {
                            const i = (y * canvasSize + x) * 4;

                            const r = data[i];
                            const g = data[i + 1];
                            const b = data[i + 2];
                            const alpha = data[i + 3];

                            if (alpha > 10) {
                                const normR = r / 255;
                                const normG = g / 255;
                                const normB = b / 255;
                                const normA = alpha / 255;

                                const luma = 0.299 * normR + 0.587 * normG + 0.114 * normB;
                                const depthZ = (luma - 0.5) * 0.5;

                                pos.push(
                                    (x / canvasSize) - 0.5,
                                    -((y / canvasSize) - 0.5),
                                    depthZ
                                );

                                col.push(normR, normG, normB, normA);
                            }
                        }
                    }
                    resolve({ pos, col });
                };
                img.src = imgUrl;
            });
        };

        Promise.all(images.map(extractPixels)).then((results) => {
            if (!isMounted) return;

            const maxCount = Math.max(
                results[0].pos.length / 3,
                results[1].pos.length / 3,
                results[2].pos.length / 3
            );

            const pad = (arr: number[], itemSize: number, isColor: boolean) => {
                const padded = new Float32Array(maxCount * itemSize);
                padded.set(arr);
                for (let i = arr.length; i < padded.length; i += itemSize) {
                    const randIdx = Math.floor(Math.random() * (arr.length / itemSize)) * itemSize;
                    for (let j = 0; j < itemSize; j++) padded[i + j] = arr[randIdx + j];
                    if (isColor) padded[i + 3] = 0;
                }
                return padded;
            };

            const randoms = new Float32Array(maxCount * 3);
            for (let i = 0; i < randoms.length; i++) {
                randoms[i] = Math.random();
            }

            setGeometryData({
                maxCount,
                randoms,
                pos1: pad(results[0].pos, 3, false), col1: pad(results[0].col, 4, true),
                pos2: pad(results[1].pos, 3, false), col2: pad(results[1].col, 4, true),
                pos3: pad(results[2].pos, 3, false), col3: pad(results[2].col, 4, true),
            });
        });

        return () => { isMounted = false; };
    }, [images, resolution]);

    return (
        <div className="absolute inset-0 w-full h-full pointer-events-none z-[50]">
            {geometryData && (
                <Canvas
                    style={{ pointerEvents: "none" }}
                    orthographic
                    camera={{ zoom: 1, position: [0, 0, 500] }}
                    dpr={[1, 2]}
                    gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
                >
                    <ParticlesMesh
                        geomData={geometryData}
                        targetRefs={targetRefs}
                        sectionRef={sectionRef}
                        particleSize={particleSize}
                    />
                </Canvas>
            )}
        </div>
    );
};