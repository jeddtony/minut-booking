import { NextFunction, Request, Response } from 'express';
import { ReservationsService } from '@services/reservations.service';
import { CreateReservationDto, UpdateReservationDto } from '@dtos/reservation.dto';

export class ReservationsController {
  private reservationsService = new ReservationsService();

  public getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { rentalUnitId, startDate, endDate } = req.query as Record<string, string | undefined>;
      const data = await this.reservationsService.findAll(rentalUnitId, startDate, endDate);
      res.status(200).json({ data, message: 'findAll' });
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
