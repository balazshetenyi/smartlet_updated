import PropertyCard from "@/components/properties/PropertyCard";
import { colours, supabase, Property } from "@kiado/shared";
import { fetchCoverImageUrls } from "@/utils/property-utils";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { HeaderBackButton } from "@/components/shared/HeaderBackButton";
import { useSearch } from "@/context/SearchContext";
import SearchFilterActions from "@/components/search/SearchFilterActions";
import ActiveSearchFilters from "@/components/search/ActiveSearchFilters";

type RentalType = "long-term" | "short-term" | "holiday";

const PAGE_SIZE = 20;

const RENTAL_TYPE_CONFIG: Record<
  RentalType,
  { title: string; icon: string; description: string }
> = {
  "long-term": {
    title: "Long Term Rentals",
    icon: "home",
    description: "Monthly rentals for extended stays",
  },
  "short-term": {
    title: "Short Term Rentals",
    icon: "calendar-today",
    description: "Weekly rentals for flexible stays",
  },
  holiday: {
    title: "Holiday Rentals",
    icon: "beach-access",
    description: "Nightly rentals for vacations",
  },
};

export default function PropertyCategoryScreen() {
  const router = useRouter();
  const { type } = useLocalSearchParams<{ type: RentalType }>();
  const { buildSearchParams } = useSearch();

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [coverMap, setCoverMap] = useState<Record<string, string>>({});
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const config = type ? RENTAL_TYPE_CONFIG[type] : null;
  // Convert URL format (long-term) to DB format (long_term)
  const dbRentalType = type?.replace("-", "_") ?? null;

  const fetchProperties = useCallback(
    async (pageNumber = 0, append = false) => {
      if (!type) return;

      try {
        if (pageNumber === 0) setLoading(true);
        else setLoadingMore(true);

        const rpcParams = {
          ...buildSearchParams(null, null, PAGE_SIZE, pageNumber),
          // Override rental type with the page's fixed type
          p_rental_type: dbRentalType,
          // No location filter on this page — show all of this type
          p_location: null,
        };

        const { data, error } = await supabase.rpc(
          "search_properties",
          rpcParams,
        );

        if (error) throw error;

        const results = (data as Property[]) || [];
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
        console.error("Error fetching properties:", error);
        Alert.alert("Error", "Failed to load properties");
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    // Re-run whenever filters change
    [type, buildSearchParams, dbRentalType],
  );

  useEffect(() => {
    setPage(0);
    setHasMore(true);
    fetchProperties(0, false);
  }, [fetchProperties]);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(0);
    setHasMore(true);
    fetchProperties(0, false);
  };

  const onEndReached = () => {
    if (!hasMore || loadingMore || loading) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchProperties(nextPage, true);
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.header}>
        <View style={styles.countRow}>
          <Text style={styles.resultsCount}>
            {properties.length}{" "}
            <Text style={styles.resultsCountLabel}>
              {properties.length === 1 ? "property" : "properties"} found
            </Text>
          </Text>
        </View>
        <SearchFilterActions />
      </View>
      <ActiveSearchFilters />
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="home" size={64} color={colours.muted} />
      <Text style={styles.emptyText}>No properties available</Text>
      <Text style={styles.emptySubtext}>
        Check back later for new {config?.title.toLowerCase()}
      </Text>
    </View>
  );

  if (!config) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={64} color={colours.muted} />
        <Text style={styles.errorText}>Invalid property type</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (loading && !refreshing) {
    return (
      <>
        <Stack.Screen
          options={{
            headerTitle: config.title,
            headerShown: true,
            headerLeft: () => <HeaderBackButton />,
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colours.primary} />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: config.title,
          headerShown: true,
          headerLeft: () => <HeaderBackButton />,
        }}
      />
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <FlatList
          data={properties}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.cardWrapper}>
              <PropertyCard
                property={item}
                onPress={() => router.push(`/properties/${item.id}`)}
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
    backgroundColor: colours.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colours.background,
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: "600",
    color: colours.text,
    marginTop: 16,
    marginBottom: 24,
  },
  backLink: {
    fontSize: 16,
    fontWeight: "600",
    color: colours.primary,
  },
  listContent: {
    padding: 16,
    paddingBottom: 20,
  },
  headerContainer: {
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colours.border,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 8,
  },
  countRow: {
    flexDirection: "row",
    alignItems: "center",
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
  cardWrapper: {
    marginBottom: 16,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: colours.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colours.textSecondary,
    marginTop: 8,
    textAlign: "center",
  },
});
