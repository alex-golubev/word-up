import type { ReaderTaskEither } from 'fp-ts/ReaderTaskEither';

import type { AppEnv } from '~/application/env';
import type { AppError } from '~/domain/types';

export type AppReader<A> = ReaderTaskEither<AppEnv, AppError, A>;

export { ask, asks, fromTaskEither } from 'fp-ts/ReaderTaskEither';
