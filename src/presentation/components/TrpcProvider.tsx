'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchStreamLink } from '@trpc/client';

import { trpc } from '~/presentation/hooks';
import { transformer } from '~/utils/transformer';

import type { ReactNode } from 'react';

type TrpcProviderProps = {
  children: ReactNode;
};

export const TrpcProvider = ({ children }: TrpcProviderProps) => {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [httpBatchStreamLink({ url: '/api/trpc', transformer })],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
};
