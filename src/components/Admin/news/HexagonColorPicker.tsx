import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Palette, X } from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';

// --- HEXAGON PICKER CORE ---
interface HexagonPickerProps {
    onSelect: (color: string) => void;
    selectedColor: string;
}

const HexagonPickerCore = React.memo(({ onSelect, selectedColor }: HexagonPickerProps) => {
    const hexRadius = 10;
    const hexWidth = Math.sqrt(3) * hexRadius;
    const hexHeight = 2 * hexRadius;
    const layers = 8;
    const padding = hexRadius * 2;
    const svgWidth = (layers * 2 + 1) * hexWidth + padding;
    const svgHeight = (layers * 2 + 1) * hexHeight * 0.75 + padding;

    const hexagons = useMemo(() => {
        const items = [];
        items.push({ x: 0, y: 0, color: '#ffffff' });

        for (let q = -layers; q <= layers; q++) {
            for (let r = -layers; r <= layers; r++) {
                const s = -q - r;
                const radius = Math.max(Math.abs(q), Math.abs(r), Math.abs(s));
                if (radius === 0 || radius > layers) continue;
                const x = (q * hexWidth) + (r * hexWidth / 2);
                const y = (r * hexHeight * 0.75);
                const angle = (Math.atan2(y, x) * 180) / Math.PI;
                const hue = angle < 0 ? angle + 360 : angle;
                let saturation = (radius / layers) * 100;
                let lightness = 50;
                if (radius < 3) {
                    lightness = 100 - (radius * 10);
                    saturation = radius * 20;
                } else if (radius > layers - 2) {
                    lightness = 50 - ((radius - (layers - 2)) * 15);
                    saturation = 100;
                } else {
                    lightness = 50;
                    saturation = 90;
                }
                items.push({ x, y, color: hslToHex(hue, saturation, lightness) });
            }
        }
        return items;
    }, []);

    return (
        <div className="flex justify-center items-center rounded-xl overflow-hidden will-change-transform">
            <svg
                viewBox={`${-svgWidth / 2} ${-svgHeight / 2} ${svgWidth} ${svgHeight}`}
                width="100%"
                height="auto"
                className="drop-shadow-sm"
                style={{ overflow: 'visible', maxHeight: '200px' }}
                shapeRendering="geometricPrecision"
            >
                {hexagons.map((hex, i) => {
                    const isActive = selectedColor.toLowerCase() === hex.color.toLowerCase();
                    return (
                        <path
                            key={i}
                            d={`M ${hex.x} ${hex.y - hexRadius} 
                    L ${hex.x + hexWidth/2} ${hex.y - hexRadius/2} 
                    L ${hex.x + hexWidth/2} ${hex.y + hexRadius/2} 
                    L ${hex.x} ${hex.y + hexRadius} 
                    L ${hex.x - hexWidth/2} ${hex.y + hexRadius/2} 
                    L ${hex.x - hexWidth/2} ${hex.y - hexRadius/2} Z`}
                            fill={hex.color}
                            onClick={() => onSelect(hex.color)}
                            className="cursor-pointer hover:opacity-80 transition-opacity"
                            style={{
                                stroke: isActive ? 'white' : 'rgba(0,0,0,0.05)',
                                strokeWidth: isActive ? 2 : 0.5,
                                paintOrder: 'stroke',
                                zIndex: isActive ? 10 : 0
                            }}
                        />
                    );
                })}
            </svg>
        </div>
    );
});

function hslToHex(h: number, s: number, l: number) {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = (n: number) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

// --- POPUP WRAPPER ---
interface HexagonColorPickerProps {
    color: string;
    onChange: (color: string) => void;
}

export function HexagonColorPicker({ color, onChange }: HexagonColorPickerProps) {
    const handleHexSelect = (c: string) => {
        onChange(c);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
    };

    const safeColor = /^#[0-9A-Fa-f]{6}$/i.test(color) ? color : "#3b82f6";

    return (
        <Popover.Root>
            <Popover.Trigger asChild>
                <button
                    type="button"
                    className="relative group p-2 rounded-xl transition-all duration-300 hover:scale-105 shadow-sm border border-border bg-card flex items-center justify-center w-10 h-10 cursor-pointer"
                    style={{ color: safeColor }}
                    aria-label="Змінити колір"
                >
                    <Palette size={20} className="group-hover:rotate-12 transition-transform" />
                    <span
                        className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-card shadow-sm"
                        style={{ backgroundColor: safeColor }}
                    />
                </button>
            </Popover.Trigger>

            <Popover.Portal>
                <Popover.Content 
                    align="start" 
                    sideOffset={8}
                    className="z-[9999] w-[280px] p-0 bg-card backdrop-blur-xl border border-border shadow-2xl rounded-2xl overflow-hidden animate-in zoom-in-95 fade-in-0 duration-200 text-card-foreground"
                >
                    <div className="px-4 py-3 border-b border-border flex justify-between items-center bg-muted/40">
                        <span className="text-sm font-semibold text-foreground">Палітра</span>
                        <Popover.Close asChild>
                            <button
                                type="button"
                                className="p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors cursor-pointer"
                            >
                                <X size={16} />
                            </button>
                        </Popover.Close>
                    </div>

                    <div className="p-4 flex flex-col gap-4">
                        <div className="flex justify-center">
                            <HexagonPickerCore
                                selectedColor={color}
                                onSelect={handleHexSelect}
                            />
                        </div>

                        <div className="h-px w-full bg-gray-100" />

                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-1 overflow-hidden">
                                <div
                                    className="w-8 h-8 rounded-lg border border-gray-200 shadow-sm transition-colors duration-75 shrink-0"
                                    style={{ backgroundColor: color }}
                                />
                                <span className="font-mono font-bold text-gray-600 text-sm truncate">
                                    {color}
                                </span>
                            </div>

                            <label className="relative cursor-pointer group active:scale-95 transition-transform">
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-xs font-bold text-gray-700 uppercase tracking-wide">
                                    <Palette size={14} />
                                    <span>Свій</span>
                                </div>
                                <input
                                    type="color"
                                    value={color?.startsWith("#") ? color : "#2563eb"}
                                    onChange={handleInputChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                            </label>
                        </div>
                    </div>
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
    );
}
