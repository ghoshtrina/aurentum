# UI Conventions

Standards and patterns used across the Aurentum frontend.

---

## 1. Currency Formatting

All INR values must use `formatCurrency()` from `src/lib/utils/format.ts` — never `formatNumber()` for rupee amounts.

### Format

```
₹ 9,234.56
```

- Symbol: `₹` (Indian Rupee)
- Space between symbol and amount
- Indian number system grouping (en-IN): `1,23,456.78`
- 2 decimal places by default

### Implementation

`formatCurrency(value, currency?, decimals?)` uses `Intl.NumberFormat` with `style: 'currency'` and inserts a space after the symbol via regex: `formatted.replace(/^(\D+)(\d)/, '$1 $2')`.

### Where it's used

| Page | Values |
|------|--------|
| Overview — Exchange Rates | Rate per INR (e.g., `₹ 83.45` for USD/INR) |
| Overview — Precious Metals | Gold/Silver price per gram |
| Overview — Market Indices | Index values (Nifty, Sensex, etc.) |
| Overview — Mutual Funds | NAV |
| Fund Detail | Current NAV, 52W High, 52W Low |
| Metals page | All metal prices |

### When NOT to use it

- Percentage returns (use `ChangeIndicator` or `formatPercent()`)
- Non-INR values (pass the currency code: `formatCurrency(value, 'USD')`)
- Pure numeric displays with no currency context (use `formatNumber()`)

---

## 2. PageTimestamp Format

**Format**: `{current date time}. Last updated: {last updated date and time in IST}`

- Always use the `PageTimestamp` component — never replace with custom formatting
- Always pass `new Date().toISOString()` as `lastUpdated` (server render time, not data dates)
- See `memory/rules.md` for the mandatory rule on this

---

## 3. Change Indicators

The `ChangeIndicator` component displays percentage changes with:
- Green with up arrow for positive values
- Red with down arrow for negative values
- Muted text for zero or unavailable values

---

## 4. AutoShrinkText

`src/components/ui/AutoShrinkText.tsx` — a client component that prevents currency amounts from wrapping onto a second line inside cards.

### Problem

In narrow grid cards (especially on mobile or dense metric grids), formatted currency strings like `₹ 23,10,651.73` can overflow and wrap, breaking the layout.

### How it works

- Renders children on a single line (`whitespace-nowrap`)
- Uses a `ResizeObserver` to detect when the text is wider than its container
- Scales the font down proportionally (minimum 0.6x) until it fits

### Usage

Wrap any `formatCurrency()` output inside a card:

```tsx
import { AutoShrinkText } from '@/components/ui/AutoShrinkText';

<div className="text-xl font-bold tracking-tight">
  <AutoShrinkText>{formatCurrency(price)}</AutoShrinkText>
</div>
```

The font-size classes (`text-xl`, `text-lg`, etc.) go on the **parent wrapper div**, not on `AutoShrinkText` itself. The component inherits and scales relative to the parent's `em` size.

### Where it's applied

| File | Values |
|------|--------|
| `src/app/page.tsx` | All overview cards (currencies, metals, indices, funds) |
| `src/app/market-indices/page.tsx` | Index listing cards |
| `src/app/market-indices/[symbol]/IndexDetailClient.tsx` | Current Price, Price in INR, 52W High/Low |
| `src/app/mutual-funds/[schemeCode]/FundDetailClient.tsx` | Current NAV, 52W High/Low |
| `src/components/metals/MetalPriceCard.tsx` | Metal price per gram |

### When NOT to use it

- Percentage values (`ChangeIndicator` handles its own layout)
- Text labels or descriptions
- Values that are always short (e.g., `--` fallback)

---

## 5. Multi-Currency Display (International Indices)

Indices in the `International` category (NASDAQ 100, S&P 500) are priced in USD. The constants file marks each index with a `currency: 'INR' | 'USD'` field.

### Landing page (`/market-indices`)

Cards pass `idx.currency` to `formatCurrency()` so international indices show `$` instead of `₹`:

```tsx
<AutoShrinkText>{formatCurrency(data.price, idx.currency)}</AutoShrinkText>
```

### Detail page (`/market-indices/[symbol]`)

- All price/52W cards display in the index's native currency
- An extra **"Price in INR"** metric card appears for USD indices, showing the converted amount using the live USD→INR rate from Frankfurter API
- The conversion is done server-side in the page component and passed as a `priceInINR` prop
