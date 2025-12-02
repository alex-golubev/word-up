import {
  notFound,
  insertFailed,
  validationError,
  dbError,
  aiError,
  invalidCredentials,
  emailAlreadyExists,
  tokenExpired,
  invalidToken,
  unauthorized,
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

  describe('aiError', () => {
    it('should create AiError with message and cause', () => {
      const cause = new Error('API rate limit exceeded');
      const error = aiError('Failed to generate response', cause);

      expect(error).toEqual({
        _tag: 'AiError',
        message: 'Failed to generate response',
        cause,
      });
    });
  });

  describe('invalidCredentials', () => {
    it('should create InvalidCredentials error', () => {
      const error = invalidCredentials();
      expect(error).toEqual({ _tag: 'InvalidCredentials' });
    });
  });

  describe('emailAlreadyExists', () => {
    it('should create EmailAlreadyExists error with email', () => {
      const error = emailAlreadyExists('test@example.com');
      expect(error).toEqual({ _tag: 'EmailAlreadyExists', email: 'test@example.com' });
    });
  });

  describe('tokenExpired', () => {
    it('should create TokenExpired error', () => {
      const error = tokenExpired();
      expect(error).toEqual({ _tag: 'TokenExpired' });
    });
  });

  describe('invalidToken', () => {
    it('should create InvalidToken error', () => {
      const error = invalidToken();
      expect(error).toEqual({ _tag: 'InvalidToken' });
    });
  });

  describe('unauthorized', () => {
    it('should create Unauthorized error', () => {
      const error = unauthorized();
      expect(error).toEqual({ _tag: 'Unauthorized' });
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
    [aiError('API timeout', new Error('timeout')), 'AI error: API timeout'],
    [aiError('Rate limit exceeded', null), 'AI error: Rate limit exceeded'],
    [invalidCredentials(), 'Invalid email or password'],
    [emailAlreadyExists('test@example.com'), 'Email test@example.com is already registered'],
    [tokenExpired(), 'Token has expired'],
    [invalidToken(), 'Invalid token'],
    [unauthorized(), 'Authentication required'],
  ])('should return correct message for %o', (error, expected) => {
    expect(getErrorMessage(error)).toBe(expected);
  });
});
