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
