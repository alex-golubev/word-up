/* eslint-disable import/order */
import { renderHook } from '@testing-library/react';

import type { ReactNode } from 'react';

const mockUseQuery = jest.fn();
const mockInvalidate = jest.fn();

jest.mock('~/presentation/hooks/trpc', () => ({
  trpc: {
    auth: {
      me: {
        useQuery: (...args: unknown[]) => mockUseQuery(...args),
      },
    },
    useUtils: () => ({
      auth: {
        me: {
          invalidate: mockInvalidate,
        },
      },
    }),
  },
}));

import { useAuth } from './auth';

const wrapper = ({ children }: { children: ReactNode }) => children;

describe('useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return loading state initially', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should return user when authenticated', () => {
    const mockUser = { id: '123', email: 'test@example.com' };
    mockUseQuery.mockReturnValue({
      data: mockUser,
      isLoading: false,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should return null user when not authenticated', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should call invalidate when invalidateAuth is called', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    result.current.invalidateAuth();

    expect(mockInvalidate).toHaveBeenCalled();
  });

  it('should pass correct options to useQuery', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
    });

    renderHook(() => useAuth(), { wrapper });

    expect(mockUseQuery).toHaveBeenCalledWith(undefined, {
      retry: false,
      staleTime: 5 * 60 * 1000,
    });
  });
});
