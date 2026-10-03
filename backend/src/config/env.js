import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const REQUIRED = ['DATABASE_URL', 'JWT_SECRET', 'CLIENT_URL'];

const missing = REQUIRED.filter((name) => !process.env[name]);
if (missing.length > 0) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}. Copy .env.example to .env and fill them in.`);
}

const port = Number(process.env.PORT ?? 5000);
if (!Number.isInteger(port) || port <= 0) {
  throw new Error(`PORT must be a positive integer, got "${process.env.PORT}"`);
}

export const env = Object.freeze({
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: port,
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '1d',
  CLIENT_URL: process.env.CLIENT_URL,
});
