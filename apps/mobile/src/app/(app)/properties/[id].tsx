import BookingModal from "@/components/properties/BookingModal";
import Button from "@/components/shared/Button";
import { colours, supabase } from "@kiado/shared";
import { useAuthStore } from "@/store/auth-store";
import { CreateBookingData } from "@kiado/shared/types/bookings";
import { Amenity, Property } from "@kiado/shared/types/property";
import { createBooking, fetchBlockedDates } from "@/utils/booking-utils";
import {
  fetchPropertyPhotos,
  parsePropertyLocation,
} from "@/utils/property-utils";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import {
  Stack,
  useLocalSearchParams,
  useNavigation,
  useRouter,
} from "expo-router";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Linking,
  Platform,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { PropertyType } from "@/enums/property-enums";
import { HeaderBackButton } from "@/components/shared/HeaderBackButton";
import { HeaderTitle } from "@/components/shared/HeaderTitle";
import { findConversation } from "@/utils/message-utils";
import { StatusBar } from "expo-status-bar";
import MapView, {
  Marker,
  PROVIDER_GOOGLE,
  PROVIDER_DEFAULT,
} from "react-native-maps";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { showToastMessage } from "@/components/shared/ToastMessage";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function PropertyDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { profile } = useAuthStore();
  const { showActionSheetWithOptions } = useActionSheet();
  const [property, setProperty] = useState<Property | null>(null);
  const [landlord, setLandlord] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [photos, setPhotos] = useState<string[]>([]);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxVisible, setLightboxVisible] = useState(false);
  const [mapOffCentre, setMapOffCentre] = useState(false);
  const mapRef = useRef<MapView>(null);

  const handleBookProperty = () => {
    if (!profile) {
      showToastMessage({
        message: "Please sign in to book a property",
        type: "danger",
      });
      return;
    }
    if (
      property?.rental_type === "holiday" ||
      property?.rental_type === "short_term"
    ) {
      setShowBookingModal(true);
    } else {
      showToastMessage({
        message: "Booking feature coming soon for this rental type!",
        type: "info",
      });
    }
  };

  const handleBookingConfirm = async (
    checkIn: Date,
    checkOut: Date,
    totalPrice: number,
  ) => {
    try {
      if (!property || !profile) {
        showToastMessage({
          message: "Missing booking information",
          type: "danger",
        });
        return;
      }

      setShowBookingModal(false);

      const bookingData: CreateBookingData = {
        property_id: property.id,
        tenant_id: profile.id,
        check_in: checkIn.toISOString(),
        check_out: checkOut.toISOString(),
        total_price: totalPrice,
        status: "pending",
      };

      const booking = await createBooking(bookingData);

      if (!booking) {
        showToastMessage({
          message: "Failed to create booking",
          type: "danger",
        });
        return;
      }

      // Navigate to payment screen
      router.push(`/book-property/payment?bookingId=${booking.id}` as any);
    } catch (error) {
      showToastMessage({
        message: "Failed to create booking",
        type: "danger",
      });
    }
  };

  // Set up header with edit button for property owner
  useLayoutEffect(() => {
    if (property && profile?.id === property.landlord_id) {
      navigation.setOptions({
        headerRight: () => (
          <TouchableOpacity
            onPress={() =>
              router.push(`/properties/edit-property?id=${property.id}`)
            }
            style={{
              paddingHorizontal: 16,
            }}
            accessibilityLabel="Edit Property"
          >
            <MaterialIcons name="edit" size={24} color={colours.primary} />
          </TouchableOpacity>
        ),
      });
    } else {
      navigation.setOptions({
        headerRight: undefined,
      });
    }
  }, [property, profile, navigation]);

  useEffect(() => {
    fetchPropertyDetails();
  }, [id]);

  useEffect(() => {
    if (
      property?.id &&
      (property?.rental_type === "holiday" ||
        property?.rental_type === "short_term")
    ) {
      fetchBlockedDates(property.id).then(setBlockedDates);
    }
  }, [property?.id]);

  const fetchPropertyDetails = async () => {
    try {
      // Fetch property
      const { data: propertyData, error: propertyError } = await supabase
        .from("properties")
        .select("*")
        .eq("id", id)
        .single();

      if (propertyError) throw propertyError;
      setProperty(propertyData);

      // Fetch landlord info
      if (propertyData?.landlord_id) {
        const { data: landlordData, error: landlordError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", propertyData.landlord_id)
          .single();

        if (landlordError) throw landlordError;
        setLandlord(landlordData);
      }
      // Fetch photos
      if (propertyData?.id) {
        const urls = await fetchPropertyPhotos(propertyData.id);

        // If there's a cover image, move it to the front
        if (propertyData.cover_image_url && urls.length > 0) {
          const coverIndex = urls.indexOf(propertyData.cover_image_url);
          if (coverIndex > 0) {
            // Remove cover from its current position and add to front
            const reordered = [
              propertyData.cover_image_url,
              ...urls.filter((url) => url !== propertyData.cover_image_url),
            ];
            setPhotos(reordered);
          } else {
            setPhotos(urls);
          }
        } else {
          setPhotos(urls);
        }

        setActiveImageIndex(0);

        // Fetch property amenities
        const { data: propertyAmenities, error: amenitiesError } =
          await supabase
            .from("property_amenities")
            .select(
              `
              amenity_id,
              amenities (
                id,
                name,
                icon
              )
            `,
            )
            .eq("property_id", propertyData.id);

        if (!amenitiesError && propertyAmenities) {
          const amenitiesList = propertyAmenities
            .map((pa: any) => pa.amenities)
            .filter(Boolean);
          setAmenities(amenitiesList);
        }
      }
    } catch (error) {
      showToastMessage({
        message: "Failed to load property details",
        type: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPriceDisplay = () => {
    if (!property?.price) return { amount: "N/A", period: "" };

    const amount = `£${property.price.toLocaleString()}`;

    switch (property.rental_type) {
      case PropertyType.ShortTerm:
        return { amount, period: "/week" };
      case PropertyType.Holiday:
        return { amount, period: "/night" };
      default:
        return { amount, period: "/month" };
    }
  };

  const getRentalTypeLabel = () => {
    const labels = {
      long_term: { text: "Long Term Rental", icon: "home" },
      short_term: { text: "Short Term Rental", icon: "calendar-today" },
      holiday: { text: "Holiday Rental", icon: "beach-access" },
    };
    return labels[property?.rental_type || PropertyType.LongTerm];
  };

  const handleContactLandlord = async () => {
    if (!landlord) {
      showToastMessage({
        message: "Landlord information not available",
        type: "danger",
      });
      return;
    }
    if (!profile) {
      showToastMessage({
        message: "Please sign in to contact the landlord",
        type: "danger",
      });
      return;
    }
    if (!property) {
      showToastMessage({
        message: "Property information not available",
        type: "danger",
      });
      return;
    }
    if (profile.id === landlord.id) {
      showToastMessage({
        message: "This is your own property",
        type: "info",
      });
      return;
    }

    try {
      const existing = await findConversation(
        property.id,
        landlord.id,
        profile.id,
      );

      if (existing) {
        // Existing conversation — go straight to it
        router.push(
          `/messages/${existing.id}?propertyTitle=${encodeURIComponent(property.title)}` as any,
        );
      } else {
        // No conversation yet — open a blank chat; it will be created on first send
        router.push(
          `/messages/new?propertyId=${property.id}&landlordId=${landlord.id}&tenantId=${profile.id}&propertyTitle=${encodeURIComponent(property.title)}` as any,
        );
      }
    } catch (error) {
      showToastMessage({
        message: "Failed to start conversation",
        type: "danger",
      });
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={["top", "bottom"]}>
        <ActivityIndicator size="large" color={colours.primary} />
      </SafeAreaView>
    );
  }

  if (!property) {
    return (
      <SafeAreaView style={styles.errorContainer} edges={["top", "bottom"]}>
        <MaterialIcons name="error-outline" size={64} color={colours.muted} />
        <Text style={styles.errorText}>Property not found</Text>
        <Button
          title="Go Back"
          onPress={() => router.back()}
          buttonStyle={styles.backButton}
        />
      </SafeAreaView>
    );
  }

  const priceInfo = getPriceDisplay();
  const rentalInfo = getRentalTypeLabel();

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "",
          headerShown: true,
          headerLeft: () => <HeaderBackButton />,
          headerTitle: property
            ? () => <HeaderTitle title={property.title} />
            : () => null,
        }}
      />
      <ScrollView style={styles.scrollView}>
        {/* Images */}
        <View style={styles.imageContainer}>
          {photos.length > 0 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(
                e: NativeSyntheticEvent<NativeScrollEvent>,
              ) => {
                const idx = Math.round(
                  e.nativeEvent.contentOffset.x / SCREEN_WIDTH,
                );
                setActiveImageIndex(idx);
              }}
            >
              {photos.map((url, idx) => (
                <Pressable
                  key={`${url}-${idx}`}
                  onPress={() => {
                    setLightboxIndex(idx);
                    setLightboxVisible(true);
                  }}
                >
                  <Image source={{ uri: url }} style={styles.heroImage} />
                </Pressable>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.imagePlaceholder}>
              <MaterialIcons name="home" size={80} color={colours.muted} />
              <Text style={styles.imagePlaceholderText}>Property Image</Text>
            </View>
          )}
          {photos.length > 1 && (
            <View style={styles.imagePagination}>
              {photos.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.paginationDot,
                    index === activeImageIndex && styles.paginationDotActive,
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Property Info */}
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{property.title}</Text>
              {property.is_available && (
                <View style={styles.availableBadge}>
                  <MaterialIcons
                    name="check-circle"
                    size={16}
                    color="#FFFFFF"
                  />
                  <Text style={styles.availableText}>Available</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.rentalTypeBadge}>
            <MaterialIcons
              name={rentalInfo.icon as any}
              size={16}
              color={colours.primary}
            />
            <Text style={styles.rentalTypeText}>{rentalInfo.text}</Text>
          </View>

          <View style={styles.locationRow}>
            <MaterialIcons
              name="location-on"
              size={20}
              color={colours.textSecondary}
            />
            <Text style={styles.location}>
              {property.address && `${property.address}, `}
              {property.city}
              {property.postcode && ` ${property.postcode}`}
            </Text>
          </View>

          {(() => {
            const coords = parsePropertyLocation(property.location);
            console.log("property.location raw:", property.location);
            console.log("parsed coords:", coords);
            if (!coords) return null;
            const openInMaps = async () => {
              const googleMapsUrl = `comgooglemaps://?q=${coords.latitude},${coords.longitude}`;
              const appleMapsUrl = `maps://?q=${coords.latitude},${coords.longitude}`;

              if (Platform.OS === "ios") {
                const googleInstalled = await Linking.canOpenURL(googleMapsUrl);

                const options = ["Cancel", "Apple Maps"];
                if (googleInstalled) options.push("Google Maps");

                showActionSheetWithOptions(
                  {
                    title: "Open in Maps",
                    options,
                    cancelButtonIndex: 0,
                  },
                  (buttonIndex) => {
                    if (buttonIndex === 1) {
                      void Linking.openURL(appleMapsUrl);
                    } else if (buttonIndex === 2 && googleInstalled) {
                      void Linking.openURL(googleMapsUrl);
                    }
                  },
                );
              } else {
                Linking.openURL(
                  `https://www.google.com/maps/search/?api=1&query=${coords.latitude},${coords.longitude}`,
                );
              }
            };

            const reCentre = () => {
              mapRef.current?.animateToRegion(
                {
                  ...coords,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                },
                300,
              );
              setMapOffCentre(false);
            };
            return (
              <View style={styles.mapContainer}>
                <MapView
                  ref={mapRef}
                  style={styles.map}
                  provider={
                    Platform.OS === "android"
                      ? PROVIDER_GOOGLE
                      : PROVIDER_DEFAULT
                  }
                  region={{
                    ...coords,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                  scrollEnabled={true}
                  zoomEnabled={true}
                  rotateEnabled={false}
                  pitchEnabled={true}
                  onRegionChange={(region) => {
                    const latDiff = Math.abs(region.latitude - coords.latitude);
                    const lngDiff = Math.abs(
                      region.longitude - coords.longitude,
                    );
                    setMapOffCentre(latDiff > 0.003 || lngDiff > 0.003);
                  }}
                >
                  <Marker coordinate={coords} />
                </MapView>
                {mapOffCentre && (
                  <TouchableOpacity
                    style={styles.reCentreButton}
                    onPress={reCentre}
                    activeOpacity={0.8}
                  >
                    <MaterialIcons name="my-location" size={18} color="#fff" />
                    <Text style={styles.reCentreText}>Re-centre</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.mapOverlay}
                  onPress={openInMaps}
                  activeOpacity={0.7}
                >
                  <MaterialIcons
                    name="open-in-new"
                    size={16}
                    color={colours.primary}
                  />
                  <Text style={styles.mapOverlayText}>Open in Maps</Text>
                </TouchableOpacity>
              </View>
            );
          })()}

          <View style={styles.priceRow}>
            <Text style={styles.price}>{priceInfo.amount}</Text>
            <Text style={styles.priceLabel}>{priceInfo.period}</Text>
          </View>

          {/* Features */}
          <View style={styles.featuresContainer}>
            {property.bedrooms !== undefined && (
              <View style={styles.feature}>
                <MaterialIcons name="bed" size={24} color={colours.primary} />
                <Text style={styles.featureText}>
                  {property.bedrooms} Bedrooms
                </Text>
              </View>
            )}
            {property.bathrooms !== undefined && (
              <View style={styles.feature}>
                <MaterialIcons
                  name="bathtub"
                  size={24}
                  color={colours.primary}
                />
                <Text style={styles.featureText}>
                  {property.bathrooms} Bathrooms
                </Text>
              </View>
            )}
            {property.max_guests !== undefined && property.max_guests > 0 && (
              <View style={styles.feature}>
                <MaterialIcons name="group" size={24} color={colours.primary} />
                <Text style={styles.featureText}>
                  {property.max_guests}{" "}
                  {`Guest${property.max_guests > 1 ? "s" : ""}`}
                </Text>
              </View>
            )}
          </View>

          {/* Landlord Info */}
          {landlord && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Landlord</Text>
              <View style={styles.landlordCard}>
                <View style={styles.landlordAvatar}>
                  <MaterialIcons
                    name="person"
                    size={32}
                    color={colours.primary}
                  />
                </View>
                <View style={styles.landlordInfo}>
                  <Text style={styles.landlordName}>
                    {landlord.first_name} {landlord.last_name}
                  </Text>
                  <Text style={styles.landlordRole}>Property Owner</Text>
                </View>
              </View>
            </View>
          )}

          {/* Description */}
          {property.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{property.description}</Text>
            </View>
          )}

          {/* Amenities */}
          {amenities.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Amenities</Text>
              <View style={styles.amenitiesGrid}>
                {amenities.map((amenity) => (
                  <View key={amenity.id} style={styles.amenityItem}>
                    <MaterialIcons
                      name={amenity.icon as any}
                      size={18}
                      color={colours.primary}
                    />
                    <Text style={styles.amenityText} numberOfLines={1}>
                      {amenity.name}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Fixed Bottom Bar - Only for tenants */}
      {profile?.id !== property.landlord_id && (
        <SafeAreaView
          edges={[]}
          style={[
            styles.bottomBarSafeArea,
            { paddingBottom: Math.min(insets.bottom, 0) },
          ]}
        >
          <View style={styles.bottomBar}>
            <Button
              title={
                property.rental_type === PropertyType.Holiday ||
                property.rental_type === PropertyType.ShortTerm
                  ? "Ask a question"
                  : "Contact Landlord"
              }
              onPress={handleContactLandlord}
              type="outline"
              buttonStyle={styles.contactButton}
            />
            {(property.rental_type === PropertyType.Holiday ||
              property.rental_type === PropertyType.ShortTerm) && (
              <Button
                title="Book Now"
                onPress={handleBookProperty}
                buttonStyle={styles.bookButton}
                disabled={!property.is_available}
              />
            )}
          </View>
        </SafeAreaView>
      )}

      {property && (
        <BookingModal
          visible={showBookingModal}
          property={property}
          blockedDates={blockedDates}
          onClose={() => setShowBookingModal(false)}
          onConfirm={handleBookingConfirm}
        />
      )}

      <Modal
        visible={lightboxVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLightboxVisible(false)}
        statusBarTranslucent
      >
        <StatusBar hidden />
        <View style={styles.lightboxContainer}>
          <Pressable
            style={styles.lightboxClose}
            onPress={() => setLightboxVisible(false)}
          >
            <MaterialIcons name="close" size={28} color="#fff" />
          </Pressable>

          <FlatList
            data={photos}
            horizontal
            pagingEnabled
            initialScrollIndex={lightboxIndex}
            getItemLayout={(_, index) => ({
              length: SCREEN_WIDTH,
              offset: SCREEN_WIDTH * index,
              index,
            })}
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(
                e.nativeEvent.contentOffset.x / SCREEN_WIDTH,
              );
              setLightboxIndex(idx);
            }}
            keyExtractor={(url, idx) => `${url}-${idx}`}
            renderItem={({ item }) => (
              <ScrollView
                style={{ width: SCREEN_WIDTH }}
                contentContainerStyle={styles.lightboxImageContainer}
                maximumZoomScale={4}
                minimumZoomScale={1}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                centerContent
              >
                <Image
                  source={{ uri: item }}
                  style={styles.lightboxImage}
                  resizeMode="contain"
                />
              </ScrollView>
            )}
          />

          <Text style={styles.lightboxCounter}>
            {lightboxIndex + 1} / {photos.length}
          </Text>
        </View>
      </Modal>
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
    backgroundColor: colours.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colours.background,
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: "600",
    color: colours.text,
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    minWidth: 150,
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    width: "100%",
    height: 300,
    position: "relative",
  },
  heroImage: {
    width: SCREEN_WIDTH,
    height: 300,
    backgroundColor: colours.background,
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: colours.background,
    alignItems: "center",
    justifyContent: "center",
  },
  imagePlaceholderText: {
    marginTop: 8,
    fontSize: 14,
    color: colours.muted,
  },
  imagePagination: {
    position: "absolute",
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colours.surface,
    opacity: 0.5,
  },
  paginationDotActive: {
    backgroundColor: colours.primary,
    opacity: 1,
    width: 24,
  },
  content: {
    padding: 20,
  },
  titleRow: {
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colours.text,
    flex: 1,
  },
  availableBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colours.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  availableText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  rentalTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colours.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  rentalTypeText: {
    fontSize: 13,
    fontWeight: "600",
    color: colours.primary,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 4,
  },
  location: {
    fontSize: 16,
    color: colours.textSecondary,
    flex: 1,
  },
  mapContainer: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colours.border,
    position: "relative",
  },
  map: {
    width: "100%",
    height: 180,
  },
  mapOverlay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    backgroundColor: colours.surface,
    borderTopWidth: 1,
    borderTopColor: colours.border,
  },
  mapOverlayText: {
    fontSize: 13,
    fontWeight: "600",
    color: colours.primary,
  },
  reCentreButton: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colours.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  reCentreText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },

  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 20,
  },
  price: {
    fontSize: 32,
    fontWeight: "700",
    color: colours.primary,
  },
  priceLabel: {
    fontSize: 18,
    color: colours.textSecondary,
    marginLeft: 4,
  },
  availabilityToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colours.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colours.border,
  },
  availabilityInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  availabilityTextContainer: {
    flex: 1,
  },
  availabilityTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colours.text,
    marginBottom: 2,
  },
  availabilitySubtext: {
    fontSize: 13,
    color: colours.textSecondary,
  },
  featuresContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 24,
  },
  feature: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colours.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    fontWeight: "600",
    color: colours.primary,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  selectCoverButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colours.primary,
  },
  selectCoverText: {
    fontSize: 14,
    fontWeight: "600",
    color: colours.primary,
  },
  coverHint: {
    fontSize: 12,
    color: colours.textSecondary,
    marginBottom: 12,
    fontStyle: "italic",
  },
  managePhotosRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  addTile: {
    width: 96,
    height: 96,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colours.primary,
    backgroundColor: colours.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  addTileText: {
    marginTop: 6,
    fontSize: 12,
    color: colours.primary,
    fontWeight: "600",
  },
  photoTileWrapper: {
    position: "relative",
    borderRadius: 12,
    overflow: "hidden",
  },
  coverPhotoWrapper: {
    borderWidth: 3,
    borderColor: colours.primary,
  },
  miniThumb: {
    width: 96,
    height: 96,
    borderRadius: 12,
    backgroundColor: colours.surface,
  },
  coverBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colours.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  coverBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  selectOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  photoHint: {
    marginTop: 8,
    fontSize: 12,
    color: colours.textSecondary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colours.text,
    marginBottom: 12,
  },
  landlordCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colours.surface,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  landlordAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colours.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  landlordInfo: {
    flex: 1,
  },
  landlordName: {
    fontSize: 16,
    fontWeight: "600",
    color: colours.text,
    marginBottom: 2,
  },
  landlordRole: {
    fontSize: 14,
    color: colours.textSecondary,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: colours.text,
  },
  amenitiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  amenityItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colours.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  amenityText: {
    fontSize: 13,
    fontWeight: "500",
    color: colours.text,
  },
  bottomBarSafeArea: {
    backgroundColor: colours.surface,
    borderTopWidth: 1,
    borderTopColor: colours.border,
  },
  bottomBar: {
    flexDirection: "row",
    padding: 10,
    gap: 12,
    shadowColor: colours.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  contactButton: {
    flex: 1,
  },
  bookButton: {
    flex: 1,
    backgroundColor: colours.primary,
  },
  // Slideshow
  lightboxContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  lightboxClose: {
    position: "absolute",
    top: 52,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  lightboxCounter: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
    paddingVertical: 16,
  },
  lightboxImageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  lightboxImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 1.2,
  },
});
