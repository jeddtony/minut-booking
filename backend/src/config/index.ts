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
