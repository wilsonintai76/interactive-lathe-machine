import * as THREE from 'three';
import { LatheMaterials } from '../LatheMaterials';

export function createSpokedHandwheel(
  mats: LatheMaterials,
  rimRadius: number,
  rimThickness: number,
  hubRadius: number,
  hubLength: number,
  spokeCount: number = 3,
  hasGrip: boolean = true,
  gripLength: number = 0.05,
  shaftLength: number = 0.08
): THREE.Group {
  const group = new THREE.Group();

  // Hub: cylinder along Z
  const hubGeom = new THREE.CylinderGeometry(hubRadius, hubRadius, hubLength, 12);
  const hub = new THREE.Mesh(hubGeom, mats.brightSteel);
  hub.rotation.x = Math.PI / 2;
  group.add(hub);

  // Shaft extension
  if (shaftLength > 0) {
    const shaftGeom = new THREE.CylinderGeometry(hubRadius * 0.7, hubRadius * 0.7, shaftLength, 12);
    const shaft = new THREE.Mesh(shaftGeom, mats.brightSteel);
    shaft.rotation.x = Math.PI / 2;
    shaft.position.z = -shaftLength / 2 - hubLength / 2;
    group.add(shaft);
  }

  // Rim: torus in XY plane
  const rimGeom = new THREE.TorusGeometry(rimRadius, rimThickness, 8, 24);
  const rim = new THREE.Mesh(rimGeom, mats.brightSteel);
  group.add(rim);

  // Spokes
  const spokeLength = rimRadius - hubRadius - rimThickness;
  for (let i = 0; i < spokeCount; i++) {
    const angle = (i * Math.PI * 2) / spokeCount;
    const spokeGeom = new THREE.CylinderGeometry(rimThickness * 0.5, rimThickness * 0.5, spokeLength, 8);
    spokeGeom.translate(0, hubRadius + spokeLength / 2, 0);
    const spoke = new THREE.Mesh(spokeGeom, mats.brightSteel);
    spoke.rotation.z = angle;
    group.add(spoke);
  }

  // Handle grip
  if (hasGrip) {
    const gripRadius = rimThickness * 0.9;
    const gripGeom = new THREE.CylinderGeometry(gripRadius * 0.8, gripRadius, gripLength, 8);
    gripGeom.translate(0, gripLength / 2, 0);
    const grip = new THREE.Mesh(gripGeom, mats.plasticBlack);
    grip.position.set(0, rimRadius - rimThickness, hubLength / 2);
    grip.rotation.x = Math.PI / 2;
    group.add(grip);
  }

  return group;
}
