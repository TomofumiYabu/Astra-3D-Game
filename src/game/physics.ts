import RAPIER from '@dimforge/rapier3d-compat';
import {
  FIXED_STEP,
  MIN_ROUND_SECONDS,
  ROUND_SECONDS,
  launchVelocity,
  type RoundStats,
} from './rules';
import { START, STAGES, type Position, type Stage } from './stages';
export type { Position } from './stages';
export type Phase = 'ready' | 'flying' | 'result';
export type Transform = {
  position: Position;
  rotation: { x: number; y: number; z: number; w: number };
};
export type Pose = { projectile: Transform; targets: Transform[] };
export type Impact = { position: Position; chain: boolean; depth: number; index: number };
export type ReplayFrame = { pose: Pose; stats: RoundStats; time: number };
let initialization: Promise<void> | undefined;
export async function initPhysics() {
  initialization ??= RAPIER.init();
  await initialization;
}
export class ThrowPhysics {
  private world!: RAPIER.World;
  private queue!: RAPIER.EventQueue;
  private targets: RAPIER.RigidBody[] = [];
  private projectile!: RAPIER.RigidBody;
  private colliderIds = new Map<number, number>();
  private active = new Map<number, number>();
  private impacts: Impact[] = [];
  private accumulator = 0;
  private ticks = 0;
  private lastImpact = 0;
  private damped = false;
  private maxDistance = 0;
  private secondary = 0;
  private maxDepth = 0;
  phase: Phase = 'ready';
  elapsed = 0;
  frames: ReplayFrame[] = [];
  constructor(public stage: Stage = STAGES[0]) {
    this.reset();
  }
  reset(stage = this.stage) {
    this.world?.free();
    this.queue?.free();
    this.stage = stage;
    this.world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
    this.world.timestep = FIXED_STEP;
    this.queue = new RAPIER.EventQueue(true);
    this.phase = 'ready';
    this.elapsed = 0;
    this.accumulator = 0;
    this.ticks = 0;
    this.active.clear();
    this.colliderIds.clear();
    this.impacts = [];
    this.frames = [];
    this.secondary = 0;
    this.maxDistance = 0;
    this.maxDepth = 0;
    this.lastImpact = 0;
    this.damped = false;
    this.world.createCollider(
      RAPIER.ColliderDesc.cuboid(35, 0.2, 55).setTranslation(0, -0.2, -15).setFriction(0.8),
    );
    this.targets = stage.targets.map((position, index) => {
      const body = this.world.createRigidBody(
        RAPIER.RigidBodyDesc.dynamic()
          .setTranslation(position.x, position.y, position.z)
          .setLinearDamping(0.18)
          .setAngularDamping(0.6)
          .setCcdEnabled(true),
      );
      const collider = this.world.createCollider(
        RAPIER.ColliderDesc.cuboid(0.54, 1.2, 0.4)
          .setMass(2.2)
          .setFriction(0.7)
          .setRestitution(0.1)
          .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS),
        body,
      );
      this.colliderIds.set(collider.handle, index);
      return body;
    });
    this.projectile = this.world.createRigidBody(
      RAPIER.RigidBodyDesc.kinematicPositionBased()
        .setTranslation(START.x, START.y, START.z)
        .setCcdEnabled(true),
    );
    const hero = this.world.createCollider(
      RAPIER.ColliderDesc.cuboid(0.48, 1.25, 0.38)
        .setMass(15)
        .setFriction(0.35)
        .setRestitution(0.24)
        .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS),
      this.projectile,
    );
    this.colliderIds.set(hero.handle, -1);
    for (let i = 0; i < 90; i++) this.world.step();
  }
  launch(angle: number, power: number): boolean {
    if (this.phase !== 'ready') return false;
    this.phase = 'flying';
    this.projectile.setBodyType(RAPIER.RigidBodyType.Dynamic, true);
    this.projectile.setLinvel(launchVelocity(angle, power), true);
    this.projectile.setAngvel({ x: -0.6, y: 1.2, z: -10 }, true);
    this.frames.push({ pose: this.transforms, stats: this.stats, time: 0 });
    return true;
  }
  private activate(index: number, source: number) {
    if (this.active.has(index) || (source !== -1 && !this.active.has(source))) return;
    const sourceBody = source === -1 ? this.projectile : this.targets[source];
    const velocity = sourceBody.linvel();
    if (Math.hypot(velocity.x, velocity.y, velocity.z) < 1.6) return;
    const body = this.targets[index],
      p = body.translation(),
      sourcePosition = sourceBody.translation();
    const dx = p.x - sourcePosition.x,
      dz = p.z - sourcePosition.z;
    const norm = Math.max(0.2, Math.hypot(dx, dz));
    const depth = source === -1 ? 1 : this.active.get(source)! + 1;
    this.active.set(index, depth);
    this.maxDepth = Math.max(this.maxDepth, depth);
    if (source !== -1) this.secondary++;
    this.lastImpact = this.elapsed;
    // One bounded arcade impulse, ONLY following actual contact with the hero or an active enemy.
    body.applyImpulse(
      {
        x: (dx / norm) * 7 + velocity.x * 0.35,
        y: 5.8,
        z: (dz / norm) * 7 + Math.min(-3, velocity.z * 0.4),
      },
      true,
    );
    body.applyTorqueImpulse({ x: -2.5, y: dx * 0.35, z: -dx * 1.5 }, true);
    this.impacts.push({ position: { ...p }, chain: source !== -1, depth, index });
  }
  step(deltaSeconds: number) {
    if (this.phase !== 'flying') return;
    this.accumulator += Number.isFinite(deltaSeconds)
      ? Math.max(0, Math.min(deltaSeconds, 0.5))
      : 0;
    while (this.accumulator + 1e-10 >= FIXED_STEP && this.phase === 'flying') {
      this.world.step(this.queue);
      this.accumulator -= FIXED_STEP;
      this.ticks++;
      this.elapsed = this.ticks * FIXED_STEP;
      this.queue.drainCollisionEvents((a, b, started) => {
        if (!started) return;
        const first = this.colliderIds.get(a),
          second = this.colliderIds.get(b);
        if (first === undefined || second === undefined) return;
        if (first >= 0) this.activate(first, second);
        if (second >= 0) this.activate(second, first);
      });
      this.active.forEach((_, index) => {
        const p = this.targets[index].translation(),
          origin = this.stage.targets[index];
        this.maxDistance = Math.max(this.maxDistance, Math.hypot(p.x - origin.x, p.z - origin.z));
      });
      if (this.elapsed > 1.15 && !this.damped) {
        this.projectile.setLinearDamping(2.5);
        this.projectile.setAngularDamping(3);
        this.damped = true;
      }
      if (this.ticks % 2 === 0)
        this.frames.push({ pose: this.transforms, stats: this.stats, time: this.elapsed });
      const settled =
        this.elapsed >= MIN_ROUND_SECONDS &&
        this.elapsed - this.lastImpact > 1.4 &&
        this.targets.every((body) => Math.hypot(...Object.values(body.linvel())) < 0.7);
      if (settled || this.elapsed >= ROUND_SECONDS) {
        this.phase = 'result';
        // A round can settle between the 30 Hz samples. Preserve its exact final pose.
        if (this.frames.at(-1)?.time !== this.elapsed)
          this.frames.push({ pose: this.transforms, stats: this.stats, time: this.elapsed });
      }
    }
  }
  get finished() {
    return this.phase === 'result';
  }
  drainImpacts() {
    const events = this.impacts;
    this.impacts = [];
    return events;
  }
  get stats(): RoundStats {
    return {
      knocked: this.active.size,
      chain: this.secondary,
      depth: this.maxDepth,
      distance: this.maxDistance,
    };
  }
  get transforms(): Pose {
    const read = (body: RAPIER.RigidBody): Transform => ({
      position: { ...body.translation() },
      rotation: { ...body.rotation() },
    });
    return { projectile: read(this.projectile), targets: this.targets.map(read) };
  }
  dispose() {
    this.queue.free();
    this.world.free();
  }
}
