# Aurentum Mobile App — Design Plan

## Approach: React Native (Expo) — Single Codebase for Android + iOS

React Native with Expo is the best fit here because:
- Shares logic and most UI code across both platforms
- The web app is already React + TypeScript — same language, similar patterns
- Expo handles builds, OTA updates, and native APIs without Xcode/Android Studio setup
- The app is data-display-heavy (no complex native features needed)

---

## Architecture

```
aurentum-mobile/
├── app/                          # Expo Router (file-based, like Next.js App Router)
│   ├── (tabs)/                   # Bottom tab navigator
│   │   ├── index.tsx             # Overview (home)
│   │   ├── currencies.tsx        # Currency rates
│   │   ├── metals.tsx            # Gold & silver
│   │   └── funds.tsx             # Mutual funds hub
│   ├── fund/[schemeCode].tsx     # Fund detail (stack push)
│   ├── category/[...slug].tsx    # Category fund list
│   └── amc/[amc].tsx            # AMC fund list
├── components/
├── lib/                          # Shared API calls, constants, utils
└── assets/
```

**Navigation:** Bottom tab bar (4 tabs) + stack navigation for detail screens.

**Data:** All API calls go directly to the same endpoints the web uses:
- Frankfurter, MFAPI, GoodReturns (or a thin backend proxy if needed for CORS)
- React Query (TanStack Query) for caching, background refetch, and stale-while-revalidate

**Charts:** `react-native-wagmi-charts` or `victory-native` — both support area/line charts with touch interaction. Lightweight-charts doesn't have a React Native wrapper.

**Styling:** NativeWind (Tailwind for React Native) — same utility-class mental model as the web app.

---

## Screen-by-Screen Design

### 1. Overview (Home Tab)

```
┌─────────────────────────────┐
│  Aurentum              [◑]  │  ← Header with theme toggle
├─────────────────────────────┤
│                             │
│  Exchange Rates             │
│  ┌───────────┬────────────┐ │
│  │ USD/INR   │ EUR/INR    │ │  ← 2-column grid of cards
│  │ ₹84.12    │ ₹91.34    │ │
│  │ ▲ 0.12%   │ ▼ 0.08%   │ │
│  ├───────────┼────────────┤ │
│  │ GBP/INR   │ AED/INR   │ │
│  │ ₹106.42   │ ₹22.90    │ │
│  │ ▲ 0.05%   │ ▼ 0.01%   │ │
│  └───────────┴────────────┘ │
│              View All →     │
│                             │
│  Precious Metals            │
│  ┌───────────┬────────────┐ │
│  │ Gold 24K  │ Silver 999 │ │  ← 2-column
│  │ ₹7,842/g  │ ₹96.50/g  │ │
│  │ ▲ 0.3%    │ ▼ 0.1%    │ │
│  └───────────┴────────────┘ │
│              View All →     │
│                             │
│  Market Indices             │
│  ┌───────────┬────────────┐ │
│  │ SENSEX    │ NIFTY 50   │ │
│  │ 72,845    │ 22,104     │ │
│  │ ▲ 0.4%    │ ▲ 0.3%    │ │
│  └───────────┴────────────┘ │
│                             │
│  Popular Funds              │
│  ┌─────────────────────────┐│
│  │ SBI Small Cap Fund      ││  ← Full-width list cards
│  │ NAV ₹142.35  ▲ 0.2%    ││
│  ├─────────────────────────┤│
│  │ HDFC Mid-Cap Opp.       ││
│  │ NAV ₹68.92   ▼ 0.1%    ││
│  └─────────────────────────┘│
│              View All →     │
│                             │
├──┬──────┬──────┬──────┬─────┤
│🏠│  💱  │  🥇  │  📊  │     │  ← Bottom tabs
│Home│Curr.│Metals│Funds │     │
└──┴──────┴──────┴──────┴─────┘
```

**Details:**
- ScrollView, pull-to-refresh to reload all data
- Cards have subtle border, rounded corners (12px), same bg-card color
- ChangeIndicator: green/red text + arrow, same as web
- "View All →" is a tappable text link, right-aligned
- 2-column grid with 12px gap

---

### 2. Currencies Tab

