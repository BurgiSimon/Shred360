import { useEffect, useMemo } from 'react';
import { RoundedBox } from '@react-three/drei';
import {
  BoxGeometry,
  CanvasTexture,
  DoubleSide,
  ExtrudeGeometry,
  Quaternion,
  Shape,
  SRGBColorSpace,
  Vector3,
} from 'three';
import type { Discipline } from '@/domain/types';
import { Segment } from './parts';
import { UP } from './rig';
import { BOARD_TOP, BODY, SKI_TOP, type Side, type Skeleton } from './skeleton';

/**
 * Generic hardgoods until real boards/skis/boots can be added to the wardrobe: a snowboard with
 * bindings or a pair of skis with poles, plus boots.
 */

const BOOT_COLOR = '#1d222c';
const BINDING_COLOR = '#2b313d';
const STRAP_COLOR = '#ff7a3d';

function useBoardTexture(length: number, width: number) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 192;
    const ctx = canvas.getContext('2d')!;
    const g = ctx.createLinearGradient(0, 0, canvas.width, 0);
    g.addColorStop(0, '#0b1220');
    g.addColorStop(0.35, '#1e3a8a');
    g.addColorStop(0.65, '#0ea5e9');
    g.addColorStop(1, '#0b1220');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 6;
    for (let x = -200; x < canvas.width; x += 70) {
      ctx.beginPath();
      ctx.moveTo(x, canvas.height);
      ctx.lineTo(x + 160, 0);
      ctx.stroke();
    }
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 92px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SHRED', canvas.width * 0.3, canvas.height / 2);
    ctx.fillStyle = '#ff7a3d';
    ctx.fillText('360', canvas.width * 0.7, canvas.height / 2);
    const t = new CanvasTexture(canvas);
    t.colorSpace = SRGBColorSpace;
    // Extrude UVs are in shape units (metres), centred on the board.
    t.repeat.set(1 / length, 1 / width);
    t.offset.set(0.5, 0.5);
    return t;
  }, [length, width]);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

