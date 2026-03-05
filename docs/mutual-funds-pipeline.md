# Mutual Funds — Data Pipeline & Architecture

This document covers how Aurentum fetches, classifies, caches, and displays mutual fund data.

---

## 1. External Data Source

All mutual fund data comes from **MFAPI** (`api.mfapi.in`) — a free, no-auth API with 60K+ schemes.

| Endpoint | Purpose | Response Size | Cache |
|----------|---------|---------------|-------|
| `/mf` | All scheme names + codes | ~5.7MB (37K+ schemes) | 24h |
| `/mf/search?q=...` | Search by name | Small | 24h |
| `/mf/{schemeCode}` | NAV history + fund meta | Varies | Market-hours-aware |

**Important**: The `/mf` endpoint exceeds Next.js fetch cache limits (~2MB). Server-side fetch caching is unreliable for this payload — all pages that need the full list use client-side fetching instead.

---

## 2. Core API Layer (`src/lib/api/mfapi.ts`)

| Function | Purpose | Revalidation |
|----------|---------|-------------|
| `getAllSchemes()` | Fetches all 60K+ schemes | 24h |
| `searchSchemes(query)` | Search by name | 24h |
| `getSchemeDetail(schemeCode)` | NAV history for one fund | Dynamic (see §5) |
| `filterDirectGrowth(schemes)` | Keeps only Direct Growth plans | N/A (pure filter) |

### Direct Growth Filtering

Only schemes with **"direct"** AND **("growth" or "gr")** in the name are shown. This removes Regular plans and Dividend/IDCW variants. Applied at:
- `/api/mutual-funds/list` route
- `/api/mutual-funds/search` route
- `/mutual-funds/search` page

---

## 3. Classification System

### Categories (`src/lib/constants/mf-categories.ts`)

Funds are classified using regex pattern matching on scheme names. **Order matters** — Index/ETFs and International are checked first to prevent misclassification (e.g., "Nifty Small Cap Index Fund" matching Equity > Small Cap).

**Classification order** (regex check order):
1. Index / ETFs → Nifty/Sensex, Other Index, ETFs
2. International → US, Global, Emerging
3. Equity → Large & Mid Cap, Large Cap, Mid Cap, Small Cap, Multi Cap, Flexi Cap, Value/Contra, Dividend Yield, Focused, ELSS, Sector/Thematic
4. Debt → Overnight, Liquid, Ultra Short, Money Market, various durations, Corporate Bond, Credit Risk, Banking & PSU, Gilt, Floater, Dynamic Bond
5. Hybrid → Aggressive, Conservative, Dynamic Asset Allocation, Multi Asset, Arbitrage, Equity Savings
6. Solution Oriented → Retirement, Children's
7. Fund of Funds → Domestic FoF

**Display order** (`CATEGORY_DISPLAY_ORDER`): Equity, Debt, Hybrid, Index/ETFs, Solution Oriented, International, Fund of Funds — different from classification order.

### AMC Extraction (`src/lib/constants/mf-amcs.ts`)

`extractAMC(schemeName)` uses regex to identify 47 major AMCs (SBI, HDFC, ICICI Prudential, Axis, Kotak, etc.). Returns "Other" for unrecognized names.

---

## 4. Client-Side Cache (`src/lib/cache/mf-list-cache.ts`)

The classified scheme list (~5.7MB) is fetched once and shared across all pages via an in-memory singleton cache.

```
fetchClassifiedSchemes()
  ├─ If _cache exists → return immediately (no network)
  ├─ If _promise exists → return existing in-flight request (dedup)
  └─ Otherwise → fetch /api/mutual-funds/list, store in _cache
```

**Consumers** (all call `fetchClassifiedSchemes()`):
- `MFBrowser` — landing page category tree + AMC list
- `CategoryPageClient` — category sub-pages
- `AMCPageClient` — AMC sub-pages
- `FundSearch` — autocomplete search (instant client-side filtering)

The first component to mount triggers the fetch; all others — including search — get instant results from cache. This means typing in the search bar after the landing page has loaded produces results with **zero network latency**.

---

