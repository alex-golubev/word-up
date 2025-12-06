import { tryCatch } from 'fp-ts/TaskEither';
import { jwtVerify, SignJWT } from 'jose';

import { dbError, invalidToken } from '~/domain/errors';

import type { TaskEither } from 'fp-ts/TaskEither';

import type { AppError } from '~/domain/errors';
import type { JwtPayload } from '~/domain/types';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
export const REFRESH_TOKEN_GRACE_PERIOD_MS = 30 * 1000;

const getAccessSecret = () => new TextEncoder().encode(process.env.JWT_ACCESS_SECRET);
const getRefreshSecret = () => new TextEncoder().encode(process.env.JWT_REFRESH_SECRET);

// Safe versions - return TaskEither<AppError, T>
export const createAccessToken = (payload: JwtPayload): TaskEither<AppError, string> =>
  tryCatch(
    () =>
      new SignJWT({ ...payload })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(ACCESS_TOKEN_EXPIRY)
        .sign(getAccessSecret()),
    dbError
  );

export const createRefreshToken = (payload: JwtPayload): TaskEither<AppError, string> =>
  tryCatch(
    () =>
      new SignJWT({ ...payload })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(REFRESH_TOKEN_EXPIRY)
        .sign(getRefreshSecret()),
    dbError
  );

export const verifyAccessToken = (token: string): TaskEither<AppError, JwtPayload> =>
  tryCatch(
    async () => {
      const { payload } = await jwtVerify(token, getAccessSecret());
      return {
        userId: payload.userId as string,
        email: payload.email as string,
      };
    },
    () => invalidToken()
  );

export const verifyRefreshToken = (token: string): TaskEither<AppError, JwtPayload> =>
  tryCatch(
    async () => {
      const { payload } = await jwtVerify(token, getRefreshSecret());
      return {
        userId: payload.userId as string,
        email: payload.email as string,
      };
    },
    () => invalidToken()
  );

// Pure function - no side effects, immutable
export const getRefreshTokenExpiry = (): Date => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

// Unsafe versions for tests (throw on error)
export const unsafeCreateAccessToken = async (payload: JwtPayload): Promise<string> =>
  new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(getAccessSecret());

export const unsafeCreateRefreshToken = async (payload: JwtPayload): Promise<string> =>
  new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .sign(getRefreshSecret());

export const unsafeVerifyAccessToken = async (token: string): Promise<JwtPayload> => {
  const { payload } = await jwtVerify(token, getAccessSecret());
  return {
    userId: payload.userId as string,
    email: payload.email as string,
  };
};

export const unsafeVerifyRefreshToken = async (token: string): Promise<JwtPayload> => {
  const { payload } = await jwtVerify(token, getRefreshSecret());
  return {
    userId: payload.userId as string,
    email: payload.email as string,
  };
};
