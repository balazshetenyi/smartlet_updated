import { useTheme } from "@/hooks/useTheme";
import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { HeaderBackButton } from "@/components/shared/HeaderBackButton";

export default function MessagesLayout() {
  const theme = useTheme();

  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: theme.cardBackground }}>
      <Stack
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: theme.surface },
          headerTintColor: theme.primary,
          headerTitleStyle: { fontWeight: "700", color: theme.text },
        }}
      >
        <Stack.Screen
          name="index"
          options={{ title: "Messages", headerLeft: () => <HeaderBackButton /> }}
        />
        <Stack.Screen
          name="[conversation_id]"
          options={({ route }) => {
            const titleParam = (route.params as any)?.propertyTitle;
            return {
              title: titleParam || "Chat",
              headerLeft: () => <HeaderBackButton />,
            };
          }}
        />
      </Stack>
    </SafeAreaView>
  );
}
