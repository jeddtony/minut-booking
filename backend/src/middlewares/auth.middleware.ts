import jwt from 'jsonwebtoken';
import { NextFunction, Request, Response } from 'express';
import { JWT_SECRET } from '@config';
import { TokenPayload } from '@interfaces/auth.interface';
import { HttpException } from '@exceptions/HttpException';

export const AuthMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    next(new HttpException(401, 'Missing or invalid Authorization header'));
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;
    req.user = payload;
    next();
  } catch {
    next(new HttpException(401, 'Invalid or expired access token'));
  }
};
