import { NextFunction, Request, Response } from 'express';
import { HttpStatus } from '@constants/http-status';
import { RentalUnitsService } from '@services/rental-units.service';
import { RentalUnitSuggestionsService } from '@services/rental-unit-suggestions.service';
import { SuggestionChatService } from '@services/suggestion-chat.service';
import { ListRentalUnitsQueryDto } from '@dtos/list-rental-units-query.dto';
import { CreateRentalUnitDto, UpdateRentalUnitDto } from '@dtos/rental-unit.dto';
import { SuggestRentalUnitsDto } from '@dtos/rental-unit-suggestion.dto';
import { uploadToS3 } from '@utils/s3';

export class RentalUnitsController {
  private rentalUnitsService = new RentalUnitsService();
  private rentalUnitSuggestionsService = new RentalUnitSuggestionsService();
  private suggestionChatService = new SuggestionChatService();

  public getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const q = req.validatedQuery as ListRentalUnitsQueryDto;
      const filters = {
        city: q.city,
        state: q.state,
        propertyType: q.propertyType,
        minPrice: q.minPrice,
        maxPrice: q.maxPrice,
      };
      const { data, meta } = await this.rentalUnitsService.findAll(q.page, q.limit, filters);
      res.status(HttpStatus.OK).json({ data, meta, message: 'findAll' });
    } catch (error) {
      next(error);
    }
  };

  public suggest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = req.body as SuggestRentalUnitsDto;
      const userId = req.user!.id;
      const { suggestions, source } = await this.rentalUnitSuggestionsService.suggest(dto.description, userId);
      res.status(HttpStatus.OK).json({ data: { suggestions, source }, message: 'suggest' });
    } catch (error) {
      next(error);
    }
  };

  public getSuggestChatHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const messages = await this.suggestionChatService.getTranscript(req.user!.id);
      res.status(HttpStatus.OK).json({ data: { messages }, message: 'suggestion chat history' });
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const data = await this.rentalUnitsService.findById(id);
      res.status(HttpStatus.OK).json({ data, message: 'rental unit found' });
    } catch (error) {
      next(error);
    }
  };

  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto: CreateRentalUnitDto = req.body;
      const imageKey = req.file ? await uploadToS3(req.file) : undefined;
      const data = await this.rentalUnitsService.create(dto, imageKey);
      res.status(HttpStatus.CREATED).json({ data, message: 'rental unit created' });
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const dto: UpdateRentalUnitDto = req.body;
      const imageKey = req.file ? await uploadToS3(req.file) : undefined;
      const data = await this.rentalUnitsService.update(id, dto, imageKey);
      res.status(HttpStatus.OK).json({ data, message: 'rental unit updated' });
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const data = await this.rentalUnitsService.delete(id);
      res.status(HttpStatus.OK).json({ data, message: 'rental unit deleted' });
    } catch (error) {
      next(error);
    }
  };
}
