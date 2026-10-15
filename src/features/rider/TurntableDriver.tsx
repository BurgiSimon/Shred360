import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Spherical, Vector3 } from 'three';
import { RIDER_TARGET } from './rig';

export interface TurntableRun {
  /** Changes for every new run. */
  id: number;
  seconds: number;
  onProgress?: (t: number) => void;
  onDone: () => void;
}

interface ControlsLike {
  enabled: boolean;
  target: Vector3;
  update: () => void;
}

/**
 * Spins the camera exactly once around the rider while `run` is set, independent of the orbit
 * controls' own auto-rotate, so recordings always cover a full 360° at a steady speed.
 */
export function TurntableDriver({ run }: { run: TurntableRun | null }) {
  const camera = useThree((s) => s.camera);
  const getState = useThree((s) => s.get);
  const state = useRef<{
    id: number;
    elapsed: number;
    start: Spherical;
    target: Vector3;
    done: boolean;
  }>(null);

  useEffect(() => {
    if (!run) return;
    // Read controls imperatively: we pause them for the duration of the spin.
    const controls = getState().controls as unknown as ControlsLike | null;
    const target = controls?.target.clone() ?? new Vector3(...RIDER_TARGET);
    const start = new Spherical().setFromVector3(camera.position.clone().sub(target));
    state.current = { id: run.id, elapsed: 0, start, target, done: false };
    if (controls) controls.enabled = false;
    return () => {
      if (controls) {
        controls.enabled = true;
        controls.update();
      }
    };
  }, [run, camera, getState]);

  useFrame((_, delta) => {
    const s = state.current;
    if (!run || !s || s.id !== run.id || s.done) return;
    s.elapsed += Math.min(delta, 0.1);
    const t = Math.min(1, s.elapsed / run.seconds);
    // Ease in/out so the loop starts and ends gently.
    const eased = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
    const sph = new Spherical(s.start.radius, s.start.phi, s.start.theta + eased * Math.PI * 2);
    camera.position.copy(new Vector3().setFromSpherical(sph).add(s.target));
    camera.lookAt(s.target);
    run.onProgress?.(t);
    if (t >= 1) {
      s.done = true;
      run.onDone();
    }
  });

  return null;
}
