import UnavailableDatesManager from "@/components/properties/UnavailableDatesManager";
import { HeaderBackButton } from "@/components/shared/HeaderBackButton";
import { Stack, useLocalSearchParams } from "expo-router";
import React from "react";

export default function ManageUnavailableDatesScreen() {
  const { propertyId } = useLocalSearchParams<{ propertyId: string }>();

  return (
    <>
      <Stack.Screen
        options={{
          title: "Manage Unavailable Dates",
          headerShown: true,
          headerLeft: () => <HeaderBackButton />,
        }}
      />
      <UnavailableDatesManager propertyId={propertyId} />
    </>
  );
}
