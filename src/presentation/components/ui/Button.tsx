import Link from 'next/link';

import type { ComponentProps, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'large' | 'small';
type ButtonState = 'default' | 'loading' | 'success';

type ButtonBaseProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  state?: ButtonState;
  children: ReactNode;
};

type ButtonAsButton = ButtonBaseProps &
  Omit<ComponentProps<'button'>, keyof ButtonBaseProps> & {
    href?: never;
  };

type ButtonAsLink = ButtonBaseProps &
  Omit<ComponentProps<typeof Link>, keyof ButtonBaseProps> & {
    href: string;
  };

type ButtonProps = ButtonAsButton | ButtonAsLink;

const sizeClasses: Record<ButtonSize, string> = {
  large: 'px-12 py-5 text-lg',
  small: 'px-8 py-3.5 text-base',
};

const variantClasses: Record<ButtonVariant, Record<'default' | 'hover', string>> = {
  primary: {
    default: 'bg-indigo-500 text-white',
    hover: 'hover:bg-indigo-600',
  },
  secondary: {
    default: 'bg-white text-indigo-500',
    hover: '',
  },
  ghost: {
    default: 'bg-transparent text-indigo-500',
    hover: 'hover:text-indigo-600',
  },
};

const successClasses: Record<ButtonVariant, string> = {
  primary: 'bg-emerald-500 text-white',
  secondary: 'bg-emerald-500 text-white',
  ghost: 'text-emerald-500',
};

function LoadingSpinner({ variant }: { variant: ButtonVariant }) {
  const colorClass = variant === 'primary' ? 'border-white' : 'border-indigo-500';
  return (
    <svg className={`mr-2 h-4 w-4 animate-spin ${colorClass}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

export function Button({
  variant = 'primary',
  size = 'large',
  state = 'default',
  children,
  className = '',
  ...props
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center rounded-full font-medium transition-colors';
  const sizeClass = sizeClasses[size];

  let stateClasses: string;
  if (state === 'success') {
    stateClasses = successClasses[variant];
  } else {
    stateClasses = `${variantClasses[variant].default} ${variantClasses[variant].hover}`;
  }

  const disabledClasses = state === 'loading' ? 'cursor-not-allowed opacity-80' : '';

  const combinedClasses = `${baseClasses} ${sizeClass} ${stateClasses} ${disabledClasses} ${className}`.trim();

  const content = (
    <>
      {state === 'loading' && <LoadingSpinner variant={variant} />}
      {state === 'success' && <CheckIcon />}
      {children}
    </>
  );

  if ('href' in props && props.href) {
    const { href, ...linkProps } = props as ButtonAsLink;
    return (
      <Link href={href} className={combinedClasses} {...linkProps}>
        {content}
      </Link>
    );
  }

  const buttonProps = props as ButtonAsButton;
  return (
    <button className={combinedClasses} disabled={state === 'loading'} {...buttonProps}>
      {content}
    </button>
  );
}
