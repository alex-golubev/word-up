import { randomUUID } from 'node:crypto';

import { isLeft, isRight } from 'fp-ts/Either';

import {
  makeConversationId,
  makeMessageId,
  makeScenarioId,
  makeUserId,
  unsafeMakeConversationId,
  unsafeMakeMessageId,
  unsafeMakeScenarioId,
  unsafeMakeUserId,
} from '~/domain/types/common';
import { INVALID_UUIDS } from '~/test/fixtures';

const VALID_UUID = randomUUID();
const VALID_UUID_UPPERCASE = randomUUID().toUpperCase();

describe('makeUserId', () => {
  it('should return Right with UserId from valid UUID', () => {
    const result = makeUserId(VALID_UUID);
    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      expect(result.right).toBe(VALID_UUID);
    }
  });

  it('should accept uppercase UUID', () => {
    const result = makeUserId(VALID_UUID_UPPERCASE);
    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      expect(result.right).toBe(VALID_UUID_UPPERCASE);
    }
  });

  it.each(INVALID_UUIDS)('should return Left for invalid UUID: "%s"', (invalidUuid) => {
    const result = makeUserId(invalidUuid);
    expect(isLeft(result)).toBe(true);
    if (isLeft(result) && result.left._tag === 'ValidationError') {
      expect(result.left.message).toContain('Invalid UserId');
    }
  });
});

describe('unsafeMakeUserId', () => {
  it('should return UserId from valid UUID', () => {
    const result = unsafeMakeUserId(VALID_UUID);
    expect(result).toBe(VALID_UUID);
  });

  it('should throw for invalid UUID', () => {
    expect(() => unsafeMakeUserId('invalid')).toThrow();
  });
});

describe('makeConversationId', () => {
  it('should return Right with ConversationId from valid UUID', () => {
    const result = makeConversationId(VALID_UUID);
    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      expect(result.right).toBe(VALID_UUID);
    }
  });

  it('should accept uppercase UUID', () => {
    const result = makeConversationId(VALID_UUID_UPPERCASE);
    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      expect(result.right).toBe(VALID_UUID_UPPERCASE);
    }
  });

  it.each(INVALID_UUIDS)('should return Left for invalid UUID: "%s"', (invalidUuid) => {
    const result = makeConversationId(invalidUuid);
    expect(isLeft(result)).toBe(true);
    if (isLeft(result) && result.left._tag === 'ValidationError') {
      expect(result.left.message).toContain('Invalid ConversationId');
    }
  });
});

describe('unsafeMakeConversationId', () => {
  it('should return ConversationId from valid UUID', () => {
    const result = unsafeMakeConversationId(VALID_UUID);
    expect(result).toBe(VALID_UUID);
  });

  it('should throw for invalid UUID', () => {
    expect(() => unsafeMakeConversationId('invalid')).toThrow();
  });
});

describe('makeMessageId', () => {
  it('should return Right with MessageId from valid UUID', () => {
    const result = makeMessageId(VALID_UUID);
    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      expect(result.right).toBe(VALID_UUID);
    }
  });

  it('should accept uppercase UUID', () => {
    const result = makeMessageId(VALID_UUID_UPPERCASE);
    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      expect(result.right).toBe(VALID_UUID_UPPERCASE);
    }
  });

  it.each(INVALID_UUIDS)('should return Left for invalid UUID: "%s"', (invalidUuid) => {
    const result = makeMessageId(invalidUuid);
    expect(isLeft(result)).toBe(true);
    if (isLeft(result) && result.left._tag === 'ValidationError') {
      expect(result.left.message).toContain('Invalid MessageId');
    }
  });
});

describe('unsafeMakeMessageId', () => {
  it('should return MessageId from valid UUID', () => {
    const result = unsafeMakeMessageId(VALID_UUID);
    expect(result).toBe(VALID_UUID);
  });

  it('should throw for invalid UUID', () => {
    expect(() => unsafeMakeMessageId('invalid')).toThrow();
  });
});

describe('makeScenarioId', () => {
  it('should return Right with ScenarioId from any non-empty string', () => {
    const result = makeScenarioId('my-scenario');
    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      expect(result.right).toBe('my-scenario');
    }
  });

  it('should return Left for empty string', () => {
    const result = makeScenarioId('');
    expect(isLeft(result)).toBe(true);
    if (isLeft(result) && result.left._tag === 'ValidationError') {
      expect(result.left.message).toContain('Invalid ScenarioId');
    }
  });

  it('should accept UUID format', () => {
    const result = makeScenarioId(VALID_UUID);
    expect(isRight(result)).toBe(true);
    if (isRight(result)) {
      expect(result.right).toBe(VALID_UUID);
    }
  });
});

describe('unsafeMakeScenarioId', () => {
  it('should return ScenarioId from valid string', () => {
    const result = unsafeMakeScenarioId('my-scenario');
    expect(result).toBe('my-scenario');
  });

  it('should throw for empty string', () => {
    expect(() => unsafeMakeScenarioId('')).toThrow();
  });
});
