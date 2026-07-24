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

  // CROSS-SLIDE TABLE
  const crossSlide = new THREE.Group();
  crossSlide.position.set(0.0, 0.06, 0.08);

  const csGeom = new THREE.BoxGeometry(0.38, 0.05, 0.54);
  const csTable = new THREE.Mesh(csGeom, mats.darkIron);
  csTable.position.set(0, 0.025, 0);
  crossSlide.add(csTable);

  const csHwGroup = createSpokedHandwheel(mats, 0.08, 0.012, 0.018, 0.03, 3, true, 0.04, 0.08);
  csHwGroup.name = 'crossSlideHandwheel';
  csHwGroup.position.set(0, 0.025, 0.30);
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
