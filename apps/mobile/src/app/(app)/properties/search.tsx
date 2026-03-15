import PropertyCard from "@/components/properties/PropertyCard";
import ActiveSearchFilters from "@/components/search/ActiveSearchFilters";
import SearchFilterActions from "@/components/search/SearchFilterActions";
import SearchSummary from "@/components/search/SearchSummary";
import { HeaderBackButton } from "@/components/shared/HeaderBackButton";
import { useSearch } from "@/context/SearchContext";
import { geocodeLocation } from "@/utils/geocoding-utils";
import { fetchCoverImageUrls } from "@/utils/property-utils";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { colours, supabase } from "@kiado/shared";
import { Property } from "@kiado/shared/types/property";
import { Stack, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PAGE_SIZE = 20;

export default function SearchResultsScreen() {
  const router = useRouter();
  const { searchParams, buildSearchParams, updateSearchParams } = useSearch();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [coverMap, setCoverMap] = useState<Record<string, string>>({});
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [fallbackMessage, setFallbackMessage] = useState<string | null>(null);

  /**
   * Tracks the last location string we successfully geocoded so we can skip
   * re-geocoding when the same location fires searchProperties multiple times.
   */
  const geocodedForRef = useRef<string | null>(null);

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

  // Abstracted the RPC call to keep it clean
  const fetchPropertiesByRadius = async (
    lat: number,
    lng: number,
    radius: number,
    pageNumber: number,
  ) => {
    const { data, error } = await supabase.rpc(
      "search_properties",
      buildSearchParams(lat, lng, PAGE_SIZE, pageNumber, radius),
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
            buildSearchParams(null, null, PAGE_SIZE, pageNumber),
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

  const renderHeader = () => {
    // Determine the descriptive label for the radius/location
    const locationLabel = fallbackMessage
      ? `Nearby ${searchParams.location}`
      : `within ${searchParams.radiusKm} km of ${searchParams.location}`;

    return (
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <SearchSummary
            resultCount={properties.length}
            locationLabel={locationLabel}
          />
          <SearchFilterActions />
        </View>

        <ActiveSearchFilters />
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
