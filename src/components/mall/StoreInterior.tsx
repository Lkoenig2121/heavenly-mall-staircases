"use client";

import { useState } from "react";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { STORES } from "@/lib/store-data";
import type { StoreInteriorBounds } from "@/lib/store-interiors";
import {
  entrancePlane,
  interiorCenter,
  interiorDepth,
  interiorWidth,
} from "@/lib/store-interiors";
import type { StoreId } from "@/lib/types";

const MALL_WALL = "#f0e4d4";
const GLASS = "#a8d8f0";
const TILE_LIGHT = "#b8b4ae";

function darken(hex: string, amount = 0.25) {
  const c = new THREE.Color(hex);
  c.lerp(new THREE.Color("#000000"), amount);
  return `#${c.getHexString()}`;
}

function ShelfRow({
  position,
  color,
  count = 3,
}: {
  position: [number, number, number];
  color: string;
  count?: number;
}) {
  return (
    <group position={position}>
      <mesh position={[0, 0.9, 0]}>
        <boxGeometry args={[count * 1.1, 1.8, 0.45]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {Array.from({ length: count }).map((_, i) => (
        <mesh key={i} position={[(i - (count - 1) / 2) * 1.05, 1.45, 0.15]}>
          <boxGeometry args={[0.7, 0.55, 0.35]} />
          <meshStandardMaterial color={darken(color, 0.15 + i * 0.05)} />
        </mesh>
      ))}
    </group>
  );
}

function DisplayTable({
  position,
  color,
}: {
  position: [number, number, number];
  color: string;
}) {
  return (
    <group position={position}>
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[2, 0.9, 1.1]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.92, 0]}>
        <boxGeometry args={[2.05, 0.06, 1.15]} />
        <meshStandardMaterial color={darken(color, 0.1)} />
      </mesh>
    </group>
  );
}

function ArcadeCabinet({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.75, 0]}>
        <boxGeometry args={[0.9, 1.5, 0.7]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
      <mesh position={[0, 1.35, 0.28]}>
        <boxGeometry args={[0.75, 0.55, 0.05]} />
        <meshStandardMaterial color="#ff2d6a" emissive="#ff2d6a" emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
}

