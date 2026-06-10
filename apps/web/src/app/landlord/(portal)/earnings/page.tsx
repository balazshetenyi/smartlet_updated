import { createClient } from "@/lib/supabase/server";
import { TrendingUp, Building2 } from "lucide-react";

export default async function EarningsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: propertyRows } = await supabase
    .from("properties")
    .select("id, title")
    .eq("landlord_id", user!.id);

  const ids = (propertyRows ?? []).map((p) => p.id);

  const { data: bookings } = await supabase
    .from("bookings")
    .select("property_id, total_price, check_in, check_out, status")
    .in("property_id", ids.length > 0 ? ids : ["none"])
    .eq("status", "confirmed");

  const confirmedBookings = bookings ?? [];

  const totalEarnings = confirmedBookings.reduce(
    (sum, b) => sum + (b.total_price ?? 0),
    0,
  );

  const earningsByMonth: Record<string, number> = {};
  confirmedBookings.forEach((b) => {
    const month = new Date(b.check_in).toLocaleDateString("en-GB", {
      year: "numeric",
      month: "short",
    });
    earningsByMonth[month] = (earningsByMonth[month] ?? 0) + (b.total_price ?? 0);
  });

  const earningsByProperty: Record<string, { title: string; total: number; count: number }> = {};
  confirmedBookings.forEach((b) => {
    const prop = propertyRows?.find((p) => p.id === b.property_id);
    if (!earningsByProperty[b.property_id]) {
      earningsByProperty[b.property_id] = {
        title: prop?.title ?? "Unknown",
        total: 0,
        count: 0,
      };
    }
    earningsByProperty[b.property_id].total += b.total_price ?? 0;
    earningsByProperty[b.property_id].count += 1;
  });

  const monthlyRows = Object.entries(earningsByMonth)
    .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
    .slice(0, 12);

  const propertyRows2 = Object.values(earningsByProperty).sort(
    (a, b) => b.total - a.total,
  );

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#2C3E50]">Earnings</h1>
        <p className="text-gray-500 text-sm mt-1">
          From confirmed bookings
        </p>
      </div>

      <div className="bg-[#7C6CFF] rounded-2xl p-6 mb-6 text-white">
        <p className="text-white/70 text-sm">Total earnings</p>
        <p className="text-4xl font-bold mt-1">
          £{totalEarnings.toLocaleString("en-GB")}
        </p>
        <p className="text-white/60 text-sm mt-1">
          {confirmedBookings.length} confirmed booking
          {confirmedBookings.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
            <TrendingUp size={16} className="text-gray-400" />
            <h2 className="font-semibold text-[#2C3E50] text-sm">By month</h2>
          </div>
          {monthlyRows.length === 0 ? (
            <div className="px-5 py-8 text-center text-gray-400 text-sm">
              No data yet
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {monthlyRows.map(([month, amount]) => (
                <div
                  key={month}
                  className="flex items-center justify-between px-5 py-3"
                >
                  <p className="text-sm text-gray-600">{month}</p>
                  <p className="text-sm font-semibold text-[#2C3E50]">
                    £{amount.toLocaleString("en-GB")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
            <Building2 size={16} className="text-gray-400" />
            <h2 className="font-semibold text-[#2C3E50] text-sm">
              By property
            </h2>
          </div>
          {propertyRows2.length === 0 ? (
            <div className="px-5 py-8 text-center text-gray-400 text-sm">
              No data yet
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {propertyRows2.map((p) => (
                <div
                  key={p.title}
                  className="flex items-center justify-between px-5 py-3"
                >
                  <div>
                    <p className="text-sm text-gray-600 truncate max-w-[180px]">
                      {p.title}
                    </p>
                    <p className="text-xs text-gray-400">
                      {p.count} booking{p.count !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-[#2C3E50]">
                    £{p.total.toLocaleString("en-GB")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
