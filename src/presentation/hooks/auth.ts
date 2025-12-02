'use client';

import { trpc } from '~/presentation/hooks/trpc';

export const useAuth = () => {
  const utils = trpc.useUtils();

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const invalidateAuth = () => {
    void utils.auth.me.invalidate();
  };

  return {
    user: meQuery.data ?? null,
    isLoading: meQuery.isLoading,
    isAuthenticated: !!meQuery.data,
    invalidateAuth,
  };
};
