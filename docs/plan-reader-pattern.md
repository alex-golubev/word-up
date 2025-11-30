# План внедрения Reader Pattern

## Текущее состояние

**Use cases (3 шт.):**

- `createConversationUseCase(params, deps)` → deps: `{ saveConversation }`
- `getConversationUseCase(id, deps)` → deps: `{ getConversation, getMessagesByConversation }`
- `sendMessageUseCase(params, deps)` → deps: `{ getConversation, saveMessage }`

**Effects (2 модуля):**

- `createConversationEffects(db)` → `{ saveConversation, getConversation }`
- `createMessageEffects(db)` → `{ saveMessage, getMessagesByConversation }`

**Router:** Вручную собирает deps для каждого вызова use case.

---

## Шаги внедрения

### Шаг 1. Создать общий тип AppEnv

Файл: `src/application/env.ts`

```typescript
import type { TaskEither } from 'fp-ts/TaskEither';
import type { AppError, Conversation, ConversationId, Message } from '~/domain/types';

export type AppEnv = {
  readonly getConversation: (id: ConversationId) => TaskEither<AppError, Conversation>;
  readonly getMessagesByConversation: (id: ConversationId) => TaskEither<AppError, readonly Message[]>;
  readonly saveConversation: (conversation: Conversation) => TaskEither<AppError, Conversation>;
  readonly saveMessage: (message: Message) => TaskEither<AppError, Message>;
};
```

### Шаг 2. Создать хелпер-типы для ReaderTaskEither

Файл: `src/application/reader.ts`

```typescript
import type { ReaderTaskEither } from 'fp-ts/ReaderTaskEither';
import type { AppError } from '~/domain/types';
import type { AppEnv } from './env';

export type AppReader<A> = ReaderTaskEither<AppEnv, AppError, A>;

// Хелпер для доступа к env
export { ask, asks } from 'fp-ts/ReaderTaskEither';
```

### Шаг 3. Рефакторинг use cases

**До:**

```typescript
export const sendMessageUseCase = (params: SendMessageParams, deps: SendMessageDeps): TaskEither<AppError, Message> =>
  pipe(
    deps.getConversation(params.conversationId)
    // ...
  );
```

**После:**

```typescript
import { pipe } from 'fp-ts/function';
import { chain, map, flatMap } from 'fp-ts/ReaderTaskEither';
import type { AppReader } from '~/application/reader';

export const sendMessageUseCase = (params: SendMessageParams): AppReader<Message> =>
  pipe(
    asks((env) => env.getConversation(params.conversationId)),
    flatMap((te) => fromTaskEither(te)),
    map((conversation) => messageCreate({ ... })),
    chain((message) => asks((env) => env.saveMessage(message))),
    flatMap((te) => fromTaskEither(te))
  );
```

**Альтернативный (более читаемый) стиль:**

```typescript
export const sendMessageUseCase = (params: SendMessageParams): AppReader<Message> =>
  (env) => pipe(
    env.getConversation(params.conversationId),
    map((conversation) => messageCreate({ ... })),
    chain((message) => env.saveMessage(message))
  );
```

### Шаг 4. Создать фабрику AppEnv

Файл: `src/infrastructure/env.ts`

```typescript
import type { DBClient } from '~/infrastructure/db/client';
import type { AppEnv } from '~/application/env';
import { createConversationEffects } from './effects/conversation.effects';
import { createMessageEffects } from './effects/message.effects';

export const createAppEnv = (db: DBClient): AppEnv => {
  const conversationEffects = createConversationEffects(db);
  const messageEffects = createMessageEffects(db);

  return {
    getConversation: conversationEffects.getConversation,
    saveConversation: conversationEffects.saveConversation,
    getMessagesByConversation: messageEffects.getMessagesByConversation,
    saveMessage: messageEffects.saveMessage,
  };
};
```

### Шаг 5. Обновить Router

**До:**

