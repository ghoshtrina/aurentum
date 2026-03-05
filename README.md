# Aurentum

A personal finance dashboard for tracking currencies, precious metals, market indices, and mutual funds — built with Next.js and deployed on Vercel.

**Live:** [aurentum.app](https://aurentum.app)

## Features

- **Exchange Rates** — Live INR rates for USD, EUR, GBP, JPY, AED and more. Historical charts and a currency converter.
- **Precious Metals** — Daily gold (24K/22K/18K) and silver prices from IBJA, with purity calculator and price trend charts.
- **Market Indices** — 11 Indian and international indices (NIFTY 50, SENSEX, NASDAQ 100, S&P 500, etc.) with detail pages showing returns and charts.
- **Mutual Funds** — Browse 60,000+ Indian mutual fund schemes. NAV history, CAGR returns, and 52-week ranges.
- **Dark/Light theme** with gold accent color scheme.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| UI | React 19, Tailwind CSS v4 |
| Charts | lightweight-charts v5 |
| Theming | next-themes (class-based) |
| Hosting | Vercel |

## Data Sources

| Data | Source | Auth |
|------|--------|------|
| Exchange rates | [Frankfurter API](https://frankfurter.dev) | None |
| Precious metals | [IBJA](https://ibjarates.com) (primary), [Groww MCX](https://groww.in) (fallback), [GoldAPI.io](https://goldapi.io) (last resort) | `GOLD_API_KEY` for GoldAPI only |
| Market indices | [Yahoo Finance](https://finance.yahoo.com) chart API | None |
| Mutual funds | [MFAPI](https://mfapi.in) | None |

## Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun

### Install and Run

```bash
git clone <repo-url>
cd aurentum
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

Create a `.env.local` file (optional):

```env
# Only needed if IBJA + Groww fallbacks both fail
GOLD_API_KEY=your_goldapi_key
```

The app works without any env variables — GoldAPI is a last-resort fallback for metal prices.

### Build

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/                        # Next.js App Router pages
│   ├── page.tsx                # Overview dashboard
│   ├── currencies/             # Currency exchange section
│   ├── metals/                 # Precious metals section
│   ├── market-indices/         # Market indices section
│   │   ├── page.tsx            #   Landing page (all indices)
│   │   └── [symbol]/           #   Detail page (chart + metrics)
│   ├── mutual-funds/           # Mutual funds section
│   │   ├── page.tsx            #   Search and browse
│   │   ├── category/           #   Category browser
│   │   └── [schemeCode]/       #   Fund detail page
│   └── api/                    # API routes (client-side fetches)
│       ├── currencies/         #   Currency history
│       ├── indices/            #   Index history
│       ├── metals/             #   Metal history
│       └── mutual-funds/       #   Fund search
├── components/
│   ├── charts/                 # PriceChart (lightweight-charts)
│   ├── currencies/             # Currency-specific components
│   ├── layout/                 # Navbar, Footer, ThemeToggle
│   ├── metals/                 # MetalPriceCard, PurityCalculator
│   ├── mutual-funds/           # FundSearch, MFBrowser
│   └── ui/                     # Card, Skeleton, ChangeIndicator,
│                               # PageTimestamp, TimeRangeSelector,
│                               # AutoShrinkText
├── hooks/
│   └── useTimeRange.ts         # Chart time range state
└── lib/
    ├── api/                    # Server-side data fetching
    │   ├── frankfurter.ts      #   Currency rates
    │   ├── metals.ts           #   Metal prices (IBJA/Groww/GoldAPI)
    │   ├── indices.ts          #   Yahoo Finance indices
    │   └── mfapi.ts            #   Mutual fund API
    ├── constants/              # Static data (currencies, indices, etc.)
    └── utils/                  # Formatting, calculations, chart helpers
```

## Architecture

- **Server components** fetch external APIs directly and pass data as props to client components.
- **Client components** handle interactivity (charts, time range selectors, search).
- **API routes** exist for client-side dynamic fetches (chart history, search).
- **ISR** (`revalidate = 3600`) keeps pages fresh without rebuilding.
- **Cascading fallbacks** for metal prices: IBJA → Groww MCX → GoldAPI.io.
- **Market closed detection**: staleness-based (no hardcoded holiday calendar).

## License

Private project. All rights reserved.
