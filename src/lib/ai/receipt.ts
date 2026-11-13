import "server-only";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { aiChecks, type ReceiptExtraction } from "@/db/schema";
import { openRouterConfig } from "./openrouter";
import { serverEnv } from "@/lib/env/server";

/**
 * AI receipt reader. The model only EXTRACTS what is printed on the receipt.
 * Results are cached in ai_checks by receipt hash: one model call per receipt, ever,
 * because the free tier allows only 50 calls per day for build, test and demo combined.
 */

const PROMPT = `You read Philippine store receipts. Return ONLY a JSON object, no prose, with this shape:
{"merchant": string|null, "date": "YYYY-MM-DD"|null, "total": number|null, "currency": "PHP"|string|null,
 "items": [{"name": string, "qty": number|null, "amount": number|null,
            "category": "food"|"supplies"|"venue"|"transport"|"printing"|"prizes"|"equipment"|"other"}]}
Rules: copy what is printed; do not guess missing values (use null); amounts are numbers without currency
symbols or commas; "total" is the final amount paid; one entry per line item.`;

const extractionSchema = z.object({
  merchant: z.string().nullish(),
  date: z.string().nullish(),
  total: z.coerce.number().nullish(),
  currency: z.string().nullish(),
  items: z
    .array(
      z.object({
        name: z.string(),
        qty: z.coerce.number().nullish(),
        amount: z.coerce.number().nullish(),
        category: z.string().nullish(),
      }),
    )
    .default([]),
});

export type ReceiptCheck = { extraction: ReceiptExtraction | null; error: string | null; model: string; cached: boolean };

export async function readReceipt(receiptHash: string, image: { bytes: Uint8Array; mime: string }): Promise<ReceiptCheck> {
  const db = getDb();
  const [hit] = await db.select().from(aiChecks).where(eq(aiChecks.receiptHash, receiptHash));
  if (hit) return { extraction: hit.extracted, error: hit.error, model: hit.model, cached: true };

  const env = serverEnv();
  let extraction: ReceiptExtraction | null = null;
  let error: string | null = null;
  const model = env.OPENROUTER_MODEL;

  if (!env.OPENROUTER_API_KEY) {
    // Don't cache "not configured": a later run with a key should still read it.
    return { extraction: null, error: "AI reading is not configured (OPENROUTER_API_KEY).", model, cached: false };
  }

  try {
    const cfg = openRouterConfig();
    const dataUrl = `data:${image.mime};base64,${Buffer.from(image.bytes).toString("base64")}`;
    const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
      method: "POST",
      headers: cfg.headers,
      signal: AbortSignal.timeout(45_000),
      body: JSON.stringify({
        model: cfg.model,
        temperature: 0,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: PROMPT },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
      }),
    });
    if (res.status === 429) {
      // Rate limited: don't cache, so it can be retried later.
      return { extraction: null, error: "The free AI model is busy or the daily limit was reached. Try again later.", model, cached: false };
    }
    if (!res.ok) throw new Error(`AI request failed (${res.status})`);
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = body.choices?.[0]?.message?.content ?? "";
    const json = text.match(/\{[\s\S]*\}/)?.[0];
    if (!json) throw new Error("The AI reply had no JSON.");
    extraction = extractionSchema.parse(JSON.parse(json)) as ReceiptExtraction;
  } catch (e) {
    error = e instanceof Error ? e.message : "AI reading failed.";
    if (/timeout|aborted|fetch failed/i.test(error)) {
      return { extraction: null, error: "The AI model didn't answer in time. Try again later.", model, cached: false };
    }
  }

  await db.insert(aiChecks).values({ receiptHash, model, extracted: extraction, error }).onConflictDoNothing();
  return { extraction, error, model, cached: false };
}
