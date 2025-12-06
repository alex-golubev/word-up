import { authRouter } from '~/presentation/trpc/routers/auth.router';
import { chatRouter } from '~/presentation/trpc/routers/chat.router';
import { router } from '~/presentation/trpc/trpc';

export const appRouter = router({
  chat: chatRouter,
  auth: authRouter,
});

export type AppRouter = typeof appRouter;
