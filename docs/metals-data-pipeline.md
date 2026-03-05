# Precious Metals — Data Pipeline & Calculations

This document covers how Aurentum fetches, calculates, and displays gold and silver prices, including the historical chart data.

---

## 1. Current Price Fetching (Cascading Fallback)

The system uses a three-tier fallback strategy defined in `src/lib/api/metals.ts`. Each source is tried in order — the first successful response wins.

### Source 1 (Primary): IBJA — India Bullion & Jewellers Association

| Detail | Value |
|--------|-------|
| URL | `https://ibjarates.com/` |
| Method | HTML scraping via regex |
| Auth | None |
| Cache | `next.revalidate: 300` (5 min ISR) |
| Data format | Gold per 10g, Silver per kg (excludes 3% GST) |

**How it works:**
1. Fetches the IBJA homepage HTML.
2. A regex extracts the **PM** rate rows first (more recent, published ~6 PM IST). If no PM rows exist yet (before 6 PM), falls back to **AM** rows (published ~12 PM IST). Each row contains: date, Gold 999, Gold 995, Gold 916, Gold 750, Gold 585, Silver 999, Silver old.
3. Extracts the latest (index 0) and previous (index 1) rows.
4. Converts to per-gram:
   - `gold per gram = gold per 10g / 10`
   - `silver per gram = silver per kg / 1000`

**AM vs PM:** IBJA's homepage banner shows the PM rate. Previously the code only scraped AM rows, which were ~100 INR/gram lower than PM on volatile days (e.g., AM: 16,647, PM: 16,747 on Mar 2, 2026). Now PM rows are preferred.

**Risk:** If IBJA changes their HTML table structure, the regex will silently return no matches, triggering the Groww fallback.

### Source 2 (Fallback): Groww MCX Spot Prices

| Detail | Value |
|--------|-------|
| URLs | `https://groww.in/gold-rates`, `https://groww.in/silver-rates` |
| Method | `__NEXT_DATA__` JSON extraction from Groww's Next.js pages |
| Auth | None |
| Cache | `next.revalidate: 300` (5 min ISR) |
| Data format | Gold per 10g (MCX spot), Silver per kg (MCX spot) |

**How it works:**
1. Fetches both Groww pages in parallel.
2. Extracts the `<script id="__NEXT_DATA__">` JSON payload.
3. Reads `props.pageProps.goldRateData.goldMCXData.spotPrice` for gold.
4. Reads `props.pageProps.silverItem.spotPrice` for silver.
5. Also reads `lastDayClosePrice` for 1-day change calculation.
6. Converts to per-gram using the same `/10` and `/1000` divisors.

**Note:** Groww also publishes city-wise retail rates via `physicalGoldRate` (incl. GST + local taxes, ~2-3% higher). The code ignores these and only uses the MCX spot price.

**Groww structure change log:**
- Pre-2026: `pageProps.goldRateData.goldMCXData.spotPrice` (MCX spot per 10g)
- Post-March 2026: `pageProps.goldMCXData.spotPrice` (moved up one level, same data)
- The code checks both paths for backwards compatibility.

### Source 3 (Last Resort): Gold API — International Spot

| Detail | Value |
|--------|-------|
| URL | `https://www.goldapi.io/api/{XAU|XAG}/INR` |
| Method | REST API |
| Auth | `GOLD_API_KEY` env variable (required) |
| Cache | `next.revalidate: 300` (5 min ISR) |
| Data format | Price per gram in INR (international spot) |

**How it works:**
1. Calls the API for gold (`XAU`) and silver (`XAG`) in parallel.
2. Returns `price_gram_24k`, `price_gram_22k`, `price_gram_18k`, and `chp` (change %).
3. Results are flagged with `isEstimated: true` because international spot prices are typically 5-10% lower than Indian domestic rates (due to import duty, GST, etc.).

### Fallback to Zeros

If all three sources fail, the system returns all prices as `0` with `source: 'unavailable'`. The UI shows a "data unavailable" message.

---

## 2. Purity Price Calculations

All purity prices are derived from the 24K (Gold) or 999 (Silver) base price using multipliers.

### Gold Purities

| Purity | Fineness | Multiplier | Formula |
|--------|----------|------------|---------|
| 24K | 99.9% | 1.0 | Base price (direct from source) |
| 22K | 91.6% | 0.9166 | `gold24k × 0.9166` |
| 18K | 75.0% | 0.75 | `gold24k × 0.75` |
| 14K | 58.3% | 0.583 | `gold24k × 0.583` |
| 9K | 37.5% | 0.375 | `gold24k × 0.375` |

**Exception:** When IBJA is the source, 22K and 18K are read directly from IBJA data (Gold 916 and Gold 750 rows) rather than calculated. Only 14K and 9K use multipliers against the 24K base.

### Silver Purities

