import { Property } from "../../../../packages/shared/types/property";
import { fetchAllProperties } from "@/utils/property-utils";
import { create } from "zustand";

type PropertyStore = {
  longTermProperties: Property[];
  shortTermProperties: Property[];
  holidayProperties: Property[];
  loading: boolean;
};
type PropertyActions = {
  loadProperties: () => Promise<void>;
  setLoading: (loading: boolean) => void;
};

export const usePropertyStore = create<PropertyStore & PropertyActions>(
  (set) => ({
    longTermProperties: [],
    shortTermProperties: [],
    holidayProperties: [],
    loading: false,
    loadProperties: async () => {
      set({ loading: true });
      try {
        const {
          long_term_properties,
          short_term_properties,
          holiday_properties,
        } = await fetchAllProperties();

        set({
          longTermProperties: long_term_properties,
          shortTermProperties: short_term_properties,
          holidayProperties: holiday_properties,
          loading: false,
        });
      } catch (error) {
        console.error("Failed to fetch properties:", error);
      } finally {
        set({ loading: false });
      }
    },
    setLoading: (loading: boolean) => set({ loading }),
  }),
);
