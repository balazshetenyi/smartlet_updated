/**
 * Base booking structure matching database schema
 */
export type Booking = {
  id: string;
  property_id: string;
  tenant_id: string;
  landlord_id: string;
  check_in: string; // ISO date string
  check_out: string; // ISO date string
  total_price: number;
  status: BookingStatus;
  payment_intent_id?: string;
  created_at: string;
  updated_at: string;
};

export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";

/**
 * Data required to create a new booking
 */
export type CreateBookingData = {
  property_id: string;
  tenant_id: string;
  check_in: string;
  check_out: string;
  total_price: number;
  status?: BookingStatus;
};

/**
 * Booking with populated property details (for tenant view)
 */
export type BookingWithProperty = Booking & {
  property: {
    id: string;
    title: string;
    cover_image_url?: string;
    city?: string;
    landlord_id: string;
    landlord?: {
      id: string;
      first_name: string;
      last_name: string;
      avatar_url?: string;
    };
  };
};

/**
 * Booking with populated tenant details (for landlord view)
 */
export type BookingWithTenant = Booking & {
  property: {
    id: string;
    title: string;
    cover_image_url?: string;
    city?: string;
  };
  tenant: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
};

/**
 * Update booking data
 */
export type UpdateBookingData = {
  status?: BookingStatus;
  payment_intent_id?: string;
};