# Mutual Fund Pages — Full Audit Report
Generated: 2026-03-03

## Executive Summary
- Pages audited: 12 files (9 page files + 3 supporting components + 4 API routes + 4 lib files)
- Critical issues: 5
- Warnings: 11
- Info: 6

## Page-by-Page Audit

### 1. `/mutual-funds` — Main Listing Page
**File:** `src/app/mutual-funds/page.tsx`
**Lines:** 37

#### Findings
- [INFO] Page is a server component that renders FundSearch, CategoryTree, and AMCBrowser client components. No data fetching happens here — all fetching is delegated to client components via API routes. (line 11)
- [WARNING] `PageTimestamp` receives `new Date().toISOString()` which shows the time the page was server-rendered, not the time data was last fetched. With `revalidate` not set on this page, the timestamp could be misleading on cached pages. (line 19)

---

### 2. `/mutual-funds/loading.tsx` — Loading State for MF Listing
**File:** `src/app/mutual-funds/loading.tsx`
**Lines:** 12

#### Findings
- [INFO] Clean skeleton loading state. Shows 1 skeleton for search bar and 1 large skeleton for content area. (all lines)
- [WARNING] The loading skeleton shows only 1 content block (h-[300px]), but the actual page has two sections (CategoryTree and AMCBrowser). The skeleton does not match the actual page layout, which creates a visual jump when content loads. (line 9)

---

### 3. `/mutual-funds/error.tsx` — Error Boundary for MF Section
**File:** `src/app/mutual-funds/error.tsx`
**Lines:** 23

#### Findings
- [INFO] Proper error boundary with retry button. The `error` parameter is destructured but unused (only `reset` is used), which is fine for a generic error display. (line 3-8)

---

### 4. `/mutual-funds/[schemeCode]` — Fund Detail (Server Component)
**File:** `src/app/mutual-funds/[schemeCode]/page.tsx`
**Lines:** 98

#### Findings
- [CRITICAL] `reduce()` called on potentially empty array without initial value. `findNAVDaysAgo()` calls `navData.reduce(...)` but does not provide an initial value. If `navData` is empty (all entries filtered out as NaN/zero), this will throw `TypeError: Reduce of empty array with no initial value`. The `navData.length > 0` guard on line 49 only protects `currentNAV`, not the `findNAVDaysAgo` calls on lines 67-69 which are always executed. (line 56-61)
```typescript
// PROBLEMATIC CODE (line 56-61):
const closest = navData.reduce((prev, curr) => {
  const prevDiff = Math.abs(new Date(prev.date).getTime() - targetTime);
  const currDiff = Math.abs(new Date(curr.date).getTime() - targetTime);
  return currDiff < prevDiff ? curr : prev;
});
```

- [CRITICAL] Return calculations are absolute returns, not annualized (CAGR). For 3Y and 5Y, the displayed percentage is the total absolute return, not the annualized return that investors typically expect. A 100% 5Y return displays as "+100.00%" when investors would expect to see the CAGR of ~14.87%. This is misleading for multi-year return periods. (lines 64-69)
```typescript
// CURRENT (absolute return):
const calcReturn = (pastNAV: number | undefined) =>
  pastNAV && pastNAV > 0 ? ((currentNAV - pastNAV) / pastNAV) * 100 : undefined;

// SHOULD BE (CAGR for multi-year):
// For 3Y: ((currentNAV/pastNAV)^(1/3) - 1) * 100
// For 5Y: ((currentNAV/pastNAV)^(1/5) - 1) * 100
```

- [WARNING] `parseInt(schemeCode, 10)` on line 23 does not validate for NaN. If a user visits `/mutual-funds/abc`, `code` will be NaN, and `getSchemeDetail(NaN)` will be called, resulting in a fetch to `https://api.mfapi.in/mf/NaN`. The API will return an error, and the page will show "Fund not found" — which is acceptable but wasteful. (line 23)

- [WARNING] `latestDate` is set to `new Date().toISOString()` (server render time) rather than the actual latest date from the NAV data (`navData[navData.length - 1].date`). The actual latest NAV date is computed on line 81 but is not passed to the component. (line 94)
```typescript
// CURRENT (line 94):
latestDate={new Date().toISOString()}

// SHOULD BE:
latestDate={latestDate}  // uses the variable computed on line 81
```

- [WARNING] Date parsing assumes DD-MM-YYYY format from MFAPI. If the API ever changes its date format, all parsing will silently produce invalid dates. There is no validation that the parsed ISO date is actually valid. (lines 39-41)

- [INFO] The `filter((d) => !isNaN(d.nav) && d.nav > 0)` on line 46 correctly filters out zero and invalid NAVs. This handles the zero NAV case found in Axis Large Cap (120465). (line 46)

---

### 5. `/mutual-funds/[schemeCode]` — Fund Detail (Client Component)
**File:** `src/app/mutual-funds/[schemeCode]/FundDetailClient.tsx`
**Lines:** 132

#### Findings
- [WARNING] Chart handles empty data correctly (line 122-128 shows "No NAV data available" message), but a single data point will render a chart with just a dot — no line. This is a minor UX issue but not a crash. (line 122)

- [WARNING] The `high52W` check uses `{high52W ? formatNumber(high52W, 2) : '--'}` but this will show '--' if `high52W` is exactly 0 (falsy). While a NAV of 0 is filtered out earlier, using `high52W !== undefined` would be more semantically correct. Same for `low52W`. (lines 105, 110)
```typescript
// CURRENT:
{high52W ? formatNumber(high52W, 2) : '--'}

// SAFER:
{high52W !== undefined ? formatNumber(high52W, 2) : '--'}
```

- [INFO] Time range selector correctly includes all expected ranges: 1M, 3M, 6M, 1Y, 3Y, 5Y, All. The `getDateForRange` function handles all of these. (line 15)

