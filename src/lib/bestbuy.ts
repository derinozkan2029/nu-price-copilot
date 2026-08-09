// Thin wrapper around Best Buy's Products API for live price + photo lookups.
// Docs: https://bestbuyapis.github.io/api-documentation/ — free, self-serve
// API key at https://developer.bestbuy.com/. Their terms only allow
// temporary caching (response links expire after 7 days), so callers should
// keep any `next.revalidate` window short rather than persisting results.
//
// Best Buy only carries a fraction of the dorm catalog (mostly electronics
// and appliances), so this is opt-in per item via `bestBuyQuery` in
// data/dorm-items.json — not a blanket replacement for the curated dataset.

export interface LiveProduct {
  vendor: "Best Buy";
  price: number;
  imageUrl: string | null;
  productUrl: string | null;
  name: string;
}

export async function lookupBestBuyProduct(
  query: string
): Promise<LiveProduct | null> {
  const apiKey = process.env.BESTBUY_API_KEY;
  if (!apiKey) return null;

  const params = new URLSearchParams({
    apiKey,
    format: "json",
    sort: "salePrice.asc",
    pageSize: "1",
    show: "name,salePrice,regularPrice,largeFrontImage,thumbnailImage,url",
  });

  const res = await fetch(
    `https://api.bestbuy.com/v1/products(search=${encodeURIComponent(
      query
    )}&onlineAvailability=true)?${params.toString()}`,
    { next: { revalidate: 60 * 60 * 3 } } // short window — their terms only allow temporary caching
  );

  if (!res.ok) {
    console.error(`Best Buy API error (${res.status}) for query "${query}"`);
    return null;
  }

  const data = await res.json();
  const product = data.products?.[0];
  if (!product) return null;

  const price = product.salePrice ?? product.regularPrice;
  if (typeof price !== "number") return null;

  return {
    vendor: "Best Buy",
    price,
    imageUrl: product.largeFrontImage ?? product.thumbnailImage ?? null,
    productUrl: product.url ?? null,
    name: product.name ?? query,
  };
}
