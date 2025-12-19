import { colours } from "@/styles/colours";
import { Property } from "@/types/property";
import { Link, useRouter } from "expo-router";
import React from "react";
import { Dimensions, ScrollView, StyleSheet, Text, View } from "react-native";
import PropertyCard from "./PropertyCard";

interface PropertyRowProps {
  title: string;
  properties: Property[];
  rentalType: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH * 0.7; // 70% of screen width
const CARD_MARGIN = 12;

const PropertyRow = ({ title, properties, rentalType }: PropertyRowProps) => {
  const router = useRouter();

  const handlePropertyPress = (propertyId: string) => {
    router.push(`/properties/${propertyId}`);
  };

  if (properties.length === 0) return null;

  return (
    <View className="mb-8">
      <View className="flex-row justify-between items-center mb-3">
        <Text style={styles.categoryTitle}>{title}</Text>
        <Link href={`/properties/${rentalType}`}>
          <Text style={styles.viewAllText}>View All →</Text>
        </Link>
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
              imageUrl={property.cover_image_url}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default PropertyRow;

const styles = StyleSheet.create({
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
