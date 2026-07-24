import * as THREE from 'three';
import { LatheMaterials } from '../LatheMaterials';

export interface HeadstockBuildResult {
  headstock: THREE.Mesh;
  spindleGroup: THREE.Group;
  workpieceMesh: THREE.Mesh;
}

export function buildHeadstock(
  scene: THREE.Scene,
  mats: LatheMaterials,
  defaultPoints: THREE.Vector2[]
): HeadstockBuildResult {
  // Gearbox & Headstock Main Cabinet
  const headGeom = new THREE.BoxGeometry(0.76, 0.96, 0.80);
  const headstock = new THREE.Mesh(headGeom, mats.paint);
  headstock.position.set(-0.65, 0.84, -0.12);
  scene.add(headstock);

  // Front Control Panel
  const panelGeom = new THREE.BoxGeometry(0.68, 0.82, 0.02);
  const controlPanel = new THREE.Mesh(panelGeom, mats.darkIron);
  controlPanel.position.set(0.0, 0.0, 0.405);
  headstock.add(controlPanel);

  // Spindle & Rotary Chuck Assembly (Centerline Y = 0.87)
  const spindleGroup = new THREE.Group();
  spindleGroup.position.set(-0.20, 0.87, -0.12);

  // Spindle backing collar / adapter plate
  const spindleCollarGeom = new THREE.CylinderGeometry(0.14, 0.16, 0.07, 32);
  const spindleCollar = new THREE.Mesh(spindleCollarGeom, mats.darkIron);
  spindleCollar.rotation.z = Math.PI / 2;
  spindleCollar.position.set(-0.08, 0, 0);
  spindleGroup.add(spindleCollar);

  // Rotary Chuck Main Body
  const chuckBodyGroup = new THREE.Group();
  
  const chuckGeom = new THREE.CylinderGeometry(0.24, 0.24, 0.16, 32);
  const chuckBody = new THREE.Mesh(chuckGeom, mats.darkIron);
  chuckBody.rotation.z = Math.PI / 2;
  chuckBodyGroup.add(chuckBody);

  // Chuck Outer Rim Sockets (T-Wrench holes for tightening jaws)
  for (let i = 0; i < 3; i++) {
    const angle = (i * Math.PI * 2) / 3 + Math.PI / 6;
    const socketRing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.024, 0.024, 0.01, 16),
      mats.brightSteel
    );
    socketRing.position.set(0, Math.cos(angle) * 0.238, Math.sin(angle) * 0.238);
    socketRing.rotation.z = Math.PI / 2;
    chuckBodyGroup.add(socketRing);

    const squareSocket = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, 0.02, 0.02),
      mats.paint
    );
    squareSocket.position.set(0, Math.cos(angle) * 0.235, Math.sin(angle) * 0.235);
    chuckBodyGroup.add(squareSocket);
  }

  // 3 Radial Guide Slots cut into the front face
  for (let i = 0; i < 3; i++) {
    const angle = (i * Math.PI * 2) / 3;
    const slotGeom = new THREE.BoxGeometry(0.02, 0.04, 0.22);
    const slotMesh = new THREE.Mesh(slotGeom, mats.brightSteel);
    slotMesh.position.set(0.081, 0, 0);
    slotMesh.rotation.x = angle;
    chuckBodyGroup.add(slotMesh);
  }

  // 3 Stepped Self-Centering Jaws (with serrated multi-tier profile matching Image 2)
  for (let i = 0; i < 3; i++) {
    const angle = (i * Math.PI * 2) / 3;
    const jawGroup = new THREE.Group();
    jawGroup.rotation.x = angle;

    // Base jaw slider block inside slot
    const baseJaw = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.035, 0.12), mats.brightSteel);
    baseJaw.position.set(0.095, 0, 0.11);
    jawGroup.add(baseJaw);

    // Step 1 (outer wide tooth)
    const step1 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.035, 0.04), mats.brightSteel);
    step1.position.set(0.12, 0, 0.13);
    jawGroup.add(step1);

    // Step 2 (middle tooth)
    const step2 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.032, 0.04), mats.brightSteel);
    step2.position.set(0.12, 0, 0.09);
    jawGroup.add(step2);

    // Step 3 (inner gripping tip)
    const step3 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.028, 0.04), mats.brightSteel);
    step3.position.set(0.12, 0, 0.05);
    jawGroup.add(step3);

    chuckBodyGroup.add(jawGroup);
  }

  spindleGroup.add(chuckBodyGroup);

  // Workpiece Mesh
  const initialLatheGeom = new THREE.LatheGeometry(defaultPoints, 32);
  initialLatheGeom.rotateZ(-Math.PI / 2);
  const workpieceMesh = new THREE.Mesh(initialLatheGeom, mats.brass);
  spindleGroup.add(workpieceMesh);

  scene.add(spindleGroup);

  return { headstock, spindleGroup, workpieceMesh };
}
