import * as THREE from "three";
import type { StoreId } from "./types";

export type MallFacing = "north" | "south" | "east" | "west";

export interface StoreInteriorBounds {
  storeId: StoreId;
  floorY: number;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  /** Side of the interior that opens onto the mall / walkway */
  mallFacing: MallFacing;
  doorWidth: number;
}

export const GROUND_INTERIORS: StoreInteriorBounds[] = [
  {
    storeId: "hottopic",
    floorY: 0,
    minX: -13,
    maxX: 13,
    minZ: -44,
    maxZ: -19.6,
    mallFacing: "south",
    doorWidth: 4,
  },
  {
    storeId: "arcade",
    floorY: 0,
    minX: -42,
    maxX: -19.6,
    minZ: -10,
    maxZ: 10,
    mallFacing: "east",
    doorWidth: 4,
  },
  {
    storeId: "music",
    floorY: 0,
    minX: 19.6,
    maxX: 42,
    minZ: -10,
    maxZ: 10,
    mallFacing: "west",
    doorWidth: 4,
  },
  {
    storeId: "toys",
    floorY: 0,
    minX: 8,
    maxX: 18,
    minZ: -42,
    maxZ: -19.6,
    mallFacing: "south",
    doorWidth: 3.5,
  },
  {
    storeId: "food",
    floorY: 0,
    minX: -10,
    maxX: 10,
    minZ: 19.6,
    maxZ: 40,
    mallFacing: "north",
    doorWidth: 4,
  },
  {
    storeId: "electronics",
    floorY: 0,
    minX: -42,
    maxX: -22,
    minZ: -42,
    maxZ: -20,
    mallFacing: "east",
    doorWidth: 3.5,
  },
  {
    storeId: "books",
    floorY: 0,
    minX: 22,
    maxX: 42,
    minZ: 20,
    maxZ: 42,
    mallFacing: "west",
    doorWidth: 3.5,
  },
];

/** Larger walk-in shops on the upper perimeter */
export const UPPER_INTERIORS: StoreInteriorBounds[] = [
  {
    storeId: "kiosk",
    floorY: 5.9,
    minX: -12,
    maxX: 12,
    minZ: -40,
    maxZ: -18.8,
    mallFacing: "south",
    doorWidth: 5,
  },
  {
    storeId: "cellular",
    floorY: 5.9,
    minX: 18.8,
    maxX: 40,
    minZ: -12,
    maxZ: 12,
    mallFacing: "west",
    doorWidth: 5,
  },
  {
    storeId: "smoothie",
    floorY: 5.9,
    minX: -12,
    maxX: 12,
    minZ: 18.8,
    maxZ: 40,
    mallFacing: "north",
    doorWidth: 5,
  },
  {
    storeId: "watches",
    floorY: 5.9,
    minX: -40,
    maxX: -18.8,
    minZ: -12,
    maxZ: 12,
    mallFacing: "east",
    doorWidth: 5,
  },
];

export const ALL_INTERIORS = [...GROUND_INTERIORS, ...UPPER_INTERIORS];

export function getInteriorBounds(storeId: StoreId): StoreInteriorBounds | undefined {
  return ALL_INTERIORS.find((b) => b.storeId === storeId);
}

export function entrancePlane(b: StoreInteriorBounds): number {
  switch (b.mallFacing) {
    case "south":
      return b.maxZ;
    case "north":
      return b.minZ;
    case "east":
      return b.maxX;
    case "west":
      return b.minX;
  }
}

export function interiorCenter(b: StoreInteriorBounds): [number, number, number] {
  return [
    (b.minX + b.maxX) / 2,
    b.floorY,
    (b.minZ + b.maxZ) / 2,
  ];
}

export function interiorDepth(b: StoreInteriorBounds): number {
  switch (b.mallFacing) {
    case "south":
    case "north":
      return b.maxZ - b.minZ;
    case "east":
    case "west":
      return b.maxX - b.minX;
  }
}