## 5. Market-Hours-Aware Revalidation (`src/lib/utils/market-hours.ts`)

NAVs are published once daily after market close (~9-10 PM IST). Revalidation frequency adapts:

| Window | IST Hours | Day | `getNavRevalidate()` |
|--------|-----------|-----|---------------------|
| Active | 9 AM – 11 PM | Mon–Fri | 3600s (1 hour) |
| Inactive | 11 PM – 9 AM | Mon–Fri | 86400s (24 hours) |
| Inactive | All day | Sat–Sun | 86400s (24 hours) |

The active window extends to 11 PM to cover the NAV publication delay after 3:30 PM market close.

**Used by**: `getSchemeDetail()` fetch-level revalidation. The fund detail page has a fixed `revalidate = 3600` at the page level (minimum), with the fetch layer deciding whether to actually re-fetch.

### Market Closed Banner

On the fund detail page, if the latest NAV date is **>2 calendar days old**, `marketClosed = true`. This handles:
- Weekends: Friday NAV → Sunday is 2 days → OK. Friday → Monday with no new data = 3 days → banner shown.
- Holidays: same staleness logic, no hardcoded holiday calendar.

Banner text: *"Indian markets are closed today. Showing latest available NAV."*

---

## 6. API Routes (Server-Side)

### `/api/mutual-funds/list` — Classified Scheme List
- Calls `getAllSchemes()` → `filterDirectGrowth()` → `classifyFund()` per scheme
- Returns `ClassifiedScheme[]` (schemeCode, schemeName, category, subCategory)
- Revalidation: 24h
- **Primary data source for all browse/category/AMC pages**

### `/api/mutual-funds/search` — Search Endpoint
- Requires `?q=` param (min 2 chars)
- Calls `searchSchemes(q)` → `filterDirectGrowth()`
- Returns max 50 `MFSchemeBasic[]` results
- Used by `FundSearch` autocomplete (300ms debounce)

### `/api/mutual-funds/[schemeCode]` — Fund Detail
- Calls `getSchemeDetail(code)`
- Returns full `MFSchemeDetail` (meta + NAV history)
- Revalidation: 1h (page-level)

---

## 7. Page Architecture

### Landing Page (`/mutual-funds`)
```
page.tsx (server, static)
  └─ MFBrowser.tsx (client)
       ├─ fetchClassifiedSchemes() → single fetch
       ├─ CategoryTree (props: schemes)
       │    └─ Renders CATEGORY_DISPLAY_ORDER with counts
       │    └─ Expandable → links to /mutual-funds/category/[cat]/[sub]
       └─ AMCBrowser (props: schemes)
            └─ Top 5 AMCs by fund count + Show All toggle
            └─ Links to /mutual-funds/amc/[amc]
```

### Fund Detail (`/mutual-funds/[schemeCode]`)
```
page.tsx (server, ISR 1h)
  ├─ getSchemeDetail() → parse NAV data (DD-MM-YYYY → ISO)
  ├─ Calculate: currentNAV, 1Y/3Y/5Y returns (CAGR), 52W high/low
  ├─ Compute marketClosed flag
  └─ FundDetailClient.tsx (client)
       ├─ Market closed banner (conditional)
       ├─ 6 metric cards (NAV, returns, high/low)
       ├─ Time range selector (1M, 3M, 6M, 1Y, 3Y, 5Y, All)
       └─ PriceChart (lightweight-charts)
```

### Category Page (`/mutual-funds/category/[...slug]`)
```
page.tsx (server, extracts category + subCategory from slug)
  └─ CategoryPageClient.tsx (client)
       ├─ fetchClassifiedSchemes() → filter by category/subCategory
       └─ CategoryFundList.tsx (client)
            ├─ Search/filter input (real-time, case-insensitive)
            ├─ "X of Y funds" count
            └─ Fund links to /mutual-funds/[schemeCode]
```

### AMC Page (`/mutual-funds/amc/[amc]`)
```
page.tsx (server, extracts AMC name from param)
  └─ AMCPageClient.tsx (client)
       ├─ fetchClassifiedSchemes() → filter by extractAMC() match
       └─ Sorted fund list with links
```

