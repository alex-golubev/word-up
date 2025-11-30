import { render, screen } from '@testing-library/react';

jest.mock('~/utils/transformer', () => ({
  transformer: {},
}));

jest.mock('@trpc/client', () => ({
  httpBatchLink: jest.fn(() => ({})),
}));

jest.mock('~/presentation/hooks/trpc', () => ({
  trpc: {
    createClient: jest.fn(() => ({})),
    Provider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  },
}));

import { TrpcProvider } from './TrpcProvider';
import { trpc } from '~/presentation/hooks/trpc';
import { httpBatchLink } from '@trpc/client';

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

  it('should create trpc client with httpBatchLink', () => {
    render(
      <TrpcProvider>
        <div>Content</div>
      </TrpcProvider>
    );

    expect(httpBatchLink).toHaveBeenCalledWith({
      url: '/api/trpc',
      transformer: {},
    });
    expect(trpc.createClient).toHaveBeenCalled();
  });
});
