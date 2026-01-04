import PropertyCard from "@/components/properties/PropertyCard";
import { useSearch } from "@/context/SearchContext";
import { colours } from "@/styles/colours";
import { Property } from "@/types/property";
import { fetchBookedDates } from "@/utils/booking-utils";
import { fetchCoverImageUrls } from "@/utils/property-utils";
import { supabase } from "@/lib/supabase";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Stack, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
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

export default function SearchResultsScreen() {
  const { searchParams, clearSearchParams } = useSearch();
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [coverMap, setCoverMap] = useState<Record<string, string>>({});

  const searchProperties = useCallback(async () => {
    try {
      setLoading(true);

      // Base query - only holiday rentals that are available
      let query = supabase
        .from("properties")
        .select("*")
        .eq("is_available", true)
        .eq("rental_type", "holiday");

      // Filter by location if provided
      if (searchParams.location) {
        query = query.or(
          `city.ilike.%${searchParams.location}%,address.ilike.%${searchParams.location}%`
        );
      }

      const { data, error } = await query.order("created_at", {
        ascending: false,
      });

      if (error) throw error;

      let availableProperties = data || [];

      // Filter by availability if dates are selected
      if (searchParams.checkIn && searchParams.checkOut) {
        const availabilityPromises = availableProperties.map(
          async (property) => {
            const bookedDates = await fetchBookedDates(property.id);

            // Check if property is available for selected dates
            const start = new Date(searchParams.checkIn!);
            const end = new Date(searchParams.checkOut!);

            for (
              let d = new Date(start);
              d <= end;
              d.setDate(d.getDate() + 1)
            ) {
              if (bookedDates.includes(d.toISOString().split("T")[0])) {
                return null; // Property not available
              }
            }

            return property;
          }
        );

        const results = await Promise.all(availabilityPromises);
        availableProperties = results.filter((p) => p !== null) as Property[];
      }

      setProperties(availableProperties);

      // Fetch cover images
      if (availableProperties.length) {
        const ids = availableProperties.map((p) => p.id);
        const map = await fetchCoverImageUrls(ids);
        setCoverMap(map);
      } else {
        setCoverMap({});
      }
    } catch (error) {
      console.error("Error searching properties:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchParams]);

  useEffect(() => {
    searchProperties();
  }, [searchProperties]);

  const onRefresh = () => {
    setRefreshing(true);
    searchProperties();
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
          <Text style={styles.searchLocation}>in {searchParams.location}</Text>
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
        Try adjusting your search criteria
      </Text>
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: "Search Results",
          headerShown: true,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ marginLeft: 8, padding: 4 }}
            >
              <MaterialIcons name="arrow-back" size={24} color={colours.text} />
            </TouchableOpacity>
          ),
        }}
      />
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colours.primary} />
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
  },
  resultsCount: {
    fontSize: 18,
    fontWeight: "700",
    color: colours.text,
    marginBottom: 4,
  },
  searchLocation: {
    fontSize: 14,
    color: colours.textSecondary,
    marginBottom: 2,
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
  },
});