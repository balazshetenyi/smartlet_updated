import { useAuthStore } from "@/store/auth-store";
import { colours } from "@kiado/shared";
import type {
  SurveillanceReportStatus,
  SurveillanceReportWithProperty,
} from "@kiado/shared/types/property";
import { fetchMyReports } from "@/utils/surveillance-utils";
import { HeaderBackButton } from "@/components/shared/HeaderBackButton";
import { showToastMessage } from "@/components/shared/ToastMessage";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Stack } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type StatusConfig = {
  backgroundColor: string;
  color: string;
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
  label: string;
};

const STATUS_CONFIG: Record<SurveillanceReportStatus, StatusConfig> = {
  pending: {
    backgroundColor: "#FEF3C7",
    color: "#D97706",
    icon: "schedule",
    label: "Pending Review",
  },
  investigating: {
    backgroundColor: "#FFEDD5",
    color: "#EA580C",
    icon: "manage-search",
    label: "Investigating",
  },
  resolved_breach: {
    backgroundColor: "#FEE2E2",
    color: "#DC2626",
    icon: "gpp-bad",
    label: "Breach Confirmed",
  },
  resolved_no_breach: {
    backgroundColor: "#D1FAE5",
    color: "#059669",
    icon: "verified-user",
    label: "No Breach Found",
  },
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function ReportCard({ report }: { report: SurveillanceReportWithProperty }) {
  const config = STATUS_CONFIG[report.status];
  const isResolved =
    report.status === "resolved_breach" ||
    report.status === "resolved_no_breach";
  const snippet =
    report.description.length > 100
      ? report.description.slice(0, 100) + "…"
      : report.description;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.propertyInfo}>
          <Text style={styles.propertyTitle} numberOfLines={1}>
            {report.property_title}
          </Text>
          {(report.property_city ?? report.property_address) && (
            <Text style={styles.propertyLocation} numberOfLines={1}>
              {report.property_city ?? report.property_address}
            </Text>
          )}
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: config.backgroundColor },
          ]}
        >
          <MaterialIcons name={config.icon} size={14} color={config.color} />
          <Text style={[styles.statusText, { color: config.color }]}>
            {config.label}
          </Text>
        </View>
      </View>

      <Text style={styles.filedDate}>
        Filed {formatDate(report.created_at)}
      </Text>
      <Text style={styles.description}>{snippet}</Text>

      {isResolved && report.resolution_notes !== null && (
        <View style={styles.resolutionBox}>
          <Text style={styles.resolutionLabel}>Resolution:</Text>
          <Text style={styles.resolutionNotes}>{report.resolution_notes}</Text>
        </View>
      )}
    </View>
  );
}

export default function MyReportsScreen() {
  const { profile } = useAuthStore();
  const [reports, setReports] = useState<SurveillanceReportWithProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadReports = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    setError(false);
    try {
      const data = await fetchMyReports(profile.id);
      setReports(data);
    } catch {
      setError(true);
      showToastMessage({ message: "Failed to load reports", type: "danger" });
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Stack.Screen
        options={{
          title: "My Reports",
          headerShown: true,
          headerLeft: () => <HeaderBackButton />,
        }}
      />

      {loading ? (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color={colours.primary} />
        </View>
      ) : error ? (
        <View style={styles.centeredContainer}>
          <MaterialIcons name="error-outline" size={64} color={colours.muted} />
          <Text style={styles.stateText}>Failed to load reports</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadReports}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : reports.length === 0 ? (
        <View style={styles.centeredContainer}>
          <MaterialIcons name="gpp-bad" size={64} color={colours.muted} />
          <Text style={styles.emptyTitle}>No reports filed</Text>
          <Text style={styles.emptyText}>
            If you suspect an undisclosed surveillance device in a property, you
            can report it from the property listing page.
          </Text>
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ReportCard report={item} />}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colours.background,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  listContent: {
    paddingVertical: 8,
  },
  card: {
    backgroundColor: colours.surface,
    borderRadius: 12,
    marginHorizontal: 12,
    marginVertical: 8,
    padding: 14,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  propertyInfo: {
    flex: 1,
    marginRight: 10,
  },
  propertyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colours.text,
    marginBottom: 2,
  },
  propertyLocation: {
    fontSize: 13,
    color: colours.textSecondary,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  filedDate: {
    fontSize: 12,
    color: colours.muted,
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    color: colours.textSecondary,
    lineHeight: 20,
  },
  resolutionBox: {
    marginTop: 10,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    padding: 10,
  },
  resolutionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colours.textSecondary,
    marginBottom: 4,
  },
  resolutionNotes: {
    fontSize: 13,
    color: colours.textSecondary,
    lineHeight: 18,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colours.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    color: colours.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  stateText: {
    fontSize: 16,
    color: colours.textSecondary,
    marginTop: 12,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: colours.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
