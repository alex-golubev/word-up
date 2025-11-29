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

### fp-ts TaskEither for Async Error Handling
All async operations use `TaskEither<Error, T>` instead of try/catch:
```typescript
import { pipe } from 'fp-ts/function';
import { chain, map } from 'fp-ts/TaskEither';

export const sendMessageUseCase = (params, deps): TaskEither<Error, Message> =>
  pipe(
    deps.getConversation(params.conversationId),
    map((conv) => messageCreate(conv.id, params.role, params.content)),
    chain((msg) => deps.saveMessage(msg))
  );
```

### Dependency Injection in Use Cases
Use cases receive dependencies as a second parameter for easy mocking:
```typescript
type SendMessageDeps = {
  readonly getConversation: (id: ConversationId) => TaskEither<Error, Conversation>;
  readonly saveMessage: (message: Message) => TaskEither<Error, Message>;
};
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
