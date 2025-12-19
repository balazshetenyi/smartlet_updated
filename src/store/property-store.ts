import { Property } from "@/types/property";
import { fetchAllProperties } from "@/utils/property-utils";

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

import { create } from "zustand";

export const usePropertyStore = create<PropertyStore & PropertyActions>(
  (set) => ({
    longTermProperties: [],
    shortTermProperties: [],
    holidayProperties: [],
    loading: false,
    loadProperties: async () => {
      set({ loading: true });
      const {
        long_term_properties,
        short_term_properties,
        holiday_properties,
      } = await fetchAllProperties();
      console.log("pop: ", long_term_properties);

      set({
        longTermProperties: long_term_properties,
        shortTermProperties: short_term_properties,
        holidayProperties: holiday_properties,
        loading: false,
      });
    },
    setLoading: (loading: boolean) => set({ loading }),
  })
);
