import React from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { colours } from "@kiado/shared";
import { SafeAreaView } from "react-native-safe-area-context";
import Markdown from "react-native-markdown-display";

// You can copy/paste from apps/mobile/TERMS_OF_SERVICE.md or keep the markdown in the repo root.
// For simplicity, paste the content as a string below (or import if you prefer).
const TERMS_TEXT = `
  # Terms of Service for Kiado

  **Last Updated:** 8 March 2026

  These Terms of Service ("**Terms**") set out the terms on which you may use Kiado (the "**App**") and any related services made available by Kiado ("**we**", "**us**", or "**our**"). Please read them carefully. By accessing or using the App you agree to these Terms. If you do not agree, do not use the App.

  ---

  ## 1. Key definitions

  - **User**, **you** or **your** means any person who accesses or uses the App.
  - **Landlord** means a User who lists properties on the App.
  - **Tenant** means a User who searches for or books properties.
  - **Property** means a listing on the App offered by a Landlord.
  - **Booking** means a confirmed reservation for a Property through the App.

  ## 2. Acceptance and changes to these Terms

  - By using the App you accept and agree to comply with these Terms.
  - We may modify these Terms at any time. We will notify you of material changes through the App, by email (if available), or by posting the updated version. Continued use after changes indicates acceptance of the revised Terms.
  - If you do not agree to the revised Terms, you must stop using the App.

  ## 3. Who can use the App

  - You must be at least 18 years old to use the App.
  - You must provide complete and accurate information when registering and keep your account information up to date.
  - You are responsible for keeping your account credentials secure and for any activity that occurs under your account.

  ## 4. Your content and listings

  - You retain ownership of content you post (e.g., property descriptions, photos). You grant Kiado a non-exclusive, worldwide, royalty-free licence to use, reproduce, modify, publish, and display that content for the purpose of operating the App.
  - You must only post content that you have the right to use and that does not violate any laws or third-party rights.
  - We may remove or refuse content that violates these Terms or our policies.

  ## 5. Landlord obligations

  - Landlords must provide accurate descriptions, pricing, availability, and photos for their Properties.
  - Landlords must comply with all local laws, safety standards, and any applicable licensing or registration requirements.
  - Landlords are responsible for managing bookings, accepting or rejecting requests (if applicable), and for communicating with Tenants in a timely and professional manner.

  ## 6. Tenant obligations and bookings

  - Tenants must provide accurate booking information (name, contact details, payment details).
  - Bookings may be subject to the host’s approval or verification and to any property-specific rules.
  - Tenants must comply with the Property rules and respect the property and neighbours during their stay.

  ## 7. Payments, fees and refunds

  - Payments for Bookings are processed through third-party payment providers (for example, Stripe). When you make a Booking you agree to pay the amounts shown at checkout.
  - We may charge service fees; any fees will be disclosed at the time of payment.
  - Refunds, cancellations and rescheduling are governed by the Property’s cancellation policy and any local laws. Where applicable, we will facilitate refunds through our payment provider in accordance with the policy displayed at booking.
  - We are not responsible for payment provider fees, currency conversion fees, or banking charges applied by third parties.

  ## 8. Security and refunds for fraudulent activity

  - You should notify us immediately if you become aware of any unauthorised use of your account.
  - If a transaction is disputed (for example, because of fraud), we will cooperate with the payment provider and relevant authorities.

  ## 9. Insurance and deposits

  - Any security deposit requirement or insurance offering will be described on the listing or during booking.
  - We are not the insurer and do not guarantee that third-party insurance covers all events.
  - Landlords and Tenants should read the terms of any insurance or deposit arrangement carefully.

  ## 10. Prohibited conduct

  You must not:

  - Violate applicable laws or regulations.
  - Post or transmit content that is unlawful, defamatory, abusive, obscene, or discriminatory.
  - Use the App to harass, stalk, threaten, or abuse other people.
  - Attempt to access or interfere with another user’s account.
  - Circumvent fees or payment processes, or attempt to hide or falsify your identity or contact details.

  ## 11. Intellectual property

  - All rights, title and interest in the App and its content (other than user content) are owned by or licensed to Kiado.
  - You may not copy, reproduce, modify, distribute or create derivative works without our prior written consent.

  ## 12. Third-party services and links

  - The App may include links to third-party services (for example, payment providers). We do not control these third-party services and are not responsible for their terms or practices.
  - You should review the privacy and terms of each third party before using them.

  ## 13. Privacy and data protection

  - Our handling of personal data is set out in our Privacy Policy. By using the App you agree to the collection, use and disclosure of personal data in accordance with the Privacy Policy.
  - If you are in the UK, we will process personal data in accordance with applicable UK data protection law (including UK GDPR and the Data Protection Act 2018).
  - If you believe your data rights have been breached, contact us using the contact details below.

  ## 14. Disclaimers and no warranty

  - The App is provided “as is” and “as available” without warranties of any kind.
  - To the fullest extent permitted by law, we disclaim all warranties, whether express or implied, including but not limited to fitness for a particular purpose, accuracy, availability, or non-infringement.
  - We do not warrant that the App will be uninterrupted, secure, or error-free.

  ## 15. Limitation of liability

  - To the maximum extent permitted by law, Kiado’s total aggregate liability to you arising out of or in connection with the App or these Terms shall not exceed the total amount paid by you to Kiado in the 12 months preceding the claim (or £100, if greater protection is required by applicable law).
  - We are not liable for indirect, incidental, special, consequential or punitive damages, loss of profits, loss of data, or loss of goodwill.
  - Nothing in these Terms limits liability for: (i) death or personal injury caused by our negligence, (ii) fraud or fraudulent misrepresentation, or (iii) any other liability that cannot be limited under applicable law.

  ## 16. Indemnity

  - You agree to indemnify, defend and hold harmless Kiado and its officers, directors, employees, agents, and affiliates from and against any claims, damages, losses, liabilities and expenses (including reasonable legal fees) arising out of your use of the App, your breach of these Terms, or your violation of any law or the rights of a third party.

  ## 17. Termination and suspension

  - We may suspend or terminate your access to the App at any time for breach of these Terms, illegal activity, or where required by law.
  - You may close your account at any time. Termination does not affect rights or obligations accrued before termination.

  ## 18. Refunds and disputes

  - If you have a complaint about a Booking, please contact us promptly so we can try to resolve it.
  - In many cases disputes between Landlords and Tenants should be resolved between those parties; we may assist where appropriate.
  - For consumer Users in the UK, statutory consumer rights are not affected by these Terms.

  ## 19. Governing law and jurisdiction

  - These Terms shall be governed by and construed in accordance with the laws of England and Wales.
  - The courts of England and Wales shall have exclusive jurisdiction to resolve any disputes arising out of or in connection with these Terms, subject to any mandatory consumer protection laws that provide otherwise.

  ## 20. Changes to the App

  - We may modify, suspend, or discontinue the App (or any part of it) at any time, temporarily or permanently, with or without notice.

  ## 21. Notices

  - We may provide notices to you via the App, email (if you have provided one), or in-app messaging. Notices will be effective when sent.

  ## 22. Severability and waiver

  - If any provision of these Terms is held to be invalid or unenforceable, the remaining provisions remain in full force and effect.
  - Our failure to enforce any right or provision in these Terms does not constitute a waiver of that right.

  ## 23. Entire agreement

  - These Terms, together with our Privacy Policy and any other documents expressly referred to in them, constitute the whole agreement between you and Kiado in relation to your use of the App.

  ## 24. Contact

  If you have questions, concerns, or a request under data protection law, contact us at:

  - **Email:** info@mozaiksoftwaresolutions.com
  - **Address:** Suite RA01, 195-197 Wood Street, London, E17 3NU

  ## 25. Additional notes for Landlords and Tenants

  - Local laws relating to rental, housing, taxes and safety (for example licensing or registration) may apply to Landlords. Compliance is the responsibility of the Landlord.
  - Tenants should check property details and house rules carefully before booking.

  ## 26. Consumer information (UK)

  - Nothing in these Terms seeks to exclude or limit rights that you may have as a consumer under applicable UK consumer protection laws.
  - If you are a consumer, certain provisions may not apply to the extent they conflict with mandatory consumer rights.

`;

export default function TermsOfServiceScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Terms of Service</Text>
        <Markdown>{TERMS_TEXT}</Markdown>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colours.surface },
  content: { padding: 20 },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colours.text,
    marginBottom: 8,
  },
  body: { color: colours.text, fontSize: 14, lineHeight: 20 },
});
