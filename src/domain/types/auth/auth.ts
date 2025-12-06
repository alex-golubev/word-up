import { z } from 'zod';

import type { UserId } from '~/domain/types/common';

export type AuthTokens = {
  readonly accessToken: string;
  readonly refreshToken: string;
};

export type RefreshToken = {
  readonly id: string;
  readonly userId: UserId;
  readonly token: string;
  readonly expiresAt: Date;
  readonly createdAt: Date;
  readonly usedAt: Date | null;
  readonly replacementToken: string | null;
};

export type JwtPayload = {
  readonly userId: string;
  readonly email: string;
};

export const EmailSchema = z.email({ error: 'Invalid email format' }).max(255, { error: 'Email is too long' });

export const PasswordSchema = z
  .string()
  .min(8, { error: 'Password must be at least 8 characters' })
  .max(100, { error: 'Password is too long' });

export const NameSchema = z
  .string()
  .min(1, { error: 'Name cannot be empty' })
  .max(100, { error: 'Name is too long' })
  .optional();
