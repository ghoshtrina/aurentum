export function Footer() {
  return (
    <footer className="border-t border-border py-6">
      <div className="mx-auto max-w-7xl px-4 text-center text-xs text-muted-foreground space-y-1">
        <p>
          All data is for informational purposes only and does not constitute investment advice.
        </p>
        <p>
          Currency rates from{' '}
          <a href="https://www.frankfurter.dev/" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">Frankfurter</a>
          {' '}&middot; Metal prices from{' '}
          <a href="https://ibjarates.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">IBJA</a>,{' '}
          <a href="https://groww.in/gold-rates" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">Groww</a>,{' '}
          <a href="https://www.goldapi.io/" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">Gold API</a>
          {' '}&middot; Mutual fund NAVs from{' '}
          <a href="https://www.mfapi.in/" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">MFAPI</a>
          {' '}&middot; Charts by{' '}
          <a href="https://www.tradingview.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">TradingView</a>
        </p>
      </div>
    </footer>
  );
}
