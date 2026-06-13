import { useTheme } from "@/hooks/useTheme";
import { useMessageStore } from "@/store/message-store";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Tabs } from "expo-router";
import { useMemo } from "react";
import { useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

export default function ServiceTabLayout() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const scheme = useColorScheme();
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
    <>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <Tabs
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: theme.bg },
          tabBarStyle,
          tabBarActiveTintColor: "#F59E0B",
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
            title: "Jobs",
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="work-outline" size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="my-jobs"
          options={{
            title: "My Jobs",
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="assignment" size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="messages"
          options={{
            title: "Messages",
            tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
            tabBarBadgeStyle: { backgroundColor: "#F59E0B" },
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
    </>
  );
}
