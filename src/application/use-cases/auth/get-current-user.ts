import { pipe } from 'fp-ts/function';
import { map } from 'fp-ts/TaskEither';

import { userToPublicUser } from '~/domain/types';

import type { AppReader } from '~/application/reader';
import type { PublicUser, UserId } from '~/domain/types';

export const getCurrentUserUseCase =
  (userId: UserId): AppReader<PublicUser> =>
  (env) =>
    pipe(env.getUserById(userId), map(userToPublicUser));
