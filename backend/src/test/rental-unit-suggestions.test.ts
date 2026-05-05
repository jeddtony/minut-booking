import { RentalUnitSuggestionsService } from '@services/rental-unit-suggestions.service';
import { RentalUnitsService } from '@services/rental-units.service';
import { SuggestionChatService } from '@services/suggestion-chat.service';
import { PropertyType } from '@models/rental-unit.model';
import { getOpenAIRentalMatchSuggestions } from '@utils/llm/openai-rental-suggestions';

jest.mock('@utils/s3', () => ({
  getPresignedUrl: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@utils/llm/openai-rental-suggestions', () => ({
  getOpenAIRentalMatchSuggestions: jest.fn(),
}));

const USER_ID = '507f1f77bcf86cd799439011';

const mockUnit = (overrides: Partial<{ _id: string; name: string; city: string; description: string }> = {}) => ({
  _id: overrides._id ?? '507f1f77bcf86cd799439011',
  name: overrides.name ?? 'Beach House',
  address: '1 Ocean Dr',
  city: overrides.city ?? 'Miami',
  state: 'FL',
  postalCode: '33101',
  pricePerNight: 200,
  propertyType: PropertyType.HOUSE,
  description: overrides.description ?? 'Steps from the beach',
  toObject: function () {
    return { ...this, toObject: undefined };
  },
});

describe('RentalUnitSuggestionsService', () => {
  let service: RentalUnitSuggestionsService;
  let findForSuggestions: jest.SpyInstance;
  let getHistoryForModel: jest.SpyInstance;
  let appendExchange: jest.SpyInstance;
  const mockOpenAI = getOpenAIRentalMatchSuggestions as jest.MockedFunction<typeof getOpenAIRentalMatchSuggestions>;

  beforeEach(() => {
    service = new RentalUnitSuggestionsService();
    findForSuggestions = jest.spyOn(RentalUnitsService.prototype, 'findForSuggestions');
    getHistoryForModel = jest.spyOn(SuggestionChatService.prototype, 'getHistoryForModel').mockResolvedValue([]);
    appendExchange = jest.spyOn(SuggestionChatService.prototype, 'appendExchange').mockResolvedValue(undefined);
    mockOpenAI.mockReset();
  });

  afterEach(() => {
    findForSuggestions.mockRestore();
    getHistoryForModel.mockRestore();
    appendExchange.mockRestore();
  });

  it('returns empty suggestions when there are no units and records the exchange', async () => {
    findForSuggestions.mockResolvedValue([]);

    const result = await service.suggest('I want a quiet cabin', USER_ID);

    expect(result.suggestions).toEqual([]);
    expect(result.source).toBe('openai');
    expect(mockOpenAI).not.toHaveBeenCalled();
    expect(appendExchange).toHaveBeenCalledWith(
      USER_ID,
      'I want a quiet cabin',
      expect.stringContaining('**No listings yet.**'),
    );
  });

  it('returns OpenAI-ranked units when the model returns matches', async () => {
    findForSuggestions.mockResolvedValue([
      mockUnit({ _id: 'aaa', name: 'Downtown Loft', city: 'Boston', description: 'urban workspace' }) as never,
      mockUnit({ _id: 'bbb', name: 'Beach House', city: 'Miami', description: 'ocean and beach access' }) as never,
    ]);
    mockOpenAI.mockResolvedValue([{ rentalUnitId: 'bbb', reason: 'Matches beach and Miami request.' }]);

    const result = await service.suggest('beach vacation near the ocean in Miami', USER_ID);

    expect(result.source).toBe('openai');
    expect(result.suggestions).toHaveLength(1);
    expect(String(result.suggestions[0].rentalUnit._id)).toBe('bbb');
    expect(result.suggestions[0].reason).toContain('Matches beach');
    expect(appendExchange).toHaveBeenCalled();
    expect(getHistoryForModel).toHaveBeenCalledWith(USER_ID);
  });

  it('returns empty suggestions when OpenAI returns nothing', async () => {
    findForSuggestions.mockResolvedValue([mockUnit() as never]);
    mockOpenAI.mockResolvedValue(null);

    const result = await service.suggest('quiet cabin', USER_ID);

    expect(result.source).toBe('openai');
    expect(result.suggestions).toEqual([]);
    expect(appendExchange).toHaveBeenCalledWith(USER_ID, 'quiet cabin', expect.stringContaining('No matching units'));
  });
});
