import PropertyRow from "@/components/properties/PropertyRow";
import AppBar from "@/components/shared/AppBar";
import SearchBar from "@/components/shared/SearchBar";
import { useAuthStore } from "@/store/auth-store";
import { usePropertyStore } from "@/store/property-store";
import { useTheme, type AppTheme } from "@/hooks/useTheme";
import { useEffect, useMemo, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Sentry from "@sentry/react-native";

export default function HomeScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();
  const { guest } = useLocalSearchParams<{ guest?: string }>();
  const isGuestMode = guest === "1";
  const {
    longTermProperties,
    shortTermProperties,
    holidayProperties,
    loadProperties,
    loading,
  } = usePropertyStore();
  const [refreshing, setRefreshing] = useState(false);
  const { profile } = useAuthStore();

  // Redirect landlords to their dashboard unless they've explicitly chosen
  // to browse as a guest (i.e. navigated here with ?guest=1).
  useEffect(() => {
    if (profile?.user_role === "landlord" && !isGuestMode) {
      router.replace("/landlord");
    }
  }, [profile?.user_role, isGuestMode]);

  const onRefresh = () => {
    setRefreshing(true);
    loadProperties();
  };

  useEffect(() => {
    loadProperties();
  }, [loadProperties, profile?.id]);

  // Show a neutral loading state while the profile is loading or while
  // a landlord redirect is in flight.
  if (!profile || (profile.user_role === "landlord" && !isGuestMode)) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <AppBar />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <AppBar />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <AppBar />
      {isGuestMode && (
        <TouchableOpacity
          style={styles.dashboardBanner}
          onPress={() => router.replace("/landlord")}
          accessibilityLabel="Back to dashboard"
        >
          <MaterialIcons name="dashboard" size={16} color={theme.surface} />
          <Text style={styles.dashboardBannerText}>Back to your dashboard</Text>
          <MaterialIcons name="arrow-forward" size={16} color={theme.surface} />
        </TouchableOpacity>
      )}
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
      >
        <View style={styles.content}>
          {/* Welcome Section */}
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>
              Hello, {profile?.first_name || "Guest"} 👋
            </Text>
            <Text style={styles.welcomeSubtitle}>
              Where would you like to go?
            </Text>
          </View>

          {/* Search Bar */}
          <SearchBar />

          {/* Popular Destinations / Recent */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Popular Holiday Rentals</Text>
            {holidayProperties.length > 0 ? (
              <PropertyRow
                title=""
                properties={holidayProperties.slice(0, 5)}
                rentalType="holiday"
              />
            ) : (
              <Text style={styles.emptyText}>No holiday rentals available</Text>
            )}
          </View>

          {/* Other rental types can be shown as secondary options */}
          {shortTermProperties.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Short Term Rentals</Text>
              <PropertyRow
                title=""
                properties={shortTermProperties.slice(0, 5)}
                rentalType="short-term"
              />
            </View>
          )}
          {/*{longTermProperties.length > 0 && (*/}
          {/*    <View style={styles.section}>*/}
          {/*        <Text style={styles.sectionTitle}>Long Term Rentals</Text>*/}
          {/*        <PropertyRow*/}
          {/*            title=""*/}
          {/*            properties={longTermProperties.slice(0, 5)}*/}
          {/*            rentalType="short-term"*/}
          {/*        />*/}
          {/*    </View>*/}
          {/*)}*/}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(t: AppTheme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: t.surface,
    },
    dashboardBanner: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: t.primary,
      paddingVertical: 10,
      paddingHorizontal: 16,
    },
    dashboardBannerText: {
      fontSize: 13,
      fontWeight: "600",
      color: t.surface,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    content: {
      padding: 20,
    },
    welcomeSection: {
      marginBottom: 24,
    },
    welcomeTitle: {
      fontSize: 28,
      fontWeight: "700",
      color: t.darkSlateBlue,
      marginBottom: 4,
    },
    welcomeSubtitle: {
      fontSize: 16,
      color: t.textSecondary,
    },
    section: {
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: t.text,
      marginBottom: 16,
    },
    emptyContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 60,
    },
    emptyText: {
      marginTop: 12,
      fontSize: 16,
      fontWeight: "600",
      color: t.text,
    },
    emptySubtext: {
      fontSize: 14,
      color: t.textSecondary,
      marginTop: 4,
    },
  });
}
