export type AppError =
  | { readonly _tag: 'NotFound'; readonly entity: string; readonly id: string }
  | { readonly _tag: 'InsertFailed'; readonly entity: string; readonly cause?: unknown }
  | { readonly _tag: 'ValidationError'; readonly message: string }
  | { readonly _tag: 'DbError'; readonly cause: unknown };

export const notFound = (entity: string, id: string): AppError => ({
  _tag: 'NotFound',
  entity,
  id,
});

export const insertFailed = (entity: string, cause?: unknown): AppError => ({
  _tag: 'InsertFailed',
  entity,
  cause,
});

export const validationError = (message: string): AppError => ({
  _tag: 'ValidationError',
  message,
});

export const dbError = (cause: unknown): AppError => ({
  _tag: 'DbError',
  cause,
});

export const getErrorMessage = (error: AppError): string => {
  switch (error._tag) {
    case 'NotFound':
      return `${error.entity} with id ${error.id} not found`;
    case 'InsertFailed':
      return `Failed to insert ${error.entity}`;
    case 'ValidationError':
      return error.message;
    case 'DbError':
      return 'Database operation failed';
  }
};
