import { router } from '~/presentation/trpc/trpc';
import { chatRouter } from '~/presentation/trpc/routers/chat.router';

export const appRouter = router({
  chat: chatRouter,
});

export type AppRouter = typeof appRouter;
