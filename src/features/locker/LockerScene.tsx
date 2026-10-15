import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { CameraControls, CameraControlsImpl } from '@react-three/drei';
import { Box3, Vector3 } from 'three';
import type { LockerZone } from '@/domain/categories';
import type { Item } from '@/domain/types';
import { GearCard3D } from './GearCard3D';
import { LOCKER, type LockerLayout } from './layout';
import { drawPlanks, drawSign, repeatTexture, useCanvasTexture } from './textures';

const { ACTION } = CameraControlsImpl;
const VIEW_Y = 1.4;

/** Where the camera should stand to see `width` metres of wall, given the viewport aspect. */
function distanceForWidth(width: number, aspect: number, fovDeg: number): number {
  const vFov = (fovDeg * Math.PI) / 180;
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
  const byWidth = width / 2 / Math.tan(hFov / 2);
  const byHeight = 1.75 / Math.tan(vFov / 2);
  return Math.min(9, Math.max(byWidth, byHeight));
}

function Room({ width }: { width: number }) {
  const wallWidth = Math.max(width + 3, 8);
  const planks = useCanvasTexture('planks', 512, 512, drawPlanks);
  const wallTex = useMemo(
    () => repeatTexture(planks.clone(), wallWidth / 2.4, LOCKER.wallHeight / 2.4),
    [planks, wallWidth],
  );
  const floorTex = useMemo(() => {
    const t = repeatTexture(planks.clone(), wallWidth / 3, 2);
    t.rotation = Math.PI / 2;
    return t;
  }, [planks, wallWidth]);
  useEffect(
    () => () => {
      wallTex.dispose();
      floorTex.dispose();
    },
    [wallTex, floorTex],
  );
  return (
    <group>
      <mesh position={[0, LOCKER.wallHeight / 2, 0]} receiveShadow>
        <planeGeometry args={[wallWidth, LOCKER.wallHeight]} />
        <meshStandardMaterial map={wallTex} roughness={0.85} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 2.5]} receiveShadow>
        <planeGeometry args={[wallWidth, 5]} />
        <meshStandardMaterial map={floorTex} color="#b48a63" roughness={0.9} />
      </mesh>
      {/* Ceiling beam and skirting board */}
      <mesh position={[0, LOCKER.wallHeight - 0.08, 0.1]} castShadow>
        <boxGeometry args={[wallWidth, 0.16, 0.2]} />
        <meshStandardMaterial color="#4a2f1c" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.06, 0.03]}>
        <boxGeometry args={[wallWidth, 0.12, 0.06]} />
        <meshStandardMaterial color="#4a2f1c" roughness={0.8} />
      </mesh>
      {/* Low boot shelf along the wall — where hardgoods will live later. */}
      <mesh position={[0, 0.1, 0.2]} castShadow receiveShadow>
        <boxGeometry args={[Math.max(width, 2), 0.05, 0.34]} />
        <meshStandardMaterial color="#8a5d38" roughness={0.7} />
      </mesh>
    </group>
  );
}

function ZoneSign({
  label,
  count,
  x,
  width,
}: {
  label: string;
  count: number;
  x: number;
  width: number;
}) {
  const texture = useCanvasTexture(`sign:${label}:${count}`, 512, 96, drawSign(label, count));
  const signWidth = Math.max(0.9, Math.min(width, 1.8));
  return (
    <group position={[x, LOCKER.signY, 0.04]}>
      <mesh castShadow>
        <boxGeometry args={[signWidth + 0.06, signWidth * (96 / 512) + 0.06, 0.03]} />
        <meshStandardMaterial color="#2c1b10" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0, 0.016]}>
        <planeGeometry args={[signWidth, signWidth * (96 / 512)]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
      {/* Warm spot lamp over the zone */}
      <mesh position={[0, 0.32, 0.2]} rotation={[0.6, 0, 0]}>
        <coneGeometry args={[0.07, 0.1, 16, 1, true]} />
        <meshStandardMaterial color="#1c1c1c" metalness={0.6} roughness={0.4} side={2} />
      </mesh>
      <mesh position={[0, 0.3, 0.24]}>
        <sphereGeometry args={[0.025, 12, 8]} />
        <meshBasicMaterial color="#ffd9a0" toneMapped={false} />
      </mesh>
      <spotLight
        position={[0, 0.3, 0.6]}
        target-position={[x, 1.2, 0]}
        angle={0.75}
        penumbra={0.8}
        intensity={2.5}
        distance={4}
        decay={1}
        color="#ffd6a0"
      />
    </group>
  );
}