```
┌─────────────────────────────┐
│  ← Currencies               │
├─────────────────────────────┤
│                             │
│  ┌─────────────────────────┐│
│  │ [USD ▼]  →  INR         ││  ← Converter at top
│  │ ┌─────────┐ ┌─────────┐ ││
│  │ │ 100     │ │ 8,412   │ ││
│  │ └─────────┘ └─────────┘ ││
│  │         [⇄ Swap]        ││
│  └─────────────────────────┘│
│                             │
│  ┌─ 1M  3M  6M  1Y  3Y ──┐│
│  │                         ││  ← Area chart, 200px
│  │    ╱‾‾╲    ╱‾‾‾╲       ││
│  │  ╱     ╲╱╱      ╲──    ││
│  │                         ││
│  └─────────────────────────┘│
│                             │
│  All Rates                  │
│  ┌─────────────────────────┐│
│  │ 🇺🇸 USD    ₹84.12 ▲0.1%││  ← Tappable rows
│  ├─────────────────────────┤│
│  │ 🇪🇺 EUR    ₹91.34 ▼0.1%││
│  ├─────────────────────────┤│
│  │ 🇬🇧 GBP   ₹106.42 ▲0.1%│
│  ├─────────────────────────┤│
│  │ ...                     ││
│  └─────────────────────────┘│
│                             │
│  52-Week Range              │
│  ┌─────────────────────────┐│
│  │ 82.10 ──●────── 86.40  ││  ← Range bar
│  │     Low    84.12   High ││
│  └─────────────────────────┘│
│                             │
├──┬──────┬──────┬──────┬─────┤
```

**Details:**
- Converter is always visible at top (most-used feature on mobile)
- Tapping a currency row updates the chart, converter, and 52-week range
- Selected row gets accent-gold left border
- Chart is touch-interactive: drag to see crosshair with date/value
- Time range selector: horizontal pill group, scrollable if needed

---

### 3. Metals Tab

```
┌─────────────────────────────┐
│  ← Precious Metals          │
├─────────────────────────────┤
│  [ Gold ]  [ Silver ]       │  ← Segment control (pill toggle)
├─────────────────────────────┤
│                             │
│  ┌───────────┬────────────┐ │
│  │ 24K       │ 22K        │ │  ← 2-column price cards
│  │ ₹7,842/g  │ ₹7,188/g  │ │
│  │ ▲ 0.3%    │ ▲ 0.3%    │ │
│  ├───────────┼────────────┤ │
│  │ 18K       │ 14K        │ │
│  │ ₹5,882/g  │ ₹4,575/g  │ │
│  │ ▲ 0.3%    │ ▲ 0.3%    │ │
│  └───────────┴────────────┘ │
│                             │
│  ┌─ 1M  3M  6M  1Y  3Y ──┐│
│  │                         ││  ← Area chart
│  │      ╱‾‾‾‾‾‾╲          ││
│  │    ╱          ╲──       ││
│  │                         ││
│  └─────────────────────────┘│
│                             │
│  Purity Calculator          │
│  ┌─────────────────────────┐│
│  │ Weight: [10    ] [g ▼]  ││
│  │ Purity: [24K ▼]        ││
│  │                         ││
│  │ Estimated: ₹78,420     ││  ← Gold accent text
│  └─────────────────────────┘│
│                             │
├──┬──────┬──────┬──────┬─────┤
```

**Details:**
- Segment control at top for Gold / Silver switch
- 2-column card grid for purity prices (not 5-col like desktop — too cramped)
- Chart below prices, full-width
- Calculator at bottom (less frequently used, still accessible)
- Touch-drag on chart for crosshair

---

### 4. Mutual Funds Tab

```
┌─────────────────────────────┐
│  ← Mutual Funds             │
├─────────────────────────────┤
│  ┌─────────────────────────┐│
│  │ 🔍 Search funds...      ││  ← Search bar
│  └─────────────────────────┘│
│                             │
│  Browse by Category         │
│  ┌─────────────────────────┐│
│  │ Equity              824 ││  ← Tappable, expands
│  ├─────────────────────────┤│
│  │   Large Cap       → 142 ││  ← Subcategory rows
│  │   Mid Cap         → 98  ││     tap navigates to list
│  │   Small Cap       → 76  ││
│  │   Flexi Cap       → 124 ││
│  │   ELSS            → 62  ││
│  │   Sector/Thematic → 322 ││
│  ├─────────────────────────┤│
│  │ Debt                512 ││
│  ├─────────────────────────┤│
│  │ Hybrid             203 ││
│  ├─────────────────────────┤│
│  │ Index / ETFs       186 ││
│  └─────────────────────────┘│
│                             │
│  Browse by AMC              │
│  ┌─────────────────────────┐│
│  │ SBI                 312 ││
│  │ HDFC                287 ││
│  │ ICICI Prudential    264 ││
│  │ Axis                198 ││
│  │ Kotak               176 ││
│  │ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄ ││
│  │  Show All 40 AMCs    ▼  ││
│  │ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄ ││
│  │ Other                89 ││
│  └─────────────────────────┘│
│                             │
├──┬──────┬──────┬──────┬─────┤
```

**Details:**
- Search bar at top, shows results in a bottom sheet (not dropdown — better for mobile)
- Search results: bottom sheet slides up, covers ~60% of screen, scrollable
- Category accordion: same behavior as web (tap category → show subcategories)
- Subcategory rows have right arrow → indicating navigation
- AMC list: top 5 + Other, "Show All" expands inline
- All rows have minimum 48px touch target height

---

