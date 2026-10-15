import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  AdditiveBlending,
  BackSide,
  BufferAttribute,
  CanvasTexture,
  BufferGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  InstancedMesh,
  Object3D,
  SphereGeometry,
  type Points,
} from 'three';

/** Deterministic pseudo-random in [0, 1) from an integer, so the scenery is stable between loads. */
function rand(i: number): number {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function Sky({ top = '#1e5bd8', horizon = '#d7ebff' }: { top?: string; horizon?: string }) {
  const geometry = useMemo(() => {
    const g = new SphereGeometry(140, 32, 16);
    const colors = new Float32Array(g.attributes.position.count * 3);
    const a = new Color(horizon);
    const b = new Color(top);
    const c = new Color();
    for (let i = 0; i < g.attributes.position.count; i++) {
      const y = g.attributes.position.getY(i) / 140;
      c.copy(a).lerp(b, Math.min(1, Math.max(0, y * 1.6)) ** 0.8);
      colors.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute('color', new BufferAttribute(colors, 3));
    return g;
  }, [top, horizon]);
  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial vertexColors side={BackSide} fog={false} depthWrite={false} />
    </mesh>
  );
}

/** Snow ground: flat where the rider stands, gently rolling further out. */
function Ground() {
  const geometry = useMemo(() => {
    // Polar grid so vertices are dense near the rider and sparse at the horizon.
    const rings = 48;
    const segments = 96;
    const positions: number[] = [];
    const indices: number[] = [];
    for (let r = 0; r <= rings; r++) {
      const radius = (r / rings) ** 1.6 * 80;
      for (let s = 0; s <= segments; s++) {
        const a = (s / segments) * Math.PI * 2;
        const x = Math.cos(a) * radius;
        const z = Math.sin(a) * radius;
        const flat = Math.max(0, radius - 5) / 75;
        const y =
          flat * flat * 9 * (0.6 + 0.4 * Math.sin(a * 3 + 1.3)) +
          Math.sin(x * 0.35) * Math.cos(z * 0.3) * 0.4 * Math.min(1, flat * 6);
        positions.push(x, y, z);
      }
    }
    for (let r = 0; r < rings; r++) {
      for (let s = 0; s < segments; s++) {
        const a = r * (segments + 1) + s;
        const b = a + segments + 1;
        indices.push(a, a + 1, b, b, a + 1, b + 1);
      }
    }
    const g = new BufferGeometry();
    g.setIndex(indices);
    g.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial color="#f3f7fc" roughness={0.92} />
    </mesh>
  );
}

function Mountains() {
  const peaks = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => {
        const angle = (i / 16) * Math.PI * 2 + rand(i) * 0.3;
        const distance = 70 + rand(i + 50) * 25;
        return {
          position: [Math.cos(angle) * distance, -2, Math.sin(angle) * distance] as [
            number,
            number,
            number,
          ],
          height: 22 + rand(i + 100) * 26,
          radius: 18 + rand(i + 150) * 14,
          rotation: rand(i + 200) * Math.PI,
        };
      }),
    [],
  );
  const geometry = useMemo(() => {
    const g = new ConeGeometry(1, 1, 7, 4).toNonIndexed();
    const colors = new Float32Array(g.attributes.position.count * 3);
    const rock = new Color('#6b7f9e');
    const snow = new Color('#f8fbff');
    for (let i = 0; i < g.attributes.position.count; i++) {
      const y = g.attributes.position.getY(i) + 0.5;
      const c = y > 0.42 ? snow : rock.clone().lerp(snow, y * 0.6);
      colors.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute('color', new BufferAttribute(colors, 3));
    g.translate(0, 0.5, 0);
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <group>
      {peaks.map((p, i) => (
        <mesh
          key={i}
          geometry={geometry}
          position={p.position}
          rotation={[0, p.rotation, 0]}
          scale={[p.radius, p.height, p.radius]}
        >
          <meshStandardMaterial vertexColors flatShading roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

/** A loose ring of pines, kept out of the area right around the rider. Instanced: 3 draw calls. */
function Trees({ count = 36 }: { count?: number }) {
  const foliage = useRef<InstancedMesh>(null);
  const caps = useRef<InstancedMesh>(null);
  const trunks = useRef<InstancedMesh>(null);
  const geometries = useMemo(
    () => ({
      foliage: new ConeGeometry(1, 1, 7).translate(0, 0.5, 0),
      cap: new ConeGeometry(1, 1, 7).translate(0, 0.5, 0),
      trunk: new CylinderGeometry(0.12, 0.16, 1, 6).translate(0, 0.5, 0),
    }),
    [],
  );

  useLayoutEffect(() => {
    const dummy = new Object3D();
    for (let i = 0; i < count; i++) {
      const angle = rand(i + 300) * Math.PI * 2;
      const distance = 9 + rand(i + 400) ** 0.7 * 26;
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;
      const flat = Math.max(0, distance - 5) / 75;
      const groundY = flat * flat * 9 * (0.6 + 0.4 * Math.sin(angle * 3 + 1.3)) - 0.1;
      const h = 2.6 + rand(i + 500) * 2.6;
      for (let tier = 0; tier < 2; tier++) {
        const tierH = h * (tier === 0 ? 0.65 : 0.5);
        const base = groundY + h * 0.18 + tier * h * 0.32;
        const radius = h * (tier === 0 ? 0.3 : 0.22);
        dummy.position.set(x, base, z);
        dummy.scale.set(radius, tierH, radius);
        dummy.rotation.set(0, rand(i + tier) * 3, 0);
        dummy.updateMatrix();
        foliage.current?.setMatrixAt(i * 2 + tier, dummy.matrix);
        // Snow on the upper part of each tier.
        dummy.position.set(x, base + tierH * 0.45, z);
        dummy.scale.set(radius * 0.58, tierH * 0.56, radius * 0.58);
        dummy.updateMatrix();
        caps.current?.setMatrixAt(i * 2 + tier, dummy.matrix);
      }
      dummy.position.set(x, groundY, z);
      dummy.scale.set(1, h * 0.25, 1);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      trunks.current?.setMatrixAt(i, dummy.matrix);
    }
    for (const mesh of [foliage.current, caps.current, trunks.current]) {
      if (mesh) mesh.instanceMatrix.needsUpdate = true;
    }
  }, [count]);

  return (
    <group>
      <instancedMesh ref={foliage} args={[geometries.foliage, undefined, count * 2]} castShadow>
        <meshStandardMaterial color="#1f4d3a" flatShading roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={caps} args={[geometries.cap, undefined, count * 2]}>
        <meshStandardMaterial color="#f4f8ff" flatShading roughness={0.85} />
      </instancedMesh>
      <instancedMesh ref={trunks} args={[geometries.trunk, undefined, count]}>
        <meshStandardMaterial color="#4a3426" roughness={0.9} />
      </instancedMesh>
    </group>
  );
}

function useFlakeTexture() {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 32;
    const ctx = canvas.getContext('2d')!;
    const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.4, 'rgba(255,255,255,0.8)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 32, 32);
    return new CanvasTexture(canvas);
  }, []);
}

/** Gently falling snow in a box around the rider; flakes wrap around when they hit the ground. */
export function Snowfall({
  count = 900,
  area = 9,
  height = 7,
}: {
  count?: number;
  area?: number;
  height?: number;
}) {
  const points = useRef<Points>(null);
  const texture = useFlakeTexture();
  const { positions, speeds, phases } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    const phases = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (rand(i + 1000) - 0.5) * area * 2;
      positions[i * 3 + 1] = rand(i + 2000) * height;
      positions[i * 3 + 2] = (rand(i + 3000) - 0.5) * area * 2;
      speeds[i] = 0.35 + rand(i + 4000) * 0.55;
      phases[i] = rand(i + 5000) * Math.PI * 2;
    }
    return { positions, speeds, phases };
  }, [count, area, height]);

  useFrame(({ clock }, delta) => {
    const geometry = points.current?.geometry;
    if (!geometry) return;
    const attr = geometry.attributes.position as BufferAttribute;
    const arr = attr.array as Float32Array;
    const t = clock.elapsedTime;
    const dt = Math.min(delta, 0.05);
    for (let i = 0; i < count; i++) {
      let y = arr[i * 3 + 1] - speeds[i] * dt;
      if (y < 0) y += height;
      arr[i * 3 + 1] = y;
      arr[i * 3] += Math.sin(t * 0.7 + phases[i]) * 0.12 * dt;
      arr[i * 3 + 2] += Math.cos(t * 0.5 + phases[i]) * 0.08 * dt;
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        map={texture}
        size={0.045}
        sizeAttenuation
        transparent
        depthWrite={false}
        opacity={0.9}
        blending={AdditiveBlending}
        color="#ffffff"
      />
    </points>
  );
}

export function SlopeEnvironment() {
  return (
    <group>
      <Sky />
      <Ground />
      <Mountains />
      <Trees />
    </group>
  );
}
