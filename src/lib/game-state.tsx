"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { CLOTHING, COUPONS, STORES } from "./store-data";
import type { ClothingSlot, GameState, StoreId } from "./types";

const STORAGE_KEY = "digital-mall-save";

const DEFAULT_STATE: GameState = {
  aiiMoney: 100,
  mallStamps: 0,
  unlockedStores: ["arcade", "music", "hottopic"],
  ownedClothing: [],
  equipped: {},
  ownedCollectibles: [],
  foundCoupons: [],
  loyaltyCards: Object.fromEntries(
    STORES.map((s) => [
      s.id,
      { storeId: s.id, stamps: 0, maxStamps: 5, reward: "10% off everything" },
    ]),
  ) as GameState["loyaltyCards"],
  visitedStores: [],
};

interface GameContextValue extends GameState {
  addMoney: (amount: number) => void;
  spendMoney: (amount: number) => boolean;
  addMallStamp: (count?: number) => void;
  visitStore: (storeId: StoreId) => void;
  buyClothing: (itemId: string) => boolean;
  equipItem: (itemId: string) => void;
  unequipSlot: (slot: ClothingSlot) => void;
  collectItem: (collectibleId: string) => void;
  findCoupon: (couponId: string) => void;
  addLoyaltyStamp: (storeId: StoreId) => void;
  isStoreUnlocked: (storeId: StoreId) => boolean;
  getCouponDiscount: (storeId: StoreId) => number;
  resetGame: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

function loadState(): GameState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_STATE;
  }
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, hydrated]);

  const addMoney = useCallback((amount: number) => {
    setState((s) => ({ ...s, aiiMoney: s.aiiMoney + amount }));
  }, []);

  const spendMoney = useCallback((amount: number) => {
    let ok = false;
    setState((s) => {
      if (s.aiiMoney < amount) return s;
      ok = true;
      return { ...s, aiiMoney: s.aiiMoney - amount };
    });
    return ok;
  }, []);

  const addMallStamp = useCallback((count = 1) => {
    setState((s) => {
      const mallStamps = s.mallStamps + count;
      const unlockedStores = [...s.unlockedStores];
      for (const store of STORES) {
        if (mallStamps >= store.unlockStamps && !unlockedStores.includes(store.id)) {
          unlockedStores.push(store.id);
        }
      }
      return { ...s, mallStamps, unlockedStores };
    });
  }, []);

  const visitStore = useCallback((storeId: StoreId) => {
    setState((s) => {
      if (s.visitedStores.includes(storeId)) return s;
      const mallStamps = s.mallStamps + 1;
      const unlockedStores = [...s.unlockedStores];
      for (const store of STORES) {
        if (mallStamps >= store.unlockStamps && !unlockedStores.includes(store.id)) {
          unlockedStores.push(store.id);
        }
      }
      return {
        ...s,
        visitedStores: [...s.visitedStores, storeId],
        mallStamps,
        unlockedStores,
      };
    });
  }, []);

  const buyClothing = useCallback((itemId: string) => {
    const item = CLOTHING.find((c) => c.id === itemId);
    if (!item) return false;

    let success = false;
    setState((s) => {
      if (s.ownedClothing.includes(itemId)) return s;
      const discount = COUPONS.filter((c) => s.foundCoupons.includes(c.id) && c.storeId === item.storeId)
        .reduce((max, c) => Math.max(max, c.discount), 0);
      const price = Math.round(item.price * (1 - discount / 100));
      if (s.aiiMoney < price) return s;
      success = true;
      return {
        ...s,
        aiiMoney: s.aiiMoney - price,
        ownedClothing: [...s.ownedClothing, itemId],
      };
    });
    return success;
  }, []);

  const equipItem = useCallback((itemId: string) => {
    const item = CLOTHING.find((c) => c.id === itemId);
    if (!item) return;
    setState((s) => ({
      ...s,
      equipped: { ...s.equipped, [item.slot]: itemId },
    }));
  }, []);

  const unequipSlot = useCallback((slot: ClothingSlot) => {
    setState((s) => {
      const equipped = { ...s.equipped };
      delete equipped[slot];
      return { ...s, equipped };
    });
  }, []);

  const collectItem = useCallback((collectibleId: string) => {
    setState((s) => {
      if (s.ownedCollectibles.includes(collectibleId)) return s;
      const mallStamps = s.mallStamps + 1;
      const unlockedStores = [...s.unlockedStores];
      for (const store of STORES) {
        if (mallStamps >= store.unlockStamps && !unlockedStores.includes(store.id)) {
          unlockedStores.push(store.id);
        }
      }
      return {
        ...s,
        mallStamps,
        unlockedStores,
        ownedCollectibles: [...s.ownedCollectibles, collectibleId],
      };
    });
  }, []);

  const findCoupon = useCallback((couponId: string) => {
    setState((s) => {
      if (s.foundCoupons.includes(couponId)) return s;
      return { ...s, foundCoupons: [...s.foundCoupons, couponId] };
    });
  }, []);

  const addLoyaltyStamp = useCallback((storeId: StoreId) => {
    setState((s) => {
      const card = s.loyaltyCards[storeId];
      if (!card || card.stamps >= card.maxStamps) return s;
      return {
        ...s,
        loyaltyCards: {
          ...s.loyaltyCards,
          [storeId]: { ...card, stamps: card.stamps + 1 },
        },
      };
    });
  }, []);

  const isStoreUnlocked = useCallback(
    (storeId: StoreId) => state.unlockedStores.includes(storeId),
    [state.unlockedStores],
  );

  const getCouponDiscount = useCallback(
    (storeId: StoreId) => {
      return COUPONS.filter(
        (c) => state.foundCoupons.includes(c.id) && c.storeId === storeId,
      ).reduce((max, c) => Math.max(max, c.discount), 0);
    },
    [state.foundCoupons],
  );

  const resetGame = useCallback(() => {
    setState(DEFAULT_STATE);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      addMoney,
      spendMoney,
      addMallStamp,
      visitStore,
      buyClothing,
      equipItem,
      unequipSlot,
      collectItem,
      findCoupon,
      addLoyaltyStamp,
      isStoreUnlocked,
      getCouponDiscount,
      resetGame,
    }),
    [
      state,
      addMoney,
      spendMoney,
      addMallStamp,
      visitStore,
      buyClothing,
      equipItem,
      unequipSlot,
      collectItem,
      findCoupon,
      addLoyaltyStamp,
      isStoreUnlocked,
      getCouponDiscount,
      resetGame,
    ],
  );

  if (!hydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#1a1520] text-zinc-400">
        Loading Sunset Galleria...
      </div>
    );
  }

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}
