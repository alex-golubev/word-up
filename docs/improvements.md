# Improvements

## 1. Test Coverage for Presentation Layer

`chat.router.ts`, `errors.ts`, `trpc.ts` have 0% coverage. Add integration tests for tRPC routers.

```typescript
// Example: chat.router.spec.ts
import { createCaller } from '~/presentation/trpc/routers/chat.router';

describe('chatRouter', () => {
  it('should create conversation', async () => {
    const caller = createCaller({ db: mockDb });
    const result = await caller.createConversation({ ... });
    expect(result.id).toBeDefined();
  });
});
```

## 2. Unit Tests for Error Utilities

`getErrorMessage` in `errors.ts` is partially uncovered (lines 20-22, 30-40).

```typescript
// errors.spec.ts
describe('getErrorMessage', () => {
  it.each([
    [notFound('User', '123'), 'User with id 123 not found'],
    [insertFailed('Message'), 'Failed to insert Message'],
    [dbError(new Error('connection failed')), 'Database error'],
    [validationError('Invalid input'), 'Invalid input'],
  ])('should return correct message for %o', (error, expected) => {
    expect(getErrorMessage(error)).toBe(expected);
  });
});
```

## 3. Validation at Use Case Level

Currently validation happens only at tRPC input level. If use cases are called directly with invalid data, errors won't occur until database write.

Options:

- **A)** Parse branded types inside use cases (defensive)
- **B)** Keep validation at boundaries only (current approach, simpler)

If choosing (A):

```typescript
export const sendMessageUseCase = (params: SendMessageInput, deps: SendMessageDeps) =>
  pipe(
    fromEither(MessageContentSchema.safeParse(params.content)),
    chain(() => deps.getConversation(params.conversationId))
    // ...
  );
```

## 4. Consider Reader Pattern for Dependencies

Current approach passes dependencies explicitly to each use case. As the app grows, consider `ReaderTaskEither` for cleaner dependency injection:

```typescript
import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither';

type Env = {
  getConversation: (id: ConversationId) => TaskEither<AppError, Conversation>;
  saveMessage: (msg: Message) => TaskEither<AppError, Message>;
};

export const sendMessageUseCase =
  (params: SendMessageInput): ReaderTaskEither<Env, AppError, Message> =>
  (env) =>
    pipe(
      env.getConversation(params.conversationId)
      // ...
    );
```

## 5. Error Logging

Add logging for `DbError` before converting to TRPCError. Currently errors are swallowed:

```typescript
// errors.ts
export const appErrorToTRPC = (error: AppError): TRPCError => {
  if (error._tag === 'DbError') {
    console.error('Database error:', error.cause); // or use proper logger
  }
  // ...
};
```
