import {
  notFound,
  insertFailed,
  validationError,
  dbError,
  getErrorMessage,
} from '~/domain/errors';

describe('error constructors', () => {
  describe('notFound', () => {
    it('should create NotFound error with correct tag and fields', () => {
      const error = notFound('User', '123');

      expect(error).toEqual({
        _tag: 'NotFound',
        entity: 'User',
        id: '123',
      });
    });
  });

  describe('insertFailed', () => {
    it('should create InsertFailed error without cause', () => {
      const error = insertFailed('Message');

      expect(error).toEqual({
        _tag: 'InsertFailed',
        entity: 'Message',
        cause: undefined,
      });
    });

    it('should create InsertFailed error with cause', () => {
      const cause = new Error('DB constraint violation');
      const error = insertFailed('Message', cause);

      expect(error).toEqual({
        _tag: 'InsertFailed',
        entity: 'Message',
        cause,
      });
    });
  });

  describe('validationError', () => {
    it('should create ValidationError with message', () => {
      const error = validationError('Invalid email format');

      expect(error).toEqual({
        _tag: 'ValidationError',
        message: 'Invalid email format',
      });
    });
  });

  describe('dbError', () => {
    it('should create DbError with cause', () => {
      const cause = new Error('Connection timeout');
      const error = dbError(cause);

      expect(error).toEqual({
        _tag: 'DbError',
        cause,
      });
    });
  });
});

describe('getErrorMessage', () => {
  it.each([
    [notFound('User', '123'), 'User with id 123 not found'],
    [notFound('Conversation', 'abc-def'), 'Conversation with id abc-def not found'],
    [insertFailed('Message'), 'Failed to insert Message'],
    [insertFailed('Conversation', new Error('constraint')), 'Failed to insert Conversation'],
    [validationError('Invalid input'), 'Invalid input'],
    [validationError('Email is required'), 'Email is required'],
    [dbError(new Error('connection failed')), 'Database operation failed'],
    [dbError('string error'), 'Database operation failed'],
  ])('should return correct message for %o', (error, expected) => {
    expect(getErrorMessage(error)).toBe(expected);
  });
});