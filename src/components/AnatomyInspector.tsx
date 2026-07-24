import { ANATOMY_PARTS } from '../data/anatomy';
import { Info, ShieldAlert } from 'lucide-react';

interface AnatomyInspectorProps {
  selectedPartKey: string;
  setSelectedPartKey: (key: string) => void;
}

export default function AnatomyInspector({
  selectedPartKey,
  setSelectedPartKey,
}: AnatomyInspectorProps) {
  const selectedPart = ANATOMY_PARTS[selectedPartKey] || ANATOMY_PARTS.workpiece;

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Description Panel */}
      <div className="p-4 bg-white/5 border-b border-white/10 shrink-0">
        <div className="flex items-start gap-2.5">
          <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Anatomy Inspector
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
              Click parts directly in 3D, or use the list below to zoom into precision mechanics.
            </p>
          </div>
        </div>
      </div>

      {/* Scrollable list of parts */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block px-1">
            Lathe Assemblies
          </span>
          <div className="space-y-1">
            {Object.entries(ANATOMY_PARTS).map(([key, part]) => {
              const isSelected = key === selectedPartKey;
              return (
                <button
                  key={key}
                  id={`btn-part-${key}`}
                  onClick={() => setSelectedPartKey(key)}
                  className={`w-full text-left p-2.5 rounded-xl border text-xs transition duration-150 flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-white/15 border-white/20 text-white font-semibold shadow-inner'
                      : 'bg-white/5 border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10'
                  }`}
                >
                  <span className="truncate">{part.title}</span>
                  <span
                    className={`text-[9px] font-mono px-2 py-0.5 rounded-full shrink-0 border ${
                      isSelected
                        ? 'bg-blue-500/20 text-blue-300 font-bold border-blue-500/30'
                        : 'bg-white/5 text-slate-500 border-white/5'
                    }`}
                  >
                    {part.category}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Part Details */}
        <div
          id="part-detail-panel"
          className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3 shadow-inner"
        >
          <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
            <h3 className="text-sm font-bold text-blue-400 truncate">
              {selectedPart.title}
            </h3>
            <span className="text-[9px] px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-300 font-bold tracking-wider shrink-0 border border-blue-500/20">
              {selectedPart.category}
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {selectedPart.desc}
          </p>

          <div className="bg-black/20 p-3 rounded-xl border border-white/5 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Mechanical Functions:
            </span>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {selectedPart.bullets.map((bullet, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-blue-400 select-none mt-1 shrink-0">•</span>
                  <span className="leading-relaxed">{bullet}</span>
                </li>
              ))}
            </ul>
          </div>

          {selectedPartKey === 'workpiece' && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5 flex gap-2 text-[11px] text-amber-300 leading-normal">
              <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
              <span>
                <strong>Safety Protocol:</strong> Never operate lathe without safety guard or leave the chuck key inside!
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
