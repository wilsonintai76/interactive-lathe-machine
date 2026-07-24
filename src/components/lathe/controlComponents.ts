import * as THREE from 'three';
import { LatheMaterials } from '../LatheMaterials';

/**
 * Modular 3D Lathe Control Components
 * Refactored modular builders for realistic machine controls, selector levers,
 * push buttons, pilot lights, and emergency stop assemblies.
 */

export interface SelectorLeverConfig {
  pivotRadius?: number;
  pivotDepth?: number;
  shaftLength?: number;
  shaftRadius?: number;
  knobRadius?: number;
  knobMaterial?: THREE.Material;
  hasDialPlate?: boolean;
}

/**
 * Creates a high-detail selector lever assembly with mounting hub,
 * index dial plate, polished shank, and molded grip handle knob.
 */
export function createSelectorLever(
  mats: LatheMaterials,
  config: SelectorLeverConfig = {}
): THREE.Group {
  const group = new THREE.Group();

  const pivotRadius = config.pivotRadius ?? 0.032;
  const pivotDepth = config.pivotDepth ?? 0.020;
  const shaftLength = config.shaftLength ?? 0.16;
  const shaftRadius = config.shaftRadius ?? 0.008;
  const knobRadius = config.knobRadius ?? 0.022;
  const knobMat = config.knobMaterial ?? mats.rubber;
  const hasDialPlate = config.hasDialPlate ?? true;

  // A. Optional Backing Dial Plate with speed/position tick marks
  if (hasDialPlate) {
    const dialGeom = new THREE.CylinderGeometry(pivotRadius * 1.5, pivotRadius * 1.5, 0.004, 32);
    dialGeom.rotateX(Math.PI / 2);
    const dialPlate = new THREE.Mesh(dialGeom, mats.brightSteel);
    dialPlate.position.set(0, 0, 0.002);
    group.add(dialPlate);

    // Etched position indicator ring
    const ringGeom = new THREE.RingGeometry(pivotRadius * 1.1, pivotRadius * 1.4, 24);
    const ringMesh = new THREE.Mesh(ringGeom, mats.darkIron);
    ringMesh.position.set(0, 0, 0.005);
    group.add(ringMesh);
  }

  // B. Chrome Mounting Socket / Pivot Hub
  const hubOuterGeom = new THREE.CylinderGeometry(pivotRadius, pivotRadius, pivotDepth, 24);
  hubOuterGeom.rotateX(Math.PI / 2);
  const hubOuter = new THREE.Mesh(hubOuterGeom, mats.brightSteel);
  hubOuter.position.set(0, 0, pivotDepth / 2 + 0.004);
  group.add(hubOuter);

  // Center recessed locking nut / cap
  const nutGeom = new THREE.CylinderGeometry(pivotRadius * 0.5, pivotRadius * 0.5, pivotDepth + 0.006, 16);
  nutGeom.rotateX(Math.PI / 2);
  const hubNut = new THREE.Mesh(nutGeom, mats.darkIron);
  hubNut.position.set(0, 0, pivotDepth / 2 + 0.005);
  group.add(hubNut);

  // Position pointer index mark on hub rim
  const pointerGeom = new THREE.BoxGeometry(0.006, 0.014, 0.008);
  const pointer = new THREE.Mesh(pointerGeom, mats.emissiveRed);
  pointer.position.set(0, pivotRadius * 0.8, pivotDepth + 0.003);
  group.add(pointer);

  // C. Lever Shank (Extending along local Y axis so Z rotation rotates smoothly)
  const shaftGeom = new THREE.CylinderGeometry(shaftRadius, shaftRadius * 0.85, shaftLength, 16);
  // Shift shank geometry so pivot is at (0, 0, 0)
  shaftGeom.translate(0, shaftLength / 2, 0);
  const shaftMesh = new THREE.Mesh(shaftGeom, mats.brightSteel);
  // Position shank forward in front of the hub face
  shaftMesh.position.set(0, 0, pivotDepth + 0.008);
  group.add(shaftMesh);

  // D. Ergonomic Handle Grip Knob at end of shank
  const knobGeom = new THREE.SphereGeometry(knobRadius, 20, 20);
  // Flatten slightly into teardrop/oval grip shape
  knobGeom.scale(1.0, 1.25, 0.95);
  const knobMesh = new THREE.Mesh(knobGeom, knobMat);
  knobMesh.position.set(0, shaftLength, pivotDepth + 0.008);
  group.add(knobMesh);

  return group;
}

