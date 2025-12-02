import { isLeft, isRight } from 'fp-ts/Either';
import { left, right } from 'fp-ts/TaskEither';
import { dbError } from '~/domain/types';
import { logoutUseCase } from '~/application/use-cases/logout';
import { createMockEnv } from '~/test/mock-env';

describe('logoutUseCase', () => {
  const refreshToken = 'test-refresh-token';

  it('should delete refresh token successfully', async () => {
    const deleteRefreshTokenMock = jest.fn().mockReturnValue(right(undefined));

    const env = createMockEnv({
      deleteRefreshToken: deleteRefreshTokenMock,
    });

    const result = await logoutUseCase(refreshToken)(env)();

    expect(isRight(result)).toBe(true);
    expect(deleteRefreshTokenMock).toHaveBeenCalledWith(refreshToken);
  });

  it('should return error when deleteRefreshToken fails', async () => {
    const env = createMockEnv({
      deleteRefreshToken: jest.fn().mockReturnValue(left(dbError(new Error('DB error')))),
    });

    const result = await logoutUseCase(refreshToken)(env)();

    expect(isLeft(result)).toBe(true);
    if (isLeft(result)) {
      expect(result.left._tag).toBe('DbError');
    }
  });
});
