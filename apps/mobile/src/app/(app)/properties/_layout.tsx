import { HeaderBackButton } from "@/components/shared/HeaderBackButton";
import { useTheme } from "@/hooks/useTheme";
import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PropertiesLayout() {
  const theme = useTheme();

  return (
    <SafeAreaView
      edges={["bottom"]}
      style={{ flex: 1, backgroundColor: theme.cardBackground }}
    >
      <Stack
        screenOptions={{
          headerTitle: "",
          headerStyle: { backgroundColor: theme.surface },
          headerTintColor: theme.primary,
          headerTitleStyle: { fontWeight: "700", color: theme.text },
        }}
      >
        <Stack.Screen
          name="create-property"
          options={{
            headerTitle: "Add New Property",
            headerShown: true,
            headerLeft: () => <HeaderBackButton />,
          }}
        />
        <Stack.Screen
          name="edit-property"
          options={{
            headerTitle: "Edit Property",
            headerShown: true,
            headerLeft: () => <HeaderBackButton />,
          }}
        />
      </Stack>
    </SafeAreaView>
  );
}
