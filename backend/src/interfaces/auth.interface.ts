export interface TokenPayload {
  id: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
      /** Set by `ValidationMiddleware` when `source: 'query'`. */
      validatedQuery?: unknown;
    }
  }
}
