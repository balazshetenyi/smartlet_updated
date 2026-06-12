"use client";

import { createClient } from "@/lib/supabase/client";
import { connectStripeAccount } from "@kiado/shared/services/stripe-service";
import { CheckCircle, AlertCircle, ExternalLink, Loader2 } from "lucide-react";
import { useState } from "react";

export default function StripeConnect({
  stripeAccountId,
}: {
  stripeAccountId: string | null;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleConnect = async (existingAccountId?: string) => {
    setLoading(true);
    setError("");
    const supabase = createClient();
    const returnUrl = `${window.location.origin}/landlord/earnings`;
    const { url, error } = await connectStripeAccount(supabase, {
      stripeAccountId: existingAccountId,
      returnUrl,
    });
    if (error) {
      setError(error);
      setLoading(false);
      return;
    }
    if (url) window.location.href = url;
  };

  if (stripeAccountId) {
    return (
      <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-2xl px-5 py-4 mb-6">
        <div className="flex items-center gap-3">
          <CheckCircle size={20} className="text-green-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-800">Stripe account connected</p>
            <p className="text-xs text-green-600 font-mono mt-0.5">{stripeAccountId}</p>
          </div>
        </div>
        <button
          onClick={() => handleConnect(stripeAccountId)}
          disabled={loading}
          className="flex items-center gap-1.5 text-sm font-medium text-green-700 hover:text-green-900 transition-colors disabled:opacity-60"
        >
          {loading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <ExternalLink size={14} />
          )}
          Manage payouts
        </button>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Connect Stripe to receive payouts</p>
            <p className="text-xs text-amber-600 mt-0.5">
              You won&apos;t receive any payments until your Stripe account is connected.
            </p>
          </div>
        </div>
        <button
          onClick={() => handleConnect()}
          disabled={loading}
          className="shrink-0 flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors disabled:opacity-60"
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          Connect Stripe
        </button>
      </div>
      {error && <p className="text-red-600 text-xs mt-3 ml-7">{error}</p>}
    </div>
  );
}
