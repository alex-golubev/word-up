import { render, screen } from '@testing-library/react';

import { Button } from './Button';

describe('Button', () => {
  it('should render as a button by default', () => {
    render(<Button>Click me</Button>);

    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('should render as a link when href is provided', () => {
    render(<Button href="/test">Go to test</Button>);

    expect(screen.getByRole('link', { name: 'Go to test' })).toHaveAttribute('href', '/test');
  });

  it('should show loading spinner when state is loading', () => {
    render(<Button state="loading">Loading</Button>);

    const button = screen.getByRole('button', { name: 'Loading' });
    expect(button).toBeDisabled();
    expect(button.querySelector('svg')).toBeInTheDocument();
  });

  it('should show check icon when state is success', () => {
    render(<Button state="success">Done</Button>);

    const button = screen.getByRole('button', { name: 'Done' });
    expect(button).toBeEnabled();
    expect(button.querySelector('svg')).toBeInTheDocument();
  });

  it('should apply success classes for primary variant', () => {
    render(
      <Button state="success" variant="primary">
        Success
      </Button>
    );

    const button = screen.getByRole('button', { name: 'Success' });
    expect(button).toHaveClass('bg-emerald-500', 'text-white');
  });

  it('should apply success classes for ghost variant', () => {
    render(
      <Button state="success" variant="ghost">
        Success
      </Button>
    );

    const button = screen.getByRole('button', { name: 'Success' });
    expect(button).toHaveClass('text-emerald-500');
  });

  it('should use indigo spinner color for secondary variant', () => {
    render(
      <Button state="loading" variant="secondary">
        Loading
      </Button>
    );

    const button = screen.getByRole('button', { name: 'Loading' });
    const spinner = button.querySelector('svg');
    expect(spinner).toHaveClass('border-indigo-500');
  });
});
