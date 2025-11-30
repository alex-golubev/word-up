import { randomUUID } from 'node:crypto';
import { makeConversationId, makeMessageId, makeScenarioId, makeUserId } from '~/domain/types/common';
import { INVALID_UUIDS } from '~/test/fixtures';

const VALID_UUID = randomUUID();
const VALID_UUID_UPPERCASE = randomUUID().toUpperCase();

describe('makeUserId', () => {
  it('should create UserId from valid UUID', () => {
    const result = makeUserId(VALID_UUID);
    expect(result).toBe(VALID_UUID);
  });

  it('should accept uppercase UUID', () => {
    const result = makeUserId(VALID_UUID_UPPERCASE);
    expect(result).toBe(VALID_UUID_UPPERCASE);
  });

  it.each(INVALID_UUIDS)('should throw error for invalid UUID: "%s"', (invalidUuid) => {
    expect(() => makeUserId(invalidUuid)).toThrow('Invalid UserId');
  });
});

describe('makeConversationId', () => {
  it('should create ConversationId from valid UUID', () => {
    const result = makeConversationId(VALID_UUID);
    expect(result).toBe(VALID_UUID);
  });

  it('should accept uppercase UUID', () => {
    const result = makeConversationId(VALID_UUID_UPPERCASE);
    expect(result).toBe(VALID_UUID_UPPERCASE);
  });

  it.each(INVALID_UUIDS)('should throw error for invalid UUID: "%s"', (invalidUuid) => {
    expect(() => makeConversationId(invalidUuid)).toThrow('Invalid ConversationId');
  });
});

describe('makeMessageId', () => {
  it('should create MessageId from valid UUID', () => {
    const result = makeMessageId(VALID_UUID);
    expect(result).toBe(VALID_UUID);
  });

  it('should accept uppercase UUID', () => {
    const result = makeMessageId(VALID_UUID_UPPERCASE);
    expect(result).toBe(VALID_UUID_UPPERCASE);
  });

  it.each(INVALID_UUIDS)('should throw error for invalid UUID: "%s"', (invalidUuid) => {
    expect(() => makeMessageId(invalidUuid)).toThrow('Invalid MessageId');
  });
});

describe('makeScenarioId', () => {
  it('should create ScenarioId from any string', () => {
    const result = makeScenarioId('my-scenario');
    expect(result).toBe('my-scenario');
  });

  it('should throw error for empty string', () => {
    expect(() => makeScenarioId('')).toThrow('Invalid ScenarioId');
  });

  it('should accept UUID format', () => {
    const result = makeScenarioId(VALID_UUID);
    expect(result).toBe(VALID_UUID);
  });
});
