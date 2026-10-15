import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { box, createMan, createRobot, type Man } from './models';
import { START } from './stages';
import { launchVelocity } from './rules';
import type { Pose, Impact, Transform } from './physics';

type Particle = { position: THREE.Vector3; velocity: THREE.Vector3; life: number; size: number };
function textMaterial(text: string, color = '#e7e8de') {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 70px Arial';
  ctx.fillText(text, 512, 64);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false });
}

export class ThrowScene {
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(43, 1, 0.1, 180);
  private renderer: THREE.WebGLRenderer;
  private hero: Man;
  private targets: THREE.Group[];
  private guide: THREE.Line;
  private launchRing: THREE.Mesh;
  private resizeObserver: ResizeObserver;
  private environment: THREE.WebGLRenderTarget;
  private baseCamera = new THREE.Vector3(17, 12, 26);
  private cameraAim = new THREE.Vector3(0, 1, -1);
  private lastTime = 0;
  private shake = 0;
  private charge = 0;
  private angle = 0;
  private particles: Particle[] = [];
  private sparks: THREE.InstancedMesh;
  private sparkCursor = 0;
  private dummy = new THREE.Object3D();
  private reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  private lowQuality = new URLSearchParams(location.search).get('quality') === 'low';

  constructor(
    private container: HTMLElement,
    targetCount: number,
  ) {
    this.renderer = new THREE.WebGLRenderer({ antialias: !this.lowQuality });
    this.renderer.setPixelRatio(this.lowQuality ? 1 : Math.min(devicePixelRatio, 1.5));
    this.renderer.setClearColor(0xaabac4);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.domElement.setAttribute('aria-label', 'おじさんとサイボーグの3D投擲ゲーム画面');
    this.renderer.domElement.setAttribute('role', 'img');
    container.appendChild(this.renderer.domElement);
    this.scene.fog = new THREE.FogExp2(0xaabac4, 0.012);
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const room = new RoomEnvironment();
    this.environment = pmrem.fromScene(room, 0.04);
    this.scene.environment = this.environment.texture;
    room.dispose();
    pmrem.dispose();
    this.scene.environmentIntensity = 0.5;
    this.scene.add(new THREE.HemisphereLight(0xd1e8ff, 0x716047, 1.8));
    const sun = new THREE.DirectionalLight(0xffddae, 4.2);
    sun.position.set(-12, 22, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.setScalar(this.lowQuality ? 512 : 2048);
    Object.assign(sun.shadow.camera, { left: -24, right: 24, top: 24, bottom: -30, far: 85 });
    sun.shadow.normalBias = 0.045;
    sun.shadow.bias = -0.0001;
    sun.target.position.set(0, 0, -5);
    this.scene.add(sun, sun.target);
    const fill = new THREE.DirectionalLight(0x70cce3, 1.2);
    fill.position.set(10, 7, -14);
    this.scene.add(fill);
    this.buildArena();
    this.hero = createMan();
    this.scene.add(this.hero.root);
    const robot = createRobot();
    this.targets = Array.from({ length: targetCount }, () => {
      const clone = robot.clone(true);
      this.scene.add(clone);
      return clone;
    });
    this.guide = new THREE.Line(
      new THREE.BufferGeometry(),
      new THREE.LineDashedMaterial({
        color: 0xffcd66,
        dashSize: 0.22,
        gapSize: 0.2,
        transparent: true,
        opacity: 0.8,
      }),
    );
    this.scene.add(this.guide);
    this.launchRing = new THREE.Mesh(
      new THREE.RingGeometry(1.45, 1.52, 64),
      new THREE.MeshBasicMaterial({
        color: 0xffcc65,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
      }),
    );
    this.launchRing.rotation.x = -Math.PI / 2;
    this.launchRing.position.set(START.x, 0.035, START.z);
    this.scene.add(this.launchRing);
    this.sparks = new THREE.InstancedMesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial({ color: 0xffc05b }),
      144,
    );
    this.sparks.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.sparks.frustumCulled = false;
    for (let i = 0; i < 144; i++) {
      this.particles.push({
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        life: 0,
        size: 0,
      });
      this.dummy.scale.setScalar(0);
      this.dummy.updateMatrix();
      this.sparks.setMatrixAt(i, this.dummy.matrix);
    }
    this.scene.add(this.sparks);
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();
    this.aim(0, 0.6);
  }

