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

type RentalType = "long-term" | "short-term" | "holiday";

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
  const { type } = useLocalSearchParams<{ type: RentalType }>();
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [coverMap, setCoverMap] = useState<Record<string, string>>({});

  const config = type ? RENTAL_TYPE_CONFIG[type] : null;

  const fetchProperties = useCallback(async () => {
    if (!type) return;

    try {
      // Convert URL format to database format
      const dbRentalType = type.replace("-", "_");

      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("is_available", true)
        .eq("rental_type", dbRentalType)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setProperties(data || []);

      // Fetch cover images
      if (data && data.length) {
        const ids = data.map((p) => p.id);
        const map = await fetchCoverImageUrls(ids);
        setCoverMap(map);
      } else {
        setCoverMap({});
      }
    } catch (error) {
      console.error("Error fetching properties:", error);
      Alert.alert("Error", "Failed to load properties");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [type]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProperties();
  };

  const handlePropertyPress = (propertyId: string) => {
    router.push(`/properties/${propertyId}`);
  };

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

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colours.primary} />
      </SafeAreaView>
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
    </>
  );
}

const styles = StyleSheet.create({
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
    padding: 20,
    paddingBottom: 20,
    backgroundColor: colours.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colours.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colours.text,
    marginBottom: 8,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: colours.textSecondary,
    marginBottom: 12,
    textAlign: "center",
  },
  count: {
    fontSize: 14,
    fontWeight: "600",
    color: colours.primary,
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
