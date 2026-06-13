export const SUPPORT_EMAIL = "info@mozaiksoftwaresolutions.com";

export type FaqItem = {
  question: string;
  answer: string;
};

export type FaqCategory = {
  title: string;
  items: FaqItem[];
};

export const SERVICE_OPERATOR_FAQ_CATEGORIES: FaqCategory[] = [
  {
    title: "Getting Started",
    items: [
      {
        question: "How do I set up my profile?",
        answer:
          "After registering as a service operator, complete your profile by selecting the services you offer, adding your location, and writing a short description. Landlords will see this when reviewing your application for a job.",
      },
      {
        question: "Do I need to connect Stripe before applying for jobs?",
        answer:
          "You can browse and apply for jobs without Stripe connected, but you won't be able to receive payment until you set up your payout account. Go to More → Payout Settings to connect Stripe before your first job is approved.",
      },
      {
        question: "How do landlords find me?",
        answer:
          "When a landlord posts a job, operators who offer the relevant service type are notified. You can then browse open jobs and submit a quote. Landlords review all applications and choose the best fit.",
      },
    ],
  },
  {
    title: "Jobs & Quotes",
    items: [
      {
        question: "How do I apply for a job?",
        answer:
          "Open an available job, review the property details, and tap 'Submit your quote'. Enter your price and an optional cover note explaining your experience and availability. The landlord will be notified of your application.",
      },
      {
        question: "Can I withdraw an application?",
        answer:
          "Yes. In My Jobs, tap the application you want to withdraw and select Withdraw. You can only withdraw while the application is still pending — once approved, contact support to discuss cancellation.",
      },
      {
        question: "What happens after my application is approved?",
        answer:
          "When a landlord approves your application, payment is held in escrow by Stripe. A message channel is opened so you can coordinate with the landlord. Once the job is marked complete, the payment is released to your Stripe account minus the 6% platform fee.",
      },
      {
        question: "What if the landlord cancels the job?",
        answer:
          "If a landlord cancels a job after your application has been approved, any held payment is released back to them. Contact support at " +
          SUPPORT_EMAIL +
          " if you believe you're owed compensation for work already started.",
      },
    ],
  },
  {
    title: "Payments & Payouts",
    items: [
      {
        question: "What is the platform fee?",
        answer:
          "Kiado charges a 6% platform fee on service jobs. This is deducted from your quote price at the point of payout. For example, a £100 quote results in a £94 payout to you. The fee is always shown to you before you submit a quote.",
      },
      {
        question: "When do I get paid?",
        answer:
          "Payment is released to your Stripe account once the landlord marks the job as complete. Stripe then pays out to your bank account according to your payout schedule, which is typically 2–7 business days.",
      },
      {
        question: "How do I connect my bank account?",
        answer:
          "Go to More → Payout Settings and tap 'Connect New Stripe Account'. You'll be guided through Stripe's onboarding where you can add your bank details. This only needs to be done once.",
      },
      {
        question: "What if I haven't been paid after the job is complete?",
        answer:
          "First check your Stripe dashboard to confirm the payout is in progress. Stripe payouts typically take 2–7 business days. If it's been longer, contact us at " +
          SUPPORT_EMAIL +
          " with your job details.",
      },
    ],
  },
  {
    title: "Account",
    items: [
      {
        question: "How do I update my availability?",
        answer:
          "Go to More and use the availability toggle at the top of the screen. When set to unavailable, you won't receive notifications about new jobs in your area.",
      },
      {
        question: "How do I change my password?",
        answer:
          "Go to More → Change Password. Enter your current password and then your new password. If you've forgotten your password, use the 'Forgot password' option on the sign-in screen.",
      },
      {
        question: "How do I contact support?",
        answer:
          "You can reach us any time at " +
          SUPPORT_EMAIL +
          ". We aim to respond within one business day.",
      },
    ],
  },
];