  private buildArena() {
    const concrete = new THREE.MeshStandardMaterial({ color: 0x62737a, roughness: 0.82 });
    const dark = new THREE.MeshStandardMaterial({
      color: 0x243944,
      roughness: 0.54,
      metalness: 0.45,
    });
    const trim = new THREE.MeshStandardMaterial({
      color: 0xd2bd84,
      metalness: 0.7,
      roughness: 0.4,
    });
    const light = new THREE.MeshStandardMaterial({
      color: 0xa2e7ed,
      emissive: 0x56c5dc,
      emissiveIntensity: 2,
    });
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#52636a';
    ctx.fillRect(0, 0, 1024, 1024);
    for (let i = 0; i < 17000; i++) {
      const n = Math.sin(i * 127.1 + 43.7) * 43758.5453,
        f = n - Math.floor(n);
      ctx.fillStyle = i % 2 ? '#617078' : '#47585f';
      ctx.fillRect(f * 1024, (i * 173) % 1024, 2, 1);
    }
    ctx.strokeStyle = '#829095';
    ctx.lineWidth = 2;
    for (let x = 0; x < 1024; x += 256) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 1024);
      ctx.stroke();
    }
    for (let y = 0; y < 1024; y += 256) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1024, y);
      ctx.stroke();
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(6, 10);
    texture.anisotropy = 4;
    box(
      this.scene,
      [70, 0.8, 110],
      [0, -0.42, -15],
      new THREE.MeshStandardMaterial({ map: texture, roughness: 0.64, metalness: 0.2 }),
    );
    box(this.scene, [10, 0.025, 32], [0, 0.012, -2], dark);
    for (const x of [-5.3, 5.3]) {
      box(this.scene, [0.07, 0.03, 36], [x, 0.025, -2], trim);
      for (let z = -20; z < 16; z += 4)
        box(this.scene, [0.18, 0.04, 1.4], [x * 1.6, 0.04, z], light);
    }
    for (let z = -16; z < 14; z += 4) {
      for (const x of [-3.8, 3.8]) box(this.scene, [0.7, 0.04, 0.08], [x, 0.04, z], trim);
    }
    const landing = new THREE.Mesh(
      new THREE.RingGeometry(2.7, 2.76, 64),
      new THREE.MeshBasicMaterial({ color: 0x88a5af, side: THREE.DoubleSide }),
    );
    landing.rotation.x = -Math.PI / 2;
    landing.position.set(0, 0.04, 10);
    this.scene.add(landing);
    for (const x of [-12.5, 12.5]) {
      box(this.scene, [1.4, 0.75, 36], [x, 0.375, -3], concrete);
      for (let z = -18; z < 16; z += 6) {
        box(this.scene, [0.6, 3.5, 0.7], [x, 1.75, z], dark);
        box(this.scene, [0.12, 2.2, 0.12], [x - Math.sign(x) * 0.32, 2.1, z + 0.4], light);
      }
    }
    box(this.scene, [27, 1.5, 1.2], [0, 6.8, -20], dark);
    for (const x of [-12.5, 12.5]) box(this.scene, [1.2, 7, 1.2], [x, 3.5, -20], concrete);
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(16, 2),
      textMaterial('CYBORG DISPOSAL UNIT'),
    );
    sign.position.set(0, 6.8, -19.35);
    this.scene.add(sign);
    const number = new THREE.Mesh(
      new THREE.PlaneGeometry(6, 0.8),
      textMaterial('01 / THROWING GROUND', '#a1c3ca'),
    );
    number.position.set(0, 4.9, -20);
    this.scene.add(number);
    // City silhouette: deterministic, cheap geometry with a few lit window strips.
    const city = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), concrete, 44);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < 44; i++) {
      const side = i % 2 ? -1 : 1,
        h = 7 + ((i * 13) % 25);
      dummy.position.set(side * (24 + (i % 5) * 5), h / 2 - 12, -15 - Math.floor(i / 2) * 4);
      dummy.scale.set(4 + (i % 4), h, 4);
      dummy.updateMatrix();
      city.setMatrixAt(i, dummy.matrix);
      if (i % 3 === 0)
        box(
          this.scene,
          [0.12, h * 0.7, 0.12],
          [dummy.position.x - side * 2.2, h * 0.5 - 10, dummy.position.z + 2.02],
          light,
        );
    }
    this.scene.add(city);
    for (const x of [-8.6, 8.6]) {
      const panel = new THREE.Mesh(
        new THREE.PlaneGeometry(3, 1),
        textMaterial('STAND CLEAR', '#f0c77c'),
      );
      panel.rotation.x = -Math.PI / 2;
      panel.position.set(x, 0.05, 12);
      this.scene.add(panel);
    }
  }

  private resize() {
    const { width, height } = this.container.getBoundingClientRect();
    if (this.lowQuality) this.renderer.setPixelRatio(Math.min(1, 800 / Math.max(width, 1)));
    this.renderer.setSize(width, height);
    this.camera.aspect = width / Math.max(height, 1);
    if (width < 760) {
      this.baseCamera.set(13, 17, 32);
      this.camera.fov = 50;
    } else {
      this.baseCamera.set(17, 12, 26);
      this.camera.fov = 43;
    }
    this.camera.position.copy(this.baseCamera);
    this.camera.lookAt(this.cameraAim);
    this.camera.updateProjectionMatrix();
  }

  aim(angle: number, power: number, charging = false) {
    this.angle = angle;
    this.charge = charging ? power : 0;
    const v = launchVelocity(angle, power),
      points: THREE.Vector3[] = [];
    for (let i = 0; i <= 32; i++) {
      const t = i / 50,
        y = START.y + v.y * t - 4.905 * t * t;
      if (y < 0.1) break;
      points.push(new THREE.Vector3(v.x * t, y, START.z + v.z * t));
    }
    this.guide.geometry.dispose();
    this.guide.geometry = new THREE.BufferGeometry().setFromPoints(points);
    this.guide.computeLineDistances();
  }

  impact(events: Impact[]) {
    if (!events.length) return;
    if (!this.reducedMotion) this.shake = Math.min(0.3, 0.12 + events.length * 0.04);
    for (const event of events)
      for (let i = 0; i < 10; i++) {
        const p = this.particles[this.sparkCursor++ % this.particles.length],
          a = i * 2.4 + event.index;
        p.position.copy(event.position);
        p.velocity.set(Math.sin(a) * 5, 2 + i * 0.35, Math.cos(a) * 5);
        p.life = 0.45 + i * 0.035;
        p.size = 0.04 + (i % 3) * 0.03;
      }
  }
  reset() {
    this.shake = 0;
    this.particles.forEach((p) => (p.life = 0));
    this.camera.position.copy(this.baseCamera);
    this.cameraAim.set(0, 1, -1);
    this.charge = 0;
  }

  render(pose: Pose, phase: 'ready' | 'flying' | 'encore', time: number, encore = 0) {
    const dt = Math.min(0.5, Math.max(0, time - this.lastTime));
    this.lastTime = time;
    const sync = (object: THREE.Object3D, value: Transform) => {
      object.position.copy(value.position);
      object.quaternion.copy(value.rotation);
    };
    sync(this.hero.root, pose.projectile);
    this.targets.forEach((mesh, i) => sync(mesh, pose.targets[i]));
    this.guide.visible = phase === 'ready';
    this.launchRing.visible = phase === 'ready';
    this.launchRing.scale.setScalar(1 + this.charge * 0.13 + Math.sin(time * 3) * 0.015);
    const breathing = Math.sin(time * 2) * 0.025;
    this.hero.leftArm.rotation.set(0, 0, -0.1);
    this.hero.rightArm.rotation.set(0, 0, 0.1);
    this.hero.tie.rotation.x = 0;
    this.hero.tie.rotation.z = Math.sin(time * 2) * 0.03;
    if (phase === 'ready') {
      this.hero.root.rotation.y = (-this.angle * Math.PI) / 180;
      this.hero.root.rotation.x = -this.charge * 0.25;
      this.hero.leftArm.rotation.z = -0.1 - this.charge * 1.1;
      this.hero.rightArm.rotation.z = 0.1 + this.charge * 1.1;
      this.hero.root.position.y += breathing;
    } else if (phase === 'flying') {
      this.hero.leftArm.rotation.z = -1.1 + Math.sin(time * 10) * 0.3;
      this.hero.rightArm.rotation.z = 1.1 + Math.cos(time * 8) * 0.3;
      this.hero.tie.rotation.x = -0.6;
    } else {
      const stand = THREE.MathUtils.smoothstep(encore, 0, 0.7);
      this.hero.root.quaternion.slerp(new THREE.Quaternion(), stand);
      this.hero.root.position.y = THREE.MathUtils.lerp(pose.projectile.position.y, 1.34, stand);
      this.hero.rightArm.rotation.set(
        -0.85 * stand,
        0,
        -0.75 * stand + Math.sin(encore * 9) * 0.06,
      );
      this.hero.tie.rotation.z = Math.sin(encore * 10) * 0.09 * Math.max(0, 1 - encore / 2);
    }
    const desired = this.baseCamera.clone(),
      look = new THREE.Vector3(0, 1, -1);
    if (!this.reducedMotion && phase === 'flying') {
      const z = THREE.MathUtils.clamp(pose.projectile.position.z, -16, 10);
      desired.set(13, 10, Math.max(8, z + 15));
      look.set(pose.projectile.position.x * 0.3, 1, Math.min(0, z * 0.6));
    }
    if (!this.reducedMotion && phase === 'encore') {
      desired.set(pose.projectile.position.x + 2.4, 3.2, pose.projectile.position.z + 7.5);
      look.set(pose.projectile.position.x, 1.3, pose.projectile.position.z);
    }
    const smoothing = 1 - Math.exp(-dt * (phase === 'encore' ? 2.5 : 3.5));
    this.camera.position.lerp(desired, smoothing);
    this.cameraAim.lerp(look, smoothing);
    if (this.shake > 0.001) {
      this.camera.position.x += Math.sin(time * 67) * this.shake;
      this.shake *= Math.exp(-dt * 12);
    }
    this.camera.lookAt(this.cameraAim);
    this.particles.forEach((p, i) => {
      p.life = Math.max(0, p.life - dt);
      if (p.life > 0) {
        p.velocity.y -= dt * 9.8;
        p.position.addScaledVector(p.velocity, dt);
      }
      this.dummy.position.copy(p.position);
      this.dummy.rotation.set(time * 3 + i, i, time * 2);
      this.dummy.scale.setScalar(p.life > 0 ? p.size * Math.min(1, p.life * 5) : 0);
      this.dummy.updateMatrix();
      this.sparks.setMatrixAt(i, this.dummy.matrix);
    });
    this.sparks.instanceMatrix.needsUpdate = true;
    this.renderer.render(this.scene, this.camera);
  }

  snapshot(width: number, height: number): HTMLCanvasElement {
    const size = this.renderer.getSize(new THREE.Vector2());
    const ratio = this.renderer.getPixelRatio(),
      aspect = this.camera.aspect;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    try {
      this.renderer.setPixelRatio(1);
      this.renderer.setSize(width, height, false);
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.render(this.scene, this.camera);
      // Copy synchronously after render, so preserveDrawingBuffer is unnecessary.
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Could not create the result image');
      context.drawImage(this.renderer.domElement, 0, 0);
      return canvas;
    } finally {
      this.renderer.setPixelRatio(ratio);
      this.renderer.setSize(size.x, size.y, false);
      this.camera.aspect = aspect;
      this.camera.updateProjectionMatrix();
      this.renderer.render(this.scene, this.camera);
    }
  }

  dispose() {
    this.resizeObserver.disconnect();
    const geometries = new Set<THREE.BufferGeometry>(),
      materials = new Set<THREE.Material>(),
      textures = new Set<THREE.Texture>();
    this.scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh || object instanceof THREE.Line)) return;
      geometries.add(object.geometry);
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        materials.add(material);
        for (const value of Object.values(material))
          if (value instanceof THREE.Texture) textures.add(value);
      }
    });
    geometries.forEach((g) => g.dispose());
    textures.forEach((t) => t.dispose());
    materials.forEach((m) => m.dispose());
    this.environment.dispose();
    this.renderer.dispose();
  }
}
