import { useState, useRef } from 'react';
import { AppMode, WorkpieceMaterial, ToolPosition } from './types';
import Header from './components/Header';
import LatheCanvas from './components/LatheCanvas';
import DigitalReadout from './components/DigitalReadout';
import AnatomyInspector from './components/AnatomyInspector';
import MachiningSimulator from './components/MachiningSimulator';

export default function App() {
  const [mode, setMode] = useState<AppMode>('inspect');
  const [spindleRunning, setSpindleRunning] = useState(false);
  const [brakeEngaged, setBrakeEngaged] = useState(false);
  const [rpm, setRpm] = useState(750);
  const [material, setMaterial] = useState<WorkpieceMaterial>('brass');
  const [toolPos, setToolPos] = useState<ToolPosition>({ x: 15.0, z: 40.0 });
  const [selectedPartKey, setSelectedPartKey] = useState('workpiece');
  const [audioEnabled, setAudioEnabled] = useState(false);

  // Expose camera reset reference across component boundaries
  const resetCameraRef = useRef<(() => void) | null>(null);

  // Handle spindle engine toggle
  const toggleSpindle = () => {
    setSpindleRunning((prev) => {
      const next = !prev;
      // Disengage brake if starting spindle motor
      if (next) {
        setBrakeEngaged(false);
      }
      return next;
    });
  };

  // Handle brake toggle (instantly stops spindle)
  const toggleBrake = () => {
    setBrakeEngaged((prev) => {
      const next = !prev;
      if (next) {
        setSpindleRunning(false);
      }
      return next;
    });
  };

  // Perform coordinate shifts during manual axis jogging
  const startJog = (axis: 'x' | 'z', delta: number) => {
    setToolPos((prev) => {
      if (axis === 'x') {
        // X ranges from 6.0 mm (min diameter limit) to 16.0 mm (retracted diameter)
        return { ...prev, x: Math.max(6.0, Math.min(16.0, prev.x + delta)) };
      } else {
        // Z ranges from 10.0 mm (chuck safe-point) to 60.0 mm (tailstock boundary)
        return { ...prev, z: Math.max(10.0, Math.min(60.0, prev.z + delta)) };
      }
    });
  };

  const stopJog = () => {
    // Handled locally in simulator subcomponents to stop repeat intervals
  };

  // Dispatch custom window event to trigger canvas workpiece rebuild
  const resetWorkpiece = () => {
    window.dispatchEvent(new Event('reset-workpiece-trigger'));
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans relative">
      {/* Background Mesh Gradients */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-45">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-700 rounded-full blur-[120px]"></div>
      </div>

      {/* Top Navigation Bar */}
      <Header
        mode={mode}
        setMode={(newMode) => {
          setMode(newMode);
          // Auto turn off spindle when transitioning back to inspect
          if (newMode === 'inspect') {
            setSpindleRunning(false);
          }
        }}
        audioEnabled={audioEnabled}
        toggleAudio={() => setAudioEnabled((prev) => !prev)}
        resetCamera={() => resetCameraRef.current?.()}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden relative z-10">
        {/* Left Side: 3D Visualization Canvas & DRO Dashboard */}
        <div className="flex-1 relative bg-transparent flex flex-col min-h-[350px] md:min-h-0">
          <LatheCanvas
            mode={mode}
            spindleRunning={spindleRunning}
            setSpindleRunning={setSpindleRunning}
            rpm={rpm}
            setRpm={setRpm}
            material={material}
            toolPos={toolPos}
            setToolPos={setToolPos}
            selectedPartKey={selectedPartKey}
            setSelectedPartKey={setSelectedPartKey}
            audioEnabled={audioEnabled}
            resetCameraRef={resetCameraRef}
          />

          {/* Overlaid Digital Readout (DRO) Panel */}
          <DigitalReadout
            toolPos={toolPos}
            spindleRunning={spindleRunning}
            brakeEngaged={brakeEngaged}
            rpm={rpm}
          />

          {/* Mouse Controls Hint Overlay */}
          <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md border border-white/10 px-3.5 py-2 rounded-xl text-[11px] text-slate-400 select-none shadow-lg pointer-events-none hidden sm:block">
            <span className="font-medium text-slate-200">🖱️ Left-Click + Drag:</span> Rotate View
            <span className="mx-2">•</span>
            <span className="font-medium text-slate-200">📜 Scroll:</span> Zoom
            <span className="mx-2">•</span>
            <span className="font-medium text-slate-200">⇧ Shift + Drag:</span> Pan Bed
          </div>
        </div>

        {/* Right Side: Interactive Sidebar Panel */}
        <aside
          id="control-sidebar"
          className="w-full md:w-96 bg-white/5 backdrop-blur-md border-t md:border-t-0 md:border-l border-white/10 flex flex-col shrink-0 min-h-0 overflow-hidden shadow-2xl z-10"
        >
          {mode === 'inspect' ? (
            <AnatomyInspector
              selectedPartKey={selectedPartKey}
              setSelectedPartKey={setSelectedPartKey}
            />
          ) : (
            <MachiningSimulator
              spindleRunning={spindleRunning}
              toggleSpindle={toggleSpindle}
              brakeEngaged={brakeEngaged}
              toggleBrake={toggleBrake}
              rpm={rpm}
              setRpm={setRpm}
              material={material}
              setMaterial={setMaterial}
              toolPos={toolPos}
              startJog={startJog}
              stopJog={stopJog}
              resetWorkpiece={resetWorkpiece}
            />
          )}
        </aside>
      </div>
    </div>
  );
}
