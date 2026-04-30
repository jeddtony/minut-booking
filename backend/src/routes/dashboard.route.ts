import { Router } from 'express';
import { DashboardController } from '@controllers/dashboard.controller';
import { AuthMiddleware } from '@middlewares/auth.middleware';
import { Routes } from '@interfaces/routes.interface';

export class DashboardRoute implements Routes {
  public path = '/api/v1/dashboard';
  public router = Router();
  private controller = new DashboardController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(`${this.path}/weekly-availability`, AuthMiddleware, this.controller.getWeeklyAvailability);
    this.router.get(`${this.path}/monthly-availability`, AuthMiddleware, this.controller.getMonthlyAvailability);
  }
}
