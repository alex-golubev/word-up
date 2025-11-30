import { initTRPC } from '@trpc/server';
import type { Context } from '~/presentation/trpc/context';
import { transformer } from '~/utils/transformer';

const t = initTRPC.context<Context>().create({
  transformer,
});

export const router = t.router;
export const publicProcedure = t.procedure;