export interface PushButtonConfig {
  bezelRadius?: number;
  bezelDepth?: number;
  buttonRadius?: number;
  buttonMaterial?: THREE.Material;
  labelRing?: boolean;
}

/**
 * Creates an industrial round push button with metallic protective collar,
 * bevelled bezel ring, and protruding tactile button cap.
 */
export function createPushButton(
  mats: LatheMaterials,
  config: PushButtonConfig = {}
): THREE.Group {
  const group = new THREE.Group();

  const bezelRadius = config.bezelRadius ?? 0.022;
  const bezelDepth = config.bezelDepth ?? 0.016;
  const buttonRadius = config.buttonRadius ?? 0.015;
  const buttonMat = config.buttonMaterial ?? mats.emissiveGreen;

  // A. Outer Mounting Bezel Collar
  const bezelGeom = new THREE.CylinderGeometry(bezelRadius, bezelRadius * 1.05, bezelDepth, 24);
  bezelGeom.rotateX(Math.PI / 2);
  const bezelMesh = new THREE.Mesh(bezelGeom, mats.brightSteel);
  bezelMesh.position.set(0, 0, bezelDepth / 2);
  group.add(bezelMesh);

  // B. Recessed Guard Collar Ring
  const guardGeom = new THREE.CylinderGeometry(buttonRadius * 1.15, buttonRadius * 1.15, bezelDepth + 0.004, 24);
  guardGeom.rotateX(Math.PI / 2);
  const guardMesh = new THREE.Mesh(guardGeom, mats.darkIron);
  guardMesh.position.set(0, 0, (bezelDepth + 0.004) / 2);
  group.add(guardMesh);

  // C. Protruding Tactile Button Cap
  const btnGeom = new THREE.CylinderGeometry(buttonRadius, buttonRadius, bezelDepth + 0.010, 24);
  btnGeom.rotateX(Math.PI / 2);
  const btnMesh = new THREE.Mesh(btnGeom, buttonMat);
  btnMesh.position.set(0, 0, (bezelDepth + 0.010) / 2 + 0.002);
  group.add(btnMesh);

  // Cap chamfer top dome
  const capDomeGeom = new THREE.SphereGeometry(buttonRadius, 16, 12, 0, Math.PI * 2, 0, Math.PI / 3);
  capDomeGeom.rotateX(-Math.PI / 2);
  const capDome = new THREE.Mesh(capDomeGeom, buttonMat);
  capDome.position.set(0, 0, bezelDepth + 0.006);
  group.add(capDome);

  return group;
}

export interface EmergencyStopConfig {
  plateRadius?: number;
  mushroomRadius?: number;
}

/**
 * Creates an authentic industrial Emergency Stop Mushroom Button
 * complete with bright yellow circular legend backplate, heavy black collar,
 * and prominent red mushroom cap.
 */
