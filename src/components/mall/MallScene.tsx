"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PointerLockControls, Html } from "@react-three/drei";
import * as THREE from "three";
import PlayerAvatar from "./PlayerAvatar";
import StoreInterior from "./StoreInterior";
import UpperLevelMall from "./UpperLevelMall";
import { clampMallGround, GROUND_INTERIORS } from "@/lib/store-interiors";
import { applyPlayerMove, clampUpperLevel } from "@/lib/upper-level";
import type { ClothingSlot, StoreId } from "@/lib/types";
import {
  STAIRS,
  STAIR_COUNT,
  STAIR_STEP_D,
  STAIR_STEP_H,
  STAIR_WIDTH,
  UPPER_FLOOR_Y,
  PLATFORM_SIZE,
} from "@/lib/upper-level";

const MOVE_SPEED = 8;
const EYE_HEIGHT = 1.7;
const THIRD_PERSON_DISTANCE = 4.5;
const THIRD_PERSON_HEIGHT = 1.6;
const ORBIT_SENSITIVITY = 0.005;

export type ViewMode = "first" | "third";

interface MallSceneProps {
  unlockedStores: StoreId[];
  onEnterStore: (storeId: StoreId) => void;
  onContextLost?: () => void;
  viewMode: ViewMode;
  equipped: Partial<Record<ClothingSlot, string>>;
}

function ContextGuard({ onContextLost }: { onContextLost?: () => void }) {
  const { gl } = useThree();

  useEffect(() => {
    const canvas = gl.domElement;

    const handleLost = (event: Event) => {
      event.preventDefault();
      onContextLost?.();
    };

    canvas.addEventListener("webglcontextlost", handleLost);
    return () => canvas.removeEventListener("webglcontextlost", handleLost);
  }, [gl, onContextLost]);

  return null;
}

function PlayerController({
  viewMode,
  equipped,
}: {
  viewMode: ViewMode;
  equipped: Partial<Record<ClothingSlot, string>>;
}) {
  const { camera, gl } = useThree();
  const playerRef = useRef<THREE.Group>(null);
  const keys = useRef<Record<string, boolean>>({});
  const orbitYaw = useRef(Math.PI);
  const orbitPitch = useRef(0.35);
  const prevViewMode = useRef<ViewMode>(viewMode);
  const isDragging = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const tmpDir = useRef(new THREE.Vector3());
  const tmpForward = useRef(new THREE.Vector3());
  const tmpRight = useRef(new THREE.Vector3());
  const tmpLookAt = useRef(new THREE.Vector3());

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keys.current[e.code] = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  const applyOrbit = (dx: number, dy: number) => {
    if (dx === 0 && dy === 0) return;
    orbitYaw.current -= dx * ORBIT_SENSITIVITY;
    orbitPitch.current = THREE.MathUtils.clamp(
      orbitPitch.current - dy * ORBIT_SENSITIVITY,
      0.15,
      1.1,
    );
  };

  // Third-person orbit: pointer-lock movement OR click-and-drag on canvas
  useEffect(() => {
    if (viewMode !== "third") return;

    const canvas = gl.domElement;

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      isDragging.current = true;
      lastPointer.current = { x: e.clientX, y: e.clientY };

      // Click canvas to capture mouse (same as first-person walk)
      if (document.pointerLockElement !== canvas) {
        canvas.requestPointerLock();
      }
    };

    const onMouseUp = () => {
      isDragging.current = false;
    };

    const onMouseMove = (e: MouseEvent) => {
      const locked = document.pointerLockElement === canvas;

      if (locked) {
        applyOrbit(e.movementX, e.movementY);
        return;
      }

      if (!isDragging.current) return;

      const dx = e.clientX - lastPointer.current.x;
      const dy = e.clientY - lastPointer.current.y;
      lastPointer.current = { x: e.clientX, y: e.clientY };
      applyOrbit(dx, dy);
    };

    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("mousemove", onMouseMove);
    return () => {
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("mousemove", onMouseMove);
      isDragging.current = false;
    };
  }, [viewMode, gl]);

  // Snap orbit behind the player when entering third person
  useEffect(() => {
    if (viewMode === "third" && prevViewMode.current === "first") {
      const player = playerRef.current;
      if (player) {
        orbitYaw.current = player.rotation.y + Math.PI;
      } else {
        camera.getWorldDirection(tmpForward.current);
        tmpForward.current.y = 0;
        if (tmpForward.current.lengthSq() > 0) {
          tmpForward.current.normalize();
          orbitYaw.current = Math.atan2(tmpForward.current.x, tmpForward.current.z) + Math.PI;
        }
      }
      orbitPitch.current = 0.35;
    }
    prevViewMode.current = viewMode;
  }, [viewMode, camera]);

  useFrame((_, delta) => {
    const player = playerRef.current;
    if (!player) return;

    const forward = tmpForward.current;
    const right = tmpRight.current;
    const direction = tmpDir.current;

    camera.getWorldDirection(forward);
    forward.y = 0;
    if (forward.lengthSq() > 0) forward.normalize();

    right.crossVectors(forward, new THREE.Vector3(0, 1, 0));

    direction.set(0, 0, 0);
    if (keys.current["KeyW"] || keys.current["ArrowUp"]) direction.add(forward);
    if (keys.current["KeyS"] || keys.current["ArrowDown"]) direction.sub(forward);
    if (keys.current["KeyA"] || keys.current["ArrowLeft"]) direction.sub(right);
    if (keys.current["KeyD"] || keys.current["ArrowRight"]) direction.add(right);

    if (direction.lengthSq() > 0) {
      direction.normalize().multiplyScalar(MOVE_SPEED * delta);
      const moved = applyPlayerMove(
        player.position.x,
        player.position.z,
        player.position.y,
        direction.x,
        direction.z,
      );
      player.position.x = moved.x;
      player.position.z = moved.z;
      player.position.y = moved.y;
      player.rotation.y = Math.atan2(direction.x, direction.z);
    } else {
      // Re-sync height without allowing drops off the upper level
      const held = applyPlayerMove(
        player.position.x,
        player.position.z,
        player.position.y,
        0,
        0,
      );
      player.position.y = held.y;
    }

    if (player.position.y > 0) {
      clampUpperLevel(player.position);
    } else {
      clampMallGround(player.position);
    }

    if (viewMode === "first") {
      camera.position.set(player.position.x, player.position.y + EYE_HEIGHT, player.position.z);
    } else {
      const dist = THIRD_PERSON_DISTANCE * Math.cos(orbitPitch.current);
      const camX = player.position.x + Math.sin(orbitYaw.current) * dist;
      const camY =
        player.position.y + THIRD_PERSON_HEIGHT + Math.sin(orbitPitch.current) * THIRD_PERSON_DISTANCE;
      const camZ = player.position.z + Math.cos(orbitYaw.current) * dist;

      camera.position.set(camX, camY, camZ);
      tmpLookAt.current.set(player.position.x, player.position.y + 1.35, player.position.z);
      camera.lookAt(tmpLookAt.current);
    }
  });

  return (
    <>
      <group ref={playerRef} position={[0, 0, 8]}>
        {viewMode === "third" && <PlayerAvatar equipped={equipped} />}
      </group>
      {viewMode === "first" && <PointerLockControls />}
    </>
  );
}

