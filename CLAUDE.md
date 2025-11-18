# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 16 application using the App Router architecture with TypeScript, React 19, and TailwindCSS 4. The project follows Next.js's modern file-based routing conventions with the `src/app` directory structure.

## Development Commands

### Running the Development Server

```bash
npm run dev
```

Opens development server at http://localhost:3000 with hot reloading enabled.

### Building for Production

```bash
npm run build
```

Creates an optimized production build. The build output is generated in the `.next` directory.

### Running Production Build Locally

```bash
npm run start
```

Starts the production server (requires running `npm run build` first).

### Linting and Formatting

```bash
npm run lint
```

Runs ESLint with Next.js configuration, Prettier integration, and custom TypeScript rules.

```bash
npm run format
```

Auto-formats all files using Prettier.

```bash
npm run format:check
```

Checks code formatting without making changes (useful for CI).

## Project Structure

- **`src/app/`** - App Router directory containing all routes and pages
  - `layout.tsx` - Root layout component with font configuration (Geist Sans and Geist Mono)
  - `page.tsx` - Home page component
  - `globals.css` - Global styles and TailwindCSS imports
- **`next.config.ts`** - Next.js configuration (TypeScript-based)
- **`tsconfig.json`** - TypeScript configuration with path alias `~/*` mapping to `./src/*`

## Key Technologies & Configuration

### TypeScript

- Path alias: `~/*` resolves to `./src/*`
- Strict mode enabled
- Target: ES2017
- Module resolution: bundler

### TailwindCSS

- Uses TailwindCSS 4 with PostCSS plugin (`@tailwindcss/postcss`)
- Custom theme variables defined in `globals.css` using `@theme inline`
- Dark mode support via CSS media queries (`prefers-color-scheme`)
- Custom CSS variables: `--background`, `--foreground`, `--font-geist-sans`, `--font-geist-mono`

### Next.js App Router

- Uses React Server Components by default
- Client components require `'use client'` directive
- Font optimization with `next/font` for Geist font family
- Image optimization with `next/image`

### Code Quality Tools

**ESLint** - Integrated with Prettier and custom TypeScript rules:
- Next.js core web vitals and TypeScript configurations
- Prettier integration via `eslint-plugin-prettier` and `eslint-config-prettier`
- Custom rules:
  - `@typescript-eslint/consistent-type-imports` - Enforces `import type` syntax for type-only imports with separate import statements
  - `eol-last` - Requires newline at end of files
- Custom ignores: `.next/`, `out/`, `build/`, `next-env.d.ts`

**Prettier** - Code formatting with these settings:
- Single quotes for strings
- Semicolons required
- 100 character line width
- 2 space indentation
- LF line endings
- Trailing commas (ES5 style)

## Architecture Notes

### Font Loading

Fonts are loaded in the root layout using Next.js's `next/font/google` with CSS variable injection. The Geist Sans and Geist Mono fonts are configured with Latin subsets and exposed as CSS variables (`--font-geist-sans`, `--font-geist-mono`) that are referenced in the TailwindCSS theme configuration.

### Styling Strategy

The project uses a hybrid CSS approach:

- TailwindCSS utility classes for component styling
- CSS custom properties for theming
- TailwindCSS 4's `@theme inline` directive for extending the design system with project-specific tokens

### Dark Mode

Dark mode is implemented using CSS media queries rather than class-based toggling, automatically following the user's system preferences.
