import React, { useState, useEffect, useRef } from "react";
import { Monitor, Smartphone, Tablet, Laptop, ArrowLeft, RefreshCw } from "lucide-react";

type DeviceType = "mobile" | "tablet" | "laptop" | "desktop" | "wide";

const DEVICE_WIDTHS: Record<DeviceType, number> = {
  mobile: 375,
  tablet: 768,
  laptop: 1280,
  desktop: 1440,
  wide: 1920,
};

const DEVICE_LABELS: Record<DeviceType, string> = {
  mobile: "Мобільний (375px)",
  tablet: "Планшет (768px)",
  laptop: "Ноутбук (1280px)",
  desktop: "Десктоп (1440px)",
  wide: "Wide (1920px)",
};

export const PreviewHubClient: React.FC = () => {
  const [device, setDevice] = useState<DeviceType>("desktop");
  const [scale, setScale] = useState(1);
  const [autoFit, setAutoFit] = useState(true);
  const [targetUrl, setTargetUrl] = useState("");
  const [key, setKey] = useState(0);

  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const url = params.get("url");
    const session = params.get("session");
    if (url && session) {
      setTargetUrl(`${url}?preview_session=${session}`);
    } else {
      setTargetUrl("/404");
    }
  }, []);

  // Zoom to fit logic for scaled device viewports
  useEffect(() => {
    if (device === "desktop") {
      setScale(1);
      return;
    }

    if (!autoFit || !canvasRef.current) {
      setScale(1);
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const containerWidth = entries[0].contentRect.width;
      const targetWidth = DEVICE_WIDTHS[device];
      
      const availableWidth = containerWidth - 40; // 40px side margins
      
      if (targetWidth > availableWidth) {
        setScale(availableWidth / targetWidth);
      } else {
        setScale(1);
      }
    });

    observer.observe(canvasRef.current);
    return () => observer.disconnect();
  }, [device, autoFit]);

  if (!targetUrl) return null;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-900 text-gray-100 font-sans select-none">
      {/* ── Top Bar (Wix Style with 5 Devices) ── */}
      <header className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 shadow-sm z-50 text-gray-900">
        
        {/* Left: Brand + 5 Device Toggles */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 pr-3 border-r border-gray-200">
            <span className="font-bold text-xs tracking-wider uppercase text-gray-900">PREVIEW</span>
          </div>

          <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200">
            <button
              onClick={() => setDevice("mobile")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                device === "mobile"
                  ? "bg-white text-blue-600 shadow-sm font-semibold"
                  : "text-gray-600 hover:text-gray-900"
              }`}
              title={DEVICE_LABELS.mobile}
            >
              <Smartphone size={14} />
              <span className="hidden lg:inline">Mobile</span>
            </button>

            <button
              onClick={() => setDevice("tablet")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                device === "tablet"
                  ? "bg-white text-blue-600 shadow-sm font-semibold"
                  : "text-gray-600 hover:text-gray-900"
              }`}
              title={DEVICE_LABELS.tablet}
            >
              <Tablet size={14} />
              <span className="hidden lg:inline">Tablet</span>
            </button>

            <button
              onClick={() => setDevice("laptop")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                device === "laptop"
                  ? "bg-white text-blue-600 shadow-sm font-semibold"
                  : "text-gray-600 hover:text-gray-900"
              }`}
              title={DEVICE_LABELS.laptop}
            >
              <Laptop size={14} />
              <span className="hidden lg:inline">Laptop</span>
            </button>

            <button
              onClick={() => setDevice("desktop")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                device === "desktop"
                  ? "bg-white text-blue-600 shadow-sm font-semibold"
                  : "text-gray-600 hover:text-gray-900"
              }`}
              title={DEVICE_LABELS.desktop}
            >
              <Monitor size={14} />
              <span className="hidden lg:inline">Desktop</span>
            </button>

            <button
              onClick={() => setDevice("wide")}
              className={`px-2 py-1 rounded-md text-xs font-bold transition-all ${
                device === "wide"
                  ? "bg-white text-blue-600 shadow-sm font-semibold"
                  : "text-gray-600 hover:text-gray-900"
              }`}
              title={DEVICE_LABELS.wide}
            >
              <span>1920</span>
            </button>
          </div>
        </div>

        {/* Center: Live Sync status */}
        <div className="hidden md:flex items-center gap-2 text-xs font-medium text-gray-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Режим наживо ({DEVICE_WIDTHS[device]}px)</span>
          {device !== "desktop" && (
            <button
              onClick={() => setAutoFit(!autoFit)}
              className={`ml-2 px-2 py-0.5 rounded text-[11px] font-medium border transition-colors ${
                autoFit
                  ? "bg-blue-50 text-blue-600 border-blue-200"
                  : "bg-gray-100 text-gray-600 border-gray-200"
              }`}
            >
              Auto-fit: {autoFit ? "On" : "Off"}
            </button>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setKey((k) => k + 1)}
            className="p-1.5 text-gray-500 hover:text-gray-800 transition-colors bg-gray-100 hover:bg-gray-200 rounded-md border border-gray-200"
            title="Оновити прев'ю"
          >
            <RefreshCw size={14} />
          </button>

          <button
            onClick={() => {
              if (window.opener) {
                window.close();
              } else {
                window.history.back();
              }
            }}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 px-2 py-1 cursor-pointer"
          >
            <ArrowLeft size={14} />
            До редактора
          </button>
        </div>
      </header>

      {/* ── Main Frame Canvas ── */}
      <main
        ref={canvasRef}
        className="flex-1 w-full bg-gray-950 flex justify-center items-center overflow-auto relative"
      >
        {device === "desktop" ? (
          // Fullscreen 100% Desktop View (Zero margins, zero scale, 100% edge-to-edge)
          <iframe
            key={key}
            src={targetUrl}
            className="w-full h-full border-none bg-white"
            title="Live Preview Desktop"
          />
        ) : (
          // Device Canvas View (Scaled iframe with fixed target device width)
          <div
            className="shrink-0 origin-top shadow-2xl ring-1 ring-white/10 rounded-2xl overflow-hidden bg-white transition-all duration-300 ease-out my-4"
            style={{
              width: DEVICE_WIDTHS[device],
              height: "calc(100vh - 64px)",
              transform: `scale(${scale})`,
            }}
          >
            <iframe
              key={key}
              src={targetUrl}
              className="w-full h-full border-none bg-white"
              title={`Live Preview ${device}`}
            />
          </div>
        )}
      </main>
    </div>
  );
};