export const FAQ_CATEGORIES: FaqCategory[] = [
  {
    title: "Bookings",
    items: [
      {
        question: "How do I approve a booking request?",
        answer:
          "When a tenant requests a booking, you'll receive a notification. You have 48 hours to confirm or decline. Go to the Bookings section and tap Confirm or Decline on any pending request. If you don't respond within 48 hours, the request expires automatically.",
      },
      {
        question: "What happens if I don't respond within 48 hours?",
        answer:
          "Booking requests expire after 48 hours if you haven't responded. The tenant is notified and can request other properties. Expired requests will no longer appear in your active bookings list.",
      },
      {
        question: "Can I cancel a confirmed booking?",
        answer:
          "Cancellations of confirmed bookings are handled on a case-by-case basis. Please contact support at " +
          SUPPORT_EMAIL +
          " with your booking details. Note that cancellations may affect your standing as a host.",
      },
      {
        question: "When does the tenant get charged?",
        answer:
          "Tenants save their payment method when they book. Their card is automatically charged 48 hours before the check-in date. You'll see the booking move to 'paid' status once the charge succeeds.",
      },
    ],
  },
  {
    title: "Payments & Payouts",
    items: [
      {
        question: "How do I receive payments?",
        answer:
          "You need to connect a Stripe account to receive payouts. Go to Earnings and tap Connect Stripe. You'll be guided through a short onboarding process. Once connected, funds are transferred to your Stripe account automatically after a tenant pays.",
      },
      {
        question: "What is the platform fee?",
        answer:
          "Kiado charges a 6% platform fee on each booking. Your payout is always shown as the net amount — the booking total minus the 6% fee. For example, a £1,000 booking results in a £940 payout to you.",
      },
      {
        question: "When will I receive my payout?",
        answer:
          "Payouts are processed by Stripe after the tenant's card is charged (48 hours before check-in). The time it takes to reach your bank account depends on your Stripe payout schedule, which is typically 2–7 business days.",
      },
      {
        question: "What happens if a payment fails?",
        answer:
          "If the tenant's payment fails, the booking is not charged and the tenant is notified to update their payment method. Contact support if the issue persists and you need assistance resolving the booking.",
      },
    ],
  },
  {
    title: "Properties",
    items: [
      {
        question: "How do I list a property?",
        answer:
          "Go to Properties and tap the + button. Fill in your property details, add photos, set your nightly rate, and complete the surveillance declaration. Once submitted, your listing is live and visible to tenants.",
      },
      {
        question: "What is the surveillance declaration?",
        answer:
          "As a landlord, you're legally required to declare whether your property has any surveillance devices. You must state either that there are no surveillance devices, or that there are only external devices (e.g. a doorbell camera). This declaration is shown to tenants before they book.",
      },
      {
        question: "How do I block unavailable dates?",
        answer:
          "Open a property, go to the availability section, and select the dates you want to block. Blocked dates will show as unavailable to tenants browsing your listing.",
      },
      {
        question: "Can I edit a property after it's live?",
        answer:
          "Yes. Go to Properties, select the property, and tap Edit. You can update any details including photos, description, price, and availability at any time.",
      },
    ],
  },
  {
    title: "Safety & Reports",
    items: [
      {
        question: "What is a surveillance report?",
        answer:
          "Tenants can file a report if they suspect undisclosed surveillance devices in a property. Reports are reviewed by our team and you'll be notified if one is filed against your property.",
      },
      {
        question: "What happens after a report is filed?",
        answer:
          "Our team reviews the report and may mark it as 'Investigating'. You'll receive a notification about the report status. If no breach is found, the report is resolved with no action taken. If a breach is confirmed, your listing may be suspended.",
      },
      {
        question: "What does 'Breach Confirmed' mean for my listing?",
        answer:
          "If a surveillance breach is confirmed, your listing will be suspended and you'll be notified. Please contact support immediately at " +
          SUPPORT_EMAIL +
          " to discuss next steps and resolve the issue.",
      },
    ],
  },
  {
    title: "Account",
    items: [
      {
        question: "How do I change my password?",
        answer:
          "Go to More → Change Password. Enter your current password and then your new password. If you've forgotten your password, use the 'Forgot password' option on the sign-in screen.",
      },
      {
        question: "How do I delete my account?",
        answer:
          "Go to More → Delete Account. This action is permanent and will remove all your data including properties, bookings, and messages. Make sure all active bookings are resolved before deleting your account.",
      },
      {
        question: "How do I contact support?",
        answer:
          "You can reach us any time at " +
          SUPPORT_EMAIL +
          ". We aim to respond within one business day.",
      },
    ],
  },
];
