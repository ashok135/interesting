import React, { useState, useRef, useCallback } from 'react';
import { Sliders, Sparkles, Film } from 'lucide-react';

interface ComparisonMode {
  id: string;
  label: string;
  beforeLabel: string;
  afterLabel: string;
  description: string;
  beforeGradingStyle: React.CSSProperties;
  afterGradingStyle: React.CSSProperties;
}

const MODES: ComparisonMode[] = [
  {
    id: 'film-color',
    label: 'Cinematic Color Grading (Teal & Amber)',
    beforeLabel: 'Flat Camera LOG / Rec.709',
    afterLabel: 'Hollywood 35mm Film Emulation',
    description:
      'Engineered in Adobe Premiere Pro & Lumetri with custom curves, film grain injection, and preserved skin tones.',
    beforeGradingStyle: {
      filter: 'saturate(0.55) contrast(0.85) brightness(1.05)',
    },
    afterGradingStyle: {
      filter: 'saturate(1.25) contrast(1.15) brightness(0.96) hue-rotate(-5deg)',
    },
  },
  {
    id: 'vfx-lighting',
    label: 'VFX Lighting & Dynamic Range',
    beforeLabel: 'Raw Green Screen Plate',
    afterLabel: 'Composited Atmosphere & Spill Suppressed',
    description:
      'Atmospheric depth, keylight integration, specular wrap, and particle glow composited in After Effects.',
    beforeGradingStyle: {
      filter: 'contrast(0.9) brightness(1.1) hue-rotate(25deg)',
    },
    afterGradingStyle: {
      filter: 'contrast(1.2) brightness(1.0) drop-shadow(0 0 16px rgba(245, 158, 11, 0.4))',
    },
  },
];

export const BeforeAfterSlider: React.FC = () => {
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [activeModeIdx, setActiveModeIdx] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeMode = MODES[activeModeIdx];

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.max(5, Math.min(95, (x / rect.width) * 100));
    setSliderPos(percent);
  }, []);

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      handleMove(e.clientX);
    }
  };

  return (
    <div className="bezel-outer shadow-lg my-8">
      <div className="bezel-inner p-5 sm:p-7 bg-white">
        {/* Top Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 mb-5 border-b border-slate-100 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[11px] font-semibold border border-amber-200 mb-1">
              <Sliders size={12} className="text-amber-600" />
              <span>Interactive Post-Production Lab</span>
            </div>
            <h3 className="font-display font-bold text-lg sm:text-xl text-slate-900">
              Interactive Before / After Color &amp; VFX Wipe
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Drag the center slider left and right to inspect the raw camera capture versus Sujan&apos;s finished grade.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-full border border-slate-200 self-start sm:self-auto shrink-0">
            {MODES.map((mode, idx) => (
              <button
                key={mode.id}
                onClick={() => setActiveModeIdx(idx)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  activeModeIdx === idx
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {idx === 0 ? 'Color Grading' : 'VFX Composite'}
              </button>
            ))}
          </div>
        </div>

        {/* Interactive Comparison Canvas */}
        <div
          ref={containerRef}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouchMove}
          className="relative w-full aspect-[16/9] sm:aspect-[21/9] rounded-2xl overflow-hidden cursor-ew-resize select-none border border-slate-200 shadow-inner bg-slate-950"
        >
          {/* Base Layer: AFTER (Graded / VFX) */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-all duration-300"
            style={{
              backgroundImage: 'url(/images/sujan-profile.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center 20%',
              ...activeMode.afterGradingStyle,
            }}
          >
            {/* Cinematic Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
          </div>

          {/* Top Clipped Layer: BEFORE (Flat LOG / Raw) */}
          <div
            className="absolute inset-0 bg-cover bg-center overflow-hidden transition-all duration-300"
            style={{
              clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)`,
              backgroundImage: 'url(/images/sujan-profile.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center 20%',
              ...activeMode.beforeGradingStyle,
            }}
          >
            <div className="absolute inset-0 bg-slate-950/20" />
          </div>

          {/* Floating Pill: BEFORE Label */}
          <div className="absolute top-4 left-4 z-20 pointer-events-none">
            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-slate-950/80 backdrop-blur-md text-slate-300 border border-white/20 shadow-sm flex items-center gap-1.5">
              <Film size={12} className="text-slate-400" />
              <span>BEFORE: {activeMode.beforeLabel}</span>
            </span>
          </div>

          {/* Floating Pill: AFTER Label */}
          <div className="absolute top-4 right-4 z-20 pointer-events-none">
            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/90 backdrop-blur-md text-slate-950 border border-amber-300 shadow-sm flex items-center gap-1.5">
              <Sparkles size={12} className="text-slate-950 fill-slate-950" />
              <span>AFTER: {activeMode.afterLabel}</span>
            </span>
          </div>

          {/* Center Divider Line & Handle */}
          <div
            className="absolute top-0 bottom-0 z-30 pointer-events-none"
            style={{ left: `${sliderPos}%` }}
          >
            {/* Vertical Line */}
            <div className="absolute top-0 bottom-0 -left-px w-0.5 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]" />

            {/* Draggable Circle Knob */}
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white text-slate-900 border-2 border-slate-900 flex items-center justify-center shadow-2xl transition-transform hover:scale-110">
              <div className="flex items-center gap-0.5">
                <span className="text-[10px] font-bold">◀</span>
                <span className="text-[10px] font-bold">▶</span>
              </div>
            </div>
          </div>

          {/* Bottom Narrative Banner */}
          <div className="absolute bottom-3 left-4 right-4 z-20 pointer-events-none">
            <div className="bg-slate-950/75 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 text-xs text-slate-200 flex items-center justify-between">
              <span className="truncate">{activeMode.description}</span>
              <span className="hidden sm:inline text-amber-400 font-semibold shrink-0 ml-2">
                Drag Slider ◀ ▶
              </span>
            </div>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="mt-4 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
          <span>• 10-bit &amp; 12-bit RAW workflow support</span>
          <span>• Color matched across Sony, RED, ARRI &amp; Blackmagic cameras</span>
          <span className="font-semibold text-slate-700">Finished in Lumetri Color &amp; After Effects</span>
        </div>
      </div>
    </div>
  );
};
