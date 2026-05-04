import { RentalUnitSuggestionsService } from '@services/rental-unit-suggestions.service';
import { RentalUnitsService } from '@services/rental-units.service';
import { SuggestionChatService } from '@services/suggestion-chat.service';
import { PropertyType } from '@models/rental-unit.model';

jest.mock('@utils/s3', () => ({
  getPresignedUrl: jest.fn().mockResolvedValue(undefined),
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
  let getKeywordContext: jest.SpyInstance;
  let appendExchange: jest.SpyInstance;

  beforeEach(() => {
    service = new RentalUnitSuggestionsService();
    findForSuggestions = jest.spyOn(RentalUnitsService.prototype, 'findForSuggestions');
    getHistoryForModel = jest.spyOn(SuggestionChatService.prototype, 'getHistoryForModel').mockResolvedValue([]);
    getKeywordContext = jest.spyOn(SuggestionChatService.prototype, 'getKeywordContext').mockImplementation(async (_uid: string, d: string) => d);
    appendExchange = jest.spyOn(SuggestionChatService.prototype, 'appendExchange').mockResolvedValue(undefined);
  });

  afterEach(() => {
    findForSuggestions.mockRestore();
    getHistoryForModel.mockRestore();
    getKeywordContext.mockRestore();
    appendExchange.mockRestore();
  });

  it('returns empty suggestions when there are no units and records the exchange', async () => {
    findForSuggestions.mockResolvedValue([]);

    const result = await service.suggest('I want a quiet cabin', USER_ID);

    expect(result.suggestions).toEqual([]);
    expect(result.source).toBe('keyword');
    expect(appendExchange).toHaveBeenCalledWith(
      USER_ID,
      'I want a quiet cabin',
      expect.stringContaining('**No listings yet.**'),
    );
  });

  it('ranks units by keyword overlap (keyword source)', async () => {
    findForSuggestions.mockResolvedValue([
      mockUnit({ _id: 'aaa', name: 'Downtown Loft', city: 'Boston', description: 'urban workspace' }) as never,
      mockUnit({ _id: 'bbb', name: 'Beach House', city: 'Miami', description: 'ocean and beach access' }) as never,
    ]);

    const result = await service.suggest('beach vacation near the ocean in Miami', USER_ID);

    expect(result.source).toBe('keyword');
    expect(result.suggestions.length).toBeGreaterThan(0);
    expect(String(result.suggestions[0].rentalUnit._id)).toBe('bbb');
    expect(result.suggestions[0].reason).toContain('Matches keywords');
    expect(appendExchange).toHaveBeenCalled();
    expect(getHistoryForModel).toHaveBeenCalledWith(USER_ID);
  });
});
