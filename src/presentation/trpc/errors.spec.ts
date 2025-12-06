import { TRPCError } from '@trpc/server';
import { left, right } from 'fp-ts/TaskEither';

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
} from '~/domain/types';
import type { Context } from '~/presentation/trpc/context';
import { appErrorToTRPC, runEffect, safeHandler } from '~/presentation/trpc/errors';
import { createMockEnv } from '~/test/mock-env';

describe('appErrorToTRPC', () => {
  it('should convert NotFound to NOT_FOUND TRPCError', () => {
    const error = notFound('User', '123');
    const trpcError = appErrorToTRPC(error);

    expect(trpcError).toBeInstanceOf(TRPCError);
    expect(trpcError.code).toBe('NOT_FOUND');
    expect(trpcError.message).toBe('User with id 123 not found');
  });

  it('should convert ValidationError to BAD_REQUEST TRPCError', () => {
    const error = validationError('Invalid email format');
    const trpcError = appErrorToTRPC(error);

    expect(trpcError).toBeInstanceOf(TRPCError);
    expect(trpcError.code).toBe('BAD_REQUEST');
    expect(trpcError.message).toBe('Invalid email format');
  });

  it('should convert InsertFailed to INTERNAL_SERVER_ERROR TRPCError and log error', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const cause = new Error('Constraint violation');
    const error = insertFailed('Message', cause);

    const trpcError = appErrorToTRPC(error);

    expect(trpcError).toBeInstanceOf(TRPCError);
    expect(trpcError.code).toBe('INTERNAL_SERVER_ERROR');
    expect(trpcError.message).toBe('Failed to insert Message');
    expect(consoleErrorSpy).toHaveBeenCalledWith('[InsertFailed]', 'Message', cause);

    consoleErrorSpy.mockRestore();
  });

  it('should convert DbError to INTERNAL_SERVER_ERROR TRPCError and log error', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const cause = new Error('Connection failed');
    const error = dbError(cause);

    const trpcError = appErrorToTRPC(error);

    expect(trpcError).toBeInstanceOf(TRPCError);
    expect(trpcError.code).toBe('INTERNAL_SERVER_ERROR');
    expect(trpcError.message).toBe('Database operation failed');
    expect(consoleErrorSpy).toHaveBeenCalledWith('[DbError]', cause);

    consoleErrorSpy.mockRestore();
  });

  it('should convert AiError to INTERNAL_SERVER_ERROR TRPCError and log error', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const cause = new Error('API rate limit');
    const error = aiError('Failed to generate response', cause);

    const trpcError = appErrorToTRPC(error);

    expect(trpcError).toBeInstanceOf(TRPCError);
    expect(trpcError.code).toBe('INTERNAL_SERVER_ERROR');
    expect(trpcError.message).toBe('AI error: Failed to generate response');
    expect(consoleErrorSpy).toHaveBeenCalledWith('[AiError]', 'Failed to generate response', cause);

    consoleErrorSpy.mockRestore();
  });

  it('should convert InvalidCredentials to UNAUTHORIZED TRPCError', () => {
    const error = invalidCredentials();
    const trpcError = appErrorToTRPC(error);

    expect(trpcError).toBeInstanceOf(TRPCError);
    expect(trpcError.code).toBe('UNAUTHORIZED');
    expect(trpcError.message).toBe('Invalid email or password');
  });

  it('should convert TokenExpired to UNAUTHORIZED TRPCError', () => {
    const error = tokenExpired();
    const trpcError = appErrorToTRPC(error);

    expect(trpcError).toBeInstanceOf(TRPCError);
    expect(trpcError.code).toBe('UNAUTHORIZED');
    expect(trpcError.message).toBe('Token has expired');
  });

  it('should convert InvalidToken to UNAUTHORIZED TRPCError', () => {
    const error = invalidToken();
    const trpcError = appErrorToTRPC(error);

    expect(trpcError).toBeInstanceOf(TRPCError);
    expect(trpcError.code).toBe('UNAUTHORIZED');
    expect(trpcError.message).toBe('Invalid token');
  });

  it('should convert Unauthorized to UNAUTHORIZED TRPCError', () => {
    const error = unauthorized();
    const trpcError = appErrorToTRPC(error);

    expect(trpcError).toBeInstanceOf(TRPCError);
    expect(trpcError.code).toBe('UNAUTHORIZED');
    expect(trpcError.message).toBe('Authentication required');
  });

  it('should convert EmailAlreadyExists to CONFLICT TRPCError', () => {
    const error = emailAlreadyExists('test@example.com');
    const trpcError = appErrorToTRPC(error);

    expect(trpcError).toBeInstanceOf(TRPCError);
    expect(trpcError.code).toBe('CONFLICT');
    expect(trpcError.message).toBe('Email test@example.com is already registered');
  });
});

describe('runEffect', () => {
  it('should return right value on success', async () => {
    const te = right({ id: '123', name: 'Test' });

    const result = await runEffect(te);

    expect(result).toEqual({ id: '123', name: 'Test' });
  });

  it('should throw TRPCError on left value', async () => {
    const te = left(notFound('User', '456'));

    await expect(runEffect(te)).rejects.toThrow(TRPCError);
    await expect(runEffect(te)).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'User with id 456 not found',
    });
  });

  it('should throw correct TRPCError for different error types', async () => {
    const validationTe = left(validationError('Bad input'));

    await expect(runEffect(validationTe)).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      message: 'Bad input',
    });
  });
});

describe('safeHandler', () => {
  const mockContext: Context = {
    env: createMockEnv(),
    accessToken: null,
    refreshToken: null,
    signal: new AbortController().signal,
  };

  it('should return result when TaskEither succeeds', async () => {
    const handler = safeHandler(({ input }: { ctx: Context; input: { value: number } }) =>
      right({ result: input.value * 2 })
    );

    const result = await handler({ ctx: mockContext, input: { value: 21 } });

    expect(result).toEqual({ result: 42 });
  });

  it('should throw TRPCError when TaskEither fails', async () => {
    const handler = safeHandler(() => left(notFound('Item', '999')));

    await expect(handler({ ctx: mockContext, input: {} })).rejects.toThrow(TRPCError);
    await expect(handler({ ctx: mockContext, input: {} })).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('should pass ctx and input to handler function', async () => {
    const handlerFn = jest.fn().mockReturnValue(right('success'));
    const handler = safeHandler(handlerFn);
    const input = { testInput: true };

    await handler({ ctx: mockContext, input });

    expect(handlerFn).toHaveBeenCalledWith({ ctx: mockContext, input });
  });
});
