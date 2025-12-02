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
npm run db:seed      # Seed database with test data (dev, uses .env)
npm run db:seed:prod # Seed database (prod, requires env vars set)
```

## Architecture

The codebase follows **Clean Architecture** with three distinct layers:

### Domain Layer (`src/domain/`)

Pure business logic with no external dependencies.

- **`types/`** - Branded types using Zod schemas (e.g., `UserId`, `ConversationId`, `MessageId`)
- **`functions/`** - Pure domain functions (e.g., `messageCreate`, `messageTakeLast`)

### Application Layer (`src/application/`)

Use cases that orchestrate domain logic with effects using the Reader pattern.

- **`use-cases/`** - Business operations returning `AppReader<T>` (Reader pattern with `TaskEither`)
- **`env.ts`** - `AppEnv` type defining all available dependencies
- **`reader.ts`** - Helper types for `ReaderTaskEither`

### Infrastructure Layer (`src/infrastructure/`)

External concerns (database, APIs).

- **`db/schemas/`** - Drizzle ORM table definitions
- **`db/client.ts`** - Database connection (Neon serverless)
- **`effects/`** - Side-effectful operations wrapped in `TaskEither`
- **`env.ts`** - Factory function `createAppEnv(config)` that wires all effects together

### Presentation Layer (`src/presentation/`)

User-facing concerns (tRPC API, React hooks, components).

- **`trpc/routers/`** - tRPC router definitions
- **`trpc/context.ts`** - Creates `AppEnv` and caches it for tRPC context
- **`trpc/errors.ts`** - `safeHandler` wrapper for TaskEither-to-tRPC error conversion
- **`hooks/`** - React hooks including tRPC client hook
- **`components/`** - React components (e.g., `TrpcProvider`)

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
```

### Reader Pattern for Dependencies

Use cases use the Reader pattern to access dependencies from `AppEnv`. Each use case returns an `AppReader<T>` which is a function that takes the environment and returns a `TaskEither`:

```typescript
import type { AppReader } from '~/application/reader';

export const sendMessageUseCase =
  (params: SendMessageParams): AppReader<Message> =>
  (env) =>
    pipe(
      env.getConversation(params.conversationId),
      map((conv) => messageCreate({ conversationId: conv.id, role: params.role, content: params.content })),
      chain((msg) => env.saveMessage(msg))
    );
```

The `AppEnv` type defines all available dependencies (`src/application/env.ts`), including conversation, user, and auth token operations.

### Parallel Operations with fp-ts

Use `sequenceS(ApplyPar)` for parallel `TaskEither` execution:

```typescript
import { sequenceS } from 'fp-ts/Apply';
import { ApplyPar, tryCatch } from 'fp-ts/TaskEither';

// Run in parallel
sequenceS(ApplyPar)({
  accessToken: tryCatch(() => createAccessToken(payload), dbError),
  refreshToken: tryCatch(() => createRefreshToken(payload), dbError),
})
```

### tRPC Error Handling

Use `safeHandler` wrapper for mutations/queries (`src/presentation/trpc/errors.ts`). The `AppEnv` is created once in `context.ts` and accessed via `ctx.env`:

```typescript
import { safeHandler } from '~/presentation/trpc/errors';

export const chatRouter = router({
  // Public route
  createConversation: publicProcedure
    .input(CreateConversationInputSchema)
    .mutation(safeHandler(({ ctx, input }) => createConversationUseCase(input)(ctx.env))),

  // Protected route (requires auth)
  me: protectedProcedure
    .query(safeHandler(({ ctx }) => getCurrentUserUseCase(ctx.userId)(ctx.env))),
});
```

### Authentication

Auth uses HTTP-only cookies with JWT tokens (`src/infrastructure/auth/`):

- `createAccessToken` / `createRefreshToken` - JWT creation
- `setAuthCookies` / `clearAuthCookies` - Cookie management
- `protectedProcedure` - tRPC middleware that validates tokens and auto-refreshes

### Test Fixtures

Use `src/test/fixtures.ts` for consistent test data:

```typescript
import { createTestMessage, createTestConversation, TEST_CONVERSATION_ID } from '~/test/fixtures';
```

### Testing Use Cases with Reader Pattern

Use `createMockEnv` to create a mock environment for testing use cases:

```typescript
import { createMockEnv } from '~/test/mock-env';
import { right } from 'fp-ts/TaskEither';

const env = createMockEnv({
  getConversation: jest.fn().mockReturnValue(right(conversation)),
  saveMessage: jest.fn().mockReturnValue(right(savedMessage)),
});

const result = await sendMessageUseCase(params)(env)();
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
