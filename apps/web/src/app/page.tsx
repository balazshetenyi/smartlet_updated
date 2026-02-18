"use client";

import { useState } from "react";
import Image from "next/image";
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
      setMessage(result.error);
    } else {
      setStatus("success");
      setMessage("You're on the list!");
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 font-sans dark:bg-darkslateblue dark:text-zinc-50">
      <main className="flex max-w-2xl flex-col items-center text-center">
        <div className="mb-8 flex items-center gap-2">
          <Image src={logo} alt={"Kiado Logo"} width={360} height={130} />
        </div>

        <h1 className="mb-4 text-4xl text-darkslateblue font-extrabold tracking-tight sm:text-6xl">
          Intelligence for your property.
        </h1>

        <p className="mb-10 text-lg text-zinc-600 dark:text-zinc-400 sm:text-xl">
          The ultimate platform for managing your lets simplifies everything
          from maintenance to payments. We are launching soon.
        </p>

        <form
          action={handleSubmit}
          className="flex w-full max-w-md flex-col gap-3 sm:flex-row"
        >
          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            className="h-12 flex-1 rounded-full border border-zinc-200 bg-zinc-50 px-6 text-sm focus:outline-none focus:ring-2 focus:ring-black dark:border-zinc-800 dark:bg-zinc-900 dark:focus:ring-zinc-50"
            required
            disabled={status === "loading" || status === "success"}
          />
          <button
            type="submit"
            disabled={status === "loading" || status === "success"}
            className="h-12 rounded-full bg-darkslateblue px-8 text-sm font-medium text-white transition-opacity hover:opacity-90 dark:bg-zinc-50 dark:text-black"
          >
            {status === "loading"
              ? "Joining..."
              : status === "success"
                ? "Joined!"
                : "Notify Me"}
          </button>
        </form>

        {message && <p className="mt-2 text-sm text-zinc-600">{message}</p>}

        <p className="mt-4 text-xs text-zinc-500">
          Be the first to know when we go live. No spam, ever.
        </p>
      </main>

      <footer className="absolute bottom-8 flex gap-6 text-sm text-zinc-500">
        <a href="#" className="hover:text-darkslateblue dark:hover:text-white">
          Contact
        </a>
      </footer>
    </div>
  );
}
