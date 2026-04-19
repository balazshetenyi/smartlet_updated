import ReactMarkdown from "react-markdown";
import { TERMS_OF_SERVICE } from "@kiado/shared/content/terms-of-service";

export const metadata = {
  title: "Terms of Service | Kiado",
  description: "Kiado Terms of Service",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1 className="text-3xl font-bold mb-6 text-gray-900">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold mt-8 mb-3 text-gray-800">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold mt-6 mb-2 text-gray-800">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="mb-4 text-gray-600 leading-relaxed">{children}</p>
          ),
          li: ({ children }) => (
            <li className="ml-4 mb-1 text-gray-600 list-disc">{children}</li>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-gray-800">{children}</strong>
          ),
        }}
      >
        {TERMS_OF_SERVICE}
      </ReactMarkdown>
    </main>
  );
}
