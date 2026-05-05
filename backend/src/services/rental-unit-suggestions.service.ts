import { RentalUnitsService, RentalUnitResponse } from '@services/rental-units.service';
import { SuggestionChatService } from '@services/suggestion-chat.service';
import {
  getOpenAIRentalMatchSuggestions,
  OpenAIRentalSuggestionRow,
  RentalUnitCatalogEntry,
} from '@utils/llm/openai-rental-suggestions';

export type RentalUnitSuggestion = {
  rentalUnit: RentalUnitResponse;
  matchScore: number;
  reason: string;
};

export type SuggestRentalUnitsResult = {
  suggestions: RentalUnitSuggestion[];
  /** Always OpenAI-backed; empty array when the model returns nothing or the API is unavailable. */
  source: 'openai';
};

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

function formatAssistantSummary(suggestions: RentalUnitSuggestion[]): string {
  const sourceLine = '*Smart match (model-assisted).*';
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
        '**No listings yet.**\n\nThere are no rental units in the catalog to suggest.',
      );
      return { suggestions: [], source: 'openai' };
    }

    const history = await this.suggestionChatService.getHistoryForModel(userId);
    const catalog = units.map(toCatalogEntry);
    const rows = await getOpenAIRentalMatchSuggestions(trimmed, catalog, history);

    const suggestions =
      rows && rows.length > 0 ? mapOpenAIRowsToSuggestions(rows, units) : [];

    await this.suggestionChatService.appendExchange(userId, trimmed, formatAssistantSummary(suggestions));

    return { suggestions, source: 'openai' };
  }
}
