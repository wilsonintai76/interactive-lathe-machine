import * as THREE from 'three';

export interface LatheMaterials {
  brass: THREE.MeshStandardMaterial;
  aluminum: THREE.MeshStandardMaterial;
  steel: THREE.MeshStandardMaterial;
  paint: THREE.MeshStandardMaterial;
  darkIron: THREE.MeshStandardMaterial;
  brightSteel: THREE.MeshStandardMaterial;
  carbide: THREE.MeshStandardMaterial;
  plasticRed: THREE.MeshStandardMaterial;
  plasticBlack: THREE.MeshStandardMaterial;
  rubber: THREE.MeshStandardMaterial;
  emissiveGreen: THREE.MeshStandardMaterial;
  emissiveRed: THREE.MeshStandardMaterial;
  emissiveYellow: THREE.MeshStandardMaterial;
}

export function createMaterials(): LatheMaterials {
  return {
    brass: new THREE.MeshStandardMaterial({
      color: 0xf59e0b, // Vibrant golden brass
      roughness: 0.18,
      metalness: 0.88,
    }),
    aluminum: new THREE.MeshStandardMaterial({
      color: 0xf1f5f9, // Silver/white aluminum
      roughness: 0.20,
      metalness: 0.85,
    }),
    steel: new THREE.MeshStandardMaterial({
      color: 0xc0cdf0, // High-visibility steel
      roughness: 0.18,
      metalness: 0.90,
    }),
    paint: new THREE.MeshStandardMaterial({
      color: 0x334155, // Clean slate teal industrial paint
      roughness: 0.38,
      metalness: 0.22,
    }),
    darkIron: new THREE.MeshStandardMaterial({
      color: 0x242e42, // Sand-cast dark iron with visible metallic sheen
      roughness: 0.55,
      metalness: 0.45,
    }),
    brightSteel: new THREE.MeshStandardMaterial({
      color: 0xffffff, // Polished mirror chrome
      roughness: 0.05,
      metalness: 0.98,
    }),
    carbide: new THREE.MeshStandardMaterial({
      color: 0xfacc15, // Golden TiN (Titanium Nitride) coated indexable carbide tip - ultra visible!
      roughness: 0.12,
      metalness: 0.95,
    }),
    plasticRed: new THREE.MeshStandardMaterial({
      color: 0xef4444, // Gloss red plastic knob
      roughness: 0.12,
      metalness: 0.1,
    }),
    plasticBlack: new THREE.MeshStandardMaterial({
      color: 0x1f2937, // Charcoal black gloss handles
      roughness: 0.3,
      metalness: 0.1,
    }),
    rubber: new THREE.MeshStandardMaterial({
      color: 0x111827, // Rubber seals
      roughness: 0.85,
      metalness: 0.05,
    }),
    emissiveGreen: new THREE.MeshStandardMaterial({
      color: 0x065f46,
      emissive: 0x10b981,
      emissiveIntensity: 0.8,
    }),
    emissiveRed: new THREE.MeshStandardMaterial({
      color: 0x7f1d1d,
      emissive: 0xef4444,
      emissiveIntensity: 1.2,
    }),
    emissiveYellow: new THREE.MeshStandardMaterial({
      color: 0xca8a04,
      emissive: 0xeab308,
      emissiveIntensity: 0.6,
    }),
  };
}
