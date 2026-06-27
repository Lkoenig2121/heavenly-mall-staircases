export type StoreId =
  | "arcade"
  | "music"
  | "toys"
  | "food"
  | "electronics"
  | "books"
  | "hottopic"
  | "kiosk"
  | "cellular"
  | "smoothie"
  | "watches";

export type ClothingSlot = "head" | "torso" | "legs" | "feet" | "accessory";

export interface ClothingItem {
  id: string;
  name: string;
  storeId: StoreId;
  slot: ClothingSlot;
  price: number;
  color: string;
  emoji: string;
  description: string;
}

export interface Collectible {
  id: string;
  name: string;
  storeId: StoreId;
  emoji: string;
  description: string;
  hidden?: boolean;
}

export interface Coupon {
  id: string;
  storeId: StoreId;
  discount: number;
  code: string;
  hint: string;
}

export interface LoyaltyCard {
  storeId: StoreId;
  stamps: number;
  maxStamps: number;
  reward: string;
}

export interface StoreConfig {
  id: StoreId;
  name: string;
  tagline: string;
  emoji: string;
  color: string;
  unlockStamps: number;
  position: [number, number, number];
  rotation: number;
  hasMiniGame: boolean;
  miniGameType?: "arcade" | "rhythm";
  /** Walk-through interior behind a mall wall (no corridor storefront) */
  interiorPortal?: boolean;
  /** Second-floor shop on the perimeter walkway */
  upperLevel?: boolean;
}

export interface GameState {
  aiiMoney: number;
  mallStamps: number;
  unlockedStores: StoreId[];
  ownedClothing: string[];
  equipped: Partial<Record<ClothingSlot, string>>;
  ownedCollectibles: string[];
  foundCoupons: string[];
  loyaltyCards: Record<StoreId, LoyaltyCard>;
  visitedStores: StoreId[];
}
