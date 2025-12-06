import { render, screen } from '@testing-library/react';

import RootLayout from './layout';

jest.mock('next/font/google', () => ({
  Inter: () => ({ className: 'inter-font' }),
}));

jest.mock('~/presentation/components/TrpcProvider', () => ({
  TrpcProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const originalError = console.error;

beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('cannot be a child of')) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

describe('RootLayout', () => {
  it('should render children', () => {
    render(
      <RootLayout>
        <div data-testid="child">Test Content</div>
      </RootLayout>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should have correct lang attribute', () => {
    render(
      <RootLayout>
        <div>Content</div>
      </RootLayout>
    );

    const html = document.querySelector('html');
    expect(html).toHaveAttribute('lang', 'en');
  });

  it('should apply inter font class to body', () => {
    render(
      <RootLayout>
        <div>Content</div>
      </RootLayout>
    );

    const body = document.querySelector('body');
    expect(body).toHaveClass('inter-font');
    expect(body).toHaveClass('antialiased');
  });
});
