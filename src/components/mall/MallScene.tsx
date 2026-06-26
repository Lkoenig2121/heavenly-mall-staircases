"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PointerLockControls, Html } from "@react-three/drei";
import * as THREE from "three";
import PlayerAvatar from "./PlayerAvatar";
import HotTopicInterior, { clampToWalkable } from "./HotTopicInterior";
import { STORES } from "@/lib/store-data";
import type { ClothingSlot, StoreId } from "@/lib/types";

const MOVE_SPEED = 8;
const EYE_HEIGHT = 1.7;
const THIRD_PERSON_DISTANCE = 4.5;
const THIRD_PERSON_HEIGHT = 1.6;
const ORBIT_SENSITIVITY = 0.005;

export type ViewMode = "first" | "third";

function facadeColor(hex: string, unlocked: boolean) {
  const color = new THREE.Color(hex);
  if (!unlocked) {
    color.lerp(new THREE.Color("#f5f0ea"), 0.45);
  }
  return color;
}

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
      player.position.add(direction);
      player.rotation.y = Math.atan2(direction.x, direction.z);
    }

    player.position.y = 0;
    clampToWalkable(player.position);

    if (viewMode === "first") {
      camera.position.set(player.position.x, EYE_HEIGHT, player.position.z);
    } else {
      const dist = THIRD_PERSON_DISTANCE * Math.cos(orbitPitch.current);
      const camX = player.position.x + Math.sin(orbitYaw.current) * dist;
      const camY = player.position.y + THIRD_PERSON_HEIGHT + Math.sin(orbitPitch.current) * THIRD_PERSON_DISTANCE;
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

function StoreFront({
  store,
  unlocked,
  onEnter,
}: {
  store: (typeof STORES)[0];
  unlocked: boolean;
  onEnter: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const bodyColor = facadeColor(store.color, unlocked);

  return (
    <group position={store.position} rotation={[0, store.rotation, 0]}>
      {/* Main facade */}
      <mesh position={[0, 2.5, 0]}>
        <boxGeometry args={[6, 5, 0.3]} />
        <meshStandardMaterial
          color={bodyColor}
          emissive={store.color}
          emissiveIntensity={unlocked ? (hovered ? 0.25 : 0.12) : 0.04}
        />
      </mesh>
      {/* Display windows */}
      <mesh position={[-1.5, 2.8, 0.2]}>
        <boxGeometry args={[2.2, 2.2, 0.08]} />
        <meshStandardMaterial color="#b8dff5" metalness={0.1} roughness={0.2} transparent opacity={0.85} />
      </mesh>
      <mesh position={[1.5, 2.8, 0.2]}>
        <boxGeometry args={[2.2, 2.2, 0.08]} />
        <meshStandardMaterial color="#b8dff5" metalness={0.1} roughness={0.2} transparent opacity={0.85} />
      </mesh>
      {/* Awning */}
      <mesh position={[0, 4.35, 0.45]} rotation={[0.15, 0, 0]}>
        <boxGeometry args={[5.5, 0.15, 1.2]} />
        <meshStandardMaterial color={store.color} emissive={store.color} emissiveIntensity={0.15} />
      </mesh>
      {/* Awning stripes */}
      {[-1.8, -0.9, 0, 0.9, 1.8].map((x, i) => (
        <mesh key={i} position={[x, 4.28, 0.55]} rotation={[0.15, 0, 0]}>
          <boxGeometry args={[0.35, 0.16, 1.1]} />
          <meshStandardMaterial color={i % 2 === 0 ? "#fff" : store.color} />
        </mesh>
      ))}
      {/* Door */}
      <mesh
        position={[0, 1.2, 0.22]}
        onPointerOver={() => unlocked && setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={(e) => {
          e.stopPropagation();
          if (unlocked) onEnter();
        }}
      >
        <boxGeometry args={[2, 2.4, 0.1]} />
        <meshStandardMaterial
          color={unlocked ? (hovered ? "#fff8f0" : "#f0e8dc") : "#c9bfb3"}
          emissive={unlocked ? "#ffe4c4" : "#000000"}
          emissiveIntensity={unlocked && hovered ? 0.15 : 0}
        />
      </mesh>
      {!unlocked && (
        <mesh position={[0, 1.2, 0.3]}>
          <boxGeometry args={[2.1, 2.5, 0.04]} />
          <meshStandardMaterial color="#b8a99a" transparent opacity={0.7} />
        </mesh>
      )}

      <StoreLabel position={[0, 4.85, 0.5]} className="text-sm font-bold text-zinc-800">
        <span className="mr-1">{store.emoji}</span>
        {store.name}
      </StoreLabel>

      {!unlocked && (
        <StoreLabel position={[0, 3.5, 0.45]} className="text-xs font-semibold text-red-600">
          CLOSED — {store.unlockStamps} stamps needed
        </StoreLabel>
      )}

      {hovered && unlocked && (
        <Html position={[0, 1.2, 0.65]} center distanceFactor={10}>
          <div className="rounded bg-black/80 px-3 py-1 text-xs text-white whitespace-nowrap">
            Click to enter
          </div>
        </Html>
      )}
    </group>
  );
}

function MallStairs({
  position,
  rotation = 0,
}: {
  position: [number, number, number];
  rotation?: number;
}) {
  const steps = 10;
  const stepWidth = 3.5;
  const stepDepth = 0.38;
  const stepHeight = 0.18;

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {Array.from({ length: steps }).map((_, i) => (
        <mesh key={i} position={[0, stepHeight * (i + 0.5), stepDepth * i]}>
          <boxGeometry args={[stepWidth, stepHeight, stepDepth]} />
          <meshStandardMaterial color={i % 2 === 0 ? "#e0d2c0" : "#f0e4d4"} />
        </mesh>
      ))}
      {/* Upper landing */}
      <mesh position={[0, stepHeight * steps + 0.1, stepDepth * steps + 0.8]}>
        <boxGeometry args={[stepWidth, 0.2, 2.2]} />
        <meshStandardMaterial color="#f0e4d4" />
      </mesh>
      {/* Left railing */}
      <mesh position={[-stepWidth / 2 + 0.08, stepHeight * steps * 0.55, stepDepth * steps * 0.45]}>
        <boxGeometry args={[0.08, stepHeight * steps + 0.6, stepDepth * steps + 1.2]} />
        <meshStandardMaterial color="#c0a882" metalness={0.4} roughness={0.4} />
      </mesh>
      {/* Right railing */}
      <mesh position={[stepWidth / 2 - 0.08, stepHeight * steps * 0.55, stepDepth * steps * 0.45]}>
        <boxGeometry args={[0.08, stepHeight * steps + 0.6, stepDepth * steps + 1.2]} />
        <meshStandardMaterial color="#c0a882" metalness={0.4} roughness={0.4} />
      </mesh>
      {/* Handrail top */}
      <mesh
        position={[0, stepHeight * steps + 0.55, stepDepth * steps * 0.45]}
        rotation={[Math.atan2(stepHeight * steps, stepDepth * steps), 0, 0]}
      >
        <boxGeometry args={[stepWidth - 0.1, 0.07, stepDepth * steps + 1.4]} />
        <meshStandardMaterial color="#b8956a" metalness={0.5} roughness={0.35} />
      </mesh>
      <StoreLabel position={[0, stepHeight * steps + 1.4, stepDepth * steps + 1.2]} className="text-xs text-zinc-600">
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
      <pointLight position={[0, 8, 0]} intensity={0.6} color="#ffffff" />
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
      {/* Back wall opening is handled by HotTopicInterior */}
      <mesh position={[-20, 3, 0]}>
        <boxGeometry args={[0.5, 6, 40]} />
        <meshStandardMaterial color="#f0e4d4" />
      </mesh>
      <mesh position={[20, 3, 0]}>
        <boxGeometry args={[0.5, 6, 40]} />
        <meshStandardMaterial color="#f0e4d4" />
      </mesh>

      <mesh position={[0, 6, 0]} rotation={[Math.PI / 2, 0, 0]}>
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

      {/* Mall stairs to upper level */}
      <MallStairs position={[-7, 0, 7]} rotation={-Math.PI / 4} />
      <MallStairs position={[7, 0, -7]} rotation={Math.PI * 0.75} />

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
  const hotTopicUnlocked = unlockedStores.includes("hottopic");

  return (
    <>
      <color attach="background" args={["#ffffff"]} />
      <fog attach="fog" args={["#ffffff", 25, 65]} />
      <ContextGuard onContextLost={onContextLost} />
      <MallEnvironment />
      <HotTopicInterior
        unlocked={hotTopicUnlocked}
        onOpenShop={() => onEnterStore("hottopic")}
      />
      {STORES.filter((s) => !s.interiorPortal).map((store) => (
        <StoreFront
          key={store.id}
          store={store}
          unlocked={unlockedStores.includes(store.id)}
          onEnter={() => onEnterStore(store.id)}
        />
      ))}
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
