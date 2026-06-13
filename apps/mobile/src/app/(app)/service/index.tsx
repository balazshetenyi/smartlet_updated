import { useTheme, type AppTheme } from "@/hooks/useTheme";
import { useAuthStore } from "@/store/auth-store";
import {
  fetchOpenServiceJobs,
  fetchServiceOperatorProfile,
} from "@/utils/service-utils";
import { SERVICE_TYPE_LABELS } from "@kiado/shared/types/services";
import type { ServiceType } from "@kiado/shared/types/services";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
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

const SERVICE_ICONS: Record<ServiceType, React.ComponentProps<typeof MaterialIcons>["name"]> = {
  cleaning: "cleaning-services",
  maintenance: "build",
  plumbing: "plumbing",
  electrical: "electrical-services",
  gardening: "grass",
  painting: "format-paint",
  other: "miscellaneous-services",
};

type JobRow = {
  id: string;
  title: string;
  service_type: ServiceType;
  scheduled_date?: string;
  description?: string;
  properties: { title: string; city?: string };
};

export default function ServiceJobsScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useAuthStore();

  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [operatorServices, setOperatorServices] = useState<ServiceType[]>([]);

  const loadJobs = useCallback(async () => {
    if (!profile?.id) return;
    try {
      const opProfile = await fetchServiceOperatorProfile(profile.id);
      const services = opProfile?.services ?? [];
      setOperatorServices(services);
      const data = await fetchOpenServiceJobs(services.length > 0 ? services : undefined);
      setJobs(data as unknown as JobRow[]);
    } catch {
      // silently fail — list will be empty
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile?.id]);

  useEffect(() => { loadJobs(); }, [loadJobs]);

  function onRefresh() {
    setRefreshing(true);
    loadJobs();
  }

  function renderJob({ item }: { item: JobRow }) {
    const property = Array.isArray(item.properties)
      ? item.properties[0]
      : item.properties;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/services/${item.id}`)}
        activeOpacity={0.8}
      >
        <View style={styles.cardIconWrap}>
          <MaterialIcons
            name={SERVICE_ICONS[item.service_type] ?? "miscellaneous-services"}
            size={24}
            color="#F59E0B"
          />
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.cardSub} numberOfLines={1}>
            {SERVICE_TYPE_LABELS[item.service_type]} · {property?.city ?? property?.title}
          </Text>
          {item.scheduled_date && (
            <Text style={styles.cardDate}>
              {new Date(item.scheduled_date).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </Text>
          )}
        </View>
        <MaterialIcons name="chevron-right" size={22} color={theme.textMuted} />
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Available Jobs</Text>
        {operatorServices.length > 0 && (
          <Text style={styles.filterHint}>
            Showing: {operatorServices.map((s) => SERVICE_TYPE_LABELS[s]).join(", ")}
          </Text>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#F59E0B" />
        </View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(j) => j.id}
          renderItem={renderJob}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F59E0B" />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialIcons name="work-off" size={48} color={theme.textMuted} />
              <Text style={styles.emptyTitle}>No jobs available</Text>
              <Text style={styles.emptySub}>
                Check back later — new jobs are posted by landlords in your area
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
    filterHint: {
      fontSize: 12,
      color: t.textMuted,
      marginTop: 2,
    },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    list: { padding: 16, gap: 12 },
    card: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: t.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: t.border,
      gap: 14,
    },
    cardIconWrap: {
      width: 48,
      height: 48,
      borderRadius: 14,
      backgroundColor: "#F59E0B18",
      justifyContent: "center",
      alignItems: "center",
    },
    cardBody: { flex: 1 },
    cardTitle: { fontSize: 15, fontWeight: "600", color: t.text, marginBottom: 3 },
    cardSub: { fontSize: 13, color: t.textSecondary },
    cardDate: { fontSize: 12, color: t.textMuted, marginTop: 4 },
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
