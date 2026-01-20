import {Stack, useRouter} from "expo-router";
import {TouchableOpacity} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import {colours} from "@/styles/colours";

export default function PropertiesLayout() {
    const router = useRouter();
    return (
        <Stack>
            <Stack.Screen
                name="create-property"
                options={{
                    title: "Create New Property",
                    headerShown: true,
                    headerLeft: () => (
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={{marginLeft: 8, padding: 4}}
                            accessibilityLabel="Go back"
                        >
                            <MaterialIcons name="arrow-back" size={24} color={colours.text}/>
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
                            style={{marginLeft: 8, padding: 4}}
                            accessibilityLabel="Go back"
                        >
                            <MaterialIcons name="arrow-back" size={24} color={colours.text}/>
                        </TouchableOpacity>
                    ),
                }}
            />
        </Stack>
    );
}
