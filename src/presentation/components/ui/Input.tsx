import type { ComponentProps } from 'react';

type InputSize = 'large' | 'small';

type InputProps = Omit<ComponentProps<'input'>, 'size'> & {
  size?: InputSize;
};

const sizeClasses: Record<InputSize, string> = {
  large: 'px-12 py-5 text-lg',
  small: 'px-8 py-3.5 text-base',
};

export function Input({ size = 'large', className = '', ...props }: InputProps) {
  const baseClasses =
    'w-full rounded-full bg-white text-zinc-900 placeholder-zinc-400 outline-none caret-indigo-500 transition-colors border border-zinc-200 focus:border-indigo-500';
  const sizeClass = sizeClasses[size];

  const combinedClasses = `${baseClasses} ${sizeClass} ${className}`.trim();

  return <input className={combinedClasses} {...props} />;
}
