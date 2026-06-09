import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Billboard, Text } from '@react-three/drei';
import type { PatrolRobot as RobotType } from '@/types';

interface Props {
  robot: RobotType;
}

export function PatrolRobotModel({ robot }: Props) {
  const camRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (camRef.current && robot.status === 'patrolling') {
      camRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.8;
    }
  });

  const [x, y, z] = robot.currentPosition;
  const statusColor = robot.status === 'alert' ? '#ff4444'
    : robot.status === 'patrolling' ? '#00d4ff' : '#888888';

  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.5, 0.55, 0.5, 16]} />
        <meshStandardMaterial color="#2a2a35" metalness={0.7} roughness={0.3} />
      </mesh>
      {[-0.35, 0.35].map((zz, i) => (
        <mesh key={`tr-${i}`} position={[0, 0.18, zz * 0.85]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.18, 0.18, 0.15, 12]} />
          <meshStandardMaterial color="#111" />
        </mesh>
      ))}
      <mesh position={[0, 0.9, 0]} castShadow>
        <boxGeometry args={[0.6, 0.6, 0.6]} />
        <meshStandardMaterial color="#3a3a4a" metalness={0.6} roughness={0.35} />
      </mesh>
      <mesh ref={camRef} position={[0, 1.4, 0]} castShadow>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial
          color={statusColor}
          emissive={statusColor}
          emissiveIntensity={robot.status === 'alert' ? 1.2 : 0.5}
          metalness={0.8}
          roughness={0.15}
        />
      </mesh>
      <mesh position={[0, 1.4, 0.2]}>
        <cylinderGeometry args={[0.06, 0.06, 0.12, 8]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      {[-1, 1].map((sx, i) => (
        <mesh key={`ld-${i}`} position={[sx * 0.35, 0.65, 0.35]}>
          <boxGeometry args={[0.08, 0.08, 0.02]} />
          <meshStandardMaterial
            color={statusColor}
            emissive={statusColor}
            emissiveIntensity={robot.status !== 'idle' ? 1 : 0.2}
          />
        </mesh>
      ))}
      <Billboard position={[0, 2.2, 0]}>
        <Text
          fontSize={0.35}
          color={statusColor}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          {robot.name} ⚡{robot.battery}%
        </Text>
      </Billboard>
    </group>
  );
}
