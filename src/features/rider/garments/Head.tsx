import type { ReactNode } from 'react';
import { DoubleSide, Vector3 } from 'three';
import { FabricMaterial, Segment, Selectable, type GarmentProps } from '../parts';
import { HEAD_SCALE, HELMET_R, HIGHLIGHT } from '../rig';
import { usePatternTexture } from '../usePatternTexture';
import { shade } from '../patternTexture';
import { BODY, type Skeleton } from '../skeleton';

const R = BODY.headR;

export function HeadSpace({ skeleton, children }: { skeleton: Skeleton; children: ReactNode }) {
  return (
    <group position={skeleton.head} quaternion={skeleton.headQuat} scale={HEAD_SCALE}>
      {children}
    </group>
  );
}

export function Helmet({ look, skeleton, highlighted, onSelect }: GarmentProps) {
  const { primary, secondary, accent } = look.colors;
  const lower = secondary ?? primary;
  const mat = (color: string) => (
    <FabricMaterial
      color={color}
      finish={look.finish === 'matte' ? 'matte' : 'sheen'}
      highlighted={highlighted}
      doubleSide
    />
  );
  return (
    <Selectable onSelect={onSelect}>
      <HeadSpace skeleton={skeleton}>
        {/* Dome, tilted back a touch so the brow line sits above the goggles. */}
        <group rotation={[-0.18, 0, 0]} position={[0, 0.012, -0.008]}>
          <mesh castShadow>
            <sphereGeometry args={[HELMET_R, 40, 20, 0, Math.PI * 2, 0, 1.3]} />
            {mat(primary)}
          </mesh>
          {/* Back and ear coverage, open at the face. */}
          <mesh castShadow>
            <sphereGeometry args={[HELMET_R, 40, 12, Math.PI - 0.55, Math.PI + 1.1, 1.3, 0.62]} />
            {mat(lower)}
          </mesh>
          {/* Vents along the top. */}
          {[-0.05, 0, 0.05].map((x) => (
            <mesh key={x} position={[x, HELMET_R * 0.97, 0.01]} rotation={[0, 0, x * 3]}>
              <boxGeometry args={[0.014, 0.012, 0.07]} />
              <meshStandardMaterial color={accent ?? shade(primary, -0.45)} roughness={0.6} />
            </mesh>
          ))}
          {/* Small visor. */}
          <mesh position={[0, HELMET_R * 0.42, HELMET_R * 0.86]} rotation={[0.55, 0, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 0.008, 24, 1, false, -0.9, 1.8]} />
            {mat(lower)}
          </mesh>
        </group>
      </HeadSpace>
    </Selectable>
  );
}

export function Beanie({ look, skeleton, highlighted, onSelect }: GarmentProps) {
  const { primary, secondary, accent } = look.colors;
  const map = usePatternTexture(look.pattern, look.colors);
  return (
    <Selectable onSelect={onSelect}>
      <HeadSpace skeleton={skeleton}>
        <group rotation={[-0.15, 0, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[R + 0.012, 36, 16, 0, Math.PI * 2, 0, 1.4]} />
            <FabricMaterial color={primary} map={map} highlighted={highlighted} />
          </mesh>
          <mesh position={[0, Math.cos(1.33) * (R + 0.02), 0]}>
            <cylinderGeometry args={[R + 0.02, R + 0.018, 0.05, 36, 1, true]} />
            <FabricMaterial
              color={secondary ?? shade(primary, -0.15)}
              highlighted={highlighted}
              doubleSide
            />
          </mesh>
          {accent && (
            <mesh position={[0, R + 0.04, 0]} castShadow>
              <icosahedronGeometry args={[0.038, 2]} />
              <FabricMaterial color={accent} highlighted={highlighted} />
            </mesh>
          )}
        </group>
      </HeadSpace>
    </Selectable>
  );
}

/** Goggles: frame, mirrored lens tinted by the lens colour, and a strap (around the helmet if any). */
export function Goggles({
  look,
  skeleton,
  highlighted,
  onSelect,
  overHelmet,
}: GarmentProps & { overHelmet: boolean }) {
  const { primary, secondary, accent } = look.colors;
  const frameR = R + 0.036;
  const strapR = overHelmet ? HELMET_R + 0.004 : R + 0.012;
  return (
    <Selectable onSelect={onSelect}>
      <HeadSpace skeleton={skeleton}>
        <group position={[0, 0.006, 0.004]}>
          <mesh castShadow>
            <cylinderGeometry args={[frameR, frameR - 0.004, 0.068, 40, 1, true, -1.1, 2.2]} />
            <FabricMaterial
              color={primary}
              finish={look.finish}
              highlighted={highlighted}
              doubleSide
            />
          </mesh>
          <mesh>
            <cylinderGeometry args={[frameR + 0.004, frameR, 0.054, 40, 1, true, -1.0, 2.0]} />
            <meshPhysicalMaterial
              color={accent ?? '#ff8a3d'}
              metalness={0.9}
              roughness={0.06}
              clearcoat={1}
              iridescence={0.7}
              iridescenceIOR={1.6}
              envMapIntensity={1.6}
              emissive={highlighted ? HIGHLIGHT : '#000000'}
              emissiveIntensity={highlighted ? 0.4 : 0}
              side={DoubleSide}
            />
          </mesh>
          <mesh>
            <cylinderGeometry
              args={[strapR, strapR, 0.034, 40, 1, true, 1.05, Math.PI * 2 - 2.1]}
            />
            <FabricMaterial color={secondary ?? '#15171c'} highlighted={highlighted} doubleSide />
          </mesh>
        </group>
      </HeadSpace>
    </Selectable>
  );
}

/** Neck gaiter pulled up over the chin. */
export function Neckwear({ look, skeleton: s, highlighted, onSelect }: GarmentProps) {
  const map = usePatternTexture(look.pattern, look.colors);
  const chin = s.head.clone().add(new Vector3(0, -0.045, 0.01).applyQuaternion(s.headQuat));
  const base = s.neckBase.clone().add(new Vector3(0, -0.015, 0).applyQuaternion(s.torsoQuat));
  return (
    <Selectable onSelect={onSelect}>
      <Segment from={base} to={chin} rFrom={BODY.r.neck + 0.03} rTo={R * 0.98} capped={false}>
        <FabricMaterial
          color={look.colors.primary}
          map={map}
          highlighted={highlighted}
          doubleSide
        />
      </Segment>
      {look.colors.secondary && look.pattern !== 'camo' && look.pattern !== 'print' && (
        <Segment
          from={base.clone().lerp(chin, 0.45)}
          to={base.clone().lerp(chin, 0.6)}
          rFrom={BODY.r.neck + 0.03 + (R * 0.98 - BODY.r.neck - 0.03) * 0.45 + 0.002}
          rTo={BODY.r.neck + 0.03 + (R * 0.98 - BODY.r.neck - 0.03) * 0.6 + 0.002}
          capped={false}
        >
          <FabricMaterial color={look.colors.secondary} highlighted={highlighted} doubleSide />
        </Segment>
      )}
    </Selectable>
  );
}
