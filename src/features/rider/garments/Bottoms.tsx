import { Vector3 } from 'three';
import { FabricMaterial, Segment, Selectable, TorsoShape, type GarmentProps } from '../parts';
import { LAYER_OFFSET, lerpPoint, peelScale } from '../rig';
import { usePatternTexture } from '../usePatternTexture';
import { shade } from '../patternTexture';
import { BODY } from '../skeleton';

/** Hip/seat shape around the pelvis, relative to the pelvis joint. */
function seatProfile(offset: number, top: number): [number, number][] {
  return [
    [0.0, -0.15],
    [0.1 + offset, -0.14],
    [0.145 + offset, -0.07],
    [0.14 + offset, 0.02],
    [0.132 + offset, top],
  ];
}

const BOTTOM_STYLE = {
  pants: { offset: LAYER_OFFSET.outer, extra: 0.014, bell: 0.05, top: 0.06 },
  bibs: { offset: LAYER_OFFSET.outer, extra: 0.014, bell: 0.05, top: 0.06 },
  baseBottom: { offset: LAYER_OFFSET.base, extra: 0, bell: 0, top: 0.08 },
} as const;

/** Pants, bibs and base-layer bottoms: seat, legs, and for bibs the chest panel and straps. */
export function BottomGarment({ look, skeleton: s, fade, highlighted, onSelect }: GarmentProps) {
  const kind = look.garment === 'pants' || look.garment === 'bibs' ? look.garment : 'baseBottom';
  const style = BOTTOM_STYLE[kind];
  const map = usePatternTexture(look.pattern, look.colors);
  const { primary, secondary } = look.colors;
  const blocked = look.pattern === 'colorBlock' && secondary;
  const scale = peelScale(fade);
  const o = style.offset;
  const mat = (color: string, opts: { textured?: boolean; doubleSide?: boolean } = {}) => (
    <FabricMaterial
      color={color}
      finish={look.finish}
      map={opts.textured ? map : null}
      fade={fade}
      highlighted={highlighted}
      doubleSide={opts.doubleSide}
    />
  );

  return (
    <Selectable onSelect={onSelect} visible={fade < 0.999}>
      <TorsoShape
        skeleton={s}
        shapeKey={`bottom:${kind}:seat`}
        profile={seatProfile(o, style.top)}
        radialScale={scale}
        pelvisAligned
        depth={0.72}
      >
        {mat(primary, { textured: true, doubleSide: true })}
      </TorsoShape>

      {(['L', 'R'] as const).map((side) => {
        // Pants hang a little past the ankle so they cover the boot cuff.
        const cuffEnd = s.ankle[side].clone().add(new Vector3(0, style.bell ? -0.02 : 0.02, 0));
        return (
          <group key={side}>
            <Segment
              from={s.knee[side]}
              to={s.hip[side]}
              rFrom={BODY.r.knee + o + style.extra}
              rTo={BODY.r.thighTop + o + style.extra}
              radialScale={scale}
            >
              {mat(primary, { textured: true })}
            </Segment>
            <Segment
              from={cuffEnd}
              to={s.knee[side]}
              rFrom={BODY.r.ankle + o + style.bell}
              rTo={BODY.r.knee + o + style.extra}
              capped={!style.bell}
              radialScale={scale}
            >
              {mat(primary, { textured: true, doubleSide: Boolean(style.bell) })}
            </Segment>
            {blocked && (
              <Segment
                from={lerpPoint(s.knee[side], cuffEnd, 0.22)}
                to={lerpPoint(s.knee[side], s.hip[side], 0.22)}
                rFrom={BODY.r.knee + o + style.extra + 0.004}
                rTo={BODY.r.knee + o + style.extra + 0.004}
                radialScale={scale}
              >
                {mat(secondary)}
              </Segment>
            )}
          </group>
        );
      })}

      {kind === 'bibs' && (
        <>
          {/* Front chest panel, sitting between the mid-layer and the jacket. */}
          <TorsoShape
            skeleton={s}
            shapeKey="bottom:bibs:panel"
            profile={[
              [0.142 + LAYER_OFFSET.mid + 0.006, 0.05],
              [0.135 + LAYER_OFFSET.mid + 0.006, 0.18],
              [0.15 + LAYER_OFFSET.mid + 0.006, 0.3],
              [0.162 + LAYER_OFFSET.mid + 0.006, 0.36],
            ]}
            phiStart={-0.75}
            phiLength={1.5}
            radialScale={scale}
          >
            {mat(blocked ? secondary : primary, { doubleSide: true })}
          </TorsoShape>
          {(['L', 'R'] as const).map((side) => {
            const sign = side === 'L' ? 1 : -1;
            const front = s.pelvis
              .clone()
              .add(new Vector3(sign * 0.07, 0.36, 0.12).applyQuaternion(s.torsoQuat));
            const top = s.pelvis
              .clone()
              .add(new Vector3(sign * 0.09, 0.5, 0.0).applyQuaternion(s.torsoQuat));
            const back = s.pelvis
              .clone()
              .add(new Vector3(sign * 0.05, 0.3, -0.13).applyQuaternion(s.torsoQuat));
            return (
              <group key={side}>
                <Segment from={front} to={top} rFrom={0.012} rTo={0.012} radialScale={scale}>
                  {mat(shade(primary, -0.25))}
                </Segment>
                <Segment from={top} to={back} rFrom={0.012} rTo={0.012} radialScale={scale}>
                  {mat(shade(primary, -0.25))}
                </Segment>
              </group>
            );
          })}
        </>
      )}
    </Selectable>
  );
}

/** Socks peek out between the boot and the base layer when the pants are peeled. */
export function Socks({ look, skeleton: s, fade, highlighted, onSelect }: GarmentProps) {
  return (
    <Selectable onSelect={onSelect} visible={fade < 0.999}>
      {(['L', 'R'] as const).map((side) => (
        <Segment
          key={side}
          from={s.ankle[side]}
          to={lerpPoint(s.ankle[side], s.knee[side], 0.45)}
          rFrom={BODY.r.ankle + LAYER_OFFSET.base + 0.005}
          rTo={BODY.r.knee - 0.004 + LAYER_OFFSET.base + 0.005}
        >
          <FabricMaterial
            color={look.colors.primary}
            finish="matte"
            fade={fade}
            highlighted={highlighted}
          />
        </Segment>
      ))}
    </Selectable>
  );
}
