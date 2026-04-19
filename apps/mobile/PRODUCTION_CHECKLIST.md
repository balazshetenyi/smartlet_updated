# Kiado Production Readiness Checklist

Use this checklist to track your progress towards production deployment.

## ✅ Phase 1: Critical Security (COMPLETED)

- [x] Remove sensitive data from git history
- [x] Set up environment configuration (`.env.example`)
- [x] Implement proper logging (no console.log in production)
- [x] Add environment variable validation
- [x] Configure app permissions and bundle IDs

## 📋 Phase 2: App Store Requirements

### App Configuration

- [x] Update `app.json` with your Expo username
- [x] Set up EAS project ID
- [x] Configure app icon (1024x1024)
- [x] Create splash screen assets
- [ ] Add app screenshots for store listings (multiple sizes)
- [x] Write app description (short & long)
- [x] Choose app category
- [x] Set app keywords for SEO

### Legal Documents

- [x] Privacy Policy created (update with your contact info)
- [x] Terms of Service created (update with your contact info)
- [x] Host Privacy Policy & Terms on web (required by stores)
- [x] Add links to Privacy Policy in app settings
- [x] Add links to Terms in signup flow

### Certificates & Signing

- [x] iOS: Apple Developer Account ($99/year)
- [x] iOS: Create App Store Connect app
- [x] Android: Google Play Developer Account ($25 one-time)
- [x] Android: Create Google Play Console app
- [x] Generate signing certificates via EAS

### Deep Linking & Universal Links
- [x] Upgrade from custom scheme (`kiado://`) to Universal Links (`https://kiado.app`)
- [x] Configure `apple-app-site-association` (iOS) and `assetlinks.json` (Android)
- [x] Update `app.json` with `associatedDomains` and `intentFilters`
- [x] Update Stripe Edge Function `refresh_url` and `return_url` to use HTTPS links

## 🔧 Phase 3: Backend & Services

### Supabase Production Setup

- [x] Create production Supabase project
- [x] Set up Row Level Security (RLS) policies
- [ ] Configure database indexes for performance
- [ ] Set up database backups
- [x] Configure storage bucket policies
- [ ] Set storage size limits
- [x] Deploy Edge Functions to production
- [x] Set production environment variables in Supabase
- [ ] Configure email templates
- [ ] Test all database queries with production data
- [ ] Set up connection pooling

### Stripe Production Setup

- [ ] Create production Stripe account
- [x] Get production API keys
- [x] Update `.env.production` with production keys
- [ ] Set up webhooks in Stripe dashboard
- [ ] Test payment flow with production keys
- [ ] Configure webhook endpoints
- [ ] Set up billing and payout settings
- [ ] Review and set currency/localization

### Error Tracking (Sentry)

- [x] Create Sentry account
- [x] Create React Native project in Sentry
- [x] Get Sentry DSN
- [x] Add DSN to `.env.production`
- [x] Test error tracking in staging
- [x] Set up error alerts
- [x] Configure release tracking
- [x] Set up user context tracking

### Other Services

- [ ] Set up any analytics (optional)
- [x] Configure push notifications (if implemented)

## 🏗️ Phase 4: Build & Deploy

### Pre-Build

- [x] Install EAS CLI: `npm install -g eas-cli`
- [x] Login to Expo: `eas login`
- [x] Configure EAS: `eas build:configure`
- [x] Update `eas.json` with your settings
- [x] Create `.env.production` with all production keys
- [x] Run `npm audit` and fix vulnerabilities
- [x] Test app thoroughly in staging environment

### iOS Build

- [x] Create development build for testing
- [x] Create preview build for TestFlight
- [x] Test preview build thoroughly
- [x] Create production build: `eas build --platform ios --profile production`
- [x] Upload to App Store Connect
- [x] Fill in all App Store Connect information
- [ ] Add screenshots (iPhone, iPad if applicable)
- [ ] Complete age rating questionnaire
- [ ] Submit for review

### Android Build

- [x] Create development build for testing
- [x] Create preview build for internal testing
- [x] Test preview build thoroughly
- [ ] Create production build: `eas build --platform android --profile production`
- [ ] Upload to Google Play Console
- [ ] Fill in all Google Play Console information
- [ ] Add screenshots (phone, tablet if applicable)
- [ ] Complete content rating questionnaire
- [ ] Create internal/alpha/beta release first
- [ ] Test with beta users
- [ ] Submit for production review

## 🔍 Phase 5: Testing

### Functional Testing

- [ ] Test all user flows (signup, login, logout)
- [ ] Test property listing creation
- [ ] Test property search and filtering
- [ ] Test booking flow end-to-end
- [ ] Test payment processing
- [ ] Test messaging between users
- [ ] Test image uploads
- [ ] Test date management
- [ ] Test user profile updates

### Performance Testing

- [ ] Test with slow network connection
- [ ] Test with no network (offline mode)
- [ ] Test with large datasets
- [ ] Test image loading performance
- [ ] Check app size (should be reasonable)
- [ ] Check startup time

### Security Testing

- [ ] Test authentication flows
- [ ] Test authorization (users can only access their data)
- [ ] Test payment security
- [ ] Verify no sensitive data in logs
- [ ] Test data encryption
- [ ] Verify HTTPS for all requests

### Device Testing

- [ ] Test on various iOS devices (if targeting iOS)
- [ ] Test on various Android devices (if targeting Android)
- [ ] Test on different screen sizes
- [ ] Test on tablets (if supporting tablets)
- [ ] Test on different OS versions

## 📊 Phase 6: Post-Launch

### Monitoring

- [ ] Set up Sentry alerts
- [ ] Monitor error rates daily (first week)
- [ ] Check app store reviews daily (first week)
- [ ] Monitor Supabase usage and quotas
- [ ] Monitor Stripe transactions
- [ ] Track key metrics (downloads, MAU, retention)

### User Support

- [ ] Set up support email
- [ ] Create FAQ section
- [ ] Prepare response templates for common issues
- [ ] Set up in-app feedback mechanism

### Compliance

- [ ] GDPR compliance (if EU users)
- [ ] CCPA compliance (if California users)
- [ ] Data retention policies documented
- [ ] User data export functionality
- [x] Account deletion functionality

### Marketing (Optional)

- [ ] Create landing page
- [ ] Set up social media accounts
- [ ] Prepare launch announcement
- [ ] Create demo video
- [ ] Reach out to potential users

## 🚀 Quick Commands Reference

```bash
# Install dependencies
npm install

# Run development server
npm start

# Build for iOS (production)
eas build --platform ios --profile production

# Build for Android (production)
eas build --platform android --profile production

# Submit to App Store
eas submit --platform ios --profile production

# Submit to Google Play
eas submit --platform android --profile production

# Publish OTA update
eas update --branch production --message "Bug fixes"

# Check for vulnerabilities
npm audit
```

## 📝 Notes

- Keep this checklist updated as you complete items
- Don't skip testing phases
- Start with TestFlight (iOS) or internal track (Android) before public release
- Monitor closely for the first week after launch
- Be prepared to release hotfixes quickly if critical issues arise

## ❓ Need Help?

Refer to:

- `PRODUCTION_GUIDE.md` for detailed instructions
- `PRIVACY_POLICY.md` and `TERMS_OF_SERVICE.md` for legal templates
- `.env.example` for required environment variables