```typescript
sendMessage: publicProcedure.input(SendMessageInputSchema).mutation(
  safeHandler(({ ctx, input }) =>
    sendMessageUseCase(input, {
      getConversation: createConversationEffects(ctx.db).getConversation,
      saveMessage: createMessageEffects(ctx.db).saveMessage,
    })
  )
),
```

**После:**

```typescript
import { createAppEnv } from '~/infrastructure/env';

sendMessage: publicProcedure.input(SendMessageInputSchema).mutation(
  safeHandler(({ ctx, input }) =>
    sendMessageUseCase(input)(createAppEnv(ctx.db))
  )
),
```

### Шаг 6. Обновить тесты

**До:**

```typescript
const deps = {
  getConversation: jest.fn().mockReturnValue(right(conversation)),
  saveMessage: jest.fn().mockReturnValue(right(savedMessage)),
};
const result = await sendMessageUseCase(params, deps)();
```

**После:**

```typescript
const mockEnv: AppEnv = {
  getConversation: jest.fn().mockReturnValue(right(conversation)),
  getMessagesByConversation: jest.fn(),
  saveConversation: jest.fn(),
  saveMessage: jest.fn().mockReturnValue(right(savedMessage)),
};
const result = await sendMessageUseCase(params)(mockEnv)();
```

### Шаг 7. (Опционально) Добавить хелпер для тестов

Файл: `src/test/mock-env.ts`

```typescript
import { right } from 'fp-ts/TaskEither';
import type { AppEnv } from '~/application/env';

export const createMockEnv = (overrides: Partial<AppEnv> = {}): AppEnv => ({
  getConversation: jest.fn().mockReturnValue(right(null)),
  getMessagesByConversation: jest.fn().mockReturnValue(right([])),
  saveConversation: jest.fn().mockReturnValue(right(null)),
  saveMessage: jest.fn().mockReturnValue(right(null)),
  ...overrides,
});
```

---

## Порядок работы

1. [ ] Создать `src/application/env.ts` с типом `AppEnv`
2. [ ] Создать `src/application/reader.ts` с хелперами
3. [ ] Рефакторить `createConversationUseCase` → Reader
4. [ ] Обновить тест `create-conversation.spec.ts`
5. [ ] Рефакторить `getConversationUseCase` → Reader
6. [ ] Обновить тест `get-conversation.spec.ts`
7. [ ] Рефакторить `sendMessageUseCase` → Reader
8. [ ] Обновить тест `send-message.spec.ts`
9. [ ] Создать `src/infrastructure/env.ts` с фабрикой
10. [ ] Обновить `chat.router.ts`
11. [ ] Запустить все тесты
12. [ ] Обновить `CLAUDE.md` с новыми паттернами

---

## Преимущества после внедрения

| Аспект               | До                            | После                    |
| -------------------- | ----------------------------- | ------------------------ |
| Типы deps            | Дублируются в каждом use case | Один `AppEnv`            |
| Wiring в router      | 3-5 строк на endpoint         | 1 строка                 |
| Композиция use cases | Нужно прокидывать deps        | Автоматически через env  |
| Тесты                | Разные mock objects           | Единый `createMockEnv()` |

---

## Риски и компромиссы

- **Сложность**: Reader Pattern менее интуитивен для новых разработчиков
- **Boilerplate в тестах**: Нужно мокать весь `AppEnv`, даже если use case использует 1-2 функции
- **Миграция**: Требует обновления всех use cases и тестов одновременно

## Альтернатива: Partial Reader

Можно сохранить текущие `*Deps` типы, но добавить хелпер для router:

```typescript
// Текущие use cases остаются без изменений
// Только router получает удобную обёртку

const withEnv =
  <P, D, R>(useCase: (params: P, deps: D) => TaskEither<AppError, R>, selectDeps: (env: AppEnv) => D) =>
  (params: P) =>
  (env: AppEnv) =>
    useCase(params, selectDeps(env));
```

Это даёт часть преимуществ без полного рефакторинга.
