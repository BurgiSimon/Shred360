import { Vector3 } from 'three';
import { BODY, type Side, type Skeleton } from './skeleton';

/** Shared rig constants and pure helpers for the 3D rider (kept out of component files). */

export const UP = new Vector3(0, 1, 0);
export const HIGHLIGHT = '#38bdf8';

/** How far each layer sits off the skin, in metres. */
export const LAYER_OFFSET = {
  base: 0.004,
  mid: 0.013,
  /** Pants and bibs. */
  outer: 0.026,
  /** Jackets sit over the pants at the waist. */
  jacket: 0.036,
  puffy: 0.05,
} as const;

/** Peeled layers drift outwards as they fade, which reads as "exploding" the outfit. */
export function peelScale(fade: number): number {
  return 1 + fade * 0.18;
}

/** Point along a→b at fraction t. */
export function lerpPoint(a: Vector3, b: Vector3, t: number): Vector3 {
  return a.clone().lerp(b, t);
}

/** Peel value → how faded each layer depth is. 0..1 peels shells, 1..2 peels mid-layers. */
export function layerFade(peel: number, depth: 'outer' | 'mid'): number {
  const raw = depth === 'outer' ? peel : peel - 1;
  return Math.min(1, Math.max(0, raw));
}

export const RIDER_TARGET: [number, number, number] = [0, 0.95, 0];
export const RIDER_CAMERA: [number, number, number] = [2.5, 1.75, 4.1];

/** The head is a slightly tall ellipsoid; head gear shares its transform. */
export const HEAD_SCALE: [number, number, number] = [0.95, 1.08, 1];
export const HELMET_R = BODY.headR + 0.03;

/** Thumb base and tip for a hand, pointing forward-inward from the side of the palm. */
export function thumbPoints(s: Skeleton, side: Side): [Vector3, Vector3] {
  const dir = s.handTip[side].clone().sub(s.wrist[side]).normalize();
  const forward = new Vector3(0, 0, 1).applyQuaternion(s.torsoQuat);
  const inward = new Vector3(side === 'L' ? -1 : 1, 0, 0).applyQuaternion(s.torsoQuat);
  const base = s.wrist[side]
    .clone()
    .add(dir.clone().multiplyScalar(0.03))
    .add(forward.clone().multiplyScalar(0.012));
  const tip = base
    .clone()
    .add(dir.multiplyScalar(0.035))
    .add(forward.multiplyScalar(0.02))
    .add(inward.multiplyScalar(0.02));
  return [base, tip];
}
