"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import MallHUD from "./MallHUD";
import WardrobeMenu from "./WardrobeMenu";
import StoreApp from "@/components/stores/StoreApp";
import type { ViewMode } from "./MallScene";
import { useGame } from "@/lib/game-state";
import type { StoreId } from "@/lib/types";

const MallScene = dynamic(() => import("./MallScene"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#1a1520] text-zinc-500">
      Loading mall...
    </div>
  ),
});

export default function MallExperience() {
  const { unlockedStores, visitStore, isStoreUnlocked, equipped } = useGame();
  const [activeStore, setActiveStore] = useState<StoreId | null>(null);
  const [wardrobeOpen, setWardrobeOpen] = useState(false);
  const [pointerLocked, setPointerLocked] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("first");
  const [canvasKey, setCanvasKey] = useState(0);
  const [contextLost, setContextLost] = useState(false);
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleEnterStore = useCallback(
    (storeId: StoreId) => {
      if (!isStoreUnlocked(storeId)) return;
      visitStore(storeId);
      setActiveStore(storeId);
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
    },
    [isStoreUnlocked, visitStore],
  );

  const handleExitStore = useCallback(() => {
    setActiveStore(null);
  }, []);

  const requestPointerLock = useCallback(() => {
    const canvas = containerRef.current?.querySelector("canvas");
    canvas?.requestPointerLock();
  }, []);

  const handleContextLost = useCallback(() => {
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
    setContextLost(true);
  }, []);

  const recoverContext = useCallback(() => {
    setContextLost(false);
    setCanvasKey((k) => k + 1);
  }, []);

  const toggleViewMode = useCallback(() => {
    setViewMode((m) => (m === "first" ? "third" : "first"));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "KeyV" && !activeStore && !wardrobeOpen) {
        toggleViewMode();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeStore, wardrobeOpen, toggleViewMode]);

  useEffect(() => {
    const onChange = () => setPointerLocked(!!document.pointerLockElement);
    document.addEventListener("pointerlockchange", onChange);
    return () => document.removeEventListener("pointerlockchange", onChange);
  }, []);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#1a1520]">
      {!activeStore && (
        <>
          <div ref={containerRef} className="absolute inset-0">
            {mounted && !contextLost && (
              <MallScene
                key={canvasKey}
                unlockedStores={unlockedStores}
                onEnterStore={handleEnterStore}
                onContextLost={handleContextLost}
                viewMode={viewMode}
                equipped={equipped}
              />
            )}
            {contextLost && (
              <div className="flex h-full flex-col items-center justify-center gap-4 bg-[#1a1520] text-center">
                <p className="text-lg text-white">3D view paused (graphics context lost)</p>
                <p className="max-w-sm text-sm text-zinc-500">
                  This can happen after a hot reload. Click below to restore the mall.
                </p>
                <button
                  onClick={recoverContext}
                  className="rounded-lg bg-orange-600 px-6 py-3 font-bold text-white hover:bg-orange-500"
                >
                  Restore Mall View
                </button>
              </div>
            )}
          </div>
          <MallHUD
            onOpenWardrobe={() => {
              if (document.pointerLockElement) document.exitPointerLock();
              setWardrobeOpen(true);
            }}
            pointerLocked={pointerLocked}
            onRequestPointerLock={requestPointerLock}
            viewMode={viewMode}
            onToggleViewMode={toggleViewMode}
          />
        </>
      )}

      {activeStore && <StoreApp storeId={activeStore} onExit={handleExitStore} />}

      {wardrobeOpen && <WardrobeMenu onClose={() => setWardrobeOpen(false)} />}
    </div>
  );
}
