import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo } from "react";
import { useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function LandlordTabLayout() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const scheme = useColorScheme();

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
            title: "Dashboard",
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="dashboard" size={22} color={color} />
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
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="chat" size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="properties"
          options={{
            title: "Properties",
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="home" size={22} color={color} />
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
