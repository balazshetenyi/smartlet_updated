import { Stack, useRouter } from "expo-router";

export default function AppLayout() {
  const router = useRouter();
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(account)" options={{ headerShown: false }} />
    </Stack>
  );
}
