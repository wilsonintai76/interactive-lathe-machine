import { ToolPosition } from '../types';
import { AlertCircle } from 'lucide-react';

interface DigitalReadoutProps {
  toolPos: ToolPosition;
  spindleRunning: boolean;
  brakeEngaged?: boolean;
  rpm: number;
}

export default function DigitalReadout({
  toolPos,
  spindleRunning,
  brakeEngaged = false,
  rpm,
}: DigitalReadoutProps) {
  return (
    <div
      id="dro-panel"
      className="absolute top-4 right-4 bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-4 w-64 sm:w-72 shadow-2xl z-10 select-none pointer-events-auto"
    >
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              brakeEngaged
                ? 'bg-amber-400 animate-pulse'
                : spindleRunning
                ? 'bg-emerald-400 animate-pulse'
                : 'bg-red-400'
            }`}
          />
          <span className="text-[10px] font-bold text-slate-400 tracking-wider font-sans">
            DIGITAL READOUT (DRO)
          </span>
        </div>
        <span
          id="dro-status-text"
          className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${
            brakeEngaged
              ? 'bg-amber-500/25 text-amber-300 border-amber-500/40'
              : spindleRunning
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              : 'bg-red-500/20 text-red-300 border-red-500/30'
          }`}
        >
          {brakeEngaged ? 'BRAKE ENGAGED' : spindleRunning ? 'RUNNING' : 'STOPPED'}
        </span>
      </div>

      <div className="space-y-2.5 font-mono">
        {/* Brake Indicator Banner */}
        {brakeEngaged && (
          <div
            id="dro-brake-indicator"
            className="bg-amber-500/20 border border-amber-500/40 rounded-xl px-3 py-1.5 flex items-center justify-between text-amber-300 shadow-sm animate-pulse"
          >
            <div className="flex items-center gap-1.5 text-[10px] font-bold font-sans">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>BRAKE ENGAGED</span>
            </div>
            <span className="text-[9px] font-mono font-bold bg-amber-500/30 px-1.5 py-0.5 rounded text-amber-200">
              0 RPM (LOCKED)
            </span>
          </div>
        )}

        {/* X Axis */}
        <div className="bg-black/40 p-2.5 rounded-xl border border-white/5 flex justify-between items-center shadow-inner">
          <span className="text-[10px] text-emerald-400 font-bold tracking-wider">
            X (DIAMETER)
          </span>
          <div className="text-right">
            <span
              id="dro-x-display"
              className="text-xl font-bold text-emerald-400 tracking-tight transition-all duration-75"
              style={{ textShadow: '0 0 8px rgba(52, 211, 153, 0.4)' }}
            >
              {toolPos.x.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-500 ml-1">mm</span>
          </div>
        </div>

        {/* Z Axis */}
        <div className="bg-black/40 p-2.5 rounded-xl border border-white/5 flex justify-between items-center shadow-inner">
          <span className="text-[10px] text-cyan-400 font-bold tracking-wider">
            Z (POSITION)
          </span>
          <div className="text-right">
            <span
              id="dro-z-display"
              className="text-xl font-bold text-cyan-400 tracking-tight transition-all duration-75"
              style={{ textShadow: '0 0 8px rgba(34, 211, 238, 0.4)' }}
            >
              {toolPos.z.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-500 ml-1">mm</span>
          </div>
        </div>

        {/* Telemetry Footer */}
        <div className="flex justify-between items-center px-1 text-[10px] text-slate-400 font-sans mt-1">
          <span>SPINDLE DRIVE</span>
          <span className="font-mono text-[11px] text-slate-200 font-bold">
            {spindleRunning ? `${rpm} RPM` : '0 RPM'}
          </span>
        </div>
      </div>
    </div>
  );
}
