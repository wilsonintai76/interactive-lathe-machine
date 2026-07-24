import * as THREE from 'three';
import { LatheMaterials } from '../LatheMaterials';

export interface ToolPostBuildResult {
  toolPost: THREE.Group;
  topPlate: THREE.Mesh;
}

export function build4WayToolPost(mats: LatheMaterials): ToolPostBuildResult {
  const toolPost = new THREE.Group();
  toolPost.position.set(-0.06, 0.0575, 0.0);

  // A. Bottom T-nut / Base Plate resting on compound rest
  const tpBasePlate = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.012, 0.20), mats.brightSteel);
  tpBasePlate.position.set(0, 0.006, 0);
  toolPost.add(tpBasePlate);

  // B. Compact 4-Way Square Block (Lower Flange, Tool Slot Core, Top Flange)
  const lowerFlange = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.032, 0.20), mats.darkIron);
  lowerFlange.position.set(0, 0.028, 0);
  toolPost.add(lowerFlange);

  const recessedCore = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.048, 0.14), mats.darkIron);
  recessedCore.position.set(0, 0.068, 0);
  toolPost.add(recessedCore);

  const topPlate = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.032, 0.20), mats.darkIron);
  topPlate.position.set(0, 0.108, 0);
  toolPost.add(topPlate);

  // C. 8 Hex Clamping Screws/Bolts (2 per side)
  const boltPositions = [
    [-0.07, 0.04], [-0.07, -0.04],
    [0.07, 0.04],  [0.07, -0.04],
    [-0.04, 0.07], [0.04, 0.07],
    [-0.04, -0.07], [0.04, -0.07]
  ];
  boltPositions.forEach(([bx, bz]) => {
    const stud = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.014, 8), mats.brightSteel);
    stud.position.set(bx, 0.131, bz);
    toolPost.add(stud);

    const hexHead = new THREE.Mesh(new THREE.CylinderGeometry(0.010, 0.010, 0.018, 6), mats.brightSteel);
    hexHead.position.set(bx, 0.143, bz);
    toolPost.add(hexHead);
  });

  // D. Central Locking Column & Conical Top Cap
  const centerPost = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.035, 0.045, 16), mats.brightSteel);
  centerPost.position.set(0, 0.140, 0);
  toolPost.add(centerPost);

  const conicalCap = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.042, 0.032, 16), mats.brightSteel);
  conicalCap.position.set(0, 0.170, 0);
  toolPost.add(conicalCap);

  const capDome = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.02, 16), mats.brightSteel);
  capDome.position.set(0, 0.192, 0);
  toolPost.add(capDome);

  // E. Horizontal Clamping Lever (Handle extending sideways)
  const tpHandleGroup = new THREE.Group();
  tpHandleGroup.position.set(0, 0.175, 0);
  tpHandleGroup.rotation.y = Math.PI / 6;

  const tpHandleShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.009, 0.22, 12), mats.brightSteel);
  tpHandleShaft.rotation.z = -Math.PI / 2 + 0.10;
  tpHandleShaft.position.set(0.105, 0.012, 0);
  tpHandleGroup.add(tpHandleShaft);

  const tpHandleKnob = new THREE.Mesh(new THREE.SphereGeometry(0.022, 16, 16), mats.brightSteel);
  tpHandleKnob.position.set(0.21, 0.025, 0);
  tpHandleGroup.add(tpHandleKnob);

  toolPost.add(tpHandleGroup);

  // F. Horizontal Tool Holder Shank (Rectangular bar sitting inside side slot)
  const holderShank = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, 0.18), mats.darkIron);
  holderShank.position.set(0.04, 0.0725, -0.09);
  toolPost.add(holderShank);

  // Triangle indexable golden TiN carbide tip (cutting face at Y = 0.0725, world Y = 0.87)
  const tipShape = new THREE.Shape();
  tipShape.moveTo(0, 0.045);
  tipShape.lineTo(0.03, -0.025);
  tipShape.lineTo(-0.03, -0.025);
  tipShape.closePath();
  const tipGeom = new THREE.ExtrudeGeometry(tipShape, {
    depth: 0.016,
    bevelEnabled: true,
    bevelThickness: 0.003,
    bevelSize: 0.003,
    bevelSegments: 2,
  });
  const carbideTip = new THREE.Mesh(tipGeom, mats.carbide);
  carbideTip.rotation.x = Math.PI / 2;
  carbideTip.position.set(0.04, 0.0725, -0.18);
  toolPost.add(carbideTip);

  return { toolPost, topPlate };
}
