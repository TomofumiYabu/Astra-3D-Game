import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { HotelPhysics, Transform } from './physics';
import { START, TARGET_POSITIONS } from './physics';
import { launchVelocity } from './rules';

const brass = new THREE.MeshStandardMaterial({ color: 0xc5a268, metalness: 0.78, roughness: 0.28 });
const dark = new THREE.MeshStandardMaterial({ color: 0x182b25, roughness: 0.6 });
const ivory = new THREE.MeshStandardMaterial({ color: 0xd6c7a8, roughness: 0.48 });
const black = new THREE.MeshStandardMaterial({ color: 0x141b19, roughness: 0.6 });

function box(
  parent: THREE.Object3D,
  size: number[],
  position: number[],
  material: THREE.Material,
  shadow = true,
) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(...(size as [number, number, number])),
    material,
  );
  mesh.position.set(...(position as [number, number, number]));
  mesh.castShadow = shadow;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function label(text: string, width = 1024, height = 160, color = '#e8d2a6') {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${height * 0.43}px Georgia, serif`;
  ctx.fillText(text, width / 2, height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false });
}

function suitcase(color: number, hero = false): THREE.Group {
  const group = new THREE.Group();
  const scale = hero ? 1.22 : 1;
  const shell = new THREE.MeshStandardMaterial({ color, metalness: 0.25, roughness: 0.33 });
  const body = new THREE.Mesh(new RoundedBoxGeometry(1.3, 1.24, 0.8, 2, 0.1), shell);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);
  for (const x of [-0.46, 0.46]) {
    box(group, [0.07, 1.2, 0.82], [x, 0, 0], brass);
    for (const z of [-0.27, 0.27]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.085, 8), black);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, -0.67, z);
      group.add(wheel);
    }
  }
  for (const x of [-0.2, 0.2]) box(group, [0.045, 0.14, 0.08], [x, 0.69, 0], brass);
  box(group, [0.44, 0.05, 0.08], [0, 0.76, 0], brass);
  box(group, [0.26, 0.12, 0.02], [0, 0.3, 0.411], brass);
  for (const x of [-0.28, -0.14, 0, 0.14, 0.28]) {
    box(group, [0.025, 0.65, 0.016], [x, -0.14, 0.407], shell, false);
  }
  const tag = box(group, [0.21, 0.31, 0.025], [0.3, 0.42, 0.46], ivory);
  tag.rotation.z = -0.25;
  group.scale.setScalar(scale);
  return group;
}

function plant(scene: THREE.Scene, x: number, z: number) {
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.34, 0.85, 16), brass);
  pot.position.set(x, 0.42, z);
  pot.castShadow = true;
  scene.add(pot);
  const leaves = new THREE.MeshStandardMaterial({ color: 0x2e5c3d, roughness: 0.7 });
  for (let i = 0; i < 9; i++) {
    const angle = i * 2.4;
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), leaves);
    leaf.scale.set(0.16, 0.95, 0.3);
    leaf.position.set(x + Math.sin(angle) * 0.35, 1.5 + (i % 3) * 0.14, z + Math.cos(angle) * 0.35);
    leaf.rotation.set(Math.sin(angle) * 0.55, angle, Math.cos(angle) * 0.55);
    leaf.castShadow = true;
    scene.add(leaf);
  }
}

export class HotelScene {
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(43, 1, 0.1, 90);
  private renderer: THREE.WebGLRenderer;
  private projectile: THREE.Group;
  private targets: THREE.Group[];
  private guide: THREE.Line;
  private launchRing: THREE.Mesh;
  private resizeObserver: ResizeObserver;
  private baseCamera = new THREE.Vector3(8, 10, 20);
  private shake = 0;
  private reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  private lowQuality = new URLSearchParams(location.search).get('quality') === 'low';

  constructor(private container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: !this.lowQuality, alpha: false });
    this.renderer.setPixelRatio(this.lowQuality ? 1 : Math.min(devicePixelRatio, 1.5));
    this.renderer.setClearColor(0x14211e);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.domElement.setAttribute('aria-label', 'ホテルロビーの3Dゲーム画面');
    this.renderer.domElement.setAttribute('role', 'img');
    container.appendChild(this.renderer.domElement);
    this.scene.fog = new THREE.FogExp2(0x172621, 0.018);
    this.scene.add(new THREE.HemisphereLight(0xc8e0d5, 0x5b4231, 2.1));
    const sun = new THREE.DirectionalLight(0xffe1a2, 4.5);
    sun.position.set(8, 14, -3);
    sun.castShadow = true;
    sun.shadow.mapSize.setScalar(this.lowQuality ? 512 : 2048);
    sun.shadow.camera.left = -16;
    sun.shadow.camera.right = 16;
    sun.shadow.camera.top = 18;
    sun.shadow.camera.bottom = -18;
    sun.shadow.normalBias = 0.04;
    sun.shadow.bias = -0.0001;
    this.scene.add(sun);
    const fill = new THREE.DirectionalLight(0x9acac7, 1.2);
    fill.position.set(-8, 5, 8);
    this.scene.add(fill);
    this.buildLobby();
    this.projectile = suitcase(0xea796c, true);
    this.scene.add(this.projectile);
    const colors = [
      0x739b91, 0xe1caa4, 0x6d8b7b, 0xb3765b, 0xd8c29d, 0x8f4341, 0xd8bc8c, 0x547c73, 0xb36f58,
      0xcfc5aa,
    ];
    this.targets = TARGET_POSITIONS.map((_, i) => {
      const mesh = suitcase(colors[i]);
      this.scene.add(mesh);
      return mesh;
    });
    this.guide = new THREE.Line(
      new THREE.BufferGeometry(),
      new THREE.LineDashedMaterial({
        color: 0xd6e7b3,
        dashSize: 0.25,
        gapSize: 0.16,
        transparent: true,
        opacity: 0.7,
      }),
    );
    this.scene.add(this.guide);
    this.launchRing = new THREE.Mesh(
      new THREE.RingGeometry(1.25, 1.28, 64),
      new THREE.MeshBasicMaterial({
        color: 0xe5cf92,
        transparent: true,
        opacity: 0.75,
        side: THREE.DoubleSide,
      }),
    );
    this.launchRing.rotation.x = -Math.PI / 2;
    this.launchRing.position.set(START.x, 0.045, START.z);
    this.scene.add(this.launchRing);
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();
    this.aim(0, 0.6);
  }

  private buildLobby() {
    const floorGeometry = new THREE.BoxGeometry(1.98, 0.06, 1.98);
    const floorMaterials = [
      new THREE.MeshStandardMaterial({ color: 0x8d9787, roughness: 0.3, metalness: 0.18 }),
      new THREE.MeshStandardMaterial({ color: 0x3a5148, roughness: 0.24, metalness: 0.25 }),
    ];
    for (let color = 0; color < 2; color++) {
      const matrices: THREE.Matrix4[] = [];
      for (let x = -5; x < 5; x++)
        for (let z = -7; z < 8; z++) {
          if (Math.abs(x + z) % 2 === color)
            matrices.push(new THREE.Matrix4().makeTranslation(x * 2 + 1, -0.04, z * 2 + 1));
        }
      const tiles = new THREE.InstancedMesh(floorGeometry, floorMaterials[color], matrices.length);
      matrices.forEach((m, i) => tiles.setMatrixAt(i, m));
      tiles.receiveShadow = true;
      this.scene.add(tiles);
    }
    const carpet = new THREE.MeshStandardMaterial({ color: 0x78372c, roughness: 0.95 });
    box(this.scene, [6.6, 0.025, 25], [0, 0.014, 0], carpet, false);
    for (const x of [-3.16, 3.16]) box(this.scene, [0.065, 0.03, 25], [x, 0.03, 0], brass, false);
    for (const x of [-3.03, 3.03]) box(this.scene, [0.018, 0.03, 25], [x, 0.03, 0], ivory, false);
    box(this.scene, [20, 8.8, 0.4], [0, 4.4, -14], dark);
    box(this.scene, [0.4, 8.8, 28], [-9.8, 4.4, 0], dark);
    box(this.scene, [0.4, 8.8, 28], [9.8, 4.4, 0], dark);
    for (const y of [0.2, 2.3, 7.6, 8.3]) {
      box(this.scene, [19.6, 0.06, 0.1], [0, y, -13.75], brass);
      for (const x of [-9.55, 9.55]) box(this.scene, [0.08, 0.06, 27], [x, y, -0.3], brass);
    }
    for (const x of [-7.5, -4.5, 4.5, 7.5]) {
      box(this.scene, [0.025, 5.0, 0.04], [x, 5, -13.76], brass);
    }
    box(this.scene, [6, 3.7, 0.18], [0, 2, -13.65], black);
    for (const x of [-2.9, 0, 2.9]) box(this.scene, [0.07, 3.7, 0.22], [x, 2, -13.5], brass);
    box(this.scene, [5.9, 0.08, 0.22], [0, 3.86, -13.5], brass);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(7.3, 1.14), label('H O T E L   A S T R A'));
    sign.position.set(0, 5.7, -13.73);
    this.scene.add(sign);
    const stars = new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, 0.35),
      label('✦  ✦  ✦  ✦  ✦', 512, 100),
    );
    stars.position.set(0, 4.92, -13.72);
    this.scene.add(stars);
    for (const x of [-7, 7])
      for (const z of [-10, -2, 6]) {
        const column = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 7.4, 20), ivory);
        column.position.set(x, 3.7, z);
        column.castShadow = true;
        column.receiveShadow = true;
        this.scene.add(column);
        for (const y of [0.16, 0.4, 7.1, 7.4]) {
          const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, 0.12, 20), brass);
          ring.position.set(x, y, z);
          this.scene.add(ring);
        }
      }
    const glow = new THREE.MeshStandardMaterial({
      color: 0xffd69b,
      emissive: 0xffb454,
      emissiveIntensity: 1.4,
    });
    for (const x of [-9.53, 9.53])
      for (const z of [-9, -1, 7]) {
        box(this.scene, [0.08, 3.8, 3], [x, 4.65, z], glow, false);
        for (const offset of [-1.55, 0, 1.55])
          box(this.scene, [0.12, 3.95, 0.06], [x - Math.sign(x) * 0.07, 4.65, z + offset], brass);
        box(this.scene, [0.12, 0.05, 3.1], [x - Math.sign(x) * 0.07, 4.65, z], brass);
      }
    for (const z of [-5, 4]) {
      const hoop = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.045, 6, 48), brass);
      hoop.rotation.x = Math.PI / 2;
      hoop.position.set(0, 7, z);
      this.scene.add(hoop);
      box(this.scene, [0.04, 2.5, 0.04], [0, 8.2, z], brass);
      for (let i = 0; i < 12; i++) {
        const angle = (i * Math.PI) / 6;
        const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.45, 8), glow);
        lamp.position.set(Math.sin(angle) * 1.8, 7.22, z + Math.cos(angle) * 1.8);
        this.scene.add(lamp);
      }
      const light = new THREE.PointLight(0xffd299, 35, 13, 2);
      light.position.set(0, 6.5, z);
      this.scene.add(light);
    }
    for (const x of [-8.2, 8.2]) for (const z of [-11.7, 3.3]) plant(this.scene, x, z);
    // Reception desks frame the target without hiding it from the camera.
    for (const x of [-5.5, 5.5]) {
      box(this.scene, [2.6, 1.3, 1.25], [x, 0.65, -11.5], dark);
      box(this.scene, [2.8, 0.12, 1.4], [x, 1.35, -11.5], ivory);
      for (let i = -4; i <= 4; i++)
        box(this.scene, [0.03, 1.1, 0.03], [x + i * 0.27, 0.65, -10.86], brass);
    }
  }

  private resize() {
    const { width, height } = this.container.getBoundingClientRect();
    if (this.lowQuality) this.renderer.setPixelRatio(Math.min(1, 800 / Math.max(width, 1)));
    this.renderer.setSize(width, height);
    this.camera.aspect = width / Math.max(height, 1);
    if (width < 800) {
      this.baseCamera.set(8, 14, 24);
      this.camera.fov = 54;
      this.camera.position.copy(this.baseCamera);
      this.camera.lookAt(0, 1, -2);
    } else {
      this.baseCamera.set(8, 10, 20);
      this.camera.fov = 43;
      this.camera.position.copy(this.baseCamera);
      this.camera.lookAt(-3.7, 1.1, -2);
    }
    this.camera.updateProjectionMatrix();
  }

  aim(angle: number, power: number) {
    const velocity = launchVelocity(angle, power);
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= 28; i++) {
      const t = i / 42;
      const y = START.y + velocity.y * t - 4.905 * t * t;
      if (y < 0.1) break;
      points.push(new THREE.Vector3(START.x + velocity.x * t, y, START.z + velocity.z * t));
    }
    this.guide.geometry.dispose();
    this.guide.geometry = new THREE.BufferGeometry().setFromPoints(points);
    this.guide.computeLineDistances();
    this.projectile.rotation.y = (-angle * Math.PI) / 180;
  }

  impact() {
    if (!this.reducedMotion) this.shake = 0.15;
  }

  render(physics: HotelPhysics, time: number) {
    const transforms = physics.transforms;
    const sync = (mesh: THREE.Object3D, transform: Transform) => {
      mesh.position.copy(transform.position);
      mesh.quaternion.copy(transform.rotation);
    };
    sync(this.projectile, transforms.projectile);
    this.targets.forEach((mesh, index) => sync(mesh, transforms.targets[index]));
    this.guide.visible = physics.phase === 'ready';
    this.launchRing.visible = physics.phase === 'ready';
    this.launchRing.scale.setScalar(1 + Math.sin(time * 2) * 0.035);
    this.camera.position.copy(this.baseCamera);
    if (this.shake > 0.001) {
      this.camera.position.x += Math.sin(time * 61) * this.shake;
      this.camera.position.y += Math.cos(time * 47) * this.shake;
      this.shake *= 0.86;
    }
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.resizeObserver.disconnect();
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh || object instanceof THREE.Line) object.geometry.dispose();
    });
    this.renderer.dispose();
  }
}
