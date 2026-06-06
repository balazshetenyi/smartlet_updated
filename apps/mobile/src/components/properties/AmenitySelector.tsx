import { supabase } from "@kiado/shared";
import { Amenity } from "@kiado/shared/types/property";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTheme, type AppTheme } from "@/hooks/useTheme";

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
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
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
          <ActivityIndicator size="small" color={theme.primary} />
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
              style={[
                styles.amenityCard,
                isSelected && styles.amenityCardSelected,
              ]}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isSelected }}
              accessibilityLabel={amenity.name}
            >
              <MaterialIcons
                name={amenity.icon as any}
                size={24}
                color={isSelected ? theme.primary : theme.textSecondary}
              />
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
                    color={theme.primary}
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

function createStyles(t: AppTheme) {
  return StyleSheet.create({
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
      color: t.textSecondary,
    },
    label: {
      fontSize: 16,
      fontWeight: "600",
      color: t.text,
      marginBottom: 4,
    },
    hint: {
      fontSize: 12,
      color: t.textSecondary,
      marginBottom: 12,
    },
    amenitiesGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
      // paddingVertical: 4,
    },
    amenityCard: {
      width: "45%",
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: t.surface,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: t.border,
      padding: 12,
      justifyContent: "center",
    },
    amenityCardSelected: {
      backgroundColor: t.primaryLight,
      borderColor: t.primary,
    },
    amenityName: {
      fontSize: 12,
      fontWeight: "500",
      color: t.textSecondary,
      textAlign: "center",
    },
    amenityNameSelected: {
      color: t.primary,
      fontWeight: "600",
    },
    checkmark: {
      display: "none",
    },
    errorText: {
      fontSize: 12,
      color: t.danger,
      marginTop: 4,
    },
  });
}
