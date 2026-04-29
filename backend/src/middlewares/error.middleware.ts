import multer from 'multer';
import { NextFunction, Request, Response } from 'express';
import { HttpException } from '@exceptions/HttpException';
import { logger } from '@utils/logger';

export const ErrorMiddleware = (error: Error, req: Request, res: Response, next: NextFunction): void => {
  try {
    let status = 500;
    let message = 'Something went wrong';

    if (error instanceof multer.MulterError) {
      status = 400;
      message = error.code === 'LIMIT_FILE_SIZE' ? 'File size must not exceed 5 MB' : error.message;
    } else if (error instanceof HttpException) {
      status = error.status;
      message = error.message;
    } else if (error.message) {
      message = error.message;
    }

    logger.error(`[${req.method}] ${req.path} >> StatusCode:: ${status}, Message:: ${message}`);
    res.status(status).json({ message });
  } catch (err) {
    next(err);
  }
};
