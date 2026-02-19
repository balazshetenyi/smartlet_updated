"use client";

import { useState } from "react";
import Image from "next/image";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Layers,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import logo from "@kiado/shared/assets/images/kiado-logo.png";
import { subscribeToWaitlist } from "@/api/actions/email-actions";

export default function Home() {
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(formData: FormData) {
    setStatus("loading");
    const result = await subscribeToWaitlist(formData);

    if (result.error) {
      setStatus("error");
      const errorMessage =
        typeof result.error === "string"
          ? result.error
          : result.error.errors.join(", ");
      setMessage(errorMessage);
    } else {
      setStatus("success");
      setMessage("You're on the list!");
    }
  }

  const WaitlistForm = () => (
    <div className="w-full max-w-md">
      <form action={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          name="email"
          placeholder="Enter your email"
          className="p-3 flex-1 rounded-full border border-zinc-200 bg-zinc-50 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:border-zinc-800 dark:bg-zinc-900 dark:focus:ring-zinc-50"
          required
          disabled={status === "loading" || status === "success"}
        />
        <button
          type="submit"
          disabled={status === "loading" || status === "success"}
          className="h-12 rounded-full bg-darkslateblue px-8 text-sm font-medium text-white transition-opacity hover:opacity-90 dark:bg-zinc-50 dark:text-black cursor-pointer"
        >
          {status === "loading"
            ? "Joining..."
            : status === "success"
              ? "Joined!"
              : "Join Early Access"}
        </button>
      </form>
      {message && (
        <p
          className={`mt-3 text-sm font-medium ${status === "error" ? "text-red-500" : "text-emerald-600"}`}
        >
          {message}
        </p>
      )}
      <p className="mt-4 text-xs text-zinc-500">
        Simple pricing. No unnecessary complexity.
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-white font-sans text-darkslateblue selection:bg-zinc-100 dark:bg-darkslateblue dark:text-zinc-50">
      {/* Hero Section */}
      <header className="flex flex-col items-center px-6 pt-16 pb-24 text-center md:pt-24 md:pb-32">
        <Image
          src={logo}
          alt="Kiado Logo"
          width={240}
          height={86}
          className="mb-12"
          priority
        />
        <h1 className="mb-6 max-w-4xl text-5xl font-extrabold tracking-tight sm:text-7xl">
          Property management,{" "}
          <span className="text-darkslateblue dark:text-zinc-400">
            simplified.
          </span>
        </h1>
        <p className="mb-10 max-w-xl text-lg text-zinc-600 dark:text-zinc-400 sm:text-xl">
          Kiado brings rent, tenants and maintenance together in one clear,
          affordable platform.
        </p>
        {WaitlistForm()}
      </header>

      {/* Short Positioning */}
      <section className="bg-zinc-50 px-6 py-24 dark:bg-zinc-900/50">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-2xl font-medium leading-relaxed sm:text-3xl">
            Whether you manage one property or many, Kiado helps you stay
            organised without the overhead of traditional systems.
          </p>
          <div className="mt-8 flex justify-center gap-8 text-sm font-bold uppercase tracking-widest text-zinc-400">
            <span>Clean</span>
            <span>Practical</span>
            <span>Reliable</span>
          </div>
        </div>
      </section>

      {/* The Problem & Solution */}
      <section className="mx-auto max-w-6xl px-6 py-24 md:py-32">
        <div className="grid gap-16 md:grid-cols-2">
          {/* Problem */}
          <div className="space-y-8">
            <h2 className="text-3xl font-bold">
              Managing property often means:
            </h2>
            <ul className="space-y-4">
              {[
                { icon: Clock, text: "Chasing payments" },
                { icon: Layers, text: "Searching for documents" },
                { icon: AlertCircle, text: "Scattered conversations" },
                { icon: XCircle, text: "Too many tools doing too little" },
              ].map((item, i) => (
                <li
                  key={i}
                  className="flex items-center gap-4 text-lg text-zinc-600 dark:text-zinc-400"
                >
                  <item.icon className="h-5 w-5 text-red-400" />
                  {item.text}
                </li>
              ))}
            </ul>
            <p className="text-xl font-medium text-darkslateblue">
              It doesn’t have to feel that way.
            </p>
          </div>

          {/* Solution */}
          <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 md:p-12">
            <h2 className="mb-8 text-3xl font-bold">Kiado gives you:</h2>
            <ul className="space-y-5">
              {[
                "Clear rent tracking",
                "Structured tenant management",
                "Simple maintenance logging",
                "Secure document storage",
                "Helpful reminders",
              ].map((text, i) => (
                <li key={i} className="flex items-center gap-4 text-lg">
                  <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                  {text}
                </li>
              ))}
            </ul>
            <p className="mt-8 font-semibold italic text-zinc-500">
              Everything in one place. Nothing you don’t need.
            </p>
          </div>
        </div>
      </section>

      {/* Affordability & Vision */}
      <section className="border-t border-zinc-100 px-6 py-24 dark:border-zinc-900">
        <div className="mx-auto max-w-4xl grid gap-12 text-center md:grid-cols-2 md:text-left">
          <div className="space-y-4">
            <div className="flex justify-center md:justify-start">
              <Wallet className="h-8 w-8 text-darkslateblue" />
            </div>
            <h3 className="text-2xl font-bold italic">
              Designed to be accessible.
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400">
              Professional tools shouldn’t come with enterprise pricing.
            </p>
          </div>
          <div className="space-y-4">
            <div className="flex justify-center md:justify-start">
              <ShieldCheck className="h-8 w-8 text-darkslateblue" />
            </div>
            <h3 className="text-2xl font-bold">Future Vision</h3>
            <p className="text-zinc-600 dark:text-zinc-400">
              We’re building a platform that supports better property
              relationships — for owners and guests alike. It starts with
              clarity.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <footer className="bg-darkslateblue px-6 py-24 text-center text-white dark:bg-zinc-900">
        <h2 className="mb-6 text-3xl font-bold sm:text-4xl">
          Be part of the first release.
        </h2>
        <p className="mb-10 text-zinc-300">
          Join the waitlist and see what simpler property management feels like.
        </p>
        <div className="flex justify-center">{WaitlistForm()}</div>
        <div className="mt-20 border-t border-white/10 pt-8 text-sm text-zinc-400">
          <a
            href="mailto:info@kiado.mozaiksoftwaresolutions.com"
            className="hover:text-white transition-colors"
          >
            Contact Support
          </a>
        </div>
      </footer>
    </div>
  );
}

const XCircle = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="Ref-X-Path-Simplified"
    />
    <circle cx="12" cy="12" r="10" strokeWidth={2} />
    <path d="m15 9-6 6M9 9l6 6" strokeWidth={2} />
  </svg>
);
