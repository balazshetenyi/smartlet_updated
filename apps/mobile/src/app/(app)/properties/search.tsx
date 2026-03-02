import PropertyCard from "@/components/properties/PropertyCard";
import { HeaderBackButton } from "@/components/shared/HeaderBackButton";
import { useSearch } from "@/context/SearchContext";
import { geocodeLocation } from "@/utils/geocoding-utils";
import { fetchCoverImageUrls } from "@/utils/property-utils";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { colours, supabase } from "@kiado/shared";
import { Property } from "@kiado/shared/types/property.js";
import { Stack, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PAGE_SIZE = 20;

export default function SearchResultsScreen() {
  const { searchParams, updateSearchParams, clearSearchParams } = useSearch();
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [coverMap, setCoverMap] = useState<Record<string, string>>({});
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [geocoding, setGeocoding] = useState(false);

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

    // Already have fresh coords for this exact location string — reuse them
    if (lat !== null && lng !== null && geocodedForRef.current === location) {
      return { lat, lng };
    }

    if (!location.trim()) {
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

  const searchProperties = useCallback(
    async (pageNumber = 0, append = false) => {
      try {
        if (pageNumber === 0) setLoading(true);
        else setLoadingMore(true);

        const { lat, lng } = await ensureGeocoded();

        const { data, error } = await supabase.rpc("search_properties", {
          p_location: searchParams.location || null,
          p_lat: lat,
          p_lng: lng,
          p_radius_km: searchParams.radiusKm,
          p_check_in: searchParams.checkIn || null,
          p_check_out: searchParams.checkOut || null,
          p_guests: searchParams.guests > 0 ? searchParams.guests : null,
          p_rental_type: searchParams.rentalType?.toLowerCase() || null,
          p_min_price: searchParams.minPrice || null,
          p_max_price: searchParams.maxPrice || null,
          p_page: pageNumber,
          p_page_size: PAGE_SIZE,
        });

        if (error) throw error;

        const results: Property[] = data || [];

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
        console.error("Error searching properties:", error);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
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

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.searchSummary}>
        <Text style={styles.resultsCount}>
          {properties.length}{" "}
          {properties.length === 1 ? "property" : "properties"} found
        </Text>

        {searchParams.location && (
          <View style={styles.locationRow}>
            <MaterialIcons
              name={searchParams.lat !== null ? "location-on" : "search"}
              size={14}
              color={colours.textSecondary}
            />
            <Text style={styles.searchLocation}>
              {searchParams.lat !== null
                ? `within ${searchParams.radiusKm} km of ${searchParams.location}`
                : `matching "${searchParams.location}"`}
            </Text>
          </View>
        )}

        {searchParams.checkIn && searchParams.checkOut && (
          <Text style={styles.searchDates}>
            {new Date(searchParams.checkIn).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
            })}{" "}
            -{" "}
            {new Date(searchParams.checkOut).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
            })}
          </Text>
        )}
      </View>

      <TouchableOpacity
        style={styles.clearButton}
        onPress={() => {
          clearSearchParams();
          router.back();
        }}
      >
        <Text style={styles.clearButtonText}>Clear</Text>
      </TouchableOpacity>
    </View>
  );

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
          title: "Search Results",
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
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colours.border,
  },
  searchSummary: {
    flex: 1,
    gap: 4,
  },
  resultsCount: {
    fontSize: 18,
    fontWeight: "700",
    color: colours.text,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  searchLocation: {
    fontSize: 14,
    color: colours.textSecondary,
  },
  searchDates: {
    fontSize: 14,
    color: colours.textSecondary,
  },
  clearButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colours.border,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colours.primary,
  },
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
