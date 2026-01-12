import Button from "@/components/shared/Button";
import { useAuthStore } from "@/store/auth-store";
import { colours } from "@/styles/colours";
import {
  BookingWithTenant,
  fetchBookingRequests,
  updateBookingStatus,
} from "@/utils/booking-utils";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Stack, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function BookingRequestsScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
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
    Alert.alert(
      "Confirm Booking",
      "Are you sure you want to confirm this booking?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            const success = await updateBookingStatus(bookingId, {
              status: "confirmed",
            });
            if (success) {
              Alert.alert("Success", "Booking confirmed successfully");
              loadBookingRequests();
            } else {
              Alert.alert("Error", "Failed to confirm booking");
            }
          },
        },
      ]
    );
  };

  const handleDeclineBooking = (bookingId: string) => {
    Alert.alert(
      "Decline Booking",
      "Are you sure you want to decline this booking request?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Decline",
          style: "destructive",
          onPress: async () => {
            const success = await updateBookingStatus(bookingId, "cancelled");
            if (success) {
              Alert.alert("Success", "Booking declined");
              loadBookingRequests();
            } else {
              Alert.alert("Error", "Failed to decline booking");
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return colours.success;
      case "pending":
        return colours.warning;
      case "cancelled":
        return colours.danger;
      case "completed":
        return colours.muted;
      default:
        return colours.textSecondary;
    }
  };

  const renderBookingCard = ({ item }: { item: Booking }) => {
    const checkInDate = new Date(item.check_in);
    const checkOutDate = new Date(item.check_out);
    const nights = Math.ceil(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    return (
      <View style={styles.bookingCard}>
        {item.property?.cover_image_url && (
          <Image
            source={{ uri: item.property.cover_image_url }}
            style={styles.propertyImage}
          />
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

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              {nights} {nights === 1 ? "night" : "nights"}
            </Text>
            <Text style={styles.totalPrice}>
              £{item.total_price.toLocaleString()}
            </Text>
          </View>

          {item.status === "pending" && (
            <View style={styles.actionsContainer}>
              <Button
                title="Decline"
                onPress={() => handleDeclineBooking(item.id)}
                variant="outline"
                buttonStyle={[styles.actionButton, styles.declineButton]}
              />
              <Button
                title="Confirm Booking"
                onPress={() => handleConfirmBooking(item.id)}
                buttonStyle={styles.actionButton}
              />
            </View>
          )}
        </View>
      </View>
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
  bookingCard: {
    backgroundColor: colours.surface,
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  propertyImage: {
    width: "100%",
    height: 150,
    backgroundColor: colours.border,
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
  guestInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
    padding: 12,
    backgroundColor: colours.backgroundDark,
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
    backgroundColor: colours.backgroundDark,
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
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: colours.border,
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 14,
    color: colours.textSecondary,
  },
  totalPrice: {
    fontSize: 24,
    fontWeight: "700",
    color: colours.primary,
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
