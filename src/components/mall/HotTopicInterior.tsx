"use client";

import { useState } from "react";
import { Html } from "@react-three/drei";
import * as THREE from "three";

/** Interior extends beyond the mall back wall (z = -20) */
export const HT = {
  mallWallZ: -20,
  entranceZ: -19.6,
  backZ: -44,
  minX: -13,
  maxX: 13,
  /** Player can walk into interior when z is below this */
  thresholdZ: -17.5,
};

const RED = "#8b1a1a";
const RED_DARK = "#5c1010";
const TILE_LIGHT = "#b8b4ae";
const TILE_DARK = "#2a2a2a";
const GLASS = "#a8d8f0";

function DrumKit({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.35, 0.35, 0.12, 16]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0, 0.55, -0.15]}>
        <cylinderGeometry args={[0.22, 0.22, 0.08, 12]} />
        <meshStandardMaterial color="#cc2222" metalness={0.3} />
      </mesh>
      <mesh position={[-0.25, 0.5, 0.1]}>
        <cylinderGeometry args={[0.14, 0.14, 0.06, 10]} />
        <meshStandardMaterial color="#dddddd" metalness={0.4} />
      </mesh>
      <mesh position={[0.25, 0.48, 0.12]}>
        <cylinderGeometry args={[0.16, 0.16, 0.06, 10]} />
        <meshStandardMaterial color="#dddddd" metalness={0.4} />
      </mesh>
    </group>
  );
}

function Amp({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position}>
      <boxGeometry args={[0.55, 0.9, 0.35]} />
      <meshStandardMaterial color="#111111" roughness={0.8} />
    </mesh>
  );
}

function WallGuitar({
  position,
  color,
  rotation = 0,
}: {
  position: [number, number, number];
  color: string;
  rotation?: number;
}) {
  return (
    <group position={position} rotation={[0, rotation, -0.35]}>
      <mesh>
        <boxGeometry args={[0.08, 0.55, 0.22]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, -0.18, 0.02]}>
        <boxGeometry args={[0.14, 0.22, 0.04]} />
        <meshStandardMaterial color="#5c3a1e" />
      </mesh>
    </group>
  );
}

function DisplayCounter({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[1.8, 0.9, 0.7]} />
        <meshStandardMaterial color={RED} />
      </mesh>
      <mesh position={[0, 0.92, 0]}>
        <boxGeometry args={[1.85, 0.06, 0.75]} />
        <meshStandardMaterial color="#cc3333" />
      </mesh>
    </group>
  );
}

function CafeTable({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.42, 0]}>
        <cylinderGeometry args={[0.38, 0.38, 0.04, 16]} />
        <meshStandardMaterial color={GLASS} transparent opacity={0.7} metalness={0.2} />
      </mesh>
      {[
        [0.28, 0.2, 0.28],
        [-0.28, 0.2, 0.28],
        [0.28, 0.2, -0.28],
        [-0.28, 0.2, -0.28],
      ].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]}>
          <boxGeometry args={[0.12, 0.4, 0.12]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
      ))}
    </group>
  );
}

interface HotTopicInteriorProps {
  unlocked: boolean;
  onOpenShop: () => void;
}

