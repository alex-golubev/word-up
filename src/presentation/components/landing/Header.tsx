import Link from 'next/link';

import { Button } from '~/presentation/components/ui';

const navLinks = [
  { href: '/', label: 'Courses' },
  { href: '/', label: 'About us' },
  { href: '/', label: 'Teachers' },
  { href: '/', label: 'Pricing' },
  { href: '/', label: 'Careers' },
  { href: '/', label: 'Blog' },
];

export function Header() {
  return (
    <header className="flex w-full items-center justify-between px-8 pt-8 pb-4 lg:px-16 lg:pt-10">
      <Link href="/" className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center">
          <svg viewBox="0 0 32 32" fill="none" className="h-6 w-6">
            <path d="M8 8L16 24L24 8" stroke="#6366F1" strokeWidth="3" strokeLinecap="round" />
            <path d="M12 8L16 16L20 8" stroke="#F97316" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <span className="text-xl font-semibold text-zinc-900">Word Up</span>
      </Link>

      <nav className="hidden items-center gap-8 md:flex">
        {navLinks.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className="text-base text-zinc-600 transition-colors hover:text-zinc-900"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <Button href="/auth" variant="secondary" size="small">
        Get started
      </Button>
    </header>
  );
}
