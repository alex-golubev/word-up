import { right } from 'fp-ts/TaskEither';
import type { AppEnv } from '~/application/env';

export const createMockEnv = (overrides: Partial<AppEnv> = {}): AppEnv => ({
  getConversation: jest.fn().mockReturnValue(right(null)),
  getMessagesByConversation: jest.fn().mockReturnValue(right([])),
  saveConversation: jest.fn().mockReturnValue(right(null)),
  saveMessage: jest.fn().mockReturnValue(right(null)),
  ...overrides,
});
