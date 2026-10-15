import { Suspense } from 'react';
import { Billboard, Float, Image } from '@react-three/drei';
import type { OutfitSlot } from '@/domain/outfitSlots';
import { HIGHLIGHT } from './rig';

export interface PhotoCard {
  slot: OutfitSlot;
  url: string;
  label: string;
}

const SLOT_HEIGHT: Record<OutfitSlot, number> = {
  head: 1.78,
  eyes: 1.62,
  neck: 1.45,
  shellTop: 1.3,
  midTop: 1.15,
  baseTop: 1.0,
  hands: 0.85,
  shellBottom: 0.6,
  baseBottom: 0.45,
  socks: 0.3,
};

/** Spread cards on alternating sides of the rider, slightly behind so they frame rather than block. */
function cardPosition(index: number, slot: OutfitSlot): [number, number, number] {
  const side = index % 2 === 0 ? 1 : -1;
  const angle = side * (1.25 + Math.floor(index / 2) * 0.32);
  const radius = 1.15;
  return [Math.sin(angle) * radius, SLOT_HEIGHT[slot], Math.cos(angle) * radius];
}

/** The real photos of the items in the outfit, floating around the rider. */
export function PhotoCards({
  cards,
  selected,
  onSelect,
}: {
  cards: PhotoCard[];
  selected?: OutfitSlot;
  onSelect?: (slot: OutfitSlot) => void;
}) {
  return (
    <group>
      {cards.map((card, i) => {
        const active = card.slot === selected;
        return (
          <Float
            key={card.slot}
            speed={1.6}
            rotationIntensity={0.15}
            floatIntensity={0.35}
            floatingRange={[-0.03, 0.03]}
          >
            <Billboard position={cardPosition(i, card.slot)}>
              <group
                scale={active ? 1.18 : 1}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect?.(card.slot);
                }}
              >
                <mesh position={[0, 0, -0.004]}>
                  <planeGeometry args={[0.37, 0.37]} />
                  <meshBasicMaterial color={active ? HIGHLIGHT : '#ffffff'} toneMapped={false} />
                </mesh>
                <Suspense fallback={null}>
                  <Image url={card.url} scale={[0.33, 0.33]} radius={0.02} toneMapped={false} />
                </Suspense>
              </group>
            </Billboard>
          </Float>
        );
      })}
    </group>
  );
}