### 5. Fund Detail (Stack Screen — pushed on top of tabs)

```
┌─────────────────────────────┐
│  ← Back                     │
├─────────────────────────────┤
│                             │
│  SBI Small Cap Fund -       │
│  Direct Plan - Growth       │  ← Scheme name (wraps)
│  SBI Mutual Fund            │  ← Fund house, muted
│                             │
│  ┌───────────┬────────────┐ │
│  │ NAV       │ 1Y Return  │ │  ← 2-column metric cards
│  │ ₹142.35   │ ▲ 18.4%   │ │
│  ├───────────┼────────────┤ │
│  │ 3Y Return │ 5Y Return  │ │
│  │ ▲ 22.1%   │ ▲ 28.6%   │ │
│  ├───────────┼────────────┤ │
│  │ 52W High  │ 52W Low    │ │
│  │ ₹148.20   │ ₹118.40   │ │
│  └───────────┴────────────┘ │
│                             │
│  ┌ 1M 3M 6M 1Y 3Y 5Y All ┐│
│  │                         ││  ← NAV chart, 250px
│  │      ╱‾‾‾‾‾╲           ││
│  │    ╱        ╲──        ││
│  │                         ││
│  └─────────────────────────┘│
│                             │
│  Last updated: 28 Feb 2026  │
│                             │
└─────────────────────────────┘
```

**Details:**
- Pushed as a stack screen (slides in from right on iOS, bottom on Android)
- Back button in header returns to previous screen
- 2-column grid for metrics (6 values = 3 rows of 2)
- Chart: full-width, 250px height, touch-drag crosshair
- Time range pills: horizontally scrollable if they don't all fit

---

### 6. Category / AMC Fund List (Stack Screen)

```
┌─────────────────────────────┐
│  ← Equity — Large Cap       │
├─────────────────────────────┤
│  142 funds                  │
│                             │
│  ┌─────────────────────────┐│
│  │ Axis Bluechip Fund -    ││
│  │ Direct Plan - Growth    ││
│  ├─────────────────────────┤│
│  │ Canara Robeco Bluechip  ││
│  │ Equity Fund - Direct... ││
│  ├─────────────────────────┤│
│  │ ...                     ││
│  └─────────────────────────┘│
│                             │
└─────────────────────────────┘
```

**Details:**
- FlatList for performance (can be hundreds of funds)
- Each row taps to push fund detail screen
- Alphabetically sorted
- Fast scroll indicator on right edge

---

## Shared Design Tokens

| Token | Light | Dark |
|-------|-------|------|
| Background | `#ffffff` | `#0b1121` |
| Card | `#ffffff` | `#131c31` |
| Muted | `#f1f5f9` | `#1e293b` |
| Border | `#e2e8f0` | `#1e293b` |
| Accent (gold) | `#c89b3c` | `#d4a843` |
| Positive | `#16a34a` | `#22c55e` |
| Negative | `#dc2626` | `#ef4444` |
| Text primary | `#0f172a` | `#f1f5f9` |
| Text muted | `#64748b` | `#94a3b8` |

**Typography:** System fonts (San Francisco on iOS, Roboto on Android). Monospace for numbers.

**Spacing:** 16px horizontal padding, 12px card gaps, 8px inner padding.

**Corner radius:** 12px cards, 8px buttons/inputs, 20px pill toggles.

**Touch targets:** Minimum 48x48px for all interactive elements (Google Material guideline).

---

## Mobile-Specific UX Patterns

1. **Pull-to-refresh** on every tab to reload data
2. **Bottom sheet** for search results (not floating dropdown — avoids keyboard overlap)
3. **Haptic feedback** on tab switches and toggle interactions (iOS)
4. **Skeleton screens** on every loading state (same as web)
5. **Offline banner** at top when no connectivity, cached data still shown
6. **Number formatting** stays `en-IN` locale (Indian commas: 1,00,000)
7. **Safe area** padding for notched phones (iPhone) and rounded corners
8. **Status bar** adapts to theme (light content on dark bg, dark content on light bg)

---

## Tech Stack Summary

| Layer | Choice |
|-------|--------|
| Framework | React Native + Expo SDK 52 |
| Router | Expo Router v4 (file-based) |
| Styling | NativeWind v4 (Tailwind) |
| State/Cache | TanStack Query v5 |
| Charts | `react-native-wagmi-charts` |
| Navigation | Bottom tabs + stack |
| Icons | `@expo/vector-icons` (Ionicons) |
| Storage | `expo-secure-store` (theme pref) |
| Theme | Context-based, mirrors web tokens |

---

## Build & Distribution

- **Android:** EAS Build → APK/AAB → Google Play Store
- **iOS:** EAS Build → IPA → Apple App Store (requires Apple Developer account)
- **Testing:** Expo Go for development, EAS internal distribution for beta
- **OTA updates:** `expo-updates` for JS-only changes without store review
