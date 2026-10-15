import { Euler, Quaternion, Vector3 } from 'three';
import type { Discipline } from '@/domain/types';

/**
 * Procedural rider skeleton. Instead of a rigged model we compute joint positions for a stance
 * (legs and arms solved with two-bone IK so feet land on the board/skis), and the renderer draws
 * each limb as a tapered segment between two joints. Garments reuse the same segments with a
 * larger radius, so every pose automatically dresses correctly.
 *
 * Units are metres, Y up, the rider faces +Z. The rider's left is +X.
 */

export const BODY = {
  hipHalfWidth: 0.095,
  thigh: 0.44,
  shin: 0.43,
  torsoLen: 0.5,
  shoulderHalfWidth: 0.185,
  upperArm: 0.29,
  forearm: 0.26,
  hand: 0.1,
  neckLen: 0.06,
  headR: 0.105,
  /** Height of the ankle joint above the sole. */
  ankleHeight: 0.1,
  r: {
    thighTop: 0.078,
    knee: 0.054,
    ankle: 0.042,
    upperArmTop: 0.05,
    elbow: 0.04,
    wrist: 0.033,
    neck: 0.048,
    hand: 0.038,
  },
} as const;

export type Side = 'L' | 'R';

export interface Skeleton {
  pelvis: Vector3;
  pelvisQuat: Quaternion;
  torsoQuat: Quaternion;
  chest: Vector3;
  neckBase: Vector3;
  head: Vector3;
  headQuat: Quaternion;
  shoulder: Record<Side, Vector3>;
  elbow: Record<Side, Vector3>;
  wrist: Record<Side, Vector3>;
  handTip: Record<Side, Vector3>;
  hip: Record<Side, Vector3>;
  knee: Record<Side, Vector3>;
  ankle: Record<Side, Vector3>;
  /** Yaw of each boot around Y; 0 means the toe points +Z. */
  footYaw: Record<Side, number>;
  /** Y of the top surface the boots stand on. */
  standY: number;
}

/**
 * Two-bone IK. Returns the middle joint (knee/elbow) and the end position, which equals `target`
 * when it is reachable and is otherwise clamped to the reachable range along the same direction.
 */
export function solveTwoBone(
  root: Vector3,
  target: Vector3,
  upper: number,
  lower: number,
  pole: Vector3,
): { mid: Vector3; end: Vector3 } {
  const toTarget = target.clone().sub(root);
  const rawDist = toTarget.length();
  const minReach = Math.abs(upper - lower) + 1e-4;
  const maxReach = upper + lower - 1e-4;
  const dist = Math.min(maxReach, Math.max(minReach, rawDist));
  const u = rawDist > 1e-6 ? toTarget.divideScalar(rawDist) : new Vector3(0, -1, 0);

  // Angle at the root between the root→target line and the upper bone (law of cosines).
  const cosA = (upper * upper + dist * dist - lower * lower) / (2 * upper * dist);
  const a = Math.acos(Math.min(1, Math.max(-1, cosA)));

  // Bend direction: the part of the pole vector perpendicular to u.
  const v = pole.clone().sub(u.clone().multiplyScalar(pole.dot(u)));
  if (v.lengthSq() < 1e-8) v.set(0, 0, 1).sub(u.clone().multiplyScalar(u.z));
  v.normalize();

  const upperDir = u
    .clone()
    .multiplyScalar(Math.cos(a))
    .add(v.multiplyScalar(Math.sin(a)));
  const mid = root.clone().add(upperDir.multiplyScalar(upper));
  const end = root.clone().add(u.clone().multiplyScalar(dist));
  return { mid, end };
}

interface StanceDef {
  pelvisHeight: number;
  pelvisOffsetZ: number;
  pelvisYaw: number;
  torsoYaw: number;
  torsoLean: number;
  headYaw: number;
  headPitch: number;
  /** Ankle targets in rider space (y is filled in from standY). */
  feet: Record<Side, [number, number]>;
  footYaw: Record<Side, number>;
  kneePole: Record<Side, [number, number, number]>;
  /** Wrist targets relative to the shoulder, in torso space. */
  hands: Record<Side, [number, number, number]>;
  elbowPole: Record<Side, [number, number, number]>;
  standY: number;
}

/** Board top sits ~2.5 cm above the snow, ski top ~3 cm. */
export const BOARD_TOP = 0.025;
export const SKI_TOP = 0.03;