export function createEmergencyStopButton(
  mats: LatheMaterials,
  config: EmergencyStopConfig = {}
): THREE.Group {
  const group = new THREE.Group();

  const plateRadius = config.plateRadius ?? 0.065;
  const mushroomRadius = config.mushroomRadius ?? 0.048;

  // A. Yellow Legend Backplate Disc
  const plateGeom = new THREE.CylinderGeometry(plateRadius, plateRadius, 0.006, 32);
  plateGeom.rotateX(Math.PI / 2);
  const plateMesh = new THREE.Mesh(plateGeom, mats.emissiveYellow);
  plateMesh.position.set(0, 0, 0.003);
  group.add(plateMesh);

  // Black outer rim on yellow plate
  const rimGeom = new THREE.TorusGeometry(plateRadius * 0.96, 0.003, 12, 32);
  const rimMesh = new THREE.Mesh(rimGeom, mats.darkIron);
  rimMesh.position.set(0, 0, 0.006);
  group.add(rimMesh);

  // B. Black Housing Switch Neck
  const neckGeom = new THREE.CylinderGeometry(mushroomRadius * 0.55, mushroomRadius * 0.60, 0.025, 24);
  neckGeom.rotateX(Math.PI / 2);
  const neckMesh = new THREE.Mesh(neckGeom, mats.darkIron);
  neckMesh.position.set(0, 0, 0.015);
  group.add(neckMesh);

  // Metallic collar ring under mushroom head
  const collarGeom = new THREE.CylinderGeometry(mushroomRadius * 0.62, mushroomRadius * 0.62, 0.008, 24);
  collarGeom.rotateX(Math.PI / 2);
  const collarMesh = new THREE.Mesh(collarGeom, mats.brightSteel);
  collarMesh.position.set(0, 0, 0.026);
  group.add(collarMesh);

  // C. Red Mushroom Cap Assembly
  const mushroomGroup = new THREE.Group();
  mushroomGroup.position.set(0, 0, 0.030);

  // Mushroom underside chamfer body
  const capBodyGeom = new THREE.CylinderGeometry(mushroomRadius, mushroomRadius * 0.65, 0.022, 32);
  capBodyGeom.rotateX(Math.PI / 2);
  const capBody = new THREE.Mesh(capBodyGeom, mats.plasticRed);
  capBody.position.set(0, 0, 0.011);
  mushroomGroup.add(capBody);

  // Mushroom top domed crown
  const crownGeom = new THREE.SphereGeometry(mushroomRadius, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2.2);
  crownGeom.rotateX(-Math.PI / 2);
  const crownMesh = new THREE.Mesh(crownGeom, mats.plasticRed);
  crownMesh.position.set(0, 0, 0.018);
  mushroomGroup.add(crownMesh);

  // Rotational Reset Arrows embossed on mushroom top
  for (let i = 0; i < 3; i++) {
    const angle = (i * Math.PI * 2) / 3;
    const arrowGeom = new THREE.BoxGeometry(0.008, 0.003, 0.003);
    const arrowMesh = new THREE.Mesh(arrowGeom, mats.paint);
    arrowMesh.position.set(Math.cos(angle) * mushroomRadius * 0.5, Math.sin(angle) * mushroomRadius * 0.5, 0.028);
    arrowMesh.rotation.z = angle + Math.PI / 2;
    mushroomGroup.add(arrowMesh);
  }

  group.add(mushroomGroup);

  return group;
}

export interface PilotLightConfig {
  radius?: number;
  lensMaterial?: THREE.Material;
}

/**
 * Creates a recessed industrial pilot light / LED indicator lamp.
 */
export function createPilotLight(
  mats: LatheMaterials,
  config: PilotLightConfig = {}
): THREE.Group {
  const group = new THREE.Group();

  const radius = config.radius ?? 0.018;
  const lensMat = config.lensMaterial ?? mats.emissiveGreen;

  // Chrome Bezel
  const bezelGeom = new THREE.CylinderGeometry(radius * 1.2, radius * 1.2, 0.012, 20);
  bezelGeom.rotateX(Math.PI / 2);
  const bezelMesh = new THREE.Mesh(bezelGeom, mats.brightSteel);
  bezelMesh.position.set(0, 0, 0.006);
  group.add(bezelMesh);

  // Domed Lens
  const lensGeom = new THREE.SphereGeometry(radius, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
  lensGeom.rotateX(-Math.PI / 2);
  const lensMesh = new THREE.Mesh(lensGeom, lensMat);
  lensMesh.position.set(0, 0, 0.008);
  group.add(lensMesh);

  return group;
}
