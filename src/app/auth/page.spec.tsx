import { fireEvent, render, screen } from '@testing-library/react';

const mockMutate = jest.fn();
const mockInvalidateAuth = jest.fn();

const mockUseAuth = jest.fn();
jest.mock('~/presentation/hooks/auth', () => ({
  useAuth: () => mockUseAuth(),
}));

type MutationOpts = { onSuccess: () => void };
type MutationResult = {
  mutate: jest.Mock;
  isPending: boolean;
  error: { message: string } | null;
};
const mutationCallbacks: Record<string, MutationOpts> = {};

const mockUseMutation = jest.fn<MutationResult, [string, MutationOpts]>((type, opts) => {
  mutationCallbacks[type] = opts;
  return {
    mutate: mockMutate,
    isPending: false,
    error: null,
  };
});

jest.mock('~/presentation/hooks/trpc', () => ({
  trpc: {
    auth: {
      register: { useMutation: (opts: MutationOpts) => mockUseMutation('register', opts) },
      login: { useMutation: (opts: MutationOpts) => mockUseMutation('login', opts) },
      logout: { useMutation: (opts: MutationOpts) => mockUseMutation('logout', opts) },
    },
  },
}));

import AuthPage from './page';

describe('AuthPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loading state', () => {
    it('should show loading indicator when auth is loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: true,
        invalidateAuth: mockInvalidateAuth,
      });

      render(<AuthPage />);

      // Loading spinner is shown (no text, just the spinner element)
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('authenticated state', () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      name: 'Test User',
      nativeLanguage: 'en',
      createdAt: new Date('2024-01-01').toISOString(),
    };

    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        isLoading: false,
        invalidateAuth: mockInvalidateAuth,
      });
    });

    it('should display user info when authenticated', () => {
      render(<AuthPage />);

      expect(screen.getByText('Welcome back!')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    it('should call logout mutation when logout button clicked', () => {
      render(<AuthPage />);

      fireEvent.click(screen.getByRole('button', { name: /logout/i }));

      expect(mockMutate).toHaveBeenCalled();
    });

    it('should invalidate auth on successful logout', () => {
      render(<AuthPage />);

      mutationCallbacks.logout.onSuccess();

      expect(mockInvalidateAuth).toHaveBeenCalled();
    });

    it('should show pending state during logout', () => {
      mockUseMutation.mockImplementation((type: string, opts: MutationOpts) => {
        mutationCallbacks[type] = opts;
        return { mutate: mockMutate, isPending: true, error: null };
      });

      render(<AuthPage />);

      expect(screen.getByRole('button', { name: /logging out/i })).toBeDisabled();
    });

    it('should not display name row when name is empty', () => {
      mockUseAuth.mockReturnValue({
        user: { ...mockUser, name: null },
        isLoading: false,
        invalidateAuth: mockInvalidateAuth,
      });

      render(<AuthPage />);

      // Name row should not be present
      expect(screen.queryByText('Name')).not.toBeInTheDocument();
    });
  });

  describe('unauthenticated state', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        invalidateAuth: mockInvalidateAuth,
      });
    });

    it('should show login form by default', () => {
      render(<AuthPage />);

      const signInTab = screen.getByRole('button', { name: 'Sign In' });
      expect(signInTab).toHaveClass('bg-indigo-500');
    });

    it('should switch to register tab when clicked', () => {
      render(<AuthPage />);

      const signUpTab = screen.getByRole('button', { name: 'Sign Up' });
      fireEvent.click(signUpTab);

      expect(signUpTab).toHaveClass('bg-indigo-500');
    });

    it('should switch back to login tab when clicked', () => {
      render(<AuthPage />);

      const signUpTab = screen.getByRole('button', { name: 'Sign Up' });
      fireEvent.click(signUpTab);

      const signInTab = screen.getByRole('button', { name: 'Sign In' });
      fireEvent.click(signInTab);

      expect(signInTab).toHaveClass('bg-indigo-500');
    });

    it('should submit login form', () => {
      render(<AuthPage />);

      const form = document.querySelector('form')!;
      fireEvent.change(form.querySelector('input[name="email"]')!, { target: { value: 'test@test.com' } });
      fireEvent.change(form.querySelector('input[name="password"]')!, { target: { value: 'password123' } });
      fireEvent.submit(form);

      expect(mockMutate).toHaveBeenCalledWith({
        email: 'test@test.com',
        password: 'password123',
      });
    });

    it('should invalidate auth on successful login', () => {
      render(<AuthPage />);

      mutationCallbacks.login.onSuccess();

      expect(mockInvalidateAuth).toHaveBeenCalled();
    });

    it('should submit register form', () => {
      render(<AuthPage />);

      const signUpTab = screen.getByRole('button', { name: 'Sign Up' });
      fireEvent.click(signUpTab);

      const form = document.querySelector('form')!;
      fireEvent.change(form.querySelector('input[name="email"]')!, { target: { value: 'new@test.com' } });
      fireEvent.change(form.querySelector('input[name="password"]')!, { target: { value: 'password123' } });
      fireEvent.change(form.querySelector('input[name="name"]')!, { target: { value: 'New User' } });
      fireEvent.change(form.querySelector('select[name="nativeLanguage"]')!, { target: { value: 'ru' } });
      fireEvent.submit(form);

      expect(mockMutate).toHaveBeenCalledWith({
        email: 'new@test.com',
        password: 'password123',
        name: 'New User',
        nativeLanguage: 'ru',
      });
    });

    it('should invalidate auth on successful register', () => {
      render(<AuthPage />);

      mutationCallbacks.register.onSuccess();

      expect(mockInvalidateAuth).toHaveBeenCalled();
    });

    it('should show login error message', () => {
      mockUseMutation.mockImplementation((type: string, opts: MutationOpts) => {
        mutationCallbacks[type] = opts;
        return {
          mutate: mockMutate,
          isPending: false,
          error: type === 'login' ? { message: 'Invalid credentials' } : null,
        };
      });

      render(<AuthPage />);

      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });

    it('should show register error message', () => {
      mockUseMutation.mockImplementation((type: string, opts: MutationOpts) => {
        mutationCallbacks[type] = opts;
        return {
          mutate: mockMutate,
          isPending: false,
          error: type === 'register' ? { message: 'Email already exists' } : null,
        };
      });

      render(<AuthPage />);

      fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }));

      expect(screen.getByText('Email already exists')).toBeInTheDocument();
    });

    it('should show pending state during login', () => {
      mockUseMutation.mockImplementation((type: string, opts: MutationOpts) => {
        mutationCallbacks[type] = opts;
        return { mutate: mockMutate, isPending: type === 'login', error: null };
      });

      render(<AuthPage />);

      expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
    });

    it('should show pending state during register', () => {
      mockUseMutation.mockImplementation((type: string, opts: MutationOpts) => {
        mutationCallbacks[type] = opts;
        return { mutate: mockMutate, isPending: type === 'register', error: null };
      });

      render(<AuthPage />);

      fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }));

      expect(screen.getByRole('button', { name: /creating account/i })).toBeDisabled();
    });

    it('should handle empty name in register form', () => {
      render(<AuthPage />);

      const signUpTab = screen.getByRole('button', { name: 'Sign Up' });
      fireEvent.click(signUpTab);

      const form = document.querySelector('form')!;
      fireEvent.change(form.querySelector('input[name="email"]')!, { target: { value: 'new@test.com' } });
      fireEvent.change(form.querySelector('input[name="password"]')!, { target: { value: 'password123' } });
      fireEvent.change(form.querySelector('select[name="nativeLanguage"]')!, { target: { value: 'en' } });
      fireEvent.submit(form);

      expect(mockMutate).toHaveBeenCalledWith({
        email: 'new@test.com',
        password: 'password123',
        name: undefined,
        nativeLanguage: 'en',
      });
    });
  });
});
