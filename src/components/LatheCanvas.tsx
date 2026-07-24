import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ToolPosition, WorkpieceMaterial, AppMode } from '../types';
import { ANATOMY_PARTS } from '../data/anatomy';
import { createMaterials, LatheMaterials } from './LatheMaterials';
import { buildLatheScene } from './LatheModelBuilder';

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

  // Deformable geometry state
  // Workpiece coordinates in mm: spans from Z = 10 to Z = 60 (50mm length).
  // Initial radius is 7.5 mm (15mm diameter).
  const workpieceRadii = useRef<number[]>(new Array(SEGMENT_COUNT).fill(7.5));

  // Audio nodes refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const motorNodeRef = useRef<OscillatorNode | null>(null);
  const noiseNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const cuttingGainRef = useRef<GainNode | null>(null);

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

  // Update workpiece geometry from radii ref
  const rebuildWorkpieceGeometry = () => {
    if (!workpieceMeshRef.current || !materialsRef.current) return;

    // Build the lathe profile points (Vector2 coordinates: X is radius, Y is position along spindle length)
    // Scale: 7.5mm radius maps to 0.075 units. So 1mm = 0.01 units.
    const points: THREE.Vector2[] = [];

    // Let's create a beautiful profile from left to right.
    // Left starts at chuck side.
    const mmPerSegment = 50.0 / (SEGMENT_COUNT - 1);

    for (let i = 0; i < SEGMENT_COUNT; i++) {
      const radiusMm = workpieceRadii.current[i];
      const radiusUnits = radiusMm * 0.01;
      const lengthUnits = i * mmPerSegment * 0.01 + 0.08; // Offset of 0.08 from chuck face (chuck thickness is 0.16)

      points.push(new THREE.Vector2(radiusUnits, lengthUnits));
    }

    // Build new LatheGeometry
    // We specify 32 radial segments for a clean, round cylinder
    const newGeom = new THREE.LatheGeometry(points, 32);

    // LatheGeometry revolves around the Y axis and goes from Y = 0 to Y = length.
    // We want the workpiece aligned with the X axis (spindle line).
    // Let's rotate the geometry so it lies along the positive X axis.
    newGeom.rotateZ(-Math.PI / 2);

    // Replace geometry
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
    if (!workpieceMeshRef.current || !materialsRef.current) return;
    let mat = materialsRef.current.brass;
    if (material === 'aluminum') mat = materialsRef.current.aluminum;
    if (material === 'steel') mat = materialsRef.current.steel;
    workpieceMeshRef.current.material = mat;
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

      // 1. Spindle Motor Hum (Oscillator)
      const motorOsc = ctx.createOscillator();
      motorOsc.type = 'sawtooth';
      // Low motor frequency
      motorOsc.frequency.value = 40 + (rpm / 2200) * 30;

      const motorGain = ctx.createGain();
      motorGain.gain.value = 0.04;

      // Filter to make it a deep, heavy hum
      const motorFilter = ctx.createBiquadFilter();
      motorFilter.type = 'lowpass';
      motorFilter.frequency.value = 150;

      motorOsc.connect(motorFilter);
      motorFilter.connect(motorGain);
      motorGain.connect(ctx.destination);
      motorOsc.start();
      motorNodeRef.current = motorOsc;

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
      filter.frequency.value = 1300;
      filter.Q.value = 2.0;

      const cutGain = ctx.createGain();
      cutGain.gain.value = 0;

      noiseSource.connect(filter);
      filter.connect(cutGain);
      cutGain.connect(ctx.destination);
      noiseSource.start();

      noiseNodeRef.current = noiseSource;
      cuttingGainRef.current = cutGain;
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

  // Handle motor RPM changes in sound synthesizer
  useEffect(() => {
    if (audioEnabled && motorNodeRef.current && audioCtxRef.current) {
      const targetFreq = 40 + (rpm / 2200) * 40;
      motorNodeRef.current.frequency.setTargetAtTime(targetFreq, audioCtxRef.current.currentTime, 0.1);
    }
  }, [rpm, audioEnabled]);

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
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const now = performance.now();

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

                    let r = 0.0, g = 0.95, b = 1.0;
                    if (currentMaterial === 'brass') {
                      r = 0.0; g = 0.95; b = 0.85;
                    } else if (currentMaterial === 'aluminum') {
                      r = 0.1; g = 0.82; b = 1.0;
                    } else {
                      r = 1.0; g = 0.55; b = 0.12;
                    }

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

                let vx = (Math.random() - 0.35) * 0.03;
                let vy = Math.random() * 0.025 + 0.015;
                let vz = Math.random() * 0.05 + 0.015; // thrown towards positive Z (backwards)

                if (currentMaterial === 'steel') {
                  vx = (Math.random() - 0.3) * 0.04;
                  vy = Math.random() * 0.035 + 0.02;
                  vz = Math.random() * 0.08 + 0.02;
                } else if (currentMaterial === 'aluminum') {
                  vx = (Math.random() - 0.4) * 0.015;
                  vy = Math.random() * 0.012 + 0.01;
                  vz = Math.random() * 0.03 + 0.01;
                }

                particleVelocities.current[pIdx].set(vx, vy, vz);
                particleAges.current[pIdx] = 1.0;

                // Color synthesis
                if (currentMaterial === 'brass') {
                  colors[pIdx * 3] = 0.95;     // R
                  colors[pIdx * 3 + 1] = 0.70; // G
                  colors[pIdx * 3 + 2] = 0.15; // B
                } else if (currentMaterial === 'aluminum') {
                  colors[pIdx * 3] = 0.90;     // R
                  colors[pIdx * 3 + 1] = 0.92; // G
                  colors[pIdx * 3 + 2] = 0.98; // B
                } else {
                  colors[pIdx * 3] = 1.0;      // R (Orange-hot glow)
                  colors[pIdx * 3 + 1] = 0.38; // G
                  colors[pIdx * 3 + 2] = 0.06; // B
                }
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
        const speedMultiplier = 0.05 + (currentRpm / 2200) * 0.12;
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
    <div ref={containerRef} className="relative flex-1 w-full h-full bg-slate-950 overflow-hidden">
      {/* Three.js Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-grab active:cursor-grabbing outline-none"
      />

      {/* Sparks warning for high visual fidelity */}
      {isCuttingState && (
        <div className="absolute top-4 left-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-md flex items-center gap-2 select-none animate-pulse">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
          <span>SHAVING IN PROGRESS</span>
        </div>
      )}

      {/* Cut Trail Visual Badge */}
      <div className="absolute top-4 right-4 bg-slate-900/85 border border-cyan-500/30 text-cyan-300 px-3 py-1.5 rounded-xl text-xs font-mono font-medium backdrop-blur-md flex items-center gap-2 select-none shadow-lg">
        <span className={`w-2 h-2 rounded-full ${isCuttingState ? 'bg-cyan-400 animate-ping' : trailPassesCount > 0 ? 'bg-cyan-400' : 'bg-slate-600'}`} />
        <span>CUT TRAIL: {trailPassesCount > 0 ? `${trailPassesCount} SEGMENTS` : 'READY'}</span>
      </div>
    </div>
  );
}
