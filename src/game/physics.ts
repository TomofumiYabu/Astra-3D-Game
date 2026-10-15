import RAPIER from '@dimforge/rapier3d-compat';
import { FIXED_STEP, ROUND_SECONDS, launchVelocity } from './rules';

export type Phase = 'ready' | 'flying' | 'result';
export type Position = { x: number; y: number; z: number };
export type Transform = {
  position: Position;
  rotation: { x: number; y: number; z: number; w: number };
};
export const START: Position = { x: 0, y: 0.87, z: 6.3 };
export const TARGET_POSITIONS: Position[] = [
  ...[-1.55, 0, 1.55].map((x) => ({ x, y: 0.72, z: -4.5 })),
  ...[-0.775, 0.775].map((x) => ({ x, y: 2.14, z: -4.5 })),
  { x: 0, y: 3.56, z: -4.5 },
  ...[-2.4, -0.8, 0.8, 2.4].map((x) => ({ x, y: 0.72, z: -7.1 })),
];

let initialization: Promise<void> | undefined;
export async function initPhysics() {
  initialization ??= RAPIER.init();
  await initialization;
}

export class HotelPhysics {
  private world!: RAPIER.World;
  private targets: RAPIER.RigidBody[] = [];
  private projectile!: RAPIER.RigidBody;
  private resting: Position[] = [];
  private accumulator = 0;
  private knockedIds = new Set<number>();
  phase: Phase = 'ready';
  elapsed = 0;

  constructor() {
    this.reset();
  }

  reset() {
    this.world?.free();
    this.world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
    this.world.timestep = FIXED_STEP;
    this.phase = 'ready';
    this.elapsed = 0;
    this.accumulator = 0;
    this.knockedIds.clear();
    this.world.createCollider(
      RAPIER.ColliderDesc.cuboid(12, 0.1, 24).setTranslation(0, -0.1, 0).setFriction(0.65),
    );
    for (const x of [-9.5, 9.5]) {
      this.world.createCollider(RAPIER.ColliderDesc.cuboid(0.2, 5, 22).setTranslation(x, 5, 0));
    }
    this.world.createCollider(RAPIER.ColliderDesc.cuboid(10, 5, 0.2).setTranslation(0, 5, -13.8));
    this.targets = TARGET_POSITIONS.map((position) => {
      const body = this.world.createRigidBody(
        RAPIER.RigidBodyDesc.dynamic()
          .setTranslation(position.x, position.y, position.z)
          .setLinearDamping(0.12)
          .setAngularDamping(0.2),
      );
      this.world.createCollider(
        RAPIER.ColliderDesc.cuboid(0.68, 0.7, 0.43)
          .setMass(1.5)
          .setFriction(0.55)
          .setRestitution(0.18),
        body,
      );
      return body;
    });
    this.projectile = this.world.createRigidBody(
      RAPIER.RigidBodyDesc.kinematicPositionBased()
        .setTranslation(START.x, START.y, START.z)
        .setCcdEnabled(true),
    );
    this.world.createCollider(
      RAPIER.ColliderDesc.cuboid(0.9, 0.8, 0.55).setMass(12).setFriction(0.22).setRestitution(0.3),
      this.projectile,
    );
    for (let i = 0; i < 90; i++) this.world.step();
    this.resting = this.targets.map((body) => ({ ...body.translation() }));
  }

  launch(angle: number, power: number): boolean {
    if (this.phase !== 'ready') return false;
    this.phase = 'flying';
    this.projectile.setBodyType(RAPIER.RigidBodyType.Dynamic, true);
    this.projectile.setLinvel(launchVelocity(angle, power), true);
    this.projectile.setAngvel({ x: -0.8, y: 0.2, z: -0.15 }, true);
    return true;
  }

  step(deltaSeconds: number) {
    if (this.phase !== 'flying') return;
    this.accumulator += Math.max(0, Math.min(deltaSeconds, 0.1));
    while (this.accumulator >= FIXED_STEP && this.phase === 'flying') {
      this.world.step();
      this.accumulator -= FIXED_STEP;
      this.elapsed += FIXED_STEP;
      this.targets.forEach((body, index) => {
        const current = body.translation();
        const original = this.resting[index];
        const displacement = Math.hypot(
          current.x - original.x,
          current.y - original.y,
          current.z - original.z,
        );
        if (displacement > 0.65) this.knockedIds.add(index);
      });
      if (this.elapsed >= ROUND_SECONDS) this.phase = 'result';
    }
  }

  get knocked() {
    return this.knockedIds.size;
  }
  get transforms(): { projectile: Transform; targets: Transform[] } {
    const read = (body: RAPIER.RigidBody): Transform => ({
      position: body.translation(),
      rotation: body.rotation(),
    });
    return { projectile: read(this.projectile), targets: this.targets.map(read) };
  }
  dispose() {
    this.world.free();
  }
}
