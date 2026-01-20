import Button from "@/components/shared/Button";
import {supabase} from "@/lib/supabase";
import {useAuthStore} from "@/store/auth-store";
import {colours} from "@/styles/colours";
import {BookingWithProperty} from "@/types/bookings";
import {CardField, useStripe} from "@stripe/stripe-react-native";
import {useLocalSearchParams, useRouter} from "expo-router";
import React, {useEffect, useState} from "react";
import {ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View,} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";

export default function PaymentScreen() {
    const {bookingId} = useLocalSearchParams<{ bookingId: string }>();
    const {profile} = useAuthStore();
    const router = useRouter();
    const {confirmPayment} = useStripe();
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [booking, setBooking] = useState<BookingWithProperty | null>(null);
    const [clientSecret, setClientSecret] = useState<string | null>(null);

    useEffect(() => {
        fetchBookingDetails();
    }, [bookingId]);

    const fetchBookingDetails = async () => {
        try {
            const {data, error} = await supabase
                .from("bookings")
                .select(
                    `
            *,
            property:properties!inner (
            id,
            title,
            price,
            city,
            cover_image_url,
            landlord_id
            )
        `
                )
                .eq("id", bookingId)
                .single();

            if (error) throw error;
            setBooking(data);

            console.log(
                "Functions URL:",
                `${process.env.EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL}/create-payment-intent`
            );

            // Get payment intent from your backend
            const {data: response, error: responseError} = await supabase.functions.invoke('create-payment-intent', {
                body: {
                    bookingId: data.id, // Only send the bookingId
                },
            });
            if (responseError) throw responseError;


            setClientSecret(response.clientSecret);
        } catch (error) {
            console.error("Error fetching booking:", error);
            Alert.alert("Error", "Failed to load booking details");
        } finally {
            setLoading(false);
        }
    };

    const handlePayment = async () => {
        if (!clientSecret) {
            Alert.alert("Error", "Payment not initialized");
            return;
        }

        try {
            setProcessing(true);

            const {error, paymentIntent} = await confirmPayment(clientSecret, {
                paymentMethodType: "Card",
            });

            if (error) {
                Alert.alert("Payment Failed", error.message);
                return;
            }

            if (paymentIntent?.status === "Succeeded") {
                // Update booking status
                await supabase
                    .from("bookings")
                    .update({
                        status: "confirmed",
                    })
                    .eq("id", bookingId);

                Alert.alert(
                    "Success",
                    "Payment successful! Your booking is confirmed.",
                    [
                        {
                            text: "OK",
                            onPress: () => router.replace("/my-bookings"),
                        },
                    ]
                );
            }
        } catch (error) {
            console.error("Payment error:", error);
            Alert.alert("Error", "Payment processing failed");
        } finally {
            setProcessing(false);
        }
    };

    const calculateNights = () => {
        if (!booking) return 0;
        const checkIn = new Date(booking.check_in);
        const checkOut = new Date(booking.check_out);
        const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colours.primary}/>
                </View>
            </SafeAreaView>
        );
    }

    if (!booking || !booking.property) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Text style={styles.errorText}>Booking not found</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={["bottom"]}>
            <ScrollView contentContainerStyle={styles.content}>
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
                    <View style={styles.divider}/>
                    <View style={styles.summaryRow}>
                        <Text style={styles.totalLabel}>Total Amount</Text>
                        <Text style={styles.totalValue}>
                            £{booking.total_price.toLocaleString()}
                        </Text>
                    </View>
                </View>

                {/* Payment Form */}
                <View style={styles.paymentSection}>
                    <Text style={styles.sectionTitle}>Payment Details</Text>
                    <CardField
                        postalCodeEnabled={true}
                        placeholders={{
                            number: "4242 4242 4242 4242",
                        }}
                        cardStyle={styles.card}
                        style={styles.cardField}
                    />
                </View>

                <Button
                    title="Pay Now"
                    onPress={handlePayment}
                    loading={processing}
                    disabled={processing || !clientSecret}
                    buttonStyle={styles.payButton}
                />
            </ScrollView>
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
    },
    errorText: {
        fontSize: 16,
        color: colours.textSecondary,
    },
    content: {
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
        color: colours.text,
        marginBottom: 24,
    },
    summaryCard: {
        backgroundColor: colours.surface,
        padding: 20,
        borderRadius: 16,
        marginBottom: 24,
    },
    propertyTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: colours.text,
        marginBottom: 4,
    },
    propertyLocation: {
        fontSize: 14,
        color: colours.textSecondary,
        marginBottom: 16,
    },
    summaryRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 12,
    },
    summaryLabel: {
        fontSize: 14,
        color: colours.textSecondary,
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: "600",
        color: colours.text,
    },
    divider: {
        height: 1,
        backgroundColor: colours.border,
        marginVertical: 16,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: "600",
        color: colours.text,
    },
    totalValue: {
        fontSize: 20,
        fontWeight: "700",
        color: colours.primary,
    },
    paymentSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: colours.text,
        marginBottom: 16,
    },
    cardField: {
        width: "100%",
        height: 50,
    },
    card: {
        backgroundColor: colours.surface,
    },
    payButton: {
        backgroundColor: colours.primary,
    },
});