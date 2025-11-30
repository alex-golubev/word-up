import { TRPCError } from '@trpc/server';
import { isLeft } from 'fp-ts/Either';
import { getErrorMessage } from '~/domain/types';
import type { TaskEither } from 'fp-ts/TaskEither';
import type { AppError } from '~/domain/types';
import type { Context } from '~/presentation/trpc/context';

export const appErrorToTRPC = (error: AppError): TRPCError => {
  switch (error._tag) {
    case 'NotFound':
      return new TRPCError({ code: 'NOT_FOUND', message: getErrorMessage(error) });
    case 'ValidationError':
      return new TRPCError({ code: 'BAD_REQUEST', message: getErrorMessage(error) });
    case 'InsertFailed':
    case 'DbError':
      return new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: getErrorMessage(error) });
  }
};

export const runEffect = async <A>(te: TaskEither<AppError, A>): Promise<A> => {
  const result = await te();
  if (isLeft(result)) throw appErrorToTRPC(result.left);
  return result.right;
};

export const safeHandler =
  <I, O>(fn: (params: { ctx: Context; input: I }) => TaskEither<AppError, O>) =>
  (params: { ctx: Context; input: I }): Promise<O> =>
    runEffect(fn(params));
