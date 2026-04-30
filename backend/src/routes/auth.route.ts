import { Router } from 'express';
import { AuthController } from '@controllers/auth.controller';
import { RegisterDto, LoginDto } from '@dtos/auth.dto';
import { ValidationMiddleware } from '@middlewares/validation.middleware';
import { AuthMiddleware } from '@middlewares/auth.middleware';
import { Routes } from '@interfaces/routes.interface';

export class AuthRoute implements Routes {
  public path = '/api/v1/auth';
  public router = Router();
  private controller = new AuthController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post(`${this.path}/register`, ValidationMiddleware(RegisterDto), this.controller.register);
    this.router.post(`${this.path}/login`, ValidationMiddleware(LoginDto), this.controller.login);
    this.router.post(`${this.path}/refresh`, this.controller.refresh);
    this.router.post(`${this.path}/logout`, AuthMiddleware, this.controller.logout);
    this.router.get(`${this.path}/me`, AuthMiddleware, this.controller.getMe);
  }
}
