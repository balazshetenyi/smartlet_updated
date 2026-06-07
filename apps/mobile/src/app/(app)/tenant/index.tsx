import PropertyRow from "@/components/properties/PropertyRow";
import AppBar from "@/components/shared/AppBar";
import SearchBar from "@/components/shared/SearchBar";
import { useTheme, type AppTheme } from "@/hooks/useTheme";
import { useAuthStore } from "@/store/auth-store";
import { usePropertyStore } from "@/store/property-store";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
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

export default function ExploreTab() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();
  const { guest } = useLocalSearchParams<{ guest?: string }>();
  const isGuestMode = guest === "1";
  const { profile } = useAuthStore();
  const {
    shortTermProperties,
    holidayProperties,
    loadProperties,
    loading,
  } = usePropertyStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadProperties();
  }, [loadProperties, profile?.id]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <AppBar />

      {isGuestMode && (
        <TouchableOpacity
          style={styles.banner}
          onPress={() => router.replace("/landlord")}
          accessibilityLabel="Back to dashboard"
        >
          <MaterialIcons name="dashboard" size={16} color={theme.surface} />
          <Text style={styles.bannerText}>Back to your dashboard</Text>
          <MaterialIcons name="arrow-forward" size={16} color={theme.surface} />
        </TouchableOpacity>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadProperties(); }}
            tintColor={theme.primary}
          />
        }
      >
        <View style={styles.content}>
          <SearchBar />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Popular Holiday Rentals</Text>
            {loading ? (
              <ActivityIndicator size="small" color={theme.primary} style={styles.loader} />
            ) : holidayProperties.length > 0 ? (
              <PropertyRow title="" properties={holidayProperties.slice(0, 5)} rentalType="holiday" />
            ) : (
              <Text style={styles.emptyText}>No holiday rentals available</Text>
            )}
          </View>

          {(loading || shortTermProperties.length > 0) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Short Term Rentals</Text>
              {loading ? (
                <ActivityIndicator size="small" color={theme.primary} style={styles.loader} />
              ) : (
                <PropertyRow title="" properties={shortTermProperties.slice(0, 5)} rentalType="short-term" />
              )}
            </View>
          )}
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
    banner: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: t.primary,
      paddingVertical: 10,
      paddingHorizontal: 16,
    },
    bannerText: {
      fontSize: 13,
      fontWeight: "600",
      color: t.surface,
    },
    content: {
      padding: 20,
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
    loader: {
      marginVertical: 20,
    },
    emptyText: {
      fontSize: 14,
      color: t.textSecondary,
    },
  });
}
