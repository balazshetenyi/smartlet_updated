import PropertyRow from "@/components/properties/PropertyRow";
import AppBar from "@/components/shared/AppBar";
import SearchBar from "@/components/shared/SearchBar";
import {useAuthStore} from "@/store/auth-store";
import {usePropertyStore} from "@/store/property-store";
import {colours} from "@/styles/colours";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import {useEffect, useState} from "react";
import {ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View,} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";

export default function HomeScreen() {
    const {
        longTermProperties,
        shortTermProperties,
        holidayProperties,
        loadProperties,
        loading,
    } = usePropertyStore();
    const [refreshing, setRefreshing] = useState(false);
    const {profile} = useAuthStore();

    const onRefresh = () => {
        setRefreshing(true);
        loadProperties();
    };

    useEffect(() => {
        loadProperties();
    }, [loadProperties, profile?.id]);

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <MaterialIcons name="home" size={64} color={colours.muted}/>
            <Text style={styles.emptyText}>No properties available</Text>
            <Text style={styles.emptySubtext}>Check back later for new listings</Text>
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
                <AppBar/>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colours.primary}/>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <View style={styles.container}>
            <AppBar/>
            <ScrollView
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colours.primary}
                    />
                }
            >
                <View style={styles.content}>
                    {/* Welcome Section */}
                    <View style={styles.welcomeSection}>
                        <Text style={styles.welcomeTitle}>
                            Hello, {profile?.first_name || "Guest"} 👋
                        </Text>
                        <Text style={styles.welcomeSubtitle}>
                            Where would you like to go?
                        </Text>
                    </View>

                    {/* Search Bar */}
                    <SearchBar/>

                    {/* Popular Destinations / Recent */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Popular Holiday Rentals</Text>
                        {holidayProperties.length > 0 ? (
                            <PropertyRow
                                title=""
                                properties={holidayProperties.slice(0, 5)}
                                rentalType="holiday"
                            />
                        ) : (
                            <Text style={styles.emptyText}>No holiday rentals available</Text>
                        )}
                    </View>

                    {/* Other rental types can be shown as secondary options */}
                    {shortTermProperties.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Short Term Rentals</Text>
                            <PropertyRow
                                title=""
                                properties={shortTermProperties.slice(0, 5)}
                                rentalType="short-term"
                            />
                        </View>
                    )}
                    {longTermProperties.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Long Term Rentals</Text>
                            <PropertyRow
                                title=""
                                properties={longTermProperties.slice(0, 5)}
                                rentalType="short-term"
                            />
                        </View>
                    )}
                </View>
            </ScrollView>
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
    },
    content: {
        padding: 20,
    },
    welcomeSection: {
        marginBottom: 24,
    },
    welcomeTitle: {
        fontSize: 28,
        fontWeight: "700",
        color: colours.text,
        marginBottom: 4,
    },
    welcomeSubtitle: {
        fontSize: 16,
        color: colours.textSecondary,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "600",
        color: colours.text,
        marginBottom: 16,
    },
    emptyContainer: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 60,
    },
    emptyText: {
        marginTop: 12,
        fontSize: 16,
        fontWeight: "600",
        color: colours.text,
    },
    emptySubtext: {
        fontSize: 14,
        color: colours.textSecondary,
        marginTop: 4,
    },
});
