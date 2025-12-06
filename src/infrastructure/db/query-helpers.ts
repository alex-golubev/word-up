import { pipe } from 'fp-ts/function';
import { chain, left, map, right, tryCatch } from 'fp-ts/TaskEither';

import { dbError, insertFailed, notFound } from '~/domain/types';

import type { TaskEither } from 'fp-ts/TaskEither';

import type { AppError } from '~/domain/types';

/**
 * Executes a query that expects exactly one result.
 * Returns notFound error if no rows returned.
 */
export const queryOne = <TRow, TResult>(
  query: () => Promise<TRow[]>,
  mapRow: (row: TRow) => TResult,
  entityName: string,
  entityId: string
): TaskEither<AppError, TResult> =>
  pipe(
    tryCatch(query, dbError),
    chain(([row]) => (row ? right(mapRow(row)) : left(notFound(entityName, entityId))))
  );

/**
 * Executes a query that may return zero or one result.
 * Returns null if no rows returned.
 */
export const queryOneOptional = <TRow, TResult>(
  query: () => Promise<TRow[]>,
  mapRow: (row: TRow) => TResult
): TaskEither<AppError, TResult | null> =>
  pipe(
    tryCatch(query, dbError),
    chain(([row]) => right(row ? mapRow(row) : null))
  );

/**
 * Executes an insert query that expects one result.
 * Returns insertFailed error if no rows returned.
 */
export const insertOne = <TRow, TResult>(
  query: () => Promise<TRow[]>,
  mapRow: (row: TRow) => TResult,
  entityName: string
): TaskEither<AppError, TResult> =>
  pipe(
    tryCatch(query, dbError),
    chain(([row]) => (row ? right(mapRow(row)) : left(insertFailed(entityName))))
  );

/**
 * Executes an update query that expects one result.
 * Returns notFound error if no rows updated.
 */
export const updateOne = <TRow, TResult>(
  query: () => Promise<TRow[]>,
  mapRow: (row: TRow) => TResult,
  entityName: string,
  entityId: string
): TaskEither<AppError, TResult> =>
  pipe(
    tryCatch(query, dbError),
    chain(([row]) => (row ? right(mapRow(row)) : left(notFound(entityName, entityId))))
  );

/**
 * Executes a query that returns multiple results.
 */
export const queryMany = <TRow, TResult>(
  query: () => Promise<TRow[]>,
  mapRow: (row: TRow) => TResult
): TaskEither<AppError, readonly TResult[]> =>
  pipe(
    tryCatch(query, dbError),
    map((rows) => rows.map(mapRow))
  );

/**
 * Executes a delete query. Always succeeds (even if no rows deleted).
 */
export const deleteMany = (query: () => Promise<unknown>): TaskEither<AppError, void> =>
  pipe(
    tryCatch(query, dbError),
    map(() => undefined)
  );
