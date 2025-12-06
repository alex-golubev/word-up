import type { Language, UserId } from '~/domain/types/common';

export type User = {
  readonly id: UserId;
  readonly email: string;
  readonly passwordHash: string | null;
  readonly name: string | null;
  readonly nativeLanguage: Language;
  readonly createdAt: Date;
};

export type PublicUser = Omit<User, 'passwordHash'>;

export const userToPublicUser = ({ passwordHash: _, ...rest }: User): PublicUser => rest;

export type UserCreateParams = {
  readonly email: string;
  readonly passwordHash: string;
  readonly name?: string | null;
  readonly nativeLanguage: Language;
};
