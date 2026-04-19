export const PRIVACY_POLICY = `
# Privacy Policy for Kiado

**Last Updated: 5 April 2026**

Kiado is operated by **Mozaik Software Solutions Ltd**, a company registered in England and Wales, with its registered office at Suite RA01, 195–197 Wood Street, London, E17 3NU ("we", "us", or "our"). We act as the data controller for the personal data described in this policy.

---

## 1. Introduction

This Privacy Policy explains what personal data we collect, why we collect it, how we use it, and your rights in relation to it when you use the Kiado mobile application and related services (collectively, the "App").

Please read this policy carefully. By using the App you confirm that you have read and understood it. If you do not agree, please do not use the App.

---

## 2. Data We Collect

### 2.1 Account & Profile Information
- Full name and email address
- Profile picture
- Phone number
- User role (landlord or tenant)

### 2.2 Property Information (Landlords)
- Property address, description, pricing, and availability
- Property photographs

### 2.3 Location Data
- Approximate or precise device location, collected only when you grant permission, to show nearby properties and assist with property search.

### 2.4 Payment & Financial Information
- Payment card details (collected and processed directly by Stripe — we do not store your full card number or CVV)
- For landlords: bank account details and identity verification information submitted during Stripe Connect onboarding

### 2.5 Communications
- Messages exchanged between landlords and tenants within the App
- Booking requests, responses, and status updates

### 2.6 Technical & Device Data
- Device type, operating system, and version
- App version and crash reports
- IP address
- Push notification token
- Session and usage data collected by our error-monitoring service (see section 5)

### 2.7 Waitlist Data (Website)
- Email address, if you sign up to our early-access waitlist at kiado.co.uk

---

## 3. How We Use Your Data

| Purpose | Lawful Basis |
|---|---|
| Creating and managing your account | Performance of a contract |
| Processing bookings and payments | Performance of a contract |
| Facilitating messages between landlords and tenants | Performance of a contract |
| Sending transactional emails (booking confirmations, payment reminders) | Performance of a contract |
| Sending push notifications about bookings and messages | Performance of a contract / Legitimate interests |
| Showing your location on the property map | Consent (location permission) |
| Address autocomplete when creating or searching listings | Performance of a contract |
| Monitoring app errors, crashes, and performance | Legitimate interests (maintaining a reliable service) |
| Preventing fraud and ensuring security | Legitimate interests / Legal obligation |
| Complying with legal and regulatory obligations | Legal obligation |
| Improving the App based on usage patterns | Legitimate interests |

Where we rely on **legitimate interests**, we have considered those interests against your rights and are satisfied they do not override them. You may object to processing based on legitimate interests at any time (see section 9).

Where we rely on **consent** (e.g. location access), you may withdraw consent at any time via your device settings. Withdrawal does not affect the lawfulness of processing before withdrawal.

---

## 4. Data Sharing and Disclosure

We do not sell your personal data. We share it only in the following circumstances:

**With other users of the App**
Profile information (name, profile picture, user role) is visible to other users as necessary to facilitate bookings and communications.

**With service providers**
We share data with trusted third-party providers who process it on our behalf (see section 5 for full details). All providers are bound by data processing agreements.

**For legal reasons**
We may disclose data where required by law, court order, or regulatory authority, or to protect the rights, property, or safety of Kiado, our users, or others.

**Business transfers**
In the event of a merger, acquisition, or sale of assets, personal data may be transferred to the successor entity, subject to equivalent privacy protections.

---

## 5. Third-Party Services

We use the following third-party services. Each has its own privacy policy governing its use of your data.

**Supabase** — Database, authentication, file storage, and serverless functions. Your account credentials, profile data, property listings, messages, and booking records are stored in Supabase.
Privacy policy: supabase.com/privacy

**Stripe** — Payment processing. When you make or receive a payment, your payment method data is collected by Stripe directly. Landlords who set up payouts submit identity and bank account details to Stripe via Stripe Connect. We do not store card numbers or sensitive financial data ourselves.
Privacy policy: stripe.com/gb/privacy

**Google Places API** — Address autocomplete and geocoding. When you type a property address, your search input is sent to Google's Places API via a proxied server-side function. No location data from your device is sent to Google via this service.
Privacy policy: policies.google.com/privacy

**Google Maps** — In-app map display. Property locations are displayed on a Google Maps component embedded in the App. Google may collect device and usage data in accordance with its privacy policy.
Privacy policy: policies.google.com/privacy

**Sentry** — Error monitoring, crash reporting, performance tracing, session replay, and in-app feedback. Sentry is configured to collect personally identifiable information including your **IP address**, device identifiers, and app session data to help us diagnose errors and improve reliability.
Privacy policy: sentry.io/privacy

**Resend** — Transactional email delivery. Your email address and relevant booking or account information are passed to Resend to deliver emails such as booking confirmations, payment reminders, messages, and your welcome email.
Privacy policy: resend.com/privacy

**Expo** — App build infrastructure and push notification delivery. Your device's push notification token is stored and used to deliver in-app notifications via Expo's push notification service.
Privacy policy: expo.dev/privacy

---

## 6. International Data Transfers

Some of our third-party providers are based in the United States or other countries outside the UK and European Economic Area (EEA). When we transfer your personal data outside the UK, we ensure appropriate safeguards are in place, such as the UK International Data Transfer Agreement (IDTA) or Standard Contractual Clauses (SCCs) approved by the Information Commissioner's Office (ICO).

Providers that may process data outside the UK include: Sentry, Stripe, Google, Resend, and Expo.

---

## 7. Data Security

We implement appropriate technical and organisational measures to protect your personal data, including:

- Encrypted data storage and transmission (HTTPS/TLS)
- Secure authentication via Supabase with hashed passwords
- Row-level security policies on our database
- Restricted access to production systems
- Regular review of third-party security practices

No method of transmission over the internet is 100% secure. While we take all reasonable precautions, we cannot guarantee absolute security.

---

## 8. Data Retention

| Data category | Retention period |
|---|---|
| Account and profile data | For the lifetime of your account, then deleted within 30 days of account closure |
| Property listings | For the lifetime of the listing, then deleted with your account |
| Booking and payment records | 7 years from the date of the transaction (financial regulation requirement) |
| Messages and communications | For the lifetime of your account |
| Error and session data (Sentry) | 90 days |
| Push notification tokens | Deleted when you sign out or delete your account |
| Waitlist email addresses | Until you request removal or Kiado launches publicly |

You may request deletion of your account and data at any time from within the App (Profile → Delete Account) or by emailing info@mozaiksoftwaresolutions.com.

---

## 9. Your Rights Under UK GDPR

Under the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018, you have the following rights:

- **Right of access** — You may request a copy of the personal data we hold about you.
- **Right to rectification** — You may ask us to correct inaccurate or incomplete data.
- **Right to erasure** — You may ask us to delete your personal data, subject to certain legal exceptions.
- **Right to restriction** — You may ask us to restrict how we process your data in certain circumstances.
- **Right to data portability** — You may request your data in a structured, machine-readable format.
- **Right to object** — You may object to processing based on legitimate interests or for direct marketing purposes.
- **Right to withdraw consent** — Where processing is based on consent (e.g. location), you may withdraw it at any time via your device settings, without affecting the lawfulness of prior processing.
- **Rights related to automated decision-making** — We do not make solely automated decisions with legal or significant effects on you.

To exercise any of these rights, contact us at info@mozaiksoftwaresolutions.com. We will respond within one calendar month.

---

## 10. Right to Complain

If you believe we have not handled your personal data in accordance with applicable law, you have the right to lodge a complaint with the **Information Commissioner's Office (ICO)**:

- Website: ico.org.uk
- Helpline: 0303 123 1113
- Post: Information Commissioner's Office, Wycliffe House, Water Lane, Wilmslow, Cheshire, SK9 5AF

We would, however, appreciate the opportunity to address your concerns before you approach the ICO — please contact us first.

---

## 11. Children's Privacy

The App is intended for users who are 18 years of age or older. We do not knowingly collect personal data from anyone under 18. If you believe a minor has provided us with personal data, please contact us and we will delete it promptly.

---

## 12. Changes to This Policy

We may update this Privacy Policy from time to time. We will notify you of material changes by updating the "Last Updated" date at the top of this policy and, where appropriate, by in-app notification or email. Continued use of the App after changes take effect constitutes acceptance of the revised policy.

---

## 13. Contact Us

If you have any questions, concerns, or requests relating to this Privacy Policy or your personal data, please contact us:

- **Email:** info@mozaiksoftwaresolutions.com
- **Post:** Mozaik Software Solutions Ltd, Suite RA01, 195–197 Wood Street, London, E17 3NU
`;
