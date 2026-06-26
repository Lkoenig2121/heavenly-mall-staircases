"use client";

import SpikyHair from "./SpikyHair";
import Headwear from "./Headwear";
import { CLOTHING } from "@/lib/store-data";
import type { ClothingSlot } from "@/lib/types";

const SKIN = "#e8c870";
const DEFAULTS: Record<ClothingSlot, string> = {
  head: SKIN,
  torso: "#4a6fa5",
  legs: "#3d4f6f",
  feet: "#2a2a2a",
  accessory: "",
};

function itemForSlot(equipped: Partial<Record<ClothingSlot, string>>, slot: ClothingSlot) {
  const id = equipped[slot];
  if (!id) return null;
  return CLOTHING.find((c) => c.id === id) ?? null;
}

interface PlayerAvatarProps {
  equipped: Partial<Record<ClothingSlot, string>>;
}

function RobloxFace() {
  return (
    <group position={[0, 1.55, 0.19]}>
      {/* Eyes */}
      <mesh position={[-0.07, 0.03, 0]}>
        <sphereGeometry args={[0.045, 8, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0.07, 0.03, 0]}>
        <sphereGeometry args={[0.045, 8, 8]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      {/* Eyebrows */}
      <mesh position={[-0.07, 0.09, 0.01]} rotation={[0, 0, 0.2]}>
        <boxGeometry args={[0.07, 0.015, 0.02]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0.07, 0.09, 0.01]} rotation={[0, 0, -0.2]}>
        <boxGeometry args={[0.07, 0.015, 0.02]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      {/* Smile */}
      <mesh position={[0, -0.06, 0]} rotation={[0.15, 0, 0]}>
        <torusGeometry args={[0.07, 0.018, 8, 16, Math.PI]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0, -0.055, 0.01]}>
        <boxGeometry args={[0.1, 0.04, 0.02]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}

export default function PlayerAvatar({ equipped }: PlayerAvatarProps) {
  const head = itemForSlot(equipped, "head");
  const torso = itemForSlot(equipped, "torso");
  const legs = itemForSlot(equipped, "legs");
  const feet = itemForSlot(equipped, "feet");
  const accessory = itemForSlot(equipped, "accessory");

  const torsoColor = torso?.color ?? DEFAULTS.torso;
  const legsColor = legs?.color ?? DEFAULTS.legs;
  const feetColor = feet?.color ?? DEFAULTS.feet;

  return (
    <group>
      {/* Head — always skin tone; headwear is separate */}
      <mesh position={[0, 1.55, 0]}>
        <sphereGeometry args={[0.22, 12, 12]} />
        <meshStandardMaterial color={SKIN} roughness={0.75} />
      </mesh>

      <RobloxFace />
      <SpikyHair />

      {head && <Headwear itemId={head.id} color={head.color} />}

      {/* Torso */}
      <mesh position={[0, 1.05, 0]}>
        <boxGeometry args={[0.52, 0.62, 0.28]} />
        <meshStandardMaterial color={torsoColor} />
      </mesh>

      {/* Legs */}
      <mesh position={[0, 0.48, 0]}>
        <boxGeometry args={[0.46, 0.52, 0.26]} />
        <meshStandardMaterial color={legsColor} />
      </mesh>

      {/* Feet */}
      <mesh position={[-0.12, 0.1, 0.04]}>
        <boxGeometry args={[0.18, 0.1, 0.28]} />
        <meshStandardMaterial color={feetColor} />
      </mesh>
      <mesh position={[0.12, 0.1, 0.04]}>
        <boxGeometry args={[0.18, 0.1, 0.28]} />
        <meshStandardMaterial color={feetColor} />
      </mesh>

      {/* Accessory */}
      {accessory && (
        <mesh position={[0.22, 1.18, 0]} rotation={[0, 0, -0.4]}>
          <boxGeometry args={[0.08, 0.5, 0.08]} />
          <meshStandardMaterial color={accessory.color} />
        </mesh>
      )}
    </group>
  );
}
