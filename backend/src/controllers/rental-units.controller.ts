import { NextFunction, Request, Response } from 'express';
import { RentalUnitsService } from '@services/rental-units.service';
import { CreateRentalUnitDto, UpdateRentalUnitDto } from '@dtos/rental-unit.dto';
import { PropertyType } from '@models/rental-unit.model';
import { HttpException } from '@exceptions/HttpException';
import { uploadToS3 } from '@utils/s3';

export class RentalUnitsController {
  private rentalUnitsService = new RentalUnitsService();

  public getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));

      const { city, state, propertyType, minPrice, maxPrice } = req.query as Record<string, string | undefined>;

      if (propertyType && !Object.values(PropertyType).includes(propertyType as PropertyType)) {
        next(new HttpException(400, `propertyType must be one of: ${Object.values(PropertyType).join(', ')}`));
        return;
      }

      const parsedMinPrice = minPrice !== undefined ? parseFloat(minPrice) : undefined;
      const parsedMaxPrice = maxPrice !== undefined ? parseFloat(maxPrice) : undefined;

      if (parsedMinPrice !== undefined && isNaN(parsedMinPrice)) {
        next(new HttpException(400, 'minPrice must be a number'));
        return;
      }
      if (parsedMaxPrice !== undefined && isNaN(parsedMaxPrice)) {
        next(new HttpException(400, 'maxPrice must be a number'));
        return;
      }
      if (parsedMinPrice !== undefined && parsedMaxPrice !== undefined && parsedMinPrice > parsedMaxPrice) {
        next(new HttpException(400, 'minPrice must not exceed maxPrice'));
        return;
      }

      const filters = { city, state, propertyType: propertyType as PropertyType | undefined, minPrice: parsedMinPrice, maxPrice: parsedMaxPrice };
      const { data, meta } = await this.rentalUnitsService.findAll(page, limit, filters);
      res.status(200).json({ data, meta, message: 'findAll' });
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const data = await this.rentalUnitsService.findById(id);
      res.status(200).json({ data, message: 'findById' });
    } catch (error) {
      next(error);
    }
  };

  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto: CreateRentalUnitDto = req.body;
      const imageKey = req.file ? await uploadToS3(req.file) : undefined;
      const data = await this.rentalUnitsService.create(dto, imageKey);
      res.status(201).json({ data, message: 'created' });
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
      res.status(200).json({ data, message: 'updated' });
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const data = await this.rentalUnitsService.delete(id);
      res.status(200).json({ data, message: 'deleted' });
    } catch (error) {
      next(error);
    }
  };
}
