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
  // If set, the dorm page fetches a live price + photo from the Best Buy
  // Products API for this item's "Best Buy" row (see src/lib/bestbuy.ts).
  // Only set this for items Best Buy actually carries — most of the catalog
  // has no live source and stays curated.
  bestBuyQuery?: string;
  // A real, freely-licensed representative photo (not the live vendor's own
  // listing image — those are copyrighted). CC0 sources need no credit;
  // CC-BY sources must set imageCredit.
  imageUrl?: string;
  imageCredit?: string;
  prices: {
    vendor: string;
    price: number;
    url?: string;
  }[];
}
