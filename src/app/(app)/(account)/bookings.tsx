import { colours } from "@/styles/colours";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

const Bookings = () => {
  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.section}>
        {/* My Bookings */}
        <Text style={styles.sectionTitle}>My Bookings</Text>
        <View style={styles.emptyState}>
          <MaterialIcons name="event-note" size={48} color={colours.muted} />
          <Text style={styles.emptyText}>No bookings yet</Text>
          <Text style={styles.emptySubtext}>
            Your bookings will appear here
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default Bookings;
const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: colours.background,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colours.text,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: colours.text,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: colours.textSecondary,
    marginTop: 4,
    textAlign: "center",
  },
});
