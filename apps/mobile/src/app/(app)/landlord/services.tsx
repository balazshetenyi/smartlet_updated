import { useTheme, type AppTheme } from "@/hooks/useTheme";
import { useAuthStore } from "@/store/auth-store";
import { cancelServiceJob, fetchLandlordServiceJobs } from "@/utils/service-utils";
import { SERVICE_TYPE_LABELS } from "@kiado/shared/types/services";
import type { ServiceType } from "@kiado/shared/types/services";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const STATUS_COLOR: Record<string, string> = {
  open: "#3B82F6",
  assigned: "#F59E0B",
  completed: "#22C55E",
  cancelled: "#9CA3AF",
};

type JobRow = {
  id: string;
  title: string;
  service_type: ServiceType;
  status: string;
  scheduled_date?: string;
  final_price?: number;
  properties: { title: string; address?: string; city?: string; postcode?: string };
};

export default function LandlordServicesScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useAuthStore();

  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadJobs = useCallback(async () => {
    if (!profile?.id) return;
    try {
      const data = await fetchLandlordServiceJobs(profile.id);
      setJobs(data as unknown as JobRow[]);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile?.id]);

  useFocusEffect(useCallback(() => { loadJobs(); }, [loadJobs]));

  function onRefresh() {
    setRefreshing(true);
    loadJobs();
  }

  function renderJob({ item }: { item: JobRow }) {
    const property = Array.isArray(item.properties)
      ? item.properties[0]
      : item.properties;
    const color = STATUS_COLOR[item.status] ?? "#9CA3AF";

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/services/manage/${item.id}`)}
        activeOpacity={0.8}
      >
        <View style={styles.cardLeft}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.cardSub}>
            {SERVICE_TYPE_LABELS[item.service_type]}
            {[property?.address, property?.city, property?.postcode].filter(Boolean).join(", ")
              ? ` · ${[property?.address, property?.city, property?.postcode].filter(Boolean).join(", ")}`
              : ""}
          </Text>
          {item.scheduled_date && (
            <Text style={styles.cardDate}>
              {new Date(item.scheduled_date).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
              })}
            </Text>
          )}
        </View>
        <View style={styles.cardRight}>
          <View style={[styles.badge, { backgroundColor: color + "22" }]}>
            <Text style={[styles.badgeText, { color }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
          {item.final_price && (
            <Text style={styles.price}>£{item.final_price.toFixed(2)}</Text>
          )}
          <MaterialIcons name="chevron-right" size={20} color={theme.textMuted} />
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Services</Text>
        <TouchableOpacity
          style={styles.postBtn}
          onPress={() => router.push("/services/post-job")}
          activeOpacity={0.8}
        >
          <MaterialIcons name="add" size={20} color="#fff" />
          <Text style={styles.postBtnText}>Post Job</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(j) => j.id}
          renderItem={renderJob}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialIcons name="work-outline" size={48} color={theme.textMuted} />
              <Text style={styles.emptyTitle}>No jobs yet</Text>
              <Text style={styles.emptySub}>
                Post a job to find cleaners, maintenance workers and more in your area
              </Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => router.push("/services/post-job")}
              >
                <Text style={styles.emptyBtnText}>Post your first job</Text>
              </TouchableOpacity>
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
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingTop: 14,
      paddingBottom: 10,
    },
    title: { fontSize: 22, fontWeight: "700", color: t.text },
    postBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: t.primary,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 10,
    },
    postBtnText: { fontSize: 13, fontWeight: "700", color: "#fff" },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    list: { padding: 16, gap: 10 },
    card: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: t.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: t.border,
      gap: 12,
    },
    cardLeft: { flex: 1 },
    cardTitle: { fontSize: 15, fontWeight: "600", color: t.text, marginBottom: 3 },
    cardSub: { fontSize: 13, color: t.textSecondary },
    cardDate: { fontSize: 12, color: t.textMuted, marginTop: 3 },
    cardRight: { alignItems: "flex-end", gap: 4 },
    badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
    badgeText: { fontSize: 12, fontWeight: "600" },
    price: { fontSize: 13, fontWeight: "600", color: t.text },
    empty: {
      alignItems: "center",
      paddingTop: 80,
      paddingHorizontal: 32,
      gap: 12,
    },
    emptyTitle: { fontSize: 17, fontWeight: "600", color: t.text },
    emptySub: {
      fontSize: 14,
      color: t.textSecondary,
      textAlign: "center",
      lineHeight: 20,
    },
    emptyBtn: {
      marginTop: 8,
      paddingHorizontal: 20,
      paddingVertical: 10,
      backgroundColor: t.primary,
      borderRadius: 10,
    },
    emptyBtnText: { fontSize: 14, fontWeight: "600", color: "#fff" },
  });
}
