import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Billboard, Text } from '@react-three/drei';

interface Props {
  position: [number, number, number];
  name: string;
}

export function FireStation({ position, name }: Props) {
  const beaconRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (beaconRef.current) {
      beaconRef.current.rotation.y = state.clock.elapsedTime * 2;
    }
  });

  return (
    <group position={position}>
      <mesh position={[0, 0.01, 0]} receiveShadow>
        <boxGeometry args={[16, 0.2, 14]} />
        <meshStandardMaterial color="#555" />
      </mesh>
      <mesh position={[0, 2, 0]} castShadow>
        <boxGeometry args={[14, 4, 12]} />
        <meshStandardMaterial color="#e8e8e8" />
      </mesh>
      <mesh position={[0, 4.5, 0]} castShadow>
        <boxGeometry args={[14, 1, 12]} />
        <meshStandardMaterial color="#c83030" />
      </mesh>
      <mesh position={[0, 2, 6.05]}>
        <boxGeometry args={[10, 3, 0.1]} />
        <meshStandardMaterial color="#a02020" />
      </mesh>
      {[-4, 0, 4].map((x, i) => (
        <mesh key={`door-${i}`} position={[x, 1.4, 6.02]}>
          <boxGeometry args={[2.8, 2.6, 0.08]} />
          <meshStandardMaterial color="#ffcc33" emissive="#aa6600" emissiveIntensity={0.3} metalness={0.7} roughness={0.2} />
        </mesh>
      ))}
      <mesh position={[-7.5, 1, 0]}>
        <boxGeometry args={[1, 2, 1.5]} />
        <meshStandardMaterial color="#c83030" />
      </mesh>
      <group position={[6, 6, 0]}>
        <mesh position={[0, 2, 0]}>
          <cylinderGeometry args={[0.4, 0.5, 4, 8]} />
          <meshStandardMaterial color="#888" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh ref={beaconRef} position={[0, 4.5, 0]}>
          <coneGeometry args={[0.6, 0.8, 6]} />
          <meshStandardMaterial color="#ff0000" emissive="#ff3333" emissiveIntensity={1.2} />
        </mesh>
      </group>
      <Billboard position={[0, 11, 0]}>
        <Text
          fontSize={1.2}
          color="#ff4444"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.04}
          outlineColor="#000000"
        >
          🚒 {name}
        </Text>
      </Billboard>
    </group>
  );
}