function HotTopicExtras({ bounds }: { bounds: StoreInteriorBounds }) {
  const cz = (bounds.minZ + bounds.maxZ) / 2;
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, bounds.floorY + 0.015, -30]}>
        <planeGeometry args={[5, 22]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>
      {[-9, -30, -36].map((z, i) => (
        <group key={i} position={[-9, bounds.floorY, z]}>
          <mesh position={[0, 0.35, 0]}>
            <cylinderGeometry args={[0.35, 0.35, 0.12, 12]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>
        </group>
      ))}
      {[-26, -32, -38].map((z, i) => (
        <mesh key={i} position={[-11.5, bounds.floorY + 0.45, z]}>
          <boxGeometry args={[0.55, 0.9, 0.35]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
      ))}
      <mesh position={[0, bounds.floorY + 0.42, cz - 2]}>
        <boxGeometry args={[3.5, 0.84, 2.2]} />
        <meshStandardMaterial color="#8b1a1a" />
      </mesh>
    </group>
  );
}

function ThemedProps({ storeId, bounds, color }: { storeId: StoreId; bounds: StoreInteriorBounds; color: string }) {
  const [cx, floorY, cz] = interiorCenter(bounds);
  const depth = interiorDepth(bounds);
  const width = interiorWidth(bounds);
  const backOffset = depth * 0.42;

  if (storeId === "hottopic") {
    return <HotTopicExtras bounds={bounds} />;
  }

  const props: React.ReactNode[] = [];

  switch (storeId) {
    case "arcade":
      [-4, 0, 4].forEach((x, i) =>
        props.push(<ArcadeCabinet key={i} position={[cx + x, floorY, cz + backOffset * 0.3]} />),
      );
      props.push(<ShelfRow position={[cx, floorY, cz - backOffset]} color={color} count={4} />);
      break;
    case "music":
      props.push(<ShelfRow position={[cx - width * 0.25, floorY, cz]} color={color} count={3} />);
      props.push(<ShelfRow position={[cx + width * 0.25, floorY, cz]} color={darken(color)} count={3} />);
      [-3, 3].forEach((z, i) => (
        props.push(
          <mesh key={`vinyl-${i}`} position={[cx + backOffset * 0.35, floorY + 1.2, cz + z]}>
            <cylinderGeometry args={[0.35, 0.35, 0.04, 16]} />
            <meshStandardMaterial color="#111111" />
          </mesh>,
        )
      ));
      break;
    case "toys":
      for (let i = 0; i < 6; i++) {
        props.push(
          <mesh key={i} position={[cx + (i % 3 - 1) * 2.2, floorY + 0.5, cz + Math.floor(i / 3) * 2.5 - backOffset * 0.2]}>
            <boxGeometry args={[0.9, 1, 0.9]} />
            <meshStandardMaterial color={i % 2 === 0 ? color : darken(color, 0.2)} />
          </mesh>,
        );
      }
      break;
    case "food":
      props.push(<DisplayTable position={[cx - 2.5, floorY, cz + backOffset * 0.2]} color={color} />);
      props.push(<DisplayTable position={[cx + 2.5, floorY, cz + backOffset * 0.2]} color={darken(color)} />);
      props.push(
        <mesh position={[cx, floorY + 0.6, cz - backOffset * 0.3]}>
          <cylinderGeometry args={[0.5, 0.55, 1.2, 8]} />
          <meshStandardMaterial color="#cc4444" />
        </mesh>,
      );
      break;
    case "electronics":
      props.push(<ShelfRow position={[cx, floorY, cz - 1]} color={color} count={4} />);
      props.push(<ShelfRow position={[cx, floorY, cz + 2.5]} color={darken(color)} count={3} />);
      break;
    case "books":
      for (let row = 0; row < 4; row++) {
        props.push(
          <mesh key={row} position={[cx - backOffset * 0.3 + row * 1.5, floorY + 1.1, cz]}>
            <boxGeometry args={[0.35, 2.2, width * 0.55]} />
            <meshStandardMaterial color={row % 2 === 0 ? color : darken(color, 0.15)} />
          </mesh>,
        );
      }
      break;
    case "kiosk":
      props.push(
        <mesh position={[cx, floorY + 0.8, cz + backOffset * 0.15]} rotation={[0, 0, 0]}>
          <cylinderGeometry args={[1.2, 1.2, 0.08, 16]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} />
        </mesh>,
      );
      [-2.5, 0, 2.5].forEach((x, i) =>
        props.push(<DisplayTable key={i} position={[cx + x, floorY, cz - backOffset * 0.25]} color={darken(color, i * 0.05)} />),
      );
      break;
    case "cellular":
      props.push(<ShelfRow position={[cx - backOffset * 0.2, floorY, cz - 2]} color={color} count={2} />);
      props.push(<ShelfRow position={[cx - backOffset * 0.2, floorY, cz + 2]} color={color} count={2} />);
      props.push(
        <mesh position={[cx + backOffset * 0.25, floorY + 1, cz]}>
          <boxGeometry args={[1.2, 2, 0.15]} />
          <meshStandardMaterial color="#111111" emissive={color} emissiveIntensity={0.15} />
        </mesh>,
      );
      break;
    case "smoothie":
      props.push(
        <mesh position={[cx, floorY + 0.7, cz + backOffset * 0.2]}>
          <boxGeometry args={[3, 1.4, 1.2]} />
          <meshStandardMaterial color={color} />
        </mesh>,
      );
      [-2, 2].forEach((x, i) =>
        props.push(
          <mesh key={i} position={[cx + x, floorY + 0.5, cz - backOffset * 0.2]}>
            <cylinderGeometry args={[0.25, 0.25, 1, 10]} />
            <meshStandardMaterial color={i === 0 ? "#7cb342" : "#ff9800"} />
          </mesh>,
        ),
      );
      break;
    case "watches":
      props.push(<DisplayTable position={[cx + backOffset * 0.2, floorY, cz - 2]} color={color} />);
      props.push(<DisplayTable position={[cx + backOffset * 0.2, floorY, cz + 2]} color={darken(color)} />);
      props.push(
        <mesh position={[cx + backOffset * 0.35, floorY + 1.3, cz]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.55, 0.08, 8, 24]} />
          <meshStandardMaterial color={color} metalness={0.6} />
        </mesh>,
      );
      break;
  }

  return <group>{props}</group>;
}

