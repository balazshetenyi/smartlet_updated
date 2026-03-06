# Kiado - Property Rental Platform

Kiado is a modern property rental platform built with React Native and Expo, connecting landlords with tenants for
long-term, short-term, and holiday rentals.

## Features

- 🏠 **Property Listings** - Browse and search properties by type (long-term, short-term, holiday)
- 📅 **Booking Management** - Complete booking flow with date selection and availability management
- 💳 **Secure Payments** - Integrated Stripe payment processing
- 💬 **Messaging** - Direct communication between landlords and tenants
- 🔐 **Authentication** - Secure user authentication with Supabase
- 📱 **Cross-Platform** - Runs on iOS, Android, and web
- 🌐 **Real-time Updates** - Live data synchronization with Supabase
- 🔍 **Advanced Search** - Search properties by location, type, and availability

## Tech Stack

- **Frontend**: React Native with Expo
- **Navigation**: Expo Router
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Payments**: Stripe
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod
- **Styling**: NativeWind (Tailwind CSS)
- **Error Tracking**: Sentry (production)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- iOS Simulator (for iOS development) or Android Studio (for Android development)
- Expo Go app (for quick testing)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd Kiado
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Fill in the required values in `.env`:
    - Supabase credentials
    - Stripe API keys
    - OpenCage API key
    - Other service credentials

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Run on your device**
    - Press `i` for iOS simulator
    - Press `a` for Android emulator
    - Scan QR code with Expo Go app for physical device

## Project Structure

```
Kiado/
├── src/
│   ├── app/                 # Expo Router pages
│   │   ├── (app)/          # Main app screens
│   │   └── (auth)/         # Authentication screens
│   ├── components/          # Reusable components
│   │   ├── auth/           # Authentication components
│   │   ├── properties/     # Property-related components
│   │   └── shared/         # Shared UI components
│   ├── config/             # Configuration files
│   │   ├── env.ts          # Environment validation
│   │   ├── sentry.ts       # Error tracking config
│   │   └── schemas.ts      # Validation schemas
│   ├── context/            # React Context providers
│   ├── lib/                # Third-party library configs
│   ├── store/              # Zustand state management
│   ├── styles/             # Style constants
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Utility functions
├── supabase/               # Supabase configuration
│   └── functions/          # Edge functions
├── .env.example            # Environment variables template
├── app.json                # Expo configuration
├── eas.json                # EAS Build configuration
└── package.json
```

## Environment Variables

See `.env.example` for all required environment variables:

- `EXPO_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` - Supabase public key
- `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe public key
- `STRIPE_SECRET_KEY` - Stripe secret key (server-side)
- `OPENCAGE_API_KEY` - OpenCage geocoding API key
- `EXPO_PUBLIC_ENVIRONMENT` - Environment (development/staging/production)
- `EXPO_PUBLIC_SENTRY_DSN` - Sentry DSN for error tracking (optional)

## Development

### Available Scripts

- `npm start` - Start Expo development server
- `npm run android` - Run on Android
- `npm run ios` - Run on iOS
- `npm run web` - Run on web
- `npm run lint` - Run ESLint

### Database Setup

1. Create a Supabase project at https://supabase.com
2. Run the database migrations (located in `supabase/migrations/`)
3. Set up Row Level Security (RLS) policies
4. Configure storage buckets for property images

### Supabase Edge Functions

Deploy the payment intent function:

```bash
cd supabase/functions/create-payment-intent
supabase functions deploy create-payment-intent
```

## Production Deployment

### Prerequisites

Before deploying to production, complete the production checklist:

1. **Review Documentation**
    - Read `PRODUCTION_GUIDE.md` for detailed deployment instructions
    - Use `PRODUCTION_CHECKLIST.md` to track progress
    - Update `PRIVACY_POLICY.md` and `TERMS_OF_SERVICE.md` with your information

2. **Set Up Services**
    - Configure production Supabase project
    - Set up production Stripe account
    - Create Sentry account for error tracking
    - Obtain app store developer accounts

3. **Configure App**
    - Update `app.json` with your bundle identifiers
    - Create production environment variables
    - Set up EAS Build

### Building for Production

Install EAS CLI:

```bash
npm install -g eas-cli
eas login
```

Build for iOS:

```bash
eas build --platform ios --profile production
```

Build for Android:

```bash
eas build --platform android --profile production
```

Submit to stores:

```bash
eas submit --platform ios --profile production
eas submit --platform android --profile production
```

## Features by User Type

### Landlords

- List properties with photos and details
- Set pricing for different rental types
- Manage property availability
- Block specific dates
- Review and approve booking requests
- Communicate with potential tenants

### Tenants

- Browse available properties
- Search by location and rental type
- View property details and photos
- Book properties
- Make secure payments via Stripe
- Message landlords

## Security

- Secure authentication with Supabase Auth
- Row Level Security (RLS) on all database tables
- Encrypted storage for sensitive data
- HTTPS for all API communications
- Secure payment processing via Stripe
- Environment-based configuration
- Error tracking without exposing sensitive data

## Error Tracking

The app uses Sentry for production error tracking:

- Automatic error capture
- User context tracking
- Release tracking
- Performance monitoring

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

[Your License Here]

## Support

For issues or questions:

- Email: [YOUR SUPPORT EMAIL]
- GitHub Issues: [YOUR REPO URL]

## Acknowledgments

- Built with [Expo](https://expo.dev)
- Backend powered by [Supabase](https://supabase.com)
- Payments by [Stripe](https://stripe.com)
- Error tracking by [Sentry](https://sentry.io)
