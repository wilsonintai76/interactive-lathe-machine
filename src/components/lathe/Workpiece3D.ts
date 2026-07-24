import * as THREE from 'three';
import { WorkpieceMaterial } from '../../types';

export const WORKPIECE_SEGMENT_COUNT = 60;
export const WORKPIECE_LENGTH_MM = 50.0;
export const DEFAULT_WORKPIECE_RADIUS_MM = 7.5; // 15.0mm diameter

export const WORKPIECE_MATERIAL_COLORS: Record<WorkpieceMaterial, { raw: THREE.Color; cut: THREE.Color }> = {
  castiron: {
    raw: new THREE.Color(0x283240), // Sand-cast dark iron raw skin
    cut: new THREE.Color(0xe2e8f0), // Freshly turned bright shiny silver iron core
  },
};

/**
 * Builds a 100% closed profile contour for LatheGeometry.
 * Includes explicit center points at chuck face and right end face
 * to generate solid end caps (no hollow see-through tubes).
 */
export function buildWorkpieceProfilePoints(radii: number[]): THREE.Vector2[] {
  const points: THREE.Vector2[] = [];
  const mmPerSegment = WORKPIECE_LENGTH_MM / (WORKPIECE_SEGMENT_COUNT - 1);
  const startLength = 0.08; // Offset from chuck face
  const endLength = startLength + WORKPIECE_LENGTH_MM * 0.01; // 0.58

  // 1. Solid Chuck face center (R = 0)
  points.push(new THREE.Vector2(0, startLength));

  // 2. Chuck face outer edge
  const r0Units = (radii[0] ?? DEFAULT_WORKPIECE_RADIUS_MM) * 0.01;
  points.push(new THREE.Vector2(r0Units, startLength));

  // 3. Main workpiece profile segments (i = 0 ... SEGMENT_COUNT - 1)
  for (let i = 0; i < WORKPIECE_SEGMENT_COUNT; i++) {
    const rMm = radii[i] ?? DEFAULT_WORKPIECE_RADIUS_MM;
    const rUnits = rMm * 0.01;
    const lUnits = startLength + i * mmPerSegment * 0.01;
    points.push(new THREE.Vector2(rUnits, lUnits));
  }

  // 4. Free right end face outer edge
  const rLastUnits = (radii[WORKPIECE_SEGMENT_COUNT - 1] ?? DEFAULT_WORKPIECE_RADIUS_MM) * 0.01;
  points.push(new THREE.Vector2(rLastUnits, endLength));

  // 5. Solid Free right end face center (R = 0)
  points.push(new THREE.Vector2(0, endLength));

  return points;
}

/**
 * Generates a complete solid BufferGeometry for the workpiece with vertex colors
 * distinguishing raw sand-cast skin from bright silver cut metal surfaces.
 */
export function createWorkpieceGeometry(
  radii: number[],
  materialKey: WorkpieceMaterial = 'castiron'
): THREE.BufferGeometry {
  const points = buildWorkpieceProfilePoints(radii);
  const latheGeom = new THREE.LatheGeometry(points, 32);

  // Reorient geometry so cylinder lies along positive X-axis
  latheGeom.rotateZ(-Math.PI / 2);

  const colorScheme = WORKPIECE_MATERIAL_COLORS[materialKey] || WORKPIECE_MATERIAL_COLORS.castiron;
  const posAttr = latheGeom.getAttribute('position');
  const vertexCount = posAttr.count;
  const colors = new Float32Array(vertexCount * 3);

  const pointsPerRing = points.length; // 1 + 1 + 60 + 1 + 1 = 64 points per radial spoke

  for (let idx = 0; idx < vertexCount; idx++) {
    const pointInRingIdx = idx % pointsPerRing;

    let isCut = false;

    if (pointInRingIdx === 0 || pointInRingIdx === 1) {
      // Chuck end cap face
      isCut = false;
    } else if (pointInRingIdx >= 2 && pointInRingIdx < 2 + WORKPIECE_SEGMENT_COUNT) {
      // Outer workpiece profile segment
      const segIdx = pointInRingIdx - 2;
      const radiusMm = radii[segIdx] ?? DEFAULT_WORKPIECE_RADIUS_MM;
      isCut = radiusMm < 7.48; // Any turned down diameter reveals bright silver
    } else {
      // Free right end face (facing tool/tailstock) -> bright turned silver metal
      isCut = true;
    }

    const c = isCut ? colorScheme.cut : colorScheme.raw;
    colors[idx * 3] = c.r;
    colors[idx * 3 + 1] = c.g;
    colors[idx * 3 + 2] = c.b;
  }

  latheGeom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  latheGeom.computeVertexNormals();

  return latheGeom;
}

/**
 * Creates the initial Mesh instance for the workpiece.
 */
export function createWorkpieceMesh(
  radii: number[],
  materialMat: THREE.Material,
  materialKey: WorkpieceMaterial = 'castiron'
): THREE.Mesh {
  const geom = createWorkpieceGeometry(radii, materialKey);
  const mesh = new THREE.Mesh(geom, materialMat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}
