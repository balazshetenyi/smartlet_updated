import PropertyCard from "@/components/properties/PropertyCard";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/auth-store";
import { colours } from "@/styles/colours";
import { Property } from "@/types/property";
import { fetchTotalUnreadCount } from "@/utils/message-utils";
import { fetchCoverImageUrls } from "@/utils/property-utils";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH * 0.7; // 70% of screen width
const CARD_MARGIN = 12;

export default function HomeScreen() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [longTermProperties, setLongTermProperties] = useState<Property[]>([]);
  const [shortTermProperties, setShortTermProperties] = useState<Property[]>(
    []
  );
  const [holidayProperties, setHolidayProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [coverMap, setCoverMap] = useState<Record<string, string>>({});
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();
  const { session } = useAuthStore();

  const fetchProperties = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("is_available", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const allProperties = data || [];
      setProperties(allProperties);
      setFilteredProperties(allProperties);

      // Separate by rental type
      setLongTermProperties(
        allProperties.filter((p) => p.rental_type === "long_term")
      );
      setShortTermProperties(
        allProperties.filter((p) => p.rental_type === "short_term")
      );
      setHolidayProperties(
        allProperties.filter((p) => p.rental_type === "holiday")
      );

      // Fetch cover images
      if (allProperties.length) {
        const ids = allProperties.map((p) => p.id);
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
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const count = await fetchTotalUnreadCount(session.user.id);
      setUnreadCount(count);
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    fetchProperties();
    fetchUnreadCount();
  }, [fetchProperties, fetchUnreadCount]);

  useFocusEffect(
    useCallback(() => {
      fetchProperties();
      fetchUnreadCount();

      // Subscribe to message updates to refresh unread count in real-time
      const channel = supabase
        .channel("home-messages-updates")
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "messages",
          },
          () => {
            // Small delay to ensure DB consistency
            setTimeout(() => fetchUnreadCount(), 100);
          }
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
          },
          () => {
            setTimeout(() => fetchUnreadCount(), 100);
          }
        )
        .subscribe();

      return () => {
        channel.unsubscribe();
      };
    }, [fetchProperties, fetchUnreadCount])
  );

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredProperties(properties);
    } else {
      const filtered = properties.filter(
        (property) =>
          property.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          property.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          property.address?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProperties(filtered);
    }
  }, [searchQuery, properties]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProperties();
  };

  const handlePropertyPress = (propertyId: string) => {
    // router.push(`/property/${propertyId}`);
  };

  const renderPropertyRow = (
    title: string,
    properties: Property[],
    rentalType: string
  ) => {
    if (properties.length === 0) return null;

    return (
      <View style={styles.categorySection}>
        <View style={styles.categoryHeader}>
          <Text style={styles.categoryTitle}>{title}</Text>
          <TouchableOpacity
          // onPress={() => router.push(`/properties/${rentalType}`)}
          >
            <Text style={styles.viewAllText}>View All →</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}
          snapToInterval={CARD_WIDTH + CARD_MARGIN}
          decelerationRate="fast"
        >
          {properties.map((property, index) => (
            <View
              key={property.id}
              style={[
                styles.horizontalCard,
                { width: CARD_WIDTH },
                index === properties.length - 1 && styles.lastCard,
              ]}
            >
              <PropertyCard
                property={property}
                onPress={() => handlePropertyPress(property.id)}
                imageUrl={coverMap[property.id]}
              />
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderAppBar = () => (
    <View style={styles.appBar}>
      <View style={styles.appBarContent}>
        {/* Logo/Brand */}
        <View style={styles.brandContainer}>
          <MaterialIcons name="home" size={28} color={colours.primary} />
          <Text style={styles.brandText}>SmartLet</Text>
        </View>

        {/* Search and Profile */}
        <View style={styles.appBarActions}>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => setSearchFocused(true)}
          >
            <MaterialIcons name="search" size={24} color={colours.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.profileButton}
            // onPress={() => router.navigate("/(account)/profile")}
          >
            <MaterialIcons name="person" size={24} color={colours.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.messageButton}
            onPress={() => router.navigate("/messages/" as any)}
          >
            <MaterialIcons
              name="chat-bubble-outline"
              size={24}
              color={colours.text}
            />
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Expandable Search Bar */}
      {searchFocused && (
        <View style={styles.expandedSearchContainer}>
          <MaterialIcons
            name="search"
            size={20}
            color={colours.muted}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search properties, cities..."
            placeholderTextColor={colours.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
            onBlur={() => {
              if (!searchQuery) setSearchFocused(false);
            }}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <MaterialIcons name="close" size={20} color={colours.muted} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              setSearchQuery("");
              setSearchFocused(false);
            }}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderWelcomeSection = () => (
    <View style={styles.welcomeSection}>
      <Text style={styles.greeting}>
        Hello, {session?.user?.user_metadata?.first_name || "Guest"} 👋
      </Text>
      <Text style={styles.subtitle}>Find your perfect property</Text>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="home" size={64} color={colours.muted} />
      <Text style={styles.emptyText}>
        {searchQuery ? "No properties found" : "No properties available"}
      </Text>
      <Text style={styles.emptySubtext}>
        {searchQuery
          ? "Try adjusting your search"
          : "Check back later for new listings"}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        {renderAppBar()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colours.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // Show search results view when searching
  if (searchQuery.trim() !== "") {
    return (
      <View style={styles.container}>
        {renderAppBar()}
        <FlatList
          data={filteredProperties}
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
          ListHeaderComponent={() => (
            <Text style={styles.searchResultsTitle}>
              {filteredProperties.length} result
              {filteredProperties.length !== 1 ? "s" : ""} found
            </Text>
          )}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              // onRefresh={onRefresh}
              tintColor={colours.primary}
            />
          }
        />
      </View>
    );
  }

  // Show categorized view when not searching
  return (
    <View style={styles.container}>
      {renderAppBar()}
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            // onRefresh={onRefresh}
            tintColor={colours.primary}
          />
        }
      >
        <View style={styles.content}>
          {renderWelcomeSection()}

          {/* Holiday Rentals */}
          {renderPropertyRow("Holiday Rentals", holidayProperties, "holiday")}

          {/* Short Term Rentals */}
          {renderPropertyRow(
            "Short Term Rentals",
            shortTermProperties,
            "short-term"
          )}

          {/* Long Term Rentals */}
          {renderPropertyRow(
            "Long Term Rentals",
            longTermProperties,
            "long-term"
          )}

          {/* Empty state if no properties at all */}
          {properties.length === 0 && renderEmpty()}
        </View>
      </ScrollView>
    </View>
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
  appBar: {
    backgroundColor: colours.surface,
    borderBottomWidth: 1,
    borderBottomColor: colours.border,
  },
  appBarContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  brandContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  brandText: {
    fontSize: 20,
    fontWeight: "700",
    color: colours.text,
  },
  appBarActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colours.background,
    alignItems: "center",
    justifyContent: "center",
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colours.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  messageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colours.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  unreadBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: colours.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: colours.surface,
  },
  unreadBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  expandedSearchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colours.text,
    backgroundColor: colours.background,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  cancelButton: {
    paddingHorizontal: 12,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: "600",
    color: colours.primary,
  },
  content: {
    padding: 20,
  },
  welcomeSection: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "700",
    color: colours.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colours.textSecondary,
  },
  listContent: {
    padding: 20,
    paddingTop: 16,
  },
  cardWrapper: {
    marginBottom: 16,
  },
  searchResultsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colours.text,
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
  categorySection: {
    marginBottom: 32,
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: colours.text,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: colours.primary,
  },
  horizontalScroll: {
    paddingRight: 8,
  },
  horizontalCard: {
    marginRight: CARD_MARGIN,
  },
  lastCard: {
    marginRight: 0,
    paddingRight: 20,
  },
});
