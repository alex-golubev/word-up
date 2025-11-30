import type { ReaderTaskEither } from 'fp-ts/ReaderTaskEither';
import type { AppError } from '~/domain/types';
import type { AppEnv } from './env';

export type AppReader<A> = ReaderTaskEither<AppEnv, AppError, A>;

export { ask, asks, fromTaskEither } from 'fp-ts/ReaderTaskEither';
