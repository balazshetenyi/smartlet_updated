import { colours } from "@kiado/shared";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Stack, useRouter } from "expo-router";
import { TouchableOpacity } from "react-native";
import { HeaderBackButton } from "@/components/shared/HeaderBackButton";

export default function AccountLayout() {
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="profile"
        options={{
          title: "Profile",
          headerShown: true,
          headerLeft: () => <HeaderBackButton />,
        }}
      />
      <Stack.Screen
        name="change-password"
        options={{
          title: "Change Password",
          headerShown: true,
          headerLeft: () => <HeaderBackButton />,
        }}
      />
      <Stack.Screen
        name="notifications"
        options={{
          title: "Notifications",
          headerShown: true,
          headerLeft: () => <HeaderBackButton />,
        }}
      />
      <Stack.Screen
        name="my-bookings"
        options={{
          title: "My Bookings",
          headerShown: true,
          headerLeft: () => <HeaderBackButton />,
        }}
      />
      <Stack.Screen
        name="my-properties"
        options={{
          title: "My Properties",
          headerShown: true,
          headerLeft: () => <HeaderBackButton />,
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push("/properties/create-property")}
              style={{ marginRight: 8, padding: 4 }}
              accessibilityLabel="Create Property"
            >
              <MaterialIcons
                name="add-home"
                size={24}
                color={colours.primary}
              />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="earnings"
        options={{
          title: "Earnings",
          headerShown: true,
          headerLeft: () => <HeaderBackButton />,
        }}
      />
      <Stack.Screen
        name="payout-setup"
        options={{
          title: "Payout Settings",
          headerShown: true,
          headerLeft: () => <HeaderBackButton />,
        }}
      />
      <Stack.Screen
        name="booking-requests"
        options={{
          title: "Booking Requests",
          headerShown: true,
          headerLeft: () => <HeaderBackButton />,
        }}
      />
    </Stack>
  );
}
