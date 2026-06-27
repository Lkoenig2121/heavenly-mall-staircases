import * as THREE from "three";

export const WALL_TOP = 6;
export const UPPER_FLOOR_Y = 5.9;
export const PLATFORM_SIZE = 10;
export const STAIR_STEP_H = 0.25;
export const STAIR_STEP_D = 0.32;
export const STAIR_COUNT = 24;
export const STAIR_WIDTH = 3.5;

/** Ring walkway inset from mall walls (ground bounds ±18, walls ±20) */
export const PERIMETER_INNER = 13;
export const PERIMETER_OUTER = 19;

export type StairSpec = {
  position: [number, number, number];
  rotation: number;
};

/** Four corner stairs — each platform connects to the perimeter ring */
export const STAIRS: StairSpec[] = [
  { position: [-8, 0, -8], rotation: (5 * Math.PI) / 4 },
  { position: [8, 0, -8], rotation: (3 * Math.PI) / 4 },
  { position: [-8, 0, 8], rotation: -Math.PI / 4 },
  { position: [8, 0, 8], rotation: Math.PI / 4 },
];

const STAIR_RUN = STAIR_COUNT * STAIR_STEP_D;
const PLATFORM_HALF = PLATFORM_SIZE / 2;

function toLocal(stair: StairSpec, x: number, z: number) {
  const dx = x - stair.position[0];
  const dz = z - stair.position[2];
  const c = Math.cos(stair.rotation);
  const s = Math.sin(stair.rotation);
  return {
    lx: dx * c - dz * s,
    lz: dx * s + dz * c,
  };
}

function platformCenterLocal() {
  return { lx: 0, lz: STAIR_RUN + PLATFORM_HALF };
}

export function getPlatformWorldCenter(stair: StairSpec): [number, number, number] {
  const { lx, lz } = platformCenterLocal();
  const c = Math.cos(stair.rotation);
  const s = Math.sin(stair.rotation);
  return [
    stair.position[0] + lx * c + lz * s,
    UPPER_FLOOR_Y,
    stair.position[2] - lx * s + lz * c,
  ];
}

function inPlatform(x: number, z: number, stair: StairSpec) {
  const { lz: platLz } = platformCenterLocal();
  const { lx, lz } = toLocal(stair, x, z);
  return Math.abs(lx) <= PLATFORM_HALF && Math.abs(lz - platLz) <= PLATFORM_HALF;
}

function onStairRun(x: number, z: number, stair: StairSpec) {
  const { lx, lz } = toLocal(stair, x, z);
  return Math.abs(lx) <= STAIR_WIDTH / 2 + 0.25 && lz >= -0.5 && lz <= STAIR_RUN + 0.5;
}

export function onPerimeterWalkway(x: number, z: number): boolean {
  const ax = Math.abs(x);
  const az = Math.abs(z);
  const inOuter = ax <= PERIMETER_OUTER && az <= PERIMETER_OUTER;
  const inInnerHole = ax < PERIMETER_INNER && az < PERIMETER_INNER;
  return inOuter && !inInnerHole;
}

export function isStairVolume(x: number, z: number): boolean {
  return STAIRS.some((s) => onStairRun(x, z, s));
}

export function isUpperWalkable(x: number, z: number): boolean {
  if (onPerimeterWalkway(x, z)) return true;
  return STAIRS.some((s) => inPlatform(x, z, s));
}

export function getFloorY(x: number, z: number): number {
  for (const stair of STAIRS) {
    if (onStairRun(x, z, stair)) {
      const { lz } = toLocal(stair, x, z);
      return THREE.MathUtils.clamp(lz / STAIR_RUN, 0, 1) * UPPER_FLOOR_Y;
    }
  }

  if (isUpperWalkable(x, z)) return UPPER_FLOOR_Y;

  return 0;
}

/**
 * Move player on xz while enforcing floor transitions only via stairs.
 * Upper-level rules apply only when actually elevated (y > 0.5), so the
 * ground floor stays fully walkable beneath the perimeter ring.
 */
export function applyPlayerMove(
  currentX: number,
  currentZ: number,
  currentY: number,
  deltaX: number,
  deltaZ: number,
): { x: number; z: number; y: number } {
  const nextX = currentX + deltaX;
  const nextZ = currentZ + deltaZ;

  const onStairsNow = isStairVolume(currentX, currentZ);
  const onStairsNext = isStairVolume(nextX, nextZ);
  const onUpperNow = currentY > 0.5;

  if (onStairsNow || onStairsNext) {
    return { x: nextX, z: nextZ, y: getFloorY(nextX, nextZ) };
  }

  if (onUpperNow) {
    if (!isUpperWalkable(nextX, nextZ)) {
      return { x: currentX, z: currentZ, y: currentY };
    }
    return { x: nextX, z: nextZ, y: UPPER_FLOOR_Y };
  }

  return { x: nextX, z: nextZ, y: 0 };
}

function pushOutOfInnerHole(pos: THREE.Vector3) {
  const ax = Math.abs(pos.x);
  const az = Math.abs(pos.z);
  if (ax >= PERIMETER_INNER || az >= PERIMETER_INNER) return;

  const pushX = PERIMETER_INNER - ax;
  const pushZ = PERIMETER_INNER - az;
  if (pushX < pushZ) {
    pos.x = Math.sign(pos.x || 1) * PERIMETER_INNER;
  } else {
    pos.z = Math.sign(pos.z || 1) * PERIMETER_INNER;
  }
}

export function clampUpperLevel(pos: THREE.Vector3) {
  if (onPerimeterWalkway(pos.x, pos.z)) {
    pos.x = THREE.MathUtils.clamp(pos.x, -PERIMETER_OUTER, PERIMETER_OUTER);
    pos.z = THREE.MathUtils.clamp(pos.z, -PERIMETER_OUTER, PERIMETER_OUTER);
    pushOutOfInnerHole(pos);
    return;
  }

  for (const stair of STAIRS) {
    if (inPlatform(pos.x, pos.z, stair)) {
      const [cx, , cz] = getPlatformWorldCenter(stair);
      pos.x = THREE.MathUtils.clamp(pos.x, cx - PLATFORM_HALF, cx + PLATFORM_HALF);
      pos.z = THREE.MathUtils.clamp(pos.z, cz - PLATFORM_HALF, cz + PLATFORM_HALF);
      return;
    }
  }
}
