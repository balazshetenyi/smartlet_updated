import { useTheme, type AppTheme } from "@/hooks/useTheme";
import { useAuthStore } from "@/store/auth-store";
import { fetchMyApplications, withdrawApplication } from "@/utils/service-utils";
import { SERVICE_TYPE_LABELS } from "@kiado/shared/types/services";
import type { ServiceApplicationStatus, ServiceType } from "@kiado/shared/types/services";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const STATUS_LABEL: Record<ServiceApplicationStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  declined: "Declined",
  withdrawn: "Withdrawn",
};

const STATUS_COLOR: Record<ServiceApplicationStatus, string> = {
  pending: "#F59E0B",
  approved: "#22C55E",
  declined: "#EF4444",
  withdrawn: "#9CA3AF",
};

type ApplicationRow = {
  id: string;
  quote_price: number;
  status: ServiceApplicationStatus;
  created_at: string;
  service_jobs: {
    id: string;
    title: string;
    service_type: ServiceType;
    status: string;
    scheduled_date?: string;
    final_price?: number;
    payment_status: string;
    properties: { title: string; city?: string };
  };
};

export default function MyJobsScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useAuthStore();

  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadApplications = useCallback(async () => {
    if (!profile?.id) return;
    try {
      const data = await fetchMyApplications(profile.id);
      setApplications(data as unknown as ApplicationRow[]);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile?.id]);

  useEffect(() => { loadApplications(); }, [loadApplications]);

  function onRefresh() {
    setRefreshing(true);
    loadApplications();
  }

  function handleWithdraw(applicationId: string, jobTitle: string) {
    Alert.alert(
      "Withdraw application",
      `Remove your application for "${jobTitle}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Withdraw",
          style: "destructive",
          onPress: async () => {
            const { error } = await withdrawApplication(applicationId);
            if (error) {
              Alert.alert("Error", error);
            } else {
              loadApplications();
            }
          },
        },
      ],
    );
  }

  function renderItem({ item }: { item: ApplicationRow }) {
    const job = Array.isArray(item.service_jobs)
      ? item.service_jobs[0]
      : item.service_jobs;
    const property = job
      ? Array.isArray(job.properties) ? job.properties[0] : job.properties
      : null;
    const status = item.status;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/services/${job?.id}`)}
        activeOpacity={0.85}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardMeta}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {job?.title ?? "—"}
            </Text>
            <Text style={styles.cardSub}>
              {job ? SERVICE_TYPE_LABELS[job.service_type as ServiceType] : ""}
              {property?.city ? ` · ${property.city}` : ""}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: STATUS_COLOR[status] + "22" }]}>
            <Text style={[styles.badgeText, { color: STATUS_COLOR[status] }]}>
              {STATUS_LABEL[status]}
            </Text>
          </View>
        </View>

        <View style={styles.cardRow}>
          <Text style={styles.quoteLabel}>Your quote</Text>
          <View style={styles.quoteRight}>
            <Text style={styles.quoteValue}>£{item.quote_price.toFixed(2)}</Text>
            <Text style={styles.quoteFeeHint}>
              You receive £{(item.quote_price * 0.94).toFixed(2)} after 6% fee
            </Text>
          </View>
        </View>

        {status === "approved" && job?.payment_status === "held" && (
          <View style={styles.paymentNote}>
            <MaterialIcons name="lock" size={14} color="#22C55E" />
            <Text style={styles.paymentNoteText}>Payment held in escrow</Text>
          </View>
        )}

        {status === "pending" && (
          <TouchableOpacity
            style={styles.withdrawBtn}
            onPress={() => handleWithdraw(item.id, job?.title ?? "")}
          >
            <Text style={styles.withdrawBtnText}>Withdraw</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>My Jobs</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#F59E0B" />
        </View>
      ) : (
        <FlatList
          data={applications}
          keyExtractor={(a) => a.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F59E0B" />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialIcons name="assignment" size={48} color={theme.textMuted} />
              <Text style={styles.emptyTitle}>No applications yet</Text>
              <Text style={styles.emptySub}>
                Browse available jobs and apply to get started
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

function createStyles(t: AppTheme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg },
    header: {
      paddingHorizontal: 20,
      paddingTop: 14,
      paddingBottom: 10,
    },
    title: { fontSize: 22, fontWeight: "700", color: t.text },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    list: { padding: 16, gap: 12 },
    card: {
      backgroundColor: t.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: t.border,
      gap: 10,
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 10,
    },
    cardMeta: { flex: 1 },
    cardTitle: { fontSize: 15, fontWeight: "600", color: t.text, marginBottom: 3 },
    cardSub: { fontSize: 13, color: t.textSecondary },
    badge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
    },
    badgeText: { fontSize: 12, fontWeight: "600" },
    cardRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    quoteLabel: { fontSize: 13, color: t.textSecondary },
    quoteRight: { alignItems: "flex-end" },
    quoteValue: { fontSize: 16, fontWeight: "700", color: t.text },
    quoteFeeHint: { fontSize: 11, color: t.textMuted, marginTop: 1 },
    paymentNote: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    paymentNoteText: { fontSize: 12, color: "#22C55E", fontWeight: "500" },
    withdrawBtn: {
      alignSelf: "flex-end",
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: "#EF4444",
    },
    withdrawBtnText: { fontSize: 13, color: "#EF4444", fontWeight: "600" },
    empty: {
      alignItems: "center",
      paddingTop: 80,
      paddingHorizontal: 32,
      gap: 12,
    },
    emptyTitle: { fontSize: 17, fontWeight: "600", color: t.text },
    emptySub: { fontSize: 14, color: t.textSecondary, textAlign: "center", lineHeight: 20 },
  });
}
