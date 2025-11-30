# План: Типизированные ошибки в функциональном стиле

## Цель

Заменить `TaskEither<Error, T>` на `TaskEither<AppError, T>` с единообразной обработкой ошибок по всему приложению.

## Подход

Минималистичный тип ошибки с кодом и сообщением:

```typescript
type AppError = {
  readonly code: 'NOT_FOUND' | 'INSERT_FAILED' | 'VALIDATION' | 'DB_ERROR';
  readonly message: string;
  readonly cause?: unknown;
};
```

## Шаги реализации

### 1. Создать `src/domain/errors.ts`

```typescript
type AppError = {
  readonly code: 'NOT_FOUND' | 'INSERT_FAILED' | 'VALIDATION' | 'DB_ERROR';
  readonly message: string;
  readonly cause?: unknown;
};

const notFound = (entity: string, id: string): AppError => ({
  code: 'NOT_FOUND',
  message: `${entity} with id ${id} not found`,
});

const insertFailed = (entity: string, cause?: unknown): AppError => ({
  code: 'INSERT_FAILED',
  message: `Failed to insert ${entity}`,
  cause,
});

const validationError = (message: string): AppError => ({
  code: 'VALIDATION',
  message,
});

const dbError = (cause: unknown): AppError => ({
  code: 'DB_ERROR',
  message: 'Database operation failed',
  cause,
});
```

### 2. Обновить effects

Изменить сигнатуры с `TaskEither<Error, T>` на `TaskEither<AppError, T>`:

```typescript
// conversation.effects.ts
saveConversation: (conversation: Conversation): TaskEither<AppError, Conversation> =>
  tryCatch(
    async () => {
      const [inserted] = await db.insert(conversations).values(conversation).returning();
      if (!inserted) throw null;
      return mapRowToConversation(inserted);
    },
    (error): AppError => error === null
      ? insertFailed('Conversation')
      : dbError(error)
  ),

getConversation: (id: ConversationId): TaskEither<AppError, Conversation> =>
  tryCatch(
    async () => {
      const [row] = await db.select().from(conversations).where(eq(conversations.id, id));
      if (!row) throw null;
      return mapRowToConversation(row);
    },
    (error): AppError => error === null
      ? notFound('Conversation', id)
      : dbError(error)
  ),
```

### 3. Обновить use cases

Изменить типы зависимостей и возвращаемые значения:

```typescript
type CreateConversationDeps = {
  readonly saveConversation: (conversation: Conversation) => TaskEither<AppError, Conversation>;
};

export const createConversationUseCase = (
  params: CreateConversationParams,
  deps: CreateConversationDeps
): TaskEither<AppError, Conversation> => pipe(conversationCreate(params), deps.saveConversation);
```

### 4. Добавить маппер в presentation

```typescript
// presentation/trpc/errors.ts
import { TRPCError } from '@trpc/server';
import type { AppError } from '~/domain/errors';

const codeMap = {
  NOT_FOUND: 'NOT_FOUND',
  INSERT_FAILED: 'INTERNAL_SERVER_ERROR',
  VALIDATION: 'BAD_REQUEST',
  DB_ERROR: 'INTERNAL_SERVER_ERROR',
} as const;

export const appErrorToTRPC = (error: AppError): TRPCError =>
  new TRPCError({ code: codeMap[error.code], message: error.message });
```

### 5. Обновить роутеры

```typescript
// chat.router.ts
import * as E from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';
import { appErrorToTRPC } from '~/presentation/trpc/errors';

export const chatRouter = router({
  createConversation: publicProcedure
    .input(...)
    .mutation(async ({ ctx, input }) =>
      pipe(
        await createConversationUseCase(input, createConversationEffects(ctx.db))(),
        E.fold(
          (error) => { throw appErrorToTRPC(error); },
          (data) => data
        )
      )
    ),
});
```

### 6. Обновить тесты

- Изменить моки чтобы возвращали `AppError` вместо `Error`
- Проверять `error.code` вместо `error.message`

## Файлы для изменения

- [ ] `src/domain/errors.ts` — создать
- [ ] `src/domain/types/index.ts` — экспортировать errors
- [ ] `src/infrastructure/effects/conversation.effects.ts`
- [ ] `src/infrastructure/effects/message.effects.ts`
- [ ] `src/application/use-cases/create-conversation.ts`
- [ ] `src/application/use-cases/send-message.ts`
- [ ] `src/application/use-cases/get-conversation.ts`
- [ ] `src/presentation/trpc/errors.ts` — создать
- [ ] `src/presentation/trpc/routers/chat.router.ts`
- [ ] Тесты для effects и use cases

## Преимущества

1. **Единообразие** — все ошибки одного типа
2. **Типобезопасность** — TS знает все возможные коды ошибок
3. **Расширяемость** — легко добавить новый код ошибки
4. **Трассировка** — `cause` сохраняет оригинальную ошибку
5. **Простота** — один маппер `appErrorToTRPC` для всего presentation слоя
