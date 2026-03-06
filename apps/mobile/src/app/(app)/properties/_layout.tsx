import { Stack } from "expo-router";
import { colours } from "@kiado/shared";
import { SafeAreaView } from "react-native-safe-area-context";
import { HeaderBackButton } from "@/components/shared/HeaderBackButton";

export default function PropertiesLayout() {
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
            headerLeft: () => <HeaderBackButton />,
          }}
        />
        <Stack.Screen
          name="edit-property"
          options={{
            title: "Edit Property",
            headerShown: true,
            headerLeft: () => <HeaderBackButton />,
          }}
        />
      </Stack>
    </SafeAreaView>
  );
}
