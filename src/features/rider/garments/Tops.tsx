import { Vector3 } from 'three';
import { torsoLayerProfile } from '../geometry';
import { FabricMaterial, Segment, Selectable, TorsoShape, type GarmentProps } from '../parts';
import { LAYER_OFFSET, lerpPoint, peelScale } from '../rig';
import { usePatternTexture } from '../usePatternTexture';
import { shade } from '../patternTexture';
import { BODY } from '../skeleton';

const TOP_STYLE = {
  jacket: { offset: LAYER_OFFSET.jacket, hem: -0.15, flare: 0.022, collar: 0.09, cuff: 0.012 },
  puffy: { offset: LAYER_OFFSET.puffy, hem: -0.13, flare: 0.012, collar: 0.08, cuff: 0.008 },
  midTop: { offset: LAYER_OFFSET.mid, hem: -0.1, flare: 0.006, collar: 0.06, cuff: 0.002 },
  baseTop: { offset: LAYER_OFFSET.base, hem: -0.05, flare: 0, collar: 0, cuff: 0 },
} as const;

const NECK_TOP = 0.535;

/** Jackets, puffies, mid-layers and base tops: torso, sleeves, collar and details. */
export function TopGarment({ look, skeleton: s, fade, highlighted, onSelect }: GarmentProps) {
  const kind =
    look.garment === 'jacket' || look.garment === 'puffy' || look.garment === 'midTop'
      ? look.garment
      : 'baseTop';
  const style = TOP_STYLE[kind];
  const map = usePatternTexture(look.pattern, look.colors);
  const { primary, secondary, accent } = look.colors;
  const blocked = look.pattern === 'colorBlock' && secondary;
  const sleeveColor = blocked ? secondary : primary;
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

  const torsoProfile = torsoLayerProfile(o, style.hem, NECK_TOP, { flare: style.flare });
  const zipColor = accent ?? shade(primary, -0.35);

  return (
    <Selectable onSelect={onSelect} visible={fade < 0.999}>
      <TorsoShape skeleton={s} shapeKey={`top:${kind}`} profile={torsoProfile} radialScale={scale}>
        {mat(primary, { textured: true, doubleSide: true })}
      </TorsoShape>

      {blocked && (
        <TorsoShape
          skeleton={s}
          shapeKey={`top:${kind}:yoke`}
          profile={torsoLayerProfile(o + 0.003, 0.36, NECK_TOP)}
          radialScale={scale}
        >
          {mat(secondary)}
        </TorsoShape>
      )}

      {kind !== 'baseTop' && (
        <TorsoShape
          skeleton={s}
          shapeKey={`top:${kind}:zip`}
          profile={torsoLayerProfile(o + 0.004, style.hem + 0.01, NECK_TOP)}
          phiStart={-0.025}
          phiLength={0.05}
          radialScale={scale}
        >
          {mat(zipColor)}
        </TorsoShape>
      )}

      {kind === 'puffy' &&
        [-0.08, 0.04, 0.16, 0.28, 0.4].map((y) => (
          <TorsoShape
            key={y}
            skeleton={s}
            shapeKey={`top:puffy:baffle:${y}`}
            profile={torsoLayerProfile(o + 0.003, y, y + 0.012)}
            radialScale={scale}
          >
            {mat(shade(primary, -0.22))}
          </TorsoShape>
        ))}

      {(['L', 'R'] as const).map((side) => (
        <group key={side}>
          <Segment
            from={s.elbow[side]}
            to={s.shoulder[side]}
            rFrom={BODY.r.elbow + o}
            rTo={BODY.r.upperArmTop + o}
            radialScale={scale}
          >
            {mat(sleeveColor, { textured: !blocked })}
          </Segment>
          <Segment
            from={s.wrist[side]}
            to={s.elbow[side]}
            rFrom={BODY.r.wrist + o + style.cuff}
            rTo={BODY.r.elbow + o}
            radialScale={scale}
          >
            {mat(sleeveColor, { textured: !blocked })}
          </Segment>
          {kind === 'puffy' &&
            [0.3, 0.65].map((t) => (
              <Segment
                key={t}
                from={lerpPoint(s.wrist[side], s.shoulder[side], t)}
                to={lerpPoint(s.wrist[side], s.shoulder[side], t + 0.025)}
                rFrom={BODY.r.elbow + o + 0.003}
                rTo={BODY.r.elbow + o + 0.003}
                capped={false}
                radialScale={scale}
              >
                {mat(shade(sleeveColor, -0.22), { doubleSide: true })}
              </Segment>
            ))}
        </group>
      ))}

      {style.collar > 0 && (
        <Segment
          from={s.neckBase.clone().add(new Vector3(0, -0.03, 0).applyQuaternion(s.torsoQuat))}
          to={s.neckBase
            .clone()
            .add(new Vector3(0, style.collar - 0.02, 0).applyQuaternion(s.torsoQuat))}
          rFrom={BODY.r.neck + o + 0.022}
          rTo={BODY.r.neck + o + 0.012}
          capped={false}
          radialScale={scale}
        >
          {mat(primary, { doubleSide: true })}
        </Segment>
      )}

      {kind === 'jacket' && (
        // Stowed hood bunched behind the neck.
        <mesh
          position={s.neckBase
            .clone()
            .add(new Vector3(0, 0.0, -0.085).applyQuaternion(s.torsoQuat))}
          quaternion={s.torsoQuat}
          scale={[0.11 * scale, 0.06 * scale, 0.07 * scale]}
          castShadow
        >
          <sphereGeometry args={[1, 20, 12]} />
          {mat(blocked ? secondary : primary, { textured: !blocked })}
        </mesh>
      )}
    </Selectable>
  );
}
