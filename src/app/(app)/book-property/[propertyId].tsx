import Button from "@/components/shared/Button";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/auth-store";
import { colours } from "@/styles/colours";
import { Property } from "@/types/property";
import {
  calculateBookingPrice,
  createBooking,
  fetchBookedDates,
} from "@/utils/booking-utils";
import { fetchPropertyById } from "@/utils/property-utils";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar, DateData } from "react-native-calendars";
import { SafeAreaView } from "react-native-safe-area-context";

export default function BookPropertyScreen() {
  const { propertyId } = useLocalSearchParams();
  const router = useRouter();
  const { profile } = useAuthStore();

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookedDates, setBookedDates] = useState<string[]>([]);
  const [selectedDates, setSelectedDates] = useState<{
    checkIn: string | null;
    checkOut: string | null;
  }>({ checkIn: null, checkOut: null });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPropertyData();
  }, [propertyId]);

  const loadPropertyData = async () => {
    try {
      setLoading(true);
      const propertyData = await fetchPropertyById(propertyId as string);

      if (!propertyData || propertyData.rental_type !== "holiday") {
        Alert.alert(
          "Error",
          "This property is not available for holiday booking"
        );
        router.back();
        return;
      }

      setProperty(propertyData);

      // Fetch booked dates
      const booked = await fetchBookedDates(propertyId as string);
      setBookedDates(booked);
    } catch (error) {
      console.error("Error loading property:", error);
      Alert.alert("Error", "Failed to load property details");
    } finally {
      setLoading(false);
    }
  };

  const handleDayPress = (day: DateData) => {
    const dateString = day.dateString;

    // Check if date is already booked
    if (bookedDates.includes(dateString)) {
      Alert.alert("Unavailable", "This date is already booked");
      return;
    }

    // Check if date is in the past
    if (new Date(dateString) < new Date()) {
      Alert.alert("Invalid Date", "Cannot book dates in the past");
      return;
    }

    if (
      !selectedDates.checkIn ||
      (selectedDates.checkIn && selectedDates.checkOut)
    ) {
      // Start new selection
      setSelectedDates({ checkIn: dateString, checkOut: null });
    } else {
      // Complete selection
      if (new Date(dateString) < new Date(selectedDates.checkIn)) {
        // If selected date is before check-in, make it the new check-in
        setSelectedDates({
          checkIn: dateString,
          checkOut: selectedDates.checkIn,
        });
      } else {
        // Check if any booked dates are in the range
        const hasBlockedDate = checkDateRangeAvailability(
          selectedDates.checkIn,
          dateString
        );

        if (hasBlockedDate) {
          Alert.alert(
            "Unavailable",
            "There are booked dates in this range. Please select different dates."
          );
          return;
        }

        setSelectedDates({ ...selectedDates, checkOut: dateString });
      }
    }
  };

  const checkDateRangeAvailability = (start: string, end: string): boolean => {
    const startDate = new Date(start);
    const endDate = new Date(end);

    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      if (bookedDates.includes(d.toISOString().split("T")[0])) {
        return true;
      }
    }
    return false;
  };

  const getMarkedDates = () => {
    const marked: any = {};

    // Mark booked dates
    bookedDates.forEach((date) => {
      marked[date] = {
        disabled: true,
        disableTouchEvent: true,
        color: colours.danger,
        textColor: "white",
      };
    });

    // Mark selected range
    if (selectedDates.checkIn) {
      marked[selectedDates.checkIn] = {
        startingDay: true,
        color: colours.primary,
        textColor: "white",
      };

      if (selectedDates.checkOut) {
        // Mark all dates in between
        const start = new Date(selectedDates.checkIn);
        const end = new Date(selectedDates.checkOut);

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const dateString = d.toISOString().split("T")[0];

          if (dateString === selectedDates.checkIn) continue;
          if (dateString === selectedDates.checkOut) {
            marked[dateString] = {
              endingDay: true,
              color: colours.primary,
              textColor: "white",
            };
          } else {
            marked[dateString] = {
              color: colours.primaryLight,
              textColor: colours.primary,
            };
          }
        }
      }
    }

    return marked;
  };

  const calculateNights = () => {
    if (!selectedDates.checkIn || !selectedDates.checkOut) return 0;

    const start = new Date(selectedDates.checkIn);
    const end = new Date(selectedDates.checkOut);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getTotalPrice = () => {
    if (!property?.price || !selectedDates.checkIn || !selectedDates.checkOut) {
      return 0;
    }

    return calculateBookingPrice(
      property.price,
      selectedDates.checkIn,
      selectedDates.checkOut
    );
  };

  const handleConfirmBooking = async () => {
    if (
      !profile ||
      !property ||
      !selectedDates.checkIn ||
      !selectedDates.checkOut
    ) {
      Alert.alert("Error", "Please complete all booking details");
      return;
    }

    setSubmitting(true);

    try {
      const totalPrice = getTotalPrice();
      const booking = await createBooking(
        property.id,
        profile.id,
        selectedDates.checkIn,
        selectedDates.checkOut,
        totalPrice
      );

      if (booking) {
        Alert.alert("Success", "Your booking request has been submitted!", [
          {
            text: "OK",
            onPress: () => router.push("/my-bookings"),
          },
        ]);
      } else {
        Alert.alert("Error", "Failed to create booking. Please try again.");
      }
    } catch (error) {
      console.error("Error creating booking:", error);
      Alert.alert("Error", "An error occurred while creating your booking");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colours.primary} />
      </SafeAreaView>
    );
  }

  if (!property) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={64} color={colours.muted} />
        <Text style={styles.errorText}>Property not found</Text>
        <Button title="Go Back" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  const nights = calculateNights();
  const totalPrice = getTotalPrice();

  return (
    <>
      <Stack.Screen
        options={{
          title: "Book Property",
          headerShown: true,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ marginLeft: 8, padding: 4 }}
            >
              <MaterialIcons name="arrow-back" size={24} color={colours.text} />
            </TouchableOpacity>
          ),
        }}
      />
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.content}>
            {/* Property Info */}
            <View style={styles.propertyCard}>
              <Text style={styles.propertyTitle}>{property.title}</Text>
              <View style={styles.propertyDetails}>
                <MaterialIcons
                  name="location-on"
                  size={16}
                  color={colours.textSecondary}
                />
                <Text style={styles.propertyLocation}>{property.city}</Text>
              </View>
              <Text style={styles.pricePerNight}>
                £{property.price?.toLocaleString()}/night
              </Text>
            </View>

            {/* Calendar */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select Dates</Text>
              <Text style={styles.sectionHint}>
                {selectedDates.checkIn && !selectedDates.checkOut
                  ? "Now select check-out date"
                  : "Tap to select check-in date"}
              </Text>

              <Calendar
                markedDates={getMarkedDates()}
                onDayPress={handleDayPress}
                markingType="period"
                minDate={new Date().toISOString().split("T")[0]}
                theme={{
                  selectedDayBackgroundColor: colours.primary,
                  todayTextColor: colours.primary,
                  arrowColor: colours.primary,
                }}
              />
            </View>

            {/* Booking Summary */}
            {selectedDates.checkIn && selectedDates.checkOut && (
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Booking Summary</Text>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Check-in:</Text>
                  <Text style={styles.summaryValue}>
                    {new Date(selectedDates.checkIn).toLocaleDateString(
                      "en-GB",
                      {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }
                    )}
                  </Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Check-out:</Text>
                  <Text style={styles.summaryValue}>
                    {new Date(selectedDates.checkOut).toLocaleDateString(
                      "en-GB",
                      {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }
                    )}
                  </Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>
                    £{property.price} × {nights}{" "}
                    {nights === 1 ? "night" : "nights"}
                  </Text>
                  <Text style={styles.summaryValue}>
                    £{totalPrice.toLocaleString()}
                  </Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.summaryRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>
                    £{totalPrice.toLocaleString()}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Bottom Action Bar */}
        {selectedDates.checkIn && selectedDates.checkOut && (
          <SafeAreaView edges={["bottom"]} style={styles.bottomBar}>
            <View style={styles.bottomBarContent}>
              <View>
                <Text style={styles.bottomBarPrice}>
                  £{totalPrice.toLocaleString()}
                </Text>
                <Text style={styles.bottomBarNights}>
                  {nights} {nights === 1 ? "night" : "nights"}
                </Text>
              </View>
              <Button
                title="Confirm Booking"
                onPress={handleConfirmBooking}
                loading={submitting}
                buttonStyle={styles.confirmButton}
              />
            </View>
          </SafeAreaView>
        )}
      </SafeAreaView>
    </>
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
    padding: 20,
    backgroundColor: colours.background,
  },
  errorText: {
    fontSize: 18,
    fontWeight: "600",
    color: colours.text,
    marginTop: 16,
    marginBottom: 24,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  propertyCard: {
    backgroundColor: colours.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  propertyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colours.text,
    marginBottom: 8,
  },
  propertyDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 12,
  },
  propertyLocation: {
    fontSize: 14,
    color: colours.textSecondary,
  },
  pricePerNight: {
    fontSize: 18,
    fontWeight: "600",
    color: colours.primary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colours.text,
    marginBottom: 4,
  },
  sectionHint: {
    fontSize: 14,
    color: colours.textSecondary,
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: colours.surface,
    padding: 20,
    borderRadius: 12,
    marginBottom: 100, // Space for bottom bar
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colours.text,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: colours.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "500",
    color: colours.text,
  },
  divider: {
    height: 1,
    backgroundColor: colours.border,
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: colours.text,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: "700",
    color: colours.primary,
  },
  bottomBar: {
    backgroundColor: colours.surface,
    borderTopWidth: 1,
    borderTopColor: colours.border,
  },
  bottomBarContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  bottomBarPrice: {
    fontSize: 20,
    fontWeight: "700",
    color: colours.text,
  },
  bottomBarNights: {
    fontSize: 12,
    color: colours.textSecondary,
  },
  confirmButton: {
    minWidth: 150,
  },
});
