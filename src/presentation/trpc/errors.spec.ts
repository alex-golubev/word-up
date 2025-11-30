import { TRPCError } from '@trpc/server';
import { left, right } from 'fp-ts/TaskEither';
import { notFound, insertFailed, validationError, dbError } from '~/domain/types';
import { appErrorToTRPC, runEffect, safeHandler } from '~/presentation/trpc/errors';
import type { Context } from '~/presentation/trpc/context';

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

  it('should convert InsertFailed to INTERNAL_SERVER_ERROR TRPCError', () => {
    const error = insertFailed('Message');
    const trpcError = appErrorToTRPC(error);

    expect(trpcError).toBeInstanceOf(TRPCError);
    expect(trpcError.code).toBe('INTERNAL_SERVER_ERROR');
    expect(trpcError.message).toBe('Failed to insert Message');
  });

  it('should convert DbError to INTERNAL_SERVER_ERROR TRPCError', () => {
    const error = dbError(new Error('Connection failed'));
    const trpcError = appErrorToTRPC(error);

    expect(trpcError).toBeInstanceOf(TRPCError);
    expect(trpcError.code).toBe('INTERNAL_SERVER_ERROR');
    expect(trpcError.message).toBe('Database operation failed');
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
  const mockContext = { db: {} } as Context;

  it('should return result when TaskEither succeeds', async () => {
    const handler = safeHandler(({ input }) => right({ result: input.value * 2 }));

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
