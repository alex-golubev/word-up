import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '~/presentation/trpc/routers';
import { createContext } from '~/presentation/trpc/context';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext,
  });

// noinspection JSUnusedGlobalSymbols
export { handler as GET, handler as POST };
