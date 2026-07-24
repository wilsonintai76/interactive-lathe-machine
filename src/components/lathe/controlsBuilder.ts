import * as THREE from 'three';
import { LatheMaterials } from '../LatheMaterials';
import {
  createSelectorLever,
  createPushButton,
  createEmergencyStopButton,
  createPilotLight,
} from './controlComponents';

export interface ControlsBuildResult {
  spindleLever: THREE.Group;
  rpmLever1: THREE.Group;
  rpmLever2: THREE.Group;
}

export function buildControls(scene: THREE.Scene, mats: LatheMaterials): ControlsBuildResult {
  // Front faceplate plane of headstock control panel is at Z = 0.295 in world coordinates
  const PANEL_Z = 0.295;

  // A. Main Spindle Engagement Clutch / Direction Lever
  const spindleLeverGroup = createSelectorLever(mats, {
    pivotRadius: 0.038,
    shaftLength: 0.18,
    knobRadius: 0.026,
    knobMaterial: mats.plasticRed,
    hasDialPlate: true,
  });
  spindleLeverGroup.position.set(-0.42, 0.65, PANEL_Z);
  spindleLeverGroup.name = 'spindleLever';
  scene.add(spindleLeverGroup);

  // B. RPM Gear Shift Selector Lever 1 (Low/High Range)
  const rpmLever1Group = createSelectorLever(mats, {
    pivotRadius: 0.032,
    shaftLength: 0.14,
    knobRadius: 0.022,
    knobMaterial: mats.rubber,
    hasDialPlate: true,
  });
  rpmLever1Group.position.set(-0.76, 0.98, PANEL_Z);
  rpmLever1Group.name = 'rpmLever1';
  scene.add(rpmLever1Group);

  // C. RPM Gear Shift Selector Lever 2 (Speed Ratio)
  const rpmLever2Group = createSelectorLever(mats, {
    pivotRadius: 0.032,
    shaftLength: 0.14,
    knobRadius: 0.022,
    knobMaterial: mats.rubber,
    hasDialPlate: true,
  });
  rpmLever2Group.position.set(-0.56, 0.98, PANEL_Z);
  rpmLever2Group.name = 'rpmLever2';
  scene.add(rpmLever2Group);

  // D. Electrical Power & Status Indicator Console
  const consoleGroup = new THREE.Group();
  consoleGroup.position.set(-0.82, 0.72, PANEL_Z);

  // Console housing faceplate
  const consoleFace = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.28, 0.012), mats.darkIron);
  consoleFace.position.set(0, 0, 0.006);
  consoleGroup.add(consoleFace);

  // Console chrome border rim
  const consoleRim = new THREE.Mesh(
    new THREE.BoxGeometry(0.25, 0.29, 0.006),
    mats.brightSteel
  );
  consoleRim.position.set(0, 0, 0.003);
  consoleGroup.add(consoleRim);

  // 1. Top Row: Pilot Light Indicator Lamps
  const runLED = createPilotLight(mats, { radius: 0.016, lensMaterial: mats.emissiveGreen });
  runLED.position.set(-0.06, 0.08, 0.012);
  consoleGroup.add(runLED);

  const stopLED = createPilotLight(mats, { radius: 0.016, lensMaterial: mats.emissiveRed });
  stopLED.position.set(0.06, 0.08, 0.012);
  consoleGroup.add(stopLED);

  // 2. Middle Row: Start & Stop Push Buttons
  const startBtn = createPushButton(mats, {
    bezelRadius: 0.022,
    buttonRadius: 0.016,
    buttonMaterial: mats.emissiveGreen,
  });
  startBtn.position.set(-0.06, 0.01, 0.012);
  consoleGroup.add(startBtn);

  const stopBtn = createPushButton(mats, {
    bezelRadius: 0.022,
    buttonRadius: 0.016,
    buttonMaterial: mats.emissiveRed,
  });
  stopBtn.position.set(0.06, 0.01, 0.012);
  consoleGroup.add(stopBtn);

  // 3. Bottom Row: Auxiliary JOG Button
  const jogBtn = createPushButton(mats, {
    bezelRadius: 0.018,
    buttonRadius: 0.013,
    buttonMaterial: mats.steel,
  });
  jogBtn.position.set(0, -0.07, 0.012);
  consoleGroup.add(jogBtn);

  scene.add(consoleGroup);

  // E. Prominent Industrial Emergency Stop Mushroom Button
  const eStopGroup = createEmergencyStopButton(mats, {
    plateRadius: 0.065,
    mushroomRadius: 0.048,
  });
  eStopGroup.position.set(-0.42, 0.92, PANEL_Z);
  scene.add(eStopGroup);

  // F. Engraved Speed & Feed Chart Plate
  const chartPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.48, 0.12, 0.006),
    mats.brightSteel
  );
  chartPlate.position.set(-0.66, 1.15, PANEL_Z + 0.003);
  scene.add(chartPlate);

  const chartInner = new THREE.Mesh(
    new THREE.BoxGeometry(0.46, 0.10, 0.002),
    mats.darkIron
  );
  chartInner.position.set(-0.66, 1.15, PANEL_Z + 0.007);
  scene.add(chartInner);

  return {
    spindleLever: spindleLeverGroup,
    rpmLever1: rpmLever1Group,
    rpmLever2: rpmLever2Group,
  };
}

