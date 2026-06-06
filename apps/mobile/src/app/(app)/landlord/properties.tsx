import PropertyCard from "@/components/properties/PropertyCard";
import Button from "@/components/shared/Button";
import { useTheme, type AppTheme } from "@/hooks/useTheme";
import { useAuthStore } from "@/store/auth-store";
import { supabase, Property } from "@kiado/shared";
import { deleteProperty, fetchCoverImageUrls } from "@/utils/property-utils";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function PropertiesTab() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useAuthStore();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [coverMap, setCoverMap] = useState<Record<string, string>>({});

  const loadProperties = useCallback(async () => {
    if (!profile?.id) return;
    try {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("landlord_id", profile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setProperties(data || []);
      if (data?.length) {
        const map = await fetchCoverImageUrls(data.map((p) => p.id));
        setCoverMap(map);
      } else {
        setCoverMap({});
      }
    } catch (error) {
      console.error("Error fetching properties:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile?.id]);

  useFocusEffect(
    useCallback(() => {
      loadProperties();
    }, [loadProperties]),
  );

  const handleDelete = (propertyId: string) => {
    Alert.alert(
      "Delete Property",
      "Are you sure you want to delete this property? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteProperty(propertyId);
              Alert.alert("Success", "Property deleted successfully");
              await loadProperties();
            } catch {
              Alert.alert("Error", "Failed to delete property");
            }
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Properties</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push("/properties/create-property")}
          accessibilityLabel="Add property"
        >
          <MaterialIcons name="add" size={22} color={theme.accent} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); loadProperties(); }}
              tintColor={theme.accent}
            />
          }
        >
          {properties.length === 0 ? (
            /* Empty state — show Add Property CTA */
            <View style={styles.emptyState}>
              <MaterialIcons name="home-work" size={56} color={theme.textMuted} />
              <Text style={styles.emptyTitle}>No properties yet</Text>
              <Text style={styles.emptySubtitle}>
                Add your first property to start receiving bookings
              </Text>
              <Button
                title="Add New Property"
                onPress={() => router.push("/properties/create-property")}
                buttonStyle={styles.emptyBtn}
              />
            </View>
          ) : (
            properties.map((property) => (
              <View key={property.id} style={styles.propertyCard}>
                <PropertyCard
                  property={property}
                  onPress={() => router.push(`/properties/${property.id}`)}
                  imageUrl={coverMap[property.id]}
                />
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => router.push(`/manage-unavailable-dates/${property.id}`)}
                  >
                    <MaterialIcons name="event-busy" size={15} color={theme.accent} />
                    <Text style={styles.actionText}>Unavailable</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => router.push(`/properties/edit-property?id=${property.id}`)}
                  >
                    <MaterialIcons name="edit" size={15} color={theme.accent} />
                    <Text style={styles.actionText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleDelete(property.id)}
                  >
                    <MaterialIcons name="delete" size={15} color={theme.error} />
                    <Text style={[styles.actionText, { color: theme.error }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

function createStyles(t: AppTheme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: t.bg,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingTop: 14,
      paddingBottom: 14,
    },
    title: {
      fontSize: 22,
      fontWeight: "700",
      color: t.text,
    },
    addBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: t.card,
      borderWidth: 1,
      borderColor: t.border,
      justifyContent: "center",
      alignItems: "center",
    },
    centered: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      padding: 20,
      paddingBottom: 40,
    },
    propertyCard: {
      backgroundColor: t.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: t.border,
      marginBottom: 20,
      overflow: "hidden",
    },
    actions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 20,
      borderTopWidth: 1,
      borderTopColor: t.border,
    },
    actionBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    actionText: {
      fontSize: 13,
      fontWeight: "500",
      color: t.accent,
    },
    emptyState: {
      alignItems: "center",
      paddingTop: 60,
      paddingHorizontal: 32,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: t.text,
      marginTop: 16,
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 13,
      color: t.textMuted,
      textAlign: "center",
      marginBottom: 28,
      lineHeight: 20,
    },
    emptyBtn: {
      backgroundColor: t.accent,
      paddingHorizontal: 32,
    },
  });
}
