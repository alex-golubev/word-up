import type { AppReader } from '~/application/reader';

export const logoutUseCase =
  (refreshToken: string): AppReader<void> =>
  (env) =>
    env.deleteRefreshToken(refreshToken);
