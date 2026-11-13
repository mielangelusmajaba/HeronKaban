import "server-only";
import { serverEnv } from "@/lib/env/server";

export const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

/**
 * Minimal OpenRouter config. Free model = 50 requests/day shared by build, test and demo,
 * so AI results must be cached (ai_checks table) and reused. The AI only READS receipts;
 * comparisons, duplicate and budget checks are plain code. AI never moves money.
 */
export function openRouterConfig() {
  const env = serverEnv();
  return {
    baseUrl: OPENROUTER_BASE_URL,
    model: env.OPENROUTER_MODEL,
    headers: {
      Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "X-Title": "HeronKaban",
    },
  };
}
