export const metadata = {
  title: "Delete Account | Kiado",
  description: "How to delete your Kiado account and associated data",
};

export default function DeleteAccountPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">
        Delete Your Kiado Account
      </h1>

      <p className="mb-6 text-gray-600 leading-relaxed">
        You can delete your Kiado account and all associated data directly from
        within the app. Follow the steps below.
      </p>

      <h2 className="text-xl font-semibold mb-3 text-gray-800">
        How to delete your account in the app
      </h2>
      <ol className="list-decimal ml-6 mb-8 text-gray-600 space-y-2">
        <li>Open the Kiado app and sign in</li>
        <li>
          Tap the <strong>Profile</strong> tab at the bottom of the screen
        </li>
        <li>
          Scroll to the bottom and tap <strong>Delete Account</strong>
        </li>
        <li>Confirm your choice when prompted</li>
      </ol>

      <h2 className="text-xl font-semibold mb-3 text-gray-800">
        What data is deleted
      </h2>
      <ul className="list-disc ml-6 mb-8 text-gray-600 space-y-2">
        <li>Your profile information (name, email, phone number, avatar)</li>
        <li>Your messages and conversations</li>
        <li>Your property listings and photos (if you are a landlord)</li>
        <li>Your booking history</li>
        <li>Your account credentials</li>
      </ul>

      <h2 className="text-xl font-semibold mb-3 text-gray-800">
        Data retention
      </h2>
      <p className="mb-6 text-gray-600 leading-relaxed">
        Some data may be retained for up to 90 days for legal and fraud
        prevention purposes before being permanently deleted. Payment
        transaction records may be retained as required by applicable financial
        regulations.
      </p>

      <h2 className="text-xl font-semibold mb-3 text-gray-800">
        Request deletion by email
      </h2>
      <p className="text-gray-600 leading-relaxed">
        If you are unable to access the app, you can request account deletion by
        emailing us at{" "}
        <a
          href="mailto:info@mozaiksoftwaresolutions.com"
          className="text-blue-600 underline"
        >
          info@mozaiksoftwaresolutions.com
        </a>{" "}
        from the email address associated with your account.
      </p>
    </main>
  );
}
