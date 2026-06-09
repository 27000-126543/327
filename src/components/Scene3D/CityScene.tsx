import { useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sky, Stars, Environment } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, SMAA } from '@react-three/postprocessing';
import * as THREE from 'three';
import { BuildingModel } from './BuildingModel';
import { FireStation } from './FireStation';
import { FireTruckModel } from './FireTruck';
import { FireEffect } from './FireEffect';
import { PathLine } from './PathLine';
import { HydrantModel } from './HydrantModel';
import { PatrolRobotModel } from './PatrolRobot';
import { useFireStore } from '@/store/useFireStore';

function Ground() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[300, 300]} />
        <meshStandardMaterial color="#0d1a2a" roughness={0.95} metalness={0.05} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[220, 200]} />
        <meshBasicMaterial color="#132238" transparent opacity={0.8} />
      </mesh>
      {Array.from({ length: 23 }).map((_, i) => (
        <mesh key={`rl-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[-110 + i * 10, 0.02, 0]}>
          <planeGeometry args={[0.08, 200]} />
          <meshBasicMaterial color="#1d3a5e" transparent opacity={0.45} />
        </mesh>
      ))}
      {Array.from({ length: 21 }).map((_, i) => (
        <mesh key={`rc-${i}`} rotation={[-Math.PI / 2, 0, Math.PI / 2]} position={[0, 0.02, -100 + i * 10]}>
          <planeGeometry args={[0.08, 220]} />
          <meshBasicMaterial color="#1d3a5e" transparent opacity={0.45} />
        </mesh>
      ))}
      {[
        { x: 0, z: 30, w: 220, d: 4, type: 'main' },
        { x: 0, z: -30, w: 220, d: 4, type: 'main' },
        { x: -45, z: 0, w: 4, d: 140, type: 'main' },
        { x: 45, z: 0, w: 4, d: 140, type: 'main' },
        { x: 35, z: 25, w: 12, d: 2, type: 'tech2', occupied: true },
      ].map((road, i) => (
        <mesh
          key={`road-${i}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[road.x, 0.03, road.z]}
        >
          <planeGeometry args={[road.w, road.d]} />
          <meshStandardMaterial
            color={(road as any).occupied ? '#552020' : '#2a2a2a'}
            emissive={(road as any).occupied ? '#ff0000' : '#000000'}
            emissiveIntensity={(road as any).occupied ? 0.5 : 0}
            roughness={0.85}
          />
        </mesh>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[35, 0.04, 25]}>
        <planeGeometry args={[12, 0.3]} />
        <meshBasicMaterial color="#ffff00" />
      </mesh>
    </group>
  );
}