function MallWallWithDoor({
  bounds,
  wallColor,
}: {
  bounds: StoreInteriorBounds;
  wallColor: string;
}) {
  const plane = entrancePlane(bounds);
  const doorW = bounds.doorWidth;
  const wallH = bounds.floorY > 0 ? 4.5 : 6;
  const wallY = bounds.floorY + wallH / 2;
  const thickness = 0.5;
  const cx = (bounds.minX + bounds.maxX) / 2;
  const cz = (bounds.minZ + bounds.maxZ) / 2;
  const spanW = interiorWidth(bounds);
  const spanD = interiorDepth(bounds);
  const lintelH = 1.5;
  const seg = (span: number) => (span - doorW) / 2;

  switch (bounds.mallFacing) {
    case "south": {
      const s = seg(spanW);
      return (
        <group>
          <mesh position={[cx - doorW / 2 - s / 2, wallY, plane]}>
            <boxGeometry args={[s, wallH, thickness]} />
            <meshStandardMaterial color={wallColor} />
          </mesh>
          <mesh position={[cx + doorW / 2 + s / 2, wallY, plane]}>
            <boxGeometry args={[s, wallH, thickness]} />
            <meshStandardMaterial color={wallColor} />
          </mesh>
          <mesh position={[cx, bounds.floorY + wallH - lintelH / 2, plane]}>
            <boxGeometry args={[doorW, lintelH, thickness]} />
            <meshStandardMaterial color={wallColor} />
          </mesh>
        </group>
      );
    }
    case "north": {
      const s = seg(spanW);
      return (
        <group>
          <mesh position={[cx - doorW / 2 - s / 2, wallY, plane]}>
            <boxGeometry args={[s, wallH, thickness]} />
            <meshStandardMaterial color={wallColor} />
          </mesh>
          <mesh position={[cx + doorW / 2 + s / 2, wallY, plane]}>
            <boxGeometry args={[s, wallH, thickness]} />
            <meshStandardMaterial color={wallColor} />
          </mesh>
          <mesh position={[cx, bounds.floorY + wallH - lintelH / 2, plane]}>
            <boxGeometry args={[doorW, lintelH, thickness]} />
            <meshStandardMaterial color={wallColor} />
          </mesh>
        </group>
      );
    }
    case "east": {
      const s = seg(spanD);
      return (
        <group>
          <mesh position={[plane, wallY, cz - doorW / 2 - s / 2]}>
            <boxGeometry args={[thickness, wallH, s]} />
            <meshStandardMaterial color={wallColor} />
          </mesh>
          <mesh position={[plane, wallY, cz + doorW / 2 + s / 2]}>
            <boxGeometry args={[thickness, wallH, s]} />
            <meshStandardMaterial color={wallColor} />
          </mesh>
          <mesh position={[plane, bounds.floorY + wallH - lintelH / 2, cz]}>
            <boxGeometry args={[thickness, lintelH, doorW]} />
            <meshStandardMaterial color={wallColor} />
          </mesh>
        </group>
      );
    }
    case "west": {
      const s = seg(spanD);
      return (
        <group>
          <mesh position={[plane, wallY, cz - doorW / 2 - s / 2]}>
            <boxGeometry args={[thickness, wallH, s]} />
            <meshStandardMaterial color={wallColor} />
          </mesh>
          <mesh position={[plane, wallY, cz + doorW / 2 + s / 2]}>
            <boxGeometry args={[thickness, wallH, s]} />
            <meshStandardMaterial color={wallColor} />
          </mesh>
          <mesh position={[plane, bounds.floorY + wallH - lintelH / 2, cz]}>
            <boxGeometry args={[thickness, lintelH, doorW]} />
            <meshStandardMaterial color={wallColor} />
          </mesh>
        </group>
      );
    }
  }
}

