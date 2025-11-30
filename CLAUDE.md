# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Word-Up is a language learning application built with Next.js 16, React 19, TypeScript, and TailwindCSS 4. It uses Clean Architecture with fp-ts for functional error handling and Drizzle ORM with Neon (PostgreSQL) for persistence.

## Development Commands

```bash
npm run dev          # Start development server at http://localhost:3000
npm run build        # Create production build
npm run start        # Run production server
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript type checking
npm run format       # Auto-format with Prettier
npm run test         # Run all tests with Jest
npm run test -- path/to/file.spec.ts  # Run a single test file
```

### Database Commands (Drizzle)

```bash
npm run db:generate  # Generate migrations from schema changes
npm run db:migrate   # Run pending migrations
npm run db:push      # Push schema directly to database (dev only)
npm run db:studio    # Open Drizzle Studio GUI
```

## Architecture

The codebase follows **Clean Architecture** with three distinct layers:

### Domain Layer (`src/domain/`)

Pure business logic with no external dependencies.

- **`types/`** - Branded types using Zod schemas (e.g., `UserId`, `ConversationId`, `MessageId`)
- **`functions/`** - Pure domain functions (e.g., `messageCreate`, `messageTakeLast`)

### Application Layer (`src/application/`)

Use cases that orchestrate domain logic with effects.

- **`use-cases/`** - Business operations returning `TaskEither<Error, T>` for typed async error handling
- Dependencies are injected as parameters for testability

### Infrastructure Layer (`src/infrastructure/`)

External concerns (database, APIs).

- **`db/schemas/`** - Drizzle ORM table definitions
- **`db/client.ts`** - Database connection (Neon serverless)
- **`effects/`** - Side-effectful operations wrapped in `TaskEither`

## Key Patterns

### Branded Types with Zod

Domain IDs use Zod's `.brand()` for type safety:

```typescript
const UserIdSchema = z.guid({ error: 'Invalid UserId' }).brand('UserId');
export type UserId = z.infer<typeof UserIdSchema>;
export const makeUserId = (id: string): UserId => UserIdSchema.parse(id);
```

### Typed Errors with Discriminated Union

All errors use `AppError` discriminated union (`src/domain/errors.ts`):

```typescript
type AppError =
  | { readonly _tag: 'NotFound'; readonly entity: string; readonly id: string }
  | { readonly _tag: 'InsertFailed'; readonly entity: string; readonly cause?: unknown }
  | { readonly _tag: 'ValidationError'; readonly message: string }
  | { readonly _tag: 'DbError'; readonly cause: unknown };
```

### fp-ts TaskEither for Async Error Handling

All async operations use `TaskEither<AppError, T>` instead of try/catch. Use named imports:

```typescript
import { pipe } from 'fp-ts/function';
import { chain, map } from 'fp-ts/TaskEither';

export const sendMessageUseCase = (params, deps): TaskEither<AppError, Message> =>
  pipe(
    deps.getConversation(params.conversationId),
    map((conv) => messageCreate({ conversationId: conv.id, role: params.role, content: params.content })),
    chain((msg) => deps.saveMessage(msg))
  );
```

### Dependency Injection in Use Cases

Use cases receive dependencies as a second parameter for easy mocking:

```typescript
type SendMessageDeps = {
  readonly getConversation: (id: ConversationId) => TaskEither<AppError, Conversation>;
  readonly saveMessage: (message: Message) => TaskEither<AppError, Message>;
};
```

### tRPC Error Handling

Use `safeHandler` wrapper for mutations/queries (`src/presentation/trpc/errors.ts`):

```typescript
import { safeHandler } from '~/presentation/trpc/errors';

export const chatRouter = router({
  createConversation: publicProcedure
    .input(CreateConversationInputSchema)
    .mutation(
      safeHandler(({ ctx, input }) =>
        createConversationUseCase(input, { saveConversation: createConversationEffects(ctx.db).saveConversation })
      )
    ),
});
```

### Test Fixtures

Use `src/test/fixtures.ts` for consistent test data:

```typescript
import { createTestMessage, createTestConversation, TEST_CONVERSATION_ID } from '~/test/fixtures';
```

## TypeScript Configuration

- Path alias: `~/*` → `./src/*`
- Strict mode enabled
- Use `import type` for type-only imports

## Code Style

- Single quotes, semicolons required
- 100 character line width
- Trailing commas (ES5 style)
- Requires newline at end of files
- Use named imports from fp-ts: `import { isLeft, isRight } from 'fp-ts/Either'` (not `import * as E`)
- Use `import { randomUUID } from 'node:crypto'` instead of `crypto.randomUUID()`
