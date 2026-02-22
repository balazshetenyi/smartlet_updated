import { Stack, useRouter } from "expo-router";
import { TouchableOpacity } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { colours } from "@kiado/shared";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PropertiesLayout() {
  const router = useRouter();
  return (
    <SafeAreaView
      edges={["bottom"]}
      style={{
        flex: 1,
        backgroundColor: colours.cardBackground,
      }}
    >
      <Stack>
        <Stack.Screen
          name="create-property"
          options={{
            title: "Create New Property",
            headerShown: true,
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
          name="edit-property"
          options={{
            title: "Edit Property",
            headerShown: true,
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
      </Stack>
    </SafeAreaView>
  );
}
