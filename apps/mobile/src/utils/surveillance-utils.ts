import { supabase } from "@kiado/shared";
import {
  SurveillanceReport,
  SurveillanceReportWithProperty,
} from "@kiado/shared/types/property";
import { uploadImageToStorage } from "@/utils/image-picker-utils";
import * as ImagePicker from "expo-image-picker";
import { Session } from "@supabase/supabase-js";
import { env } from "@/config/env";

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

  // Non-blocking — notify admins and landlord. A notification failure
  // must never prevent the report from being returned to the caller.
  notifyAdminsOfSurveillanceReport(data.id).catch((e) =>
    console.error("Failed to notify admins of surveillance report:", e),
  );

  return data as SurveillanceReport;
};

const notifyAdminsOfSurveillanceReport = async (
  reportId: string,
): Promise<void> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return;

  await fetch(`${env.SUPABASE_FUNCTIONS_URL}/notify-surveillance-report`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ reportId }),
  });
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

/**
 * Upload evidence photos for a report and record their URLs in
 * surveillance_report_photos. Best-effort — a photo failure does not
 * throw; the report itself is already persisted.
 */
export const uploadReportPhotos = async (
  reportId: string,
  assets: ImagePicker.ImagePickerAsset[],
  session: Session,
): Promise<void> => {
  for (const asset of assets) {
    try {
      const url = await uploadImageToStorage(
        asset,
        "report-evidence",
        session,
        reportId, // folder = reportId, so path = reportId/userId_timestamp.jpg
      );

      if (url) {
        const { error } = await supabase
          .from("surveillance_report_photos")
          .insert({ report_id: reportId, photo_url: url });

        if (error) {
          console.error("Error recording report photo:", error);
        }
      }
    } catch (err) {
      // Best-effort: log but don't abort the whole submission
      console.error("Error uploading report photo:", err);
    }
  }
};
