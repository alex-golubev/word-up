import { isRight } from 'fp-ts/Either';

import {
  createAccessToken,
  createRefreshToken,
  getRefreshTokenExpiry,
  REFRESH_TOKEN_GRACE_PERIOD_MS,
  verifyAccessToken,
  verifyRefreshToken,
} from '~/infrastructure/auth/jwt';

// Note: jose is mocked globally in jest.setup.ts

describe('jwt', () => {
  describe('createAccessToken', () => {
    it('should create an access token', async () => {
      const payload = { userId: 'test-user-id', email: 'test@example.com' };
      const result = await createAccessToken(payload)();

      expect(isRight(result)).toBe(true);
      if (isRight(result)) {
        expect(typeof result.right).toBe('string');
        expect(result.right).toBe('mocked-token');
      }
    });
  });

  describe('createRefreshToken', () => {
    it('should create a refresh token', async () => {
      const payload = { userId: 'test-user-id', email: 'test@example.com' };
      const result = await createRefreshToken(payload)();

      expect(isRight(result)).toBe(true);
      if (isRight(result)) {
        expect(typeof result.right).toBe('string');
        expect(result.right).toBe('mocked-token');
      }
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify access token and return payload', async () => {
      const result = await verifyAccessToken('some-token')();

      expect(isRight(result)).toBe(true);
      if (isRight(result)) {
        expect(result.right.userId).toBe('test-user-id');
        expect(result.right.email).toBe('test@example.com');
      }
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify refresh token and return payload', async () => {
      const result = await verifyRefreshToken('some-token')();

      expect(isRight(result)).toBe(true);
      if (isRight(result)) {
        expect(result.right.userId).toBe('test-user-id');
        expect(result.right.email).toBe('test@example.com');
      }
    });
  });

  describe('getRefreshTokenExpiry', () => {
    it('should return a date 7 days in the future', () => {
      const now = new Date();
      const expiry = getRefreshTokenExpiry();

      const diffMs = expiry.getTime() - now.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      // Should be approximately 7 days (allow small tolerance)
      expect(diffDays).toBeGreaterThanOrEqual(6.99);
      expect(diffDays).toBeLessThanOrEqual(7.01);
    });
  });

  describe('REFRESH_TOKEN_GRACE_PERIOD_MS', () => {
    it('should be 30 seconds', () => {
      expect(REFRESH_TOKEN_GRACE_PERIOD_MS).toBe(30 * 1000);
    });
  });
});
