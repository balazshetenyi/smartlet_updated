import { fetchLandlordBookings, isBookingRequestExpired } from "@/lib/booking-service";
import { createClient } from "@/lib/supabase/server";
import { Building2, CalendarClock, TrendingUp, Clock, Wallet } from "lucide-react";
import RecentBookings from "./_components/RecentBookings";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const landlordId = user!.id;

  const [propertiesRes, bookings] = await Promise.all([
    supabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("landlord_id", landlordId),
    fetchLandlordBookings(supabase, landlordId),
  ]);

  const propertyCount = propertiesRes.count ?? 0;
  const net = (total: number) => total * 0.94;
  const pendingCount = bookings.filter(
    (b) => b.status === "pending" && !isBookingRequestExpired(b),
  ).length;
  const totalEarnings = bookings
    .filter((b) => b.status === "confirmed" && b.payment_status === "paid")
    .reduce((sum, b) => sum + net(b.total_price ?? 0), 0);
  const upcomingPayments = bookings
    .filter((b) => b.status === "confirmed" && b.payment_status !== "paid")
    .reduce((sum, b) => sum + net(b.total_price ?? 0), 0);
  const recentBookings = bookings.slice(0, 5);

  const fmt = (n: number) =>
    `£${n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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
      label: "Upcoming payments",
      value: fmt(upcomingPayments),
      icon: TrendingUp,
      href: "/landlord/bookings",
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "Total earnings",
      value: fmt(totalEarnings),
      icon: Wallet,
      href: "/landlord/earnings",
      color: "text-green-600",
      bg: "bg-green-50",
    },
  ];


  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#2C3E50]">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Here&apos;s an overview of your properties
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
          <RecentBookings bookings={recentBookings} landlordId={landlordId} />
        )}
      </div>
    </div>
  );
}
