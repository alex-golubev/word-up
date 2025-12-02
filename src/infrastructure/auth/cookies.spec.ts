const mockCookieStore = {
  set: jest.fn(),
  get: jest.fn(),
  delete: jest.fn(),
};

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => Promise.resolve(mockCookieStore)),
}));

import { setAuthCookies, getAuthCookies, clearAuthCookies } from './cookies';

describe('cookies', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('setAuthCookies', () => {
    it('should set access and refresh token cookies with correct options', async () => {
      await setAuthCookies('access-token-123', 'refresh-token-456');

      expect(mockCookieStore.set).toHaveBeenCalledTimes(2);
      expect(mockCookieStore.set).toHaveBeenCalledWith('access_token', 'access-token-123', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: 15 * 60,
      });
      expect(mockCookieStore.set).toHaveBeenCalledWith('refresh_token', 'refresh-token-456', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
      });
    });
  });

  describe('getAuthCookies', () => {
    it('should return tokens when cookies exist', async () => {
      mockCookieStore.get.mockImplementation((name: string) => {
        if (name === 'access_token') return { value: 'access-123' };
        if (name === 'refresh_token') return { value: 'refresh-456' };
        return undefined;
      });

      const result = await getAuthCookies();

      expect(result).toEqual({
        accessToken: 'access-123',
        refreshToken: 'refresh-456',
      });
    });

    it('should return null for missing cookies', async () => {
      mockCookieStore.get.mockReturnValue(undefined);

      const result = await getAuthCookies();

      expect(result).toEqual({
        accessToken: null,
        refreshToken: null,
      });
    });
  });

  describe('clearAuthCookies', () => {
    it('should delete both token cookies', async () => {
      await clearAuthCookies();

      expect(mockCookieStore.delete).toHaveBeenCalledTimes(2);
      expect(mockCookieStore.delete).toHaveBeenCalledWith('access_token');
      expect(mockCookieStore.delete).toHaveBeenCalledWith('refresh_token');
    });
  });
});
