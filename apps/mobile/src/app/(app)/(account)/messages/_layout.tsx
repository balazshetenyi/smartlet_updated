import { colours } from "@kiado/shared";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Stack, useRouter } from "expo-router";
import { TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MessagesLayout() {
  const router = useRouter();

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
            headerLeft: () => (
              <TouchableOpacity
                onPress={() => router.back()}
                style={{ marginLeft: 8, padding: 4 }}
                accessibilityLabel="Go back"
              >
                <MaterialIcons
                  name="arrow-back"
                  size={24}
                  color={colours.text}
                />
              </TouchableOpacity>
            ),
          }}
        />
        <Stack.Screen
          name="[conversation_id]"
          options={({ route }) => {
            const titleParam = (route.params as any)?.propertyTitle;
            return {
              title: titleParam || "Chat",
              headerLeft: () => (
                <TouchableOpacity
                  onPress={() => router.back()}
                  style={{ marginLeft: 8, padding: 4 }}
                  accessibilityLabel="Go back"
                >
                  <MaterialIcons
                    name="arrow-back"
                    size={24}
                    color={colours.text}
                  />
                </TouchableOpacity>
              ),
            };
          }}
        />
      </Stack>
    </SafeAreaView>
  );
}
