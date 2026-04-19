import Button from "@/components/shared/Button";
import { Card } from "@/components/shared/Card";
import { useAuthStore } from "@/store/auth-store";
import { colours, supabase } from "@kiado/shared";
import { BookingWithTenant } from "@kiado/shared/types/bookings";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";
import { showToastMessage } from "@/components/shared/ToastMessage";
import { useRouter } from "expo-router";

const PLATFORM_FEE_RATE = 0.06;

export default function EarningsScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const [bookings, setBookings] = useState<BookingWithTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadEarnings = async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("bookings")
        .select(
          `
          *,
          property:properties!inner (
            id,
            title,
            cover_image_url,
            city
          ),
          tenant:profiles!bookings_tenant_id_fkey (
            id,
            first_name,
            last_name,
            avatar_url
          )
        `,
        )
        .eq("property.landlord_id", profile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBookings((data as BookingWithTenant[]) ?? []);
    } catch (error) {
      console.error("Error loading earnings.");
      showToastMessage({ message: "Failed to load earnings", type: "danger" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEarnings();
  }, [profile?.id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadEarnings();
    setRefreshing(false);
  }, [profile?.id]);

  const summary = useMemo(() => {
    const paidBookings = bookings.filter(
      (b) => b.payment_status === "paid" && b.status !== "cancelled",
    );

    const upcomingPayoutBookings = bookings.filter(
      (b) => b.status === "confirmed" && b.payment_status === "due",
    );

    const pendingRequests = bookings.filter((b) => b.status === "pending");

    const now = new Date();
    const thisMonthBookings = paidBookings.filter((b) => {
      const paidDate = b.paid_at ? new Date(b.paid_at) : new Date(b.updated_at);
      return (
        paidDate.getMonth() === now.getMonth() &&
        paidDate.getFullYear() === now.getFullYear()
      );
    });

    const payoutFor = (amount: number) => amount * (1 - PLATFORM_FEE_RATE);

    return {
      totalEarned: paidBookings.reduce(
        (sum, b) => sum + payoutFor(b.total_price),
        0,
      ),
      upcomingPayouts: upcomingPayoutBookings.reduce(
        (sum, b) => sum + payoutFor(b.total_price),
        0,
      ),
      pendingRequests: pendingRequests.length,
      thisMonth: thisMonthBookings.reduce(
        (sum, b) => sum + payoutFor(b.total_price),
        0,
      ),
    };
  }, [bookings]);

  const getStatusMeta = (booking: BookingWithTenant) => {
    if (booking.status === "pending") {
      return {
        label: "Pending",
        color: colours.warning,
        icon: "schedule" as const,
      };
    }

    if (booking.status === "cancelled") {
      return {
        label: "Cancelled",
        color: colours.danger,
        icon: "cancel" as const,
      };
    }

    if (booking.payment_status === "paid") {
      return {
        label: "Paid",
        color: colours.success,
        icon: "check-circle" as const,
      };
    }

    if (booking.payment_status === "due") {
      return {
        label: "Payment Due",
        color: colours.warning,
        icon: "payments" as const,
      };
    }

    return {
      label: booking.status,
      color: colours.textSecondary,
      icon: "info" as const,
    };
  };

  const openStripeDashboard = async () => {
    if (!profile?.stripe_account_id) {
      showToastMessage({
        message: "Connect Stripe first to manage payouts",
        type: "info",
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke(
        "create-or-connect-stripe-account",
        {
          body: { stripeAccountId: profile.stripe_account_id },
        },
      );

      if (error) throw error;

      if (data?.url) {
        await WebBrowser.openAuthSessionAsync(data.url);
      }
    } catch (error: any) {
      showToastMessage({
        message: "Failed to open Stripe dashboard",
        type: "danger",
      });
    }
  };

  const renderSummaryCard = (
    title: string,
    value: string,
    icon: keyof typeof MaterialIcons.glyphMap,
    color: string,
    onPress?: () => void,
  ) => {
    const content = (
      <>
        <View style={[styles.summaryIcon, { backgroundColor: `${color}20` }]}>
          <MaterialIcons name={icon} size={20} color={color} />
        </View>
        <Text style={styles.summaryTitle}>{title}</Text>
        <Text style={styles.summaryValue}>{value}</Text>
      </>
    );

    if (onPress) {
      return (
        <TouchableOpacity style={styles.summaryCard} onPress={onPress}>
          {content}
        </TouchableOpacity>
      );
    }

    return <View style={styles.summaryCard}>{content}</View>;
  };

  const renderBooking = ({ item }: { item: BookingWithTenant }) => {
    const fee = item.total_price * PLATFORM_FEE_RATE;
    const payout = item.total_price - fee;
    const status = getStatusMeta(item);
    const isPending = item.status === "pending";

    return (
      <TouchableOpacity
        disabled={!isPending}
        onPress={() =>
          router.push(`/booking-requests?bookingId=${item.id}` as any)
        }
      >
        <Card>
          <View style={styles.bookingContent}>
            <View style={styles.bookingHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.propertyTitle}>{item.property?.title}</Text>
                <Text style={styles.guestText}>
                  {item.tenant?.first_name} {item.tenant?.last_name}
                </Text>
              </View>

              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: `${status.color}20` },
                ]}
              >
                <MaterialIcons
                  name={status.icon}
                  size={14}
                  color={status.color}
                />
                <Text style={[styles.statusText, { color: status.color }]}>
                  {status.label}
                </Text>
              </View>
            </View>

            <View style={styles.dateRow}>
              <Text style={styles.dateLabel}>Stay</Text>
              <Text style={styles.dateValue}>
                {new Date(item.check_in).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                })}{" "}
                -{" "}
                {new Date(item.check_out).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                })}
              </Text>
            </View>

            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Booking total</Text>
              <Text style={styles.breakdownValue}>
                £{item.total_price.toFixed(2)}
              </Text>
            </View>

            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Kiado fee (6%)</Text>
              <Text style={styles.feeValue}>−£{fee.toFixed(2)}</Text>
            </View>

            <View style={styles.payoutRow}>
              <Text style={styles.payoutLabel}>Your payout</Text>
              <Text style={styles.payoutValue}>£{payout.toFixed(2)}</Text>
            </View>

            {item.payment_status === "due" && item.payment_due_at && (
              <Text style={styles.metaText}>
                Payment due on{" "}
                {new Date(item.payment_due_at).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </Text>
            )}

            {item.payment_status === "paid" && item.paid_at && (
              <Text style={styles.metaText}>
                Paid on{" "}
                {new Date(item.paid_at).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </Text>
            )}
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={["bottom"]}>
        <ActivityIndicator size="large" color={colours.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        renderItem={renderBooking}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colours.primary}
          />
        }
        ListHeaderComponent={
          <>
            <View style={styles.summaryGrid}>
              {renderSummaryCard(
                "Total earned",
                `£${summary.totalEarned.toFixed(2)}`,
                "savings",
                colours.success,
              )}
              {renderSummaryCard(
                "Upcoming payouts",
                `£${summary.upcomingPayouts.toFixed(2)}`,
                "payments",
                colours.primary,
              )}
              {renderSummaryCard(
                "Pending requests",
                `${summary.pendingRequests}`,
                "schedule",
                colours.warning,
                () => router.push("/booking-requests"),
              )}

              {renderSummaryCard(
                "This month",
                `£${summary.thisMonth.toFixed(2)}`,
                "bar-chart",
                colours.text,
              )}
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent earnings</Text>
              <Text style={styles.sectionSubtitle}>
                Track booking totals, Kiado fees, and your net payout.
              </Text>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="payments" size={64} color={colours.muted} />
            <Text style={styles.emptyTitle}>No earnings yet</Text>
            <Text style={styles.emptyText}>
              Confirmed and paid bookings will appear here.
            </Text>
          </View>
        }
        ListFooterComponent={
          <View style={styles.footer}>
            <Button
              title={
                profile?.stripe_account_id
                  ? "Manage payouts in Stripe"
                  : "Connect Stripe to get paid"
              }
              onPress={openStripeDashboard}
              buttonStyle={styles.footerButton}
            />
          </View>
        }
      />
    </SafeAreaView>
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
    paddingBottom: 32,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  summaryCard: {
    width: "48%",
    backgroundColor: colours.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colours.border,
    padding: 16,
  },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 13,
    color: colours.textSecondary,
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "700",
    color: colours.text,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: colours.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colours.textSecondary,
  },
  bookingContent: {
    padding: 16,
  },
  bookingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
  },
  propertyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colours.text,
    marginBottom: 4,
  },
  guestText: {
    fontSize: 14,
    color: colours.textSecondary,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  dateLabel: {
    fontSize: 14,
    color: colours.textSecondary,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colours.text,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  breakdownLabel: {
    fontSize: 14,
    color: colours.textSecondary,
  },
  breakdownValue: {
    fontSize: 14,
    color: colours.text,
  },
  feeValue: {
    fontSize: 14,
    color: colours.danger,
  },
  payoutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: colours.border,
    paddingTop: 10,
    marginTop: 6,
  },
  payoutLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: colours.text,
  },
  payoutValue: {
    fontSize: 18,
    fontWeight: "700",
    color: colours.success,
  },
  metaText: {
    marginTop: 10,
    fontSize: 13,
    color: colours.textSecondary,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
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
  footer: {
    marginTop: 8,
  },
  footerButton: {
    marginTop: 8,
  },
});
