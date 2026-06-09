import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Props {
  points: [number, number, number][];
  color?: string;
  type?: 'dispatch' | 'evacuation';
}

export function PathLine({ points, color = '#00d4ff', type = 'dispatch' }: Props) {
  const lineRef = useRef<THREE.Line>(null);
  const tubeRef = useRef<THREE.Mesh>(null);

  const curve = useMemo(() => {
    if (points.length < 2) return null;
    const pts = points.map(p => new THREE.Vector3(p[0], 0.4, p[2]));
    return new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.3);
  }, [points]);

  const tubeGeometry = useMemo(() => {
    if (!curve) return null;
    return new THREE.TubeGeometry(curve, 200, type === 'dispatch' ? 0.2 : 0.15, 8, false);
  }, [curve, type]);

  const flowRef = useRef(0);
  useFrame((_, dt) => {
    flowRef.current += dt * 0.5;
    if (tubeRef.current && tubeRef.current.material instanceof THREE.ShaderMaterial) {
      tubeRef.current.material.uniforms.uTime.value = flowRef.current;
    }
    if (lineRef.current && lineRef.current.material instanceof THREE.LineBasicMaterial) {
      // noop
    }
  });

  if (!curve || !tubeGeometry) return null;

  const shaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(color) },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uColor;
      varying vec2 vUv;
      void main() {
        float flow = fract(vUv.x * 3.0 - uTime);
        float pulse = smoothstep(0.0, 0.2, flow) * (1.0 - smoothstep(0.3, 0.5, flow));
        float base = 0.35;
        vec3 col = uColor * (base + pulse * 1.2);
        gl_FragColor = vec4(col, base + pulse * 0.6);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  return (
    <group>
      <mesh ref={tubeRef} geometry={tubeGeometry} material={shaderMaterial} />
      <mesh>
        <tubeGeometry args={[curve, 200, type === 'dispatch' ? 0.06 : 0.04, 6, false]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} />
      </mesh>
    </group>
  );
}
