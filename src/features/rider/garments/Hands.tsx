import { FabricMaterial, Segment, Selectable, type GarmentProps } from '../parts';
import { shade } from '../patternTexture';
import { thumbPoints } from '../rig';
import { BODY } from '../skeleton';

/** Gloves and mittens: an oversized hand shell, a thumb, and a gauntlet cuff over the sleeve. */
export function HandGear({ look, skeleton: s, highlighted, onSelect }: GarmentProps) {
  const mitten = look.garment === 'mittens';
  const { primary, secondary, accent } = look.colors;
  const bulk = mitten ? 0.02 : 0.013;
  const cuffColor = accent ?? secondary ?? shade(primary, -0.2);
  const mat = (color: string, doubleSide = false) => (
    <FabricMaterial
      color={color}
      finish={look.finish}
      highlighted={highlighted}
      doubleSide={doubleSide}
    />
  );
  return (
    <Selectable onSelect={onSelect}>
      {(['L', 'R'] as const).map((side) => {
        const dir = s.handTip[side].clone().sub(s.wrist[side]).normalize();
        const cuffStart = s.wrist[side].clone().sub(dir.clone().multiplyScalar(0.085));
        const [thumbBase, thumbTip] = thumbPoints(s, side);
        return (
          <group key={side}>
            <Segment
              from={s.wrist[side]}
              to={s.handTip[side]}
              rFrom={BODY.r.hand + bulk}
              rTo={BODY.r.hand + bulk - (mitten ? 0.002 : 0.006)}
            >
              {mat(primary)}
            </Segment>
            <Segment
              from={thumbBase}
              to={thumbTip}
              rFrom={0.02 + bulk * 0.5}
              rTo={0.017 + bulk * 0.5}
            >
              {mat(secondary ?? primary)}
            </Segment>
            <Segment
              from={cuffStart}
              to={s.wrist[side].clone().add(dir.multiplyScalar(0.012))}
              rFrom={BODY.r.wrist + 0.05}
              rTo={BODY.r.hand + bulk + 0.006}
              capped={false}
            >
              {mat(cuffColor, true)}
            </Segment>
          </group>
        );
      })}
    </Selectable>
  );
}
