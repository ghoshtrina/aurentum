# Market Indices

Feature documentation for the market indices section added to Aurentum.

---

## Overview

A dedicated section for tracking 11 major Indian and international market indices, with a landing page and individual detail pages with charts and metrics.

---

## Routes

| Route | Type | Description |
|-------|------|-------------|
| `/market-indices` | Landing page | All 11 indices grouped by category |
| `/market-indices/[symbol]` | Detail page | Chart, metrics, returns for a single index |
| `/api/indices/history` | API route | Historical price data for charts |

---

## Index List

| Category | Index | Yahoo Finance Symbol | Currency |
|----------|-------|---------------------|----------|
| Core | NIFTY 50 | `^NSEI` | INR |
| Core | NIFTY Next 50 | `^NSMIDCP` | INR |
| Core | NIFTY 100 | `^CNX100` | INR |
| Core | NIFTY 500 | `^CRSLDX` | INR |
| Core | SENSEX | `^BSESN` | INR |
| Market Cap | NIFTY Midcap 150 | `NIFTYMIDCAP150.NS` | INR |
| Market Cap | NIFTY Smallcap 250 | `NIFTY_SMLCAP_250.NS` | INR |
| Popular Sector | NIFTY Bank | `^NSEBANK` | INR |
| Popular Sector | NIFTY IT | `^CNXIT` | INR |
| International | NASDAQ 100 | `^NDX` | USD |
| International | S&P 500 | `^GSPC` | USD |

Defined in `src/lib/constants/indices.ts`.

---

## Files

### New files

| File | Purpose |
|------|---------|
| `src/lib/constants/indices.ts` | Index definitions, categories, symbol lookup |
| `src/app/api/indices/history/route.ts` | History API endpoint (`?symbol=&start=`) |
| `src/app/market-indices/page.tsx` | Landing page (server component) |
| `src/app/market-indices/loading.tsx` | Landing page skeleton |
| `src/app/market-indices/[symbol]/page.tsx` | Detail page (server component) |
| `src/app/market-indices/[symbol]/IndexDetailClient.tsx` | Detail client component |
| `src/app/market-indices/[symbol]/loading.tsx` | Detail page skeleton |

### Edited files

| File | Change |
|------|--------|
| `src/lib/api/indices.ts` | Added `getAllIndices()`, `getIndexHistory()`, imports from constants |
| `src/app/page.tsx` | Index cards are clickable Links, "View all" link, explore card |
| `src/components/layout/Navbar.tsx` | Added "Indices" nav link, improved active-state matching for sub-paths |

---

## Architecture

### Data flow

```
Yahoo Finance API (v8/finance/chart)
  └─> src/lib/api/indices.ts
        ├─> getIndianIndices()     → Overview page (4 overview indices)
        ├─> getAllIndices()         → Landing page (all 11 indices)
        └─> getIndexHistory()      → Detail page chart data
```

### Landing page (`/market-indices`)

- Server component, `revalidate = 3600`
- Calls `getAllIndices()` which fetches all 11 indices in parallel
- Groups cards by category using `INDEX_CATEGORIES` display order
- Each card links to `/market-indices/{encodedSymbol}`

### Detail page (`/market-indices/[symbol]`)

Server component fetches 5 years of daily data, computes:
- Current price and 1D change (last two data points)
- 1Y/3Y/5Y returns (simple return for 1Y, CAGR for multi-year)
- 52-week high/low
- Market closed detection (latest data >2 days stale)
- For USD indices: fetches USD→INR rate from Frankfurter API

Passes all computed values as props to `IndexDetailClient`.

### Detail client component

- Time range selector: 1M, 3M, 6M, 1Y, 3Y, 5Y, All
- Fetches chart data from `/api/indices/history` on range change
- 7 metric cards (8 for USD indices with "Price in INR")
- Reuses: `PriceChart`, `TimeRangeSelector`, `useTimeRange`, `toChartData`, `getDateForRange`, `Card`, `ChangeIndicator`, `AutoShrinkText`

### History API route

```
GET /api/indices/history?symbol=^NSEI&start=2024-01-01
```

Returns: `{ symbol, history: [{ date, price }] }`

Cache: `s-maxage=86400, stale-while-revalidate=3600`

---

## Constants exports

```typescript
// All 11 indices with symbol, shortName, category, currency
INDICES: IndexInfo[]

// Category display order
INDEX_CATEGORIES: string[]

// Symbols shown on the overview page (4 cards)
OVERVIEW_INDICES: string[]  // ['^BSESN', '^NSEI', '^NSEBANK', '^CNXIT']

// Lookup helper
getIndexBySymbol(symbol: string): IndexInfo | undefined
```

---

## Yahoo Finance notes

- API: `https://query2.finance.yahoo.com/v8/finance/chart/{symbol}`
- Current data: `?range=2d&interval=1d` (uses `meta.regularMarketPrice`)
- Historical data: `?period1={unix}&period2={unix}&interval=1d` (uses `timestamp[]` + `indicators.quote[0].close[]`)
- Fetched via `execSync` + `curl` (same pattern as metals)
- Some NSE index symbols use `.NS` suffix (e.g., `NIFTYMIDCAP150.NS`), others use `^` prefix
- Symbol availability was verified manually; incorrect symbols return empty responses