/** Moves the camera: overview of the whole wall, a zone, or close up on one card. */
function CameraRig({
  layout,
  focus,
  zoneFocus,
}: {
  layout: LockerLayout;
  focus?: { x: number; y: number };
  zoneFocus?: { x: number; y: number; width: number };
}) {
  const controls = useRef<CameraControlsImpl>(null);
  const { size, camera } = useThree();
  const fov = 'fov' in camera ? (camera.fov as number) : 45;
  const aspect = size.width / Math.max(1, size.height);

  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    // Keep the camera in front of the wall and its target on the wall.
    const half = layout.width / 2;
    c.setBoundary(new Box3(new Vector3(-half, 0.2, -0.2), new Vector3(half, 2.8, 0.6)));
    c.boundaryEnclosesCamera = false;
  }, [layout.width]);

  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    if (focus) {
      // Aim a little low so the card sits above the details panel.
      void c.setLookAt(focus.x, focus.y - 0.1, 1.7, focus.x, focus.y - 0.18, 0, true);
    } else if (zoneFocus) {
      const d = distanceForWidth(zoneFocus.width + 0.8, aspect, fov);
      void c.setLookAt(zoneFocus.x, zoneFocus.y + 0.15, d, zoneFocus.x, zoneFocus.y, 0, true);
    } else {
      const d = distanceForWidth(layout.width, aspect, fov);
      void c.setLookAt(0, VIEW_Y + 0.25, d, 0, VIEW_Y, 0, true);
    }
  }, [focus, zoneFocus, layout.width, aspect, fov]);

  return (
    <CameraControls
      ref={controls}
      makeDefault
      minDistance={0.8}
      maxDistance={10}
      minPolarAngle={Math.PI / 2 - 0.5}
      maxPolarAngle={Math.PI / 2 + 0.15}
      minAzimuthAngle={-0.7}
      maxAzimuthAngle={0.7}
      smoothTime={0.45}
      // Browsing a wall is mostly sideways: one finger / left mouse pans, two fingers zoom.
      mouseButtons={{
        left: ACTION.TRUCK,
        middle: ACTION.DOLLY,
        right: ACTION.ROTATE,
        wheel: ACTION.DOLLY,
      }}
      touches={{
        one: ACTION.TOUCH_TRUCK,
        two: ACTION.TOUCH_DOLLY_ROTATE,
        three: ACTION.TOUCH_ROTATE,
      }}
    />
  );
}

export interface LockerSceneProps {
  layout: LockerLayout;
  photoUrls: Record<string, string>;
  photoIdFor: (item: Item) => string | undefined;
  selectedId?: string;
  onSelect: (item: Item | undefined) => void;
  zoneFocus?: LockerZone;
  onCanvas?: (canvas: HTMLCanvasElement) => void;
}

export function LockerScene({
  layout,
  photoUrls,
  photoIdFor,
  selectedId,
  onSelect,
  zoneFocus,
  onCanvas,
}: LockerSceneProps) {
  const selected = layout.cards.find((c) => c.item.id === selectedId);
  const focus = useMemo(
    () => (selected ? { x: selected.x, y: selected.y } : undefined),
    [selected],
  );
  const zone = layout.zones.find((z) => z.zone === zoneFocus);
  const zoneTarget = useMemo(
    () => (zone ? { x: zone.x, y: zone.y, width: zone.width } : undefined),
    [zone],
  );

  return (
    <Canvas
      shadows="percentage"
      dpr={[1, 2]}
      camera={{ position: [0, 1.6, 6], fov: 45, near: 0.05, far: 100 }}
      gl={{ preserveDrawingBuffer: true, antialias: true }}
      onCreated={({ gl }) => onCanvas?.(gl.domElement)}
      onPointerMissed={() => onSelect(undefined)}
      data-testid="locker-canvas"
    >
      <color attach="background" args={['#1a120c']} />
      <fog attach="fog" args={['#1a120c', 8, 18]} />
      <ambientLight intensity={0.55} color="#ffe6cc" />
      <hemisphereLight args={['#ffe2bd', '#3a2414', 0.6]} />
      <directionalLight
        position={[2, 4, 5]}
        intensity={1.1}
        color="#fff1dd"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-layout.width / 2 - 1}
        shadow-camera-right={layout.width / 2 + 1}
        shadow-camera-top={3}
        shadow-camera-bottom={-1}
        shadow-bias={-0.0005}
      />
      <Room width={layout.width} />
      {layout.zones.map((z) => (
        <ZoneSign key={z.zone} label={z.label} count={z.count} x={z.x} width={z.width} />
      ))}
      {layout.cards.map((card) => {
        const photoId = photoIdFor(card.item);
        return (
          <GearCard3D
            key={card.item.id}
            item={card.item}
            x={card.x}
            y={card.y}
            photoUrl={photoId ? photoUrls[photoId] : undefined}
            selected={card.item.id === selectedId}
            onSelect={onSelect}
          />
        );
      })}
      <CameraRig layout={layout} focus={focus} zoneFocus={zoneTarget} />
    </Canvas>
  );
}
