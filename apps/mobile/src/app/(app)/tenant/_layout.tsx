import { useTheme } from "@/hooks/useTheme";
import { useMessageStore } from "@/store/message-store";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Tabs } from "expo-router";
import { useMemo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TenantTabLayout() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { unreadCount } = useMessageStore();

  const tabBarStyle = useMemo(
    () => ({
      backgroundColor: theme.bg2,
      borderTopColor: theme.border,
      borderTopWidth: 1,
      height: 56 + insets.bottom,
      paddingBottom: insets.bottom || 8,
      paddingTop: 8,
      elevation: 0,
    }),
    [theme, insets.bottom],
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: theme.bg },
        tabBarStyle,
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "500",
          marginTop: -2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Explore",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="search" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: "Bookings",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="calendar-today" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: { backgroundColor: theme.primary },
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="chat" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "More",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="menu" size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
