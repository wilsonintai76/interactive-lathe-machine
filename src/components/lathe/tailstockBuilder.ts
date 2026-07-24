import * as THREE from 'three';
import { LatheMaterials } from '../LatheMaterials';
import { createSpokedHandwheel } from './handwheel';

export interface TailstockBuildResult {
  tailstock: THREE.Group;
  tsCasting: THREE.Mesh;
}

export function buildTailstock(scene: THREE.Scene, mats: LatheMaterials): TailstockBuildResult {
  const tailstock = new THREE.Group();
  tailstock.position.set(0.9, 0.63, 0.0);

  // 1. Base Plate resting on bed ways (with side clamping keyways/notches as in schematic)
  const tsBaseGeom = new THREE.BoxGeometry(0.40, 0.05, 0.36);
  const tsBase = new THREE.Mesh(tsBaseGeom, mats.paint);
  tsBase.position.set(0, 0.025, -0.12);
  tailstock.add(tsBase);

  // Central alignment guide key on bottom
  const tsGuideKey = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.02, 0.12), mats.darkIron);
  tsGuideKey.position.set(0, -0.01, -0.12);
  tailstock.add(tsGuideKey);

  // 2. Upright Flared Support Column Casting (NT125 style - wide bottom, tapered mid-body)
  const colBaseGeom = new THREE.BoxGeometry(0.34, 0.06, 0.28);
  const colBase = new THREE.Mesh(colBaseGeom, mats.paint);
  colBase.position.set(0, 0.08, -0.12);
  tailstock.add(colBase);

  // Tapered middle neck
  const colNeckGeom = new THREE.CylinderGeometry(0.09, 0.13, 0.12, 16);
  const colNeck = new THREE.Mesh(colNeckGeom, mats.paint);
  colNeck.position.set(0, 0.17, -0.12);
  colNeck.scale.set(1.4, 1.0, 0.9); // Oval flared cross-section
  tailstock.add(colNeck);

  // 3. Upper Horizontal Barrel Housing (Cylindrical main casting)
  const tsHousing = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.08, 0.36, 24),
    mats.paint
  );
  tsHousing.rotation.z = Math.PI / 2;
  tsHousing.position.set(0, 0.24, -0.12);
  tailstock.add(tsHousing);

  // Top oil lubrication ports
  const oilPort = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.02, 8), mats.brightSteel);
  oilPort.position.set(0.02, 0.325, -0.12);
  tailstock.add(oilPort);

  // 4. Side Quill Clamping Lever Handle (NT125 style side locking lever)
  const lockGroup = new THREE.Group();
  lockGroup.position.set(0.02, 0.24, 0.0);

  const lockBoss = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.03, 12), mats.darkIron);
  lockBoss.rotation.x = Math.PI / 2;
  lockGroup.add(lockBoss);

  const lockLeverArm = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.006, 0.10, 8), mats.brightSteel);
  lockLeverArm.position.set(0, -0.05, 0.02);
  lockLeverArm.rotation.x = -0.3;
  lockGroup.add(lockLeverArm);

  const lockBall = new THREE.Mesh(new THREE.SphereGeometry(0.014, 12, 12), mats.brightSteel);
  lockBall.position.set(0, -0.095, 0.035);
  lockGroup.add(lockBall);

  tailstock.add(lockGroup);

  // 5. Extending Precision Quill Barrel
  const tsQuill = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.30, 24), mats.brightSteel);
  tsQuill.rotation.z = Math.PI / 2;
  tsQuill.position.set(-0.16, 0.24, -0.12);
  tailstock.add(tsQuill);

  // Quill collar / wiper ring
  const quillCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.02, 24), mats.darkIron);
  quillCollar.rotation.z = Math.PI / 2;
  quillCollar.position.set(-0.17, 0.24, -0.12);
  tailstock.add(quillCollar);

  // 6. Morse Taper Live Center Cone with rotating tip collar
  const liveCenterBase = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.048, 0.04, 16), mats.brightSteel);
  liveCenterBase.rotation.z = Math.PI / 2;
  liveCenterBase.position.set(-0.33, 0.24, -0.12);
  tailstock.add(liveCenterBase);

  const liveCenterBearing = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.025, 24), mats.darkIron);
  liveCenterBearing.rotation.z = Math.PI / 2;
  liveCenterBearing.position.set(-0.35, 0.24, -0.12);
  tailstock.add(liveCenterBearing);

  const tsCone = new THREE.Mesh(new THREE.ConeGeometry(0.042, 0.08, 24), mats.brightSteel);
  tsCone.rotation.z = Math.PI / 2;
  tsCone.position.set(-0.40, 0.24, -0.12);
  tailstock.add(tsCone);

  // 7. Rear Handwheel with crank handle (NT125 back wheel)
  const tsHw = createSpokedHandwheel(mats, 0.095, 0.012, 0.02, 0.03, 3, true, 0.04, 0.08);
  tsHw.position.set(0.19, 0.24, -0.12);
  tsHw.rotation.y = Math.PI / 2;
  tailstock.add(tsHw);

  scene.add(tailstock);

  return { tailstock, tsCasting: colNeck };
}
