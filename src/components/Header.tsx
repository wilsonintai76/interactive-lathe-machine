import { AppMode } from '../types';
import { Settings, Eye, Play, Volume2, VolumeX, RefreshCw } from 'lucide-react';

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
    <header className="bg-white/5 border-b border-white/10 px-6 py-3 flex flex-col sm:flex-row justify-between items-center gap-4 z-20 backdrop-blur-xl shrink-0">
      <div className="flex items-center gap-3">
        <div className="bg-blue-500/20 border border-blue-400/30 p-2 rounded-xl text-blue-400 shadow-lg shadow-blue-500/10 backdrop-blur-md">
          <Settings className="w-5 h-5 animate-spin-slow" />
        </div>
        <div>
          <h1 id="app-title" className="text-sm font-bold tracking-tight text-white uppercase">
            LATHE-X <span className="text-blue-400 font-light">INTERACTIVE v2.5</span>
          </h1>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">
            Anatomy & Machining Station
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
        {/* Mode Toggles */}
        <div className="bg-black/30 p-1 rounded-xl border border-white/5 flex text-xs font-semibold w-full sm:w-auto">
          <button
            id="btn-inspect"
            onClick={() => setMode('inspect')}
            className={`flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all duration-200 flex-1 sm:flex-none uppercase font-mono text-[11px] ${
              mode === 'inspect'
                ? 'bg-white/10 text-white border border-white/10 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Inspect
          </button>
          <button
            id="btn-operate"
            onClick={() => setMode('operate')}
            className={`flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all duration-200 flex-1 sm:flex-none uppercase font-mono text-[11px] ${
              mode === 'operate'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            Simulate
          </button>
        </div>

        {/* Audio Toggle */}
        <button
          id="btn-audio"
          onClick={toggleAudio}
          className={`p-2 rounded-xl border transition shrink-0 ${
            audioEnabled
              ? 'bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/30 text-emerald-400 shadow shadow-emerald-500/10'
              : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-400 hover:text-slate-200'
          }`}
          title={audioEnabled ? "Mute Machine Sound" : "Enable Machine Sound"}
        >
          {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Camera Reset */}
        <button
          id="btn-reset-cam"
          onClick={resetCamera}
          className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 rounded-xl border border-white/10 transition shrink-0"
          title="Reset Camera View"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
