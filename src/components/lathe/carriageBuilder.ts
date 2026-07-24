import * as THREE from 'three';
import { LatheMaterials } from '../LatheMaterials';
import { createSpokedHandwheel } from './handwheel';
import { build4WayToolPost } from './toolPostBuilder';

export interface CarriageBuildResult {
  carriage: THREE.Group;
  carriageHandwheel: THREE.Group;
  crossSlide: THREE.Group;
  crossSlideHandwheel: THREE.Group;
  saddle: THREE.Mesh;
  csTable: THREE.Mesh;
  compBody: THREE.Mesh;
  topPlate: THREE.Mesh;
}

export function buildCarriage(scene: THREE.Scene, mats: LatheMaterials): CarriageBuildResult {
  // CARRIAGE ASSEMBLY
  const carriage = new THREE.Group();
  carriage.position.set(0.4, 0.63, 0.0);

  // Saddle H-Plate
  const saddleGeom = new THREE.BoxGeometry(0.65, 0.06, 0.76);
  const saddle = new THREE.Mesh(saddleGeom, mats.darkIron);
  saddle.position.set(0, 0.03, 0.08);
  carriage.add(saddle);

  // Dovetail Guide Ways on top of Saddle for Cross-Slide (transverse Z-axis motion)
  const wayLeftGeom = new THREE.BoxGeometry(0.04, 0.020, 0.64);
  const wayLeft = new THREE.Mesh(wayLeftGeom, mats.brightSteel);
  wayLeft.position.set(-0.15, 0.065, 0.08);
  carriage.add(wayLeft);

  const wayRightGeom = new THREE.BoxGeometry(0.04, 0.020, 0.64);
  const wayRight = new THREE.Mesh(wayRightGeom, mats.brightSteel);
  wayRight.position.set(0.15, 0.065, 0.08);
  carriage.add(wayRight);

  // Apron back plate
  const apronGeom = new THREE.BoxGeometry(0.65, 0.32, 0.08);
  const apron = new THREE.Mesh(apronGeom, mats.paint);
  apron.position.set(0, -0.13, 0.42);
  carriage.add(apron);

  // Carriage handwheel
  const apronHwGroup = createSpokedHandwheel(mats, 0.12, 0.016, 0.024, 0.04, 3, true, 0.06, 0.10);
  apronHwGroup.name = 'carriageHandwheel';
  apronHwGroup.position.set(-0.16, -0.13, 0.48);
  carriage.add(apronHwGroup);

  // CROSS-SLIDE TABLE & MICROMETER DIAL ASSEMBLY
  const crossSlide = new THREE.Group();
  crossSlide.position.set(0.0, 0.075, 0.08);

  // Cross Slide main body cast iron table slab
  const csGeom = new THREE.BoxGeometry(0.38, 0.045, 0.52);
  const csTable = new THREE.Mesh(csGeom, mats.darkIron);
  csTable.position.set(0, 0.0225, 0);
  crossSlide.add(csTable);

  // Machined T-Slots on upper surface of Cross Slide table
  const tSlotLeft = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.008, 0.42), mats.steel);
  tSlotLeft.position.set(-0.09, 0.042, 0);
  crossSlide.add(tSlotLeft);

  const tSlotRight = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.008, 0.42), mats.steel);
  tSlotRight.position.set(0.09, 0.042, 0);
  crossSlide.add(tSlotRight);

  // Gib Adjustment Set Screws along right edge of Cross Slide
  for (let i = -0.18; i <= 0.18; i += 0.12) {
    const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.012, 10), mats.brightSteel);
    screw.rotation.z = Math.PI / 2;
    screw.position.set(0.195, 0.0225, i);
    crossSlide.add(screw);
  }

  // Felt / Rubber Way Wipers at front and back ends of Cross Slide
  const wiperFront = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.015, 0.015), mats.rubber);
  wiperFront.position.set(0, 0.010, 0.265);
  crossSlide.add(wiperFront);

  const wiperBack = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.015, 0.015), mats.rubber);
  wiperBack.position.set(0, 0.010, -0.265);
  crossSlide.add(wiperBack);

  // Precision Lead Screw & Graduated Micrometer Dial Collar Assembly
  const dialCollarGroup = new THREE.Group();
  dialCollarGroup.position.set(0, 0.0225, 0.26);

  // Polished Lead Screw shaft
  const shaftGeom = new THREE.CylinderGeometry(0.008, 0.008, 0.12, 16);
  shaftGeom.rotateX(Math.PI / 2);
  const csShaft = new THREE.Mesh(shaftGeom, mats.brightSteel);
  csShaft.position.set(0, 0, 0.04);
  dialCollarGroup.add(csShaft);

  // Chrome Micrometer Dial Body
  const dialBodyGeom = new THREE.CylinderGeometry(0.034, 0.034, 0.022, 32);
  dialBodyGeom.rotateX(Math.PI / 2);
  const dialBody = new THREE.Mesh(dialBodyGeom, mats.brightSteel);
  dialBody.position.set(0, 0, 0.025);
  dialCollarGroup.add(dialBody);

  // Etched Graduations Ring
  const dialRingGeom = new THREE.CylinderGeometry(0.0345, 0.0345, 0.012, 32);
  dialRingGeom.rotateX(Math.PI / 2);
  const dialRing = new THREE.Mesh(dialRingGeom, mats.darkIron);
  dialRing.position.set(0, 0, 0.025);
  dialCollarGroup.add(dialRing);

  // Knurled Dial Lock Thumb Nut
  const lockNutGeom = new THREE.CylinderGeometry(0.014, 0.014, 0.015, 16);
  lockNutGeom.rotateX(Math.PI / 2);
  const lockNut = new THREE.Mesh(lockNutGeom, mats.steel);
  lockNut.position.set(0, 0, 0.042);
  dialCollarGroup.add(lockNut);

  crossSlide.add(dialCollarGroup);

  // Cross-Slide Spoked Handwheel
  const csHwGroup = createSpokedHandwheel(mats, 0.08, 0.012, 0.018, 0.03, 3, true, 0.04, 0.04);
  csHwGroup.name = 'crossSlideHandwheel';
  csHwGroup.position.set(0, 0.0225, 0.35);
  crossSlide.add(csHwGroup);

  // COMPOUND REST
  const compoundRest = new THREE.Group();
  compoundRest.position.set(0.0, 0.05, 0.0);

  const swivelBase = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.015, 32), mats.brightSteel);
  swivelBase.position.set(0, 0.0075, 0);
  compoundRest.add(swivelBase);

  const compBody = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.05, 0.20), mats.darkIron);
  compBody.position.set(0, 0.0325, 0);
  compoundRest.add(compBody);

  const compShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.06, 8), mats.brightSteel);
  compShaft.rotation.z = Math.PI / 2;
  compShaft.position.set(0.19, 0.0325, 0);
  compoundRest.add(compShaft);

  const compHw = createSpokedHandwheel(mats, 0.05, 0.007, 0.012, 0.02, 3, true, 0.03, 0.0);
  compHw.position.set(0.22, 0.0325, 0);
  compHw.rotation.y = Math.PI / 2;
  compoundRest.add(compHw);

  // 4-WAY TOOL POST
  const { toolPost, topPlate } = build4WayToolPost(mats);
  compoundRest.add(toolPost);

  crossSlide.add(compoundRest);
  carriage.add(crossSlide);
  scene.add(carriage);

  return {
    carriage,
    carriageHandwheel: apronHwGroup,
    crossSlide,
    crossSlideHandwheel: csHwGroup,
    saddle,
    csTable,
    compBody,
    topPlate,
  };
}
