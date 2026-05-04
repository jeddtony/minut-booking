import { config } from 'dotenv';
import { join } from 'path';

const env = process.env.NODE_ENV ?? 'development';
config({ path: join(process.cwd(), `.env.${env}.local`) });

export const NODE_ENV: string = process.env.NODE_ENV ?? 'development';
export const PORT: string = process.env.PORT ?? '3000';
export const MONGO_URI: string = process.env.MONGO_URI ?? 'mongodb://localhost:27017';
export const DB_NAME: string = process.env.DB_NAME ?? 'booking_db';
export const LOG_FORMAT: string = process.env.LOG_FORMAT ?? 'dev';
export const LOG_DIR: string = process.env.LOG_DIR ?? '../logs';
export const ORIGIN: string = process.env.ORIGIN ?? '*';
export const CREDENTIALS: boolean = process.env.CREDENTIALS === 'true';

export const AWS_REGION: string = process.env.AWS_REGION ?? 'us-east-1';
export const AWS_S3_BUCKET: string = process.env.AWS_S3_BUCKET ?? '';

export const JWT_SECRET: string = process.env.JWT_SECRET ?? 'changeme_access_secret';
export const JWT_REFRESH_SECRET: string = process.env.JWT_REFRESH_SECRET ?? 'changeme_refresh_secret';

/** When set, rental unit suggestions use the OpenAI API for shortlisting and rationale; otherwise keyword overlap is used. */
export const OPENAI_API_KEY: string = process.env.OPENAI_API_KEY ?? '';
export const OPENAI_MODEL: string = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';
