import * as THREE from 'three';
import { LatheMaterials } from './LatheMaterials';
import { buildBed } from './lathe/bedBuilder';
import { buildHeadstock } from './lathe/headstockBuilder';
import { buildCarriage } from './lathe/carriageBuilder';
import { buildTailstock } from './lathe/tailstockBuilder';
import { buildControls } from './lathe/controlsBuilder';

export interface LatheMeshRefs {
  leadScrew: THREE.Mesh;
  spindleGroup: THREE.Group;
  carriage: THREE.Group;
  carriageHandwheel: THREE.Group;
  crossSlide: THREE.Group;
  crossSlideHandwheel: THREE.Group;
  spindleLever: THREE.Group;
  rpmLever1: THREE.Group;
  rpmLever2: THREE.Group;
  tailstock: THREE.Group;
  workpieceMesh: THREE.Mesh;
  headstock: THREE.Mesh;
  tpBlock: THREE.Mesh;
  compBody: THREE.Mesh;
  csTable: THREE.Mesh;
  saddle: THREE.Mesh;
  bedMesh: THREE.Mesh;
  tsCasting: THREE.Mesh;
}

export function buildLatheScene(
  scene: THREE.Scene,
  mats: LatheMaterials,
  defaultPoints: THREE.Vector2[]
): LatheMeshRefs {
  // 1. Bed & Rails
  const { bedMesh, leadScrew } = buildBed(scene, mats);

  // 2. Headstock & Workpiece
  const { headstock, spindleGroup, workpieceMesh } = buildHeadstock(scene, mats, defaultPoints);

  // 3. Carriage, Slides & Tool Post
  const {
    carriage,
    carriageHandwheel,
    crossSlide,
    crossSlideHandwheel,
    saddle,
    csTable,
    compBody,
    topPlate,
  } = buildCarriage(scene, mats);

  // 4. Tailstock Assembly
  const { tailstock, tsCasting } = buildTailstock(scene, mats);

  // 5. Controls & Levers
  const { spindleLever, rpmLever1, rpmLever2 } = buildControls(scene, mats);

  return {
    leadScrew,
    spindleGroup,
    carriage,
    carriageHandwheel,
    crossSlide,
    crossSlideHandwheel,
    spindleLever,
    rpmLever1,
    rpmLever2,
    tailstock,
    workpieceMesh,
    headstock,
    tpBlock: topPlate,
    compBody,
    csTable,
    saddle,
    bedMesh,
    tsCasting,
  };
}
