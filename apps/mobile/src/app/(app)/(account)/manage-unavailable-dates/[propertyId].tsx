import UnavailableDatesManager from "@/components/properties/UnavailableDatesManager";
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
        }}
      />
      <UnavailableDatesManager propertyId={propertyId} />
    </>
  );
}