const STANCES: Record<Discipline, StanceDef> = {
  // Regular stance: left foot forward, nose towards +X, rider facing the toe edge (+Z).
  snowboard: {
    pelvisHeight: 0.84,
    pelvisOffsetZ: -0.02,
    pelvisYaw: 0.38,
    torsoYaw: 0.45,
    torsoLean: 0.16,
    headYaw: 0.65,
    headPitch: 0.08,
    feet: { L: [0.26, 0.03], R: [-0.26, 0.03] },
    footYaw: { L: 0.26, R: -0.1 },
    kneePole: { L: [0.25, 0, 1], R: [0.15, 0, 1] },
    hands: { L: [0.12, -0.5, 0.18], R: [-0.1, -0.48, 0.02] },
    elbowPole: { L: [0.6, 0, -1], R: [-0.6, 0, -1] },
    standY: BOARD_TOP,
  },
  ski: {
    pelvisHeight: 0.86,
    pelvisOffsetZ: -0.1,
    pelvisYaw: 0,
    torsoYaw: 0,
    torsoLean: 0.32,
    headYaw: 0,
    headPitch: -0.22,
    feet: { L: [0.12, 0.04], R: [-0.12, 0.04] },
    footYaw: { L: 0, R: 0 },
    kneePole: { L: [0.1, 0, 1], R: [-0.1, 0, 1] },
    hands: { L: [0.1, -0.36, 0.32], R: [-0.1, -0.36, 0.32] },
    elbowPole: { L: [0.8, -0.2, -0.6], R: [-0.8, -0.2, -0.6] },
    standY: SKI_TOP,
  },
};

const v3 = (t: readonly [number, number, number]) => new Vector3(t[0], t[1], t[2]);

export function computeSkeleton(discipline: Discipline): Skeleton {
  const s = STANCES[discipline];
  const pelvis = new Vector3(0, s.pelvisHeight, s.pelvisOffsetZ);
  const pelvisQuat = new Quaternion().setFromEuler(new Euler(0, s.pelvisYaw, 0));
  const torsoQuat = new Quaternion().setFromEuler(new Euler(s.torsoLean, s.torsoYaw, 0, 'YXZ'));
  const chest = pelvis.clone().add(new Vector3(0, BODY.torsoLen, 0).applyQuaternion(torsoQuat));
  const neckBase = chest.clone().add(new Vector3(0, 0.04, 0).applyQuaternion(torsoQuat));
  const headQuat = new Quaternion().setFromEuler(
    new Euler(s.headPitch, s.torsoYaw + s.headYaw, 0, 'YXZ'),
  );
  const head = neckBase
    .clone()
    .add(new Vector3(0, BODY.neckLen + BODY.headR * 0.95, 0.01).applyQuaternion(headQuat));

  const sides: Side[] = ['L', 'R'];
  const sign = { L: 1, R: -1 } as const;
  const shoulder = {} as Record<Side, Vector3>;
  const elbow = {} as Record<Side, Vector3>;
  const wrist = {} as Record<Side, Vector3>;
  const handTip = {} as Record<Side, Vector3>;
  const hip = {} as Record<Side, Vector3>;
  const knee = {} as Record<Side, Vector3>;
  const ankle = {} as Record<Side, Vector3>;

  for (const side of sides) {
    shoulder[side] = chest
      .clone()
      .add(new Vector3(sign[side] * BODY.shoulderHalfWidth, -0.045, 0).applyQuaternion(torsoQuat));
    const handTarget = shoulder[side].clone().add(v3(s.hands[side]).applyQuaternion(torsoQuat));
    const arm = solveTwoBone(
      shoulder[side],
      handTarget,
      BODY.upperArm,
      BODY.forearm,
      v3(s.elbowPole[side]).applyQuaternion(torsoQuat),
    );
    elbow[side] = arm.mid;
    wrist[side] = arm.end;
    const forearmDir = arm.end.clone().sub(arm.mid).normalize();
    handTip[side] = arm.end.clone().add(forearmDir.multiplyScalar(BODY.hand));

    hip[side] = pelvis
      .clone()
      .add(new Vector3(sign[side] * BODY.hipHalfWidth, -0.03, 0).applyQuaternion(pelvisQuat));
    const [fx, fz] = s.feet[side];
    const footTarget = new Vector3(fx, s.standY + BODY.ankleHeight, fz);
    const leg = solveTwoBone(hip[side], footTarget, BODY.thigh, BODY.shin, v3(s.kneePole[side]));
    knee[side] = leg.mid;
    ankle[side] = leg.end;
  }

  return {
    pelvis,
    pelvisQuat,
    torsoQuat,
    chest,
    neckBase,
    head,
    headQuat,
    shoulder,
    elbow,
    wrist,
    handTip,
    hip,
    knee,
    ankle,
    footYaw: { ...s.footYaw },
    standY: s.standY,
  };
}
