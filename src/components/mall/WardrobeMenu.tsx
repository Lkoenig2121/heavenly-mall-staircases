"use client";

import { CLOTHING, SLOT_LABELS } from "@/lib/store-data";
import { useGame } from "@/lib/game-state";
import type { ClothingSlot } from "@/lib/types";

interface WardrobeMenuProps {
  onClose: () => void;
}

const SLOTS: ClothingSlot[] = ["head", "torso", "legs", "feet", "accessory"];

export default function WardrobeMenu({ onClose }: WardrobeMenuProps) {
  const { ownedClothing, equipped, equipItem, unequipSlot } = useGame();

  const ownedItems = CLOTHING.filter((c) => ownedClothing.includes(c.id));
  const equippedItems = SLOTS.map((slot) => ({
    slot,
    item: equipped[slot] ? CLOTHING.find((c) => c.id === equipped[slot]) : null,
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-auto rounded-2xl border border-orange-500/30 bg-gradient-to-br from-[#1a1410] to-[#0d0a08] shadow-2xl shadow-orange-900/20">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-orange-500/20 px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-orange-400">👗 Mall Wardrobe</h2>
            <p className="text-sm text-zinc-500">Equip clothes from every store</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white text-2xl leading-none">
            ×
          </button>
        </div>

        <div className="grid md:grid-cols-[1fr_1.2fr] gap-0">
          {/* Character preview + equipped slots */}
          <div className="border-r border-orange-500/10 p-6">
            <div className="flex flex-col items-center gap-4 mb-6">
              <div className="relative w-32 h-48 rounded-xl bg-gradient-to-b from-zinc-800 to-zinc-900 border border-zinc-700 flex flex-col items-center justify-center gap-0.5">
                <span className="text-2xl leading-none">💇</span>
                <span className="text-2xl leading-none -mt-1">
                  {equippedItems.find((e) => e.slot === "head")?.item?.emoji ?? ""}
                </span>
                <span className="text-3xl">{equippedItems.find((e) => e.slot === "torso")?.item?.emoji ?? ""}</span>
                <span className="text-2xl">{equippedItems.find((e) => e.slot === "legs")?.item?.emoji ?? ""}</span>
                <span className="text-2xl">{equippedItems.find((e) => e.slot === "feet")?.item?.emoji ?? ""}</span>
                {equippedItems.find((e) => e.slot === "accessory")?.item && (
                  <span className="absolute top-2 right-2 text-xl">
                    {equippedItems.find((e) => e.slot === "accessory")?.item?.emoji}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 text-center">Your mall avatar</p>
            </div>

            <h3 className="text-sm font-semibold text-orange-300 mb-3 uppercase tracking-wider">Equipped</h3>
            <div className="space-y-2">
              {equippedItems.map(({ slot, item }) => (
                <div
                  key={slot}
                  className="flex items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-900/50 px-3 py-2"
                >
                  <span className="text-xs text-zinc-500 w-16">{SLOT_LABELS[slot]}</span>
                  {item ? (
                    <>
                      <span className="text-lg">{item.emoji}</span>
                      <span className="flex-1 text-sm text-zinc-300 truncate">{item.name}</span>
                      <button
                        onClick={() => unequipSlot(slot)}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Remove
                      </button>
                    </>
                  ) : (
                    <span className="text-sm text-zinc-600 italic">Empty</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Inventory grid */}
          <div className="p-6">
            <h3 className="text-sm font-semibold text-orange-300 mb-3 uppercase tracking-wider">
              Owned Clothes ({ownedItems.length})
            </h3>
            {ownedItems.length === 0 ? (
              <p className="text-zinc-500 text-sm">
                No clothes yet! Visit stores and spend your AII money to build your wardrobe.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {ownedItems.map((item) => {
                  const isEquipped = equipped[item.slot] === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => equipItem(item.id)}
                      className={`flex flex-col items-center gap-2 rounded-xl border p-3 transition-all text-left ${
                        isEquipped
                          ? "border-orange-400 bg-orange-500/10 ring-1 ring-orange-400/50"
                          : "border-zinc-700 bg-zinc-900/50 hover:border-zinc-500"
                      }`}
                    >
                      <span className="text-3xl">{item.emoji}</span>
                      <span className="text-xs font-medium text-zinc-300 text-center leading-tight">
                        {item.name}
                      </span>
                      <span className="text-[10px] text-zinc-500">{SLOT_LABELS[item.slot]}</span>
                      {isEquipped && (
                        <span className="text-[10px] text-orange-400 font-bold">EQUIPPED</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
