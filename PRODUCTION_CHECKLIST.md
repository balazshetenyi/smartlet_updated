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

- [ ] Update `app.json` with your Expo username
- [ ] Set up EAS project ID
- [ ] Configure app icon (1024x1024)
- [ ] Create splash screen assets
- [ ] Add app screenshots for store listings (multiple sizes)
- [ ] Write app description (short & long)
- [ ] Choose app category
- [ ] Set app keywords for SEO

### Legal Documents

- [x] Privacy Policy created (update with your contact info)
- [x] Terms of Service created (update with your contact info)
- [ ] Host Privacy Policy & Terms on web (required by stores)
- [ ] Add links to Privacy Policy in app settings
- [ ] Add links to Terms in signup flow

### Certificates & Signing

- [ ] iOS: Apple Developer Account ($99/year)
- [ ] iOS: Create App Store Connect app
- [ ] Android: Google Play Developer Account ($25 one-time)
- [ ] Android: Create Google Play Console app
- [ ] Generate signing certificates via EAS

## 🔧 Phase 3: Backend & Services

### Supabase Production Setup

- [ ] Create production Supabase project
- [ ] Set up Row Level Security (RLS) policies
- [ ] Configure database indexes for performance
- [ ] Set up database backups
- [ ] Configure storage bucket policies
- [ ] Set storage size limits
- [ ] Deploy Edge Functions to production
- [ ] Set production environment variables in Supabase
- [ ] Configure email templates
- [ ] Test all database queries with production data
- [ ] Set up connection pooling

### Stripe Production Setup

- [ ] Create production Stripe account
- [ ] Get production API keys
- [ ] Update `.env.production` with production keys
- [ ] Set up webhooks in Stripe dashboard
- [ ] Test payment flow with production keys
- [ ] Configure webhook endpoints
- [ ] Set up billing and payout settings
- [ ] Review and set currency/localization

### Error Tracking (Sentry)

- [ ] Create Sentry account
- [ ] Create React Native project in Sentry
- [ ] Get Sentry DSN
- [ ] Add DSN to `.env.production`
- [ ] Test error tracking in staging
- [ ] Set up error alerts
- [ ] Configure release tracking
- [ ] Set up user context tracking

### Other Services

- [ ] Update OpenCage API key for production (if needed)
- [ ] Set up any analytics (optional)
- [ ] Configure push notifications (if implemented)

## 🏗️ Phase 4: Build & Deploy

### Pre-Build

- [ ] Install EAS CLI: `npm install -g eas-cli`
- [ ] Login to Expo: `eas login`
- [ ] Configure EAS: `eas build:configure`
- [ ] Update `eas.json` with your settings
- [ ] Create `.env.production` with all production keys
- [ ] Run `npm audit` and fix vulnerabilities
- [ ] Test app thoroughly in staging environment

### iOS Build

- [ ] Create development build for testing
- [ ] Create preview build for TestFlight
- [ ] Test preview build thoroughly
- [ ] Create production build: `eas build --platform ios --profile production`
- [ ] Upload to App Store Connect
- [ ] Fill in all App Store Connect information
- [ ] Add screenshots (iPhone, iPad if applicable)
- [ ] Complete age rating questionnaire
- [ ] Submit for review

### Android Build

- [ ] Create development build for testing
- [ ] Create preview build for internal testing
- [ ] Test preview build thoroughly
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
- [ ] Account deletion functionality

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