function StoreLabel({
  children,
  position,
  className = "",
}: {
  children: React.ReactNode;
  position: [number, number, number];
  className?: string;
}) {
  return (
    <Html position={position} center distanceFactor={12} zIndexRange={[0, 0]}>
      <div
        className={`pointer-events-none select-none whitespace-nowrap text-center drop-shadow-lg ${className}`}
      >
        {children}
      </div>
    </Html>
  );
}

function MallStairs({
  position,
  rotation = 0,
}: {
  position: [number, number, number];
  rotation?: number;
}) {
  const stairRun = STAIR_COUNT * STAIR_STEP_D;
  const platformCenterZ = stairRun + PLATFORM_SIZE / 2;
  const totalRise = STAIR_COUNT * STAIR_STEP_H;

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {Array.from({ length: STAIR_COUNT }).map((_, i) => (
        <mesh key={i} position={[0, STAIR_STEP_H * (i + 0.5), STAIR_STEP_D * i]}>
          <boxGeometry args={[STAIR_WIDTH, STAIR_STEP_H, STAIR_STEP_D]} />
          <meshStandardMaterial color={i % 2 === 0 ? "#e0d2c0" : "#f0e4d4"} />
        </mesh>
      ))}

      {/* 10×10 upper pathway */}
      <mesh position={[0, UPPER_FLOOR_Y - 0.05, platformCenterZ]}>
        <boxGeometry args={[PLATFORM_SIZE, 0.1, PLATFORM_SIZE]} />
        <meshStandardMaterial color="#f0e4d4" />
      </mesh>
      {/* Platform edge railing */}
      <mesh position={[0, UPPER_FLOOR_Y + 0.45, platformCenterZ - PLATFORM_SIZE / 2]}>
        <boxGeometry args={[PLATFORM_SIZE, 0.08, 0.08]} />
        <meshStandardMaterial color="#c0a882" metalness={0.4} />
      </mesh>
      <mesh position={[0, UPPER_FLOOR_Y + 0.45, platformCenterZ + PLATFORM_SIZE / 2]}>
        <boxGeometry args={[PLATFORM_SIZE, 0.08, 0.08]} />
        <meshStandardMaterial color="#c0a882" metalness={0.4} />
      </mesh>
      <mesh position={[PLATFORM_SIZE / 2, UPPER_FLOOR_Y + 0.45, platformCenterZ]}>
        <boxGeometry args={[0.08, 0.08, PLATFORM_SIZE]} />
        <meshStandardMaterial color="#c0a882" metalness={0.4} />
      </mesh>
      <mesh position={[-PLATFORM_SIZE / 2, UPPER_FLOOR_Y + 0.45, platformCenterZ]}>
        <boxGeometry args={[0.08, 0.08, PLATFORM_SIZE]} />
        <meshStandardMaterial color="#c0a882" metalness={0.4} />
      </mesh>

      {/* Stair railings */}
      <mesh position={[-STAIR_WIDTH / 2 + 0.08, totalRise * 0.5, stairRun * 0.45]}>
        <boxGeometry args={[0.08, totalRise + 0.6, stairRun + 1.2]} />
        <meshStandardMaterial color="#c0a882" metalness={0.4} roughness={0.4} />
      </mesh>
      <mesh position={[STAIR_WIDTH / 2 - 0.08, totalRise * 0.5, stairRun * 0.45]}>
        <boxGeometry args={[0.08, totalRise + 0.6, stairRun + 1.2]} />
        <meshStandardMaterial color="#c0a882" metalness={0.4} roughness={0.4} />
      </mesh>

      <StoreLabel position={[0, UPPER_FLOOR_Y + 0.8, platformCenterZ]} className="text-xs text-zinc-600">
        Upper Level
      </StoreLabel>
    </group>
  );
}

