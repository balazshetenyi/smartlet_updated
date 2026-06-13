import { supabase } from "@kiado/shared";
import type {
  CreateServiceApplicationData,
  CreateServiceJobData,
  ServiceOperatorProfile,
  ServiceType,
} from "@kiado/shared/types/services";

export async function fetchServiceOperatorProfile(
  userId: string,
): Promise<ServiceOperatorProfile | null> {
  const { data, error } = await supabase
    .from("service_operator_profiles")
    .select(
      `
      *,
      profiles!inner (first_name, last_name, avatar_url)
    `,
    )
    .eq("id", userId)
    .single();

  if (error || !data) return null;

  const profile = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles;
  return {
    ...data,
    first_name: profile?.first_name,
    last_name: profile?.last_name,
    avatar_url: profile?.avatar_url,
  };
}

export async function upsertServiceOperatorProfile(
  userId: string,
  updates: Partial<Omit<ServiceOperatorProfile, "id" | "created_at">>,
): Promise<{ error?: string }> {
  const { error } = await supabase
    .from("service_operator_profiles")
    .upsert({ id: userId, ...updates }, { onConflict: "id" });

  if (error) return { error: error.message };
  return {};
}

export async function fetchOpenServiceJobs(serviceTypes?: ServiceType[]) {
  let query = supabase
    .from("service_jobs")
    .select(
      `
      *,
      properties!inner (
        id,
        title,
        city,
        cover_image_url
      )
    `,
    )
    .eq("status", "open")
    .order("created_at", { ascending: false });

  if (serviceTypes && serviceTypes.length > 0) {
    query = query.in("service_type", serviceTypes);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function fetchMyApplications(operatorId: string) {
  const { data, error } = await supabase
    .from("service_job_applications")
    .select(
      `
      *,
      service_jobs!inner (
        id,
        title,
        service_type,
        status,
        scheduled_date,
        final_price,
        payment_status,
        properties!inner (
          id,
          title,
          city,
          cover_image_url
        )
      )
    `,
    )
    .eq("operator_id", operatorId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function fetchLandlordServiceJobs(landlordId: string) {
  const { data, error } = await supabase
    .from("service_jobs")
    .select(
      `
      *,
      properties!inner (
        id,
        title,
        address,
        city,
        postcode
      )
    `,
    )
    .eq("landlord_id", landlordId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function fetchJobWithApplications(jobId: string) {
  const { data: job, error: jobError } = await supabase
    .from("service_jobs")
    .select(
      `
      *,
      properties!inner (id, title, address, city, postcode)
    `,
    )
    .eq("id", jobId)
    .single();

  if (jobError || !job) throw new Error("Job not found");

  const { data: applications, error: appError } = await supabase
    .from("service_job_applications")
    .select(
      `
      *,
      profiles!inner (
        id, first_name, last_name, avatar_url,
        service_operator_profiles (bio, services, city, area_radius_km, company_name)
      )
    `,
    )
    .eq("job_id", jobId)
    .order("created_at", { ascending: true });

  if (appError) throw appError;

  return { job, applications: applications ?? [] };
}

export async function applyToServiceJob(
  data: CreateServiceApplicationData,
): Promise<{ error?: string; id?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: result, error } = await supabase
    .from("service_job_applications")
    .insert({ ...data, operator_id: user.id })
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { id: result.id };
}

export async function withdrawApplication(applicationId: string): Promise<{ error?: string }> {
  const { error } = await supabase
    .from("service_job_applications")
    .update({ status: "withdrawn" })
    .eq("id", applicationId);

  if (error) return { error: error.message };
  return {};
}

export async function createServiceJob(
  data: CreateServiceJobData & { landlord_id: string },
): Promise<{ error?: string; id?: string }> {
  const { data: result, error } = await supabase
    .from("service_jobs")
    .insert(data)
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { id: result.id };
}

export async function cancelServiceJob(jobId: string): Promise<{ error?: string }> {
  const { error } = await supabase
    .from("service_jobs")
    .update({ status: "cancelled" })
    .eq("id", jobId);

  if (error) return { error: error.message };
  return {};
}
