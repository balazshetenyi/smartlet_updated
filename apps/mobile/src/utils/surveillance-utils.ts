import { supabase } from "@kiado/shared";
import {
  SurveillanceReport,
  SurveillanceReportWithProperty,
} from "@kiado/shared/types/property";

/**
 * Submit a new surveillance report for a property.
 */
export const submitSurveillanceReport = async (
  propertyId: string,
  reporterId: string,
  description: string,
): Promise<SurveillanceReport> => {
  const { data, error } = await supabase
    .from("surveillance_reports")
    .insert({
      property_id: propertyId,
      reporter_id: reporterId,
      description,
      status: "pending",
    })
    .select()
    .single();

  if (error) throw error;
  return data as SurveillanceReport;
};

/**
 * Fetch all surveillance reports filed by a specific tenant,
 * with property title/city/address joined in.
 */
export const fetchMyReports = async (
  reporterId: string,
): Promise<SurveillanceReportWithProperty[]> => {
  const { data, error } = await supabase
    .from("surveillance_reports")
    .select(
      `
      *,
      properties:property_id (
        title,
        city,
        address
      )
    `,
    )
    .eq("reporter_id", reporterId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    property_id: row.property_id,
    reporter_id: row.reporter_id,
    description: row.description,
    status: row.status,
    created_at: row.created_at,
    resolved_at: row.resolved_at,
    resolved_by: row.resolved_by,
    resolution_notes: row.resolution_notes,
    property_title: row.properties?.title ?? "Unknown property",
    property_city: row.properties?.city ?? null,
    property_address: row.properties?.address ?? null,
  })) as SurveillanceReportWithProperty[];
};

/**
 * Check if the reporter has already filed a report for this property.
 * Returns true if a report exists.
 */
export const checkExistingReport = async (
  propertyId: string,
  reporterId: string,
): Promise<boolean> => {
  const { data, error } = await supabase
    .from("surveillance_reports")
    .select("id")
    .eq("property_id", propertyId)
    .eq("reporter_id", reporterId)
    .maybeSingle();

  if (error) return false;
  return data !== null;
};
