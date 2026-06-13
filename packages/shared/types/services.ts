export type ServiceType =
  | "cleaning"
  | "maintenance"
  | "plumbing"
  | "electrical"
  | "gardening"
  | "painting"
  | "other";

export type ServiceJobStatus = "open" | "assigned" | "completed" | "cancelled";
export type ServiceJobSource = "manual" | "auto_checkout";
export type ServicePaymentStatus = "pending" | "held" | "released" | "refunded";
export type ServiceApplicationStatus = "pending" | "approved" | "declined" | "withdrawn";

export type ServiceOperatorProfile = {
  id: string;
  company_name?: string;
  bio?: string;
  services: ServiceType[];
  area_lat?: number;
  area_lng?: number;
  area_radius_km: number;
  city?: string;
  postcode?: string;
  is_available: boolean;
  stripe_account_id?: string;
  created_at: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
};

export type ServiceJob = {
  id: string;
  property_id: string;
  landlord_id: string;
  service_type: ServiceType;
  title: string;
  description?: string;
  scheduled_date?: string;
  status: ServiceJobStatus;
  source: ServiceJobSource;
  assigned_operator_id?: string;
  final_price?: number;
  payment_intent_id?: string;
  payment_status: ServicePaymentStatus;
  platform_fee?: number;
  created_at: string;
  updated_at: string;
};

export type ServiceJobApplication = {
  id: string;
  job_id: string;
  operator_id: string;
  quote_price: number;
  cover_note?: string;
  status: ServiceApplicationStatus;
  created_at: string;
};

export type ServiceJobWithProperty = ServiceJob & {
  property: {
    id: string;
    title: string;
    address?: string;
    city?: string;
    cover_image_url?: string;
  };
};

export type ServiceJobWithApplications = ServiceJob & {
  property: {
    id: string;
    title: string;
    address?: string;
    city?: string;
  };
  applications: (ServiceJobApplication & {
    operator: {
      id: string;
      first_name: string;
      last_name: string;
      avatar_url?: string;
    };
  })[];
};

export type ServiceApplicationWithJob = ServiceJobApplication & {
  job: ServiceJobWithProperty;
};

export type CreateServiceJobData = {
  property_id: string;
  service_type: ServiceType;
  title: string;
  description?: string;
  scheduled_date?: string;
};

export type CreateServiceApplicationData = {
  job_id: string;
  quote_price: number;
  cover_note?: string;
};

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  cleaning: "Cleaning",
  maintenance: "Maintenance",
  plumbing: "Plumbing",
  electrical: "Electrical",
  gardening: "Gardening",
  painting: "Painting",
  other: "Other",
};

export const SERVICE_TYPE_DEFAULT_TITLES: Record<ServiceType, string> = {
  cleaning: "Property Cleaning",
  maintenance: "Property Maintenance",
  plumbing: "Plumbing Work",
  electrical: "Electrical Work",
  gardening: "Garden Maintenance",
  painting: "Painting & Decorating",
  other: "Property Service",
};
