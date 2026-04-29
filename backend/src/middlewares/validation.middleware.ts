import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { NextFunction, Request, Response } from 'express';
import { HttpException } from '@exceptions/HttpException';

export const ValidationMiddleware = <T extends object>(
  type: ClassConstructor<T>,
  skipMissingProperties = false,
): ((req: Request, res: Response, next: NextFunction) => void) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const dto = plainToInstance(type, req.body);
    validate(dto, { skipMissingProperties, whitelist: true, forbidNonWhitelisted: true }).then((errors: ValidationError[]) => {
      if (errors.length > 0) {
        const message = errors
          .map((error: ValidationError) => Object.values(error.constraints ?? {}))
          .flat()
          .join(', ');
        next(new HttpException(400, message));
      } else {
        req.body = dto;
        next();
      }
    });
  };
};
