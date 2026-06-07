// @kiado/shared is redirected to the mock via moduleNameMapper — no jest.mock needed
import { calculateBookingPrice, createBooking, cancelBooking } from "@/utils/booking-utils";

const mockSupabase = require("@/test/mocks/kiado-shared").supabase;

describe("calculateBookingPrice", () => {
  it("calculates correct price for 3 nights at £100/night", () => {
    expect(calculateBookingPrice(100, "2025-12-01", "2025-12-04")).toBe(300);
  });

  it("calculates correct price for 7 nights at £150/night", () => {
    expect(calculateBookingPrice(150, "2025-12-01", "2025-12-08")).toBe(1050);
  });

  it("returns 0 for same-day check-in and check-out", () => {
    expect(calculateBookingPrice(100, "2025-12-01", "2025-12-01")).toBe(0);
  });
});

describe("createBooking", () => {
  const bookingData = {
    property_id: "prop-1",
    tenant_id: "tenant-1",
    check_in: "2025-12-10",
    check_out: "2025-12-15",
    total_price: 500,
  };

  beforeEach(() => jest.clearAllMocks());

  it("throws overlap error when conflicting booking exists", async () => {
    const conflictChain: any = {
      select: () => conflictChain, eq: () => conflictChain,
      in: () => conflictChain, lt: () => conflictChain, gt: () => conflictChain,
      then: (cb: any) => Promise.resolve(cb({ data: [{ id: "existing" }], error: null })),
    };
    jest.spyOn(mockSupabase, "from").mockReturnValueOnce(conflictChain);
    await expect(createBooking(bookingData)).rejects.toThrow("These dates are already booked");
  });

  it("inserts booking when no conflicts exist", async () => {
    const noConflict: any = {
      select: () => noConflict, eq: () => noConflict,
      in: () => noConflict, lt: () => noConflict, gt: () => noConflict,
      then: (cb: any) => Promise.resolve(cb({ data: [], error: null })),
    };
    const insertChain: any = {
      insert: () => insertChain, select: () => insertChain,
      single: () => Promise.resolve({ data: { id: "new-booking", ...bookingData }, error: null }),
    };
    jest.spyOn(mockSupabase, "from")
      .mockReturnValueOnce(noConflict)
      .mockReturnValueOnce(insertChain);

    const result = await createBooking(bookingData);
    expect(result).toMatchObject({ id: "new-booking" });
  });
});

describe("cancelBooking", () => {
  beforeEach(() => jest.clearAllMocks());

  it("invokes cancel-booking edge function with the correct bookingId", async () => {
    mockSupabase.functions.invoke.mockResolvedValueOnce({ data: { refundAmount: 0 }, error: null });
    const result = await cancelBooking("booking-abc");
    expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
      "cancel-booking",
      { body: { bookingId: "booking-abc" } },
    );
    expect(result.ok).toBe(true);
  });

  it("returns ok=false when the edge function errors", async () => {
    mockSupabase.functions.invoke.mockResolvedValueOnce({ data: null, error: { message: "fail" } });
    const result = await cancelBooking("booking-abc");
    expect(result.ok).toBe(false);
  });
});
