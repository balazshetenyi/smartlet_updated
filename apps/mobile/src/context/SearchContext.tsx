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
  minBedrooms: number | null;
  amenityIds: string[];
};

type RpcParams = {
  p_location: string | null;
  p_lat: number | null;
  p_lng: number | null;
  p_radius_km: number;
  p_check_in: string | null;
  p_check_out: string | null;
  p_guests: number | null;
  p_rental_type: string | null;
  p_min_price: number | null;
  p_max_price: number | null;
  p_bedrooms: number | null;
  p_amenity_ids: string[] | null;
  p_page: number;
  p_page_size: number;
};

type SearchContextType = {
  searchParams: SearchParams;
  buildSearchParams: (
    lat: number | null,
    lng: number | null,
    pageSize: number,
    pageNumber: number,
    overrideRadius?: number,
  ) => RpcParams;
  updateSearchParams: (params: Partial<SearchParams>) => void;
  clearSearchParams: () => void;
  hasActiveFilters: boolean;
  clearFilters: () => void;
};

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const DEFAULT_RADIUS_KM = 30;

const DEFAULT_PARAMS: SearchParams = {
  location: "",
  lat: null,
  lng: null,
  radiusKm: DEFAULT_RADIUS_KM,
  checkIn: null,
  checkOut: null,
  guests: 1,
  rentalType: "holiday",
  minPrice: null,
  maxPrice: null,
  minBedrooms: null,
  amenityIds: [],
};

export const SearchProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [searchParams, setSearchParams] =
    useState<SearchParams>(DEFAULT_PARAMS);

  const updateSearchParams = (params: Partial<SearchParams>) => {
    setSearchParams((prev) => ({ ...prev, ...params }));
  };

  const buildSearchParams = (
    lat: number | null,
    lng: number | null,
    pageSize: number,
    pageNumber: number,
    overrideRadius?: number,
  ) => ({
    p_location: lat ? null : searchParams.location || null,
    p_lat: lat,
    p_lng: lng,
    p_radius_km: overrideRadius ?? searchParams.radiusKm,
    p_check_in: searchParams.checkIn || null,
    p_check_out: searchParams.checkOut || null,
    p_guests: searchParams.guests > 0 ? searchParams.guests : null,
    p_rental_type: searchParams.rentalType?.toLowerCase() || null,
    p_min_price: searchParams.minPrice || null,
    p_max_price: searchParams.maxPrice || null,
    p_bedrooms: searchParams.minBedrooms || null,
    p_amenity_ids:
      searchParams.amenityIds.length > 0 ? searchParams.amenityIds : null,
    p_page: pageNumber,
    p_page_size: pageSize,
  });

  const clearSearchParams = () => {
    setSearchParams(DEFAULT_PARAMS);
  };

  const clearFilters = () => {
    updateSearchParams({
      amenityIds: [],
      minBedrooms: null,
      minPrice: null,
      maxPrice: null,
    });
  };

  const hasActiveFilters =
    searchParams.amenityIds.length > 0 ||
    searchParams.minBedrooms !== null ||
    searchParams.minPrice !== null ||
    searchParams.maxPrice !== null;

  return (
    <SearchContext.Provider
      value={{
        searchParams,
        buildSearchParams,
        updateSearchParams,
        clearSearchParams,
        hasActiveFilters,
        clearFilters,
      }}
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
