import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Building, FireAlarm } from '@/types';

interface Props {
  building: Building;
  alarm: FireAlarm;
}

export function FireEffect({ building, alarm }: Props) {
  const pointsRef = useRef<THREE.Points>(null);
  const smokeRef = useRef<THREE.Points>(null);

  const PARTICLE_COUNT = 300;

  const { positions, colors, sizes, smokePositions, smokeColors } = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);
    const smokePositions = new Float32Array(PARTICLE_COUNT * 3);
    const smokeColors = new Float32Array(PARTICLE_COUNT * 3);

    const [w, , d] = building.size;
    const fh = building.height / building.floors;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const floorIdx = Math.floor(Math.random() * alarm.spreadFloors.length);
      const floor = alarm.spreadFloors[floorIdx];
      const y = (floor - 1) * fh + fh * 0.5 + Math.random() * fh * 0.4;
      positions[i * 3] = (Math.random() - 0.5) * w * 0.7;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = (Math.random() - 0.5) * d * 0.7;

      const t = Math.random();
      colors[i * 3] = 1;
      colors[i * 3 + 1] = 0.2 + t * 0.5;
      colors[i * 3 + 2] = Math.random() * 0.08;
      sizes[i] = 0.35 + Math.random() * 0.5;

      smokePositions[i * 3] = (Math.random() - 0.5) * w * 0.9;
      smokePositions[i * 3 + 1] = y + fh * 0.5 + Math.random() * 8;
      smokePositions[i * 3 + 2] = (Math.random() - 0.5) * d * 0.9;
      smokeColors[i * 3] = 0.2 + Math.random() * 0.1;
      smokeColors[i * 3 + 1] = 0.18 + Math.random() * 0.08;
      smokeColors[i * 3 + 2] = 0.16 + Math.random() * 0.06;
    }

    return { positions, colors, sizes, smokePositions, smokeColors };
  }, [building, alarm.spreadFloors.length]);

  const posArr = useRef<Float32Array>(new Float32Array(positions));
  const smokeArr = useRef<Float32Array>(new Float32Array(smokePositions));

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    if (pointsRef.current) {
      const geom = pointsRef.current.geometry as THREE.BufferGeometry;
      const pos = geom.attributes.position.array as Float32Array;
      const [w, , dz] = building.size;
      const fh = building.height / building.floors;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const idx = (i * 3 + Math.floor(t * 3 + i)) % PARTICLE_COUNT;
        const floorIdx = idx % alarm.spreadFloors.length;
        const floor = alarm.spreadFloors[floorIdx];
        const phase = ((t * 0.6 + i * 0.13) % 1);
        pos[i * 3] = posArr.current[i * 3] + Math.sin(t * 2 + i) * 0.3;
        pos[i * 3 + 1] = ((floor - 1) * fh + fh * 0.3) + phase * (fh * 1.2 + 2);
        pos[i * 3 + 2] = posArr.current[i * 3 + 2] + Math.cos(t * 2.3 + i) * 0.3;
        const fade = phase < 0.1 ? phase * 10 : (phase > 0.85 ? (1 - phase) * 6.6 : 1);
        const colAttr = geom.attributes.color.array as Float32Array;
        colAttr[i * 3 + 1] = (0.2 + ((1 - phase) * 0.6)) * fade;
        colAttr[i * 3] = Math.min(1, 0.9 + (1 - phase) * 0.3);
      }
      geom.attributes.position.needsUpdate = true;
      geom.attributes.color.needsUpdate = true;
    }
    if (smokeRef.current) {
      const geom = smokeRef.current.geometry as THREE.BufferGeometry;
      const pos = geom.attributes.position.array as Float32Array;
      const fh = building.height / building.floors;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const floorIdx = (i + Math.floor(t * 2)) % alarm.spreadFloors.length;
        const floor = alarm.spreadFloors[floorIdx];
        const phase = ((t * 0.25 + i * 0.09) % 1);
        pos[i * 3] = smokeArr.current[i * 3] + Math.sin(t + i * 0.7) * (0.5 + phase * 2);
        pos[i * 3 + 1] = ((floor) * fh) + phase * (building.height * 0.3 + 15);
        pos[i * 3 + 2] = smokeArr.current[i * 3 + 2] + Math.cos(t * 0.9 + i * 0.6) * (0.5 + phase * 2);
      }
      geom.attributes.position.needsUpdate = true;
    }
  });

  const [px, , pz] = building.position;

  return (
    <group position={[px, 0, pz]}>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={PARTICLE_COUNT} array={positions} itemSize={3} />
          <bufferAttribute attach="attributes-color" count={PARTICLE_COUNT} array={colors} itemSize={3} />
          <bufferAttribute attach="attributes-size" count={PARTICLE_COUNT} array={sizes} itemSize={1} />
        </bufferGeometry>
        <pointsMaterial
          size={0.6}
          vertexColors
          transparent
          opacity={0.9}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      <points ref={smokeRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={PARTICLE_COUNT} array={smokePositions} itemSize={3} />
          <bufferAttribute attach="attributes-color" count={PARTICLE_COUNT} array={smokeColors} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial
          size={1.4}
          vertexColors
          transparent
          opacity={0.35}
          sizeAttenuation
          depthWrite={false}
        />
      </points>
    </group>
  );
}
