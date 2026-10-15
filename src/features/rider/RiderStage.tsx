import { Suspense, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, Lightformer, OrbitControls } from '@react-three/drei';
import { RIDER_CAMERA, RIDER_TARGET } from './rig';
import { SlopeEnvironment, Snowfall } from './SlopeEnvironment';

/**
 * The shared 3D stage: sky, slope, snowfall, lighting and orbit controls. Used by the Fit Check
 * page and the read-only share page. `onCanvas` receives the <canvas> for snapshots/recording.
 */
export function RiderStage({
  children,
  autoRotate = true,
  autoRotateSpeed = 1.1,
  snow = true,
  onCanvas,
  onMissed,
}: {
  children: ReactNode;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  snow?: boolean;
  onCanvas?: (canvas: HTMLCanvasElement) => void;
  /** Click on empty space (clears a selection). */
  onMissed?: () => void;
}) {
  return (
    <Canvas
      shadows="percentage"
      dpr={[1, 2]}
      camera={{ position: RIDER_CAMERA, fov: 38, near: 0.05, far: 400 }}
      // Needed so snapshots and recordings read the last rendered frame.
      gl={{ preserveDrawingBuffer: true, antialias: true }}
      onCreated={({ gl }) => onCanvas?.(gl.domElement)}
      onPointerMissed={onMissed}
      data-testid="rider-canvas"
    >
      <fog attach="fog" args={['#e2eefc', 45, 190]} />
      <hemisphereLight args={['#cfe4ff', '#e9eef5', 0.5]} />
      <directionalLight
        position={[4, 7, 5]}
        intensity={2.1}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-2.5}
        shadow-camera-right={2.5}
        shadow-camera-top={2.5}
        shadow-camera-bottom={-2.5}
        shadow-camera-near={1}
        shadow-camera-far={20}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />
      <directionalLight position={[-4, 3, -3]} intensity={0.5} color="#bcd8ff" />
      {/* Procedural environment map (no network fetch) for reflective lenses and glossy shells. */}
      <Environment resolution={128} frames={1}>
        <Lightformer
          form="rect"
          intensity={0.9}
          color="#cfe6ff"
          position={[0, 6, -6]}
          scale={[14, 5, 1]}
        />
        <Lightformer
          form="rect"
          intensity={0.5}
          color="#ffffff"
          position={[0, -2, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[20, 20, 1]}
        />
        <Lightformer form="circle" intensity={6} color="#fff4d6" position={[5, 6, 5]} scale={2} />
        <Lightformer
          form="rect"
          intensity={1.2}
          color="#7fb3ff"
          position={[-6, 3, 2]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[8, 4, 1]}
        />
      </Environment>
      <Suspense fallback={null}>
        <SlopeEnvironment />
        {snow && <Snowfall />}
        {children}
      </Suspense>
      <OrbitControls
        target={RIDER_TARGET}
        enablePan={false}
        enableDamping
        minDistance={1.3}
        maxDistance={6}
        minPolarAngle={0.25}
        maxPolarAngle={Math.PI / 2 - 0.04}
        autoRotate={autoRotate}
        autoRotateSpeed={autoRotateSpeed}
        makeDefault
      />
    </Canvas>
  );
}
