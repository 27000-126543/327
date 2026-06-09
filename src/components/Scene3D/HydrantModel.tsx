import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Billboard, Text } from '@react-three/drei';
import type { FireHydrant } from '@/types';

interface Props {
  hydrant: FireHydrant;
}

export function HydrantModel({ hydrant }: Props) {
  const blinkRef = useRef(0);
  const lowPressure = hydrant.pressure < 0.4;

  useFrame((state, dt) => {
    blinkRef.current += dt;
  });

  const color = lowPressure ? '#ff8800' : '#cc3300';
  const emissive = lowPressure
    ? (Math.sin(blinkRef.current * 6) > 0 ? '#ff6600' : '#442200')
    : '#000000';
  const emissiveIntensity = lowPressure ? 1.5 : 0;

  const [x, y, z] = hydrant.position;

  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.4, 0.6, 12]} />
        <meshStandardMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          metalness={0.6}
          roughness={0.3}
        />
      </mesh>
      <mesh position={[0, 0.85, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.3, 0.5, 12]} />
        <meshStandardMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          metalness={0.6}
          roughness={0.3}
        />
      </mesh>
      <mesh position={[0, 1.2, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.22, 0.2, 12]} />
        <meshStandardMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          metalness={0.7}
          roughness={0.2}
        />
      </mesh>
      <mesh position={[0.35, 0.85, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.1, 0.1, 0.3, 8]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[-0.35, 0.85, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <cylinderGeometry args={[0.1, 0.1, 0.3, 8]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.3} />
      </mesh>
      {lowPressure && (
        <Billboard position={[0, 2, 0]}>
          <Text
            fontSize={0.4}
            color="#ff8800"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.03}
            outlineColor="#000000"
          >
            ⚠ {hydrant.pressure.toFixed(2)}MPa
          </Text>
        </Billboard>
      )}
      {!lowPressure && (
        <Billboard position={[0, 1.8, 0]}>
          <Text
            fontSize={0.3}
            color="#00ff88"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.02}
            outlineColor="#000000"
          >
            {hydrant.pressure.toFixed(2)}MPa
          </Text>
        </Billboard>
      )}
    </group>
  );
}
