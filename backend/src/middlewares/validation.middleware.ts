import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { NextFunction, Request, Response } from 'express';
import { HttpException } from '@exceptions/HttpException';

export type ValidationSource = 'body' | 'query';

export type ValidationMiddlewareOptions = {
  skipMissingProperties?: boolean;
  /** Where to read input from (default `body`). */
  source?: ValidationSource;
  /** When false, extra properties are stripped but do not fail validation. Useful for query strings. */
  forbidNonWhitelisted?: boolean;
};

function flattenQuery(query: Request['query']): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(query)) {
    const v = query[key];
    if (v === undefined) continue;
    out[key] = Array.isArray(v) ? v[0] : v;
  }
  return out;
}

export const ValidationMiddleware = <T extends object>(
  type: ClassConstructor<T>,
  options: ValidationMiddlewareOptions = {},
): ((req: Request, res: Response, next: NextFunction) => void) => {
  const skipMissingProperties = options.skipMissingProperties ?? false;
  const source = options.source ?? 'body';
  const forbidNonWhitelisted = options.forbidNonWhitelisted ?? source === 'body';

  return (req: Request, res: Response, next: NextFunction): void => {
    const raw = source === 'query' ? flattenQuery(req.query) : req.body;
    const dto = plainToInstance(type, raw as object, { exposeDefaultValues: true });
    validate(dto, { skipMissingProperties, whitelist: true, forbidNonWhitelisted }).then((errors: ValidationError[]) => {
      if (errors.length > 0) {
        const message = errors
          .map((error: ValidationError) => Object.values(error.constraints ?? {}))
          .flat()
          .join(', ');
        next(new HttpException(400, message));
      } else if (source === 'query') {
        req.validatedQuery = dto;
        next();
      } else {
        req.body = dto;
        next();
      }
    });
  };
};
