"use client";

import { HAIR_TOP_Y } from "./SpikyHair";

type HeadwearStyle = "cap" | "beanie" | "crown" | "visor";

function styleForItem(itemId: string): HeadwearStyle {
  if (itemId === "toy-hat") return "crown";
  if (itemId === "music-hat") return "beanie";
  if (itemId === "tech-visor") return "visor";
  return "cap";
}

interface HeadwearProps {
  itemId: string;
  color: string;
}

function Crown({ color }: { color: string }) {
  const bandY = HAIR_TOP_Y - 0.05;
  const points: [number, number, number][] = [
    [0, 0.14, 0],
    [0.1, 0.1, 0.02],
    [-0.1, 0.1, 0.02],
    [0.06, 0.1, -0.09],
    [-0.06, 0.1, -0.09],
  ];

  return (
    <group position={[0, bandY, 0]}>
      {/* Band resting on hair */}
      <mesh>
        <torusGeometry args={[0.2, 0.035, 8, 20]} />
        <meshStandardMaterial color={color} metalness={0.35} roughness={0.45} />
      </mesh>
      <mesh position={[0, -0.02, 0]}>
        <cylinderGeometry args={[0.2, 0.21, 0.06, 16]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.5} />
      </mesh>
      {/* Jewel */}
      <mesh position={[0, 0.02, 0.19]}>
        <boxGeometry args={[0.06, 0.06, 0.04]} />
        <meshStandardMaterial color="#ff4466" emissive="#ff2244" emissiveIntensity={0.3} />
      </mesh>
      {points.map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]}>
          <coneGeometry args={[0.045, 0.12, 4]} />
          <meshStandardMaterial color={color} metalness={0.4} roughness={0.4} flatShading />
        </mesh>
      ))}
    </group>
  );
}

function Cap({ color }: { color: string }) {
  const baseY = HAIR_TOP_Y - 0.08;
  return (
    <group position={[0, baseY, 0]}>
      <mesh position={[0, 0.04, 0]}>
        <sphereGeometry args={[0.2, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.01, 0.2]} rotation={[0.12, 0, 0]}>
        <boxGeometry args={[0.38, 0.03, 0.18]} />
        <meshStandardMaterial color={color} roughness={0.75} />
      </mesh>
      <mesh position={[0, 0.08, -0.02]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}

function Beanie({ color }: { color: string }) {
  const baseY = HAIR_TOP_Y - 0.07;
  return (
    <group position={[0, baseY, 0]}>
      <mesh position={[0, 0.05, 0]}>
        <sphereGeometry args={[0.21, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      <mesh position={[0, -0.02, 0]}>
        <torusGeometry args={[0.21, 0.04, 8, 20]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.12, 0]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
    </group>
  );
}

function Visor({ color }: { color: string }) {
  return (
    <group position={[0, 1.6, 0.14]}>
      <mesh>
        <boxGeometry args={[0.36, 0.07, 0.1]} />
        <meshStandardMaterial color={color} metalness={0.2} roughness={0.5} />
      </mesh>
      <mesh position={[0, -0.02, 0.1]} rotation={[0.45, 0, 0]}>
        <boxGeometry args={[0.34, 0.12, 0.02]} />
        <meshStandardMaterial
          color="#88ccff"
          transparent
          opacity={0.55}
          metalness={0.6}
          roughness={0.15}
        />
      </mesh>
    </group>
  );
}

export default function Headwear({ itemId, color }: HeadwearProps) {
  const style = styleForItem(itemId);

  switch (style) {
    case "crown":
      return <Crown color={color} />;
    case "beanie":
      return <Beanie color={color} />;
    case "visor":
      return <Visor color={color} />;
    default:
      return <Cap color={color} />;
  }
}
