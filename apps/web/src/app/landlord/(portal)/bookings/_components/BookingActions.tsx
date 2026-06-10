"use client";

import { createClient } from "@/lib/supabase/client";
import { Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function BookingActions({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"confirm" | "decline" | null>(null);
  const [error, setError] = useState("");

  const handleAction = async (action: "confirm" | "decline") => {
    setLoading(action);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.functions.invoke(
      action === "confirm" ? "confirm-booking-manual" : "decline-booking",
      { body: { bookingId } },
    );
    if (error) {
      setError(error.message ?? "Something went wrong");
    } else {
      router.refresh();
    }
    setLoading(null);
  };

  return (
    <div className="mt-4 flex items-center gap-2">
      <button
        onClick={() => handleAction("confirm")}
        disabled={loading !== null}
        className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors disabled:opacity-60"
      >
        <Check size={14} />
        {loading === "confirm" ? "Confirming…" : "Confirm"}
      </button>
      <button
        onClick={() => handleAction("decline")}
        disabled={loading !== null}
        className="flex items-center gap-1.5 bg-white hover:bg-red-50 text-red-600 border border-red-200 text-sm font-medium px-4 py-2 rounded-xl transition-colors disabled:opacity-60"
      >
        <X size={14} />
        {loading === "decline" ? "Declining…" : "Decline"}
      </button>
      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  );
}
