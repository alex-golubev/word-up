import { isLeft, isRight } from 'fp-ts/Either';
import { left, right } from 'fp-ts/TaskEither';
import type { User } from '~/domain/types';
import { makeUserId, notFound } from '~/domain/types';
import { getCurrentUserUseCase } from '~/application/use-cases/get-current-user';
import { createMockEnv } from '~/test/mock-env';
import { TEST_UUID, TEST_DATE } from '~/test/fixtures';

const createTestUser = (overrides?: Partial<User>): User => ({
  id: makeUserId(TEST_UUID.user),
  email: 'test@example.com',
  passwordHash: 'hashed-password',
  name: 'Test User',
  nativeLanguage: 'en',
  createdAt: TEST_DATE,
  ...overrides,
});

describe('getCurrentUserUseCase', () => {
  const userId = makeUserId(TEST_UUID.user);

  it('should return public user data successfully', async () => {
    const user = createTestUser();

    const env = createMockEnv({
      getUserById: jest.fn().mockReturnValue(right(user)),
    });

    const result = await getCurrentUserUseCase(userId)(env)();

    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      expect(result.right.id).toBe(userId);
      expect(result.right.email).toBe('test@example.com');
      expect(result.right.name).toBe('Test User');
      expect(result.right.nativeLanguage).toBe('en');
      expect(result.right.createdAt).toBe(TEST_DATE);
    }
  });

  it('should not expose passwordHash', async () => {
    const user = createTestUser();

    const env = createMockEnv({
      getUserById: jest.fn().mockReturnValue(right(user)),
    });

    const result = await getCurrentUserUseCase(userId)(env)();

    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      expect('passwordHash' in result.right).toBe(false);
    }
  });

  it('should return error when user not found', async () => {
    const env = createMockEnv({
      getUserById: jest.fn().mockReturnValue(left(notFound('User', userId))),
    });

    const result = await getCurrentUserUseCase(userId)(env)();

    expect(isLeft(result)).toBe(true);
    if (isLeft(result)) {
      expect(result.left._tag).toBe('NotFound');
    }
  });

  it('should call getUserById with correct id', async () => {
    const user = createTestUser();
    const getUserByIdMock = jest.fn().mockReturnValue(right(user));

    const env = createMockEnv({
      getUserById: getUserByIdMock,
    });

    await getCurrentUserUseCase(userId)(env)();

    expect(getUserByIdMock).toHaveBeenCalledWith(userId);
  });
});
