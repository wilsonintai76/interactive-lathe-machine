import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Eye, EyeOff } from 'lucide-react';
import { ToolPosition, WorkpieceMaterial, AppMode } from '../types';
import { ANATOMY_PARTS } from '../data/anatomy';
import { createMaterials, LatheMaterials } from './LatheMaterials';
import { buildLatheScene } from './LatheModelBuilder';
import { createWorkpieceGeometry } from './lathe/Workpiece3D';

const PART_SHORT_CODES: Record<string, string> = {
  workpiece: 'CK',
  headstock: 'HS',
  toolpost: 'TP',
  compoundrest: 'CR',
  crossslide: 'CS',
  carriage: 'CA',
  bedways: 'BD',
  tailstock: 'TS',
  footbrake: 'FB',
};

interface LatheCanvasProps {
  mode: AppMode;
  spindleRunning: boolean;
  setSpindleRunning?: (val: boolean) => void;
  rpm: number;
  setRpm?: (val: number) => void;
  material: WorkpieceMaterial;
  toolPos: ToolPosition;
  setToolPos?: React.Dispatch<React.SetStateAction<ToolPosition>>;
  selectedPartKey: string;
  setSelectedPartKey: (key: string) => void;
  audioEnabled: boolean;
  // Expose camera reset reference
  resetCameraRef: React.MutableRefObject<(() => void) | null>;
}

const SEGMENT_COUNT = 60; // Resolution of workpiece cutting slices

const WORKPIECE_MATERIAL_COLORS: Record<WorkpieceMaterial, { raw: THREE.Color; cut: THREE.Color }> = {
  castiron: {
    raw: new THREE.Color(0x283240), // Sand-cast dark iron raw skin
    cut: new THREE.Color(0xe2e8f0), // Freshly turned bright shiny silver iron core
  },
};

