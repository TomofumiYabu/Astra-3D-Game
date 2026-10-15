import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const materials = {
  suit: new THREE.MeshStandardMaterial({ color: 0x3c4e67, roughness: 0.84 }),
  lapel: new THREE.MeshStandardMaterial({ color: 0x253449, roughness: 0.7 }),
  skin: new THREE.MeshStandardMaterial({ color: 0xe6aa7e, roughness: 0.65 }),
  white: new THREE.MeshStandardMaterial({ color: 0xf5efdb, roughness: 0.65 }),
  tie: new THREE.MeshStandardMaterial({ color: 0xe45436, roughness: 0.5 }),
  shoe: new THREE.MeshStandardMaterial({ color: 0x151c26, roughness: 0.3, metalness: 0.2 }),
  hair: new THREE.MeshStandardMaterial({ color: 0x463c38, roughness: 0.9 }),
  armor: new THREE.MeshStandardMaterial({ color: 0x607b91, metalness: 0.8, roughness: 0.31 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x192633, metalness: 0.65, roughness: 0.4 }),
  steel: new THREE.MeshStandardMaterial({ color: 0xb8c9cc, metalness: 0.86, roughness: 0.26 }),
  red: new THREE.MeshStandardMaterial({
    color: 0xff3526,
    emissive: 0xff2b18,
    emissiveIntensity: 2.3,
    roughness: 0.4,
  }),
};

export function box(
  parent: THREE.Object3D,
  size: [number, number, number],
  pos: [number, number, number],
  material: THREE.Material,
  rounded = false,
) {
  const mesh = new THREE.Mesh(
    rounded
      ? new RoundedBoxGeometry(...size, 1, Math.min(...size) * 0.17)
      : new THREE.BoxGeometry(...size),
    material,
  );
  mesh.position.set(...pos);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
function sphere(
  parent: THREE.Object3D,
  size: [number, number, number],
  pos: [number, number, number],
  material: THREE.Material,
) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), material);
  mesh.position.set(...pos);
  mesh.scale.set(...size);
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}

// Merge static character pieces by material; an entire robot is four draw calls.
function mergeParts(root: THREE.Group) {
  root.updateMatrixWorld(true);
  const parts = new Map<THREE.Material, THREE.BufferGeometry[]>();
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh) || Array.isArray(object.material)) return;
    const geometry = object.geometry.index
      ? object.geometry.toNonIndexed()
      : object.geometry.clone();
    geometry.applyMatrix4(object.matrixWorld);
    const list = parts.get(object.material) ?? [];
    list.push(geometry);
    parts.set(object.material, list);
    object.geometry.dispose();
  });
  root.clear();
  for (const [material, geometries] of parts) {
    const merged = mergeGeometries(geometries);
    geometries.forEach((g) => g.dispose());
    if (!merged) continue;
    const mesh = new THREE.Mesh(merged, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    root.add(mesh);
  }
  return root;
}

export type Man = {
  root: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  tie: THREE.Mesh;
};
export function createMan(): Man {
  const root = new THREE.Group(),
    body = new THREE.Group();
  root.add(body);
  box(body, [0.97, 1.06, 0.6], [0, 0.14, 0], materials.suit, true);
  sphere(body, [0.48, 0.48, 0.36], [0, -0.04, 0.05], materials.suit);
  box(body, [0.32, 0.64, 0.04], [0, 0.35, 0.33], materials.white);
  for (const side of [-1, 1]) {
    const lapel = box(body, [0.2, 0.53, 0.05], [side * 0.23, 0.4, 0.35], materials.lapel);
    lapel.rotation.z = side * 0.3;
    box(body, [0.31, 0.76, 0.37], [side * 0.24, -0.73, -0.01], materials.suit, true);
    box(body, [0.35, 0.22, 0.61], [side * 0.24, -1.15, 0.1], materials.shoe, true);
  }
  box(body, [0.24, 0.025, 0.03], [-0.29, 0.26, 0.345], materials.white);
  sphere(body, [0.34, 0.4, 0.32], [0, 1.05, 0.01], materials.skin);
  sphere(body, [0.12, 0.11, 0.15], [0, 1.02, 0.31], materials.skin);
  for (const side of [-1, 1]) {
    sphere(body, [0.07, 0.13, 0.07], [side * 0.34, 1.04, 0], materials.skin);
    sphere(body, [0.09, 0.25, 0.26], [side * 0.28, 1.15, -0.08], materials.hair);
    box(body, [0.12, 0.035, 0.04], [side * 0.14, 1.22, 0.29], materials.hair).rotation.z =
      side * 0.1;
    box(body, [0.045, 0.055, 0.025], [side * 0.14, 1.12, 0.32], materials.shoe);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.012, 5, 16), materials.shoe);
    rim.position.set(side * 0.145, 1.12, 0.335);
    body.add(rim);
  }
  box(body, [0.07, 0.018, 0.02], [0, 1.12, 0.335], materials.shoe);
  box(body, [0.19, 0.05, 0.04], [0, 0.91, 0.31], materials.hair);
  box(body, [0.13, 0.015, 0.025], [0, 0.85, 0.29], materials.hair);
  mergeParts(body);
  const tie = box(root, [0.12, 0.5, 0.055], [0, 0.29, 0.4], materials.tie);
  box(root, [0.15, 0.12, 0.06], [0, 0.58, 0.39], materials.tie, true);
  const arm = (side: number) => {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.56, 0.52, 0);
    root.add(pivot);
    box(pivot, [0.28, 0.73, 0.32], [0, -0.32, 0], materials.suit, true);
    box(pivot, [0.26, 0.09, 0.29], [0, -0.69, 0], materials.white);
    sphere(pivot, [0.14, 0.19, 0.14], [0, -0.82, 0.02], materials.skin);
    return pivot;
  };
  return { root, leftArm: arm(-1), rightArm: arm(1), tie };
}

export function createRobot(): THREE.Group {
  const root = new THREE.Group();
  box(root, [0.89, 0.87, 0.59], [0, 0.2, 0], materials.armor, true);
  box(root, [0.62, 0.4, 0.1], [0, 0.29, 0.33], materials.dark);
  box(root, [0.12, 0.24, 0.04], [0, 0.33, 0.4], materials.red);
  box(root, [0.65, 0.23, 0.44], [0, -0.39, 0], materials.dark, true);
  box(root, [0.59, 0.48, 0.5], [0, 0.91, 0], materials.dark, true);
  box(root, [0.57, 0.1, 0.08], [0, 0.99, 0.27], materials.red);
  box(root, [0.34, 0.1, 0.07], [0, 0.72, 0.28], materials.steel);
  for (const side of [-1, 1]) {
    box(root, [0.32, 0.48, 0.43], [side * 0.6, 0.42, 0], materials.armor, true).rotation.z =
      side * -0.13;
    box(root, [0.24, 0.5, 0.28], [side * 0.65, -0.05, 0], materials.dark, true);
    box(root, [0.28, 0.24, 0.3], [side * 0.65, -0.38, 0.03], materials.steel, true);
    box(root, [0.29, 0.57, 0.3], [side * 0.26, -0.75, 0], materials.armor, true);
    box(root, [0.18, 0.12, 0.09], [side * 0.26, -0.69, 0.19], materials.steel);
    box(root, [0.37, 0.22, 0.53], [side * 0.26, -1.09, 0.09], materials.dark, true);
  }
  return mergeParts(root);
}
