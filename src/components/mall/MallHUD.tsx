"use client";

import { useGame } from "@/lib/game-state";
import { STORES } from "@/lib/store-data";
import type { ViewMode } from "./MallScene";

interface MallHUDProps {
  onOpenWardrobe: () => void;
  pointerLocked: boolean;
  onRequestPointerLock: () => void;
  viewMode: ViewMode;
  onToggleViewMode: () => void;
}

export default function MallHUD({
  onOpenWardrobe,
  pointerLocked,
  onRequestPointerLock,
  viewMode,
  onToggleViewMode,
}: MallHUDProps) {
  const { aiiMoney, mallStamps, unlockedStores } = useGame();
  const lockedCount = STORES.length - unlockedStores.length;

  return (
    <>
      {/* Top resource bar */}
      <div className="absolute top-0 inset-x-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <div className="flex items-center gap-4 pointer-events-auto">
          <div className="flex items-center gap-2 rounded-full bg-black/60 border border-yellow-500/30 px-4 py-1.5">
            <span className="text-yellow-400 font-bold">AII</span>
            <span className="text-white font-mono">{aiiMoney}</span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-black/60 border border-cyan-500/30 px-4 py-1.5">
            <span>🎫</span>
            <span className="text-cyan-300 font-mono">{mallStamps}</span>
            <span className="text-xs text-zinc-500">stamps</span>
          </div>
          {lockedCount > 0 && (
            <div className="text-xs text-zinc-500 hidden sm:block">
              {lockedCount} store{lockedCount > 1 ? "s" : ""} locked
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={onToggleViewMode}
            className="flex items-center gap-2 rounded-full bg-black/60 hover:bg-black/80 border border-white/20 px-4 py-2 text-sm font-bold text-white transition-colors"
            title="Press V to toggle"
          >
            {viewMode === "first" ? "🎥 3rd Person" : "👁️ 1st Person"}
          </button>
          <button
            onClick={onOpenWardrobe}
            className="flex items-center gap-2 rounded-full bg-orange-600/90 hover:bg-orange-500 border border-orange-400/50 px-4 py-2 text-sm font-bold text-white transition-colors"
          >
            👗 Wardrobe
          </button>
        </div>
      </div>

      {/* Crosshair */}
      {pointerLocked && viewMode === "first" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="w-4 h-4 border border-white/40 rounded-full" />
        </div>
      )}

      {/* Bottom instructions */}
      <div className="absolute bottom-0 inset-x-0 z-10 flex flex-col items-center gap-2 pb-6 pointer-events-none">
        {!pointerLocked && viewMode === "first" ? (
          <button
            onClick={onRequestPointerLock}
            className="pointer-events-auto px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur border border-white/20 rounded-xl text-white font-medium transition-colors"
          >
            🖱️ Click to walk the mall (WASD + mouse)
          </button>
        ) : (
          <div className="text-center text-sm text-white/60 bg-black/40 backdrop-blur rounded-lg px-4 py-2">
            <span className="hidden sm:inline">
              {viewMode === "third"
                ? "WASD to move · Click & drag (or lock mouse) to orbit · V for 1st person · "
                : "WASD to move · Mouse to look · V for 3rd person · Click store doors to enter · "}
            </span>
            {pointerLocked ? "ESC to release mouse" : viewMode === "third" ? "Click the mall floor to lock mouse" : ""}
          </div>
        )}
      </div>
    </>
  );
}
