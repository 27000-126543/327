import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Billboard, Text } from '@react-three/drei';
import type { FireTruck as FireTruckType } from '@/types';

interface Props {
  truck: FireTruckType;
  path?: [number, number, number][] | null;
}

export function FireTruckModel({ truck }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const sirenRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (sirenRef.current && truck.status === 'dispatched') {
      sirenRef.current.rotation.y = state.clock.elapsedTime * 8;
    }
  });

  const [x, y, z] = truck.currentPosition;
  const typeColor: Record<string, string> = {
    water: '#c82020', ladder: '#d03030', rescue: '#2050c8', command: '#202020',
  };
  const color = typeColor[truck.type] || '#c82020';

  return (
    <group ref={groupRef} position={[x, y + 0.3, z]}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[1.8, 0.5, 3.6]} />
        <meshStandardMaterial color="#222" metalness={0.8} roughness={0.3} />
      </mesh>
      {[-1.4, -0.4, 0.4, 1.4].map((zz, i) => (
        <mesh key={`wh-${i}`} position={[i < 2 ? -1.1 : 1.1, 0.25, zz]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.32, 0.32, 0.22, 16]} />
          <meshStandardMaterial color="#111" />
        </mesh>
      ))}
      <mesh position={[0.3, 1.1, -0.6]} castShadow>
        <boxGeometry args={[1.5, 0.9, 1.6]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.5} />
      </mesh>
      <mesh position={[0.9, 1.1, 0.3]}>
        <boxGeometry args={[0.05, 0.5, 1.4]} />
        <meshStandardMaterial color="#e0e0ff" transparent opacity={0.5} />
      </mesh>
      <mesh position={[-0.1, 1.35, 1.1]} castShadow>
        <boxGeometry args={[1.6, 0.7, 1.6]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.5} />
      </mesh>
      {truck.type === 'ladder' && (
        <mesh position={[-0.1, 2.1, 0]} rotation={[0, 0, -0.15]}>
          <boxGeometry args={[0.15, 0.15, 4]} />
          <meshStandardMaterial color="#cccccc" metalness={0.7} roughness={0.3} />
        </mesh>
      )}
      {[-1, 1].map((sx, i) => (
        <mesh key={`stripe-${i}`} position={[sx * 0.91, 1.35, 1.1]}>
          <boxGeometry args={[0.02, 0.08, 1.4]} />
          <meshStandardMaterial color="#ffff00" emissive="#aaaa00" emissiveIntensity={0.3} />
        </mesh>
      ))}
      <group ref={sirenRef} position={[0, 1.95, 0]}>
        {[-0.25, 0.25].map((sxp, i) => (
          <mesh key={`siren-${i}`} position={[sxp, 0, 0]}>
            <sphereGeometry args={[0.12, 12, 12]} />
            <meshStandardMaterial
              color={i === 0 ? '#ff0000' : '#0066ff'}
              emissive={i === 0 ? '#ff2222' : '#2266ff'}
              emissiveIntensity={truck.status === 'dispatched' ? 2 : 0.5}
            />
          </mesh>
        ))}
      </group>
      {truck.status === 'dispatched' && truck.eta !== undefined && (
        <Billboard position={[0, 3, 0]}>
          <Text
            fontSize={0.55}
            color="#00ff88"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.02}
            outlineColor="#000000"
          >
            ETA {Math.floor(truck.eta / 60)}:{String(truck.eta % 60).padStart(2, '0')}
          </Text>
        </Billboard>
      )}
    </group>
  );
}
