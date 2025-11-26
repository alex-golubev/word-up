import { render, screen } from '@testing-library/react';
import RootLayout from './layout';

jest.mock('next/font/google', () => ({
  Geist: () => ({ variable: '--font-geist-sans' }),
  Geist_Mono: () => ({ variable: '--font-geist-mono' }),
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

  it('should apply font variables to body', () => {
    render(
      <RootLayout>
        <div>Content</div>
      </RootLayout>
    );

    const body = document.querySelector('body');
    expect(body).toHaveClass('--font-geist-sans');
    expect(body).toHaveClass('--font-geist-mono');
    expect(body).toHaveClass('antialiased');
  });
});
