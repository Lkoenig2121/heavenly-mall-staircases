"use client";

import { PERIMETER_INNER, PERIMETER_OUTER, UPPER_FLOOR_Y } from "@/lib/upper-level";
import { UPPER_INTERIORS } from "@/lib/store-interiors";
import type { StoreId } from "@/lib/types";
import StoreInterior from "./StoreInterior";

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
    </group>
  );
}

interface UpperLevelMallProps {
  unlockedStores: StoreId[];
  onEnterStore: (storeId: StoreId) => void;
}

export default function UpperLevelMall({ unlockedStores, onEnterStore }: UpperLevelMallProps) {
  return (
    <group>
      <PerimeterWalkway />
      {UPPER_INTERIORS.map((bounds) => (
        <StoreInterior
          key={bounds.storeId}
          bounds={bounds}
          unlocked={unlockedStores.includes(bounds.storeId)}
          onOpenShop={() => onEnterStore(bounds.storeId)}
        />
      ))}
    </group>
  );
}
