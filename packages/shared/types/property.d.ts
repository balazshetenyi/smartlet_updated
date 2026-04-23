export type RentalType = "long_term" | "short_term" | "holiday";

export type Property = {
  id: string;
  landlord_id: string;
  title: string;
  max_guests: number;
  description?: string;
  address?: string;
  city?: string;
  location?: string; // SRID=4326;POINT(lng lat)
  postcode?: string;
  bedrooms?: number;
  bathrooms?: number;
  rental_type?: RentalType;
  price?: number;
  is_available?: boolean;
  cover_image_url?: string;
  created_at?: string;
};

export type PropertyWithLandlord = {
  property: Property;
  landlord: UserProfile;
};

export type PropertyWithLandlordAndImages = {
  property: Property;
  landlord: UserProfile;
  images: string[];
};
export type PropertyWithLandlordAndImagesAndReviews = {
  property: Property;
  landlord: UserProfile;
  images: string[];
  reviews: Review[];
};

export type PropertyUnavailableDate = {
  id: string;
  property_id: string;
  start_date: string; // ISO date string (YYYY-MM-DD)
  end_date: string; // ISO date string (YYYY-MM-DD)
  reason?: string;
  created_at?: string;
};

export type Review = {
  id: string;
  property_id: string;
  reviewer_id: string;
  rating: number;
  comment?: string;
  created_at?: string;
  updated_at?: string;
};

export type Amenity = {
  id: string;
  name: string;
  icon: string;
};

export type PropertyAmenity = {
  id: string;
  property_id: string;
  amenity_id: string;
  created_at?: string;
};

export type PropertyPhoto = {
  id: string;
  property_id: string;
  image_url: string;
  is_featured?: boolean;
  is_cover?: boolean;
};

export type Notification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type:
    | "booking_request"
    | "booking_confirmed"
    | "booking_cancelled"
    | "payment"
    | "message"
    | "system";
  related_id?: string;
  read: boolean;
  created_at: string;
};

export type SurveillanceDeclarationType = "none" | "external_only";

export type SurveillanceDeclaration = {
  property_id: string;
  landlord_id: string;
  declaration_type: SurveillanceDeclarationType;
  external_devices_description: string | null;
  declared_at: string;
  updated_at: string;
  locked: boolean;
  locked_at: string | null;
  locked_reason: string | null;
};

export type SurveillanceReportStatus =
  | "pending"
  | "investigating"
  | "resolved_breach"
  | "resolved_no_breach";

export type SurveillanceReport = {
  id: string;
  property_id: string;
  reporter_id: string;
  description: string;
  status: SurveillanceReportStatus;
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_notes: string | null;
};

export type SurveillanceReportWithProperty = SurveillanceReport & {
  property_title: string;
  property_city: string | null;
  property_address: string | null;
};
