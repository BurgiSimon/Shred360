import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import { DoubleSide, FrontSide, Quaternion, type Texture, type Vector3 } from 'three';
import type { GarmentLook } from '@/domain/outfitLook';
import type { Finish } from '@/domain/types';
import { profileGeometry, taperGeometry, TORSO_DEPTH } from './geometry';
import { HIGHLIGHT, UP } from './rig';
import type { Skeleton } from './skeleton';

/** Props every garment component receives. */
export interface GarmentProps {
  look: GarmentLook;
  skeleton: Skeleton;
  /** 0 = fully worn, 1 = peeled away (layer-peel slider). */
  fade: number;
  highlighted: boolean;
  onSelect?: () => void;
}

export function FabricMaterial({
  color,
  finish = 'matte',
  map,
  fade = 0,
  highlighted = false,
  doubleSide = false,
}: {
  color: string;
  finish?: Finish;
  map?: Texture | null;
  fade?: number;
  highlighted?: boolean;
  doubleSide?: boolean;
}) {
  const sheen = finish === 'sheen';
  return (
    <meshPhysicalMaterial
      // Swapping a map in or out needs a new shader program, so remount the material instead.
      key={map ? 'textured' : 'plain'}
      color={map ? '#ffffff' : color}
      map={map ?? null}
      roughness={sheen ? 0.32 : 0.8}
      clearcoat={sheen ? 0.6 : 0}
      clearcoatRoughness={0.25}
      sheen={sheen ? 0.1 : 0.35}
      sheenRoughness={0.6}
      sheenColor={color}
      envMapIntensity={0.7}
      transparent={fade > 0}
      opacity={1 - fade}
      depthWrite={fade < 0.35}
      emissive={highlighted ? HIGHLIGHT : '#000000'}
      emissiveIntensity={highlighted ? 0.22 : 0}
      side={doubleSide ? DoubleSide : FrontSide}
    />
  );
}

/** Wraps a garment's meshes: click to select, pointer cursor on hover. */
export function Selectable({
  onSelect,
  visible = true,
  children,
}: {
  onSelect?: () => void;
  visible?: boolean;
  children: ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  useEffect(() => {
    if (!hovered) return;
    document.body.style.cursor = 'pointer';
    return () => {
      document.body.style.cursor = '';
    };
  }, [hovered]);
  if (!visible) return null;
  return (
    <group
      onClick={(e: ThreeEvent<MouseEvent>) => {
        if (!onSelect) return;
        e.stopPropagation();
        onSelect();
      }}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        if (!onSelect) return;
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      {children}
    </group>
  );
}

/** A tapered capsule from one joint to another. Children are the material. */
export function Segment({
  from,
  to,
  rFrom,
  rTo,
  capped = true,
  radialScale = 1,
  children,
}: {
  from: Vector3;
  to: Vector3;
  rFrom: number;
  rTo: number;
  capped?: boolean;
  radialScale?: number;
  children: ReactNode;
}) {
  const { quaternion, length } = useMemo(() => {
    const dir = to.clone().sub(from);
    const len = dir.length();
    return { quaternion: new Quaternion().setFromUnitVectors(UP, dir.normalize()), length: len };
  }, [from, to]);
  const safeLength = Math.max(length, 0.01);
  return (
    <mesh
      geometry={taperGeometry(rFrom, rTo, safeLength, capped)}
      position={from}
      quaternion={quaternion}
      scale={[radialScale, safeLength, radialScale]}
      castShadow
    >
      {children}
    </mesh>
  );
}

/** A lathe around the torso axis (pelvis → chest), flattened front to back. */
export function TorsoShape({
  skeleton,
  shapeKey,
  profile,
  phiStart,
  phiLength,
  radialScale = 1,
  pelvisAligned = false,
  depth = TORSO_DEPTH,
  children,
}: {
  skeleton: Skeleton;
  shapeKey: string;
  profile: readonly (readonly [number, number])[];
  phiStart?: number;
  phiLength?: number;
  radialScale?: number;
  /** Follow the hips (pants) instead of the upper body (tops). */
  pelvisAligned?: boolean;
  depth?: number;
  children: ReactNode;
}) {
  return (
    <mesh
      geometry={profileGeometry(shapeKey, profile, phiStart, phiLength)}
      position={skeleton.pelvis}
      quaternion={pelvisAligned ? skeleton.pelvisQuat : skeleton.torsoQuat}
      scale={[radialScale, 1, depth * radialScale]}
      castShadow
    >
      {children}
    </mesh>
  );
}
