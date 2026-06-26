import * as THREE from "three";

export const WALL_TOP = 6;
export const UPPER_FLOOR_Y = 5.9;
export const PLATFORM_SIZE = 10;
export const STAIR_STEP_H = 0.25;
export const STAIR_STEP_D = 0.32;
export const STAIR_COUNT = 24;
export const STAIR_WIDTH = 3.5;

export type StairSpec = {
  position: [number, number, number];
  rotation: number;
};

export const STAIRS: StairSpec[] = [
  { position: [-7, 0, 7], rotation: -Math.PI / 4 },
  { position: [7, 0, -7], rotation: (3 * Math.PI) / 4 },
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

export function getFloorY(x: number, z: number): number {
  for (const stair of STAIRS) {
    if (inPlatform(x, z, stair)) return UPPER_FLOOR_Y;
    if (onStairRun(x, z, stair)) {
      const { lz } = toLocal(stair, x, z);
      return THREE.MathUtils.clamp(lz / STAIR_RUN, 0, 1) * UPPER_FLOOR_Y;
    }
  }
  return 0;
}

export function clampUpperLevel(pos: THREE.Vector3) {
  for (const stair of STAIRS) {
    if (inPlatform(pos.x, pos.z, stair)) {
      const [cx, , cz] = getPlatformWorldCenter(stair);
      pos.x = THREE.MathUtils.clamp(pos.x, cx - PLATFORM_HALF, cx + PLATFORM_HALF);
      pos.z = THREE.MathUtils.clamp(pos.z, cz - PLATFORM_HALF, cz + PLATFORM_HALF);
      return;
    }
  }
}
