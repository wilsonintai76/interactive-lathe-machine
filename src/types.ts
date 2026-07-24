export type AppMode = 'inspect' | 'operate';

export type WorkpieceMaterial = 'castiron';

export interface ToolPosition {
  x: number; // Diameter in mm (e.g., 12.0 to 32.0, default 30.0)
  z: number; // Longitudinal position in mm (e.g., 10.0 to 110.0, default 80.0)
}

export interface AnatomyPart {
  title: string;
  category: string;
  desc: string;
  bullets: string[];
  cameraPos: { x: number; y: number; z: number };
  targetPos: { x: number; y: number; z: number };
}

export interface SimulatorState {
  mode: AppMode;
  spindleRunning: boolean;
  rpm: number;
  material: WorkpieceMaterial;
  toolPos: ToolPosition;
  selectedPartKey: string;
  audioEnabled: boolean;
}
