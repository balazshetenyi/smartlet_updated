import { colours } from "@kiado/shared";
import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { HeaderBackButton } from "@/components/shared/HeaderBackButton.tsx";

export default function MessagesLayout() {
  return (
    <SafeAreaView
      edges={["bottom"]}
      style={{
        flex: 1,
        backgroundColor: colours.cardBackground,
      }}
    >
      <Stack
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: colours.surface,
          },
          headerTintColor: colours.text,
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: "Messages",
            headerLeft: () => <HeaderBackButton />,
          }}
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
