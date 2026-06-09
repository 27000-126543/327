import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Building, FireAlarm } from '@/types';

interface Props {
  building: Building;
  selected: boolean;
  alarms: FireAlarm[];
  onSelect: (id: string) => void;
}

export function BuildingModel({ building, selected, alarms, onSelect }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const firePulseRef = useRef(0);

  const activeAlarm = alarms.find(a => a.buildingId === building.id && a.status === 'active');
  const fireFloors = activeAlarm?.spreadFloors || [];

  const floors = useMemo(() => {
    const arr: { y: number; h: number; color: string; emissive: string; emissiveIntensity: number }[] = [];
    const floorHeight = building.height / building.floors;
    for (let i = 0; i < building.floors; i++) {
      const f = i + 1;
      const facility = building.facilities[i];
      const hasFire = fireFloors.includes(f);
      const hasFault = facility && (
        facility.smokeDetector.status === 'fault' ||
        facility.sprinkler.status === 'fault' ||
        facility.hydrantPressure < 0.4
      );
      const hasAlarm = facility?.smokeDetector.status === 'alarm';

      let color = building.color;
      let emissive = '#000000';
      let emissiveIntensity = 0;

      if (hasFire) {
        color = '#ff3300';
        emissive = '#ff6600';
        emissiveIntensity = 1.2;
      } else if (hasAlarm) {
        color = '#ff4444';
        emissive = '#ff0000';
        emissiveIntensity = 0.8;
      } else if (hasFault) {
        color = '#ff8844';
        emissive = '#ff4400';
        emissiveIntensity = 0.35;
      } else if (selected) {
        emissive = '#00d4ff';
        emissiveIntensity = 0.25;
      }

      arr.push({
        y: i * floorHeight + floorHeight / 2,
        h: floorHeight * 0.92,
        color,
        emissive,
        emissiveIntensity,
      });
    }
    return arr;
  }, [building, fireFloors, selected]);

  useFrame((_, dt) => {
    firePulseRef.current += dt;
    if (groupRef.current && activeAlarm) {
      const pulse = Math.sin(firePulseRef.current * 4) * 0.3 + 0.9;
      groupRef.current.children.forEach((ch, idx) => {
        if (ch instanceof THREE.Mesh) {
          const f = building.floors - Math.floor(idx / 2);
          if (fireFloors.includes(f) && ch.material instanceof THREE.MeshStandardMaterial) {
            ch.material.emissiveIntensity = 0.8 + pulse * 0.6;
          }
        }
      });
    }
  });

  const [w, , d] = building.size;
  const [px, py, pz] = building.position;

  return (
    <group
      ref={groupRef}
      position={[px, py + 0.01, pz]}
      onClick={(e) => { e.stopPropagation(); onSelect(building.id); }}
      onPointerOver={(e) => { (e.target as any).cursor = 'pointer'; document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'default'; }}
    >
      {floors.map((floor, i) => (
        <mesh key={`f-${i}`} position={[0, floor.y, 0]} castShadow receiveShadow>
          <boxGeometry args={[w, floor.h, d]} />
          <meshStandardMaterial
            color={floor.color}
            emissive={floor.emissive}
            emissiveIntensity={floor.emissiveIntensity}
            metalness={0.15}
            roughness={0.55}
          />
        </mesh>
      ))}
      {Array.from({ length: Math.floor(building.floors / 3) }).map((_, i) => (
        <mesh key={`w-${i}`} position={[w / 2 + 0.01, i * 12 + 4, 0]}>
          <planeGeometry args={[0.01, 1.2]} />
          <meshBasicMaterial color="#ffcc66" transparent opacity={0.85} />
        </mesh>
      ))}
      {selected && (
        <mesh position={[0, building.height / 2, 0]}>
          <boxGeometry args={[w + 1.5, building.height + 1.5, d + 1.5]} />
          <meshBasicMaterial color="#00d4ff" transparent opacity={0.08} side={THREE.BackSide} />
        </mesh>
      )}
      <mesh position={[0, building.height + 3, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 6]} />
        <meshBasicMaterial color="#aaa" />
      </mesh>
      <mesh position={[0, building.height + 0.3, 0]}>
        <cylinderGeometry args={[Math.max(w, d) * 0.55 + 0.3, Math.max(w, d) * 0.55 + 0.3, 0.2]} />
        <meshStandardMaterial color="#2a3a55" metalness={0.6} roughness={0.4} />
      </mesh>
    </group>
  );
}
