import PropertyCard from "@/components/properties/PropertyCard";
import SearchFilters from "@/components/search/SearchFilters";
import { HeaderBackButton } from "@/components/shared/HeaderBackButton";
import { useSearch } from "@/context/SearchContext";
import { geocodeLocation } from "@/utils/geocoding-utils";
import { fetchCoverImageUrls } from "@/utils/property-utils";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { colours, supabase } from "@kiado/shared";
import { Amenity, Property } from "@kiado/shared/types/property";
import { Stack, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PAGE_SIZE = 20;

export default function SearchResultsScreen() {
  const router = useRouter();
  const { searchParams, updateSearchParams, clearSearchParams } = useSearch();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [coverMap, setCoverMap] = useState<Record<string, string>>({});
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [fallbackMessage, setFallbackMessage] = useState<string | null>(null);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [amenityMap, setAmenityMap] = useState<Record<string, Amenity>>({});

  /**
   * Tracks the last location string we successfully geocoded so we can skip
   * re-geocoding when the same location fires searchProperties multiple times.
   */
  const geocodedForRef = useRef<string | null>(null);

  // Load amenity details so we can show dismissible chips for active filters
  useEffect(() => {
    supabase
      .from("amenities")
      .select("*")
      .then(({ data }) => {
        const map: Record<string, Amenity> = {};
        (data || []).forEach((a: Amenity) => (map[a.id] = a));
        setAmenityMap(map);
      });
  }, []);

  const activeFilterCount =
    searchParams.amenityIds.length +
    (searchParams.minBedrooms !== null ? 1 : 0) +
    (searchParams.minPrice !== null ? 1 : 0) +
    (searchParams.maxPrice !== null ? 1 : 0);

  /**
   * Resolves the current location text to lat/lng.
   * Re-uses cached coords in context when the location string hasn't changed.
   * Returns the resolved (or already-cached) coordinates.
   */
  const ensureGeocoded = useCallback(async (): Promise<{
    lat: number | null;
    lng: number | null;
  }> => {
    const { location, lat, lng } = searchParams;

    // If we already have coords from the Autocomplete selection, just use them
    if (lat !== null && lng !== null) {
      return { lat, lng };
    }

    // Fallback: If user just typed text and hit enter, try to geocode once
    if (!location.trim() || geocodedForRef.current === location) {
      return { lat: null, lng: null };
    }

    setGeocoding(true);
    try {
      const result = await geocodeLocation(location);
      if (result) {
        geocodedForRef.current = location;
        updateSearchParams({ lat: result.lat, lng: result.lng });
        return { lat: result.lat, lng: result.lng };
      }
    } catch {
      // Geocoding failed — fall through to text-only search
    } finally {
      setGeocoding(false);
    }

    return { lat: null, lng: null };
  }, [searchParams, updateSearchParams]);

  const buildRpcParams = (
    lat: number | null,
    lng: number | null,
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
    p_page_size: PAGE_SIZE,
  });

  // Abstracted the RPC call to keep it clean
  const fetchPropertiesByRadius = async (
    lat: number,
    lng: number,
    radius: number,
    pageNumber: number,
  ) => {
    const { data, error } = await supabase.rpc(
      "search_properties",
      buildRpcParams(lat, lng, pageNumber, radius),
    );
    if (error) throw error;
    return data as Property[];
  };

  const searchProperties = useCallback(
    async (pageNumber = 0, append = false) => {
      try {
        if (pageNumber === 0) {
          setLoading(true);
          setFallbackMessage(null);
        } else {
          setLoadingMore(true);
        }

        const { lat, lng } = await ensureGeocoded();
        let results: Property[] = [];

        // IF WE HAVE COORDINATES: Do the Fallback Strategy
        if (lat && lng) {
          // Attempt 1: Strict Radius (e.g., 30km)
          results = await fetchPropertiesByRadius(
            lat,
            lng,
            searchParams.radiusKm,
            pageNumber,
          );

          // Attempt 2: Expanded Radius (e.g., 100km)
          if (results.length === 0 && pageNumber === 0) {
            results = await fetchPropertiesByRadius(lat, lng, 100, pageNumber);
            if (results.length > 0) {
              setFallbackMessage(
                `No homes found strictly within ${searchParams.location}. Showing nearby results instead.`,
              );
            }
          }

          // Attempt 3: Global / Closest Available (e.g., 20,000km)
          if (results.length === 0 && pageNumber === 0) {
            results = await fetchPropertiesByRadius(
              lat,
              lng,
              20000,
              pageNumber,
            );
            if (results.length > 0) {
              setFallbackMessage(
                `No homes found in ${searchParams.location} yet. Showing the closest available properties.`,
              );
            }
          }
        }
        // IF NO COORDINATES: Fallback to text search (existing logic)
        else {
          const { data, error } = await supabase.rpc(
            "search_properties",
            buildRpcParams(null, null, pageNumber),
          );

          if (error) throw error;
          results = data || [];
        }

        setHasMore(results.length === PAGE_SIZE);
        setProperties((prev) => (append ? [...prev, ...results] : results));

        if (results.length) {
          const ids = results.map((p) => p.id);
          const map = await fetchCoverImageUrls(ids);
          setCoverMap((prev) => ({ ...prev, ...map }));
        } else if (!append) {
          setCoverMap({});
        }
      } catch (error) {
        console.error("Search Error:", error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [searchParams, ensureGeocoded],
  );

  useEffect(() => {
    setPage(0);
    setHasMore(true);
    searchProperties(0, false);
  }, [searchProperties]);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(0);
    setHasMore(true);
    searchProperties(0, false);
  };

  const onEndReached = () => {
    if (!hasMore || loadingMore || loading) return;
    const nextPage = page + 1;
    setPage(nextPage);
    searchProperties(nextPage, true);
  };

  const handlePropertyPress = (propertyId: string) => {
    router.push(`/properties/${propertyId}`);
  };

  const removeAmenityFilter = (id: string) => {
    updateSearchParams({
      amenityIds: searchParams.amenityIds.filter((a) => a !== id),
    });
  };

  const clearFilters = () => {
    updateSearchParams({
      amenityIds: [],
      minBedrooms: null,
      minPrice: null,
      maxPrice: null,
    });
  };

  const renderHeader = () => {
    // Determine the descriptive label for the radius/location
    const locationLabel = fallbackMessage
      ? `Nearby ${searchParams.location}`
      : `within ${searchParams.radiusKm} km of ${searchParams.location}`;

    const hasActiveFilters =
      searchParams.amenityIds.length > 0 ||
      searchParams.minBedrooms !== null ||
      searchParams.minPrice !== null ||
      searchParams.maxPrice !== null;

    return (
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          {/* Row 1 — result count + location */}
          <View style={styles.summaryRow}>
            <Text style={styles.resultsCount}>
              {properties.length}{" "}
              <Text style={styles.resultsCountLabel}>
                {properties.length === 1 ? "home" : "homes"} found
              </Text>
            </Text>
            <View style={styles.locationRow}>
              <MaterialIcons
                name="location-on"
                size={13}
                color={colours.primary}
              />
              <Text style={styles.searchLocation} numberOfLines={1}>
                {locationLabel}
              </Text>
            </View>
            {searchParams.checkIn && (
              <View style={styles.locationRow}>
                <MaterialIcons
                  name="date-range"
                  size={13}
                  color={colours.textSecondary}
                />
                <Text style={styles.searchDates}>
                  {new Date(searchParams.checkIn).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                  })}{" "}
                  →{" "}
                  {new Date(searchParams.checkOut!).toLocaleDateString(
                    "en-GB",
                    {
                      day: "numeric",
                      month: "short",
                    },
                  )}
                </Text>
              </View>
            )}
          </View>

          {/* Row 2 — filter button + clear filters */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                activeFilterCount > 0 && styles.filterButtonActive,
              ]}
              onPress={() => setFiltersVisible(true)}
              activeOpacity={0.8}
            >
              <MaterialIcons
                name="tune"
                size={16}
                color={activeFilterCount > 0 ? "#fff" : colours.primary}
              />
              <Text
                style={[
                  styles.filterButtonText,
                  activeFilterCount > 0 && styles.filterButtonTextActive,
                ]}
              >
                {activeFilterCount > 0
                  ? `Filters (${activeFilterCount})`
                  : "Filters"}
              </Text>
            </TouchableOpacity>

            {hasActiveFilters && (
              <TouchableOpacity
                style={styles.clearFiltersButton}
                onPress={clearFilters}
              >
                <MaterialIcons
                  name="close"
                  size={14}
                  color={colours.textSecondary}
                />
                <Text style={styles.clearFiltersText}>Clear filters</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Active filter chips */}
        {hasActiveFilters && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.activeFiltersRow}
          >
            {searchParams.minBedrooms !== null && (
              <TouchableOpacity
                style={styles.activeChip}
                onPress={() => updateSearchParams({ minBedrooms: null })}
              >
                <Text style={styles.activeChipText}>
                  {searchParams.minBedrooms}+ beds
                </Text>
                <MaterialIcons name="close" size={14} color={colours.primary} />
              </TouchableOpacity>
            )}
            {searchParams.minPrice !== null && (
              <TouchableOpacity
                style={styles.activeChip}
                onPress={() => updateSearchParams({ minPrice: null })}
              >
                <Text style={styles.activeChipText}>
                  From £{searchParams.minPrice}
                </Text>
                <MaterialIcons name="close" size={14} color={colours.primary} />
              </TouchableOpacity>
            )}
            {searchParams.maxPrice !== null && (
              <TouchableOpacity
                style={styles.activeChip}
                onPress={() => updateSearchParams({ maxPrice: null })}
              >
                <Text style={styles.activeChipText}>
                  Up to £{searchParams.maxPrice}
                </Text>
                <MaterialIcons name="close" size={14} color={colours.primary} />
              </TouchableOpacity>
            )}
            {searchParams.amenityIds.map((id) =>
              amenityMap[id] ? (
                <TouchableOpacity
                  key={id}
                  style={styles.activeChip}
                  onPress={() => removeAmenityFilter(id)}
                >
                  <MaterialIcons
                    name={amenityMap[id].icon as any}
                    size={14}
                    color={colours.primary}
                  />
                  <Text style={styles.activeChipText}>
                    {amenityMap[id].name}
                  </Text>
                  <MaterialIcons
                    name="close"
                    size={14}
                    color={colours.primary}
                  />
                </TouchableOpacity>
              ) : null,
            )}
          </ScrollView>
        )}
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="search-off" size={64} color={colours.muted} />
      <Text style={styles.emptyText}>No properties found</Text>
      <Text style={styles.emptySubtext}>
        Try adjusting your search criteria or expanding the radius
      </Text>
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "Search Results",
          headerShown: true,
          headerLeft: () => <HeaderBackButton />,
        }}
      />
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        {(loading || geocoding) && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colours.primary} />
            {geocoding && (
              <Text style={styles.geocodingText}>Locating area…</Text>
            )}
          </View>
        ) : (
          <>
            {fallbackMessage && (
              <View style={styles.fallbackBanner}>
                <MaterialIcons
                  name="info-outline"
                  size={20}
                  color={colours.warning}
                />
                <Text style={styles.fallbackText}>{fallbackMessage}</Text>
              </View>
            )}
            <FlatList
              data={properties}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.cardWrapper}>
                  <PropertyCard
                    property={item}
                    onPress={() => handlePropertyPress(item.id)}
                    imageUrl={coverMap[item.id]}
                  />
                </View>
              )}
              ListHeaderComponent={renderHeader}
              ListEmptyComponent={renderEmpty}
              contentContainerStyle={styles.listContent}
              onEndReached={onEndReached}
              onEndReachedThreshold={0.5}
              ListFooterComponent={
                loadingMore ? (
                  <ActivityIndicator
                    size="small"
                    color={colours.primary}
                    style={{ paddingVertical: 16 }}
                  />
                ) : null
              }
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={colours.primary}
                />
              }
            />
          </>
        )}
      </SafeAreaView>

      <SearchFilters
        visible={filtersVisible}
        params={searchParams}
        onApply={updateSearchParams}
        onClose={() => setFiltersVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colours.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  geocodingText: {
    fontSize: 14,
    color: colours.textSecondary,
  },
  listContent: {
    padding: 16,
    paddingTop: 12,
  },
  fallbackBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colours.warning + "15",
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colours.warning + "40",
    gap: 12,
  },
  fallbackText: {
    flex: 1,
    fontSize: 14,
    color: colours.text,
    lineHeight: 20,
  },
  // ── Header ────────────────────────────────────────────────────────────────
  headerContainer: {
    gap: 10,
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colours.border,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
  },
  summaryRow: {
    flex: 1,
    gap: 3,
  },
  resultsCount: {
    fontSize: 22,
    fontWeight: "800",
    color: colours.text,
  },
  resultsCountLabel: {
    fontSize: 18,
    fontWeight: "500",
    color: colours.text,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  searchLocation: {
    fontSize: 13,
    color: colours.textSecondary,
    flex: 1,
  },
  searchDates: {
    fontSize: 13,
    color: colours.textSecondary,
  },
  actionsRow: {
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: colours.primary,
    backgroundColor: colours.surface,
  },
  filterButtonActive: {
    backgroundColor: colours.primary,
    borderColor: colours.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colours.primary,
  },
  filterButtonTextActive: {
    color: "#fff",
  },
  clearFiltersButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    // paddingVertical: 9,
  },
  clearFiltersText: {
    fontSize: 13,
    color: colours.textSecondary,
    fontWeight: "500",
  },
  activeFiltersRow: {
    flexDirection: "row",
    gap: 8,
    paddingRight: 8,
  },
  activeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colours.primaryLight,
    borderWidth: 1,
    borderColor: colours.primary + "40",
  },
  activeChipText: {
    fontSize: 12,
    color: colours.primary,
    fontWeight: "600",
  },
  // ── Cards ─────────────────────────────────────────────────────────────────
  cardWrapper: {
    marginBottom: 16,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "600",
    color: colours.text,
  },
  emptySubtext: {
    fontSize: 14,
    color: colours.textSecondary,
    marginTop: 4,
    textAlign: "center",
  },
});
