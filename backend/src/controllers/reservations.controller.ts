import { NextFunction, Request, Response } from 'express';
import { ReservationsService } from '@services/reservations.service';
import { CreateReservationDto, UpdateReservationDto } from '@dtos/reservation.dto';
import { HttpException } from '@exceptions/HttpException';

const isValidDate = (value: string): boolean => !isNaN(Date.parse(value));

export class ReservationsController {
  private reservationsService = new ReservationsService();

  public getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { rentalUnitId, startDate, endDate } = req.query as Record<string, string | undefined>;

      if (startDate && !isValidDate(startDate)) {
        next(new HttpException(400, 'startDate must be a valid ISO date string (e.g. 2025-07-01)'));
        return;
      }
      if (endDate && !isValidDate(endDate)) {
        next(new HttpException(400, 'endDate must be a valid ISO date string (e.g. 2025-07-31)'));
        return;
      }
      if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
        next(new HttpException(400, 'startDate must be before endDate'));
        return;
      }

      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
      const { data, meta } = await this.reservationsService.findAll(rentalUnitId, startDate, endDate, page, limit);
      res.status(200).json({ data, meta, message: 'findAll' });
    } catch (error) {
      next(error);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const data = await this.reservationsService.findById(id);
      res.status(200).json({ data, message: 'findById' });
    } catch (error) {
      next(error);
    }
  };

  public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto: CreateReservationDto = req.body;
      const data = await this.reservationsService.create(dto);
      res.status(201).json({ data, message: 'created' });
    } catch (error) {
      next(error);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const dto: UpdateReservationDto = req.body;
      const data = await this.reservationsService.update(id, dto);
      res.status(200).json({ data, message: 'updated' });
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const data = await this.reservationsService.delete(id);
      res.status(200).json({ data, message: 'deleted' });
    } catch (error) {
      next(error);
    }
  };
}
