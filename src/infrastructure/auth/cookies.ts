import { tryCatch } from 'fp-ts/TaskEither';
import { cookies } from 'next/headers';

import { dbError } from '~/domain/errors';

import type { TaskEither } from 'fp-ts/TaskEither';

import type { AppError } from '~/domain/errors';

const ACCESS_TOKEN_COOKIE = 'access_token';
const REFRESH_TOKEN_COOKIE = 'refresh_token';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

export type AuthCookies = {
  readonly accessToken: string | null;
  readonly refreshToken: string | null;
};

// Safe versions - return TaskEither<AppError, T>
export const setAuthCookies = (accessToken: string, refreshToken: string): TaskEither<AppError, void> =>
  tryCatch(async () => {
    const cookieStore = await cookies();

    cookieStore.set(ACCESS_TOKEN_COOKIE, accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 15 * 60, // 15 minutes
    });

    cookieStore.set(REFRESH_TOKEN_COOKIE, refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });
  }, dbError);

export const getAuthCookies = (): TaskEither<AppError, AuthCookies> =>
  tryCatch(async () => {
    const cookieStore = await cookies();
    return {
      accessToken: cookieStore.get(ACCESS_TOKEN_COOKIE)?.value ?? null,
      refreshToken: cookieStore.get(REFRESH_TOKEN_COOKIE)?.value ?? null,
    };
  }, dbError);

export const clearAuthCookies = (): TaskEither<AppError, void> =>
  tryCatch(async () => {
    const cookieStore = await cookies();
    cookieStore.delete(ACCESS_TOKEN_COOKIE);
    cookieStore.delete(REFRESH_TOKEN_COOKIE);
  }, dbError);

// Unsafe versions for contexts where TaskEither is not practical
export const unsafeSetAuthCookies = async (accessToken: string, refreshToken: string): Promise<void> => {
  const cookieStore = await cookies();

  cookieStore.set(ACCESS_TOKEN_COOKIE, accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: 15 * 60,
  });

  cookieStore.set(REFRESH_TOKEN_COOKIE, refreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: 7 * 24 * 60 * 60,
  });
};

export const unsafeGetAuthCookies = async (): Promise<AuthCookies> => {
  const cookieStore = await cookies();
  return {
    accessToken: cookieStore.get(ACCESS_TOKEN_COOKIE)?.value ?? null,
    refreshToken: cookieStore.get(REFRESH_TOKEN_COOKIE)?.value ?? null,
  };
};

export const unsafeClearAuthCookies = async (): Promise<void> => {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_TOKEN_COOKIE);
  cookieStore.delete(REFRESH_TOKEN_COOKIE);
};
