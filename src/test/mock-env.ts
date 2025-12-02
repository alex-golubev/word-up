import { right } from 'fp-ts/TaskEither';
import type { AppEnv } from '~/application/env';

export const createMockEnv = (overrides: Partial<AppEnv> = {}): AppEnv => ({
  // Conversation & Message
  getConversation: jest.fn().mockReturnValue(right(null)),
  getMessagesByConversation: jest.fn().mockReturnValue(right([])),
  saveConversation: jest.fn().mockReturnValue(right(null)),
  saveMessage: jest.fn().mockReturnValue(right(null)),
  generateChatCompletion: jest.fn().mockReturnValue(right({ content: '' })),

  // User
  getUserById: jest.fn().mockReturnValue(right(null)),
  getUserByEmail: jest.fn().mockReturnValue(right(null)),
  createUser: jest.fn().mockReturnValue(right(null)),
  updateUser: jest.fn().mockReturnValue(right(null)),

  // Refresh Token
  saveRefreshToken: jest.fn().mockReturnValue(right(null)),
  getRefreshToken: jest.fn().mockReturnValue(right(null)),
  deleteRefreshToken: jest.fn().mockReturnValue(right(undefined)),
  deleteAllUserTokens: jest.fn().mockReturnValue(right(undefined)),
  tryMarkTokenAsUsed: jest.fn().mockReturnValue(right({ marked: true, record: null })),

  ...overrides,
});
