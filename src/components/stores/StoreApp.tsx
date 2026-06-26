"use client";

import { useState } from "react";
import { CLOTHING, COLLECTIBLES, COUPONS, STORES } from "@/lib/store-data";
import { useGame } from "@/lib/game-state";
import type { StoreId } from "@/lib/types";
import ArcadeGame from "@/components/games/ArcadeGame";
import RhythmGame from "@/components/games/RhythmGame";

type Tab = "shop" | "game" | "collectibles" | "loyalty" | "coupons";

interface StoreAppProps {
  storeId: StoreId;
  onExit: () => void;
}

export default function StoreApp({ storeId, onExit }: StoreAppProps) {
  const store = STORES.find((s) => s.id === storeId)!;
  const {
    aiiMoney,
    ownedClothing,
    ownedCollectibles,
    foundCoupons,
    loyaltyCards,
    buyClothing,
    collectItem,
    findCoupon,
    addLoyaltyStamp,
    getCouponDiscount,
    visitStore,
  } = useGame();

  const [tab, setTab] = useState<Tab>(store.hasMiniGame ? "game" : "shop");
  const [message, setMessage] = useState("");

  const storeClothing = CLOTHING.filter((c) => c.storeId === storeId);
  const storeCollectibles = COLLECTIBLES.filter((c) => c.storeId === storeId);
  const storeCoupons = COUPONS.filter((c) => c.storeId === storeId);
  const loyalty = loyaltyCards[storeId];
  const discount = getCouponDiscount(storeId);

  const showMsg = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  const handleBuy = (itemId: string) => {
    const item = CLOTHING.find((c) => c.id === itemId);
    if (!item) return;
    const price = Math.round(item.price * (1 - discount / 100));
    if (ownedClothing.includes(itemId)) {
      showMsg("You already own this!");
      return;
    }
    if (buyClothing(itemId)) {
      addLoyaltyStamp(storeId);
      showMsg(`Purchased ${item.name} for ${price} AII!`);
    } else {
      showMsg(`Need ${price} AII (you have ${aiiMoney})`);
    }
  };

  const handleCollect = (id: string, hidden?: boolean) => {
    if (ownedCollectibles.includes(id)) {
      showMsg("Already collected!");
      return;
    }
    collectItem(id);
    addLoyaltyStamp(storeId);
    showMsg(hidden ? "Secret collectible found! 🎉" : "Added to your collection!");
  };

  const handleFindCoupon = (id: string) => {
    if (foundCoupons.includes(id)) {
      showMsg("Already found this coupon!");
      return;
    }
    findCoupon(id);
    const coupon = COUPONS.find((c) => c.id === id);
    showMsg(`Found coupon: ${coupon?.code} (${coupon?.discount}% off)!`);
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "shop", label: "🛍️ Shop" },
    ...(store.hasMiniGame ? [{ id: "game" as Tab, label: "🎮 Mini-Game" }] : []),
    { id: "collectibles", label: "🏆 Collectibles" },
    { id: "loyalty", label: "💳 Loyalty Card" },
    { id: "coupons", label: "🎟️ Coupons" },
  ];

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-[#0a0a12]">
      {/* Store header */}
      <header
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: `${store.color}40`, background: `linear-gradient(135deg, ${store.color}15, transparent)` }}
      >
        <div className="flex items-center gap-3">
          <span className="text-3xl">{store.emoji}</span>
          <div>
            <h1 className="text-xl font-bold text-white">{store.name}</h1>
            <p className="text-sm text-zinc-500">{store.tagline}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-yellow-400 font-mono text-sm">{aiiMoney} AII</span>
          {discount > 0 && (
            <span className="text-green-400 text-xs bg-green-900/30 px-2 py-1 rounded">
              {discount}% coupon active
            </span>
          )}
          <button
            onClick={onExit}
            className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-sm"
          >
            ← Exit to Mall
          </button>
        </div>
      </header>

      {/* Tabs */}
      <nav className="flex gap-1 px-6 py-2 border-b border-zinc-800 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
              tab === t.id
                ? "text-white font-bold"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
            style={tab === t.id ? { backgroundColor: `${store.color}30`, color: store.color } : {}}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {message && (
        <div className="mx-6 mt-3 px-4 py-2 rounded-lg bg-zinc-800 text-sm text-green-400 border border-green-500/20">
          {message}
        </div>
      )}

      {/* Content */}
      <main className="flex-1 overflow-auto p-6">
        {tab === "shop" && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl">
            {storeClothing.map((item) => {
              const owned = ownedClothing.includes(item.id);
              const price = Math.round(item.price * (1 - discount / 100));
              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 flex flex-col gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{item.emoji}</span>
                    <div>
                      <h3 className="font-bold text-white">{item.name}</h3>
                      <p className="text-xs text-zinc-500">{item.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-yellow-400 font-mono">
                      {discount > 0 && (
                        <span className="line-through text-zinc-600 mr-2">{item.price}</span>
                      )}
                      {price} AII
                    </span>
                    <button
                      onClick={() => handleBuy(item.id)}
                      disabled={owned}
                      className={`px-4 py-1.5 rounded-lg text-sm font-bold ${
                        owned
                          ? "bg-zinc-700 text-zinc-500 cursor-not-allowed"
                          : "bg-green-600 hover:bg-green-500 text-white"
                      }`}
                    >
                      {owned ? "Owned" : "Buy"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === "game" && store.miniGameType === "arcade" && (
          <div className="max-w-2xl mx-auto h-full min-h-[400px]">
            <ArcadeGame onComplete={() => visitStore(storeId)} onClose={() => setTab("shop")} />
          </div>
        )}

        {tab === "game" && store.miniGameType === "rhythm" && (
          <div className="max-w-2xl mx-auto h-full min-h-[400px]">
            <RhythmGame onComplete={() => visitStore(storeId)} onClose={() => setTab("shop")} />
          </div>
        )}

        {tab === "collectibles" && (
          <div className="grid sm:grid-cols-2 gap-4 max-w-2xl">
            {storeCollectibles.map((item) => {
              const owned = ownedCollectibles.includes(item.id);
              return (
                <div
                  key={item.id}
                  className={`rounded-xl border p-4 flex items-center gap-4 ${
                    item.hidden && !owned
                      ? "border-dashed border-zinc-700 bg-zinc-900/30"
                      : "border-zinc-800 bg-zinc-900/50"
                  }`}
                >
                  <span className="text-3xl">{item.hidden && !owned ? "❓" : item.emoji}</span>
                  <div className="flex-1">
                    <h3 className="font-bold text-white">
                      {item.hidden && !owned ? "???" : item.name}
                    </h3>
                    <p className="text-xs text-zinc-500">
                      {item.hidden && !owned ? "Something is hidden here..." : item.description}
                    </p>
                  </div>
                  {!owned && (
                    <button
                      onClick={() => handleCollect(item.id, item.hidden)}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm"
                    >
                      {item.hidden ? "Search" : "Collect"}
                    </button>
                  )}
                  {owned && <span className="text-green-400 text-sm">✓</span>}
                </div>
              );
            })}
          </div>
        )}

        {tab === "loyalty" && (
          <div className="max-w-md mx-auto">
            <div
              className="rounded-2xl border-2 p-6"
              style={{ borderColor: store.color, background: `linear-gradient(135deg, ${store.color}20, #111)` }}
            >
              <h3 className="text-lg font-bold text-white mb-1">{store.name} Loyalty Card</h3>
              <p className="text-sm text-zinc-400 mb-6">Reward: {loyalty.reward}</p>
              <div className="flex gap-2 mb-4">
                {Array.from({ length: loyalty.maxStamps }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-lg ${
                      i < loyalty.stamps
                        ? "border-transparent"
                        : "border-zinc-600 border-dashed"
                    }`}
                    style={i < loyalty.stamps ? { backgroundColor: store.color } : {}}
                  >
                    {i < loyalty.stamps ? "✓" : ""}
                  </div>
                ))}
              </div>
              <p className="text-sm text-zinc-500">
                {loyalty.stamps}/{loyalty.maxStamps} stamps — shop, play games, and collect items to fill your card!
              </p>
              {loyalty.stamps >= loyalty.maxStamps && (
                <p className="mt-3 text-green-400 font-bold">🎉 Card complete! {loyalty.reward}</p>
              )}
            </div>
          </div>
        )}

        {tab === "coupons" && (
          <div className="max-w-md mx-auto space-y-4">
            {storeCoupons.map((coupon) => {
              const found = foundCoupons.includes(coupon.id);
              return (
                <div
                  key={coupon.id}
                  className={`rounded-xl border p-4 ${
                    found ? "border-green-500/30 bg-green-900/10" : "border-zinc-800 bg-zinc-900/50"
                  }`}
                >
                  {found ? (
                    <div>
                      <p className="font-bold text-green-400">{coupon.code}</p>
                      <p className="text-sm text-zinc-400">{coupon.discount}% off all items here</p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-zinc-400 text-sm">Hidden coupon</p>
                        <p className="text-xs text-zinc-600 italic">Hint: {coupon.hint}</p>
                      </div>
                      <button
                        onClick={() => handleFindCoupon(coupon.id)}
                        className="px-3 py-1.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white text-sm"
                      >
                        🔍 Search
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
