"use client";

import { useState } from "react";
import { Html } from "@react-three/drei";
import {
  PERIMETER_INNER,
  PERIMETER_OUTER,
  UPPER_FLOOR_Y,
} from "@/lib/upper-level";
import { STORES } from "@/lib/store-data";
import type { StoreId } from "@/lib/types";

const WALKWAY_W = PERIMETER_OUTER - PERIMETER_INNER;
const WALKWAY_CENTER = (PERIMETER_INNER + PERIMETER_OUTER) / 2;

function PerimeterWalkway() {
  const y = UPPER_FLOOR_Y - 0.05;
  const span = PERIMETER_OUTER * 2;

  return (
    <group>
      <mesh position={[0, y, -WALKWAY_CENTER]}>
        <boxGeometry args={[span, 0.1, WALKWAY_W]} />
        <meshStandardMaterial color="#e8dcc8" />
      </mesh>
      <mesh position={[0, y, WALKWAY_CENTER]}>
        <boxGeometry args={[span, 0.1, WALKWAY_W]} />
        <meshStandardMaterial color="#e8dcc8" />
      </mesh>
      <mesh position={[-WALKWAY_CENTER, y, 0]}>
        <boxGeometry args={[WALKWAY_W, 0.1, span - WALKWAY_W * 2]} />
        <meshStandardMaterial color="#e8dcc8" />
      </mesh>
      <mesh position={[WALKWAY_CENTER, y, 0]}>
        <boxGeometry args={[WALKWAY_W, 0.1, span - WALKWAY_W * 2]} />
        <meshStandardMaterial color="#e8dcc8" />
      </mesh>

      {[
        [0, -PERIMETER_OUTER, span, 0.08],
        [0, PERIMETER_OUTER, span, 0.08],
        [-PERIMETER_OUTER, 0, 0.08, span],
        [PERIMETER_OUTER, 0, 0.08, span],
      ].map(([x, z, w, d], i) => (
        <mesh key={i} position={[x, UPPER_FLOOR_Y + 0.5, z]}>
          <boxGeometry args={[w, 0.08, d]} />
          <meshStandardMaterial color="#c0a882" metalness={0.35} />
        </mesh>
      ))}

      {[
        [0, -PERIMETER_INNER, PERIMETER_INNER * 2, 0.06],
        [0, PERIMETER_INNER, PERIMETER_INNER * 2, 0.06],
        [-PERIMETER_INNER, 0, 0.06, PERIMETER_INNER * 2],
        [PERIMETER_INNER, 0, 0.06, PERIMETER_INNER * 2],
      ].map(([x, z, w, d], i) => (
        <mesh key={`inner-${i}`} position={[x, UPPER_FLOOR_Y + 0.45, z]}>
          <boxGeometry args={[w, 0.06, d]} />
          <meshStandardMaterial color="#b8956a" metalness={0.3} />
        </mesh>
      ))}

      <Html position={[0, UPPER_FLOOR_Y + 1.2, -WALKWAY_CENTER]} center distanceFactor={14}>
        <span className="pointer-events-none text-[10px] text-zinc-500 bg-white/70 px-2 rounded">
          Perimeter Walkway →
        </span>
      </Html>
    </group>
  );
}

function UpperStoreFront({
  storeId,
  unlocked,
  onEnter,
}: {
  storeId: StoreId;
  unlocked: boolean;
  onEnter: () => void;
}) {
  const store = STORES.find((s) => s.id === storeId)!;
  const [hovered, setHovered] = useState(false);
  const [x, y, z] = store.position;
  const rot = store.rotation;

  return (
    <group position={[x, y, z]} rotation={[0, rot, 0]}>
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[4, 1.8, 0.25]} />
        <meshStandardMaterial
          color={unlocked ? store.color : "#888"}
          emissive={store.color}
          emissiveIntensity={unlocked ? (hovered ? 0.3 : 0.12) : 0.02}
        />
      </mesh>
      <mesh position={[0, 0.15, 0.14]}>
        <boxGeometry args={[1.4, 1.1, 0.08]} />
        <meshStandardMaterial color={unlocked ? "#f5f0ea" : "#aaa"} />
      </mesh>
      <mesh position={[0, 1.15, 0.14]}>
        <boxGeometry args={[3.6, 0.5, 0.06]} />
        <meshStandardMaterial color={store.color} />
      </mesh>
      <mesh
        position={[0, 0.15, 0.2]}
        onPointerOver={() => unlocked && setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={(e) => {
          e.stopPropagation();
          if (unlocked) onEnter();
        }}
      >
        <boxGeometry args={[1.5, 1.2, 0.1]} />
        <meshStandardMaterial transparent opacity={0} />
      </mesh>
      <Html position={[0, 1.6, 0.2]} center distanceFactor={10}>
        <div className="pointer-events-none select-none text-center whitespace-nowrap">
          <span className="text-xs font-bold text-zinc-800">
            {store.emoji} {store.name}
          </span>
          {!unlocked && (
            <div className="text-[10px] text-red-600">🔒 {store.unlockStamps} stamps</div>
          )}
          {hovered && unlocked && (
            <div className="text-[10px] text-green-700 font-semibold">Click to enter</div>
          )}
        </div>
      </Html>
    </group>
  );
}

interface UpperLevelMallProps {
  unlockedStores: StoreId[];
  onEnterStore: (storeId: StoreId) => void;
}

export default function UpperLevelMall({ unlockedStores, onEnterStore }: UpperLevelMallProps) {
  const upperStores = STORES.filter((s) => s.upperLevel);

  return (
    <group>
      <PerimeterWalkway />
      {upperStores.map((store) => (
        <UpperStoreFront
          key={store.id}
          storeId={store.id}
          unlocked={unlockedStores.includes(store.id)}
          onEnter={() => onEnterStore(store.id)}
        />
      ))}
    </group>
  );
}
