import { RentalUnitsService, RentalUnitResponse } from '@services/rental-units.service';
import { SuggestionChatService } from '@services/suggestion-chat.service';
import {
  getOpenAIRentalMatchSuggestions,
  OpenAIRentalSuggestionRow,
  RentalUnitCatalogEntry,
} from '@utils/llm/openai-rental-suggestions';

const STOPWORDS = new Set([
  'the',
  'a',
  'an',
  'and',
  'or',
  'for',
  'to',
  'in',
  'on',
  'at',
  'with',
  'of',
  'i',
  'we',
  'my',
  'our',
  'is',
  'are',
  'was',
  'be',
  'this',
  'that',
  'it',
  'as',
  'by',
  'from',
  'looking',
  'want',
  'need',
  'would',
  'like',
  'stay',
  'rent',
  'unit',
  'place',
]);

export type RentalUnitSuggestion = {
  rentalUnit: RentalUnitResponse;
  matchScore: number;
  reason: string;
};

export type SuggestRentalUnitsResult = {
  suggestions: RentalUnitSuggestion[];
  source: 'openai' | 'keyword';
};

function tokenize(text: string): string[] {
  const raw = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1 && !STOPWORDS.has(t));
  return [...new Set(raw)];
}

function unitSearchBlob(unit: RentalUnitResponse): string {
  const parts = [
    unit.name,
    unit.city,
    unit.state,
    unit.propertyType,
    unit.description ?? '',
    String(unit.pricePerNight),
  ];
  return parts.join(' ').toLowerCase();
}

function scoreKeyword(description: string, unit: RentalUnitResponse): { score: number; matched: string[] } {
  const q = tokenize(description);
  if (q.length === 0) return { score: 0, matched: [] };
  const blob = unitSearchBlob(unit);
  const matched = q.filter(t => blob.includes(t));
  const score = matched.length / q.length;
  return { score, matched };
}

function toCatalogEntry(unit: RentalUnitResponse): RentalUnitCatalogEntry {
  return {
    rentalUnitId: String(unit._id),
    name: unit.name,
    city: unit.city,
    state: unit.state,
    propertyType: unit.propertyType,
    pricePerNight: unit.pricePerNight,
    description: unit.description,
  };
}

function mapOpenAIRowsToSuggestions(rows: OpenAIRentalSuggestionRow[], units: RentalUnitResponse[]): RentalUnitSuggestion[] {
  const byId = new Map(units.map(u => [String(u._id), u]));
  const out: RentalUnitSuggestion[] = [];
  for (const row of rows) {
    const unit = byId.get(row.rentalUnitId);
    if (!unit) continue;
    out.push({
      rentalUnit: unit,
      matchScore: 1 - out.length * 0.05,
      reason: row.reason,
    });
  }
  return out;
}

function formatAssistantSummary(suggestions: RentalUnitSuggestion[], source: 'openai' | 'keyword'): string {
  const sourceLine = source === 'openai' ? '*Smart match (model-assisted).*' : '*Keyword match.*';
  if (suggestions.length === 0) {
    return `No matching units found for this request.\n\n${sourceLine}`;
  }
  const blocks = suggestions.map((s, i) => {
    const u = s.rentalUnit;
    const loc = [u.city, u.state].filter(Boolean).join(', ');
    return [
      `### ${i + 1}. ${u.name}`,
      '',
      `**${loc}** · **$${u.pricePerNight}/night** · match ${Math.round(s.matchScore * 100)}%`,
      '',
      s.reason,
      '',
    ].join('\n');
  });
  return `${blocks.join('\n---\n\n')}\n\n${sourceLine}`;
}

function suggestKeyword(description: string, units: RentalUnitResponse[]): RentalUnitSuggestion[] {
  const scored = units
    .map(unit => {
      const { score, matched } = scoreKeyword(description, unit);
      const reason =
        matched.length > 0
          ? `Matches keywords from your description (${matched.slice(0, 5).join(', ')}).`
          : 'General listing; weaker keyword overlap with your description.';
      return { unit, score, reason, matched };
    })
    .filter(x => x.score > 0 || units.length <= 5)
    .sort((a, b) => b.score - a.score);

  const top = (scored.length > 0 ? scored : units.map(unit => ({ unit, score: 0, reason: 'Available unit.', matched: [] as string[] }))).slice(
    0,
    5,
  );

  return top.map((row, i) => ({
    rentalUnit: row.unit,
    matchScore: Math.round((row.score > 0 ? row.score : 0.1 - i * 0.01) * 100) / 100,
    reason: row.reason,
  }));
}

export class RentalUnitSuggestionsService {
  private rentalUnitsService = new RentalUnitsService();
  private suggestionChatService = new SuggestionChatService();

  public async suggest(description: string, userId: string): Promise<SuggestRentalUnitsResult> {
    const trimmed = description.trim();
    const units = await this.rentalUnitsService.findForSuggestions(50);

    if (units.length === 0) {
      await this.suggestionChatService.appendExchange(
        userId,
        trimmed,
        '**No listings yet.**\n\nThere are no rental units in the catalog to suggest.\n\n*Keyword match.*',
      );
      return { suggestions: [], source: 'keyword' };
    }

    const history = await this.suggestionChatService.getHistoryForModel(userId);
    const catalog = units.map(toCatalogEntry);
    const rows = await getOpenAIRentalMatchSuggestions(trimmed, catalog, history);

    let suggestions: RentalUnitSuggestion[];
    let source: 'openai' | 'keyword';

    if (rows && rows.length > 0) {
      const mapped = mapOpenAIRowsToSuggestions(rows, units);
      if (mapped.length > 0) {
        suggestions = mapped;
        source = 'openai';
      } else {
        const keywordContext = await this.suggestionChatService.getKeywordContext(userId, trimmed);
        suggestions = suggestKeyword(keywordContext, units);
        source = 'keyword';
      }
    } else {
      const keywordContext = await this.suggestionChatService.getKeywordContext(userId, trimmed);
      suggestions = suggestKeyword(keywordContext, units);
      source = 'keyword';
    }

    await this.suggestionChatService.appendExchange(userId, trimmed, formatAssistantSummary(suggestions, source));

    return { suggestions, source };
  }
}
