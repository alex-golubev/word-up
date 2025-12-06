import { isRight } from 'fp-ts/Either';

import { getAuthCookies } from '~/infrastructure/auth';
import { createDBClient } from '~/infrastructure/db/client';
import { createAppEnv } from '~/infrastructure/env';

import type { AppEnv } from '~/application/env';

// Lazy singleton using memoization closure - idempotent from caller's perspective
const createEnvOnce = (() => {
  let cached: AppEnv | null = null;
  return (): AppEnv => {
    if (!cached) {
      cached = createAppEnv({
        db: createDBClient(),
        openai: { apiKey: process.env.OPENAI_API_KEY ?? '' },
      });
    }
    return cached;
  };
})();

export const createContext = async (opts: { req: Request }) => {
  const cookiesResult = await getAuthCookies()();
  const { accessToken, refreshToken } = isRight(cookiesResult)
    ? cookiesResult.right
    : { accessToken: null, refreshToken: null };

  return {
    env: createEnvOnce(),
    accessToken,
    refreshToken,
    signal: opts.req.signal,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;
