import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Intelligence for Your Property | Kiado",
  description:
    "Kiado is the ultimate platform for managing your lets, simplifying everything from maintenance to payments. Join our waitlist and be the first to know when we launch.",
  keywords:
    "property management, rental management, property intelligence, maintenance, payment processing, tenant communication, property analytics, real estate technology, kiado",
  authors: [{ name: "Mozaik Software Solutions Ltd" }],
  creator: "Mozaik Software Solutions Ltd",
  publisher: "Mozaik Software Solutions Ltd",
  openGraph: {
    title: "Intelligence for Your Property | Kiado",
    description:
      "Kiado is the ultimate platform for managing your lets, simplifying everything from maintenance to payments. Join our waitlist and be the first to know when we launch.",
    url: "https://www.kiado.co.uk",
    siteName: "Kiado",
    locale: "en_GB",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Kiado",
    url: "https://www.kiado.co.uk",
    description:
      "The ultimate platform for managing your lets, simplifying maintenance and payments.",
    contactPoint: {
      "@type": "ContactPoint",
      email: "info@kiado.mozaiksoftwaresolutions.com",
      contactType: "customer support",
    },
  };

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