- [INFO] Chart filtering uses string comparison `d.date >= startDate` which works correctly because dates are in ISO format (YYYY-MM-DD) after server-side parsing. (line 53)

---

### 6. `/mutual-funds/[schemeCode]/loading.tsx` — Loading State for Fund Detail
**File:** `src/app/mutual-funds/[schemeCode]/loading.tsx`
**Lines:** 16

#### Findings
- [WARNING] Loading skeleton renders 5 metric cards in a `lg:grid-cols-5` grid, but the actual FundDetailClient renders 6 metric cards (NAV, 1Y, 3Y, 5Y, 52W High, 52W Low) in a `lg:grid-cols-6` grid. This creates a visual layout shift when the content loads. (line 8-12)
```typescript
// LOADING (5 cards, lg:grid-cols-5):
<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
  {[1, 2, 3, 4, 5].map((i) => (

// ACTUAL (6 cards, lg:grid-cols-6):
<div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
```

---

### 7. `/mutual-funds/category/[...slug]` — Category Browsing Page
**File:** `src/app/mutual-funds/category/[...slug]/page.tsx`
**Lines:** 78

#### Findings
- [CRITICAL] The classification system is incomplete and has ordering issues. The `classifyFund()` function uses regex pattern matching with first-match-wins logic. This means:
  1. A fund named "SBI Nifty Small Cap 250 Index Fund" will match "Small Cap" (Equity) before "Nifty / Sensex" (Index/ETFs) because Equity is checked first.
  2. Missing SEBI categories: Large & Mid Cap, Multi Cap (separate from Flexi Cap), Value/Contra, Dividend Yield, Focused Fund, Credit Risk, Banking & PSU, Medium Duration, Medium to Long Duration, Long Duration, Overnight, Money Market, Floater.
  3. Many legitimate fund types fall into "Other/Uncategorized" (FoFs, Solution Oriented, Retirement funds, Children's funds).
  (via `classifyFund` in `src/lib/constants/mf-categories.ts` lines 58-67)

- [WARNING] Performance concern: `getAllSchemes()` fetches the entire MFAPI `/mf` endpoint (>7MB, 60K+ schemes), then filters and classifies all of them on every page load. Although `revalidate: 86400` caches the response, the in-memory classification of 60K+ schemes still happens for each unique category URL request. (lines 24-37)

- [WARNING] No loading state — since this is a server component with a potentially slow `getAllSchemes()` call, users may see a blank/hanging page. The parent `loading.tsx` covers the `/mutual-funds` route but Next.js does not automatically show it for nested catch-all routes like `/mutual-funds/category/[...slug]`. There is no `loading.tsx` in the category directory. (missing file)

---

### 8. `/mutual-funds/amc/[amc]` — AMC Browsing Page
**File:** `src/app/mutual-funds/amc/[amc]/page.tsx`
**Lines:** 65

#### Findings
- [WARNING] Same performance concern as category page: fetches and processes all 60K+ schemes to filter by AMC. (lines 21-26)

- [WARNING] URL encoding/decoding could cause mismatches. The AMCBrowser component uses `encodeURIComponent(amc.name)` to create links, and the page uses `decodeURIComponent(amc)` to read the param. However, `extractAMC()` is applied to the scheme name from the full list, and the result is compared to the decoded URL param. If there are any encoding edge cases (e.g., AMC names with `&`, `+`, or special characters like "Baroda BNP Paribas"), the comparison should still work because both sides go through the same `extractAMC()` function. No actual bug found, but fragile. (lines 19, 25)

- [WARNING] No loading state for this server-rendered page. Missing `loading.tsx` in the `amc/[amc]` directory. (missing file)

---

### 9. `/` — Dashboard (POPULAR_FUNDS section)
**File:** `src/app/page.tsx`
**Lines:** 289

#### Findings
- [CRITICAL] Hardcoded `shortName` values are stale/inaccurate for 3 of 5 funds. The MFAPI returns different names than what is displayed:
  - `119598`: Dashboard shows "SBI Bluechip" but MFAPI name is "SBI Large Cap FUND" (fund was renamed)
  - `118989`: Dashboard shows "HDFC Mid-Cap Opportunities" but MFAPI name is "HDFC Mid Cap Fund" (fund was renamed)
  - `120465`: Dashboard shows "Axis Bluechip" but MFAPI name is "Axis Large Cap Fund" (fund was renamed)
  (lines 21-26)
```typescript
// CURRENT:
const POPULAR_FUNDS = [
  { schemeCode: 125497, shortName: 'SBI Small Cap' },
  { schemeCode: 119598, shortName: 'SBI Bluechip' },          // WRONG: now "SBI Large Cap"
  { schemeCode: 118989, shortName: 'HDFC Mid-Cap Opportunities' }, // WRONG: now "HDFC Mid Cap"
  { schemeCode: 118668, shortName: 'Nippon India Growth' },    // OK-ish: full name is "Nippon India Growth Mid Cap Fund"
  { schemeCode: 120465, shortName: 'Axis Bluechip' },          // WRONG: now "Axis Large Cap"
];

// SUGGESTED FIX:
const POPULAR_FUNDS = [
  { schemeCode: 125497, shortName: 'SBI Small Cap' },
  { schemeCode: 119598, shortName: 'SBI Large Cap' },
  { schemeCode: 118989, shortName: 'HDFC Mid Cap' },
  { schemeCode: 118668, shortName: 'Nippon India Growth Mid Cap' },
  { schemeCode: 120465, shortName: 'Axis Large Cap' },
];
```

- [WARNING] Non-null assertions (`fund!.schemeCode`, `fund!.shortName`, etc.) used on lines 227-237. After the `.filter(Boolean)` on line 63, TypeScript narrows the type, but the JSX still uses `!` assertions. This is technically safe because `filter(Boolean)` removes nulls, but the TypeScript type is `(object | null)[]` — the `!` assertions are needed because `filter(Boolean)` does not narrow the type properly without a type guard. A type-safe alternative would be `filter((f): f is NonNullable<typeof f> => Boolean(f))`. (lines 227-237)

- [INFO] 1-day change calculation uses `detail.data[0]` (latest) and `detail.data[1]` (previous trading day), which is correct per MFAPI's reverse-chronological order. (lines 52-54)

---

### 10. `src/lib/api/mfapi.ts` — MFAPI Helper Functions
**File:** `src/lib/api/mfapi.ts`
**Lines:** 51

#### Findings
- [CRITICAL] No response validation. `getSchemeDetail()`, `searchSchemes()`, and `getAllSchemes()` all call `res.json()` without validating the response structure. If MFAPI returns an unexpected shape (e.g., `{"status": "ERROR"}` or malformed JSON), the app will crash with cryptic errors downstream. (lines 27, 35, 43)
```typescript
// CURRENT (line 43):
return res.json();

// SAFER:
const data = await res.json();
if (!data?.meta || !Array.isArray(data?.data)) return null;
return data as MFSchemeDetail;
```

- [WARNING] `filterDirectGrowth()` uses a simple string check for 'direct' and ('growth' or 'gr'). This could match false positives like fund names containing the word "graded" or "gradient". Also, some Direct Growth plans might use different naming conventions. However, in practice this works well for MFAPI data. (lines 47-50)

---

### 11. API Routes — Mutual Fund Routes
**File:** `src/app/api/mutual-funds/search/route.ts` (18 lines)
**File:** `src/app/api/mutual-funds/list/route.ts` (22 lines)
**File:** `src/app/api/mutual-funds/[schemeCode]/route.ts` (29 lines)

#### Findings
- [INFO] Search API correctly validates minimum query length of 2 characters. (search/route.ts line 6)
- [INFO] SchemeCode API validates for NaN and returns proper 400 status. (schemeCode/route.ts line 12)
- [WARNING] No rate limiting on any API route. The search API proxies to MFAPI's search endpoint, which could be abused. The list API fetches and processes 60K+ schemes. (all routes)
- [INFO] Error handling returns empty arrays or 500 errors appropriately. (all routes)

---

### 12. Components — FundSearch, CategoryTree, AMCBrowser
**File:** `src/components/mutual-funds/FundSearch.tsx` (79 lines)
**File:** `src/components/mutual-funds/CategoryTree.tsx` (93 lines)
**File:** `src/components/mutual-funds/AMCBrowser.tsx` (76 lines)

#### Findings
- [INFO] FundSearch implements proper debouncing (300ms), click-outside-to-close, and keyboard-accessible links. No XSS risk because React escapes rendered text. (FundSearch.tsx)
- [INFO] CategoryTree and AMCBrowser both fetch from `/api/mutual-funds/list` independently, causing two identical API calls on the mutual funds page. Both components make the same fetch request when the page mounts. (CategoryTree.tsx line 22, AMCBrowser.tsx line 19)
- [WARNING] Both CategoryTree and AMCBrowser make duplicate fetch calls to `/api/mutual-funds/list`. This means the browser makes 2 identical requests to the same endpoint, each processing 60K+ schemes. These should share a single data source (e.g., via React context, SWR, or lifting the fetch to a parent). (CategoryTree.tsx line 22, AMCBrowser.tsx line 19)

---

### 13. PriceChart Component
**File:** `src/components/charts/PriceChart.tsx` (82 lines)

#### Findings
- [INFO] Correctly uses lightweight-charts v5 API: `chart.addSeries(AreaSeries, opts)`. (line 55)
- [INFO] `lineWidth: 2` is an integer, which is correct for lightweight-charts v5 (requires `LineWidth` type which is integer-only). (line 59)
- [INFO] Proper cleanup: removes resize listener and calls `chart.remove()` in useEffect cleanup. (lines 74-78)
- [INFO] Empty data is handled by the parent (FundDetailClient) which checks `chartData.length > 0` before rendering the chart. The chart itself does not guard against empty data, but it does not need to. (line 62)

---

## Live Data Validation

### Fund: SBI Small Cap (Code: 125497)
- **MFAPI Name:** SBI Small Cap Fund - Direct Plan - Growth
- **Total NAV entries:** 3031
- **Date range:** 2013-11-18 to 2026-03-02
- **Zero NAVs:** 0
- **Current NAV:** 181.3175 (as of 2026-03-02)
- **Simulated Returns:**
  - 1Y: +8.88% (from NAV 166.5363 on 2025-03-03)
  - 3Y: +46.29% (from NAV 123.9481 on 2023-03-03)
  - 5Y: +104.90% (from NAV 88.4923 on 2021-03-03)
- **Anomalies:** None. Dashboard shortName "SBI Small Cap" is accurate.

### Fund: SBI Large Cap (Code: 119598)
- **MFAPI Name:** SBI Large Cap FUND-DIRECT PLAN -GROWTH
- **Total NAV entries:** 3247
- **Date range:** 2013-01-02 to 2026-03-02
- **Zero NAVs:** 0
- **Current NAV:** 104.2302 (as of 2026-03-02)
- **Simulated Returns:**
  - 1Y: +16.20% (from NAV 89.6964 on 2025-03-03)
  - 3Y: +52.95% (from NAV 68.1456 on 2023-03-03)
  - 5Y: +79.31% (from NAV 58.1284 on 2021-03-03)
- **Anomalies:** Dashboard shortName "SBI Bluechip" is STALE. Fund was renamed to "SBI Large Cap".

### Fund: HDFC Mid Cap (Code: 118989)
- **MFAPI Name:** HDFC Mid Cap Fund - Growth Option - Direct Plan
- **Total NAV entries:** 3240
- **Date range:** 2013-01-01 to 2026-03-02
- **Zero NAVs:** 0
- **Current NAV:** 220.177 (as of 2026-03-02)
- **Simulated Returns:**
  - 1Y: +23.23% (from NAV 178.67 on 2025-03-03)
  - 3Y: +100.32% (from NAV 109.912 on 2023-03-03)
  - 5Y: +172.53% (from NAV 80.789 on 2021-03-03)
- **Anomalies:** Dashboard shortName "HDFC Mid-Cap Opportunities" is STALE. Fund was renamed to "HDFC Mid Cap Fund".

### Fund: Nippon India Growth Mid Cap (Code: 118668)
- **MFAPI Name:** Nippon India Growth Mid Cap Fund - Direct Plan Growth Plan - Growth Option
- **Total NAV entries:** 3239
- **Date range:** 2013-01-02 to 2026-03-02
- **Zero NAVs:** 0
- **Current NAV:** 4668.7488 (as of 2026-03-02)
- **Simulated Returns:**
  - 1Y: +24.61% (from NAV 3746.7326 on 2025-03-03)
  - 3Y: +103.67% (from NAV 2292.3 on 2023-03-03)
  - 5Y: +172.94% (from NAV 1710.5181 on 2021-03-03)
- **Anomalies:** Dashboard shortName "Nippon India Growth" is slightly incomplete (missing "Mid Cap").

### Fund: Axis Large Cap (Code: 120465)
- **MFAPI Name:** Axis Large Cap Fund - Direct Plan - Growth
- **Total NAV entries:** 3247
- **Date range:** 2013-01-02 to 2026-03-02
- **Zero NAVs:** 1 (on 2013-04-07, value "0.00000")
- **Current NAV:** 69.16 (as of 2026-03-02)
- **Simulated Returns:**
  - 1Y: +11.51% (from NAV 62.02 on 2025-03-03)
  - 3Y: +46.18% (from NAV 47.31 on 2023-03-03)
  - 5Y: +56.65% (from NAV 44.15 on 2021-03-03)
- **Anomalies:** Dashboard shortName "Axis Bluechip" is STALE. Fund was renamed to "Axis Large Cap". Also has 1 zero NAV entry (handled by the filter on page.tsx line 46).

---

## Cross-Cutting Issues

### 1. No Annualized Returns (CAGR)
The return calculation in `[schemeCode]/page.tsx` computes absolute returns for all periods. For 1Y this is acceptable (though technically should be annualized for partial years), but for 3Y and 5Y, industry standard is to show CAGR (Compound Annual Growth Rate). A 3Y return of +100% displayed as "+100.00%" is misleading — the CAGR is ~26%.

### 2. Duplicate API Calls
Both `CategoryTree` and `AMCBrowser` independently fetch `/api/mutual-funds/list` when the mutual funds page loads. This results in two identical network requests, each returning 60K+ classified schemes.

### 3. Missing Loading States for Nested Routes
The `/mutual-funds/category/[...slug]` and `/mutual-funds/amc/[amc]` pages are server components that make slow API calls but have no dedicated `loading.tsx` files. Users visiting these pages may experience a blank screen while the server processes 60K+ schemes.

### 4. `reduce()` Without Initial Value
The `findNAVDaysAgo` function in `[schemeCode]/page.tsx` calls `navData.reduce()` without an initial value. While `navData` is filtered to have `nav > 0` entries, it is theoretically possible (for a very new fund or API error) for `navData` to be empty after filtering, which would throw a runtime error.

### 5. Stale Hardcoded Fund Names
3 of 5 popular fund shortNames on the dashboard are outdated. These funds have been renamed by their AMCs, but the hardcoded shortNames in `src/app/page.tsx` still use the old names.

### 6. Incomplete SEBI Category Classification
The `classifyFund()` function covers only a subset of SEBI mutual fund categories. Missing categories include: Large & Mid Cap, Multi Cap, Value/Contra, Dividend Yield, Focused, Credit Risk, Banking & PSU, Medium Duration, Medium to Long Duration, Long Duration, Overnight, Money Market, Floater, Solution Oriented, and Fund of Funds. Many legitimate fund types will be classified as "Other/Uncategorized".

---

## Issue Index (Machine-Readable)

### ISSUE-001
- **Severity:** CRITICAL
- **File:** `src/app/mutual-funds/[schemeCode]/page.tsx`
- **Line(s):** 56-61
- **Category:** CALCULATION
- **Title:** `reduce()` on potentially empty array without initial value
- **Description:** The `findNAVDaysAgo()` function calls `navData.reduce(...)` without providing an initial value. If `navData` is empty after filtering (all NAVs are zero or NaN), this will throw `TypeError: Reduce of empty array with no initial value`. The guard `navData.length > 0` on line 49 only protects `currentNAV`, but `findNAVDaysAgo` is called unconditionally on lines 67-69.
- **Impact:** Runtime crash (500 error) for funds where all NAV data is invalid or empty.
- **Current Code:**
```typescript
const findNAVDaysAgo = (days: number) => {
  const target = new Date();
  target.setDate(target.getDate() - days);
  const targetTime = target.getTime();
  const closest = navData.reduce((prev, curr) => {
    const prevDiff = Math.abs(new Date(prev.date).getTime() - targetTime);
    const currDiff = Math.abs(new Date(curr.date).getTime() - targetTime);
    return currDiff < prevDiff ? curr : prev;
  });
  return closest?.nav;
};

const return1Y = calcReturn(findNAVDaysAgo(365));
const return3Y = calcReturn(findNAVDaysAgo(1095));
const return5Y = calcReturn(findNAVDaysAgo(1825));
```
- **Suggested Fix:**
```typescript
const findNAVDaysAgo = (days: number) => {
  if (navData.length === 0) return undefined;
  const target = new Date();
  target.setDate(target.getDate() - days);
  const targetTime = target.getTime();
  const closest = navData.reduce((prev, curr) => {
    const prevDiff = Math.abs(new Date(prev.date).getTime() - targetTime);
    const currDiff = Math.abs(new Date(curr.date).getTime() - targetTime);
    return currDiff < prevDiff ? curr : prev;
  });
  return closest?.nav;
};
```

### ISSUE-002
- **Severity:** CRITICAL
- **File:** `src/app/mutual-funds/[schemeCode]/page.tsx`
- **Line(s):** 64-69
- **Category:** CALCULATION
- **Title:** Returns are absolute, not annualized (CAGR), for multi-year periods
- **Description:** The `calcReturn` function computes simple absolute percentage return for all periods (1Y, 3Y, 5Y). For 3Y and 5Y, the industry standard is to show CAGR (Compound Annual Growth Rate). Showing absolute returns for multi-year periods is misleading — e.g., a 5Y return of +172% displays as "+172.00%" when the CAGR is ~22%.
- **Impact:** Users see misleadingly large return percentages for 3Y and 5Y periods, inconsistent with how mutual fund returns are presented industry-wide (AMC websites, Morningstar, ValueResearch all show CAGR).
- **Current Code:**
```typescript
const calcReturn = (pastNAV: number | undefined) =>
  pastNAV && pastNAV > 0 ? ((currentNAV - pastNAV) / pastNAV) * 100 : undefined;

const return1Y = calcReturn(findNAVDaysAgo(365));
const return3Y = calcReturn(findNAVDaysAgo(1095));
const return5Y = calcReturn(findNAVDaysAgo(1825));
```
- **Suggested Fix:**
```typescript
const calcReturn = (pastNAV: number | undefined, years: number) => {
  if (!pastNAV || pastNAV <= 0) return undefined;
  if (years <= 1) {
    // Simple return for 1Y and below
    return ((currentNAV - pastNAV) / pastNAV) * 100;
  }
  // CAGR for multi-year periods
  return (Math.pow(currentNAV / pastNAV, 1 / years) - 1) * 100;
};

const return1Y = calcReturn(findNAVDaysAgo(365), 1);
const return3Y = calcReturn(findNAVDaysAgo(1095), 3);
const return5Y = calcReturn(findNAVDaysAgo(1825), 5);
```

### ISSUE-003
- **Severity:** CRITICAL
- **File:** `src/app/page.tsx`
- **Line(s):** 20-26
- **Category:** DATA
- **Title:** Hardcoded fund shortNames are stale for 3 of 5 funds
- **Description:** The `POPULAR_FUNDS` array has hardcoded `shortName` values that no longer match the actual fund names returned by MFAPI. Three funds have been renamed by their respective AMCs:
  - `119598`: "SBI Bluechip" is now "SBI Large Cap"
  - `118989`: "HDFC Mid-Cap Opportunities" is now "HDFC Mid Cap"
  - `120465`: "Axis Bluechip" is now "Axis Large Cap"
- **Impact:** Users see incorrect fund names on the dashboard, which could cause confusion or erode trust in the data accuracy.
- **Current Code:**
```typescript
const POPULAR_FUNDS = [
  { schemeCode: 125497, shortName: 'SBI Small Cap' },
  { schemeCode: 119598, shortName: 'SBI Bluechip' },
  { schemeCode: 118989, shortName: 'HDFC Mid-Cap Opportunities' },
  { schemeCode: 118668, shortName: 'Nippon India Growth' },
  { schemeCode: 120465, shortName: 'Axis Bluechip' },
];
```
- **Suggested Fix:**
```typescript
const POPULAR_FUNDS = [
  { schemeCode: 125497, shortName: 'SBI Small Cap' },
  { schemeCode: 119598, shortName: 'SBI Large Cap' },
  { schemeCode: 118989, shortName: 'HDFC Mid Cap' },
  { schemeCode: 118668, shortName: 'Nippon India Growth Mid Cap' },
  { schemeCode: 120465, shortName: 'Axis Large Cap' },
];
```

### ISSUE-004
- **Severity:** CRITICAL
- **File:** `src/lib/api/mfapi.ts`
- **Line(s):** 27, 35, 43
- **Category:** API
- **Title:** No response validation on MFAPI responses
- **Description:** All three fetch functions (`searchSchemes`, `getAllSchemes`, `getSchemeDetail`) return `res.json()` without validating the response structure. If MFAPI returns an unexpected shape (e.g., `{"status":"ERROR"}`, HTML error page parsed as JSON, or a schema change), downstream code will crash with unhelpful errors.
- **Impact:** Unhandled runtime errors throughout the app when MFAPI returns unexpected responses. Could cause 500 errors on any mutual fund page.
- **Current Code:**
```typescript
export async function getSchemeDetail(schemeCode: number): Promise<MFSchemeDetail | null> {
  const res = await fetch(`${BASE_URL}/mf/${schemeCode}`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) return null;
  return res.json();
}
```
- **Suggested Fix:**
```typescript
export async function getSchemeDetail(schemeCode: number): Promise<MFSchemeDetail | null> {
  try {
    const res = await fetch(`${BASE_URL}/mf/${schemeCode}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.meta?.scheme_code || !Array.isArray(data?.data)) return null;
    return data as MFSchemeDetail;
  } catch {
    return null;
  }
}
```

### ISSUE-005
- **Severity:** CRITICAL
- **File:** `src/lib/constants/mf-categories.ts`
- **Line(s):** 9-67
- **Category:** CLASSIFICATION
- **Title:** Incomplete SEBI category classification with ordering bugs
- **Description:** The `classifyFund()` function uses first-match-wins regex matching against fund names but is missing many SEBI categories and has ordering issues:
  1. **Missing categories:** Large & Mid Cap, Multi Cap (distinct from Flexi Cap), Value/Contra, Dividend Yield, Focused Fund, Credit Risk, Banking & PSU, Medium Duration, Medium to Long Duration, Long Duration, Overnight, Money Market, Floater, Solution Oriented, Fund of Funds, Children's Fund, Retirement Fund.
  2. **Ordering bug:** "SBI Nifty Small Cap 250 Index Fund" matches "Small Cap" (Equity) instead of "Index" because Equity patterns are checked first. Index/ETF patterns should be checked before specific equity sub-types.
  3. **Catch-all "Other":** Many legitimate fund types are silently classified as "Other/Uncategorized".
- **Impact:** Users browsing by category will miss many funds. Some index funds appear under equity sub-categories instead of Index/ETFs. The category tree shows incorrect counts.
- **Current Code:**
```typescript
export const MF_CATEGORIES: MFCategoryDef[] = [
  {
    name: 'Equity',
    subCategories: [
      { name: 'Large Cap', pattern: /large\s*cap/i },
      // ...
    ],
  },
  // ... Debt, Hybrid, Index/ETFs, International
];

