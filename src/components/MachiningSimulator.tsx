import { WorkpieceMaterial, ToolPosition } from '../types';
import { Play, Square, Hammer, ChevronLeft, ChevronRight, RotateCcw, Award, AlertCircle } from 'lucide-react';
import { useRef } from 'react';

interface MachiningSimulatorProps {
  spindleRunning: boolean;
  toggleSpindle: () => void;
  brakeEngaged?: boolean;
  toggleBrake?: () => void;
  rpm: number;
  setRpm: (rpm: number) => void;
  material: WorkpieceMaterial;
  setMaterial: (material: WorkpieceMaterial) => void;
  toolPos: ToolPosition;
  startJog: (axis: 'x' | 'z', delta: number) => void;
  stopJog: () => void;
  resetWorkpiece: () => void;
}

export default function MachiningSimulator({
  spindleRunning,
  toggleSpindle,
  brakeEngaged = false,
  toggleBrake,
  rpm,
  setRpm,
  material,
  setMaterial,
  toolPos,
  startJog,
  stopJog,
  resetWorkpiece,
}: MachiningSimulatorProps) {
  const jogIntervalRef = useRef<number | null>(null);

  // Handle touch/mouse press and hold
  const handlePressStart = (axis: 'x' | 'z', delta: number) => {
    // Clear any existing
    if (jogIntervalRef.current) {
      window.clearInterval(jogIntervalRef.current);
    }
    // Single immediate step
    startJog(axis, delta);
    // Continue stepping
    jogIntervalRef.current = window.setInterval(() => {
      startJog(axis, delta);
    }, 60);
  };

  const handlePressEnd = () => {
    if (jogIntervalRef.current) {
      window.clearInterval(jogIntervalRef.current);
      jogIntervalRef.current = null;
    }
    stopJog();
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Description Panel */}
      <div className="p-4 bg-white/5 border-b border-white/10 shrink-0">
        <div className="flex items-start gap-2.5">
          <Hammer className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Machining Simulator
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
              Start the rotary spindle and feed the carbide tip to carve out custom mechanical shafts.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Spindle Motor Drive */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Spindle Drive & Mechanical Brake
            </span>
            <span
              className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold border transition ${
                brakeEngaged
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 animate-pulse'
                  : spindleRunning
                  ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300 animate-pulse'
                  : 'bg-red-500/20 border-red-500/30 text-red-300'
              }`}
            >
              {brakeEngaged ? 'BRAKE ENGAGED' : spindleRunning ? 'RUNNING' : 'SPINDLE OFF'}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {/* Spindle Motor Toggle Button */}
            <button
              id="btn-spindle-toggle"
              onClick={toggleSpindle}
              className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs shadow-lg transition duration-150 flex items-center justify-center gap-2 cursor-pointer select-none active:scale-[0.98] ${
                spindleRunning
                  ? 'bg-red-500/25 hover:bg-red-500/35 text-red-300 border border-red-500/30 shadow-red-500/10'
                  : 'bg-emerald-500/25 hover:bg-emerald-500/35 text-emerald-300 border border-emerald-500/30 shadow-emerald-500/10'
              }`}
            >
              {spindleRunning ? (
                <>
                  <Square className="w-4 h-4 fill-current" />
                  STOP SPINDLE MOTOR
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  START SPINDLE MOTOR
                </>
              )}
            </button>

            {/* Spindle Brake Toggle Button */}
            <button
              id="btn-brake-toggle"
              onClick={toggleBrake}
              className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs shadow-md transition duration-150 flex items-center justify-center gap-2 cursor-pointer select-none active:scale-[0.98] ${
                brakeEngaged
                  ? 'bg-amber-500/30 hover:bg-amber-500/40 text-amber-300 border border-amber-500/50 shadow-amber-500/20'
                  : 'bg-slate-800/80 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-white/10 hover:border-amber-500/30'
              }`}
            >
              <AlertCircle className={`w-4 h-4 ${brakeEngaged ? 'text-amber-400' : 'text-slate-400'}`} />
              {brakeEngaged ? 'RELEASE SPINDLE BRAKE' : 'ENGAGE SPINDLE BRAKE'}
            </button>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-semibold text-slate-300">
              <span>Rotational Speed (RPM)</span>
              <span className="text-blue-400 font-mono font-bold">{rpm} RPM</span>
            </div>
            <input
              id="slider-rpm"
              type="range"
              min="100"
              max="2200"
              step="50"
              value={rpm}
              onChange={(e) => setRpm(Number(e.target.value))}
              className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-[9px] text-slate-500 font-mono">
              <span>100 LOW</span>
              <span>1200 MED</span>
              <span>2200 HIGH</span>
            </div>
          </div>
        </div>

        {/* Workpiece Metal Material */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Workpiece Alloy
            </span>
            <span className="text-[10px] font-mono text-cyan-400 font-semibold bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full">
              Grey Cast Iron
            </span>
          </div>
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <span className="w-3.5 h-3.5 rounded-full bg-slate-600 border border-slate-400/50 shadow-inner" />
              <div>
                <p className="font-bold text-slate-200">ASTM Class 35 Cast Iron</p>
                <p className="text-[10px] text-slate-400">Dark sand-cast outer skin • Turns to bright silver metal</p>
              </div>
            </div>
          </div>
        </div>

        {/* Manual Tool Jog Feeds */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3.5 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Manual Tool Jog Feeds
          </span>

          {/* X Axis: Cross-slide radial feed */}
          <div className="bg-black/20 p-3 rounded-xl border border-white/5 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-emerald-400 font-semibold tracking-wide">
                X-AXIS (Cut Depth / Diameter)
              </span>
              <span id="label-x-val" className="font-mono text-slate-300 font-semibold">
                {toolPos.x.toFixed(1)} mm
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                id="btn-jog-x-dec"
                onMouseDown={() => handlePressStart('x', -0.1)}
                onMouseUp={handlePressEnd}
                onMouseLeave={handlePressEnd}
                onTouchStart={() => handlePressStart('x', -0.1)}
                onTouchEnd={handlePressEnd}
                className="py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 active:scale-95 transition text-emerald-400 text-xs font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer select-none shadow-sm"
                title="Feed cutting tool IN (shaves stock diameter)"
              >
                <ChevronLeft className="w-4 h-4" />
                - IN (CUT)
              </button>
              <button
                id="btn-jog-x-inc"
                onMouseDown={() => handlePressStart('x', 0.1)}
                onMouseUp={handlePressEnd}
                onMouseLeave={handlePressEnd}
                onTouchStart={() => handlePressStart('x', 0.1)}
                onTouchEnd={handlePressEnd}
                className="py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 active:scale-95 transition text-slate-300 text-xs font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer select-none shadow-sm"
                title="Move cutting tool OUT (backs away from stock)"
              >
                OUT +
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Z Axis: Longitudinal carriage feed */}
          <div className="bg-black/20 p-3 rounded-xl border border-white/5 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-cyan-400 font-semibold tracking-wide">
                Z-AXIS (Longitudinal Position)
              </span>
              <span id="label-z-val" className="font-mono text-slate-300 font-semibold">
                {toolPos.z.toFixed(1)} mm
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                id="btn-jog-z-dec"
                onMouseDown={() => handlePressStart('z', -0.5)}
                onMouseUp={handlePressEnd}
                onMouseLeave={handlePressEnd}
                onTouchStart={() => handlePressStart('z', -0.5)}
                onTouchEnd={handlePressEnd}
                className="py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 active:scale-95 transition text-cyan-400 text-xs font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer select-none shadow-sm"
                title="Feed cutting tool LEFT (towards chuck)"
              >
                <ChevronLeft className="w-4 h-4" />
                ← LEFT (CHUCK)
              </button>
              <button
                id="btn-jog-z-inc"
                onMouseDown={() => handlePressStart('z', 0.5)}
                onMouseUp={handlePressEnd}
                onMouseLeave={handlePressEnd}
                onTouchStart={() => handlePressStart('z', 0.5)}
                onTouchEnd={handlePressEnd}
                className="py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 active:scale-95 transition text-slate-300 text-xs font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer select-none shadow-sm"
                title="Move cutting tool RIGHT (towards tailstock)"
              >
                RIGHT →
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Reload work block */}
          <button
            id="btn-refresh-workpiece"
            onClick={resetWorkpiece}
            className="w-full py-2.5 border border-white/10 hover:border-white/25 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-bold rounded-xl transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98] shadow-sm"
            title="Replace the machined workpiece with a raw un-shaved cylinder"
          >
            <RotateCcw className="w-4 h-4" />
            Mount Raw Workpiece
          </button>
        </div>

        {/* Machining tip card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex gap-2.5 text-[11px] leading-normal text-slate-400 shadow-sm">
          <Award className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>
            <strong>Machining Tip:</strong> Try setting spindle speed high (1500+ RPM) for smooth finishes, and keep your cutting feed rates low.
          </span>
        </div>
      </div>
    </div>
  );
}
