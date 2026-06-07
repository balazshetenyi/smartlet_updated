# Kiado — Mobile App

React Native / Expo application for the Kiado property rental platform, supporting holiday lets and short-term rentals.

## Prerequisites

- Node.js 18+
- pnpm 10+ (this repo uses pnpm workspaces — do not use npm or yarn)
- Xcode (iOS development)
- Android Studio (Android development)

## Getting started

Install from the repository root, not from this directory:

```bash
cd ../..
pnpm install
```

Then start the app:

```bash
pnpm dev          # iOS simulator with cache clear
pnpm start        # Expo dev server
pnpm ios          # Build and run on iOS
pnpm android      # Build and run on Android
```

## Environment variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

## Project structure

```
src/
  app/
    (auth)/           Sign-in, sign-up, select-role, forgot/reset password
    (app)/
      index.tsx       Entry-point router — redirects to /landlord or /tenant
      landlord/       Landlord tab navigator (Dashboard, Bookings, Messages, Properties, More)
      tenant/         Tenant tab navigator (Explore, Bookings, Messages, More)
      (account)/      Shared account screens (profile, bookings, messages, earnings, etc.)
      properties/     Property detail, search, create, edit
      book-property/  Payment and booking success screens
  components/
    shared/           AppBar, Button, Input, Card, SearchBar, etc.
    properties/       PropertyCard, BookingModal, etc.
    messages/         ConversationList
    search/           Search filters and autocomplete
    auth/             UserTypeSelector
  hooks/
    useTheme.ts       Returns lightTheme or darkTheme based on system colour scheme
  store/              Zustand stores (auth, property, messages)
  utils/              Supabase query helpers (booking, property, message, auth)
  context/            SearchContext
  config/             Zod schemas, Sentry, environment
  test/               Jest setup, mocks, test utilities
  __tests__/          Unit and component tests
```

## Architecture

### Navigation

The app uses Expo Router with two separate tab navigators based on user role.

`app/(app)/index.tsx` is a pure router — it reads `profile.user_role` from the auth store and redirects:

- Landlords go to `/landlord` (Dashboard, Bookings, Messages, Properties, More)
- Tenants go to `/tenant` (Explore, Bookings, Messages, More)
- Landlords can browse as guests via `/tenant?guest=1`

### Theme system

`useTheme()` from `src/hooks/useTheme.ts` returns the correct theme object based on `useColorScheme()`. Both themes (`lightTheme` / `darkTheme`) are defined in `packages/shared/styles/colours.ts` and share identical property names so components require no conditional logic.

All components follow the same pattern:

```tsx
const theme = useTheme();
const styles = useMemo(() => createStyles(theme), [theme]);
```

### Payments

Card registration uses Stripe's Mobile Payment Element (`usePaymentSheet`) rather than the deprecated `CardField`. The flow creates a Supabase `SetupIntent` server-side, presents the native payment sheet, then saves the payment method ID to the booking. Payment is charged automatically 48 hours before check-in via the `charge-due-bookings` edge function.

## Development

### Type checking

```bash
pnpm typecheck
```

### Tests

```bash
pnpm test              # Run all tests once
pnpm test:watch        # Watch mode
pnpm test:coverage     # With coverage report
```

Tests use `jest-expo` with `@testing-library/react-native` v14. Note that `render()` is async in RNTL v14 — always `await` it.

### Linting

```bash
pnpm lint
```

## Production build

```bash
# Install EAS CLI
pnpm dlx eas-cli

# Build
eas build --platform ios --profile production
eas build --platform android --profile production

# Submit
eas submit --platform ios --profile production
eas submit --platform android --profile production
```