export function classifyFund(schemeName: string): { category: string; subCategory: string } {
  for (const cat of MF_CATEGORIES) {
    for (const sub of cat.subCategories) {
      if (sub.pattern.test(schemeName)) {
        return { category: cat.name, subCategory: sub.name };
      }
    }
  }
  return { category: 'Other', subCategory: 'Uncategorized' };
}
```
- **Suggested Fix:**
```typescript
// 1. Move Index/ETFs BEFORE Equity in the array so index funds match first
// 2. Add missing categories:
export const MF_CATEGORIES: MFCategoryDef[] = [
  {
    name: 'Index / ETFs',  // CHECK FIRST
    subCategories: [
      { name: 'Nifty / Sensex', pattern: /nifty|sensex|s&p\s*bse/i },
      { name: 'Other Index', pattern: /index/i },
      { name: 'ETFs', pattern: /etf/i },
    ],
  },
  {
    name: 'Equity',
    subCategories: [
      { name: 'Large & Mid Cap', pattern: /large\s*(&|and)\s*mid\s*cap/i },
      { name: 'Large Cap', pattern: /large\s*cap|bluechip/i },
      { name: 'Mid Cap', pattern: /mid\s*cap/i },
      { name: 'Small Cap', pattern: /small\s*cap/i },
      { name: 'Multi Cap', pattern: /multi\s*cap/i },
      { name: 'Flexi Cap', pattern: /flexi\s*cap/i },
      { name: 'Value / Contra', pattern: /value|contra/i },
      { name: 'Dividend Yield', pattern: /dividend\s*yield/i },
      { name: 'Focused', pattern: /focused/i },
      { name: 'ELSS', pattern: /elss|tax\s*sav/i },
      { name: 'Sector / Thematic', pattern: /sector|themat|pharma|banking|tech|infra|consumption|energy|psu|mnc|commodit/i },
    ],
  },
  // ... add remaining missing categories
];
```

### ISSUE-006
- **Severity:** WARNING
- **File:** `src/app/mutual-funds/[schemeCode]/page.tsx`
- **Line(s):** 94
- **Category:** DATA
- **Title:** `latestDate` prop passes server render time instead of actual latest NAV date
- **Description:** The `latestDate` prop is set to `new Date().toISOString()` (server render time) instead of the computed `latestDate` variable from line 81 which contains the actual latest NAV date from the data.
- **Impact:** The "Last updated" timestamp shows when the page was rendered rather than when the NAV was last updated, which could be misleading (especially with caching enabled via `revalidate: 3600`).
- **Current Code:**
```typescript
latestDate={new Date().toISOString()}
```
- **Suggested Fix:**
```typescript
latestDate={latestDate}
```

### ISSUE-007
- **Severity:** WARNING
- **File:** `src/app/mutual-funds/[schemeCode]/loading.tsx`
- **Line(s):** 8-12
- **Category:** UI
- **Title:** Loading skeleton grid mismatch with actual content layout
- **Description:** The loading skeleton renders 5 cards in a `lg:grid-cols-5` grid, but the actual FundDetailClient renders 6 metric cards in a `lg:grid-cols-6` grid. Additionally, the skeleton uses `sm:grid-cols-2` while the actual uses `grid-cols-2 sm:grid-cols-3`.
- **Impact:** Visual layout shift (CLS) when content loads — the grid jumps from 5 columns to 6 columns.
- **Current Code:**
```typescript
<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
  {[1, 2, 3, 4, 5].map((i) => (
    <Skeleton key={i} className="h-20 rounded-xl" />
  ))}
