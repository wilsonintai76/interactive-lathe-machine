import { AppMode } from '../types';
import { Settings, Eye, Play, Volume2, VolumeX, RefreshCw } from 'lucide-react';
import Tooltip from './Tooltip';

interface HeaderProps {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  audioEnabled: boolean;
  toggleAudio: () => void;
  resetCamera: () => void;
}

export default function Header({
  mode,
  setMode,
  audioEnabled,
  toggleAudio,
  resetCamera,
}: HeaderProps) {
  return (
    <header className="bg-white/5 border-b border-white/10 px-3 py-2 sm:px-6 sm:py-3 flex flex-row justify-between items-center gap-2 sm:gap-4 z-20 backdrop-blur-xl shrink-0">
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="bg-blue-500/20 border border-blue-400/30 p-1.5 sm:p-2 rounded-xl text-blue-400 shadow-lg shadow-blue-500/10 backdrop-blur-md">
          <Settings className="w-4 h-4 sm:w-5 sm:h-5 animate-spin-slow" />
        </div>
        <div>
          <h1 id="app-title" className="text-xs sm:text-sm font-bold tracking-tight text-white uppercase">
            LATHE-X <span className="text-blue-400 font-light hidden sm:inline">INTERACTIVE v2.5</span>
          </h1>
          <p className="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-widest font-mono hidden sm:block">
            Anatomy & Machining Station
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3">
        {/* Mode Toggles */}
        <div className="bg-black/30 p-1 rounded-xl border border-white/5 flex text-xs font-semibold">
          <Tooltip content="Explore lathe component anatomy and technical specifications" position="bottom">
            <button
              id="btn-inspect"
              onClick={() => setMode('inspect')}
              className={`flex items-center justify-center gap-1 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-lg transition-all duration-200 uppercase font-mono text-[10px] sm:text-[11px] ${
                mode === 'inspect'
                  ? 'bg-white/10 text-white border border-white/10 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              Inspect
            </button>
          </Tooltip>

          <Tooltip content="Operate the spindle drive and cut custom metal workpieces" position="bottom">
            <button
              id="btn-operate"
              onClick={() => setMode('operate')}
              className={`flex items-center justify-center gap-1 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-lg transition-all duration-200 uppercase font-mono text-[10px] sm:text-[11px] ${
                mode === 'operate'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              Simulate
            </button>
          </Tooltip>
        </div>

        {/* Audio Toggle */}
        <Tooltip content="Toggle motor hum, cutting screech, and shop ambient audio" position="bottom">
          <button
            id="btn-audio"
            onClick={toggleAudio}
            className={`p-2 sm:px-3 sm:py-2 rounded-xl border transition shrink-0 flex items-center gap-1.5 font-mono text-[11px] font-semibold ${
              audioEnabled
                ? 'bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/30 text-emerald-300 shadow-sm shadow-emerald-500/10'
                : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-400 hover:text-slate-200'
            }`}
          >
            {audioEnabled ? <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            <span className="hidden sm:inline uppercase">{audioEnabled ? 'Sound ON' : 'Sound OFF'}</span>
          </button>
        </Tooltip>

        {/* Camera Reset */}
        <Tooltip content="Reset 3D perspective camera to default orientation" position="bottom">
          <button
            id="btn-reset-cam"
            onClick={resetCamera}
            className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 rounded-xl border border-white/10 transition shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </Tooltip>
      </div>
    </header>
  );
}