### Search Results (`/mutual-funds/search?q=...`)
```
page.tsx (server)
  ├─ searchSchemes(q) → filterDirectGrowth()
  ├─ If no results → show POPULAR_FUNDS fallback (7 hardcoded)
  └─ Fund list with links
```

### Search Autocomplete (`FundSearch` component)
```
FundSearch.tsx (client, used on landing page)
  ├─ fetchClassifiedSchemes() → uses cached scheme list
  ├─ useMemo filters schemes client-side (case-insensitive includes, max 50)
  ├─ No debounce needed — filtering is synchronous and instant
  ├─ Dropdown with results (click → fund detail)
  └─ Enter key → navigate to /mutual-funds/search?q=...
```

**Why this is fast**: The search bar shares the same `fetchClassifiedSchemes()` cache as the category tree and AMC browser. Since `MFBrowser` fetches the list on page mount, by the time a user starts typing, the data is already cached. Filtering 10K+ schemes client-side via `useMemo` is near-instant — no network round-trips, no debounce delay.

---

## 8. Loading States

Every page has a `loading.tsx` skeleton:

| Page | Skeleton |
|------|----------|
| `/mutual-funds` | Title + search bar + card placeholder |
| `/mutual-funds/[schemeCode]` | Title + 5 metric cards + chart area |
| `/mutual-funds/search` | Back link + title + 10 fund rows |
| `/mutual-funds/category/[...slug]` | Back link + title + filter bar + 10 fund rows |

Client components (`MFBrowser`, `CategoryPageClient`, `AMCPageClient`) also have inline skeleton states while fetching the scheme list.

---

## 9. File Tree

```
src/
├── lib/
│   ├── api/mfapi.ts                          # MFAPI wrapper + interfaces
│   ├── constants/
│   │   ├── mf-categories.ts                  # Classification regex + display order
│   │   └── mf-amcs.ts                        # AMC extraction
│   ├── cache/mf-list-cache.ts                # Client-side singleton cache
│   └── utils/market-hours.ts                 # IST market hours + revalidation
├── app/
│   ├── api/mutual-funds/
│   │   ├── list/route.ts                     # Classified scheme list (24h)
│   │   ├── search/route.ts                   # Search endpoint
│   │   └── [schemeCode]/route.ts             # Fund detail
│   └── mutual-funds/
│       ├── page.tsx                           # Landing page
│       ├── loading.tsx                        # Landing skeleton
│       ├── error.tsx                          # Error boundary
│       ├── search/
│       │   ├── page.tsx                       # Search results
│       │   └── loading.tsx
│       ├── [schemeCode]/
│       │   ├── page.tsx                       # Fund detail (server)
│       │   ├── FundDetailClient.tsx           # Fund detail (client)
│       │   └── loading.tsx
│       ├── category/[...slug]/
│       │   ├── page.tsx                       # Category wrapper
│       │   ├── CategoryPageClient.tsx         # Category browser (client)
│       │   └── loading.tsx
│       └── amc/[amc]/
│           ├── page.tsx                       # AMC wrapper
│           └── AMCPageClient.tsx              # AMC browser (client)
└── components/mutual-funds/
    ├── FundSearch.tsx                          # Autocomplete search
    ├── MFBrowser.tsx                           # Landing page browser hub
    ├── CategoryTree.tsx                        # Expandable category tree
    ├── AMCBrowser.tsx                          # AMC list with counts
    └── CategoryFundList.tsx                    # Fund list with filter
```

---

## 10. Known Limitations & Future Fixes

- **Landing page load time**: The `/api/mutual-funds/list` response is ~5.7MB. Even with client-side caching, the initial fetch takes several seconds. See `future-fixes.md` for proposed optimizations (pre-computed summaries, pagination).
- **MFAPI cache warning**: The `/mf` endpoint exceeds Next.js fetch cache limits — expected and unavoidable.
- **Holiday detection**: No hardcoded Indian holiday calendar. Market-closed detection is purely staleness-based (NAV >2 days old).
- **NAV publication delay**: NAVs are published by AMCs at varying times after market close (6-11 PM IST). Some funds update later than others.
