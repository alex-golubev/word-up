import { pipe } from 'fp-ts/function';
import { map } from 'fp-ts/TaskEither';
import type { AppReader } from '~/application/reader';
import type { PublicUser, UserId } from '~/domain/types';

export const getCurrentUserUseCase =
  (userId: UserId): AppReader<PublicUser> =>
  (env) =>
    pipe(
      env.getUserById(userId),
      map((user) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        nativeLanguage: user.nativeLanguage,
        createdAt: user.createdAt,
      }))
    );