function GlassDoors({ bounds }: { bounds: StoreInteriorBounds }) {
  const plane = entrancePlane(bounds);
  const cx = (bounds.minX + bounds.maxX) / 2;
  const cz = (bounds.minZ + bounds.maxZ) / 2;
  const doorY = bounds.floorY + 1.35;
  const inset = bounds.mallFacing === "south" || bounds.mallFacing === "north" ? 0.4 : 0.4;

  switch (bounds.mallFacing) {
    case "south":
      return (
        <group>
          <mesh position={[cx - 0.9, doorY, plane - inset]}>
            <boxGeometry args={[1.6, 2.5, 0.08]} />
            <meshStandardMaterial color={GLASS} transparent opacity={0.45} metalness={0.3} />
          </mesh>
          <mesh position={[cx + 0.9, doorY, plane - inset]}>
            <boxGeometry args={[1.6, 2.5, 0.08]} />
            <meshStandardMaterial color={GLASS} transparent opacity={0.45} metalness={0.3} />
          </mesh>
        </group>
      );
    case "north":
      return (
        <group>
          <mesh position={[cx - 0.9, doorY, plane + inset]}>
            <boxGeometry args={[1.6, 2.5, 0.08]} />
            <meshStandardMaterial color={GLASS} transparent opacity={0.45} metalness={0.3} />
          </mesh>
          <mesh position={[cx + 0.9, doorY, plane + inset]}>
            <boxGeometry args={[1.6, 2.5, 0.08]} />
            <meshStandardMaterial color={GLASS} transparent opacity={0.45} metalness={0.3} />
          </mesh>
        </group>
      );
    case "east":
      return (
        <group>
          <mesh position={[plane - inset, doorY, cz - 0.9]}>
            <boxGeometry args={[0.08, 2.5, 1.6]} />
            <meshStandardMaterial color={GLASS} transparent opacity={0.45} metalness={0.3} />
          </mesh>
          <mesh position={[plane - inset, doorY, cz + 0.9]}>
            <boxGeometry args={[0.08, 2.5, 1.6]} />
            <meshStandardMaterial color={GLASS} transparent opacity={0.45} metalness={0.3} />
          </mesh>
        </group>
      );
    case "west":
      return (
        <group>
          <mesh position={[plane + inset, doorY, cz - 0.9]}>
            <boxGeometry args={[0.08, 2.5, 1.6]} />
            <meshStandardMaterial color={GLASS} transparent opacity={0.45} metalness={0.3} />
          </mesh>
          <mesh position={[plane + inset, doorY, cz + 0.9]}>
            <boxGeometry args={[0.08, 2.5, 1.6]} />
            <meshStandardMaterial color={GLASS} transparent opacity={0.45} metalness={0.3} />
          </mesh>
        </group>
      );
  }
}

function checkoutPosition(bounds: StoreInteriorBounds): [number, number, number] {
  const [cx, floorY, cz] = interiorCenter(bounds);
  const depth = interiorDepth(bounds);
  const offset = Math.min(4, depth * 0.22);

  switch (bounds.mallFacing) {
    case "south":
      return [cx, floorY, bounds.maxZ - offset];
    case "north":
      return [cx, floorY, bounds.minZ + offset];
    case "east":
      return [bounds.maxX - offset, floorY, cz];
    case "west":
      return [bounds.minX + offset, floorY, cz];
  }
}

function signPosition(bounds: StoreInteriorBounds): [number, number, number] {
  const plane = entrancePlane(bounds);
  const cx = (bounds.minX + bounds.maxX) / 2;
  const cz = (bounds.minZ + bounds.maxZ) / 2;
  const signY = bounds.floorY + (bounds.floorY > 0 ? 2.8 : 3.6);
  const out = 0.35;

  switch (bounds.mallFacing) {
    case "south":
      return [cx, signY, plane + out];
    case "north":
      return [cx, signY, plane - out];
    case "east":
      return [plane + out, signY, cz];
    case "west":
      return [plane - out, signY, cz];
  }
}

interface StoreInteriorProps {
  bounds: StoreInteriorBounds;
  unlocked: boolean;
  onOpenShop: () => void;
}

