'use client';

export default function CurrenciesError({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-7xl flex-col items-center justify-center px-4 py-16">
      <h2 className="mb-2 text-xl font-bold">Failed to load currencies</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        Currency data is temporarily unavailable.
      </p>
      <button
        onClick={reset}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90"
      >
        Try again
      </button>
    </div>
  );
}
