import { colours } from "@/styles/colours";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Stack, useRouter } from "expo-router";
import { TouchableOpacity } from "react-native";

export default function MessagesLayout() {
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerStyle: {
          backgroundColor: colours.surface,
        },
        headerTintColor: colours.text,
      }}
    >
      <Stack.Screen
        name="profile"
        options={{
          title: "Profile",
          headerShown: true,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ marginLeft: 8, padding: 4 }}
              accessibilityLabel="Go back"
            >
              <MaterialIcons name="arrow-back" size={24} color={colours.text} />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="my-bookings"
        options={{
          title: "My Bookings",
          headerShown: true,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ marginLeft: 8, padding: 4 }}
              accessibilityLabel="Go back"
            >
              <MaterialIcons name="arrow-back" size={24} color={colours.text} />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="my-properties"
        options={{
          title: "My Properties",
          headerShown: true,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ marginLeft: 8, padding: 4 }}
              accessibilityLabel="Go back"
            >
              <MaterialIcons name="arrow-back" size={24} color={colours.text} />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="booking-requests"
        options={{
          title: "Booking Requests",
          headerShown: true,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ marginLeft: 8, padding: 4 }}
              accessibilityLabel="Go back"
            >
              <MaterialIcons name="arrow-back" size={24} color={colours.text} />
            </TouchableOpacity>
          ),
        }}
      />
    </Stack>
  );
}
