import { hashPassword, verifyPassword } from '~/infrastructure/auth/password';

describe('password', () => {
  describe('hashPassword', () => {
    it('should hash password', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);

      expect(typeof hash).toBe('string');
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should create different hashes for same password', async () => {
      const password = 'testPassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyPassword', () => {
    it('should return true for correct password', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);

      const isValid = await verifyPassword('wrongPassword', hash);

      expect(isValid).toBe(false);
    });
  });
});
