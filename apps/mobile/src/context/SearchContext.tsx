import React, { createContext, useContext, useState } from "react";

export type SearchParams = {
  location: string;
  /** Geocoded latitude — null until the location string has been resolved */
  lat: number | null;
  /** Geocoded longitude — null until the location string has been resolved */
  lng: number | null;
  /** Radius in kilometres used when coordinates are available (default: 30) */
  radiusKm: number;
  checkIn: string | null;
  checkOut: string | null;
  guests: number;
  rentalType: string | null;
  minPrice: number | null;
  maxPrice: number | null;
};

type SearchContextType = {
  searchParams: SearchParams;
  updateSearchParams: (params: Partial<SearchParams>) => void;
  clearSearchParams: () => void;
};

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const DEFAULT_RADIUS_KM = 30;

export const SearchProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [searchParams, setSearchParams] = useState<SearchParams>({
    location: "",
    lat: null,
    lng: null,
    radiusKm: DEFAULT_RADIUS_KM,
    checkIn: null,
    checkOut: null,
    guests: 1,
    rentalType: null,
    minPrice: null,
    maxPrice: null,
  });

  const updateSearchParams = (params: Partial<SearchParams>) => {
    setSearchParams((prev) => ({ ...prev, ...params }));
  };

  const clearSearchParams = () => {
    setSearchParams({
      location: "",
      lat: null,
      lng: null,
      radiusKm: DEFAULT_RADIUS_KM,
      checkIn: null,
      checkOut: null,
      guests: 1,
      rentalType: null,
      minPrice: null,
      maxPrice: null,
    });
  };

  return (
    <SearchContext.Provider
      value={{ searchParams, updateSearchParams, clearSearchParams }}
    >
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error("useSearch must be used within SearchProvider");
  }
  return context;
};
