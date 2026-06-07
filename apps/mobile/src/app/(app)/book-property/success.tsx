import { useTheme, type AppTheme } from "@/hooks/useTheme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ACCENT = "#7C6CFF";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function BookingSuccessScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();
  const { propertyTitle, checkIn, checkOut } =
    useLocalSearchParams<{ propertyTitle?: string; checkIn?: string; checkOut?: string }>();

  const scale   = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Checkmark circle bounces in
    Animated.spring(scale, {
      toValue: 1,
      tension: 90,
      friction: 7,
      useNativeDriver: true,
    }).start();

    // Content fades in after the bounce settles
    setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 380,
        useNativeDriver: true,
      }).start();
    }, 350);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Animated checkmark */}
        <Animated.View style={[styles.checkCircle, { transform: [{ scale }] }]}>
          <MaterialIcons name="check" size={44} color="#FFFFFF" />
        </Animated.View>

        {/* Booking details */}
        <Animated.View style={[styles.details, { opacity }]}>
          <Text style={styles.heading}>Booking Confirmed</Text>

          {propertyTitle && (
            <Text style={styles.property}>{decodeURIComponent(propertyTitle)}</Text>
          )}

          {checkIn && checkOut && (
            <View style={styles.datesRow}>
              <View style={styles.dateBlock}>
                <Text style={styles.dateLabel}>Check-in</Text>
                <Text style={styles.dateValue}>{formatDate(checkIn)}</Text>
              </View>
              <MaterialIcons name="arrow-forward" size={18} color={theme.textMuted} />
              <View style={styles.dateBlock}>
                <Text style={styles.dateLabel}>Check-out</Text>
                <Text style={styles.dateValue}>{formatDate(checkOut)}</Text>
              </View>
            </View>
          )}

          <View style={styles.notice}>
            <MaterialIcons name="info-outline" size={15} color={ACCENT} />
            <Text style={styles.noticeText}>
              Card saved · payment taken 48h before check-in
            </Text>
          </View>
        </Animated.View>

        {/* Actions */}
        <Animated.View style={[styles.actions, { opacity }]}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.replace("/tenant/bookings")}
          >
            <Text style={styles.primaryBtnText}>View My Bookings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => router.replace("/tenant")}
          >
            <Text style={styles.secondaryBtnText}>Keep Exploring</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

function createStyles(t: AppTheme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: t.bg,
    },
    content: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 32,
      gap: 36,
    },
    checkCircle: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: ACCENT,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: ACCENT,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.35,
      shadowRadius: 16,
      elevation: 10,
    },
    details: {
      alignItems: "center",
      gap: 12,
      width: "100%",
    },
    heading: {
      fontSize: 26,
      fontWeight: "800",
      color: t.text,
      letterSpacing: -0.3,
    },
    property: {
      fontSize: 16,
      color: t.textSub,
      textAlign: "center",
    },
    datesRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginTop: 4,
      backgroundColor: t.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: t.border,
      paddingHorizontal: 20,
      paddingVertical: 14,
      width: "100%",
    },
    dateBlock: {
      flex: 1,
    },
    dateLabel: {
      fontSize: 11,
      color: t.textMuted,
      marginBottom: 3,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    dateValue: {
      fontSize: 13,
      fontWeight: "600",
      color: t.text,
    },
    notice: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 4,
    },
    noticeText: {
      fontSize: 12,
      color: t.textMuted,
    },
    actions: {
      width: "100%",
      gap: 12,
    },
    primaryBtn: {
      backgroundColor: ACCENT,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: "center",
    },
    primaryBtnText: {
      fontSize: 16,
      fontWeight: "700",
      color: "#FFFFFF",
    },
    secondaryBtn: {
      paddingVertical: 12,
      alignItems: "center",
    },
    secondaryBtnText: {
      fontSize: 14,
      fontWeight: "500",
      color: t.textMuted,
    },
  });
}