</div>
```
- **Suggested Fix:**
```typescript
<div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
  {[1, 2, 3, 4, 5, 6].map((i) => (
    <Skeleton key={i} className="h-20 rounded-xl" />
  ))}
</div>
```

### ISSUE-008
- **Severity:** WARNING
- **File:** `src/app/mutual-funds/loading.tsx`
- **Line(s):** 9
- **Category:** UI
- **Title:** Loading skeleton does not match actual page layout
- **Description:** The loading page shows a single 300px tall skeleton, but the actual page has two sections: "Browse by Category" and "Browse by AMC". The skeleton should show two content blocks.
- **Impact:** Minor visual shift when content loads.
- **Current Code:**
```typescript
<Skeleton className="mb-6 h-10 w-full rounded-lg" />
<Skeleton className="h-[300px] w-full rounded-xl" />
```
- **Suggested Fix:**
```typescript
<Skeleton className="mb-6 h-10 w-full rounded-lg" />
<Skeleton className="mb-6 h-[300px] w-full rounded-xl" />
<Skeleton className="h-[200px] w-full rounded-xl" />
```

### ISSUE-009
- **Severity:** WARNING
- **File:** `src/components/mutual-funds/CategoryTree.tsx` and `src/components/mutual-funds/AMCBrowser.tsx`
- **Line(s):** CategoryTree.tsx:22, AMCBrowser.tsx:19
- **Category:** API
- **Title:** Duplicate API calls to `/api/mutual-funds/list`
- **Description:** Both `CategoryTree` and `AMCBrowser` independently call `fetch('/api/mutual-funds/list')` when they mount. Since they are both rendered on the same page (`/mutual-funds`), this results in two identical network requests to the same endpoint, each returning and processing 60K+ classified schemes.
- **Impact:** Doubled network traffic and processing for the mutual funds listing page. Each request processes 60K+ schemes through the `classifyFund()` function.
- **Current Code:**
```typescript
// CategoryTree.tsx line 22:
fetch('/api/mutual-funds/list')
  .then((res) => res.json())
  .then((data: CategorizedScheme[]) => setSchemes(data))

