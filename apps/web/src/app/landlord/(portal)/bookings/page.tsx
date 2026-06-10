import { createClient } from "@/lib/supabase/server";
import { CalendarClock } from "lucide-react";
import BookingActions from "./_components/BookingActions";

export default async function BookingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: propertyIds } = await supabase
    .from("properties")
    .select("id")
    .eq("landlord_id", user!.id);

  const ids = (propertyIds ?? []).map((p) => p.id);

  const { data: bookings } = await supabase
    .from("bookings")
    .select(
      "id, check_in, check_out, total_price, status, created_at, tenant:profiles!tenant_id(first_name, last_name, email), property:properties!property_id(title)",
    )
    .in("property_id", ids.length > 0 ? ids : ["none"])
    .order("created_at", { ascending: false });

  const pending = (bookings ?? []).filter((b) => b.status === "pending");
  const others = (bookings ?? []).filter((b) => b.status !== "pending");

  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    confirmed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
    completed: "bg-gray-100 text-gray-600",
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#2C3E50]">Bookings</h1>
        <p className="text-gray-500 text-sm mt-1">
          {pending.length} pending request{pending.length !== 1 ? "s" : ""}
        </p>
      </div>

      {pending.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Awaiting approval
          </h2>
          <div className="space-y-3">
            {pending.map((booking: any) => (
              <div
                key={booking.id}
                className="bg-white rounded-2xl border border-amber-200 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-[#2C3E50]">
                        {booking.tenant?.first_name} {booking.tenant?.last_name}
                      </p>
                      <span className="text-xs text-gray-400">
                        {booking.tenant?.email}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {booking.property?.title}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatDate(booking.check_in)} →{" "}
                      {formatDate(booking.check_out)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-[#2C3E50]">
                      £{(booking.total_price ?? 0).toLocaleString("en-GB")}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Requested {formatDate(booking.created_at)}
                    </p>
                  </div>
                </div>
                <BookingActions bookingId={booking.id} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          All bookings
        </h2>
        {!bookings || bookings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 py-16 text-center">
            <CalendarClock size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No bookings yet</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
            {bookings.map((booking: any) => (
              <div
                key={booking.id}
                className="px-5 py-4 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-[#2C3E50]">
                    {booking.tenant?.first_name} {booking.tenant?.last_name}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {booking.property?.title} · {formatDate(booking.check_in)}{" "}
                    → {formatDate(booking.check_out)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-[#2C3E50]">
                    £{(booking.total_price ?? 0).toLocaleString("en-GB")}
                  </span>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      statusColors[booking.status] ?? "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {booking.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
