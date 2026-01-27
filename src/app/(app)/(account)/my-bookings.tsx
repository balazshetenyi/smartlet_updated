import Button from "@/components/shared/Button";
import {useAuthStore} from "@/store/auth-store";
import {colours} from "@/styles/colours";
import {BookingWithProperty} from "@/types/bookings";
import {cancelBooking, fetchMyBookings, updateBookingStatus,} from "@/utils/booking-utils";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import {Stack, useRouter} from "expo-router";
import React, {useCallback, useEffect, useState} from "react";
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
import {SafeAreaView} from "react-native-safe-area-context";

export default function MyBookingsScreen() {
    const router = useRouter();
    const {profile} = useAuthStore();
    const [bookings, setBookings] = useState<BookingWithProperty[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");

    // Filter bookings by tab
    const upcomingBookings = bookings.filter(
        (b) => b.status === "pending" || b.status === "confirmed"
    );
    const pastBookings = bookings.filter(
        (b) => b.status === "cancelled" || b.status === "completed"
    );

    useEffect(() => {
        loadBookings();
    }, [profile?.id]);

    const loadBookings = async () => {
        if (!profile?.id) return;

        try {
            setLoading(true);
            const data = await fetchMyBookings(profile.id);
            setBookings(data);
        } catch (error) {
            console.error("Error loading bookings:", error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadBookings();
        setRefreshing(false);
    }, [profile?.id]);

    const getCancellationPolicyText = () =>
        [
            "Cancellation Policy:",
            "• Before check-in −48h: 100% refund of base price",
            "• Within 48h of check-in: 50% refund of base price",
            "• Service fee is never refunded",
        ].join("\n");

    const handleCancelBooking = (booking: BookingWithProperty) => {
        const checkInDate = new Date(booking.check_in);
        const now = new Date();

        if (now >= checkInDate) {
            Alert.alert(
                "Cancellation Closed",
                "This booking can’t be cancelled after check-in."
            );
            return;
        }

        const isPaidOrConfirmed =
            booking.status === "confirmed" ||
            booking.payment_status === "due" ||
            booking.payment_status === "paid";

        const title = isPaidOrConfirmed ? "Cancel Booking" : "Cancel Request";
        const message = isPaidOrConfirmed
            ? "Are you sure you want to cancel? Refunds follow the cancellation policy."
            : "Are you sure you want to cancel this booking request?";

        Alert.alert(title, message, [
            {text: "View Policy", onPress: () => Alert.alert("Cancellation Policy", getCancellationPolicyText())},
            {text: "No", style: "cancel"},
            {
                text: "Yes, Cancel",
                style: "destructive",
                onPress: async () => {
                    if (isPaidOrConfirmed) {
                        const result = await cancelBooking(booking.id);
                        if (result.ok) {
                            Alert.alert(
                                "Cancelled",
                                result.refundAmount !== undefined
                                    ? `Refund issued: £${result.refundAmount.toLocaleString()}`
                                    : "Booking cancelled successfully"
                            );
                            await loadBookings();
                        } else {
                            Alert.alert("Error", result.error ?? "Failed to cancel booking");
                        }
                    } else {
                        const success = await updateBookingStatus(booking.id, {
                            status: "cancelled",
                        });
                        if (success) {
                            Alert.alert("Success", "Booking cancelled successfully");
                            await loadBookings();
                        } else {
                            Alert.alert("Error", "Failed to cancel booking");
                        }
                    }
                },
            },
        ]);
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

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "confirmed":
                return "check-circle";
            case "pending":
                return "schedule";
            case "cancelled":
                return "cancel";
            case "completed":
                return "done-all";
            default:
                return "info";
        }
    };

    const renderBookingCard = ({item}: { item: BookingWithProperty }) => {
        const checkInDate = new Date(item.check_in);
        const checkOutDate = new Date(item.check_out);
        const nights = Math.ceil(
            (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        return (
            <TouchableOpacity
                style={styles.bookingCard}
                onPress={() => router.push(`/properties/${item.property_id}` as any)}
            >
                {item.property.cover_image_url && (
                    <Image
                        source={{uri: item.property.cover_image_url}}
                        style={styles.propertyImage}
                    />
                )}

                <View style={styles.bookingContent}>
                    <View style={styles.bookingHeader}>
                        <View style={styles.bookingTitleContainer}>
                            <Text style={styles.propertyTitle} numberOfLines={1}>
                                {item.property.title}
                            </Text>
                            <View style={styles.locationRow}>
                                <MaterialIcons
                                    name="location-on"
                                    size={14}
                                    color={colours.textSecondary}
                                />
                                <Text style={styles.locationText}>{item.property.city}</Text>
                            </View>
                        </View>

                        <View
                            style={[
                                styles.statusBadge,
                                {backgroundColor: getStatusColor(item.status) + "20"},
                            ]}
                        >
                            <MaterialIcons
                                name={getStatusIcon(item.status) as any}
                                size={14}
                                color={getStatusColor(item.status)}
                            />
                            <Text
                                style={[
                                    styles.statusText,
                                    {color: getStatusColor(item.status)},
                                ]}
                            >
                                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.datesContainer}>
                        <View style={styles.dateColumn}>
                            <Text style={styles.dateLabel}>Check-in</Text>
                            <Text style={styles.dateValue}>
                                {checkInDate.toLocaleDateString("en-GB", {
                                    day: "numeric",
                                    month: "short",
                                })}
                            </Text>
                        </View>

                        <View style={styles.nightsIndicator}>
                            <MaterialIcons name="hotel" size={16} color={colours.muted}/>
                            <Text style={styles.nightsText}>
                                {nights} {nights === 1 ? "night" : "nights"}
                            </Text>
                        </View>

                        <View style={styles.dateColumn}>
                            <Text style={styles.dateLabel}>Check-out</Text>
                            <Text style={styles.dateValue}>
                                {checkOutDate.toLocaleDateString("en-GB", {
                                    day: "numeric",
                                    month: "short",
                                })}
                            </Text>
                        </View>
                    </View>

                    {/* Payment due date */}
                    {item.payment_status && (
                        <View style={styles.paymentStatusContainer}>
                            <View style={styles.paymentStatusRow}>
                                <MaterialIcons
                                    name={
                                        item.payment_status === "paid"
                                            ? "check-circle"
                                            : item.payment_status === "due"
                                                ? "schedule"
                                                : "pending"
                                    }
                                    size={16}
                                    color={
                                        item.payment_status === "paid"
                                            ? colours.success
                                            : item.payment_status === "due"
                                                ? colours.warning
                                                : colours.textSecondary
                                    }
                                />
                                <Text style={styles.paymentStatusLabel}>
                                    {item.payment_status === "paid"
                                        ? "Payment confirmed"
                                        : item.payment_status === "due"
                                            ? "Payment due"
                                            : "Payment pending"}
                                </Text>
                            </View>
                            {item.payment_status === "due" && item.payment_due_at && (
                                <Text style={styles.paymentDueText}>
                                    {new Date(item.payment_due_at).toLocaleDateString("en-GB", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                    })}
                                </Text>
                            )}
                        </View>
                    )}

                    <View style={styles.bookingFooter}>
                        <View style={styles.landlordInfo}>
                            {item.property.landlord?.avatar_url ? (
                                <Image
                                    source={{uri: item.property.landlord.avatar_url}}
                                    style={styles.landlordAvatar}
                                />
                            ) : (
                                <View
                                    style={[
                                        styles.landlordAvatar,
                                        styles.landlordAvatarPlaceholder,
                                    ]}
                                >
                                    <MaterialIcons
                                        name="person"
                                        size={16}
                                        color={colours.muted}
                                    />
                                </View>
                            )}
                            <Text style={styles.landlordName}>
                                {item.property.landlord?.first_name} {item.property.landlord?.last_name}
                            </Text>
                        </View>

                        <View style={styles.priceContainer}>
                            <Text style={styles.priceLabel}>Total</Text>
                            <Text style={styles.priceValue}>
                                £{item.total_price.toLocaleString()}
                            </Text>
                        </View>
                    </View>

                    {item.status === "pending" && (
                        <View style={styles.actionsContainer}>
                            <Button
                                title="Cancel Request"
                                onPress={() => handleCancelBooking(item)}
                                type="outline"
                                buttonStyle={styles.cancelButton}
                            />
                        </View>
                    )}

                    {item.status === "confirmed" && (
                        <View style={styles.actionsContainer}>
                            <Button
                                title="Cancel Booking"
                                onPress={() => handleCancelBooking(item)}
                                type="outline"
                                buttonStyle={styles.cancelButton}
                            />
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colours.primary}/>
            </SafeAreaView>
        );
    }

    return (
        <>
            <Stack.Screen
                options={{
                    title: "My Bookings",
                    headerShown: true,
                }}
            />
            <SafeAreaView style={styles.container} edges={["bottom"]}>
                {bookings.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <MaterialIcons name="event-busy" size={64} color={colours.muted}/>
                        <Text style={styles.emptyTitle}>No bookings yet</Text>
                        <Text style={styles.emptyText}>
                            Your holiday rental bookings will appear here
                        </Text>
                        <Button
                            title="Browse Properties"
                            onPress={() => router.push("/(app)")}
                            buttonStyle={styles.browseButton}
                        />
                    </View>
                ) : (
                    <>
                        <View style={styles.tabContainer}>
                            <TouchableOpacity
                                style={[styles.tab, activeTab === "upcoming" && styles.activeTab]}
                                onPress={() => setActiveTab("upcoming")}
                            >
                                <Text
                                    style={[
                                        styles.tabText,
                                        activeTab === "upcoming" && styles.activeTabText,
                                    ]}
                                >
                                    Upcoming ({upcomingBookings.length})
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.tab, activeTab === "past" && styles.activeTab]}
                                onPress={() => setActiveTab("past")}
                            >
                                <Text
                                    style={[styles.tabText, activeTab === "past" && styles.activeTabText]}
                                >
                                    Past ({pastBookings.length})
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={activeTab === "upcoming" ? upcomingBookings : pastBookings}
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
                            ListEmptyComponent={
                                <View style={styles.emptyTabContainer}>
                                    <MaterialIcons
                                        name={activeTab === "upcoming" ? "event-available" : "history"}
                                        size={48}
                                        color={colours.muted}
                                    />
                                    <Text style={styles.emptyTabText}>
                                        {activeTab === "upcoming"
                                            ? "No upcoming bookings"
                                            : "No past bookings"}
                                    </Text>
                                </View>
                            }
                        />
                    </>
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
        borderColor: colours.border,
        borderWidth: 1,
        marginBottom: 16,
        overflow: "hidden",
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    propertyImage: {
        width: "100%",
        height: 180,
        backgroundColor: colours.border,
    },
    bookingContent: {
        padding: 16,
    },
    bookingHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 16,
    },
    bookingTitleContainer: {
        flex: 1,
        marginRight: 12,
    },
    propertyTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: colours.text,
        marginBottom: 4,
    },
    locationRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 2,
    },
    locationText: {
        fontSize: 14,
        color: colours.textSecondary,
    },
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: "600",
    },
    datesContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 16,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: colours.border,
        marginBottom: 16,
    },
    dateColumn: {
        alignItems: "center",
    },
    dateLabel: {
        fontSize: 12,
        color: colours.textSecondary,
        marginBottom: 4,
    },
    dateValue: {
        fontSize: 16,
        fontWeight: "600",
        color: colours.text,
    },
    nightsIndicator: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: colours.background,
        borderRadius: 8,
    },
    nightsText: {
        fontSize: 12,
        color: colours.muted,
    },
    paymentStatusContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 12,
        backgroundColor: colours.background,
        borderRadius: 8,
        marginBottom: 16,
    },
    paymentStatusRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    paymentStatusLabel: {
        fontSize: 13,
        fontWeight: "500",
        color: colours.text,
    },
    paymentDueText: {
        fontSize: 12,
        color: colours.warning,
        fontWeight: "600",
    },
    bookingFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    landlordInfo: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    landlordAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
    landlordAvatarPlaceholder: {
        backgroundColor: colours.border,
        justifyContent: "center",
        alignItems: "center",
    },
    landlordName: {
        fontSize: 14,
        fontWeight: "500",
        color: colours.text,
    },
    priceContainer: {
        alignItems: "flex-end",
    },
    priceLabel: {
        fontSize: 12,
        color: colours.textSecondary,
        marginBottom: 2,
    },
    priceValue: {
        fontSize: 20,
        fontWeight: "700",
        color: colours.primary,
    },
    actionsContainer: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: colours.border,
    },
    cancelButton: {
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
        marginBottom: 24,
    },
    browseButton: {
        minWidth: 200,
    },
    tabContainer: {
        flexDirection: "row",
        paddingHorizontal: 16,
        paddingTop: 8,
        gap: 8,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: "center",
        borderBottomWidth: 2,
        borderBottomColor: "transparent",
    },
    activeTab: {
        borderBottomColor: colours.primary,
    },
    tabText: {
        fontSize: 14,
        fontWeight: "600",
        color: colours.textSecondary,
    },
    activeTabText: {
        color: colours.primary,
    },
    emptyTabContainer: {
        paddingVertical: 64,
        alignItems: "center",
    },
    emptyTabText: {
        fontSize: 14,
        color: colours.textSecondary,
        marginTop: 12,
    },

});
