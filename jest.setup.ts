import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'util';

// Polyfill for TextEncoder/TextDecoder (needed for jose)
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as typeof global.TextDecoder;

// Mock ESM-only libraries that don't play well with Jest
jest.mock('jose', () => ({
  SignJWT: jest.fn().mockImplementation(() => ({
    setProtectedHeader: jest.fn().mockReturnThis(),
    setIssuedAt: jest.fn().mockReturnThis(),
    setExpirationTime: jest.fn().mockReturnThis(),
    sign: jest.fn().mockResolvedValue('mocked-token'),
  })),
  jwtVerify: jest.fn().mockResolvedValue({
    payload: { userId: 'test-user-id', email: 'test@example.com' },
  }),
}));

jest.mock('@vercel/analytics/next', () => ({
  Analytics: () => null,
}));

jest.mock('@vercel/speed-insights/next', () => ({
  SpeedInsights: () => null,
}));
