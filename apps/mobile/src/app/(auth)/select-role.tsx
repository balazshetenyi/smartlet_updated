import { useTheme, type AppTheme } from "@/hooks/useTheme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Role = "tenant" | "landlord";

interface RoleCard {
  role: Role;
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
  iconColor: string;
  title: string;
  description: string;
}

const CARDS: RoleCard[] = [
  {
    role: "tenant",
    icon: "travel-explore",
    iconColor: "#7C6CFF",
    title: "I'm looking for a property",
    description: "Search and book holiday lets and short-term rentals",
  },
  {
    role: "landlord",
    icon: "home",
    iconColor: "#22C55E",
    title: "I own a property",
    description: "List your property, manage bookings and connect with guests",
  },
];

export default function SelectRoleScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.heading}>
        <Text style={styles.title}>Join Kiado</Text>
        <Text style={styles.subtitle}>How would you like to use the app?</Text>
      </View>

      <View style={styles.cards}>
        {CARDS.map((card) => (
          <TouchableOpacity
            key={card.role}
            style={styles.card}
            onPress={() => router.push(`/sign-up?role=${card.role}`)}
            activeOpacity={0.8}
          >
            <View style={[styles.iconWrap, { backgroundColor: card.iconColor + "18" }]}>
              <MaterialIcons name={card.icon} size={36} color={card.iconColor} />
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{card.title}</Text>
              <Text style={styles.cardDesc}>{card.description}</Text>
            </View>
            <MaterialIcons name="arrow-forward-ios" size={16} color={theme.textMuted} />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account? </Text>
        <TouchableOpacity onPress={() => router.push("/sign-in")}>
          <Text style={styles.footerLink}>Sign in</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function createStyles(t: AppTheme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: t.background,
      paddingHorizontal: 24,
      justifyContent: "space-between",
    },
    heading: {
      paddingTop: 40,
      paddingBottom: 8,
    },
    title: {
      fontSize: 32,
      fontWeight: "800",
      color: t.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: t.textSecondary,
      lineHeight: 22,
    },
    cards: {
      flex: 1,
      justifyContent: "center",
      gap: 16,
    },
    card: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: t.surface,
      borderRadius: 20,
      padding: 20,
      borderWidth: 1,
      borderColor: t.border,
      gap: 16,
      shadowColor: t.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 8,
      elevation: 2,
    },
    iconWrap: {
      width: 64,
      height: 64,
      borderRadius: 18,
      justifyContent: "center",
      alignItems: "center",
    },
    cardText: {
      flex: 1,
    },
    cardTitle: {
      fontSize: 17,
      fontWeight: "700",
      color: t.text,
      marginBottom: 4,
    },
    cardDesc: {
      fontSize: 13,
      color: t.textSecondary,
      lineHeight: 18,
    },
    footer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      paddingBottom: 24,
    },
    footerText: {
      fontSize: 14,
      color: t.textSecondary,
    },
    footerLink: {
      fontSize: 14,
      fontWeight: "700",
      color: t.primary,
    },
  });
}