// AMCBrowser.tsx line 19:
fetch('/api/mutual-funds/list')
  .then((res) => res.json())
  .then((data: Scheme[]) => setSchemes(data))
```
- **Suggested Fix:**
Lift the data fetching to the parent page and pass data as props, or use a shared data fetching hook (e.g., SWR or React Query) that deduplicates identical requests:
```typescript
// Option 1: Use SWR (auto-deduplicates)
import useSWR from 'swr';
const { data } = useSWR('/api/mutual-funds/list', fetcher);

// Option 2: Lift to parent and pass as props
// In page.tsx, fetch the data once and pass to both components
```

### ISSUE-010
- **Severity:** WARNING
- **File:** `src/app/mutual-funds/[schemeCode]/FundDetailClient.tsx`
- **Line(s):** 105, 110
- **Category:** UI
- **Title:** Falsy check on `high52W`/`low52W` would hide zero values
- **Description:** The code uses `{high52W ? formatNumber(high52W, 2) : '--'}` which treats zero as falsy. While zero NAVs are filtered out in the server component, using strict comparison is more robust and semantically correct.
- **Impact:** If a fund's 52W high or low were ever exactly 0 (unlikely after filtering), it would show '--' instead of '0.00'.
- **Current Code:**
```typescript
{high52W ? formatNumber(high52W, 2) : '--'}
{low52W ? formatNumber(low52W, 2) : '--'}
```
- **Suggested Fix:**
```typescript
{high52W !== undefined ? formatNumber(high52W, 2) : '--'}
{low52W !== undefined ? formatNumber(low52W, 2) : '--'}
```

### ISSUE-011
- **Severity:** WARNING
- **File:** `src/app/page.tsx`
- **Line(s):** 227-237
- **Category:** UI
- **Title:** Non-null assertions on filtered fund cards
- **Description:** The JSX uses `fund!.schemeCode`, `fund!.shortName`, etc. after `filter(Boolean)`. While this is safe at runtime (nulls are filtered out), TypeScript's `filter(Boolean)` does not narrow the type. Using a proper type guard would be cleaner.
- **Impact:** No runtime impact, but indicates weak type safety.
- **Current Code:**
```typescript
data.fundCards.map((fund) => (
  <Link key={fund!.schemeCode} href={`/mutual-funds/${fund!.schemeCode}`}>
```
- **Suggested Fix:**
```typescript
// Change the filter to use a type guard:
.filter((f): f is NonNullable<typeof f> => Boolean(f));

// Then in JSX, no ! needed:
data.fundCards.map((fund) => (
  <Link key={fund.schemeCode} href={`/mutual-funds/${fund.schemeCode}`}>
```

### ISSUE-012
- **Severity:** WARNING
- **File:** `src/app/mutual-funds/category/[...slug]/page.tsx`
- **Line(s):** (missing file)
- **Category:** UI
- **Title:** No loading.tsx for category page
- **Description:** The category page is a server component that fetches and processes 60K+ schemes via `getAllSchemes()`. There is no `loading.tsx` in the `category/[...slug]` directory, so users may see a blank/hanging page during server-side processing.
- **Impact:** Poor UX — users see nothing while the page loads (potentially several seconds for the full scheme list to be fetched and processed).
- **Suggested Fix:**
Create `src/app/mutual-funds/category/[...slug]/loading.tsx`:
```typescript
import { Skeleton } from '@/components/ui/Skeleton';

export default function CategoryLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Skeleton className="mb-2 h-4 w-32" />
      <Skeleton className="mb-2 h-8 w-64" />
      <Skeleton className="mb-6 h-4 w-24" />
      <Skeleton className="h-[400px] w-full rounded-xl" />
    </div>
  );
}
```

### ISSUE-013
- **Severity:** WARNING
- **File:** `src/app/mutual-funds/amc/[amc]/page.tsx`
- **Line(s):** (missing file)
- **Category:** UI
- **Title:** No loading.tsx for AMC page
- **Description:** Same issue as ISSUE-012 but for the AMC page. No `loading.tsx` exists for the `amc/[amc]` route.
- **Impact:** Poor UX — users see nothing while the page loads.
- **Suggested Fix:**
Create `src/app/mutual-funds/amc/[amc]/loading.tsx`:
```typescript
import { Skeleton } from '@/components/ui/Skeleton';

export default function AMCLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Skeleton className="mb-2 h-4 w-32" />
      <Skeleton className="mb-2 h-8 w-48" />
      <Skeleton className="mb-6 h-4 w-24" />
      <Skeleton className="h-[400px] w-full rounded-xl" />
    </div>
  );
}
```

### ISSUE-014
- **Severity:** WARNING
- **File:** `src/app/mutual-funds/[schemeCode]/page.tsx`
- **Line(s):** 23
- **Category:** DATA
- **Title:** No NaN validation after parseInt for schemeCode
- **Description:** `parseInt(schemeCode, 10)` is called without checking if the result is NaN. If a user visits `/mutual-funds/abc`, `code` will be NaN, and `getSchemeDetail(NaN)` will be called, resulting in a fetch to `https://api.mfapi.in/mf/NaN`. The API will return a 404, and the page will show "Fund not found" — acceptable behavior but wastes an API call.
- **Impact:** Unnecessary API call for invalid scheme codes. No crash but wasteful.
- **Current Code:**
```typescript
const code = parseInt(schemeCode, 10);
const detail = await getSchemeDetail(code);
```
- **Suggested Fix:**
```typescript
const code = parseInt(schemeCode, 10);
if (isNaN(code)) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
        Invalid fund code.
      </div>
    </div>
  );
}
const detail = await getSchemeDetail(code);
```

