import type { ComponentProps } from 'react';

type SelectSize = 'large' | 'small';

type SelectProps = Omit<ComponentProps<'select'>, 'size'> & {
  size?: SelectSize;
};

const sizeClasses: Record<SelectSize, string> = {
  large: 'px-12 py-5 text-lg',
  small: 'px-8 py-3.5 text-base',
};

export function Select({ size = 'large', className = '', children, ...props }: SelectProps) {
  const baseClasses =
    'w-full rounded-full bg-white text-zinc-900 outline-none cursor-pointer transition-colors border border-zinc-200 focus:border-indigo-500 appearance-none bg-no-repeat';
  const sizeClass = sizeClasses[size];

  const arrowStyle = {
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2371717a'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
    backgroundPosition: 'right 1.5rem center',
    backgroundSize: '1.25rem',
  };

  const combinedClasses = `${baseClasses} ${sizeClass} ${className}`.trim();

  return (
    <select className={combinedClasses} style={arrowStyle} {...props}>
      {children}
    </select>
  );
}
