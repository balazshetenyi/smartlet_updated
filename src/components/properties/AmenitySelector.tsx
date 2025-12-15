import { supabase } from "@/lib/supabase";
import { colours } from "@/styles/colours";
import { Amenity } from "@/types/property";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type AmenitySelectorProps = {
  selectedAmenities: string[];
  onChange: (amenities: string[]) => void;
  error?: string;
};

export default function AmenitySelector({
  selectedAmenities,
  onChange,
  error,
}: AmenitySelectorProps) {
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAmenities();
  }, []);

  const fetchAmenities = async () => {
    try {
      const { data, error } = await supabase
        .from("amenities")
        .select("*")
        .order("name");

      if (error) throw error;
      setAmenities(data || []);
    } catch (error) {
      console.error("Error fetching amenities:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAmenity = (amenityId: string) => {
    if (selectedAmenities.includes(amenityId)) {
      onChange(selectedAmenities.filter((id) => id !== amenityId));
    } else {
      onChange([...selectedAmenities, amenityId]);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.label}>Amenities</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colours.primary} />
          <Text style={styles.loadingText}>Loading amenities...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Amenities</Text>
      <Text style={styles.hint}>Select all amenities that apply</Text>

      <ScrollView
        horizontal={false}
        contentContainerStyle={styles.amenitiesGrid}
        showsVerticalScrollIndicator={false}
      >
        {amenities.map((amenity) => {
          const isSelected = selectedAmenities.includes(amenity.id);

          return (
            <Pressable
              key={amenity.id}
              onPress={() => toggleAmenity(amenity.id)}
              style={({ pressed }) => [
                styles.amenityCard,
                isSelected && styles.amenityCardSelected,
                pressed && styles.amenityCardPressed,
              ]}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isSelected }}
              accessibilityLabel={amenity.name}
            >
              <View style={styles.amenityIconWrapper}>
                <MaterialIcons
                  name={amenity.icon as any}
                  size={24}
                  color={isSelected ? colours.primary : colours.textSecondary}
                />
              </View>
              <Text
                style={[
                  styles.amenityName,
                  isSelected && styles.amenityNameSelected,
                ]}
                numberOfLines={2}
              >
                {amenity.name}
              </Text>
              {isSelected && (
                <View style={styles.checkmark}>
                  <MaterialIcons
                    name="check-circle"
                    size={20}
                    color={colours.primary}
                  />
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: colours.textSecondary,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: colours.text,
    marginBottom: 4,
  },
  hint: {
    fontSize: 12,
    color: colours.textSecondary,
    marginBottom: 12,
  },
  amenitiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingVertical: 4,
  },
  amenityCard: {
    width: "31%", // 3 columns with gaps
    minWidth: 100,
    aspectRatio: 1,
    backgroundColor: colours.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colours.border,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  amenityCardSelected: {
    backgroundColor: colours.primaryLight,
    borderColor: colours.primary,
  },
  amenityCardPressed: {
    opacity: 0.7,
  },
  amenityIconWrapper: {
    marginBottom: 8,
  },
  amenityName: {
    fontSize: 12,
    fontWeight: "500",
    color: colours.textSecondary,
    textAlign: "center",
  },
  amenityNameSelected: {
    color: colours.primary,
    fontWeight: "600",
  },
  checkmark: {
    position: "absolute",
    top: 6,
    right: 6,
  },
  errorText: {
    fontSize: 12,
    color: colours.danger,
    marginTop: 4,
  },
});
