import { Router } from 'express';
import { ReservationsController } from '@controllers/reservations.controller';
import { CreateReservationDto, UpdateReservationDto } from '@dtos/reservation.dto';
import { ValidationMiddleware } from '@middlewares/validation.middleware';
import { AuthMiddleware } from '@middlewares/auth.middleware';
import { Routes } from '@interfaces/routes.interface';

export class ReservationsRoute implements Routes {
  public path = '/api/v1/reservations';
  public router = Router();
  private controller = new ReservationsController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(this.path, AuthMiddleware, this.controller.getAll);
    this.router.get(`${this.path}/:id`, AuthMiddleware, this.controller.getById);
    this.router.post(this.path, AuthMiddleware, ValidationMiddleware(CreateReservationDto), this.controller.create);
    this.router.put(`${this.path}/:id`, AuthMiddleware, ValidationMiddleware(UpdateReservationDto), this.controller.update);
    this.router.delete(`${this.path}/:id`, AuthMiddleware, this.controller.delete);
  }
}
