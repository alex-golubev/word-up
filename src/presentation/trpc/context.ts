import { createDBClient } from '~/infrastructure/db/client';
import { createAppEnv } from '~/infrastructure/env';
import type { AppEnv } from '~/application/env';

let cachedEnv: AppEnv | null = null;

const getEnv = (): AppEnv => {
  if (!cachedEnv) {
    const db = createDBClient();
    cachedEnv = createAppEnv({
      db,
      openai: { apiKey: process.env.OPENAI_API_KEY ?? '' },
    });
  }
  return cachedEnv;
};

export const createContext = () => ({ env: getEnv() });

export type Context = ReturnType<typeof createContext>;
