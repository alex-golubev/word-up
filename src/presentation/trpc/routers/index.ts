import { router } from '~/presentation/trpc/trpc';
import { chatRouter } from '~/presentation/trpc/routers/chat.router';
import { authRouter } from '~/presentation/trpc/routers/auth.router';

export const appRouter = router({
  chat: chatRouter,
  auth: authRouter,
});

export type AppRouter = typeof appRouter;
