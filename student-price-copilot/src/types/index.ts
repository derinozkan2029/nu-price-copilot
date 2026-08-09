export type ItemType = "textbook" | "dorm";

export type PriceFormat = "new" | "used" | "rental" | "ebook" | null;

export interface Item {
  id: string;
  type: ItemType;
  title: string;
  isbn: string | null;
  category: string | null;
  image_url: string | null;
  created_at: string;
}

export interface Price {
  id: string;
  item_id: string;
  vendor: string;
  price: number;
  format: PriceFormat;
  url: string | null;
  date_seen: string;
}

export type RecommendationSignal = "buy_now" | "wait";

export interface Recommendation {
  id: string;
  item_id: string;
  signal: RecommendationSignal;
  rationale_text: string | null;
  generated_at: string;
}

export interface ItemWithPrices extends Item {
  prices: Price[];
  recommendation?: Recommendation;
}

// Curated dorm item shape (data/dorm-items.json), before it's loaded into Supabase.
export interface DormItemSeed {
  title: string;
  category: string;
  shareable: boolean; // true if commonly split with a roommate (fridge, rug)
  prices: {
    vendor: string;
    price: number;
    url?: string;
  }[];
}
