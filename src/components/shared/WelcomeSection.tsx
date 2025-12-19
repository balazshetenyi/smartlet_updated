import React from "react";
import { Text, View } from "react-native";

const WelcomeSection = ({ name }: { name: string }) => {
  return (
    <View className="mb-8">
      <Text className="font-bold text-3xl">Hello, {name || "Guest"} 👋</Text>
      <Text className="text-gray-600">Find your perfect property</Text>
    </View>
  );
};

export default WelcomeSection;
