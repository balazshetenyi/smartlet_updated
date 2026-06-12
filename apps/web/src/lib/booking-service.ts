import type { SupabaseClient } from "@supabase/supabase-js";

export function isBookingRequestExpired(booking: {
  check_in: string;
  created_at: string;
}): boolean {
  const now = Date.now();
  return (
    now >= new Date(booking.check_in).getTime() ||
    now >= new Date(booking.created_at).getTime() + 48 * 60 * 60 * 1000
  );
}

export type LandlordBooking = {
  id: string;
  tenant_id: string;
  property_id: string;
  check_in: string;
  check_out: string;
  total_price: number;
  status: string;
  payment_status: string;
  payment_due_at: string | null;
  created_at: string;
  tenant: { first_name: string; last_name: string } | null;
  property: { title: string } | null;
};

export async function fetchLandlordBookings(
  supabase: SupabaseClient,
  landlordId: string,
): Promise<LandlordBooking[]> {
  const { data } = await supabase
    .from("bookings")
    .select(
      "id, tenant_id, property_id, check_in, check_out, total_price, status, payment_status, payment_due_at, created_at, tenant:profiles!tenant_id(first_name, last_name), property:properties!inner(title)",
    )
    .eq("property.landlord_id", landlordId)
    .order("created_at", { ascending: false });

  return (data ?? []) as unknown as LandlordBooking[];
}