### ISSUE-015
- **Severity:** WARNING
- **File:** `src/app/mutual-funds/category/[...slug]/page.tsx` and `src/app/mutual-funds/amc/[amc]/page.tsx`
- **Line(s):** category:24-37, amc:21-26
- **Category:** API
- **Title:** Performance: full scheme list fetched and processed for every category/AMC page
- **Description:** Both pages call `getAllSchemes()` (60K+ items, >7MB response), then `filterDirectGrowth()` and `classifyFund()`/`extractAMC()` on every item. While `revalidate: 86400` caches the fetch, the classification/filtering still runs for each unique URL visit.
- **Impact:** Slow page loads (several seconds) for category and AMC pages, especially on cold starts.
- **Suggested Fix:**
Pre-compute the categorized list and cache it, or use the `/api/mutual-funds/list` API route (which already does the classification) as the data source instead of re-doing the work.

### ISSUE-016
- **Severity:** INFO
- **File:** `src/app/mutual-funds/[schemeCode]/page.tsx`
- **Line(s):** 46
- **Category:** DATA
- **Title:** Zero NAV filtering is correct
- **Description:** The filter `.filter((d) => !isNaN(d.nav) && d.nav > 0)` correctly handles the zero NAV found in Axis Large Cap (120465, one zero NAV on 2013-04-07). This prevents zero NAVs from corrupting calculations and charts.
- **Impact:** None — working correctly.

