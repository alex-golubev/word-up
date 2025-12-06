import { randomUUID } from 'node:crypto';

import { makeConversationId, makeMessageId, makeScenarioId, makeUserId } from '~/domain/types';

import type { Conversation, Message, Scenario } from '~/domain/types';

export const TEST_UUID = {
  user: '11111111-1111-1111-1111-111111111111',
  conversation: '22222222-2222-2222-2222-222222222222',
  message: '33333333-3333-3333-3333-333333333333',
  scenario: 'test-scenario',
} as const;

export const INVALID_UUIDS = [
  '',
  'not-a-uuid',
  '11111111-1111-1111-1111',
  '11111111-1111-1111-1111-1111111111111',
  '11111111_1111_1111_1111_111111111111',
  'g1111111-1111-1111-1111-111111111111',
] as const;

export const TEST_USER_ID = makeUserId(TEST_UUID.user);
export const TEST_CONVERSATION_ID = makeConversationId(TEST_UUID.conversation);
export const TEST_MESSAGE_ID = makeMessageId(TEST_UUID.message);
export const TEST_SCENARIO_ID = makeScenarioId(TEST_UUID.scenario);

export const TEST_DATE = new Date('2024-01-01');

export const createTestMessage = (overrides?: Partial<Message>): Message => ({
  id: makeMessageId(randomUUID()),
  conversationId: TEST_CONVERSATION_ID,
  role: 'user',
  content: 'test content',
  createdAt: TEST_DATE,
  ...overrides,
});

export const createTestConversation = (overrides?: Partial<Conversation>): Conversation => ({
  id: TEST_CONVERSATION_ID,
  userId: TEST_USER_ID,
  scenarioId: TEST_SCENARIO_ID,
  targetLanguage: 'en',
  userLevel: 'beginner',
  messages: [],
  createdAt: TEST_DATE,
  updatedAt: TEST_DATE,
  ...overrides,
});

export const createTestScenario = (overrides?: Partial<Scenario>): Scenario => ({
  id: TEST_SCENARIO_ID,
  title: 'Test Scenario',
  description: 'A test scenario for unit tests',
  role: 'You are a helpful assistant',
  userLevel: 'beginner',
  targetLanguage: 'en',
  startingMessage: 'Hello! How can I help you?',
  vocabulary: ['hello', 'help', 'thanks'],
  ...overrides,
});

// DB row helpers — raw data without branded types
export const createTestMessageRow = (overrides?: Record<string, unknown>) => ({
  id: TEST_UUID.message,
  conversationId: TEST_UUID.conversation,
  role: 'user' as const,
  content: 'test content',
  createdAt: TEST_DATE,
  ...overrides,
});

export const createTestUserRow = (overrides?: Record<string, unknown>) => ({
  id: TEST_UUID.user,
  email: 'test@example.com',
  passwordHash: 'hashed-password',
  name: 'Test User',
  nativeLanguage: 'en' as const,
  createdAt: TEST_DATE,
  ...overrides,
});

export const createTestRefreshTokenRow = (overrides?: Record<string, unknown>) => ({
  id: 'token-id',
  userId: TEST_UUID.user,
  token: 'test-refresh-token',
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  createdAt: TEST_DATE,
  usedAt: null,
  replacementToken: null,
  ...overrides,
});

export const createTestConversationRow = (overrides?: Record<string, unknown>) => ({
  id: TEST_UUID.conversation,
  userId: TEST_UUID.user,
  scenarioId: TEST_UUID.scenario,
  targetLanguage: 'en' as const,
  userLevel: 'beginner' as const,
  createdAt: TEST_DATE,
  updatedAt: TEST_DATE,
  ...overrides,
});

// Mock DB client factory
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockFn = jest.Mock<any, any>;

export const createMockDB = () => {
  const mockReturning: MockFn = jest.fn();
  const mockValues = jest.fn(() => ({ returning: mockReturning }));
  const mockInsert = jest.fn(() => ({ values: mockValues }));

  const mockOrderBy: MockFn = jest.fn();
  const mockWhere: MockFn = jest.fn(() => ({ orderBy: mockOrderBy, returning: mockReturning }));
  const mockFrom = jest.fn(() => ({ where: mockWhere }));
  const mockSelect = jest.fn(() => ({ from: mockFrom }));

  // For update operations
  const mockSet = jest.fn(() => ({ where: mockWhere }));
  const mockUpdate = jest.fn(() => ({ set: mockSet }));

  // For delete operations
  const mockDelete = jest.fn(() => ({ where: mockWhere }));

  return {
    insert: mockInsert,
    select: mockSelect,
    update: mockUpdate,
    delete: mockDelete,
    _mocks: {
      mockReturning,
      mockValues,
      mockInsert,
      mockOrderBy,
      mockWhere,
      mockFrom,
      mockSelect,
      mockSet,
      mockUpdate,
      mockDelete,
    },
  };
};
