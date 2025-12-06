import { fetchRequestHandler } from '@trpc/server/adapters/fetch';

import { createContext } from '~/presentation/trpc/context';
import { appRouter } from '~/presentation/trpc/routers';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext,
  });

// noinspection JSUnusedGlobalSymbols
export { handler as GET, handler as POST };
