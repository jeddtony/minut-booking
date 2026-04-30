import { NextFunction, Request, Response } from 'express';
import { AuthService } from '@services/auth.service';
import { RegisterDto, LoginDto } from '@dtos/auth.dto';
import { HttpException } from '@exceptions/HttpException';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export class AuthController {
  private authService = new AuthService();

  public register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto: RegisterDto = req.body;
      const { user, accessToken, refreshToken } = await this.authService.register(dto);
      res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
      res.status(201).json({ data: { user, accessToken }, message: 'registered' });
    } catch (error) {
      next(error);
    }
  };

  public login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto: LoginDto = req.body;
      const { user, accessToken, refreshToken } = await this.authService.login(dto);
      res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
      res.status(200).json({ data: { user, accessToken }, message: 'logged in' });
    } catch (error) {
      next(error);
    }
  };

  public refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token: string | undefined = req.cookies?.refreshToken;
      if (!token) {
        next(new HttpException(401, 'Refresh token not found'));
        return;
      }
      const { accessToken, refreshToken } = await this.authService.refresh(token);
      res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
      res.status(200).json({ data: { accessToken }, message: 'refreshed' });
    } catch (error) {
      next(error);
    }
  };

  public logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.authService.logout(req.user!.id);
      res.clearCookie('refreshToken');
      res.status(200).json({ message: 'logged out' });
    } catch (error) {
      next(error);
    }
  };

  public getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.authService.getMe(req.user!.id);
      res.status(200).json({ data, message: 'me' });
    } catch (error) {
      next(error);
    }
  };
}