export default function LatheCanvas({
  mode,
  spindleRunning,
  setSpindleRunning,
  rpm,
  setRpm,
  material,
  toolPos,
  setToolPos,
  selectedPartKey,
  setSelectedPartKey,
  audioEnabled,
  resetCameraRef,
}: LatheCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // References for Three.js instances
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  // Assemblies refs
  const spindleGroupRef = useRef<THREE.Group | null>(null);
  const carriageRef = useRef<THREE.Group | null>(null);
  const crossSlideRef = useRef<THREE.Group | null>(null);
  const tailstockRef = useRef<THREE.Group | null>(null);
  const workpieceMeshRef = useRef<THREE.Mesh | null>(null);
  const leadScrewRef = useRef<THREE.Mesh | null>(null);

  // Interactive 3D component groups
  const carriageHandwheelRef = useRef<THREE.Group | null>(null);
  const crossSlideHandwheelRef = useRef<THREE.Group | null>(null);
  const spindleLeverRef = useRef<THREE.Group | null>(null);
  const rpmLever1Ref = useRef<THREE.Group | null>(null);
  const rpmLever2Ref = useRef<THREE.Group | null>(null);

  // Particles / Swarf Refs
  const particlesRef = useRef<THREE.Points | null>(null);
  const particleVelocities = useRef<THREE.Vector3[]>([]);
  const particleAges = useRef<number[]>([]);

  // Rising vapor / smoke particles
  const smokeParticlesRef = useRef<THREE.Points | null>(null);
  const smokeVelocities = useRef<THREE.Vector3[]>([]);
  const smokeAges = useRef<number[]>([]);

  // Metallic Chip Debris Particle System
  const chipParticlesRef = useRef<THREE.Points | null>(null);
  const chipVelocities = useRef<THREE.Vector3[]>([]);
  const chipAges = useRef<number[]>([]);
  const chipSettled = useRef<boolean[]>([]);

  // Visual Cut Trail / Cut Line state and refs
  const MAX_TRAIL_VERTICES = 24000; // Stores up to 12,000 cut line segments
  const cutTrailMeshRef = useRef<THREE.LineSegments | null>(null);
  const cutTrailGeomRef = useRef<THREE.BufferGeometry | null>(null);
  const trailVertexCountRef = useRef<number>(0);
  const lastCutLocalPointRef = useRef<THREE.Vector3 | null>(null);
  const lastTrailUpdateRef = useRef<number>(0);
  const [trailPassesCount, setTrailPassesCount] = useState<number>(0);

  // Drag State for Handwheel Interactive jog
  const dragStateRef = useRef<{
    active: boolean;
    axis: 'x' | 'z' | null;
    startX: number;
    startY: number;
    startVal: number;
  }>({
    active: false,
    axis: null,
    startX: 0,
    startY: 0,
    startVal: 0,
  });

  // Track currently hovered interactive 3D components to highlight them
  const hoveredPartRef = useRef<string | null>(null);

  // 3D Hotspot overlay state & screen projection coordinates
  const [showHotspots, setShowHotspots] = useState(true);
  const [hotspotCoords, setHotspotCoords] = useState<Record<string, { x: number; y: number; visible: boolean }>>({});
  const lastHotspotUpdateRef = useRef<number>(0);

  // Deformable geometry state
  // Workpiece coordinates in mm: spans from Z = 10 to Z = 60 (50mm length).
  // Initial radius is 7.5 mm (15mm diameter).
  const workpieceRadii = useRef<number[]>(new Array(SEGMENT_COUNT).fill(7.5));

  // Audio nodes refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const motorNodeRef = useRef<OscillatorNode | null>(null);
  const motorGainRef = useRef<GainNode | null>(null);
  const noiseNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const cuttingGainRef = useRef<GainNode | null>(null);
  const ambientGainRef = useRef<GainNode | null>(null);

  // Stable sync refs for animation loop
  const propsRef = useRef({ mode, spindleRunning, rpm, material, toolPos, selectedPartKey });
  const audioEnabledRef = useRef(audioEnabled);

  useEffect(() => {
    propsRef.current = { mode, spindleRunning, rpm, material, toolPos, selectedPartKey };
  }, [mode, spindleRunning, rpm, material, toolPos, selectedPartKey]);

  useEffect(() => {
    audioEnabledRef.current = audioEnabled;
  }, [audioEnabled]);

  // Transition animation state
  const cameraTransitionRef = useRef<{
    active: boolean;
    startCam: THREE.Vector3;
    endCam: THREE.Vector3;
    startTarget: THREE.Vector3;
    endTarget: THREE.Vector3;
    startTime: number;
    duration: number;
  }>({
    active: false,
    startCam: new THREE.Vector3(),
    endCam: new THREE.Vector3(),
    startTarget: new THREE.Vector3(),
    endTarget: new THREE.Vector3(),
    startTime: 0,
    duration: 800, // milliseconds
  });

  // Materials Definitions
  const materialsRef = useRef<LatheMaterials | null>(null);

  // State to track if the current frame is actively cutting
  const [isCuttingState, setIsCuttingState] = useState(false);

  // Helper to trigger camera transition
  const triggerCameraTransition = (
    camTarget: { x: number; y: number; z: number },
    lookAtTarget: { x: number; y: number; z: number }
  ) => {
    if (!cameraRef.current || !controlsRef.current) return;

    cameraTransitionRef.current = {
      active: true,
      startCam: cameraRef.current.position.clone(),
      endCam: new THREE.Vector3(camTarget.x, camTarget.y, camTarget.z),
      startTarget: controlsRef.current.target.clone(),
      endTarget: new THREE.Vector3(lookAtTarget.x, lookAtTarget.y, lookAtTarget.z),
      startTime: performance.now(),
      duration: 800,
    };
  };

  // Provide Reset View to parent
  useEffect(() => {
    resetCameraRef.current = () => {
      triggerCameraTransition({ x: 2.2, y: 1.9, z: 2.6 }, { x: 0.6, y: 1.05, z: -0.05 });
    };
    return () => {
      resetCameraRef.current = null;
    };
  }, []);

  // Update workpiece geometry from radii ref using Workpiece3D component builder
  const rebuildWorkpieceGeometry = () => {
    if (!workpieceMeshRef.current || !materialsRef.current) return;

    const currentMatKey = propsRef.current ? propsRef.current.material : material;
    const newGeom = createWorkpieceGeometry(workpieceRadii.current, currentMatKey);

    // Replace geometry cleanly
    const oldGeom = workpieceMeshRef.current.geometry;
    workpieceMeshRef.current.geometry = newGeom;
    oldGeom.dispose();
  };

  // Clear visual cut trail line on workpiece reset
  const clearCutTrail = () => {
    if (cutTrailGeomRef.current) {
      cutTrailGeomRef.current.setDrawRange(0, 0);
    }
    trailVertexCountRef.current = 0;
    lastCutLocalPointRef.current = null;
    setTrailPassesCount(0);
  };

  // Reset/Mount Fresh Workpiece
  const resetWorkpiece = () => {
    workpieceRadii.current = new Array(SEGMENT_COUNT).fill(7.5);
    rebuildWorkpieceGeometry();
    clearCutTrail();
  };

  // Listen for reset triggers
  useEffect(() => {
    // When workpiece resets in parent, trigger locally
    const handleReset = () => {
      resetWorkpiece();
    };
    window.addEventListener('reset-workpiece-trigger', handleReset);
    return () => {
      window.removeEventListener('reset-workpiece-trigger', handleReset);
    };
  }, []);

  // Sync material look
  useEffect(() => {
    rebuildWorkpieceGeometry();
  }, [material]);

  // Sync mode and camera focus
  useEffect(() => {
    if (mode === 'inspect') {
      const part = ANATOMY_PARTS[selectedPartKey];
      if (part) {
        triggerCameraTransition(part.cameraPos, part.targetPos);
      }
    } else {
      // In operate mode, focus on the workpiece cutting zone
      triggerCameraTransition({ x: 0.8, y: 1.5, z: 1.5 }, { x: 0.4, y: 1.15, z: -0.08 });
    }
  }, [selectedPartKey, mode]);

  // Initialize Web Audio API nodes
  const initAudio = () => {
    if (audioCtxRef.current) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      // Resume context immediately — browsers may auto-suspend before user interaction
      if (ctx.state === 'suspended') ctx.resume();

      // 1. Spindle Motor Hum (Oscillator)
      // Frequency range 90–290 Hz is audible on laptop speakers (old 35–80 Hz was sub-bass)
      const motorOsc = ctx.createOscillator();
      motorOsc.type = 'sawtooth';
      motorOsc.frequency.value = 90 + (rpm / 2200) * 200;

      const motorGain = ctx.createGain();
      motorGain.gain.value = spindleRunning ? 0.18 : 0.0;

      // Lowpass at 600 Hz — keeps the industrial growl without excessive highs
      const motorFilter = ctx.createBiquadFilter();
      motorFilter.type = 'lowpass';
      motorFilter.frequency.value = 600;

      motorOsc.connect(motorFilter);
      motorFilter.connect(motorGain);
      motorGain.connect(ctx.destination);
      motorOsc.start();

      motorNodeRef.current = motorOsc;
      motorGainRef.current = motorGain;

      // 2. Cutting Friction Screech (White Noise)
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 800; // Lower centre = more body, louder on most speakers
      filter.Q.value = 1.5;

      const cutGain = ctx.createGain();
      cutGain.gain.value = 0;

      noiseSource.connect(filter);
      filter.connect(cutGain);
      cutGain.connect(ctx.destination);
      noiseSource.start();

      noiseNodeRef.current = noiseSource;
      cuttingGainRef.current = cutGain;

      // 3. Ambient Machine Shop Background Sound (HVAC, ventilation rumble, sub line hum)
      const ambGain = ctx.createGain();
      ambGain.gain.value = (mode === 'operate') ? 0.07 : 0.0;

      // Pink noise room rumble synthesis
      const ambBufferSize = ctx.sampleRate * 3;
      const ambBuffer = ctx.createBuffer(1, ambBufferSize, ctx.sampleRate);
      const ambOutput = ambBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < ambBufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        ambOutput[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.03;
        b6 = white * 0.115926;
      }

      const ambSource = ctx.createBufferSource();
      ambSource.buffer = ambBuffer;
      ambSource.loop = true;

      const ambFilter = ctx.createBiquadFilter();
      ambFilter.type = 'lowpass';
      ambFilter.frequency.value = 500; // Raised to allow more audible mid rumble

      // 60Hz transformer line hum
      const humOsc = ctx.createOscillator();
      humOsc.type = 'sine';
      humOsc.frequency.value = 60;

      const humGain = ctx.createGain();
      humGain.gain.value = 0.15;

      humOsc.connect(humGain);
      humGain.connect(ambFilter);

      ambSource.connect(ambFilter);
      ambFilter.connect(ambGain);
      ambGain.connect(ctx.destination);

      ambSource.start();
      humOsc.start();

      ambientGainRef.current = ambGain;
    } catch (e) {
      console.warn('Audio synthesis initialisation failed:', e);
    }
  };

  // Handle audio enable/disable
  useEffect(() => {
    if (audioEnabled) {
      if (audioCtxRef.current) {
        if (audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume();
        }
      } else {
        initAudio();
      }
    } else {
      if (audioCtxRef.current && audioCtxRef.current.state === 'running') {
        audioCtxRef.current.suspend();
      }
    }
  }, [audioEnabled]);

  // Handle ambient machine shop background audio toggle depending on mode & audio setting
  useEffect(() => {
    if (audioEnabled && audioCtxRef.current && ambientGainRef.current) {
      const now = audioCtxRef.current.currentTime;
      const targetGain = (mode === 'operate') ? 0.07 : 0.0;
      ambientGainRef.current.gain.setTargetAtTime(targetGain, now, 0.15);
    }
  }, [mode, audioEnabled]);

  // Handle motor state (ON/OFF) and RPM changes in sound synthesizer
  useEffect(() => {
    if (audioEnabled && audioCtxRef.current) {
      const now = audioCtxRef.current.currentTime;

      if (motorGainRef.current) {
        const targetGain = spindleRunning ? 0.18 : 0.0;
        motorGainRef.current.gain.setTargetAtTime(targetGain, now, 0.08);
      }

      if (motorNodeRef.current) {
        const targetFreq = 90 + (rpm / 2200) * 200;
        motorNodeRef.current.frequency.setTargetAtTime(targetFreq, now, 0.08);
      }
    }
  }, [spindleRunning, rpm, audioEnabled]);

  // Main canvas setup and animation loop
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    // Create Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    sceneRef.current = scene;

    // Create Camera
    const camera = new THREE.PerspectiveCamera(
      42,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      100
    );
    camera.position.set(2.0, 1.9, 2.4);
    cameraRef.current = camera;

    // Create Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: false,
    });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;

    // Create Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0.4, 0.87, -0.02);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.15;
    controlsRef.current = controls;

    // Set up lighting - Bright, vibrant industrial lighting with task spotlight
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.3);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
    keyLight.position.set(4, 7, 5);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xe0f2fe, 0.9);
    fillLight.position.set(-4, 5, 4);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.7);
    rimLight.position.set(-4, 3, -4);
    scene.add(rimLight);

    // Dedicated high-intensity machinist LED work lamp directed right at the cutting contact point
    const taskLight = new THREE.SpotLight(0xfffbeb, 4.0);
    taskLight.position.set(0.3, 3.2, 1.5);
    taskLight.target.position.set(0.3, 0.87, -0.05);
    taskLight.angle = Math.PI / 3;
    taskLight.penumbra = 0.5;
    scene.add(taskLight);
    scene.add(taskLight.target);

    // Define standard materials with advanced PBR parameters for extreme realism
    const mats = createMaterials();
    materialsRef.current = mats;

    // Workpiece Mesh creation defaults
    const defaultPoints = [
      new THREE.Vector2(0.075, 0.08),
      new THREE.Vector2(0.075, 0.58),
    ];

    // Build the modularized lathe components in the 3D scene
    const latheRefs = buildLatheScene(scene, mats, defaultPoints);

    // Destructure them so the rest of the existing code works without changing any other variable names!
    const {
      leadScrew,
      spindleGroup,
      carriage,
      carriageHandwheel: apronHwGroup,
      crossSlide,
      crossSlideHandwheel: csHwGroup,
      spindleLever: spindleLeverGroup,
      rpmLever1: rpmLever1Group,
      rpmLever2: rpmLever2Group,
      tailstock,
      workpieceMesh,
      headstock,
      tpBlock,
      compBody,
      csTable,
      saddle,
      bedMesh,
      tsCasting,
    } = latheRefs;

    // Populate all refs for animations, physics, and interaction
    leadScrewRef.current = leadScrew;
    spindleGroupRef.current = spindleGroup;
    carriageRef.current = carriage;
    carriageHandwheelRef.current = apronHwGroup;
    crossSlideRef.current = crossSlide;
    crossSlideHandwheelRef.current = csHwGroup;
    spindleLeverRef.current = spindleLeverGroup;
    rpmLever1Ref.current = rpmLever1Group;
    rpmLever2Ref.current = rpmLever2Group;
    tailstockRef.current = tailstock;
    workpieceMeshRef.current = workpieceMesh;

    // Build the initial procedural workpiece geometry shape
    rebuildWorkpieceGeometry();

    // ==========================================
    // PERSISTENT VISUAL CUT TRAIL MESH
    // ==========================================
    const trailPositions = new Float32Array(MAX_TRAIL_VERTICES * 3);
    const trailColors = new Float32Array(MAX_TRAIL_VERTICES * 3);

    const cutTrailGeom = new THREE.BufferGeometry();
    cutTrailGeom.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
    cutTrailGeom.setAttribute('color', new THREE.BufferAttribute(trailColors, 3));
    cutTrailGeom.setDrawRange(0, 0);
    cutTrailGeomRef.current = cutTrailGeom;

    const cutTrailMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      linewidth: 2,
    });
    const cutTrailMesh = new THREE.LineSegments(cutTrailGeom, cutTrailMat);
    cutTrailMesh.name = 'cutTrailLine';
    spindleGroup.add(cutTrailMesh);
    cutTrailMeshRef.current = cutTrailMesh;

    // ==========================================
    // DUAL PARTICLE EMISSION SYSTEMS
    // ==========================================

    // System A: Swarf particle spraying system
    const pCount = 150;
    const pGeom = new THREE.BufferGeometry();
    const pPositions = new Float32Array(pCount * 3);
    const pColors = new Float32Array(pCount * 3);

    for (let i = 0; i < pCount; i++) {
      pPositions[i * 3] = 0;
      pPositions[i * 3 + 1] = -100; // Off-screen initially
      pPositions[i * 3 + 2] = 0;
      
      pColors[i * 3] = 1.0;
      pColors[i * 3 + 1] = 1.0;
      pColors[i * 3 + 2] = 1.0;

      particleVelocities.current.push(new THREE.Vector3());
      particleAges.current.push(0);
    }

    pGeom.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    pGeom.setAttribute('color', new THREE.BufferAttribute(pColors, 3));

    const pMat = new THREE.PointsMaterial({
      size: 0.032,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending, // realistic glowing hot sparks
    });
    const particles = new THREE.Points(pGeom, pMat);
    particlesRef.current = particles;
    scene.add(particles);

    // System B: Slow-rising heat vapor steam smoke particles
    const smokeCount = 40;
    const smokeGeom = new THREE.BufferGeometry();
    const smokePositions = new Float32Array(smokeCount * 3);

    for (let i = 0; i < smokeCount; i++) {
      smokePositions[i * 3] = 0;
      smokePositions[i * 3 + 1] = -100; // Off-screen initially
      smokePositions[i * 3 + 2] = 0;
      smokeVelocities.current.push(new THREE.Vector3());
      smokeAges.current.push(0);
    }

    smokeGeom.setAttribute('position', new THREE.BufferAttribute(smokePositions, 3));
    const smokeMat = new THREE.PointsMaterial({
      color: 0xe2e8f0, // cooling white cutting fluid oil steam
      size: 0.05,
      transparent: true,
      opacity: 0.28,
      blending: THREE.NormalBlending,
    });
    const smokeParticles = new THREE.Points(smokeGeom, smokeMat);
    smokeParticlesRef.current = smokeParticles;
    scene.add(smokeParticles);

    // System C: Physical Metallic Chip Debris Particle System
    const chipCount = 180;
    const chipGeom = new THREE.BufferGeometry();
    const chipPositions = new Float32Array(chipCount * 3);
    const chipColors = new Float32Array(chipCount * 3);

    for (let i = 0; i < chipCount; i++) {
      chipPositions[i * 3] = 0;
      chipPositions[i * 3 + 1] = -100; // Off-screen initially
      chipPositions[i * 3 + 2] = 0;

      chipColors[i * 3] = 0.85;
      chipColors[i * 3 + 1] = 0.88;
      chipColors[i * 3 + 2] = 0.95;

      chipVelocities.current.push(new THREE.Vector3());
      chipAges.current.push(0);
      chipSettled.current.push(false);
    }

    chipGeom.setAttribute('position', new THREE.BufferAttribute(chipPositions, 3));
    chipGeom.setAttribute('color', new THREE.BufferAttribute(chipColors, 3));

    const chipMat = new THREE.PointsMaterial({
      size: 0.026,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.NormalBlending, // Solid metallic look
    });
    const chipParticles = new THREE.Points(chipGeom, chipMat);
    chipParticlesRef.current = chipParticles;
    scene.add(chipParticles);

    // Ground Grid Helper for context
    const gridHelper = new THREE.GridHelper(8, 20, 0x334155, 0x1e293b);
    gridHelper.position.y = -0.8;
    scene.add(gridHelper);

    // ==========================================
    // UNIFIED INTERACTIVE RAYCASTING & CLICK/DRAG
    // ==========================================

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const getIntersectedInteractivePart = (clientX: number, clientY: number): string | null => {
      if (!rendererRef.current) return null;
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      const targets = [
        spindleLeverGroup,
        rpmLever1Group,
        rpmLever2Group,
        apronHwGroup,
        csHwGroup,
      ];

      const intersects = raycaster.intersectObjects(targets, true);
      if (intersects.length > 0) {
        let obj: THREE.Object3D | null = intersects[0].object;
        while (obj) {
          if (obj.name === 'spindleLever') return 'spindleLever';
          if (obj.name === 'rpmLever1') return 'rpmLever1';
          if (obj.name === 'rpmLever2') return 'rpmLever2';
          if (obj.name === 'carriageHandwheel') return 'carriageHandwheel';
          if (obj.name === 'crossSlideHandwheel') return 'crossSlideHandwheel';
          obj = obj.parent;
        }
      }
      return null;
    };

    const handlePointerDown = (e: PointerEvent) => {
      const currentMode = propsRef.current.mode;
      if (currentMode === 'inspect') {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);

        const partsToIntersect = [
          { key: 'workpiece', obj: workpieceMesh },
          { key: 'headstock', obj: headstock },
          { key: 'toolpost', obj: tpBlock },
          { key: 'compoundrest', obj: compBody },
          { key: 'crossslide', obj: csTable },
          { key: 'carriage', obj: saddle },
          { key: 'bedways', obj: bedMesh },
          { key: 'tailstock', obj: tsCasting },
        ];

        const intersectResults = raycaster.intersectObjects(
          partsToIntersect.map((p) => p.obj),
          true
        );

        if (intersectResults.length > 0) {
          const clickedObj = intersectResults[0].object;
          const matched = partsToIntersect.find((p) => {
            let found = false;
            p.obj.traverse((child) => {
              if (child === clickedObj) found = true;
            });
            return found || p.obj === clickedObj;
          });

          if (matched) {
            setSelectedPartKey(matched.key);
          }
        }
        return;
      }

      // Operate Mode Click Handlers
      const part = getIntersectedInteractivePart(e.clientX, e.clientY);
      if (!part) return;

      if (part === 'spindleLever') {
        if (setSpindleRunning) {
          setSpindleRunning(!propsRef.current.spindleRunning);
        }
      } else if (part === 'rpmLever1') {
        if (setRpm) {
          const curr = propsRef.current.rpm;
          const next = curr <= 750 ? 1250 : 400;
          setRpm(next);
        }
      } else if (part === 'rpmLever2') {
        if (setRpm) {
          const curr = propsRef.current.rpm;
          let next = curr;
          if (curr === 400) next = 750;
          else if (curr === 750) next = 400;
          else if (curr === 1250) next = 1800;
          else if (curr === 1800) next = 1250;
          setRpm(next);
        }
      } else if (part === 'carriageHandwheel') {
        dragStateRef.current = {
          active: true,
          axis: 'z',
          startX: e.clientX,
          startY: e.clientY,
          startVal: propsRef.current.toolPos.z,
        };
        controls.enabled = false; // Lock OrbitControls during drag
      } else if (part === 'crossSlideHandwheel') {
        dragStateRef.current = {
          active: true,
          axis: 'x',
          startX: e.clientX,
          startY: e.clientY,
          startVal: propsRef.current.toolPos.x,
        };
        controls.enabled = false; // Lock OrbitControls during drag
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      const currentMode = propsRef.current.mode;

      if (dragStateRef.current.active) {
        const { axis, startX, startY, startVal } = dragStateRef.current;
        if (axis === 'z') {
          const deltaX = e.clientX - startX;
          // Dragging handwheel horizontally jogs carriage Z
          const newZ = startVal + deltaX * 0.22;
          const clampedZ = Math.max(10.0, Math.min(110.0, newZ));
          if (setToolPos) {
            setToolPos((prev) => ({ ...prev, z: parseFloat(clampedZ.toFixed(1)) }));
          }
        } else if (axis === 'x') {
          const deltaY = e.clientY - startY;
          // Dragging cross-slide crank vertically jogs radial cutter depth X
          const newX = startVal - deltaY * 0.08;
          const clampedX = Math.max(12.0, Math.min(32.0, newX));
          if (setToolPos) {
            setToolPos((prev) => ({ ...prev, x: parseFloat(clampedX.toFixed(1)) }));
          }
        }
        if (containerRef.current) {
          containerRef.current.style.cursor = 'grabbing';
        }
        return;
      }

      if (currentMode === 'inspect') {
        if (containerRef.current) {
          containerRef.current.style.cursor = 'default';
        }
        return;
      }

      // Check for Hover Highlights in Operate Mode
      const part = getIntersectedInteractivePart(e.clientX, e.clientY);
      if (part) {
        if (containerRef.current) {
          containerRef.current.style.cursor = 'pointer';
        }

        if (hoveredPartRef.current !== part) {
          resetHoverScale();
          hoveredPartRef.current = part;

          let targetGroup: THREE.Group | null = null;
          if (part === 'spindleLever') targetGroup = spindleLeverGroup;
          else if (part === 'rpmLever1') targetGroup = rpmLever1Group;
          else if (part === 'rpmLever2') targetGroup = rpmLever2Group;
          else if (part === 'carriageHandwheel') targetGroup = apronHwGroup;
          else if (part === 'crossSlideHandwheel') targetGroup = csHwGroup;

          if (targetGroup) {
            targetGroup.scale.set(1.12, 1.12, 1.12);
          }
        }
      } else {
        if (containerRef.current) {
          containerRef.current.style.cursor = 'grab';
        }
        if (hoveredPartRef.current) {
          resetHoverScale();
          hoveredPartRef.current = null;
        }
      }
    };

    const resetHoverScale = () => {
      const part = hoveredPartRef.current;
      if (!part) return;
      let targetGroup: THREE.Group | null = null;
      if (part === 'spindleLever') targetGroup = spindleLeverGroup;
      else if (part === 'rpmLever1') targetGroup = rpmLever1Group;
      else if (part === 'rpmLever2') targetGroup = rpmLever2Group;
      else if (part === 'carriageHandwheel') targetGroup = apronHwGroup;
      else if (part === 'crossSlideHandwheel') targetGroup = csHwGroup;

      if (targetGroup) {
        targetGroup.scale.set(1.0, 1.0, 1.0);
      }
    };

    const handlePointerUp = () => {
      if (dragStateRef.current.active) {
        dragStateRef.current.active = false;
        controls.enabled = true; // Unlock OrbitControls camera
      }
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);
    renderer.domElement.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    // Animation frames loop
    let animationFrameId: number;
    let lastFrameTime = performance.now();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const now = performance.now();
      const delta = (now - lastFrameTime) / 1000; // seconds, matching THREE.Clock.getDelta()
      lastFrameTime = now;

      // Read stable parameters from refs for butter smooth 60fps
      const currentMode = propsRef.current.mode;
      const currentSpindleRunning = propsRef.current.spindleRunning;
      const currentRpm = propsRef.current.rpm;
      const currentToolPos = propsRef.current.toolPos;
      const currentMaterial = propsRef.current.material;

      // 1. Spindle motor chuck rotation
      if (currentSpindleRunning && spindleGroupRef.current) {
        const rotSpeed = (currentRpm / 60) * (Math.PI * 2) * delta;
        spindleGroupRef.current.rotation.x += rotSpeed;
      }

      // 2. Carriage & cross-slide sliding kinematics
      if (carriageRef.current && crossSlideRef.current) {
        // Carriage X moves from -0.09 (Z=10 chuck end) to 0.41 (Z=60 tailstock end)
        const carriageX = -0.09 + ((currentToolPos.z - 10.0) / 50.0) * 0.50;
        carriageRef.current.position.x = THREE.MathUtils.lerp(
          carriageRef.current.position.x,
          carriageX,
          0.16
        );

        // Cross-slide table sits at the back (positive Z), retracting away means moving further back (+Z)
        const zTarget = 0.045 + currentToolPos.x * 0.010;
        crossSlideRef.current.position.z = THREE.MathUtils.lerp(
          crossSlideRef.current.position.z,
          zTarget,
          0.16
        );
      }

      // 3. Rotating auxiliary lead screw & handwheels
      if (leadScrewRef.current && currentSpindleRunning) {
        // Rotating the physical power transmission lead screw
        leadScrewRef.current.rotation.x += (currentRpm / 60) * Math.PI * 0.3 * delta;
      }

      if (apronHwGroup) {
        // Revolving apron carriage handwheel based on coordinate positioning
        apronHwGroup.rotation.z = -currentToolPos.z * 0.28;
      }

      if (csHwGroup) {
        // Revolving cross-slide feed dial based on cross-slide depth positioning
        csHwGroup.rotation.z = -currentToolPos.x * 0.95;
      }

      // 4. Smoothly pivot physical levers on the gear shifting console
      const targetLeverAngle = currentSpindleRunning ? Math.PI / 6 : -Math.PI / 6;
      spindleLeverGroup.rotation.z = THREE.MathUtils.lerp(
        spindleLeverGroup.rotation.z,
        targetLeverAngle,
        0.15
      );

      // Shifting gears logic depending on preset RPM range values
      let l1Angle = -Math.PI / 6; // low gear (Left)
      let l2Angle = -Math.PI / 6; // low speed (Down)

      if (currentRpm === 750) {
        l1Angle = -Math.PI / 6;
        l2Angle = Math.PI / 6; // mid speed (Up)
      } else if (currentRpm === 1250) {
        l1Angle = Math.PI / 6;  // high gear (Right)
        l2Angle = -Math.PI / 6; // high speed (Down)
      } else if (currentRpm === 1800) {
        l1Angle = Math.PI / 6;
        l2Angle = Math.PI / 6;  // ultra speed (Up)
      }

      rpmLever1Group.rotation.z = THREE.MathUtils.lerp(rpmLever1Group.rotation.z, l1Angle, 0.14);
      rpmLever2Group.rotation.z = THREE.MathUtils.lerp(rpmLever2Group.rotation.z, l2Angle, 0.14);

      // 5. LED Status Lamps feedback illumination
      if (currentSpindleRunning) {
        mats.emissiveGreen.emissiveIntensity = 1.8;
        mats.emissiveRed.emissiveIntensity = 0.1;
      } else {
        mats.emissiveGreen.emissiveIntensity = 0.1;
        mats.emissiveRed.emissiveIntensity = 1.8;
      }

      // 6. Real-time Metal Removal, Sparks Color Synthesis, and smoke
      let frameIsCutting = false;
      if (currentSpindleRunning) {
        const segmentIndex = Math.floor(((currentToolPos.z - 10.0) / 50.0) * SEGMENT_COUNT);

        if (segmentIndex >= 0 && segmentIndex < SEGMENT_COUNT) {
          const toolRadiusMm = currentToolPos.x / 2.0;
          const currentStockRadiusMm = workpieceRadii.current[segmentIndex];

          if (toolRadiusMm < currentStockRadiusMm) {
            frameIsCutting = true;

            // Nose fillet trimming simulation
            const mmPerSegment = 50.0 / (SEGMENT_COUNT - 1);
            for (let offset = -2; offset <= 2; offset++) {
              const idx = segmentIndex + offset;
              if (idx >= 0 && idx < SEGMENT_COUNT) {
                const distFromCenterMm = Math.abs(offset) * mmPerSegment;
                const noseOverlap = Math.sqrt(Math.max(0, 1.44 - distFromCenterMm * distFromCenterMm));
                const targetRadiusAtIdx = toolRadiusMm + (1.2 - noseOverlap);

                if (targetRadiusAtIdx < workpieceRadii.current[idx]) {
                  workpieceRadii.current[idx] = Math.max(3.0, targetRadiusAtIdx);
                }
              }
            }

            rebuildWorkpieceGeometry();

            // Record persistent visual cut trail on the workpiece surface
            if (carriageRef.current && spindleGroupRef.current && cutTrailGeomRef.current) {
              const relWorldX = (carriageRef.current.position.x - 0.03) + 0.20;
              const cutRadiusUnits = workpieceRadii.current[segmentIndex] * 0.01;
              const spindleAngle = spindleGroupRef.current.rotation.x;

              const currentLocalPoint = new THREE.Vector3(
                relWorldX,
                cutRadiusUnits * Math.sin(spindleAngle),
                cutRadiusUnits * Math.cos(spindleAngle)
              );

              if (lastCutLocalPointRef.current) {
                const dist = lastCutLocalPointRef.current.distanceTo(currentLocalPoint);
                if (dist >= 0.0002 && dist <= 0.15) {
                  const geom = cutTrailGeomRef.current;
                  const posAttr = geom.attributes.position as THREE.BufferAttribute;
                  const colAttr = geom.attributes.color as THREE.BufferAttribute;
                  const posArray = posAttr.array as Float32Array;
                  const colArray = colAttr.array as Float32Array;

                  const vIdx = trailVertexCountRef.current;

                  if (vIdx + 2 <= MAX_TRAIL_VERTICES) {
                    posArray[vIdx * 3] = lastCutLocalPointRef.current.x;
                    posArray[vIdx * 3 + 1] = lastCutLocalPointRef.current.y;
                    posArray[vIdx * 3 + 2] = lastCutLocalPointRef.current.z;

                    posArray[(vIdx + 1) * 3] = currentLocalPoint.x;
                    posArray[(vIdx + 1) * 3 + 1] = currentLocalPoint.y;
                    posArray[(vIdx + 1) * 3 + 2] = currentLocalPoint.z;

                    const r = 0.1, g = 0.92, b = 0.98;

                    colArray[vIdx * 3] = r;
                    colArray[vIdx * 3 + 1] = g;
                    colArray[vIdx * 3 + 2] = b;

                    colArray[(vIdx + 1) * 3] = r;
                    colArray[(vIdx + 1) * 3 + 1] = g;
                    colArray[(vIdx + 1) * 3 + 2] = b;

                    trailVertexCountRef.current += 2;
                    geom.setDrawRange(0, trailVertexCountRef.current);
                    posAttr.needsUpdate = true;
                    colAttr.needsUpdate = true;

                    lastCutLocalPointRef.current.copy(currentLocalPoint);
                  }
                }
              } else {
                lastCutLocalPointRef.current = currentLocalPoint.clone();
              }
            }

            // Emit highly-realistic color synchronized metal swarf chips
            if (particlesRef.current) {
              const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
              const colors = particlesRef.current.geometry.attributes.color.array as Float32Array;

              const toolTipX = carriageRef.current.position.x - 0.03;
              const toolTipY = 0.87;
              const toolTipZ = -0.12;

              // Emit 4 new sparks/chips per frame
              for (let j = 0; j < 4; j++) {
                const pIdx = Math.floor(Math.random() * pCount);

                positions[pIdx * 3] = toolTipX + (Math.random() - 0.5) * 0.015;
                positions[pIdx * 3 + 1] = toolTipY + (Math.random() - 0.5) * 0.015;
                positions[pIdx * 3 + 2] = toolTipZ + (Math.random() - 0.5) * 0.015;

                const vx = (Math.random() - 0.35) * 0.03;
                const vy = Math.random() * 0.025 + 0.015;
                const vz = Math.random() * 0.05 + 0.015; // thrown towards positive Z (backwards)

                particleVelocities.current[pIdx].set(vx, vy, vz);
                particleAges.current[pIdx] = 1.0;

                // Color synthesis (Bright silver iron chips)
                colors[pIdx * 3] = 0.88;     // R
                colors[pIdx * 3 + 1] = 0.92; // G
                colors[pIdx * 3 + 2] = 0.98; // B
              }
            }

            // Emit slow-rising thermal oil coolant steam/smoke
            if (smokeParticlesRef.current) {
              const sPositions = smokeParticlesRef.current.geometry.attributes.position.array as Float32Array;
              const toolTipX = carriageRef.current.position.x - 0.03;
              const toolTipY = 0.87;
              const toolTipZ = -0.12;

              if (Math.random() < 0.35) {
                const sIdx = Math.floor(Math.random() * smokeCount);
                sPositions[sIdx * 3] = toolTipX + (Math.random() - 0.5) * 0.02;
                sPositions[sIdx * 3 + 1] = toolTipY + 0.01;
                sPositions[sIdx * 3 + 2] = toolTipZ + (Math.random() - 0.5) * 0.02;

                smokeVelocities.current[sIdx].set(
                  (Math.random() - 0.5) * 0.006,
                  Math.random() * 0.014 + 0.016, // rise straight up
                  (Math.random() - 0.5) * 0.006
                );
                smokeAges.current[sIdx] = 1.0;
              }
            }

            // Emit physical metallic chip debris swarf
            if (chipParticlesRef.current) {
              const positions = chipParticlesRef.current.geometry.attributes.position.array as Float32Array;
              const colors = chipParticlesRef.current.geometry.attributes.color.array as Float32Array;

              const toolTipX = carriageRef.current.position.x - 0.03;
              const toolTipY = 0.86;
              const toolTipZ = -0.10;

              const chipsToEmit = Math.floor(Math.random() * 3) + 2;
              for (let c = 0; c < chipsToEmit; c++) {
                let cIdx = chipAges.current.findIndex((age) => age <= 0);
                if (cIdx === -1) {
                  cIdx = Math.floor(Math.random() * 180);
                }

                positions[cIdx * 3] = toolTipX + (Math.random() - 0.5) * 0.015;
                positions[cIdx * 3 + 1] = toolTipY + (Math.random() - 0.5) * 0.015;
                positions[cIdx * 3 + 2] = toolTipZ + (Math.random() - 0.5) * 0.015;

                const vx = (Math.random() - 0.5) * 0.028;
                const vy = Math.random() * 0.025 + 0.012;
                const vz = Math.random() * 0.035 + 0.015;

                chipVelocities.current[cIdx].set(vx, vy, vz);
                chipAges.current[cIdx] = 1.0;
                chipSettled.current[cIdx] = false;

                // Bright metallic silver cast iron swarf chips
                colors[cIdx * 3] = 0.75 + Math.random() * 0.20;
                colors[cIdx * 3 + 1] = 0.80 + Math.random() * 0.18;
                colors[cIdx * 3 + 2] = 0.90 + Math.random() * 0.10;
              }
            }
          } else {
            lastCutLocalPointRef.current = null;
          }
        } else {
          lastCutLocalPointRef.current = null;
        }
      } else {
        lastCutLocalPointRef.current = null;
      }

      setIsCuttingState(frameIsCutting);

      // Throttled update for UI cut trail counter
      if (now - lastTrailUpdateRef.current > 200) {
        lastTrailUpdateRef.current = now;
        setTrailPassesCount(Math.floor(trailVertexCountRef.current / 2));
      }

      // Active cutting audio volume scaling
      if (audioEnabledRef.current && cuttingGainRef.current && audioCtxRef.current) {
        const speedMultiplier = 0.18 + (currentRpm / 2200) * 0.35;
        cuttingGainRef.current.gain.setTargetAtTime(
          frameIsCutting ? speedMultiplier : 0,
          audioCtxRef.current.currentTime,
          0.05
        );
      }

      // Update Swarf physical gravity & lifespans
      if (particlesRef.current) {
        const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < pCount; i++) {
          if (particleAges.current[i] > 0) {
            positions[i * 3] += particleVelocities.current[i].x;
            positions[i * 3 + 1] += particleVelocities.current[i].y;
            positions[i * 3 + 2] += particleVelocities.current[i].z;

            // Apply gravity pulling downward
            particleVelocities.current[i].y -= 0.0016;
            particleAges.current[i] -= delta * 1.5;

            // Expire if hits bed / tray
            if (positions[i * 3 + 1] < 0.12 || particleAges.current[i] <= 0) {
              particleAges.current[i] = 0;
              positions[i * 3 + 1] = -100;
            }
          }
        }
        particlesRef.current.geometry.attributes.position.needsUpdate = true;
        particlesRef.current.geometry.attributes.color.needsUpdate = true;
      }

      // Update Vapor Steam drift & fading
      if (smokeParticlesRef.current) {
        const sPositions = smokeParticlesRef.current.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < smokeCount; i++) {
          if (smokeAges.current[i] > 0) {
            sPositions[i * 3] += smokeVelocities.current[i].x;
            sPositions[i * 3 + 1] += smokeVelocities.current[i].y;
            sPositions[i * 3 + 2] += smokeVelocities.current[i].z;

            smokeAges.current[i] -= delta * 1.0;

            if (smokeAges.current[i] <= 0) {
              smokeAges.current[i] = 0;
              sPositions[i * 3 + 1] = -100;
            }
          }
        }
        smokeParticlesRef.current.geometry.attributes.position.needsUpdate = true;
      }

      // Update Physical Metallic Chip Debris Physics
      if (chipParticlesRef.current) {
        const positions = chipParticlesRef.current.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < 180; i++) {
          if (chipAges.current[i] > 0) {
            if (!chipSettled.current[i]) {
              positions[i * 3] += chipVelocities.current[i].x;
              positions[i * 3 + 1] += chipVelocities.current[i].y;
              positions[i * 3 + 2] += chipVelocities.current[i].z;

              // Apply gravity
              chipVelocities.current[i].y -= 0.0022;

              // Apply air drag resistance
              chipVelocities.current[i].x *= 0.985;
              chipVelocities.current[i].z *= 0.985;

              // Settle on lathe bed chip tray floor (y ≈ 0.14)
              if (positions[i * 3 + 1] <= 0.14) {
                if (chipVelocities.current[i].y < -0.012) {
                  // Metallic bounce
                  chipVelocities.current[i].y = -chipVelocities.current[i].y * 0.28;
                  chipVelocities.current[i].x *= 0.6;
                  chipVelocities.current[i].z *= 0.6;
                } else {
                  positions[i * 3 + 1] = 0.14;
                  chipSettled.current[i] = true;
                }
              }
            } else {
              // Settled chip resting on bed tray accumulates and slowly fades out
              chipAges.current[i] -= delta * 0.35;
              if (chipAges.current[i] <= 0) {
                chipAges.current[i] = 0;
                positions[i * 3 + 1] = -100;
              }
            }
          }
        }
        chipParticlesRef.current.geometry.attributes.position.needsUpdate = true;
        chipParticlesRef.current.geometry.attributes.color.needsUpdate = true;
      }

      // 7. Dynamic Camera smooth tracking transitions
      if (cameraTransitionRef.current.active) {
        const elapsed = now - cameraTransitionRef.current.startTime;
        const progress = Math.min(1, elapsed / cameraTransitionRef.current.duration);
        const t = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        camera.position.lerpVectors(
          cameraTransitionRef.current.startCam,
          cameraTransitionRef.current.endCam,
          t
        );
        controls.target.lerpVectors(
          cameraTransitionRef.current.startTarget,
          cameraTransitionRef.current.endTarget,
          t
        );

        if (progress >= 1) {
          cameraTransitionRef.current.active = false;
        }
      }

      // 8. Calculate 3D Hotspot screen projections using real-time mesh world positions
      if (now - lastHotspotUpdateRef.current > 30 && containerRef.current && sceneRef.current) {
        lastHotspotUpdateRef.current = now;
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        const projVec = new THREE.Vector3();
        const worldPos = new THREE.Vector3();
        const nextCoords: Record<string, { x: number; y: number; visible: boolean }> = {};

        const partMeshMap: Record<string, THREE.Object3D | null | undefined> = {
          workpiece: workpieceMesh,
          headstock: headstock,
          toolpost: tpBlock,
          compoundrest: compBody,
          crossslide: csTable,
          carriage: saddle,
          bedways: bedMesh,
          tailstock: tsCasting,
          footbrake: sceneRef.current.getObjectByName('footBrakePedal'),
        };

        Object.entries(ANATOMY_PARTS).forEach(([key, part]) => {
          const meshObj = partMeshMap[key];
          if (meshObj) {
            meshObj.getWorldPosition(worldPos);

            // Apply fine-tuned offsets relative to each component's actual geometric surface
            if (key === 'workpiece') {
              worldPos.x += 0.20;
              worldPos.y += 0.05;
            } else if (key === 'headstock') {
              worldPos.x -= 0.05;
              worldPos.y += 0.12;
              worldPos.z += 0.25;
            } else if (key === 'toolpost') {
              worldPos.y += 0.04;
            } else if (key === 'compoundrest') {
              worldPos.y += 0.02;
              worldPos.z += 0.08;
            } else if (key === 'crossslide') {
              worldPos.y += 0.02;
              worldPos.z += 0.18;
            } else if (key === 'carriage') {
              worldPos.x -= 0.12;
              worldPos.y -= 0.14;
              worldPos.z += 0.38;
            } else if (key === 'bedways') {
              worldPos.set(1.2, 0.61, 0.28);
            } else if (key === 'tailstock') {
              worldPos.y += 0.08;
              worldPos.x += 0.05;
            } else if (key === 'footbrake') {
              worldPos.set(0.8, -0.65, 0.52);
            }
            projVec.copy(worldPos);
          } else {
            projVec.set(part.targetPos.x, part.targetPos.y + 0.1, part.targetPos.z);
          }

          projVec.project(camera);

          const isBehind = projVec.z > 1.0;
          const sx = ((projVec.x + 1) * width) / 2;
          const sy = ((-projVec.y + 1) * height) / 2;

          const inBounds = sx >= 20 && sx <= width - 20 && sy >= 20 && sy <= height - 20;

          nextCoords[key] = {
            x: sx,
            y: sy,
            visible: !isBehind && inBounds
          };
        });

        setHotspotCoords(nextCoords);
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // Handle container resize
    const resizeObserver = new ResizeObserver(() => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      cameraRef.current.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(
        containerRef.current.clientWidth,
        containerRef.current.clientHeight
      );
    });
    resizeObserver.observe(containerRef.current);

    // Cleanup resources on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      if (rendererRef.current) {
        rendererRef.current.domElement.removeEventListener('pointerdown', handlePointerDown);
        rendererRef.current.domElement.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
        rendererRef.current.dispose();
      }
      
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          if (object.geometry) object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach((mat) => mat.dispose());
          } else if (object.material) {
            object.material.dispose();
          }
        }
      });
    };
  }, []); // Rebuild tree ONLY once to preserve camera orientation and enable high-fidelity 60 FPS transitions

  return (
    <div ref={containerRef} className="relative flex-1 w-full h-full bg-slate-950 overflow-hidden select-none touch-none">
      {/* Three.js Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-grab active:cursor-grabbing outline-none touch-none"
      />

      {/* Top Left Toolbar Controls */}
      <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-20 flex items-center gap-1.5 sm:gap-2 flex-wrap max-w-[calc(100%-13rem)] sm:max-w-[calc(100%-18rem)]">
        {isCuttingState && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1.5 rounded-xl text-xs font-semibold backdrop-blur-md flex items-center gap-2 select-none animate-pulse shadow-lg">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
            <span>SHAVING IN PROGRESS</span>
          </div>
        )}

        {/* 3D Hotspots Toggle Button */}
        <button
          onClick={() => setShowHotspots((prev) => !prev)}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border backdrop-blur-md flex items-center gap-2 transition-all cursor-pointer shadow-lg ${
            showHotspots
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
              : 'bg-slate-900/80 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
          }`}
        >
          {showHotspots ? (
            <>
              <Eye className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>3D Hotspots: ON</span>
            </>
          ) : (
            <>
              <EyeOff className="w-3.5 h-3.5 text-slate-400" />
              <span>3D Hotspots: OFF</span>
            </>
          )}
        </button>

        {/* Cut Trail Visual Badge */}
        <div className="bg-slate-900/85 border border-cyan-500/30 text-cyan-300 px-3 py-1.5 rounded-xl text-xs font-mono font-medium backdrop-blur-md flex items-center gap-2 select-none shadow-lg">
          <span className={`w-2 h-2 rounded-full ${isCuttingState ? 'bg-cyan-400 animate-ping' : trailPassesCount > 0 ? 'bg-cyan-400' : 'bg-slate-600'}`} />
          <span>CUT TRAIL: {trailPassesCount > 0 ? `${trailPassesCount} SEGMENTS` : 'READY'}</span>
        </div>
      </div>

      {/* 3D Projected Hotspot Buttons Layer */}
      {showHotspots && (
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
          {Object.entries(ANATOMY_PARTS).map(([key, part]) => {
            const coords = hotspotCoords[key];
            if (!coords || !coords.visible) return null;

            const isSelected = key === selectedPartKey;
            const shortCode = PART_SHORT_CODES[key] || 'PT';

            return (
              <div
                key={key}
                style={{
                  left: `${coords.x}px`,
                  top: `${coords.y}px`,
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto transition-transform duration-150"
              >
                <button
                  id={`hotspot-btn-${key}`}
                  onClick={() => setSelectedPartKey(key)}
                  className={`group relative flex items-center justify-center rounded-full transition-all duration-300 cursor-pointer ${
                    isSelected
                      ? 'w-10 h-10 bg-emerald-500 text-slate-950 font-black ring-4 ring-emerald-400/60 shadow-xl shadow-emerald-500/50 scale-125 z-30'
                      : 'w-8 h-8 bg-slate-900/90 text-cyan-300 font-bold border border-cyan-400/50 hover:border-emerald-400 hover:text-emerald-300 hover:scale-110 z-20 shadow-md backdrop-blur-md'
                  }`}
                  title={part.title}
                >
                  {/* Outer Pulsing Ping Ring */}
                  <span
                    className={`absolute -inset-2 rounded-full pointer-events-none transition-all ${
                      isSelected
                        ? 'bg-emerald-400/40 animate-ping ring-2 ring-emerald-400'
                        : 'bg-cyan-400/25 group-hover:bg-emerald-400/35 animate-pulse'
                    }`}
                  />

                  {/* Inner Short Badge Code */}
                  <span className="text-[11px] tracking-tight relative z-10 select-none">
                    {shortCode}
                  </span>

                  {/* Floating Part Title Tag Badge */}
                  <div
                    className={`absolute left-full ml-2.5 px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap backdrop-blur-md border transition-all duration-200 pointer-events-none shadow-xl ${
                      isSelected
                        ? 'opacity-100 bg-slate-900/95 border-emerald-500/60 text-emerald-300 translate-x-0'
                        : 'opacity-0 group-hover:opacity-100 bg-slate-900/90 border-cyan-500/40 text-cyan-200 -translate-x-1'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-emerald-400 animate-ping' : 'bg-cyan-400'}`} />
                      <span>{part.title}</span>
                    </div>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