export default function StoreInterior({ bounds, unlocked, onOpenShop }: StoreInteriorProps) {
  const [hovered, setHovered] = useState(false);
  const store = STORES.find((s) => s.id === bounds.storeId)!;
  const [cx, floorY, cz] = interiorCenter(bounds);
  const width = bounds.maxX - bounds.minX;
  const depth = bounds.maxZ - bounds.minZ;
  const wallColor = store.id === "hottopic" ? "#8b1a1a" : store.color;
  const wallDark = darken(store.color, 0.35);
  const ceilingY = floorY + (bounds.floorY > 0 ? 4.2 : 6);
  const [checkoutX, , checkoutZ] = checkoutPosition(bounds);
  const [signX, signY, signZ] = signPosition(bounds);
  const isUpper = bounds.floorY > 0;

  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, floorY + 0.01, cz]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color={isUpper ? "#e8dcc8" : TILE_LIGHT} />
      </mesh>

      {/* Accent floor strip */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, floorY + 0.015, cz]}>
        <planeGeometry args={[width * 0.35, depth * 0.55]} />
        <meshStandardMaterial color={darken(store.color, 0.5)} />
      </mesh>

      {/* Side & back walls */}
      {bounds.mallFacing !== "east" && (
        <mesh position={[bounds.minX, floorY + (ceilingY - floorY) / 2, cz]}>
          <boxGeometry args={[0.4, ceilingY - floorY, depth]} />
          <meshStandardMaterial color={wallColor} />
        </mesh>
      )}
      {bounds.mallFacing !== "west" && (
        <mesh position={[bounds.maxX, floorY + (ceilingY - floorY) / 2, cz]}>
          <boxGeometry args={[0.4, ceilingY - floorY, depth]} />
          <meshStandardMaterial color={wallColor} />
        </mesh>
      )}
      {bounds.mallFacing !== "south" && (
        <mesh position={[cx, floorY + (ceilingY - floorY) / 2, bounds.minZ]}>
          <boxGeometry args={[width, ceilingY - floorY, 0.4]} />
          <meshStandardMaterial color={wallDark} />
        </mesh>
      )}
      {bounds.mallFacing !== "north" && (
        <mesh position={[cx, floorY + (ceilingY - floorY) / 2, bounds.maxZ]}>
          <boxGeometry args={[width, ceilingY - floorY, 0.4]} />
          <meshStandardMaterial color={wallDark} />
        </mesh>
      )}

      {/* Mall-facing wall with doorway */}
      <MallWallWithDoor bounds={bounds} wallColor={MALL_WALL} />
      <GlassDoors bounds={bounds} />

      {/* Ceiling */}
      <mesh position={[cx, ceilingY, cz]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#f5f0ea" side={THREE.BackSide} />
      </mesh>

      <ThemedProps storeId={bounds.storeId} bounds={bounds} color={store.color} />

      {/* Checkout counter */}
      <mesh
        position={[checkoutX, floorY + 0.55, checkoutZ]}
        onPointerOver={() => unlocked && setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={(e) => {
          e.stopPropagation();
          if (unlocked) onOpenShop();
        }}
      >
        <boxGeometry args={[isUpper ? 4.5 : 3.5, 1.1, 1.2]} />
        <meshStandardMaterial
          color={unlocked ? (hovered ? darken(store.color, 0.1) : store.color) : "#666666"}
          emissive={store.color}
          emissiveIntensity={hovered && unlocked ? 0.35 : unlocked ? 0.08 : 0}
        />
      </mesh>

      <Html position={[checkoutX, floorY + 1.5, checkoutZ]} center distanceFactor={isUpper ? 11 : 12}>
        <div className="pointer-events-none select-none text-center whitespace-nowrap">
          <span
            className="font-bold text-xs px-2 py-1 rounded"
            style={{
              background: unlocked ? "rgba(0,0,0,0.8)" : "rgba(80,80,80,0.9)",
              color: "#fff",
            }}
          >
            {store.emoji} {store.name} —{" "}
            {unlocked ? (hovered ? "Click to Shop" : "Checkout") : `🔒 ${store.unlockStamps} stamps`}
          </span>
        </div>
      </Html>

      {/* Store sign at entrance */}
      <Html position={[signX, signY, signZ]} center distanceFactor={isUpper ? 12 : 14}>
        <div className="pointer-events-none select-none text-center">
          <div
            className="font-black text-sm px-4 py-1 tracking-wide border-2"
            style={{
              background: store.id === "hottopic" ? "#000" : store.color,
              color: "#fff",
              borderColor: darken(store.color, 0.2),
            }}
          >
            {store.name.toUpperCase()}
          </div>
          <div className="text-[10px] text-zinc-600 mt-0.5">walk through the door →</div>
        </div>
      </Html>
    </group>
  );
}