function Snowboard() {
  const length = 1.56;
  const width = 0.27;
  const geometry = useMemo(() => {
    const r = width / 2;
    const half = length / 2 - r;
    const shape = new Shape();
    shape.moveTo(-half, -r);
    shape.lineTo(half, -r * 0.94);
    shape.absarc(half, 0, r, -Math.PI / 2, Math.PI / 2, false);
    shape.lineTo(-half, r * 0.94);
    shape.absarc(-half, 0, r, Math.PI / 2, (3 * Math.PI) / 2, false);
    const g = new ExtrudeGeometry(shape, {
      depth: 0.012,
      bevelEnabled: true,
      bevelThickness: 0.004,
      bevelSize: 0.004,
      bevelSegments: 2,
      curveSegments: 24,
    });
    // Lie flat: shape XY → world XZ, top face up.
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);
  const texture = useBoardTexture(length, width);
  return (
    <mesh geometry={geometry} position={[0, 0.006, 0.03]} castShadow receiveShadow>
      <meshPhysicalMaterial map={texture} roughness={0.35} clearcoat={0.8} />
    </mesh>
  );
}

function Ski({ x }: { x: number }) {
  const length = 1.72;
  const geometry = useMemo(() => {
    const g = new BoxGeometry(0.085, 0.018, length, 1, 1, 40);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const z = pos.getZ(i);
      const tip = z - (length / 2 - 0.24);
      if (tip > 0) pos.setY(i, pos.getY(i) + (tip / 0.24) ** 2 * 0.085);
      const tail = -z - (length / 2 - 0.1);
      if (tail > 0) pos.setY(i, pos.getY(i) + (tail / 0.1) ** 2 * 0.025);
    }
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <group position={[x, SKI_TOP - 0.009, 0.08]}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshPhysicalMaterial color="#1e3a8a" roughness={0.3} clearcoat={0.8} />
      </mesh>
      <mesh position={[0, 0.0095, 0.25]}>
        <boxGeometry args={[0.03, 0.001, 0.5]} />
        <meshStandardMaterial color="#ff7a3d" />
      </mesh>
    </group>
  );
}

function Pole({ grip, tip }: { grip: Vector3; tip: Vector3 }) {
  const top = grip.clone().add(new Vector3(0, 0.05, 0));
  const basket = tip.clone().lerp(top, 0.08);
  const quaternion = useMemo(
    () => new Quaternion().setFromUnitVectors(UP, top.clone().sub(tip).normalize()),
    [top, tip],
  );
  return (
    <group>
      <Segment from={tip} to={top} rFrom={0.006} rTo={0.009}>
        <meshStandardMaterial color="#c9d1dc" metalness={0.8} roughness={0.3} />
      </Segment>
      <Segment from={grip.clone().add(new Vector3(0, -0.06, 0))} to={top} rFrom={0.017} rTo={0.019}>
        <meshStandardMaterial color="#111318" roughness={0.8} />
      </Segment>
      <mesh position={basket} quaternion={quaternion}>
        <cylinderGeometry args={[0.045, 0.045, 0.006, 20]} />
        <meshStandardMaterial color="#111318" roughness={0.7} />
      </mesh>
    </group>
  );
}

function Boot({
  skeleton: s,
  side,
  discipline,
}: {
  skeleton: Skeleton;
  side: Side;
  discipline: Discipline;
}) {
  const ski = discipline === 'ski';
  const height = ski ? 0.2 : 0.15;
  const ankle = s.ankle[side];
  const sole = s.standY;
  const shinDir = s.knee[side].clone().sub(ankle).normalize();
  return (
    <group>
      <group position={[ankle.x, sole, ankle.z]} rotation={[0, s.footYaw[side], 0]}>
        <RoundedBox
          args={[0.115, height * 0.55, 0.3]}
          radius={0.035}
          position={[0, height * 0.275, 0.045]}
          castShadow
        >
          <meshStandardMaterial
            color={ski ? '#d9dee7' : BOOT_COLOR}
            roughness={ski ? 0.35 : 0.75}
          />
        </RoundedBox>
        <mesh position={[0, 0.006, 0.045]}>
          <boxGeometry args={[0.12, 0.012, 0.31]} />
          <meshStandardMaterial color="#0d0f13" roughness={0.9} />
        </mesh>
      </group>
      {/* Boot cuff around the lower shin. */}
      <Segment
        from={new Vector3(ankle.x, sole + height * 0.35, ankle.z)}
        to={ankle.clone().add(shinDir.multiplyScalar(height * 0.75))}
        rFrom={BODY.r.ankle + 0.03}
        rTo={BODY.r.ankle + 0.034}
      >
        <meshStandardMaterial color={ski ? '#d9dee7' : BOOT_COLOR} roughness={ski ? 0.35 : 0.75} />
      </Segment>
    </group>
  );
}

function Binding({ skeleton: s, side }: { skeleton: Skeleton; side: Side }) {
  const ankle = s.ankle[side];
  return (
    <group position={[ankle.x, BOARD_TOP, ankle.z]} rotation={[0, s.footYaw[side], 0]}>
      <mesh position={[0, 0.004, 0.04]}>
        <boxGeometry args={[0.15, 0.008, 0.26]} />
        <meshStandardMaterial color={BINDING_COLOR} roughness={0.6} />
      </mesh>
      {/* Highback behind the calf. */}
      <mesh position={[0, 0.17, 0]} rotation={[-0.25, 0, 0]}>
        <cylinderGeometry args={[0.085, 0.08, 0.26, 20, 1, true, Math.PI - 1.1, 2.2]} />
        <meshStandardMaterial color={BINDING_COLOR} roughness={0.5} side={DoubleSide} />
      </mesh>
      {/* Ankle and toe straps. */}
      <mesh position={[0, 0.12, 0.045]} rotation={[0.35, 0, 0]}>
        <boxGeometry args={[0.15, 0.03, 0.09]} />
        <meshStandardMaterial color={STRAP_COLOR} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.06, 0.16]} rotation={[0.2, 0, 0]}>
        <boxGeometry args={[0.14, 0.025, 0.06]} />
        <meshStandardMaterial color={STRAP_COLOR} roughness={0.5} />
      </mesh>
    </group>
  );
}

export function Hardgoods({
  skeleton,
  discipline,
}: {
  skeleton: Skeleton;
  discipline: Discipline;
}) {
  return (
    <group>
      <Boot skeleton={skeleton} side="L" discipline={discipline} />
      <Boot skeleton={skeleton} side="R" discipline={discipline} />
      {discipline === 'snowboard' ? (
        <>
          <Snowboard />
          <Binding skeleton={skeleton} side="L" />
          <Binding skeleton={skeleton} side="R" />
        </>
      ) : (
        <>
          <Ski x={skeleton.ankle.L.x} />
          <Ski x={skeleton.ankle.R.x} />
          <Pole
            grip={skeleton.wrist.L}
            tip={new Vector3(skeleton.wrist.L.x + 0.1, 0, skeleton.wrist.L.z - 0.2)}
          />
          <Pole
            grip={skeleton.wrist.R}
            tip={new Vector3(skeleton.wrist.R.x - 0.1, 0, skeleton.wrist.R.z - 0.2)}
          />
        </>
      )}
    </group>
  );
}
