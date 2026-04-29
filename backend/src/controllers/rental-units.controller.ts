import { NextFunction, Request, Response } from 'express';
import { RentalUnitsService } from '@services/rental-units.service';
import { CreateRentalUnitDto, UpdateRentalUnitDto } from '@dtos/rental-unit.dto';
import { uploadToS3 } from '@utils/s3';

export class RentalUnitsController {
  private rentalUnitsService = new RentalUnitsService();

  public getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.rentalUnitsService.findAll();
      res.status(200).json({ data, message: 'findAll' });
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
