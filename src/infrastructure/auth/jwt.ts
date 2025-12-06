import { SignJWT, jwtVerify } from 'jose';

import type { JwtPayload } from '~/domain/types';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
export const REFRESH_TOKEN_GRACE_PERIOD_MS = 30 * 1000;

const getAccessSecret = () => new TextEncoder().encode(process.env.JWT_ACCESS_SECRET);
const getRefreshSecret = () => new TextEncoder().encode(process.env.JWT_REFRESH_SECRET);

export const createAccessToken = async (payload: JwtPayload): Promise<string> =>
  new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(getAccessSecret());

export const createRefreshToken = async (payload: JwtPayload): Promise<string> =>
  new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .sign(getRefreshSecret());

export const verifyAccessToken = async (token: string): Promise<JwtPayload> => {
  const { payload } = await jwtVerify(token, getAccessSecret());
  return {
    userId: payload.userId as string,
    email: payload.email as string,
  };
};

export const verifyRefreshToken = async (token: string): Promise<JwtPayload> => {
  const { payload } = await jwtVerify(token, getRefreshSecret());
  return {
    userId: payload.userId as string,
    email: payload.email as string,
  };
};

export const getRefreshTokenExpiry = (): Date => {
  const now = new Date();
  now.setDate(now.getDate() + 7);
  return now;
};
