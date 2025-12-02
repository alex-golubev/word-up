export type AppError =
  | { readonly _tag: 'NotFound'; readonly entity: string; readonly id: string }
  | { readonly _tag: 'InsertFailed'; readonly entity: string; readonly cause?: unknown }
  | { readonly _tag: 'ValidationError'; readonly message: string }
  | { readonly _tag: 'DbError'; readonly cause: unknown }
  | { readonly _tag: 'AiError'; readonly message: string; readonly cause?: unknown }
  // Auth errors:
  | { readonly _tag: 'InvalidCredentials' }
  | { readonly _tag: 'EmailAlreadyExists'; readonly email: string }
  | { readonly _tag: 'TokenExpired' }
  | { readonly _tag: 'InvalidToken' }
  | { readonly _tag: 'Unauthorized' };

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

export const aiError = (message: string, cause: unknown): AppError => ({
  _tag: 'AiError',
  message,
  cause,
});

// Auth error constructors
export const invalidCredentials = (): AppError => ({
  _tag: 'InvalidCredentials',
});

export const emailAlreadyExists = (email: string): AppError => ({
  _tag: 'EmailAlreadyExists',
  email,
});

export const tokenExpired = (): AppError => ({
  _tag: 'TokenExpired',
});

export const invalidToken = (): AppError => ({
  _tag: 'InvalidToken',
});

export const unauthorized = (): AppError => ({
  _tag: 'Unauthorized',
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
    case 'AiError':
      return `AI error: ${error.message}`;
    // Auth errors:
    case 'InvalidCredentials':
      return 'Invalid email or password';
    case 'EmailAlreadyExists':
      return `Email ${error.email} is already registered`;
    case 'TokenExpired':
      return 'Token has expired';
    case 'InvalidToken':
      return 'Invalid token';
    case 'Unauthorized':
      return 'Authentication required';
  }
};
