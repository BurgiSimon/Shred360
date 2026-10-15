import { useMemo } from 'react';
import { Vector3 } from 'three';
import type { OutfitLook } from '@/domain/outfitLook';
import type { OutfitSlot } from '@/domain/outfitSlots';
import type { Discipline } from '@/domain/types';
import { TORSO_PROFILE } from './geometry';
import { BottomGarment, Socks } from './garments/Bottoms';
import { Beanie, Goggles, HeadSpace, Helmet, Neckwear } from './garments/Head';
import { HandGear } from './garments/Hands';
import { TopGarment } from './garments/Tops';
import { Hardgoods } from './Hardgoods';
import { Segment, TorsoShape, type GarmentProps } from './parts';
import { layerFade, thumbPoints } from './rig';
import { BODY, computeSkeleton, type Skeleton } from './skeleton';

const SKIN = '#d9b99c';
const SKIN_ROUGHNESS = 0.55;

function Mannequin({ skeleton: s, showFace }: { skeleton: Skeleton; showFace: boolean }) {
  const skin = <meshStandardMaterial color={SKIN} roughness={SKIN_ROUGHNESS} />;
  return (
    <group>
      <TorsoShape skeleton={s} shapeKey="skin:torso" profile={TORSO_PROFILE}>
        {skin}
      </TorsoShape>
      <Segment
        from={s.neckBase.clone().add(new Vector3(0, -0.04, 0))}
        to={s.head}
        rFrom={BODY.r.neck}
        rTo={BODY.r.neck}
      >
        {skin}
      </Segment>
      <HeadSpace skeleton={s}>
        <mesh castShadow>
          <sphereGeometry args={[BODY.headR, 32, 24]} />
          {skin}
        </mesh>
        {showFace && (
          <group>
            {[-1, 1].map((x) => (
              <mesh key={x} position={[x * 0.036, 0.012, BODY.headR * 0.93]}>
                <sphereGeometry args={[0.011, 12, 8]} />
                <meshStandardMaterial color="#1b2232" roughness={0.3} />
              </mesh>
            ))}
          </group>
        )}
        <mesh position={[0, -0.012, BODY.headR * 0.98]} scale={[0.8, 1.2, 1]}>
          <sphereGeometry args={[0.016, 12, 8]} />
          {skin}
        </mesh>
      </HeadSpace>
      {(['L', 'R'] as const).map((side) => {
        const [thumbBase, thumbTip] = thumbPoints(s, side);
        return (
          <group key={side}>
            <Segment
              from={s.elbow[side]}
              to={s.shoulder[side]}
              rFrom={BODY.r.elbow}
              rTo={BODY.r.upperArmTop}
            >
              {skin}
            </Segment>
            <Segment
              from={s.wrist[side]}
              to={s.elbow[side]}
              rFrom={BODY.r.wrist}
              rTo={BODY.r.elbow}
            >
              {skin}
            </Segment>
            {/* The hand starts just past the wrist so it doesn't intersect sleeve cuffs. */}
            <Segment
              from={s.wrist[side].clone().lerp(s.handTip[side], 0.18)}
              to={s.handTip[side]}
              rFrom={BODY.r.hand}
              rTo={BODY.r.hand - 0.008}
            >
              {skin}
            </Segment>
            <Segment from={thumbBase} to={thumbTip} rFrom={0.017} rTo={0.014}>
              {skin}
            </Segment>
            <Segment from={s.knee[side]} to={s.hip[side]} rFrom={BODY.r.knee} rTo={BODY.r.thighTop}>
              {skin}
            </Segment>
            <Segment from={s.ankle[side]} to={s.knee[side]} rFrom={BODY.r.ankle} rTo={BODY.r.knee}>
              {skin}
            </Segment>
          </group>
        );
      })}
    </group>
  );
}

export interface RiderProps {
  look: OutfitLook;
  discipline: Discipline;
  /** Layer peel: 0 = dressed, 1 = shells peeled, 2 = mid-layers peeled too. */
  peel?: number;
  highlightedSlot?: OutfitSlot;
  onSelectSlot?: (slot: OutfitSlot) => void;
}

/** The dressed 3D rider standing on their board or skis. */
export function Rider({ look, discipline, peel = 0, highlightedSlot, onSelectSlot }: RiderProps) {
  const skeleton = useMemo(() => computeSkeleton(discipline), [discipline]);
  const outerFade = layerFade(peel, 'outer');
  const midFade = layerFade(peel, 'mid');

  const props = (slot: OutfitSlot, fade = 0): Omit<GarmentProps, 'look'> => ({
    skeleton,
    fade,
    highlighted: highlightedSlot === slot,
    onSelect: onSelectSlot ? () => onSelectSlot(slot) : undefined,
  });

  return (
    <group>
      <Mannequin skeleton={skeleton} showFace={!look.eyes} />
      <Hardgoods skeleton={skeleton} discipline={discipline} />

      {look.baseBottom && <BottomGarment look={look.baseBottom} {...props('baseBottom')} />}
      {look.socks && <Socks look={look.socks} {...props('socks')} />}
      {look.baseTop && <TopGarment look={look.baseTop} {...props('baseTop')} />}
      {look.midTop && <TopGarment look={look.midTop} {...props('midTop', midFade)} />}
      {look.shellBottom && (
        <BottomGarment look={look.shellBottom} {...props('shellBottom', outerFade)} />
      )}
      {look.shellTop && <TopGarment look={look.shellTop} {...props('shellTop', outerFade)} />}
      {look.neck && <Neckwear look={look.neck} {...props('neck')} />}
      {look.hands && <HandGear look={look.hands} {...props('hands')} />}
      {look.head?.garment === 'helmet' && <Helmet look={look.head} {...props('head')} />}
      {look.head?.garment === 'beanie' && <Beanie look={look.head} {...props('head')} />}
      {look.eyes && (
        <Goggles look={look.eyes} overHelmet={look.head?.garment === 'helmet'} {...props('eyes')} />
      )}
    </group>
  );
}
