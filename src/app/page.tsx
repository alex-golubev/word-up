export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <main className="flex flex-col items-center gap-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Word Up
        </h1>
        <p className="max-w-md text-lg text-zinc-600 dark:text-zinc-400">
          Practice languages through conversations
        </p>
        <span className="rounded-full bg-zinc-200 px-4 py-2 text-sm text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
          Coming soon
        </span>
      </main>
    </div>
  );
}
