import { render, screen } from '@testing-library/react';

import Home from '~/app/page';

describe('Home', () => {
  it('should render the hero heading', () => {
    render(<Home />);

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('should render the description', () => {
    render(<Home />);

    expect(screen.getByText('Learn at your own pace, with lifetime access on mobile and desktop')).toBeInTheDocument();
  });

  it('should render the get started button', () => {
    render(<Home />);

    const getStartedLinks = screen.getAllByRole('link', { name: 'Get started' });
    expect(getStartedLinks.length).toBeGreaterThan(0);
  });
});
