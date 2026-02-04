import PropertyCard from "@/components/properties/PropertyCard";
import Button from "@/components/shared/Button";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/auth-store";
import { colours } from "@/styles/colours";
import { Property } from "@/types/property";
import { deleteProperty, fetchCoverImageUrls } from "@/utils/property-utils";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const Properties = () => {
  const { profile } = useAuthStore();
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(false);
  const [coverMap, setCoverMap] = useState<Record<string, string>>({});

  // Function to load properties (memoized to prevent re-registration loops)
  const loadProperties = useCallback(async () => {
    try {
      setLoadingProperties(true);
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("landlord_id", profile?.id)
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) throw error;

      setProperties(data || []);
      if (data && data.length) {
        const ids = data.map((p) => p.id);
        const map = await fetchCoverImageUrls(ids);
        setCoverMap(map);
      } else {
        setCoverMap({});
      }
    } catch (error) {
      console.error("Error fetching properties:", error);
    } finally {
      setLoadingProperties(false);
    }
  }, [profile?.id]);

  // Load properties when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadProperties();
    }, [loadProperties]),
  );

  const handleDeleteProperty = async (propertyId: string) => {
    Alert.alert(
      "Delete Property",
      "Are you sure you want to delete this property? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const { data: userData } = await supabase.auth.getUser();
              console.log("user id:", userData?.user?.id);

              const data = await deleteProperty(propertyId);
              console.log("Deleted property:", data);

              Alert.alert("Success", "Property deleted successfully");
              loadProperties();
            } catch (error) {
              console.error("Error deleting property:", error);
              Alert.alert("Error", "Failed to delete property");
            }
          },
        },
      ],
    );
  };
  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.section}>
        {loadingProperties ? (
          <ActivityIndicator size="small" color={colours.primary} />
        ) : properties.length > 0 ? (
          <>
            {properties.map((property) => (
              <View key={property.id} style={styles.propertyWrapper}>
                <PropertyCard
                  property={property}
                  onPress={() => router.push(`/properties/${property.id}`)}
                  imageUrl={coverMap[property.id]}
                />
                <View style={styles.propertyActions}>
                  <TouchableOpacity
                    style={styles.propertyActionButton}
                    onPress={() =>
                      router.push(`/manage-unavailable-dates/${property.id}`)
                    }
                  >
                    <MaterialIcons
                      name="event-busy"
                      size={16}
                      color={colours.primary}
                    />
                    <Text style={styles.actionText}>Unavailable</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.propertyActionButton}
                    onPress={() =>
                      router.push(`/properties/edit-property?id=${property.id}`)
                    }
                  >
                    <MaterialIcons
                      name="edit"
                      size={16}
                      color={colours.primary}
                    />
                    <Text style={styles.actionText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.propertyActionButton}
                    onPress={() => handleDeleteProperty(property.id)}
                  >
                    <MaterialIcons
                      name="delete"
                      size={16}
                      color={colours.danger}
                    />
                    <Text style={[styles.actionText, styles.dangerText]}>
                      Delete
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        ) : (
          <View style={styles.emptyState}>
            <MaterialIcons name="home-work" size={48} color={colours.muted} />
            <Text style={styles.emptyText}>No properties yet</Text>
            <Button
              title="Create Property"
              onPress={() => router.push("/properties/create-property")}
              buttonStyle={styles.createButton}
            />
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default Properties;

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: colours.background,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colours.text,
  },
  propertyWrapper: {
    marginBottom: 24,
    backgroundColor: colours.surface,
    borderRadius: 16,
  },
  propertyActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 16,
  },
  propertyActionButton: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 16,
  },
  actionText: {
    marginLeft: 4,
    color: colours.primary,
  },
  dangerText: {
    color: colours.danger,
  },
  emptyState: {
    alignItems: "center",
    marginTop: 32,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 16,
    color: colours.muted,
  },
  createButton: {
    marginTop: 16,
  },
});