### ISSUE-017
- **Severity:** INFO
- **File:** `src/components/charts/PriceChart.tsx`
- **Line(s):** 55-60
- **Category:** CHART
- **Title:** lightweight-charts v5 API usage is correct
- **Description:** The chart correctly uses `chart.addSeries(AreaSeries, opts)` (v5 API) rather than the deprecated `addAreaSeries(opts)` (v4 API). `lineWidth: 2` is an integer as required by the `LineWidth` type.
- **Impact:** None — working correctly.

### ISSUE-018
- **Severity:** INFO
- **File:** `src/components/mutual-funds/FundSearch.tsx`
- **Line(s):** 17, 26
- **Category:** UI
- **Title:** Search minimum length and debouncing are properly implemented
- **Description:** Search requires at least 2 characters (line 17), uses 300ms debounce (line 25-34), properly encodes the query (line 26), and handles errors gracefully (line 32). The dropdown closes on click-outside (lines 39-47) and on link click (line 68).
- **Impact:** None — working correctly.

### ISSUE-019
- **Severity:** INFO
- **File:** `src/lib/api/mfapi.ts`
- **Line(s):** 47-50
- **Category:** DATA
- **Title:** filterDirectGrowth pattern may have minor false positives
- **Description:** The filter checks for 'direct' AND ('growth' OR 'gr') in the scheme name. The 'gr' substring could theoretically match words like "graded" but in practice MFAPI scheme names do not contain such words. This works well enough for MFAPI data.
- **Impact:** Negligible false positive risk.

