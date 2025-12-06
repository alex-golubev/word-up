import { render, screen } from '@testing-library/react';

import Home from '~/app/page';

describe('Home', () => {
  it('should render the title', () => {
    render(<Home />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Word Up');
  });

  it('should render the description', () => {
    render(<Home />);

    expect(screen.getByText('Practice languages through conversations')).toBeInTheDocument();
  });

  it('should render coming soon badge', () => {
    render(<Home />);

    expect(screen.getByText('Coming soon')).toBeInTheDocument();
  });
});
