import Button from "@/components/shared/Button";
import { showToastMessage } from "@/components/shared/ToastMessage";
import { useTheme, type AppTheme } from "@/hooks/useTheme";
import { supabase } from "@kiado/shared";
import { BookingWithProperty } from "@kiado/shared/types/bookings";
import { usePaymentSheet, useStripe } from "@stripe/stripe-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PaymentScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();
  const { retrieveSetupIntent } = useStripe();
  const { initPaymentSheet, presentPaymentSheet } = usePaymentSheet();

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [sheetReady, setSheetReady] = useState(false);
  const [booking, setBooking] = useState<BookingWithProperty | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  useEffect(() => {
    fetchBookingDetails();
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(
          `*,
            property:properties!inner (
            id,
            title,
            price,
            city,
            cover_image_url,
            landlord_id
            )
        `,
        )
        .eq("id", bookingId)
        .single();

      if (error) throw error;
      if (!data) throw new Error("No booking found");

      setBooking(data);

      const response = await supabase.functions.invoke("create-setup-intent", {
        body: { bookingId: data.id },
      });

      if (response.error) {
        let errorMessage = "Setup intent failed";
        if (response.response) {
          try {
            const responseText = await response.response.text();
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.error || errorMessage;
          } catch (e) {
            console.error("Could not parse error response.");
          }
        }
        throw new Error(errorMessage);
      }

      if (!response.data?.clientSecret) {
        throw new Error("No client secret received");
      }

      const secret = response.data.clientSecret as string;
      setClientSecret(secret);

      // Initialise the PaymentSheet with the SetupIntent client secret.
      // The sheet handles its own UI — no textColor issues.
      const { error: initError } = await initPaymentSheet({
        setupIntentClientSecret: secret,
        merchantDisplayName: "Kiado",
        returnURL: "kiado://stripe-redirect",
        appearance: {
          colors: {
            primary: "#7C6CFF",
          },
        },
      });

      if (!initError) setSheetReady(true);
    } catch (err) {
      showToastMessage({
        message: "Failed to load booking details",
        type: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!clientSecret || !sheetReady) {
      showToastMessage({ message: "Payment not initialized", type: "danger" });
      return;
    }

    try {
      setProcessing(true);

      const { error: sheetError } = await presentPaymentSheet();

      if (sheetError) {
        // User cancelled — sheetError.code === "Canceled" is not a real error
        if (sheetError.code !== "Canceled") {
          showToastMessage({ message: sheetError.message, type: "danger" });
        }
        return;
      }

      // Retrieve the confirmed SetupIntent to extract the saved payment method ID.
      // The client-side response may populate either paymentMethod.id or the
      // deprecated paymentMethodId string — accept either.
      const { setupIntent, error: retrieveError } =
        await retrieveSetupIntent(clientSecret);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const paymentMethodId: string | undefined =
        setupIntent?.paymentMethod?.id ??
        (setupIntent as any)?.paymentMethodId ??
        undefined;

      if (retrieveError || !paymentMethodId) {
        console.error("[payment] retrieveSetupIntent result:", { setupIntent, retrieveError });
        showToastMessage({ message: "Could not confirm card setup", type: "danger" });
        return;
      }

      await supabase
        .from("bookings")
        .update({
          payment_method_id: paymentMethodId,
          payment_status: "pending",
        })
        .eq("id", bookingId);

      // Notify landlord — fire-and-forget so it never blocks the tenant
      supabase.functions
        .invoke("send-booking-email", { body: { bookingId } })
        .catch((e) => console.error("Failed to send booking email:", e));

      showToastMessage({
        message: "Card saved. Payment will be taken 48h before check-in.",
        type: "success",
      });
      router.replace("/my-bookings");
    } catch {
      showToastMessage({ message: "Card setup failed", type: "danger" });
    } finally {
      setProcessing(false);
    }
  };

  const calculateNights = () => {
    if (!booking) return 0;
    const diffTime = Math.abs(
      new Date(booking.check_out).getTime() - new Date(booking.check_in).getTime(),
    );
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centred}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!booking || !booking.property) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centred}>
          <Text style={styles.errorText}>Booking not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>Complete Your Booking</Text>

          {/* Booking Summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.propertyTitle}>{booking.property.title}</Text>
            <Text style={styles.propertyLocation}>{booking.property.city}</Text>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Check-in</Text>
              <Text style={styles.summaryValue}>
                {new Date(booking.check_in).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Check-out</Text>
              <Text style={styles.summaryValue}>
                {new Date(booking.check_out).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Nights</Text>
              <Text style={styles.summaryValue}>{calculateNights()}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>
                £{booking.total_price.toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Payment notice */}
          <View style={styles.notice}>
            <Text style={styles.noticeText}>
              Your card will be saved securely. Payment is taken automatically
              48 hours before check-in.
            </Text>
          </View>

          <Button
            title={processing ? "Processing…" : "Save Payment Method"}
            onPress={handlePayment}
            loading={processing}
            disabled={processing || !sheetReady}
            buttonStyle={styles.payButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(t: AppTheme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: t.background,
    },
    centred: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    errorText: {
      fontSize: 16,
      color: t.textSecondary,
    },
    scrollContent: {
      flexGrow: 1,
    },
    content: {
      padding: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: "700",
      color: t.text,
      marginBottom: 24,
    },
    summaryCard: {
      backgroundColor: t.surface,
      padding: 20,
      borderWidth: 1,
      borderColor: t.border,
      borderRadius: 16,
      marginBottom: 24,
    },
    propertyTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: t.text,
      marginBottom: 4,
    },
    propertyLocation: {
      fontSize: 14,
      color: t.textSecondary,
      marginBottom: 16,
    },
    summaryRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    summaryLabel: {
      fontSize: 14,
      color: t.textSecondary,
    },
    summaryValue: {
      fontSize: 14,
      fontWeight: "600",
      color: t.text,
    },
    divider: {
      height: 1,
      backgroundColor: t.border,
      marginVertical: 16,
    },
    totalLabel: {
      fontSize: 16,
      fontWeight: "600",
      color: t.text,
    },
    totalValue: {
      fontSize: 20,
      fontWeight: "700",
      color: t.primary,
    },
    notice: {
      backgroundColor: t.primaryLight,
      borderRadius: 12,
      padding: 14,
      marginBottom: 24,
    },
    noticeText: {
      fontSize: 13,
      color: t.primary,
      lineHeight: 18,
    },
    payButton: {
      backgroundColor: t.primary,
    },
  });
}
