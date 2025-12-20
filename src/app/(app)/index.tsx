import PropertyRow from "@/components/properties/PropertyRow";
import AppBar from "@/components/shared/AppBar";
import WelcomeSection from "@/components/shared/WelcomeSection";
import { useAuthStore } from "@/store/auth-store";
import { usePropertyStore } from "@/store/property-store";
import { colours } from "@/styles/colours";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const {
    longTermProperties,
    shortTermProperties,
    holidayProperties,
    loadProperties,
    loading,
  } = usePropertyStore();
  const [refreshing, setRefreshing] = useState(false);
  const { profile } = useAuthStore();
  const properties = [
    ...longTermProperties,
    ...shortTermProperties,
    ...holidayProperties,
  ];

  const onRefresh = () => {
    setRefreshing(true);
    loadProperties();
  };

  useEffect(() => {
    loadProperties();
  }, [loadProperties, profile?.id]);

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="home" size={64} color={colours.muted} />
      <Text style={styles.emptyText}>No properties available</Text>
      <Text style={styles.emptySubtext}>Check back later for new listings</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <AppBar />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colours.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <AppBar />
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colours.primary}
          />
        }
      >
        <View style={styles.content}>
          <WelcomeSection name={profile?.first_name!} />

          {/* Holiday Rentals */}
          <PropertyRow
            title="Holiday Rentals"
            properties={holidayProperties}
            rentalType="holiday"
          />

          {/* Short Term Rentals */}
          <PropertyRow
            title="Short Term Rentals"
            properties={shortTermProperties}
            rentalType="short-term"
          />

          {/* Long Term Rentals */}
          <PropertyRow
            title="Long Term Rentals"
            properties={longTermProperties}
            rentalType="long-term"
          />

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
  content: {
    padding: 20,
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
