import Button from "@/components/shared/Button";
import { useAuthStore } from "@/store/auth-store";
import { colours, supabase } from "@kiado/shared";
import { BookingWithTenant } from "@kiado/shared/types/bookings";
import { fetchBookingRequests } from "@/utils/booking-utils";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Stack } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card } from "@/components/shared/Card";
import { PropertyImage } from "@/components/properties/PropertyImage";
import { useActionSheet } from "@expo/react-native-action-sheet";

export default function BookingRequestsScreen() {
  const { profile } = useAuthStore();
  const { showActionSheetWithOptions } = useActionSheet();
  const [bookings, setBookings] = useState<BookingWithTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadBookingRequests();
  }, [profile?.id]);

  const loadBookingRequests = async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);
      const data = await fetchBookingRequests(profile.id);
      setBookings(data);
    } catch (error) {
      console.error("Error loading booking requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadBookingRequests();
    setRefreshing(false);
  }, [profile?.id]);

  const handleConfirmBooking = (bookingId: string) => {
    showActionSheetWithOptions(
      {
        title: "Confirm Booking",
        message:
          "Are you sure you want to confirm this booking? This will charge the tenant's payment method.",
        options: ["Cancel", "Confirm"],
        cancelButtonIndex: 0,
      },
      async (buttonIndex) => {
        if (buttonIndex !== 1) return;
        try {
          const { error } = await supabase.functions.invoke(
            "confirm-booking-manual",
            { body: { bookingId } },
          );
          if (error) throw error;
          Alert.alert("Success", "Booking confirmed and payment processed");
          loadBookingRequests();
        } catch (error) {
          console.error("Error confirming booking:", error);
          Alert.alert("Failed to confirm booking");
        }
      },
    );
  };

  const handleDeclineBooking = (bookingId: string) => {
    showActionSheetWithOptions(
      {
        title: "Decline Booking",
        message: "Are you sure you want to decline this booking request?",
        options: ["Keep Request", "Decline"],
        cancelButtonIndex: 0,
        destructiveButtonIndex: 1,
      },
      async (buttonIndex) => {
        if (buttonIndex !== 1) return;
        try {
          const { error } = await supabase.functions.invoke("decline-booking", {
            body: { bookingId },
          });
          if (error) throw error;
          Alert.alert("Success", "Booking declined");
          loadBookingRequests();
        } catch (error) {
          console.error("Error declining booking:", error);
          Alert.alert("Failed to decline booking");
        }
      },
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return colours.success;
      case "pending":
        return colours.warning;
      case "declined":
      case "cancelled":
        return colours.danger;
      case "completed":
        return colours.muted;
      default:
        return colours.textSecondary;
    }
  };

  const renderBookingCard = ({ item }: { item: BookingWithTenant }) => {
    const checkInDate = new Date(item.check_in);
    const checkOutDate = new Date(item.check_out);
    const nights = Math.ceil(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    const getPaymentStatus = () => {
      if (item.payment_status === "paid") {
        return {
          icon: "check-circle" as const,
          color: colours.success,
          text: "Paid",
        };
      }
      if (item.payment_status === "due") {
        return {
          icon: "schedule" as const,
          color: colours.warning,
          text: "Payment Due",
        };
      }
      return null;
    };

    const paymentStatus = getPaymentStatus();

    return (
      <Card>
        {item.property?.cover_image_url && (
          <PropertyImage uri={item.property.cover_image_url} />
        )}

        <View style={styles.bookingContent}>
          <View style={styles.bookingHeader}>
            <Text style={styles.propertyTitle}>{item.property?.title}</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(item.status) + "20" },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: getStatusColor(item.status) },
                ]}
              >
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Text>
            </View>
          </View>

          <View style={styles.guestInfo}>
            {item.tenant?.avatar_url ? (
              <Image
                source={{ uri: item.tenant.avatar_url }}
                style={styles.guestAvatar}
              />
            ) : (
              <View style={[styles.guestAvatar, styles.guestAvatarPlaceholder]}>
                <MaterialIcons name="person" size={20} color={colours.muted} />
              </View>
            )}
            <View>
              <Text style={styles.guestLabel}>Guest</Text>
              <Text style={styles.guestName}>
                {item.tenant?.first_name} {item.tenant?.last_name}
              </Text>
            </View>
          </View>

          <View style={styles.datesContainer}>
            <View style={styles.dateInfo}>
              <MaterialIcons name="login" size={20} color={colours.primary} />
              <View>
                <Text style={styles.dateLabel}>Check-in</Text>
                <Text style={styles.dateValue}>
                  {checkInDate.toLocaleDateString("en-GB", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                </Text>
              </View>
            </View>

            <View style={styles.dateInfo}>
              <MaterialIcons name="logout" size={20} color={colours.danger} />
              <View>
                <Text style={styles.dateLabel}>Check-out</Text>
                <Text style={styles.dateValue}>
                  {checkOutDate.toLocaleDateString("en-GB", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.pricingSection}>
            <View style={styles.nightsRow}>
              <Text style={styles.summaryLabel}>
                {nights} {nights === 1 ? "night" : "nights"}
              </Text>
              {paymentStatus && (
                <View style={styles.paymentStatusContainer}>
                  <MaterialIcons
                    name={paymentStatus.icon}
                    size={16}
                    color={paymentStatus.color}
                  />
                  <Text
                    style={[
                      styles.paymentStatusText,
                      { color: paymentStatus.color },
                    ]}
                  >
                    {paymentStatus.text}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Booking total</Text>
              <Text style={styles.breakdownValue}>
                £{item.total_price.toFixed(2)}
              </Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Kiado fee (6%)</Text>
              <Text style={styles.breakdownFee}>
                −£{(item.total_price * 0.06).toFixed(2)}
              </Text>
            </View>
            <View style={styles.payoutRow}>
              <Text style={styles.payoutLabel}>Your payout</Text>
              <Text style={styles.payoutValue}>
                £{(item.total_price * 0.94).toFixed(2)}
              </Text>
            </View>
          </View>

          {item.status === "pending" && (
            <View style={styles.actionsContainer}>
              <Button
                title="Decline"
                type="outline"
                onPress={() => handleDeclineBooking(item.id)}
                buttonStyle={[styles.actionButton, styles.declineButton]}
              />
              <Button
                title="Confirm Booking"
                onPress={() => handleConfirmBooking(item.id)}
                buttonStyle={styles.actionButton}
                titleStyle={{ textAlign: "center" }}
              />
            </View>
          )}
        </View>
      </Card>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colours.primary} />
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Booking Requests",
          headerShown: true,
        }}
      />
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        {bookings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="inbox" size={64} color={colours.muted} />
            <Text style={styles.emptyTitle}>No booking requests</Text>
            <Text style={styles.emptyText}>
              Booking requests from tenants will appear here
            </Text>
          </View>
        ) : (
          <FlatList
            data={bookings}
            renderItem={renderBookingCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colours.primary}
              />
            }
          />
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
  listContent: {
    padding: 16,
  },
  bookingContent: {
    padding: 16,
  },
  bookingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  propertyTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: colours.text,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  paymentStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  paymentStatusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  guestInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
  },
  guestAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  guestAvatarPlaceholder: {
    backgroundColor: colours.border,
    justifyContent: "center",
    alignItems: "center",
  },
  guestLabel: {
    fontSize: 12,
    color: colours.textSecondary,
    marginBottom: 2,
  },
  guestName: {
    fontSize: 16,
    fontWeight: "600",
    color: colours.text,
  },
  datesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 12,
  },
  dateInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 8,
  },
  dateLabel: {
    fontSize: 12,
    color: colours.textSecondary,
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colours.text,
  },
  summaryLabel: {
    fontSize: 14,
    color: colours.textSecondary,
  },
  pricingSection: {
    paddingTop: 16,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: colours.border,
    marginBottom: 16,
    gap: 8,
  },
  nightsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  breakdownLabel: {
    fontSize: 14,
    color: colours.textSecondary,
  },
  breakdownValue: {
    fontSize: 14,
    color: colours.text,
  },
  breakdownFee: {
    fontSize: 14,
    color: colours.danger,
  },
  payoutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: colours.border,
  },
  payoutLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: colours.text,
  },
  payoutValue: {
    fontSize: 20,
    fontWeight: "700",
    color: colours.success,
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  declineButton: {
    borderColor: colours.danger,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colours.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colours.textSecondary,
    textAlign: "center",
  },
});