| Purity | Fineness | Multiplier | Formula |
|--------|----------|------------|---------|
| 999 Fine | 99.9% | 1.0 | Base price (direct from source) |
| 925 Sterling | 92.5% | 0.925 | `silver999 × 0.925` |

Constants are defined in `src/lib/constants/metals.ts`.

---

## 3. 1-Day Change Calculation

```
change1D = ((currentPrice - previousPrice) / previousPrice) × 100
```

How "previous" is determined per source:

| Source | Previous Price |
|--------|---------------|
| IBJA | Second row in the AM rates table (previous trading day) |
| Groww | `lastDayClosePrice` from MCX data |
| Gold API | `chp` field returned directly by the API |

The same `change1D` percentage is applied to all purities within the same metal (gold or silver), since all purity prices move proportionally.

---

## 4. Historical Chart Data

### Data Source: Yahoo Finance ETFs

| Metal | Symbol | Description |
|-------|--------|-------------|
| Gold | `GOLDBEES.NS` | Nippon India Gold ETF on NSE India |
| Silver | `SILVERBEES.NS` | Nippon India Silver ETF on NSE India |

Defined in `src/lib/api/metals.ts` → `getMetalHistory()`.

### How it works

1. The client component (`src/components/metals/MetalChart.tsx`) triggers a fetch to `/api/metals/history?metal={gold|silver}&start={YYYY-MM-DD}`.

2. The API route (`src/app/api/metals/history/route.ts`) calls `getMetalHistory(metal, startDate)`.

3. `getMetalHistory` constructs a Yahoo Finance URL:
   ```
   https://query2.finance.yahoo.com/v8/finance/chart/{SYMBOL}?period1={unix}&period2={unix}&interval=1d
   ```
   - `period1`: start date as Unix timestamp
   - `period2`: current time as Unix timestamp
   - `interval`: `1d` (daily data points)

4. The request is executed via `execSync(curl ...)` with a 15-second timeout.

5. The response JSON is parsed. The chart data lives at `chart.result[0]`:
   - `timestamp[]` — Unix timestamps for each trading day
   - `indicators.quote[0].close[]` — closing prices (null entries are skipped)

6. Timestamps are converted to `YYYY-MM-DD` date strings, and each point becomes a `{ date, price }` object.

### ETF-to-Real-Price Scaling

**Problem:** GOLDBEES trades at ~60-70 INR per unit, but actual gold is ~8,000+ INR per gram. The ETF price represents a fraction of a gram, so the chart Y-axis values wouldn't match the price cards.

**Solution:** The client component scales all historical data points proportionally:

```typescript
const latestETF = history[history.length - 1].price;
const scale = currentPricePerGram / latestETF;

// Every data point is multiplied by the scale factor
scaledPrice = etfPrice × scale;
```

This ensures:
- The rightmost point on the chart matches the current per-gram price shown in the card above.
- Historical price movement (percentage changes) is preserved exactly, since all points are scaled by the same constant.
- The Y-axis shows real INR/gram values.

### Supported Time Ranges

| Range | Days Back | Start Date Calculation |
|-------|-----------|----------------------|
| 1M | 30 | `today - 30 days` |
| 3M | 90 | `today - 90 days` |
| 6M | 180 | `today - 180 days` |
| 1Y | 365 | `today - 365 days` |
| 3Y | 1095 | `today - 1095 days` |

Range-to-date mapping is in `src/lib/utils/calculations.ts` → `getDateForRange()`.

### Caching

The history API response is cached with:
```
Cache-Control: public, s-maxage=86400, stale-while-revalidate=3600
```
- Server cache: 24 hours
- Stale data served for up to 1 hour while revalidating

---

## 5. Purity Calculator

The calculator (`src/components/metals/PurityCalculator.tsx`) uses a simple formula:

```
weightInGrams = (unit === 'oz') ? weight × 31.1035 : weight
estimatedValue = weightInGrams × basePricePerGram × purityMultiplier
```

Where:
- `31.1035` is the troy ounce to grams conversion factor
- `basePricePerGram` is `gold24kPerGram` or `silver999PerGram` (passed from server)
- `purityMultiplier` comes from the selected purity in the dropdown

---

## 6. File Map

| File | Purpose |
|------|---------|
| `src/lib/api/metals.ts` | Core data fetching (3 sources) + historical data |
| `src/lib/constants/metals.ts` | Purity multipliers, troy ounce constant |
| `src/lib/utils/calculations.ts` | `percentChange()`, `getDateForRange()`, `ouncesToGrams()` |
| `src/lib/utils/format.ts` | `formatCurrency()` (INR formatting) |
| `src/app/metals/page.tsx` | Server page — fetches prices, renders layout |
| `src/app/metals/MetalsClient.tsx` | Client layout — tabs, cards grid, chart, calculator |
| `src/components/metals/MetalChart.tsx` | Chart component with ETF scaling |
| `src/components/metals/MetalPriceCard.tsx` | Individual price display card |
| `src/components/metals/PurityCalculator.tsx` | Interactive weight/purity calculator |
| `src/app/api/metals/latest/route.ts` | `GET /api/metals/latest` — current prices |
| `src/app/api/metals/history/route.ts` | `GET /api/metals/history` — chart data |

