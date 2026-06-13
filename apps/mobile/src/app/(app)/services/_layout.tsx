import { HeaderBackButton } from "@/components/shared/HeaderBackButton";
import { useTheme } from "@/hooks/useTheme";
import { Stack } from "expo-router";

export default function ServicesLayout() {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.surface },
        headerTintColor: theme.primary,
        headerTitleStyle: { fontWeight: "700", color: theme.text },
        headerLeft: () => <HeaderBackButton />,
      }}
    >
      <Stack.Screen name="[id]" options={{ title: "Job Details" }} />
      <Stack.Screen name="post-job" options={{ title: "Post a Job" }} />
      <Stack.Screen name="manage/[id]" options={{ title: "Manage Job" }} />
    </Stack>
  );
}
