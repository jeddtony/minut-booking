import { OPENAI_API_KEY, OPENAI_MODEL } from '@config';
import { logger } from '@utils/logger';

export type RentalUnitCatalogEntry = {
  id: string;
  name: string;
  city: string;
  state: string;
  propertyType: string;
  pricePerNight: number;
  description?: string;
};

export type OpenAIRentalSuggestionRow = {
  rentalUnitId: string;
  reason: string;
};

export type ChatTurnForModel = {
  role: 'user' | 'assistant';
  content: string;
};

/**
 * Calls OpenAI chat completions to rank catalog units for a guest description.
 * `history` is prior guest and assistant turns (newest within the caller’s cap); the final user message carries this turn’s description and catalog JSON.
 * Returns null when the API key is missing, the request fails, or the response is unusable.
 */
export async function getOpenAIRentalMatchSuggestions(
  description: string,
  catalog: RentalUnitCatalogEntry[],
  history: ChatTurnForModel[] = [],
): Promise<OpenAIRentalSuggestionRow[] | null> {
  if (!OPENAI_API_KEY || catalog.length === 0) return null;

  const userPayload = JSON.stringify({ guestDescription: description, rentalUnits: catalog });

  const historyMessages = history.map(h => ({
    role: h.role as 'user' | 'assistant',
    content: h.content,
  }));

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        temperature: 0.25,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You match short-term rental guests to listings. Earlier messages are the guest conversation (guest user, then your prior replies). Use them for preferences and follow-ups. The latest user message is JSON with keys guestDescription (this turn) and rentalUnits (array of listings). Return JSON only with shape {"suggestions":[{"rentalUnitId":"mongo id","reason":"one concise sentence why this unit fits"}]}. Order from best fit to weaker. Include at most 5 suggestions; only use rentalUnitId values from rentalUnits. If nothing fits, return {"suggestions":[]}.',
          },
          ...historyMessages,
          { role: 'user', content: userPayload },
        ],
      }),
      signal: AbortSignal.timeout(45_000),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      logger.warn(`OpenAI suggestions HTTP ${res.status}: ${errText.slice(0, 200)}`);
      return null;
    }

    const body = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = body.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content) as { suggestions?: Array<{ rentalUnitId?: string; reason?: string }> };
    const raw = Array.isArray(parsed.suggestions) ? parsed.suggestions : [];
    const allowedIds = new Set(catalog.map(c => c.id));

    const out: OpenAIRentalSuggestionRow[] = [];
    for (const row of raw.slice(0, 5)) {
      const id = row.rentalUnitId;
      if (!id || typeof row.reason !== 'string' || !allowedIds.has(id)) continue;
      out.push({ rentalUnitId: id, reason: row.reason.trim() });
    }
    return out.length > 0 ? out : null;
  } catch (e) {
    logger.warn('OpenAI suggestions failed, falling back to keyword ranking', e);
    return null;
  }
}