---

## 7. Environment Variables

| Variable | Required | Used By |
|----------|----------|---------|
| `GOLD_API_KEY` | No (only for fallback source 3) | `fetchGoldApi()` in `metals.ts` |

If `GOLD_API_KEY` is not set, source 3 is skipped entirely and the system relies on IBJA and Groww only.

---

## 8. Refresh Intervals

| Data | Revalidation | Location |
|------|-------------|----------|
| Current prices (page-level ISR) | 300s (5 min) | `src/app/metals/page.tsx` |
| Current prices (API fetch cache) | 300s (5 min) | `next.revalidate` in each fetch call |
| Historical chart data | 86400s (24 hr) | `Cache-Control` in history route |
| All schemes (used elsewhere) | 86400s (24 hr) | `next.revalidate` in `getAllSchemes()` |

---

## 9. Can Prices Be Updated Hourly?

**Yes — the current setup already supports sub-hourly updates.** The ISR revalidation is set to 300 seconds (5 minutes), meaning prices refresh every 5 minutes when the page is visited.

However, actual price movement depends on the source:

| Source | Update Frequency | Notes |
|--------|-----------------|-------|
| IBJA | Twice daily | AM rates ~12:00 PM IST, PM rates ~6:00 PM IST. Only on business days. |
| Groww | Real-time during market hours | Follows MCX/retail rates. MCX hours: Mon-Fri 9:00 AM – 11:30 PM IST. |
| Gold API | Near real-time | International spot, updates continuously (24/5). |

**On trading days:** IBJA will show the same rate until the next AM/PM publication. Groww and Gold API update more frequently. Since IBJA is the primary source and only publishes twice daily, hourly changes will only be visible if IBJA is down and the app falls through to Groww or Gold API.

**On holidays/weekends:** No Indian sources update. Gold API (international spot) still provides live data but is marked as estimated.

**To get hourly updates:** No code changes needed. The 5-minute ISR is already sufficient. The bottleneck is IBJA publishing only twice per day.

---

## 10. Known Issues & Troubleshooting

### Groww `goldMCXData` Removed (March 2026)

Groww restructured their `__NEXT_DATA__` and removed the `goldMCXData` field from their gold rates page. The code now falls back to `physicalGoldRate.india.price.TWENTY_FOUR` which provides per-gram prices including GST. This rate is ~2-3% higher than IBJA's ex-GST rate. The silver path (`silverItem.spotPrice`) is unaffected.

### Holiday/Weekend Fallback Behavior

Indian bullion markets close on national holidays (Holi, Diwali, Republic Day, etc.) and weekends. On these days, the cascading logic changes:

1. IBJA is fetched but its date is checked — if it's **not today**, the system treats it as stale and tries fallbacks first.
2. **Groww** is tried next for fresher retail rates.
3. **Gold API** is tried for live international spot prices.
4. If all live sources fail, the **stale IBJA data** is used as the final fallback (better to show yesterday's domestic rate than nothing).

This means on a holiday, users may see Groww or Gold API data (with appropriate source labeling) instead of stale IBJA data from the previous trading day.

### Dynamic Source Attribution in Header

The metals page header dynamically displays the active data source with its hyperlink and a tailored disclaimer:

| Source | Header Text |
|--------|-------------|
| IBJA | "Metal prices from [IBJA](https://ibjarates.com/). Prices exclude GST, local and state taxes, and jeweller markups." |
| Groww | "Metal prices from [Groww](https://groww.in/gold-rates). Prices exclude GST, local and state taxes, and jeweller markups." |
| Gold API | "Metal prices from [Gold API](https://www.goldapi.io/). Prices are international spot prices and exclude GST, import duties, jeweller markups etc." |

The source is determined by `prices.source` which is set by `getMetalPrices()` in `src/lib/api/metals.ts`. The footer always lists all three sources.

### Groww `goldMCXData` Path Change (March 2026)

Groww moved `goldMCXData` from `pageProps.goldRateData.goldMCXData` to `pageProps.goldMCXData` (one level up). The code checks both paths for backwards compatibility. The `physicalGoldRate.india` data (~2-3% higher, includes GST) is NOT used — only the MCX spot price.

### IBJA HTML Structure Changes

IBJA rates are extracted via regex from their HTML table. If IBJA redesigns their website, the regex will silently fail (returning `null`), and the app will fall through to Groww → Gold API. Monitor for this by checking if `source` in the API response changes unexpectedly.
