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
    <html>
      <head>
        <meta charSet="utf-8" />
        <title>Signing you in…</title>
      </head>
      <body>
        <p>Signing you in…</p>
      </body>
    </html>
  );
}