export function interiorWidth(b: StoreInteriorBounds): number {
  switch (b.mallFacing) {
    case "south":
    case "north":
      return b.maxX - b.minX;
    case "east":
    case "west":
      return b.maxZ - b.minZ;
  }
}

function margin(b: StoreInteriorBounds) {
  return b.floorY > 0 ? 0.45 : 0.5;
}

export function containsInterior(b: StoreInteriorBounds, x: number, z: number, y: number): boolean {
  if (Math.abs(y - b.floorY) > 1.2) return false;
  const m = margin(b);
  return x >= b.minX + m && x <= b.maxX - m && z >= b.minZ + m && z <= b.maxZ - m;
}

export function clampToInterior(pos: THREE.Vector3, b: StoreInteriorBounds) {
  const m = margin(b);
  pos.x = THREE.MathUtils.clamp(pos.x, b.minX + m, b.maxX - m);
  pos.z = THREE.MathUtils.clamp(pos.z, b.minZ + m, b.maxZ - m);
  pos.y = b.floorY;
}

export function findGroundInterior(x: number, z: number, y: number): StoreInteriorBounds | undefined {
  return GROUND_INTERIORS.find((b) => containsInterior(b, x, z, y));
}

export function findUpperInterior(x: number, z: number, y: number): StoreInteriorBounds | undefined {
  return UPPER_INTERIORS.find((b) => containsInterior(b, x, z, y));
}

export function isInUpperInterior(x: number, z: number): boolean {
  return UPPER_INTERIORS.some((b) => inApproachOrInterior(b, x, z));
}

const APPROACH_PAD = 2.5;

function approachMaxZ(b: StoreInteriorBounds) {
  return b.mallFacing === "south" ? b.maxZ + APPROACH_PAD : b.maxZ;
}
function approachMinZ(b: StoreInteriorBounds) {
  return b.mallFacing === "north" ? b.minZ - APPROACH_PAD : b.minZ;
}
function approachMaxX(b: StoreInteriorBounds) {
  return b.mallFacing === "east" ? b.maxX + APPROACH_PAD : b.maxX;
}
function approachMinX(b: StoreInteriorBounds) {
  return b.mallFacing === "west" ? b.minX - APPROACH_PAD : b.minX;
}

export function inApproachOrInterior(b: StoreInteriorBounds, x: number, z: number): boolean {
  const m = 0.35;
  return (
    x >= approachMinX(b) + m &&
    x <= approachMaxX(b) - m &&
    z >= approachMinZ(b) + m &&
    z <= approachMaxZ(b) - m
  );
}

export function clampMallGround(pos: THREE.Vector3) {
  for (const b of GROUND_INTERIORS) {
    if (!inApproachOrInterior(b, pos.x, pos.z)) continue;
    const m = margin(b);
    pos.x = THREE.MathUtils.clamp(pos.x, b.minX + m, b.maxX - m);
    pos.z = THREE.MathUtils.clamp(
      pos.z,
      approachMinZ(b) + m,
      approachMaxZ(b) - m,
    );
    pos.y = b.floorY;
    return;
  }

  pos.x = THREE.MathUtils.clamp(pos.x, -18, 18);
  pos.z = THREE.MathUtils.clamp(pos.z, -18, 18);
}

export function clampUpperWithInteriors(pos: THREE.Vector3) {
  for (const b of UPPER_INTERIORS) {
    if (!inApproachOrInterior(b, pos.x, pos.z)) continue;
    const m = margin(b);
    pos.x = THREE.MathUtils.clamp(pos.x, b.minX + m, b.maxX - m);
    pos.z = THREE.MathUtils.clamp(
      pos.z,
      approachMinZ(b) + m,
      approachMaxZ(b) - m,
    );
    pos.y = b.floorY;
    return true;
  }
  return false;
}

/** Hot Topic legacy export for any remaining imports */
export const HT = {
  mallWallZ: -20,
  entranceZ: -19.6,
  backZ: -44,
  minX: -13,
  maxX: 13,
  thresholdZ: -17.5,
};
