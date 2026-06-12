"use client";

import type { LandlordBooking } from "@/lib/booking-service";
import { createClient } from "@/lib/supabase/client";
import {
  Building2,
  CalendarDays,
  Loader2,
  MessageSquare,
  User,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  completed: "bg-gray-100 text-gray-600",
  declined: "bg-red-100 text-red-700",
};

export const STATUS_LABELS: Record<string, string> = {
  pending: "Awaiting approval",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  completed: "Completed",
  declined: "Declined",
};

export const PAYMENT_COLORS: Record<string, string> = {
  pending: "text-amber-600",
  due: "text-orange-600",
  overdue: "text-red-600",
  paid: "text-green-600",
  failed: "text-red-600",
  refunded: "text-gray-500",
};

export function paymentLabel(booking: LandlordBooking): string {
  if (booking.payment_status === "due") {
    const isPast = new Date(booking.check_out) < new Date();
    if (isPast) return "Overdue";
    return booking.payment_due_at ? `Due ${fmtDate(booking.payment_due_at)}` : "Due";
  }
  return booking.payment_status;
}

export function paymentColor(booking: LandlordBooking): string {
  if (booking.payment_status === "due" && new Date(booking.check_out) < new Date()) {
    return PAYMENT_COLORS.overdue;
  }
  return PAYMENT_COLORS[booking.payment_status] ?? "text-gray-500";
}

export const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export default function BookingDetailModal({
  booking,
  landlordId,
  onClose,
}: {
  booking: LandlordBooking;
  landlordId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [messaging, setMessaging] = useState(false);

  const isCancelled = booking.status === "cancelled" || booking.status === "declined";
  const nightCount = Math.ceil(
    (new Date(booking.check_out).getTime() - new Date(booking.check_in).getTime()) /
      (1000 * 60 * 60 * 24),
  );

  const handleMessage = async () => {
    setMessaging(true);
    const supabase = createClient();

    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("landlord_id", landlordId)
      .eq("tenant_id", booking.tenant_id)
      .eq("property_id", booking.property_id)
      .maybeSingle();

    if (existing) {
      router.push(`/landlord/messages/${existing.id}`);
      return;
    }

    const params = new URLSearchParams({
      tenantId: booking.tenant_id,
      propertyId: booking.property_id,
      tenantName: `${booking.tenant?.first_name ?? ""} ${booking.tenant?.last_name ?? ""}`.trim(),
      propertyTitle: booking.property?.title ?? "",
    });
    router.push(`/landlord/messages/new?${params}`);
    setMessaging(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <p className="font-semibold text-[#2C3E50]">
              {booking.tenant?.first_name} {booking.tenant?.last_name}
            </p>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                STATUS_COLORS[booking.status] ?? "bg-gray-100 text-gray-600"
              }`}
            >
              {STATUS_LABELS[booking.status] ?? booking.status}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <Row icon={<Building2 size={15} className="text-gray-400" />} label="Property">
            {booking.property?.title}
          </Row>
          <Row icon={<CalendarDays size={15} className="text-gray-400" />} label="Stay">
            {fmtDate(booking.check_in)} → {fmtDate(booking.check_out)}
            <span className="ml-1.5 text-gray-400">
              ({nightCount} {nightCount === 1 ? "night" : "nights"})
            </span>
          </Row>
          <Row icon={<User size={15} className="text-gray-400" />} label="Tenant">
            {booking.tenant?.first_name} {booking.tenant?.last_name}
          </Row>

          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Booking total</span>
              <span className="text-[#2C3E50] font-medium">
                £{(booking.total_price ?? 0).toLocaleString("en-GB")}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Platform fee (6%)</span>
              <span className="text-red-500">
                −£{(booking.total_price * 0.06).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm font-semibold border-t border-gray-200 pt-2 mt-1">
              <span className="text-[#2C3E50]">Your payout</span>
              <span className={isCancelled ? "text-gray-400" : "text-green-600"}>
                {isCancelled ? "£0.00" : `£${(booking.total_price * 0.94).toFixed(2)}`}
              </span>
            </div>
            {!isCancelled && (
              <div className="flex justify-between text-xs pt-1">
                <span className="text-gray-400">Payment</span>
                <span className={`font-medium ${paymentColor(booking)}`}>
                  {paymentLabel(booking)}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 pb-5">
          <button
            onClick={handleMessage}
            disabled={messaging || isCancelled}
            className="w-full flex items-center justify-center gap-2 bg-[#7C6CFF] hover:bg-[#6B5CE7] text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
          >
            {messaging ? <Loader2 size={15} className="animate-spin" /> : <MessageSquare size={15} />}
            Message tenant
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
        <p className="text-sm text-[#2C3E50]">{children}</p>
      </div>
    </div>
  );
}
