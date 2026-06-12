import { fetchLandlordBookings } from "@/lib/booking-service";
import { createClient } from "@/lib/supabase/server";
import StripeConnect from "./_components/StripeConnect";
import { TrendingUp, Building2, Wallet } from "lucide-react";

const net = (total: number) => total * 0.94;
const fmt = (n: number) =>
  `£${n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default async function EarningsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [bookings, profileRes] = await Promise.all([
    fetchLandlordBookings(supabase, user!.id),
    supabase.from("profiles").select("stripe_account_id").eq("id", user!.id).single(),
  ]);

  const stripeAccountId = profileRes.data?.stripe_account_id ?? null;

  const paid = bookings.filter(
    (b) => b.status === "confirmed" && b.payment_status === "paid",
  );
  const upcoming = bookings.filter(
    (b) => b.status === "confirmed" && b.payment_status !== "paid",
  );

  const totalEarnings = paid.reduce((sum, b) => sum + net(b.total_price ?? 0), 0);
  const upcomingTotal = upcoming.reduce((sum, b) => sum + net(b.total_price ?? 0), 0);

  const confirmed = [...paid, ...upcoming];

  const earningsByMonth: Record<string, number> = {};
  confirmed.forEach((b) => {
    const month = new Date(b.check_in).toLocaleDateString("en-GB", {
      year: "numeric",
      month: "short",
    });
    earningsByMonth[month] = (earningsByMonth[month] ?? 0) + net(b.total_price ?? 0);
  });

  const earningsByProperty: Record<string, { title: string; total: number; count: number }> = {};
  confirmed.forEach((b) => {
    const title = b.property?.title ?? "Unknown";
    if (!earningsByProperty[title]) {
      earningsByProperty[title] = { title, total: 0, count: 0 };
    }
    earningsByProperty[title].total += net(b.total_price ?? 0);
    earningsByProperty[title].count += 1;
  });

  const monthlyRows = Object.entries(earningsByMonth)
    .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
    .slice(0, 12);

  const propertyBreakdown = Object.values(earningsByProperty).sort(
    (a, b) => b.total - a.total,
  );

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#2C3E50]">Earnings</h1>
        <p className="text-gray-500 text-sm mt-1">Your net payout after the 6% platform fee</p>
      </div>

      <StripeConnect stripeAccountId={stripeAccountId} />

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-[#7C6CFF] rounded-2xl p-6 text-white">
          <div className="flex items-center gap-2 mb-3">
            <Wallet size={18} className="text-white/70" />
            <p className="text-white/70 text-sm">Total earnings</p>
          </div>
          <p className="text-4xl font-bold">{fmt(totalEarnings)}</p>
          <p className="text-white/60 text-sm mt-1">
            {paid.length} paid booking{paid.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={18} className="text-purple-500" />
            <p className="text-gray-500 text-sm">Upcoming payments</p>
          </div>
          <p className="text-4xl font-bold text-[#2C3E50]">{fmt(upcomingTotal)}</p>
          <p className="text-gray-400 text-sm mt-1">
            {upcoming.length} confirmed booking{upcoming.length !== 1 ? "s" : ""} awaiting payment
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
            <TrendingUp size={16} className="text-gray-400" />
            <h2 className="font-semibold text-[#2C3E50] text-sm">By month</h2>
          </div>
          {monthlyRows.length === 0 ? (
            <div className="px-5 py-8 text-center text-gray-400 text-sm">No data yet</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {monthlyRows.map(([month, amount]) => (
                <div key={month} className="flex items-center justify-between px-5 py-3">
                  <p className="text-sm text-gray-600">{month}</p>
                  <p className="text-sm font-semibold text-[#2C3E50]">{fmt(amount)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
            <Building2 size={16} className="text-gray-400" />
            <h2 className="font-semibold text-[#2C3E50] text-sm">By property</h2>
          </div>
          {propertyBreakdown.length === 0 ? (
            <div className="px-5 py-8 text-center text-gray-400 text-sm">No data yet</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {propertyBreakdown.map((p) => (
                <div key={p.title} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm text-gray-600 truncate max-w-[180px]">{p.title}</p>
                    <p className="text-xs text-gray-400">
                      {p.count} booking{p.count !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-[#2C3E50]">{fmt(p.total)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
