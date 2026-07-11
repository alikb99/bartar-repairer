"use client";

import { Float, PerspectiveCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";

function DeviceModel() {
  return (
    <group rotation={[0.08, -0.45, 0.04]}>
      <Float speed={1.35} rotationIntensity={0.18} floatIntensity={0.55}>
        <mesh castShadow receiveShadow position={[0, 0, 0]}>
          <boxGeometry args={[1.65, 2.75, 0.12]} />
          <meshStandardMaterial color="#161A22" metalness={0.46} roughness={0.34} />
        </mesh>
        <mesh position={[0, 0, 0.071]}>
          <boxGeometry args={[1.45, 2.5, 0.018]} />
          <meshStandardMaterial color="#F7F8FA" metalness={0.08} roughness={0.28} />
        </mesh>
        <mesh position={[0, 0.95, 0.087]}>
          <boxGeometry args={[0.52, 0.045, 0.018]} />
          <meshStandardMaterial color="#DA251C" emissive="#DA251C" emissiveIntensity={0.45} />
        </mesh>
      </Float>

      <Float speed={1.7} rotationIntensity={0.28} floatIntensity={0.45}>
        <mesh position={[-1.15, -0.55, -0.12]} rotation={[0.15, 0.55, -0.08]}>
          <boxGeometry args={[1.3, 0.82, 0.07]} />
          <meshStandardMaterial color="#FDFDFD" metalness={0.2} roughness={0.38} />
        </mesh>
      </Float>

      <Float speed={1.45} rotationIntensity={0.18} floatIntensity={0.5}>
        <mesh position={[1.08, 0.44, -0.24]} rotation={[0.18, -0.15, 0.38]}>
          <boxGeometry args={[0.72, 0.72, 0.08]} />
          <meshStandardMaterial color="#FFFFFF" metalness={0.12} roughness={0.36} />
        </mesh>
      </Float>
    </group>
  );
}

export default function ServiceDeviceScene() {
  return (
    <div
      className="absolute inset-0"
      aria-hidden="true"
    >
      <Canvas
        shadows
        dpr={[1, 1.6]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <PerspectiveCamera makeDefault position={[0, 0, 5.2]} fov={38} />
        <ambientLight intensity={1.35} />
        <directionalLight position={[3, 4, 5]} intensity={2.2} castShadow />
        <pointLight position={[-3, -1, 3]} intensity={1.4} color="#DA251C" />
        <DeviceModel />
      </Canvas>
    </div>
  );
}
