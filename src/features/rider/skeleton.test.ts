import { describe, expect, it } from 'vitest';
import { Vector3 } from 'three';
import { BODY, computeSkeleton, solveTwoBone } from './skeleton';

describe('solveTwoBone', () => {
  it('reaches a reachable target with exact bone lengths', () => {
    const root = new Vector3(0, 1, 0);
    const target = new Vector3(0.2, 0.3, 0.1);
    const { mid, end } = solveTwoBone(root, target, 0.44, 0.43, new Vector3(0, 0, 1));
    expect(end.distanceTo(target)).toBeLessThan(1e-6);
    expect(mid.distanceTo(root)).toBeCloseTo(0.44, 6);
    expect(mid.distanceTo(end)).toBeCloseTo(0.43, 6);
  });

  it('bends towards the pole', () => {
    const { mid } = solveTwoBone(
      new Vector3(0, 1, 0),
      new Vector3(0, 0.3, 0),
      0.44,
      0.43,
      new Vector3(0, 0, 1),
    );
    expect(mid.z).toBeGreaterThan(0.1);
  });

  it('clamps unreachable targets along the same direction', () => {
    const root = new Vector3(0, 2, 0);
    const { mid, end } = solveTwoBone(root, new Vector3(0, 0, 0), 0.44, 0.43, new Vector3(0, 0, 1));
    expect(end.distanceTo(root)).toBeCloseTo(0.87, 3);
    expect(end.x).toBeCloseTo(0, 6);
    expect(mid.distanceTo(root)).toBeCloseTo(0.44, 6);
  });
});

describe('computeSkeleton', () => {
  for (const discipline of ['snowboard', 'ski'] as const) {
    it(`plants both feet on the ${discipline}`, () => {
      const s = computeSkeleton(discipline);
      for (const side of ['L', 'R'] as const) {
        expect(s.ankle[side].y).toBeCloseTo(s.standY + BODY.ankleHeight, 4);
        expect(s.knee[side].distanceTo(s.hip[side])).toBeCloseTo(BODY.thigh, 5);
        expect(s.knee[side].distanceTo(s.ankle[side])).toBeCloseTo(BODY.shin, 5);
        expect(s.elbow[side].distanceTo(s.shoulder[side])).toBeCloseTo(BODY.upperArm, 5);
        // Knees bend forward (towards +Z), not backwards.
        expect(s.knee[side].z).toBeGreaterThan(s.hip[side].z);
      }
      // Head sits above the chest, chest above the pelvis.
      expect(s.head.y).toBeGreaterThan(s.chest.y);
      expect(s.chest.y).toBeGreaterThan(s.pelvis.y);
      // Left is +X.
      expect(s.shoulder.L.x).toBeGreaterThan(s.shoulder.R.x);
    });
  }

  it('uses a wide stance on a snowboard and a narrow one on skis', () => {
    const board = computeSkeleton('snowboard');
    const ski = computeSkeleton('ski');
    expect(board.ankle.L.x - board.ankle.R.x).toBeGreaterThan(0.4);
    expect(ski.ankle.L.x - ski.ankle.R.x).toBeLessThan(0.3);
  });
});
