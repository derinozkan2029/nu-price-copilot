import Anthropic from "@anthropic-ai/sdk";
import type { RecommendationSignal } from "@/types";
import type { VendorPrice } from "@/lib/bookscouter";

export interface RecommendationResult {
  signal: RecommendationSignal;
  rationale: string;
}

// Rule-based signal: cheap, deterministic, no API cost. This is the actual
// product logic — the LLM call below only translates it into plain English.
export function computeSignal(prices: VendorPrice[]): {
  signal: RecommendationSignal;
  lowPrice: number;
  highPrice: number;
  cheapest: VendorPrice;
} {
  if (!prices.length) {
    throw new Error("computeSignal requires at least one price");
  }

  const sorted = [...prices].sort((a, b) => a.price - b.price);
  const cheapest = sorted[0];
  const lowPrice = sorted[0].price;
  const highPrice = sorted[sorted.length - 1].price;

  // Simple heuristic for the MVP (no price history yet, so this compares
  // same-day vendor spread rather than a rolling low): if the cheapest
  // option is a steep discount off the priciest one — e.g. renting instead
  // of buying new — that's a real deal, buy now. If all vendors are
  // clustered close together, there's little to gain by acting today, so
  // suggest waiting/checking back. Once the `prices` table accumulates
  // dated rows, replace this with a real rolling 90-day-low comparison per
  // the build plan.
  const discountFromHigh = (highPrice - lowPrice) / highPrice;
  const signal: RecommendationSignal =
    discountFromHigh >= 0.4 ? "buy_now" : "wait";

  return { signal, lowPrice, highPrice, cheapest };
}

// Turns the rule-based signal into a short, plain-language explanation.
// Falls back to a templated string if ANTHROPIC_API_KEY isn't set, so the
// app works end-to-end without an LLM key.
export async function explainRecommendation(
  itemTitle: string,
  prices: VendorPrice[]
): Promise<RecommendationResult> {
  const { signal, lowPrice, highPrice, cheapest } = computeSignal(prices);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      signal,
      rationale: `${cheapest.vendor} has the best price at $${lowPrice.toFixed(
        2
      )} (${cheapest.format ?? "n/a"}), vs. up to $${highPrice.toFixed(
        2
      )} elsewhere.`,
    };
  }

  const client = new Anthropic({ apiKey });
  const message = await client.messages.create({
    // Check https://docs.claude.com for the current model string before
    // shipping — model names change over time.
    model: "claude-sonnet-5",
    max_tokens: 120,
    messages: [
      {
        role: "user",
        content: `A student is deciding whether to buy "${itemTitle}" now or wait. Prices found: ${prices
          .map((p) => `${p.vendor} $${p.price} (${p.format ?? "n/a"})`)
          .join(
            ", "
          )}. In 1-2 short sentences, explain which option to pick and why, addressed directly to the student. Be concrete about the price and vendor. Write in plain prose: no em dashes, use periods or commas instead.`,
      },
    ],
  });

  const text = message.content
    .filter((block) => block.type === "text")
    .map((block) => ("text" in block ? block.text : ""))
    .join(" ")
    .trim();

  return { signal, rationale: text || `Best price: ${cheapest.vendor} at $${lowPrice.toFixed(2)}.` };
}
