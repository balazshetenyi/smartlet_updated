"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AuthCallback() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const hash = typeof window !== "undefined" ? window.location.hash : "";

      // Helpful debug while testing:
      // console.debug("[auth-callback] hash:", hash);

      if (!hash) {
        // No tokens or errors in fragment. Simply navigate to web sign-in page.
        router.replace("/sign-in");
        return;
      }

      // If Supabase returned an error in the fragment (e.g. otp_expired):
      // #error=access_denied&error_code=otp_expired&error_description=...
      const params = new URLSearchParams(hash.replace(/^#/, ""));
      if (params.has("error")) {
        const description =
          params.get("error_description") ||
          params.get("error") ||
          "Unknown error";
        setMessage(decodeURIComponent(description));
        // Stay on the page and show a message so desktop users don't see a blank page.
        return;
      }

      // Convert fragment to query string and navigate client-side.
      const query = "?" + hash.replace(/^#/, "");
      const target = "/sign-in" + query;

      // Use Next router to navigate within the app/site.
      router.replace(target);
    } catch (e) {
      console.error("[auth-callback] error:", e);
      router.replace("/sign-in");
    }
  }, [router]);

  return (
    <div
      style={{
        padding: 24,
        fontFamily: "system-ui, -apple-system, Roboto, sans-serif",
      }}
    >
      <h1>Signing you in…</h1>
      {message ? (
        <p style={{ color: "crimson" }}>There was a problem: {message}</p>
      ) : (
        <p>
          Please wait — we are processing your sign-in and will redirect you
          shortly.
        </p>
      )}
    </div>
  );
}
