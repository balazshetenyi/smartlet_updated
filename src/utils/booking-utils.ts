import { supabase } from "@/lib/supabase";
import { BookingWithProperty, BookingWithTenant, CreateBookingData, UpdateBookingData } from "@/types/bookings";
import { Notification, PropertyUnavailableDate } from "@/types/property";

export type Booking = {
  id: string;
  property_id: string;
  tenant_id: string;
  check_in: string;
  check_out: string;
  total_price: number;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  created_at: string;
  updated_at: string;
};

/**
 * Fetch booked dates for a property to show as unavailable
 */
export const fetchBookedDates = async (
  propertyId: string
): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from("bookings")
      .select("check_in, check_out")
      .eq("property_id", propertyId)
      .in("status", ["pending", "confirmed"]);

    if (error) throw error;

    // Generate array of all booked dates
    const bookedDates: string[] = [];
    data?.forEach((booking) => {
      const start = new Date(booking.check_in);
      const end = new Date(booking.check_out);

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        bookedDates.push(d.toISOString().split("T")[0]);
      }
    });

    return bookedDates;
  } catch (error) {
    console.error("Error fetching booked dates:", error);
    return [];
  }
};

/**
 * Calculate total price based on nightly rate and number of nights
 */
export const calculateBookingPrice = (
  nightlyRate: number,
  checkIn: string,
  checkOut: string
): number => {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const nights = Math.ceil(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  );

  return nights * nightlyRate;
};

/**
 * Create a new booking
 */
export const createBooking = async (
  bookingData: CreateBookingData
): Promise<Booking | null> => {
  try {
    const { data, error } = await supabase
      .from("bookings")
      .insert({
        ...bookingData,
        status: bookingData.status || "pending",
      })
      .select()
      .single();

    if (error) throw error;
    return data as Booking;
  } catch (error) {
    console.error("Error creating booking:", error);
    return null;
  }
};

/**
 * Fetch user's bookings (as tenant)
 */
export const fetchMyBookings = async (
  userId: string
): Promise<BookingWithProperty[]> => {
  try {
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        property:properties!inner (
          id,
          title,
          cover_image_url,
          city,
          landlord_id,
          landlord:profiles!properties_landlord_id_fkey (
            id,
            first_name,
            last_name,
            avatar_url
          )
        )
      `)
      .eq("tenant_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []) as BookingWithProperty[];
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return [];
  }
};

/**
 * Fetch booking requests for landlord's properties
 */
export const fetchBookingRequests = async (
  landlordId: string
): Promise<BookingWithTenant[]> => {
  try {
    const { data, error } = await supabase
      .from("bookings")
      .select(
        `
        *,
        property:properties!inner (
          id,
          title,
          cover_image_url,
          city,
          landlord_id
        ),
        tenant:profiles!bookings_tenant_id_fkey (
          id,
          first_name,
          last_name,
          avatar_url
        )
      `
      )
      .eq("property.landlord_id", landlordId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []) as BookingWithTenant[];
  } catch (error) {
    console.error("Error fetching booking requests:", error);
    return [];
  }
};

/**
 * Update booking status (confirm/cancel)
 */
export const updateBookingStatus = async (
  bookingId: string,
  updates: UpdateBookingData
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("bookings")
      .update(updates)
      .eq("id", bookingId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error updating booking:", error);
    return false;
  }
};

/**
 * Fetch user notifications
 */
export const fetchNotifications = async (
  userId: string
): Promise<Notification[]> => {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as Notification[];
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (
  notificationId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return false;
  }
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async (
  userId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return false;
  }
};

/**
 * Get unread notification count
 */
export const getUnreadNotificationCount = async (
  userId: string
): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("read", false);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error("Error getting unread count:", error);
    return 0;
  }
};

/**
 * Fetch unavailable dates for a property (set by landlord)
 */
export const fetchUnavailableDates = async (
  propertyId: string
): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from("property_unavailable_dates")
      .select("start_date, end_date")
      .eq("property_id", propertyId);

    if (error) throw error;

    // Generate array of all unavailable dates
    const unavailableDates: string[] = [];
    data?.forEach((range) => {
      const start = new Date(range.start_date);
      const end = new Date(range.end_date);

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        unavailableDates.push(d.toISOString().split("T")[0]);
      }
    });

    return unavailableDates;
  } catch (error) {
    console.error("Error fetching unavailable dates:", error);
    return [];
  }
};

/**
 * Fetch all blocked dates (bookings + unavailable dates)
 */
export const fetchBlockedDates = async (
  propertyId: string
): Promise<string[]> => {
  try {
    const [bookedDates, unavailableDates] = await Promise.all([
      fetchBookedDates(propertyId),
      fetchUnavailableDates(propertyId),
    ]);

    // Combine and deduplicate
    const allBlocked = [...new Set([...bookedDates, ...unavailableDates])];
    return allBlocked;
  } catch (error) {
    console.error("Error fetching blocked dates:", error);
    return [];
  }
};

/**
 * Add unavailable dates for a property
 */
export const addUnavailableDates = async (
  propertyId: string,
  startDate: string,
  endDate: string,
  reason?: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("property_unavailable_dates")
      .insert({
        property_id: propertyId,
        start_date: startDate,
        end_date: endDate,
        reason,
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error adding unavailable dates:", error);
    return false;
  }
};

/**
 * Remove unavailable date range
 */
export const removeUnavailableDates = async (
  unavailableDateId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("property_unavailable_dates")
      .delete()
      .eq("id", unavailableDateId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error removing unavailable dates:", error);
    return false;
  }
};

/**
 * Fetch all unavailable date ranges for a property
 */
export const fetchUnavailableDateRanges = async (
  propertyId: string
): Promise<PropertyUnavailableDate[]> => {
  try {
    const { data, error } = await supabase
      .from("property_unavailable_dates")
      .select("*")
      .eq("property_id", propertyId)
      .order("start_date", { ascending: true });

    if (error) throw error;
    return (data || []) as PropertyUnavailableDate[];
  } catch (error) {
    console.error("Error fetching unavailable date ranges:", error);
    return [];
  }
};