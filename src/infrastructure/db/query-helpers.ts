import { sequenceArray } from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';
import { chain, fromEither, left, map, right, tryCatch } from 'fp-ts/TaskEither';

import { dbError, insertFailed, notFound } from '~/domain/types';

import type { Either } from 'fp-ts/Either';
import type { TaskEither } from 'fp-ts/TaskEither';

import type { AppError } from '~/domain/types';

/**
 * Executes a query that expects exactly one result.
 * Returns notFound error if no rows returned.
 * mapRow returns Too to safely handle validation errors.
 */
export const queryOne = <TRow, TResult>(
  query: () => Promise<TRow[]>,
  mapRow: (row: TRow) => Either<AppError, TResult>,
  entityName: string,
  entityId: string
): TaskEither<AppError, TResult> =>
  pipe(
    tryCatch(query, dbError),
    chain(([row]) => (row ? fromEither(mapRow(row)) : left(notFound(entityName, entityId))))
  );

/**
 * Executes a query that may return zero or one result.
 * Returns null if no rows are returned.
 * mapRow returns Too to safely handle validation errors.
 */
export const queryOneOptional = <TRow, TResult>(
  query: () => Promise<TRow[]>,
  mapRow: (row: TRow) => Either<AppError, TResult>
): TaskEither<AppError, TResult | null> =>
  pipe(
    tryCatch(query, dbError),
    chain(([row]) =>
      row
        ? pipe(
            fromEither(mapRow(row)),
            map((r): TResult | null => r)
          )
        : right(null)
    )
  );

/**
 * Executes an insert query that expects one result.
 * Returns insertFailed error if no rows returned.
 * mapRow returns Too to safely handle validation errors.
 */
export const insertOne = <TRow, TResult>(
  query: () => Promise<TRow[]>,
  mapRow: (row: TRow) => Either<AppError, TResult>,
  entityName: string
): TaskEither<AppError, TResult> =>
  pipe(
    tryCatch(query, dbError),
    chain(([row]) => (row ? fromEither(mapRow(row)) : left(insertFailed(entityName))))
  );

/**
 * Executes an update query that expects one result.
 * Returns a notFound error if no rows are updated.
 * mapRow returns Too to safely handle validation errors.
 */
export const updateOne = <TRow, TResult>(
  query: () => Promise<TRow[]>,
  mapRow: (row: TRow) => Either<AppError, TResult>,
  entityName: string,
  entityId: string
): TaskEither<AppError, TResult> =>
  pipe(
    tryCatch(query, dbError),
    chain(([row]) => (row ? fromEither(mapRow(row)) : left(notFound(entityName, entityId))))
  );

/**
 * Executes a query that returns multiple results.
 * mapRow returns Too to safely handle validation errors.
 */
export const queryMany = <TRow, TResult>(
  query: () => Promise<TRow[]>,
  mapRow: (row: TRow) => Either<AppError, TResult>
): TaskEither<AppError, readonly TResult[]> =>
  pipe(
    tryCatch(query, dbError),
    chain((rows) => fromEither(pipe(rows.map(mapRow), sequenceArray)))
  );

/**
 * Executes a delete query. Always succeeds (even if no rows are deleted).
 */
export const deleteMany = (query: () => Promise<unknown>): TaskEither<AppError, void> =>
  pipe(
    tryCatch(query, dbError),
    map(() => undefined)
  );
