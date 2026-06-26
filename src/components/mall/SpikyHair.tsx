"use client";

import { useMemo } from "react";
import * as THREE from "three";

const HAIR_DARK = "#4a2c14";
const HAIR_MAIN = "#6d4424";
const HAIR_LIGHT = "#8f5c34";

export const HAIR_TOP_Y = 1.84;
export const HEAD_CENTER_Y = 1.55;

type LockDef = {
  position: [number, number, number];
  rotation: [number, number, number];
  length: number;
  radius: number;
};

/** Swept-back Roblox-style locks — flow backward as one hairstyle */
const LOCKS: LockDef[] = [
  { position: [0, 0.14, -0.04], rotation: [-1.05, 0.1, 0.05], length: 0.36, radius: 0.105 },
  { position: [0.07, 0.1, -0.03], rotation: [-0.95, 0.05, -0.35], length: 0.3, radius: 0.088 },
  { position: [-0.07, 0.1, -0.03], rotation: [-0.95, -0.05, 0.35], length: 0.3, radius: 0.088 },
  { position: [0.12, 0.04, -0.05], rotation: [-0.75, 0, -0.55], length: 0.26, radius: 0.075 },
  { position: [-0.12, 0.04, -0.05], rotation: [-0.75, 0, 0.55], length: 0.26, radius: 0.075 },
  { position: [0, 0.06, -0.1], rotation: [-0.65, 0, 0], length: 0.24, radius: 0.08 },
];

function HairLock({ lock }: { lock: LockDef }) {
  const { length, radius } = lock;
  return (
    <group position={lock.position} rotation={lock.rotation}>
      <mesh position={[0, -length * 0.38, 0]}>
        <capsuleGeometry args={[radius * 0.82, length * 0.72, 8, 16]} />
        <meshStandardMaterial color={HAIR_MAIN} roughness={0.55} metalness={0.04} />
      </mesh>
      <mesh position={[0, -length * 0.78, 0]}>
        <sphereGeometry args={[radius * 0.55, 10, 8]} />
        <meshStandardMaterial color={HAIR_LIGHT} roughness={0.5} metalness={0.04} />
      </mesh>
    </group>
  );
}

export default function SpikyHair() {
  const capGeometry = useMemo(
    () => new THREE.SphereGeometry(0.222, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.58),
    [],
  );

  return (
    <group position={[0, HEAD_CENTER_Y, 0]}>
      {/* Main cap — hugs skull */}
      <mesh geometry={capGeometry} position={[0, 0.02, -0.02]} scale={[1.02, 1, 1.08]}>
        <meshStandardMaterial color={HAIR_DARK} roughness={0.58} metalness={0.03} />
      </mesh>

      {/* Back bulge — hair mass behind head */}
      <mesh position={[0, -0.02, -0.14]} scale={[1.05, 0.95, 0.85]}>
        <sphereGeometry args={[0.17, 14, 12]} />
        <meshStandardMaterial color={HAIR_DARK} roughness={0.58} metalness={0.03} />
      </mesh>

      {/* Side volume (subtle, not separate balls) */}
      <mesh position={[0.17, 0, -0.06]} rotation={[0, 0, -0.35]} scale={[0.55, 0.75, 0.9]}>
        <sphereGeometry args={[0.12, 10, 8]} />
        <meshStandardMaterial color={HAIR_MAIN} roughness={0.55} />
      </mesh>
      <mesh position={[-0.17, 0, -0.06]} rotation={[0, 0, 0.35]} scale={[0.55, 0.75, 0.9]}>
        <sphereGeometry args={[0.12, 10, 8]} />
        <meshStandardMaterial color={HAIR_MAIN} roughness={0.55} />
      </mesh>

      {/* Swept locks flowing backward */}
      {LOCKS.map((lock, i) => (
        <HairLock key={i} lock={lock} />
      ))}

      {/* Forehead hairline fringe */}
      <mesh position={[0, -0.04, 0.12]} rotation={[0.55, 0, 0]} scale={[1.1, 0.45, 0.7]}>
        <sphereGeometry args={[0.1, 10, 8]} />
        <meshStandardMaterial color={HAIR_DARK} roughness={0.6} />
      </mesh>
    </group>
  );
}
