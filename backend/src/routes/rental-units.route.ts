import { Router } from 'express';
import { RentalUnitsController } from '@controllers/rental-units.controller';
import { CreateRentalUnitDto, UpdateRentalUnitDto } from '@dtos/rental-unit.dto';
import { ValidationMiddleware } from '@middlewares/validation.middleware';
import { Routes } from '@interfaces/routes.interface';

export class RentalUnitsRoute implements Routes {
  public path = '/api/v1/rental-units';
  public router = Router();
  private controller = new RentalUnitsController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(this.path, this.controller.getAll);
    this.router.get(`${this.path}/:id`, this.controller.getById);
    this.router.post(this.path, ValidationMiddleware(CreateRentalUnitDto), this.controller.create);
    this.router.put(`${this.path}/:id`, ValidationMiddleware(UpdateRentalUnitDto), this.controller.update);
    this.router.delete(`${this.path}/:id`, this.controller.delete);
  }
}