export default function HotTopicInterior({ unlocked, onOpenShop }: HotTopicInteriorProps) {
  const [hovered, setHovered] = useState(false);
  const width = HT.maxX - HT.minX;
  const depth = HT.mallWallZ - HT.backZ;
  const centerX = (HT.minX + HT.maxX) / 2;
  const centerZ = (HT.mallWallZ + HT.backZ) / 2;

  return (
    <group>
      {/* ── Floor (extends outside mall boundary) ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[centerX, 0.01, centerZ]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color={TILE_LIGHT} />
      </mesh>
      {/* Dark tile runway through center */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, -30]}>
        <planeGeometry args={[5, 22]} />
        <meshStandardMaterial color={TILE_DARK} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-4, 0.015, -28]}>
        <planeGeometry args={[4, 10]} />
        <meshStandardMaterial color={TILE_DARK} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[5, 0.015, -32]}>
        <planeGeometry args={[4, 14]} />
        <meshStandardMaterial color={TILE_DARK} />
      </mesh>

      {/* ── Red walls ── */}
      <mesh position={[HT.minX, 3, centerZ]}>
        <boxGeometry args={[0.4, 6, depth]} />
        <meshStandardMaterial color={RED} />
      </mesh>
      <mesh position={[HT.maxX, 3, centerZ]}>
        <boxGeometry args={[0.4, 6, depth]} />
        <meshStandardMaterial color={RED} />
      </mesh>
      <mesh position={[centerX, 3, HT.backZ]}>
        <boxGeometry args={[width, 6, 0.4]} />
        <meshStandardMaterial color={RED_DARK} />
      </mesh>

      {/* Ceiling over interior */}
      <mesh position={[centerX, 6, centerZ]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#f5f0ea" side={THREE.BackSide} />
      </mesh>

      {/* ── Mall wall with doorway (entrance from inside mall) ── */}
      {/* Left wall segment */}
      <mesh position={[-11, 3, HT.mallWallZ]}>
        <boxGeometry args={[18, 6, 0.5]} />
        <meshStandardMaterial color="#f0e4d4" />
      </mesh>
      {/* Right wall segment */}
      <mesh position={[11, 3, HT.mallWallZ]}>
        <boxGeometry args={[18, 6, 0.5]} />
        <meshStandardMaterial color="#f0e4d4" />
      </mesh>
      {/* Lintel above door */}
      <mesh position={[0, 4.25, HT.mallWallZ]}>
        <boxGeometry args={[4, 1.5, 0.5]} />
        <meshStandardMaterial color="#f0e4d4" />
      </mesh>

      {/* Glass double doors */}
      <mesh position={[-0.9, 1.35, HT.entranceZ]}>
        <boxGeometry args={[1.6, 2.5, 0.08]} />
        <meshStandardMaterial color={GLASS} transparent opacity={0.45} metalness={0.3} />
      </mesh>
      <mesh position={[0.9, 1.35, HT.entranceZ]}>
        <boxGeometry args={[1.6, 2.5, 0.08]} />
        <meshStandardMaterial color={GLASS} transparent opacity={0.45} metalness={0.3} />
      </mesh>
      <mesh position={[0, 1.35, HT.entranceZ]}>
        <boxGeometry args={[0.08, 2.5, 0.1]} />
        <meshStandardMaterial color="#888888" metalness={0.5} />
      </mesh>

      {/* Hot Topic sign over door (visible from mall) */}
      <Html position={[0, 3.6, HT.mallWallZ + 0.3]} center distanceFactor={14}>
        <div className="pointer-events-none select-none text-center">
          <div className="bg-black text-white font-black text-sm px-4 py-1 tracking-widest border-2 border-purple-500">
            HOT TOPIC
          </div>
          <div className="text-[10px] text-zinc-600 mt-0.5">walk through the wall →</div>
        </div>
      </Html>

      {/* ── Left wall: drums + amps ── */}
      <DrumKit position={[-9, 0, -24]} />
      <DrumKit position={[-9, 0, -30]} />
      <DrumKit position={[-9, 0, -36]} />
      <Amp position={[-11.5, 0.45, -26]} />
      <Amp position={[-11.5, 0.45, -32]} />
      <Amp position={[-11.5, 0.45, -38]} />

      {/* ── Back wall guitars ── */}
      <WallGuitar position={[-4, 3.2, HT.backZ + 0.3]} color="#e8c820" />
      <WallGuitar position={[0, 3.3, HT.backZ + 0.3]} color="#9933cc" />
      <WallGuitar position={[4, 3.1, HT.backZ + 0.3]} color="#222222" />
      <DisplayCounter position={[-5, 0, HT.backZ + 1.2]} />
      <DisplayCounter position={[5, 0, HT.backZ + 1.2]} />

      {/* ── Center keyboard island ── */}
      <mesh position={[0, 0.42, -30]}>
        <boxGeometry args={[3.5, 0.84, 2.2]} />
        <meshStandardMaterial color={RED} />
      </mesh>
      <mesh position={[-0.7, 0.92, -30.2]} rotation={[0, 0.1, 0]}>
        <boxGeometry args={[1.2, 0.06, 0.4]} />
        <meshStandardMaterial color="#eeeeee" />
      </mesh>
      <mesh position={[0.7, 0.92, -29.8]} rotation={[0, -0.1, 0]}>
        <boxGeometry args={[1.2, 0.06, 0.4]} />
        <meshStandardMaterial color="#eeeeee" />
      </mesh>

      {/* ── Right wall: keyboards + counters ── */}
      <mesh position={[9, 0.5, -27]}>
        <boxGeometry args={[0.8, 0.06, 0.35]} />
        <meshStandardMaterial color="#eeeeee" />
      </mesh>
      <mesh position={[9, 0.75, -27]}>
        <boxGeometry args={[0.5, 0.5, 0.15]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      <DisplayCounter position={[9, 0, -33]} />
      <DisplayCounter position={[9, 0, -39]} />
      <Amp position={[11.5, 0.45, -28]} />
      <Amp position={[11.5, 0.45, -35]} />

      {/* ── Cafe lounge (bottom-left corner) ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-9, 0.02, -40]}>
        <planeGeometry args={[7, 7]} />
        <meshStandardMaterial color="#d4cfc8" />
      </mesh>
      <CafeTable position={[-11, 0, -38]} />
      <CafeTable position={[-7.5, 0, -38]} />
      <CafeTable position={[-11, 0, -42]} />
      <CafeTable position={[-7.5, 0, -42]} />
      {/* Glass sunroof */}
      <mesh position={[-9, 5.5, -40]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[7, 7]} />
        <meshStandardMaterial color={GLASS} transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[-9, 5.5, -40]}>
        <boxGeometry args={[7, 0.08, 7]} />
        <meshStandardMaterial color="#cccccc" wireframe />
      </mesh>
      <mesh position={[-5.5, 1.5, -36.5]}>
        <sphereGeometry args={[0.5, 10, 8]} />
        <meshStandardMaterial color="#44aa44" />
      </mesh>

      {/* ── Checkout counter (opens shop UI) ── */}
      <mesh
        position={[0, 0.55, -22]}
        onPointerOver={() => unlocked && setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={(e) => {
          e.stopPropagation();
          if (unlocked) onOpenShop();
        }}
      >
        <boxGeometry args={[3.5, 1.1, 1]} />
        <meshStandardMaterial
          color={unlocked ? (hovered ? "#222222" : "#111111") : "#444444"}
          emissive={hovered && unlocked ? "#6600cc" : "#000000"}
          emissiveIntensity={hovered ? 0.35 : 0}
        />
      </mesh>
      <Html position={[0, 1.5, -22]} center distanceFactor={12}>
        <div className="pointer-events-none select-none text-center whitespace-nowrap">
          <span className="text-white font-bold text-xs bg-black/80 px-2 py-1 rounded">
            🖤 HOT TOPIC — {unlocked ? (hovered ? "Click to Shop" : "Checkout") : "Closed"}
          </span>
        </div>
      </Html>

      {/* Exterior pavement beyond store (outside the map) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, HT.backZ - 4]}>
        <planeGeometry args={[30, 10]} />
        <meshStandardMaterial color="#6a6a6a" />
      </mesh>
      <mesh position={[0, 0.15, HT.backZ - 8]}>
        <boxGeometry args={[30, 0.3, 0.4]} />
        <meshStandardMaterial color="#eeeeee" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, HT.backZ - 12]}>
        <planeGeometry args={[40, 16]} />
        <meshStandardMaterial color="#3d8c3d" />
      </mesh>
    </group>
  );
}

export function clampMallGround(pos: THREE.Vector3) {
  const inHotTopic =
    pos.x >= HT.minX &&
    pos.x <= HT.maxX &&
    pos.z <= HT.entranceZ + 0.5 &&
    pos.z >= HT.backZ + 1.5;

  if (inHotTopic) {
    pos.x = THREE.MathUtils.clamp(pos.x, HT.minX + 0.5, HT.maxX - 0.5);
    pos.z = THREE.MathUtils.clamp(pos.z, HT.backZ + 1.5, HT.entranceZ + 0.5);
    return;
  }

  // Full first-floor mall — north opens into the Hot Topic door corridor
  pos.x = THREE.MathUtils.clamp(pos.x, -18, 18);
  pos.z = THREE.MathUtils.clamp(pos.z, -18, 18);
}
