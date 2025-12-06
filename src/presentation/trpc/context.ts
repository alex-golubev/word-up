import type { AppEnv } from '~/application/env';
import { getAuthCookies } from '~/infrastructure/auth';
import { createDBClient } from '~/infrastructure/db/client';
import { createAppEnv } from '~/infrastructure/env';

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

export const createContext = async (opts: { req: Request }) => {
  const { accessToken, refreshToken } = await getAuthCookies();
  return {
    env: getEnv(),
    accessToken,
    refreshToken,
    signal: opts.req.signal,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;
