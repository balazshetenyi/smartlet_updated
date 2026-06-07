# Kiado

A property rental platform connecting landlords and guests. Supports holiday lets and short-term rentals.

## Repository structure

This is a pnpm monorepo managed with Turborepo.

```
apps/
  mobile/       React Native app (Expo) — iOS and Android
  web/          Web application
packages/
  shared/       Shared types, theme, Supabase client, assets
  ui-web/       Shared UI components for the web app
supabase/
  functions/    Deno edge functions
  migrations/   Database migrations
```

## Prerequisites

- Node.js 18+
- pnpm 10+
- Expo CLI (`pnpm dlx expo-cli`)
- Supabase CLI (for local backend development)

## Getting started

Install dependencies from the repository root:

```bash
pnpm install
```

### Mobile app

```bash
cd apps/mobile
pnpm dev          # Start Expo with iOS simulator
pnpm ios          # Build and run on iOS
pnpm android      # Build and run on Android
```

### Environment variables

Copy `.env.example` to `.env` in `apps/mobile` and fill in:

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=
EXPO_PUBLIC_APPLE_MERCHANT_ID=
EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL=
```

## Development

### Type checking

```bash
pnpm typecheck         # Check all packages
```

### Tests

```bash
pnpm test              # Run all tests
cd apps/mobile
pnpm test:watch        # Watch mode
pnpm test:coverage     # With coverage report
```

### Linting

```bash
pnpm lint
```

## Pre-commit checks

Husky runs type checking and the full test suite before every commit. To skip in an emergency:

```bash
git commit --no-verify -m "your message"
```

## Mobile app architecture

The mobile app uses Expo Router with two separate tab navigators based on user role:

- **Landlords** land on `/landlord` — Dashboard, Bookings, Messages, Properties, More
- **Tenants** land on `/tenant` — Explore, Bookings, Messages, More

The entry point at `app/(app)/index.tsx` reads the user's role from the auth store and redirects accordingly. Landlords can browse as guests by navigating to `/tenant?guest=1`.

### Theme system

The app supports light and dark mode via a `useTheme()` hook in `src/hooks/useTheme.ts`. Both themes are defined in `packages/shared/styles/colours.ts` as `lightTheme` and `darkTheme`. All components use a `createStyles(theme)` factory pattern with `useMemo`.

### Key packages

| Package | Purpose |
|---|---|
| `expo-router` | File-based navigation |
| `@supabase/supabase-js` | Database, auth, storage |
| `@stripe/stripe-react-native` | Payment sheet |
| `zustand` | Client state management |
| `react-hook-form` + `zod` | Form validation |
| `@testing-library/react-native` | Component testing |
| `jest-expo` | Jest preset for Expo |

## Backend

The backend runs on Supabase (PostgreSQL, Auth, Storage, Edge Functions).

### Edge functions

| Function | Purpose |
|---|---|
| `create-setup-intent` | Create Stripe SetupIntent for card registration |
| `confirm-booking-manual` | Confirm a booking and charge the payment method |
| `cancel-booking` | Cancel booking and handle refunds |
| `decline-booking` | Decline a pending booking request |
| `charge-due-bookings` | Scheduled: charge bookings due within 48 hours |
| `send-booking-email` | Notify landlord of a new booking |
| `send-message-email` | Email notification for new messages |
| `send-payment-reminder` | Remind tenants of upcoming payments |
| `send-push-notification` | Send push notifications via Expo |
| `welcome-email` | Send welcome email on account creation |
| `delete-account` | Permanently delete a user account and all data |
| `create-or-connect-stripe-account` | Set up Stripe Connect for landlord payouts |
| `google-places` | Proxy for Google Places API |
| `handle-report-action` | Process surveillance report actions |
| `notify-surveillance-report` | Notify relevant parties of a new report |

### Running locally

```bash
supabase start
supabase functions serve
```

## Deployment

- Mobile: Expo EAS Build (`eas build`) + EAS Submit (`eas submit`)
- Edge functions: `supabase functions deploy`
