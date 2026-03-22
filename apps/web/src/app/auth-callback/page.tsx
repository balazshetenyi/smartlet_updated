"use client";

import { useEffect } from "react";

export default function AuthCallback() {
  useEffect(() => {
    try {
      const hash = typeof window !== "undefined" ? window.location.hash : "";

      if (!hash) {
        // No tokens, go to sign-in
        window.location.replace("/sign-in");
        return;
      }

      // Convert fragment to query string and redirect
      const query = hash.replace(/^#/, "?");
      const target = "/sign-in" + query;
      const absolute = window.location.origin + target;
      window.location.replace(absolute);
    } catch (e) {
      window.location.replace("/sign-in");
    }
  }, []);

  return (
    <div
      style={{
        padding: 24,
        fontFamily: "system-ui, -apple-system, Roboto, sans-serif",
      }}
    >
      <h1>Signing you in…</h1>
      <p>Please wait — we are signing you in and will redirect you shortly.</p>
    </div>
  );
}