function MallEnvironment() {
  return (
    <>
      <ambientLight intensity={0.75} />
      <directionalLight position={[5, 10, 5]} intensity={1} color="#fff8f0" />
      <pointLight position={[0, 7, 0]} intensity={0.5} color="#fff8f0" distance={30} />
      <pointLight position={[0, 5, -30]} intensity={0.8} color="#ff8866" distance={25} />
      <pointLight position={[-9, 4, -40]} intensity={0.5} color="#ffffff" distance={15} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#c8b8a8" />
      </mesh>

      <mesh position={[0, 3, 20]}>
        <boxGeometry args={[40, 6, 0.5]} />
        <meshStandardMaterial color="#f0e4d4" />
      </mesh>
      {/* Store doorways are handled by StoreInterior components */}
      <mesh position={[-20, 3, 0]}>
        <boxGeometry args={[0.5, 6, 40]} />
        <meshStandardMaterial color="#f0e4d4" />
      </mesh>
      <mesh position={[20, 3, 0]}>
        <boxGeometry args={[0.5, 6, 40]} />
        <meshStandardMaterial color="#f0e4d4" />
      </mesh>

      <mesh position={[0, 8.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#ffffff" side={THREE.BackSide} />
      </mesh>

      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[2, 2.5, 1, 12]} />
        <meshStandardMaterial color="#6bb3d9" metalness={0.2} roughness={0.6} />
      </mesh>

      {[
        [-5, 0.4, 5],
        [5, 0.4, -5],
        [-5, 0.4, -5],
        [5, 0.4, 5],
      ].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]}>
          <boxGeometry args={[2, 0.8, 0.6]} />
          <meshStandardMaterial color="#8b6914" />
        </mesh>
      ))}

      {/* Mall stairs to upper level (top of walls) */}
      {STAIRS.map((stair, i) => (
        <MallStairs key={i} position={stair.position} rotation={stair.rotation} />
      ))}

      <StoreLabel position={[0, 5.4, -8]} className="text-lg font-bold text-pink-500 tracking-widest">
        SUNSET GALLERIA
      </StoreLabel>
      <StoreLabel position={[0, 4.8, -8]} className="text-xs text-zinc-600">
        Est. 2001 — Where the future shops
      </StoreLabel>
    </>
  );
}

function SceneContent({ unlockedStores, onEnterStore, onContextLost, viewMode, equipped }: MallSceneProps) {
  return (
    <>
      <color attach="background" args={["#ffffff"]} />
      <fog attach="fog" args={["#ffffff", 25, 65]} />
      <ContextGuard onContextLost={onContextLost} />
      <MallEnvironment />
      {GROUND_INTERIORS.map((bounds) => (
        <StoreInterior
          key={bounds.storeId}
          bounds={bounds}
          unlocked={unlockedStores.includes(bounds.storeId)}
          onOpenShop={() => onEnterStore(bounds.storeId)}
        />
      ))}
      <UpperLevelMall unlockedStores={unlockedStores} onEnterStore={onEnterStore} />
      <PlayerController viewMode={viewMode} equipped={equipped} />
    </>
  );
}

export default function MallScene({
  unlockedStores,
  onEnterStore,
  onContextLost,
  viewMode,
  equipped,
}: MallSceneProps) {
  return (
    <Canvas
      style={{ width: "100%", height: "100%", display: "block", background: "#ffffff" }}
      camera={{ position: [0, 1.7, 8], fov: 75, near: 0.1, far: 100 }}
      dpr={[1, 1.5]}
      gl={{
        antialias: false,
        alpha: false,
        powerPreference: "default",
        failIfMajorPerformanceCaveat: false,
      }}
      onCreated={({ gl }) => {
        gl.setClearColor("#ffffff");
      }}
    >
      <SceneContent
        unlockedStores={unlockedStores}
        onEnterStore={onEnterStore}
        onContextLost={onContextLost}
        viewMode={viewMode}
        equipped={equipped}
      />
    </Canvas>
  );
}
