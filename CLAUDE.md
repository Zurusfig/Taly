# Personal Finance Tracker — Project Spec

A mobile finance tracker optimized for **sub-3-second logging at point of purchase**. Single-user, cloud-synced.

## Core Principles

1. **Friction is the enemy.** Every screen, every tap, is measured against "would I actually do this at the 7-Eleven counter?"
2. **Minimal but engaging.** Calm dark UI, deliberate motion, satisfying haptics on save.
3. **Defaults over forms.** Pre-fill last-used values. Hide optional fields behind "more".

## Tech Stack

- **Framework**: Expo SDK 51+ with Expo Router v3
- **Language**: TypeScript (strict mode)
- **Backend**: Supabase (auth, Postgres, Row Level Security)
- **Data fetching**: TanStack Query (React Query) v5
- **State**: Zustand for client-only UI state
- **Styling**: NativeWind v4 (Tailwind for RN)
- **Icons**: `lucide-react-native` — never emojis
- **Charts**: Victory Native XL
- **Dates**: `date-fns`
- **Forms**: `react-hook-form` + `zod`
- **Haptics**: `expo-haptics`
- **Secure storage**: `expo-secure-store` for session
- **Fonts**: `@expo-google-fonts/instrument-serif` + `@expo-google-fonts/inter`

## Design System

### Colors (dark mode only)
```ts
export const colors = {
  bg: '#2A2B2A',           // primary background
  bgElevated: '#353635',    // cards, sheets
  bgInput: '#3F4040',       // input fields
  border: '#454645',
  accent: '#61988E',        // primary accent, income, CTAs
  accentMuted: '#3F5F58',
  text: '#F5F5F0',          // primary text
  textMuted: '#9B9B96',     // secondary text
  textDim: '#6B6B66',       // tertiary
  danger: '#C97064',        // expenses
  warning: '#D4A574',       // budget warnings
};
```

### Typography
- **Headers / amounts / titles**: Instrument Serif (regular, italic for emphasis)
- **Everything else**: Inter (400/500/600)
- Numerals always tabular (`fontVariant: ['tabular-nums']`) for amounts

### Spacing scale
`4, 8, 12, 16, 24, 32, 48` — use NativeWind defaults

### Motion
- Transitions: 200–250ms `ease-out`
- Sheet open: spring `{ damping: 18, stiffness: 220 }`
- Haptic `Haptics.notificationAsync(Success)` on every save

## Database Schema

All tables have RLS policy: `user_id = auth.uid()`.

```sql
-- wallets
create table wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  type text not null check (type in ('cash', 'bank', 'credit', 'other')),
  initial_balance numeric(14,2) not null default 0,
  currency text not null default 'THB',
  icon text,             -- lucide icon name
  color text,            -- hex
  archived boolean default false,
  created_at timestamptz default now()
);

-- categories
create table categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  kind text not null check (kind in ('expense', 'income')),
  icon text,
  color text,
  archived boolean default false,
  created_at timestamptz default now()
);

-- transactions
create table transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  wallet_id uuid references wallets not null,
  category_id uuid references categories,    -- null for transfers
  type text not null check (type in ('expense', 'income', 'transfer')),
  amount numeric(14,2) not null,             -- always positive
  to_wallet_id uuid references wallets,      -- transfers only
  note text,
  occurred_at timestamptz not null,
  subscription_id uuid references subscriptions,  -- if auto-created
  created_at timestamptz default now()
);

-- subscriptions (each tracked separately)
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,                        -- "Netflix", "Spotify"
  amount numeric(14,2) not null,
  wallet_id uuid references wallets not null,
  category_id uuid references categories,
  cycle text not null check (cycle in ('weekly', 'monthly', 'yearly')),
  cycle_anchor_date date not null,
  next_charge_date date not null,
  active boolean default true,
  created_at timestamptz default now()
);

-- budgets
create table budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  category_id uuid references categories,    -- null = total
  period text not null check (period in ('weekly', 'monthly', 'yearly')),
  amount numeric(14,2) not null,
  created_at timestamptz default now()
);

-- assets (stocks, gold, etc.)
create table assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  type text not null check (type in ('stock', 'etf', 'gold', 'crypto', 'other')),
  symbol text,                               -- AAPL, VOO, XAU
  name text not null,
  quantity numeric(18,6) not null,
  avg_cost_per_unit numeric(14,4),
  currency text not null default 'USD',
  last_price numeric(14,4),
  last_price_updated_at timestamptz,
  created_at timestamptz default now()
);
```

### Computed balance
`wallet.balance = initial_balance + sum(income) - sum(expense) + sum(transfers_in) - sum(transfers_out)` — compute via Postgres view.