function FireZones() {
  const zones = useFireStore(s => s.fireZones);
  const colorMap = ['#ff666666', '#66ff6666', '#6666ff66'];
  return (
    <group>
      {zones.map((z, i) => {
        const [min, max] = z.boundaries;
        const w = Math.abs(max[0] - min[0]);
        const d = Math.abs(max[2] - min[2]);
        const cx = (min[0] + max[0]) / 2;
        const cz = (min[2] + max[2]) / 2;
        return (
          <group key={z.id} position={[cx, 0.05, cz]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[w, d]} />
              <meshBasicMaterial color={colorMap[i % 3]} transparent opacity={0.08} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[Math.min(w, d) * 0.4, Math.min(w, d) * 0.41, 64]} />
              <meshBasicMaterial color={colorMap[i % 3].slice(0, 7)} transparent opacity={0.5} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function EvacuationArrows() {
  const { evacuationActive, evacuationBuildingId, buildings } = useFireStore();
  if (!evacuationActive || !evacuationBuildingId) return null;
  const b = buildings.find(x => x.id === evacuationBuildingId);
  if (!b) return null;

  const [px, , pz] = b.position;
  const exits: [number, number, number][] = [
    [px - 25, 0.5, pz], [px + 25, 0.5, pz],
    [px, 0.5, pz - 25], [px, 0.5, pz + 25],
  ];

  return (
    <group>
      {exits.map((ep, i) => {
        const pts: [number, number, number][] = [
          [px + (i % 2 === 0 ? (i === 0 ? -6 : 6) : 0), 0.5, pz + (i >= 2 ? (i === 2 ? -6 : 6) : 0)],
          ep,
        ];
        return (
          <group key={i}>
            <PathLine points={pts} color="#00ff88" type="evacuation" />
            <group position={ep} rotation={[0, (i === 1 ? -Math.PI / 2 : i === 0 ? Math.PI / 2 : i === 2 ? 0 : Math.PI), 0]}>
              <mesh position={[0, 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <coneGeometry args={[1.2, 2, 3]} />
                <meshStandardMaterial color="#00ff88" emissive="#00ff88" emissiveIntensity={1.5} />
              </mesh>
            </group>
          </group>
        );
      })}
    </group>
  );
}

function FireShutters() {
  const { buildings, linkedDevices } = useFireStore();
  if (!linkedDevices.fireShutter) return null;
  return (
    <group>
      {buildings.slice(0, 2).map(b => {
        const [px, , pz] = b.position;
        const [w] = b.size;
        return (
          <group key={`sh-${b.id}`} position={[px, 3, pz + w / 2 + 0.3]}>
            <mesh>
              <boxGeometry args={[w * 0.6, 6, 0.15]} />
              <meshStandardMaterial color="#bbbbbb" metalness={0.7} roughness={0.3} />
            </mesh>
            <mesh position={[0, 3.1, 0]}>
              <boxGeometry args={[w * 0.62, 0.25, 0.3]} />
              <meshStandardMaterial color="#ff4444" emissive="#ff0000" emissiveIntensity={0.8} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function SceneLoop() {
  const tickRobots = useFireStore(s => s.tickRobots);
  const tickTrucks = useFireStore(s => s.tickTrucks);
  const tickFireSpread = useFireStore(s => s.tickFireSpread);
  const counterRef = useRef(0);

  useFrame((_, dt) => {
    counterRef.current += dt;
    tickRobots();
    if (counterRef.current > 0.8) {
      tickTrucks();
      counterRef.current = 0;
    }
  });

  useEffect(() => {
    const iv = setInterval(() => tickFireSpread(), 4000);
    return () => clearInterval(iv);
  }, [tickFireSpread]);

  return null;
}

export function CityScene() {
  const {
    buildings, fireAlarms, fireStation, dispatchPath, robots,
    hydrants, selectedBuildingId, setSelectedBuilding,
  } = useFireStore();

  return (
    <Canvas
      shadows
      camera={{ position: [55, 95, 105], fov: 45, near: 0.1, far: 2000 }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      onPointerMissed={() => setSelectedBuilding(null)}
    >
      <color attach="background" args={['#050c1a']} />
      <fog attach="fog" args={['#050c1a', 100, 320]} />

      <ambientLight intensity={0.35} color="#99aabb" />
      <hemisphereLight args={['#6a8caf', '#0a1020', 0.35]} />
      <directionalLight
        position={[60, 120, 40]}
        intensity={0.55}
        color="#ffeedd"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-150}
        shadow-camera-right={150}
        shadow-camera-top={150}
        shadow-camera-bottom={-150}
      />
      <pointLight position={[0, 100, 0]} intensity={0.3} color="#00d4ff" distance={200} />
      <Stars radius={300} depth={60} count={3000} factor={5} saturation={0.1} fade speed={0.5} />

      <Ground />
      <FireZones />

      {buildings.map(b => (
        <BuildingModel
          key={b.id}
          building={b}
          selected={selectedBuildingId === b.id}
          alarms={fireAlarms}
          onSelect={setSelectedBuilding}
        />
      ))}

      {fireAlarms.filter(a => a.status === 'active').map(a => {
        const b = buildings.find(x => x.id === a.buildingId);
        if (!b) return null;
        return <FireEffect key={`fe-${a.id}`} building={b} alarm={a} />;
      })}

      <FireStation position={fireStation.position as [number, number, number]} name={fireStation.name} />

      {fireStation.trucks.map(t => (
        <FireTruckModel key={t.id} truck={t} path={dispatchPath} />
      ))}

      {dispatchPath && dispatchPath.length > 1 && (
        <PathLine points={dispatchPath} color="#00d4ff" type="dispatch" />
      )}

      <EvacuationArrows />
      <FireShutters />

      {hydrants.map(h => <HydrantModel key={h.id} hydrant={h} />)}
      {robots.map(r => <PatrolRobotModel key={r.id} robot={r} />)}

      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        minDistance={25}
        maxDistance={260}
        maxPolarAngle={Math.PI / 2.2}
        target={[0, 30, 0]}
      />

      <SceneLoop />

      <EffectComposer multisampling={0} enableNormalPass={false}>
        <Bloom
          intensity={0.85}
          luminanceThreshold={0.25}
          luminanceSmoothing={0.9}
          mipmapBlur
          radius={0.7}
        />
        <Vignette eskil={false} offset={0.25} darkness={0.75} />
        <SMAA />
      </EffectComposer>
    </Canvas>
  );
}