### ISSUE-020
- **Severity:** INFO
- **File:** `src/app/api/mutual-funds/search/route.ts`
- **Line(s):** 4-18
- **Category:** API
- **Title:** Search API has no rate limiting
- **Description:** The search API proxies requests to MFAPI's search endpoint without any rate limiting. A malicious client could spam the endpoint and potentially get the server IP rate-limited by MFAPI.
- **Impact:** Low risk for a personal/small project, but could become an issue at scale.

### ISSUE-021
- **Severity:** INFO
- **File:** `src/app/mutual-funds/[schemeCode]/page.tsx`
- **Line(s):** 39-41
- **Category:** DATA
- **Title:** Date parsing assumes DD-MM-YYYY format
- **Description:** The date parsing splits on '-' and rearranges as YYYY-MM-DD. This assumes MFAPI always returns dates in DD-MM-YYYY format. If the format ever changes, all date parsing will silently produce invalid dates.
- **Impact:** If MFAPI changes date format, all fund detail pages would show incorrect or empty charts. However, this format has been stable for years.

### ISSUE-022
- **Severity:** WARNING
- **File:** `src/app/mutual-funds/[schemeCode]/page.tsx`
- **Line(s):** 4
- **Category:** API
- **Title:** Revalidate set to 3600 but latestDate hardcoded to current time
- **Description:** The page has `revalidate = 3600` (1 hour cache), but `latestDate` is set to `new Date().toISOString()` at render time. When the page is served from cache, the timestamp will be stale (up to 1 hour old) but still shows a specific time, which is misleading. The actual NAV date from the data would be more accurate.
- **Impact:** Users see a timestamp that could be up to 1 hour stale, presented as if it were current.