## Screens

1. **Auth** — magic link email
2. **Onboarding** — add first wallet(s) with initial balance, optional: seed default categories
3. **Home (dashboard)**
   - Total balance (sum of wallets) — large serif
   - This-month income / expense / net
   - Wallet cards (horizontal scroll)
   - Recent transactions (5)
   - Floating action button (FAB) for quick-log
4. **Quick-log sheet** — see below, critical
5. **Transactions list** — filter by wallet/category/type/date range, search note
6. **Transaction detail / edit**
7. **Summary** — period selector (D/W/M/Y/custom), donut by category, trend line, wallet split bar
8. **Wallets** — list, add, edit, archive, view per-wallet history
9. **Categories** — list, add, edit, archive
10. **Subscriptions** — list with next charge date, edit, pause
11. **Budgets** — list with progress bars
12. **Assets / Portfolio** — list with current value, total portfolio, refresh prices
13. **Settings** — profile, biometric lock, JSON export/import, sign out

## Critical UX: Quick-Log Flow

The single most important feature. Target: **< 3 seconds from FAB tap to saved**.

1. Tap FAB on Home → half-sheet slides up
2. **Sheet opens with numpad already visible, amount field auto-focused**
3. Pre-filled defaults:
   - Type: last-used (default expense)
   - Wallet: last-used
   - Category: last-used for that type
   - Time: now
4. Big amount display in serif at top — currency symbol prefixed
5. Beneath amount, three pills (tap to change): `[Wallet ▾]  [Category ▾]  [Now ▾]`
6. Type toggle at top: `Expense · Income · Transfer`
7. Optional "Add note" link below pills — keeps note out of the critical path
8. Big primary "Save" button bottom — full width, accent color
9. On save: haptic success, toast "Saved · undo", sheet closes
10. Toast shows for 3s with undo + edit

**Transfer mode**: category pill replaced by `[To wallet ▾]`. No category needed. Doesn't count in income/expense totals.

## Summary Screen Logic

Period selector: **Day / Week / Month / Year / Custom**

For each period show:
- Income / Expense / Net (large serif numbers)
- Spending by category — donut chart, tap slice → filtered transaction list
- Trend — line chart, bucketed by appropriate granularity
- Budget progress (if budgets exist for period)
- Top 5 categories table

## Subscriptions Behavior

- On app launch, check for subscriptions where `next_charge_date <= today` and `active = true`
- For each, create a transaction (linked via `subscription_id`) and advance `next_charge_date` by cycle
- Show a "Recent auto-logged" indicator on home so user knows it happened

## Assets / Portfolio

- Manual entry for v1 (quantity + avg cost)
- "Refresh prices" button calls Finnhub via Supabase Edge Function (keep API key server-side)
- Show: per-asset value, gain/loss %, total portfolio in THB (convert USD via Edge Function using exchangerate.host)
- Portfolio total appears as a separate card on Home, below wallet balance

## JSON Export / Import

- Export: full dump of all tables for current user → JSON file via `expo-sharing`
- Import: restore from JSON (with confirmation, overwrite vs merge option)

## Security

- Supabase RLS on every table
- Biometric lock toggle in settings — required to open app if enabled
- Session stored in `expo-secure-store`

## Build Phases

### Phase 1 — MVP (start here)
- Auth + onboarding
- Wallets CRUD
- Categories CRUD with seeded defaults
- Quick-log (expense, income, transfer)
- Home dashboard
- Transaction list + edit
- Settings + sign out

### Phase 2 — Insights
- Summary screen with all charts + period selector
- Budgets

### Phase 3 — Subscriptions
- Subscription CRUD
- Auto-log on cycle date

### Phase 4 — Assets
- Asset CRUD
- Supabase Edge Function for price refresh
- Portfolio card on home

### Phase 5 — Polish
- JSON export/import
- Biometric lock
- Gamification: streak counter (consecutive days with ≥1 log), weekly goal badge
- Cash reconciliation weekly prompt

## Default Seeds

**Categories (expense)**: Food, Transport, Shopping, Entertainment, Bills, Health, Education, Subscriptions, Other
**Categories (income)**: Salary, Freelance, Investment, Gift, Other

## How to Use This Spec with Claude Code

1. Save this file as `CLAUDE.md` at the project root
2. Initialize: `npx create-expo-app finance-tracker --template default`
3. First prompt: *"Read CLAUDE.md. Set up the project: install all listed dependencies, configure NativeWind and the Google Fonts, set up the Supabase client, and create the folder structure. Then create the colors and typography theme constants."*
4. Then proceed phase by phase: *"Implement Phase 1 — start with the auth flow and onboarding screen."*
5. After each phase, manually test before moving on
