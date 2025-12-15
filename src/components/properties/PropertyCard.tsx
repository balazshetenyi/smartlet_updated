import { colours } from "@/styles/colours";
import { Property } from "@/types/property";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface PropertyCardProps {
  property: Property;
  onPress?: () => void;
  imageUrl?: string;
}

export default function PropertyCard({
  property,
  onPress,
  imageUrl,
}: PropertyCardProps) {
  const getPriceDisplay = () => {
    if (!property.price) return "Price not set";

    const formattedPrice = `£${property.price.toLocaleString()}`;

    switch (property.rental_type) {
      case "short_term":
        return `${formattedPrice}/week`;
      case "holiday":
        return `${formattedPrice}/night`;
      default:
        return `${formattedPrice}/month`;
    }
  };

  const getRentalTypeBadge = () => {
    const labels = {
      long_term: { text: "Long Term", icon: "home" },
      short_term: { text: "Short Term", icon: "calendar-today" },
      holiday: { text: "Holiday", icon: "beach-access" },
    };
    return labels[property.rental_type || "long_term"];
  };

  const badge = getRentalTypeBadge();

  return (
    <TouchableOpacity
      style={[styles.card, !property.is_available && styles.cardUnavailable]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Image
        source={
          imageUrl
            ? { uri: imageUrl }
            : require("@/assets/images/partial-react-logo.png")
        }
        style={[
          styles.image,
          !property.is_available && styles.imageUnavailable,
        ]}
        resizeMode="cover"
      />
      {!property.is_available && (
        <View style={styles.unavailableOverlay}>
          <MaterialIcons name="visibility-off" size={32} color="#FFFFFF" />
          <Text style={styles.unavailableText}>Unavailable</Text>
        </View>
      )}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {property.title}
          </Text>
          {property.is_available && (
            <View style={styles.availableBadge}>
              <Text style={styles.availableText}>Available</Text>
            </View>
          )}
        </View>

        {property.rental_type && property.rental_type !== "long_term" && (
          <View style={styles.rentalTypeBadge}>
            <MaterialIcons
              name={badge.icon as any}
              size={12}
              color={colours.primary}
            />
            <Text style={styles.rentalTypeText}>{badge.text}</Text>
          </View>
        )}

        <View style={styles.locationRow}>
          <MaterialIcons
            name="location-on"
            size={16}
            color={colours.textSecondary}
          />
          <Text style={styles.location} numberOfLines={1}>
            {property.city || "Location not specified"}
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.price}>{getPriceDisplay()}</Text>
          <View style={styles.details}>
            {property.bedrooms !== undefined && (
              <View style={styles.detailItem}>
                <MaterialIcons name="bed" size={16} color={colours.muted} />
                <Text style={styles.detailText}>{property.bedrooms}</Text>
              </View>
            )}
            {property.bathrooms !== undefined && (
              <View style={styles.detailItem}>
                <MaterialIcons name="bathtub" size={16} color={colours.muted} />
                <Text style={styles.detailText}>{property.bathrooms}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colours.cardBackground,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: colours.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: 200,
    backgroundColor: colours.background,
  },
  cardUnavailable: {
    opacity: 0.75,
  },
  imageUnavailable: {
    opacity: 0.5,
  },
  unavailableOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 200,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  unavailableText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: colours.text,
    flex: 1,
    marginRight: 8,
  },
  availableBadge: {
    backgroundColor: colours.success,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  availableText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  location: {
    fontSize: 14,
    color: colours.textSecondary,
    marginLeft: 4,
    flex: 1,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rentalTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colours.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  rentalTypeText: {
    fontSize: 11,
    fontWeight: "600",
    color: colours.primary,
  },
  price: {
    fontSize: 20,
    fontWeight: "700",
    color: colours.primary,
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: "400",
    color: colours.textSecondary,
  },
  details: {
    flexDirection: "row",
    gap: 16,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailText: {
    fontSize: 14,
    color: colours.muted,
    fontWeight: "500",
  },
});
