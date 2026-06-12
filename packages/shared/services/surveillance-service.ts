import type { SupabaseClient } from "@supabase/supabase-js";
import type { SurveillanceReportStatus } from "../types/property";

export type LandlordReport = {
  id: string;
  description: string;
  status: SurveillanceReportStatus;
  created_at: string;
  resolved_at: string | null;
  resolution_notes: string | null;
  property: { title: string; city: string | null } | null;
};

export async function fetchLandlordReports(
  supabase: SupabaseClient,
  landlordId: string,
): Promise<LandlordReport[]> {
  const { data } = await supabase
    .from("surveillance_reports")
    .select(
      "id, description, status, created_at, resolved_at, resolution_notes, property:properties!inner(title, city)",
    )
    .eq("property.landlord_id", landlordId)
    .order("created_at", { ascending: false });

  return (data ?? []) as unknown as LandlordReport[];
}
