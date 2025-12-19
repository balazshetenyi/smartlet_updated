import { Stack, useRouter } from "expo-router";

export default function MessagesLayout() {
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
    // <Stack
    //   screenOptions={{
    //     headerShown: false,
    //     headerStyle: {
    //       backgroundColor: colours.surface,
    //     },
    //     headerTintColor: colours.text,
    //   }}
    // >
    //   <Stack.Screen
    //     name="index"
    //     options={{
    //       title: "Account",
    //       headerLeft: () => (
    //         <TouchableOpacity
    //           onPress={() => router.back()}
    //           style={{ marginLeft: 8, padding: 4 }}
    //           accessibilityLabel="Go back"
    //         >
    //           <MaterialIcons name="arrow-back" size={24} color={colours.text} />
    //         </TouchableOpacity>
    //       ),
    //     }}
    //   />
    //   <Stack.Screen
    //     name="profile"
    //     options={{
    //       title: "Profile",
    //       //   headerLeft: () => (
    //       //     <TouchableOpacity
    //       //       onPress={() => router.back()}
    //       //       style={{ marginLeft: 8, padding: 4 }}
    //       //       accessibilityLabel="Go back"
    //       //     >
    //       //       <MaterialIcons name="arrow-back" size={24} color={colours.text} />
    //       //     </TouchableOpacity>
    //       //   ),
    //     }}
    //   />
    //   <Stack.Screen
    //     name="bookings"
    //     options={{
    //       title: "My Bookings",
    //       headerLeft: () => (
    //         <TouchableOpacity
    //           onPress={() => router.back()}
    //           style={{ marginLeft: 8, padding: 4 }}
    //           accessibilityLabel="Go back"
    //         >
    //           <MaterialIcons name="arrow-back" size={24} color={colours.text} />
    //         </TouchableOpacity>
    //       ),
    //     }}
    //   />
    //   <Stack.Screen
    //     name="properties"
    //     options={{
    //       title: "My Properties",
    //       headerLeft: () => (
    //         <TouchableOpacity
    //           onPress={() => router.back()}
    //           style={{ marginLeft: 8, padding: 4 }}
    //           accessibilityLabel="Go back"
    //         >
    //           <MaterialIcons name="arrow-back" size={24} color={colours.text} />
    //         </TouchableOpacity>
    //       ),
    //     }}
    //   />
    // </Stack>
  );
}
