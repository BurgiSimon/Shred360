import { useEffect, useRef, useState } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import type { Group } from 'three';
import { getCategory } from '@/domain/categories';
import { itemDisplayName } from '@/domain/items';
import type { Item } from '@/domain/types';
import { shade } from '../rider/patternTexture';
import { LOCKER } from './layout';
import { drawLabel, useCanvasTexture, useCoverTexture } from './textures';

const HANG = 0.12; // string length from peg to the top of the card

/** Colour tile with the category icon, for items without a photo. */
function drawFallback(item: Item) {
  return (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, item.colors.primary);
    g.addColorStop(1, item.colors.secondary ?? shade(item.colors.primary, -0.3));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.font = `${Math.round(h * 0.45)}px system-ui, 'Apple Color Emoji', 'Noto Color Emoji', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(getCategory(item.categoryId)?.icon ?? '🎿', w / 2, h / 2);
  };
}

export function GearCard3D({
  item,
  x,
  y,
  photoUrl,
  selected,
  onSelect,
}: {
  item: Item;
  x: number;
  y: number;
  photoUrl?: string;
  selected: boolean;
  onSelect: (item: Item) => void;
}) {
  const swing = useRef<Group>(null);
  const lift = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);
  const phase = useRef(((x * 13.7 + y * 7.3) % 1) * Math.PI * 2);
  const photo = useCoverTexture(photoUrl);
  const name = itemDisplayName(item);
  const subtitle = [item.brand, getCategory(item.categoryId)?.label].filter(Boolean).join(' · ');
  const label = useCanvasTexture(`label:${name}|${subtitle}`, 512, 112, drawLabel(name, subtitle));
  const fallback = useCanvasTexture(
    `fallback:${item.categoryId}:${item.colors.primary}:${item.colors.secondary ?? ''}`,
    256,
    256,
    drawFallback(item),
  );

  useEffect(() => {
    if (!hovered) return;
    document.body.style.cursor = 'pointer';
    return () => {
      document.body.style.cursor = '';
    };
  }, [hovered]);

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime;
    if (swing.current)
      swing.current.rotation.z = Math.sin(t * 0.9 + phase.current) * (hovered ? 0.05 : 0.018);
    if (lift.current) {
      const target = hovered || selected ? 1 : 0;
      const k = 1 - Math.exp(-delta * 10);
      lift.current.position.z += (target * 0.1 - lift.current.position.z) * k;
      const s = lift.current.scale.x + (1 + target * 0.06 - lift.current.scale.x) * k;
      lift.current.scale.setScalar(s);
    }
  });

  const size = LOCKER.cardSize;
  const frameW = size + 0.05;
  const frameH = size + 0.16;
  const top = y + frameH / 2;
  const frameColor = selected ? '#38bdf8' : '#f4efe6';

  return (
    <group position={[x, top + HANG, 0.05]}>
      {/* Peg */}
      <mesh position={[0, 0, -0.02]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.018, 0.018, 0.07, 12]} />
        <meshStandardMaterial color="#c9a26b" metalness={0.6} roughness={0.35} />
      </mesh>
      <group ref={swing}>
        <group ref={lift}>
          {/* Hanging string */}
          <mesh position={[-0.09, -HANG / 2, 0]} rotation={[0, 0, -0.5]}>
            <cylinderGeometry args={[0.0035, 0.0035, HANG * 1.15, 6]} />
            <meshStandardMaterial color="#2a2a2a" />
          </mesh>
          <mesh position={[0.09, -HANG / 2, 0]} rotation={[0, 0, 0.5]}>
            <cylinderGeometry args={[0.0035, 0.0035, HANG * 1.15, 6]} />
            <meshStandardMaterial color="#2a2a2a" />
          </mesh>
          <group
            position={[0, -HANG - frameH / 2, 0]}
            onClick={(e: ThreeEvent<MouseEvent>) => {
              e.stopPropagation();
              onSelect(item);
            }}
            onPointerOver={(e: ThreeEvent<PointerEvent>) => {
              e.stopPropagation();
              setHovered(true);
            }}
            onPointerOut={() => setHovered(false)}
          >
            <mesh castShadow>
              <boxGeometry args={[frameW, frameH, 0.022]} />
              <meshStandardMaterial
                color={frameColor}
                roughness={0.6}
                emissive={selected ? '#38bdf8' : '#000000'}
                emissiveIntensity={selected ? 0.4 : 0}
              />
            </mesh>
            {/* Item colour stripe along the top of the frame */}
            <mesh position={[0, frameH / 2 - 0.012, 0.0115]}>
              <planeGeometry args={[frameW, 0.024]} />
              <meshBasicMaterial color={item.colors.primary} toneMapped={false} />
            </mesh>
            <mesh position={[0, 0.045, 0.012]}>
              <planeGeometry args={[size, size]} />
              <meshBasicMaterial map={photo ?? fallback} toneMapped={false} />
            </mesh>
            <mesh position={[0, -frameH / 2 + 0.058, 0.012]}>
              <planeGeometry args={[size, size * (112 / 512)]} />
              <meshBasicMaterial map={label} toneMapped={false} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}
