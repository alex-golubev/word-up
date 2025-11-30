import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '~/presentation/trpc/routers';

export const trpc = createTRPCReact<AppRouter>();
