"use client";

import type { LandlordBooking } from "@/lib/booking-service";
import BookingDetailModal, { STATUS_COLORS, STATUS_LABELS, fmtDate } from "../../_components/BookingDetailModal";
import { useState } from "react";

export default function RecentBookings({
  bookings,
  landlordId,
}: {
  bookings: LandlordBooking[];
  landlordId: string;
}) {
  const [selected, setSelected] = useState<LandlordBooking | null>(null);

  return (
    <>
      <div className="divide-y divide-gray-100">
        {bookings.map((booking) => (
          <button
            key={booking.id}
            onClick={() => setSelected(booking)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left cursor-pointer"
          >
            <div>
              <p className="text-sm font-medium text-[#2C3E50]">
                {booking.tenant?.first_name} {booking.tenant?.last_name}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {booking.property?.title} · {fmtDate(booking.check_in)} →{" "}
                {fmtDate(booking.check_out)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-[#2C3E50]">
                £{(booking.total_price ?? 0).toLocaleString("en-GB")}
              </span>
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  STATUS_COLORS[booking.status] ?? "bg-gray-100 text-gray-600"
                }`}
              >
                {STATUS_LABELS[booking.status] ?? booking.status}
              </span>
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <BookingDetailModal
          booking={selected}
          landlordId={landlordId}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
