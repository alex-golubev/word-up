import { TRPCError } from '@trpc/server';
import { isLeft } from 'fp-ts/Either';

import { getErrorMessage } from '~/domain/types';
import type { AppError } from '~/domain/types';
import type { Context } from '~/presentation/trpc/context';

import type { TaskEither } from 'fp-ts/TaskEither';

export const appErrorToTRPC = (error: AppError): TRPCError => {
  switch (error._tag) {
    case 'NotFound':
      return new TRPCError({ code: 'NOT_FOUND', message: getErrorMessage(error) });

    case 'ValidationError':
      return new TRPCError({ code: 'BAD_REQUEST', message: getErrorMessage(error) });

    // Auth errors:
    case 'InvalidCredentials':
    case 'TokenExpired':
    case 'InvalidToken':
    case 'Unauthorized':
      return new TRPCError({ code: 'UNAUTHORIZED', message: getErrorMessage(error) });

    case 'EmailAlreadyExists':
      return new TRPCError({ code: 'CONFLICT', message: getErrorMessage(error) });

    case 'InsertFailed':
      console.error('[InsertFailed]', error.entity, error.cause);
      return new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: getErrorMessage(error) });

    case 'DbError':
      console.error('[DbError]', error.cause);
      return new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: getErrorMessage(error) });

    case 'AiError':
      console.error('[AiError]', error.message, error.cause);
      return new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: getErrorMessage(error) });
  }
};

export const runEffect = async <A>(te: TaskEither<AppError, A>): Promise<A> => {
  const result = await te();
  if (isLeft(result)) throw appErrorToTRPC(result.left);
  return result.right;
};

export const safeHandler =
  <C extends Context, I, O>(fn: (params: { ctx: C; input: I }) => TaskEither<AppError, O>) =>
  (params: { ctx: C; input: I }): Promise<O> =>
    runEffect(fn(params));
