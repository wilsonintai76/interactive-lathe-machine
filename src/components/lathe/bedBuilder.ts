import * as THREE from 'three';
import { LatheMaterials } from '../LatheMaterials';

export interface BedBuildResult {
  bedMesh: THREE.Mesh;
  leadScrew: THREE.Mesh;
}

export function buildBed(scene: THREE.Scene, mats: LatheMaterials): BedBuildResult {
  // 1. Chip Pan / Frame Base
  const panGeom = new THREE.BoxGeometry(4.2, 0.18, 1.6);
  const panMesh = new THREE.Mesh(panGeom, mats.darkIron);
  panMesh.position.set(0.8, 0.1, 0.0);
  scene.add(panMesh);

  // 2. Support Columns / Legs
  const legGeom = new THREE.BoxGeometry(0.5, 0.8, 1.2);
  const leftLeg = new THREE.Mesh(legGeom, mats.paint);
  leftLeg.position.set(-0.8, -0.4, 0.0);
  const rightLeg = new THREE.Mesh(legGeom, mats.paint);
  rightLeg.position.set(2.4, -0.4, 0.0);
  scene.add(leftLeg, rightLeg);

  // 3. Heavy Cast Bed
  const bedGeom = new THREE.BoxGeometry(3.6, 0.4, 0.8);
  const bedMesh = new THREE.Mesh(bedGeom, mats.paint);
  bedMesh.position.set(0.8, 0.4, 0.0);
  scene.add(bedMesh);

  // 4. Precision Ground V-Ways rails (ends cleanly at headstock front face X = -0.26)
  const railLength = 2.86; // From X = -0.26 to X = 2.60
  const railGeom = new THREE.BoxGeometry(railLength, 0.04, 0.08);
  const frontRail = new THREE.Mesh(railGeom, mats.brightSteel);
  frontRail.position.set(1.17, 0.61, -0.28);
  const rearRail = new THREE.Mesh(railGeom, mats.brightSteel);
  rearRail.position.set(1.17, 0.61, 0.28);
  scene.add(frontRail, rearRail);

  // 5. Precision Lead Screw exiting gearbox face (X = -0.26 to X = 2.50)
  const leadScrewLength = 2.76;
  const leadScrewGeom = new THREE.CylinderGeometry(0.018, 0.018, leadScrewLength, 16);
  const leadScrew = new THREE.Mesh(leadScrewGeom, mats.brightSteel);
  leadScrew.rotation.z = Math.PI / 2;
  leadScrew.position.set(1.12, 0.34, 0.42);
  scene.add(leadScrew);

  // 6. Mechanical Foot Brake Treadle Bar Assembly (Leg / Foot Brake)
  const brakeGroup = new THREE.Group();
  brakeGroup.name = 'footBrakePedal';

  // Main horizontal foot treadle bar (spans between left and right pedestals near floor)
  const pedalBarLength = 2.70;
  const pedalBarGeom = new THREE.BoxGeometry(pedalBarLength, 0.04, 0.06);
  const pedalBarMesh = new THREE.Mesh(pedalBarGeom, mats.darkIron);
  pedalBarMesh.position.set(0.8, -0.72, 0.52);
  brakeGroup.add(pedalBarMesh);

  // Ribbed non-slip rubber grip tread along top of foot pedal
  const treadGeom = new THREE.BoxGeometry(pedalBarLength - 0.10, 0.012, 0.075);
  const treadMesh = new THREE.Mesh(treadGeom, mats.rubber);
  treadMesh.position.set(0.8, -0.695, 0.52);
  brakeGroup.add(treadMesh);

  // Yellow safety indicator accents on pedal bar ends
  const yellowLeftCap = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.042, 0.064), mats.emissiveYellow);
  yellowLeftCap.position.set(0.8 - pedalBarLength / 2 + 0.03, -0.72, 0.52);
  brakeGroup.add(yellowLeftCap);

  const yellowRightCap = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.042, 0.064), mats.emissiveYellow);
  yellowRightCap.position.set(0.8 + pedalBarLength / 2 - 0.03, -0.72, 0.52);
  brakeGroup.add(yellowRightCap);

  // Pivot mounting arms attaching pedal to left & right legs
  const pivotArmLeft = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.14, 0.22), mats.darkIron);
  pivotArmLeft.position.set(-0.55, -0.68, 0.42);
  brakeGroup.add(pivotArmLeft);

  const pivotArmRight = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.14, 0.22), mats.darkIron);
  pivotArmRight.position.set(2.15, -0.68, 0.42);
  brakeGroup.add(pivotArmRight);

  // Heavy steel pivot bracket sockets bolted to legs
  const bracketLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.08, 16), mats.brightSteel);
  bracketLeft.rotation.z = Math.PI / 2;
  bracketLeft.position.set(-0.55, -0.62, 0.32);
  brakeGroup.add(bracketLeft);

  const bracketRight = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.08, 16), mats.brightSteel);
  bracketRight.rotation.z = Math.PI / 2;
  bracketRight.position.set(2.15, -0.62, 0.32);
  brakeGroup.add(bracketRight);

  // Vertical Mechanical Brake Pull Rod (connects left side of pedal up into headstock band brake)
  const pullRod = new THREE.Mesh(new THREE.CylinderGeometry(0.010, 0.010, 1.20, 12), mats.brightSteel);
  pullRod.position.set(-0.55, -0.10, 0.32);
  brakeGroup.add(pullRod);

  // Brake rod clevis joint connector
  const clevis = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.05, 0.035), mats.darkIron);
  clevis.position.set(-0.55, -0.66, 0.32);
  brakeGroup.add(clevis);

  // Brake return coil spring around rod
  const springMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.18, 16), mats.darkIron);
  springMesh.position.set(-0.55, -0.50, 0.32);
  brakeGroup.add(springMesh);

  scene.add(brakeGroup);

  return { bedMesh, leadScrew };
}
