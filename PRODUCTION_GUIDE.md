# Kiado Production Deployment Guide

This guide will help you prepare and deploy the Kiado app to production.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Setup](#environment-setup)
3. [Building for Production](#building-for-production)
4. [App Store Submission](#app-store-submission)
5. [Post-Deployment](#post-deployment)

---

## Pre-Deployment Checklist

### ✅ Phase 1: Security & Configuration (COMPLETED)

- [x] Remove `.env` from git history
- [x] Create `.env.example` template
- [x] Set up logging utility (no console.log in production)
- [x] Add environment variable validation
- [x] Configure bundle identifiers (iOS/Android)
- [x] Add app permissions
- [x] Privacy Policy created
- [x] Terms of Service created
- [x] Error tracking configured (Sentry)
- [x] Error Boundaries implemented
- [x] Offline handling added

### 📋 Phase 2: Configuration Tasks (TODO)

#### 1. Update app.json

Edit `app.json` and replace placeholder values:

```json
{
  "owner": "your-expo-username",
  "extra": {
    "eas": {
      "projectId": "your-actual-project-id"
    }
  }
}
```

#### 2. Set Up Production Environment Variables

Create `.env.production` file:

```bash
cp .env.example .env.production
```

Fill in production values:

- `EXPO_PUBLIC_ENVIRONMENT=production`
- Production Supabase credentials
- Production Stripe keys
- Sentry DSN
- Set `EXPO_PUBLIC_ENABLE_SENTRY=true`

#### 3. Configure Supabase for Production

**Database:**

- Review and optimize database indexes
- Set up Row Level Security (RLS) policies
- Create database backups
- Configure connection pooling

**Storage:**

- Set up storage bucket policies
- Configure CDN if needed
- Review file size limits

**Edge Functions:**

- Deploy Stripe payment function to production
- Set production environment variables in Supabase dashboard
- Test all functions with production credentials

**Authentication:**

- Configure email templates
- Set up password policies
- Configure OAuth providers (if applicable)
- Set up email/SMS quotas

#### 4. Configure Stripe for Production

- Create production Stripe account
- Get production API keys
- Set up webhooks: `https://your-supabase-url/functions/v1/stripe-webhook`
- Configure webhook events:
    - `payment_intent.succeeded`
    - `payment_intent.failed`
    - `charge.refunded`
- Test payment flow with production keys
- Set up billing and payout settings

#### 5. Set Up Sentry

1. Create account at https://sentry.io
2. Create new React Native project
3. Copy DSN to `.env.production`
4. Test error tracking in staging environment
5. Set up alerts and notifications
6. Configure release tracking

---

## Environment Setup

### Install Expo Application Services (EAS) CLI

```bash
npm install -g eas-cli
```

### Login to Expo

```bash
eas login
```

### Initialize EAS in your project

```bash
eas build:configure
```

### Update EAS Configuration

Edit `eas.json` and update the submit section with your credentials.

---

## Building for Production

### 1. iOS Build

#### Prerequisites

- Apple Developer Account ($99/year)
- App Store Connect access
- Apple Team ID

#### Steps

```bash
# Create production build
eas build --platform ios --profile production

# Or create a preview build for TestFlight
eas build --platform ios --profile preview
```

#### App Store Connect Setup

1. Go to https://appstoreconnect.apple.com
2. Create new app
3. Fill in app information:
    - Name: Kiado
    - Primary Language: English
    - Bundle ID: com.kiado.app
    - SKU: unique identifier
4. Add app description, screenshots, keywords
5. Set pricing (free/paid)
6. Add Privacy Policy and Terms URLs
7. Complete age rating questionnaire

### 2. Android Build

#### Prerequisites

- Google Play Developer Account ($25 one-time)
- Google Play Console access

#### Steps

```bash
# Create production build (AAB for Play Store)
eas build --platform android --profile production

# Or create a preview build (APK for testing)
eas build --platform android --profile preview
```

#### Google Play Console Setup

1. Go to https://play.google.com/console
2. Create new app
3. Fill in app information
4. Add store listing:
    - App name: Kiado
    - Short description
    - Full description
    - Screenshots (phone, tablet if applicable)
    - Feature graphic
    - App icon
5. Complete Content rating questionnaire
6. Add Privacy Policy and Terms URLs
7. Set pricing and distribution

---

## App Store Submission

### iOS Submission

```bash
# Submit to App Store
eas submit --platform ios --profile production
```

Or manually:

1. Download IPA from EAS build
2. Upload via Xcode or Transporter app
3. Go to App Store Connect
4. Select your build
5. Submit for review

### Android Submission

```bash
# Submit to Google Play
eas submit --platform android --profile production
```

Or manually:

1. Download AAB from EAS build
2. Go to Google Play Console
3. Create new release (Internal/Alpha/Beta/Production)
4. Upload AAB
5. Submit for review

---

## Post-Deployment

### 1. Monitor App Performance

**Sentry Dashboard:**

- Check for crashes and errors
- Review user impact
- Set up alerts for critical errors

**Analytics (Optional):**
Consider adding:

- Expo Analytics
- Firebase Analytics
- Amplitude

### 2. Set Up App Updates

**Over-The-Air (OTA) Updates:**

```bash
# Publish update without new build
eas update --branch production --message "Bug fixes"
```

**Note:** OTA updates only work for JavaScript/asset changes, not native code.

### 3. User Feedback

- Enable in-app review prompts
- Monitor app store reviews
- Set up support email/system
- Create FAQ section

### 4. Monitoring Checklist

- [ ] Set up uptime monitoring for backend
- [ ] Monitor Supabase usage and quotas
- [ ] Monitor Stripe transactions
- [ ] Check error rates in Sentry
- [ ] Review app store ratings
- [ ] Track key metrics (MAU, retention, etc.)

### 5. Compliance

- [ ] GDPR compliance (if EU users)
- [ ] CCPA compliance (if California users)
- [ ] Data retention policies
- [ ] User data export functionality
- [ ] Account deletion functionality

---

## Common Issues & Solutions

### Build Fails

- Check all environment variables are set
- Verify bundle identifier matches certificates
- Review build logs in EAS dashboard

### App Store Rejection

Common reasons:

- Missing/unclear privacy policy
- Incomplete app information
- Crashes during review
- Violation of guidelines

### Production Bugs

1. Check Sentry for error details
2. Use remote logging to debug
3. Release hotfix via OTA if possible
4. Submit new build if native changes needed

---

## Maintenance Schedule

### Weekly

- Review Sentry errors
- Check app store reviews
- Monitor key metrics

### Monthly

- Review and update dependencies
- Check for security vulnerabilities (`npm audit`)
- Review and optimize database performance
- Analyze user feedback

### Quarterly

- Update Privacy Policy if needed
- Review and update Terms of Service
- Major feature releases
- Performance optimization

---

## Additional Resources

- [Expo Documentation](https://docs.expo.dev)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Policies](https://play.google.com/about/developer-content-policy/)
- [Supabase Production Checklist](https://supabase.com/docs/guides/platform/going-into-prod)
- [Stripe Production Checklist](https://stripe.com/docs/development/checklist)

---

## Support

For issues or questions:

- Email: [YOUR SUPPORT EMAIL]
- GitHub Issues: [YOUR REPO URL]
- Documentation: [YOUR DOCS URL]
