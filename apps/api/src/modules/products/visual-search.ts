import type { Env } from '../../config/env.js';

export type VisualSearchHints = {
  search: string;
  franchise?: string;
  category?: string;
};

export const VISUAL_SEARCH_PROMPT = `You help shoppers find anime merch (collectibles, apparel, desk gear, limited drops) in an Indian INR catalog.
Look at the image and return ONLY compact JSON (no markdown):
{"search":"2-5 catalog keywords","franchise":"optional franchise name or empty string","category":"optional one of collectibles|apparel|desk-gear|limited-drops or empty string"}
Focus on product type and franchise cues. Never invent SKUs or prices.`;

/** Pull catalog hints out of a model reply. Exported so the eval script can check it without calling the model. */
export function parseHints(raw: string): VisualSearchHints | null {
  const trimmed = raw.trim();
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    const json = JSON.parse(trimmed.slice(start, end + 1)) as Record<string, unknown>;
    const search = String(json.search ?? '')
      .trim()
      .replace(/\s+/g, ' ')
      .slice(0, 80);
    if (!search) return null;
    const franchise = String(json.franchise ?? '').trim().slice(0, 80) || undefined;
    const categoryRaw = String(json.category ?? '').trim();
    const allowed = new Set(['collectibles', 'apparel', 'desk-gear', 'limited-drops']);
    const category = allowed.has(categoryRaw) ? categoryRaw : undefined;
    return { search, franchise, category };
  } catch {
    return null;
  }
}

/**
 * Vision LLM → catalog search hints. Returns null when AI is off, key missing, or the model fails.
 * Does not invent products — caller must run ProductService.list.
 */
export async function extractVisualSearchHints(
  env: Env,
  imageBuffer: Buffer,
  mimeType: string,
): Promise<VisualSearchHints | null> {
  if (!env.aiEnabled || !env.openaiApiKey) {
    return null;
  }

  const model = env.openaiVisionModel || env.openaiModel || 'gpt-4o-mini';
  const baseUrl = (env.openaiBaseUrl || 'https://api.openai.com/v1').replace(/\/$/, '');
  const dataUrl = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 200,
        messages: [
          { role: 'system', content: VISUAL_SEARCH_PROMPT },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Extract catalog search hints from this photo.' },
              { type: 'image_url', image_url: { url: dataUrl } },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      return null;
    }

    const json = (await response.json()) as {
      choices?: Array<{ message?: { content?: string | null } }>;
    };
    const content = json.choices?.[0]?.message?.content;
    if (!content) return null;
    return parseHints(content);
  } catch {
    return null;
  }
}
