/* eslint-disable import/order */
import { render, screen } from '@testing-library/react';

jest.mock('~/utils/transformer', () => ({
  transformer: {},
}));

jest.mock('@trpc/client', () => ({
  httpBatchStreamLink: jest.fn(() => ({})),
}));

jest.mock('~/presentation/hooks', () => ({
  trpc: {
    createClient: jest.fn(() => ({})),
    Provider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  },
}));

import { httpBatchStreamLink } from '@trpc/client';

import { trpc } from '~/presentation/hooks';

import { TrpcProvider } from './TrpcProvider';

describe('TrpcProvider', () => {
  it('should render children', () => {
    render(
      <TrpcProvider>
        <div data-testid="child">Test Content</div>
      </TrpcProvider>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should create trpc client with httpBatchStreamLink', () => {
    render(
      <TrpcProvider>
        <div>Content</div>
      </TrpcProvider>
    );

    expect(httpBatchStreamLink).toHaveBeenCalledWith({
      url: '/api/trpc',
      transformer: {},
    });
    expect(trpc.createClient).toHaveBeenCalled();
  });
});
