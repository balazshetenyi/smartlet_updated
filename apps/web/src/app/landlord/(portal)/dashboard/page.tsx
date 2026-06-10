import { createClient } from "@/lib/supabase/server";
import { Building2, CalendarClock, TrendingUp, Clock } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [propertiesRes, pendingRes, earningsRes, recentBookingsRes] =
    await Promise.all([
      supabase
        .from("properties")
        .select("id", { count: "exact", head: true })
        .eq("landlord_id", user!.id),

      supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending")
        .in(
          "property_id",
          (
            await supabase
              .from("properties")
              .select("id")
              .eq("landlord_id", user!.id)
          ).data?.map((p) => p.id) ?? [],
        ),

      supabase
        .from("bookings")
        .select("total_price")
        .eq("status", "confirmed")
        .in(
          "property_id",
          (
            await supabase
              .from("properties")
              .select("id")
              .eq("landlord_id", user!.id)
          ).data?.map((p) => p.id) ?? [],
        ),

      supabase
        .from("bookings")
        .select(
          "id, check_in, check_out, total_price, status, tenant:profiles!tenant_id(first_name, last_name), property:properties!property_id(title)",
        )
        .in(
          "property_id",
          (
            await supabase
              .from("properties")
              .select("id")
              .eq("landlord_id", user!.id)
          ).data?.map((p) => p.id) ?? [],
        )
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  const propertyCount = propertiesRes.count ?? 0;
  const pendingCount = pendingRes.count ?? 0;
  const totalEarnings = (earningsRes.data ?? []).reduce(
    (sum, b) => sum + (b.total_price ?? 0),
    0,
  );
  const recentBookings = recentBookingsRes.data ?? [];

  const stats = [
    {
      label: "Properties",
      value: propertyCount,
      icon: Building2,
      href: "/landlord/properties",
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Pending requests",
      value: pendingCount,
      icon: CalendarClock,
      href: "/landlord/bookings",
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Total earnings",
      value: `£${totalEarnings.toLocaleString("en-GB")}`,
      icon: TrendingUp,
      href: "/landlord/earnings",
      color: "text-green-600",
      bg: "bg-green-50",
    },
  ];

  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    confirmed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
    completed: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#2C3E50]">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Here&apos;s an overview of your properties
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, href, color, bg }) => (
          <a
            key={label}
            href={href}
            className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-sm transition-shadow group"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-2xl font-bold text-[#2C3E50] mt-1">
                  {value}
                </p>
              </div>
              <div className={`${bg} p-2.5 rounded-xl`}>
                <Icon size={20} className={color} />
              </div>
            </div>
          </a>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
          <Clock size={16} className="text-gray-400" />
          <h2 className="font-semibold text-[#2C3E50] text-sm">
            Recent bookings
          </h2>
        </div>

        {recentBookings.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">
            No bookings yet
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentBookings.map((booking: any) => (
              <div
                key={booking.id}
                className="px-6 py-4 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-[#2C3E50]">
                    {booking.tenant?.first_name} {booking.tenant?.last_name}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {booking.property?.title} · {booking.check_in} →{" "}
                    {booking.check_out}
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
