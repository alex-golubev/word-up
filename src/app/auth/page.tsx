'use client';

import Link from 'next/link';
import { useState } from 'react';

import { Button, Input, Select } from '~/presentation/components/ui';
import { trpc, useAuth } from '~/presentation/hooks';

import type { FormEvent } from 'react';

type Tab = 'login' | 'register';

function Logo() {
  return (
    <Link href="/" className="mb-8 flex items-center justify-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center">
        <svg viewBox="0 0 32 32" fill="none" className="h-6 w-6">
          <path d="M8 8L16 24L24 8" stroke="#6366F1" strokeWidth="3" strokeLinecap="round" />
          <path d="M12 8L16 16L20 8" stroke="#F97316" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <span className="text-xl font-semibold text-zinc-900">Word Up</span>
    </Link>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-full px-6 py-3 text-base font-medium transition-colors ${
        active ? 'bg-indigo-500 text-white' : 'text-zinc-500 hover:text-zinc-900'
      }`}
    >
      {children}
    </button>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="block pl-4 text-sm font-medium text-zinc-600">{label}</label>
      {children}
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{message}</div>;
}

export default function AuthPage() {
  const [tab, setTab] = useState<Tab>('login');
  const { user, isLoading, invalidateAuth } = useAuth();

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: () => invalidateAuth(),
  });

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => invalidateAuth(),
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => invalidateAuth(),
  });

  const handleRegister = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    registerMutation.mutate({
      email: form.get('email') as string,
      password: form.get('password') as string,
      name: (form.get('name') as string) || undefined,
      nativeLanguage: form.get('nativeLanguage') as 'en' | 'ru' | 'es' | 'fr' | 'de',
    });
  };

  const handleLogin = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    loginMutation.mutate({
      email: form.get('email') as string,
      password: form.get('password') as string,
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#FFF5F1] via-white to-indigo-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#FFF5F1] via-white to-indigo-50 p-4">
        <div className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-xl">
          <Logo />

          <h1 className="mb-6 text-center text-2xl font-semibold text-zinc-900">Welcome back!</h1>

          <div className="mb-8 space-y-3 rounded-2xl bg-zinc-50 p-4">
            <div className="flex justify-between">
              <span className="text-sm text-zinc-500">Email</span>
              <span className="text-sm font-medium text-zinc-900">{user.email}</span>
            </div>
            {user.name && (
              <div className="flex justify-between">
                <span className="text-sm text-zinc-500">Name</span>
                <span className="text-sm font-medium text-zinc-900">{user.name}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-sm text-zinc-500">Language</span>
              <span className="text-sm font-medium text-zinc-900">{user.nativeLanguage.toUpperCase()}</span>
            </div>
          </div>

          <div className="space-y-3">
            <Button href="/" size="small" className="w-full">
              Go to Dashboard
            </Button>
            <Button
              variant="ghost"
              size="small"
              onClick={() => logoutMutation.mutate()}
              state={logoutMutation.isPending ? 'loading' : 'default'}
              className="w-full text-red-500 hover:text-red-600"
            >
              {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#FFF5F1] via-white to-indigo-50 p-4">
      <div className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-xl">
        <Logo />

        <div className="mb-8 flex gap-2 rounded-full bg-zinc-100 p-1">
          <TabButton active={tab === 'login'} onClick={() => setTab('login')}>
            Sign In
          </TabButton>
          <TabButton active={tab === 'register'} onClick={() => setTab('register')}>
            Sign Up
          </TabButton>
        </div>

        {tab === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-5">
            <FormField label="Email">
              <Input type="email" name="email" placeholder="your@email.com" required size="small" />
            </FormField>

            <FormField label="Password">
              <Input type="password" name="password" placeholder="Enter your password" required size="small" />
            </FormField>

            {loginMutation.error && <ErrorMessage message={loginMutation.error.message} />}

            <Button
              type="submit"
              size="small"
              state={loginMutation.isPending ? 'loading' : 'default'}
              className="mt-6 w-full"
            >
              {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-5">
            <FormField label="Email">
              <Input type="email" name="email" placeholder="your@email.com" required size="small" />
            </FormField>

            <FormField label="Password">
              <Input
                type="password"
                name="password"
                placeholder="Minimum 8 characters"
                required
                minLength={8}
                size="small"
              />
            </FormField>

            <FormField label="Name (optional)">
              <Input type="text" name="name" placeholder="Your name" size="small" />
            </FormField>

            <FormField label="Native Language">
              <Select name="nativeLanguage" required size="small">
                <option value="en">English</option>
                <option value="ru">Russian</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </Select>
            </FormField>

            {registerMutation.error && <ErrorMessage message={registerMutation.error.message} />}

            <Button
              type="submit"
              size="small"
              state={registerMutation.isPending ? 'loading' : 'default'}
              className="mt-6 w-full"
            >
              {registerMutation.isPending ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
