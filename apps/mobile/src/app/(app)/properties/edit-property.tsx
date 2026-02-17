import AmenitySelector from "@/components/properties/AmenitySelector";
import RentalTypeSelector from "@/components/properties/RentalTypeSelector";
import Button from "@/components/shared/Button";
import Input from "@/components/shared/Input";
import {supabase} from "@/lib/supabase";
import {AddNewProperty, propertySchema} from "@/schemas/property-schema";
import {useAuthStore} from "@/store/auth-store";
import {colours} from "@/styles/colours";
import {Property} from "@/types/property";
import {fetchPropertyPhotoDetails, setCoverImage, uploadPropertyImages,} from "@/utils/property-utils";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import {zodResolver} from "@hookform/resolvers/zod";
import * as ImagePicker from "expo-image-picker";
import {useLocalSearchParams, useRouter} from "expo-router";
import React, {useEffect, useState} from "react";
import {Controller, useForm} from "react-hook-form";
import {ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Switch, Text, View,} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";

export default function EditPropertyScreen() {
    const {id} = useLocalSearchParams<{ id: string }>();
    const {profile} = useAuthStore();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [property, setProperty] = useState<Property | null>(null);
    const [isAvailable, setIsAvailable] = useState(true);
    const [photoDetails, setPhotoDetails] = useState<
        Array<{ id: string; image_url: string; is_cover: boolean }>
    >([]);
    const [newAssets, setNewAssets] = useState<
        Array<ImagePicker.ImagePickerAsset>
    >([]);
    const [photosToDelete, setPhotosToDelete] = useState<
        Array<{ id: string; url: string }>
    >([]);
    const [selectingCover, setSelectingCover] = useState(false);

    const {
        control,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: {errors, isSubmitting},
    } = useForm<AddNewProperty>({
        resolver: zodResolver(propertySchema),
        defaultValues: {
            title: "",
            description: "",
            city: "",
            postcode: "",
            address: "",
            rental_type: "long_term",
            price: 0,
            bedrooms: 0,
            bathrooms: 0,
            amenities: [],
        },
    });

    const rentalType = watch("rental_type");

    useEffect(() => {
        fetchPropertyData();
    }, [id]);

    const fetchPropertyData = async () => {
        try {
            setLoading(true);

            // Fetch property details
            const {data: propertyData, error: propertyError} = await supabase
                .from("properties")
                .select("*")
                .eq("id", id)
                .single();

            if (propertyError) throw propertyError;

            // Check if user is the landlord
            if (propertyData.landlord_id !== profile?.id) {
                Alert.alert("Error", "You don't have permission to edit this property");
                router.back();
                return;
            }

            setProperty(propertyData);
            setIsAvailable(propertyData.is_available ?? true);

            // Populate form with existing data
            reset({
                title: propertyData.title || "",
                description: propertyData.description || "",
                city: propertyData.city || "",
                postcode: propertyData.postcode || "",
                address: propertyData.address || "",
                rental_type: propertyData.rental_type || "long_term",
                price: propertyData.price || 0,
                bedrooms: propertyData.bedrooms || 0,
                bathrooms: propertyData.bathrooms || 0,
                amenities: [], // Will be populated from property_amenities
            });

            // Fetch existing photos with metadata
            const photoData = await fetchPropertyPhotoDetails(id as string);
            setPhotoDetails(photoData);

            // Fetch amenities for this property
            const {data: propertyAmenities, error: amenitiesError} = await supabase
                .from("property_amenities")
                .select("amenity_id")
                .eq("property_id", id);

            if (!amenitiesError && propertyAmenities) {
                const amenityIds = propertyAmenities.map((pa) => pa.amenity_id);
                setValue("amenities", amenityIds);
            }
        } catch (error) {
            console.error("Error fetching property:", error);
            Alert.alert("Error", "Failed to load property details");
            router.back();
        } finally {
            setLoading(false);
        }
    };

    // Helper to get price label based on rental type
    const getPriceLabel = () => {
        switch (rentalType) {
            case "short_term":
                return "Weekly Rent (£)";
            case "holiday":
                return "Nightly Rate (£)";
            default:
                return "Monthly Rent (£)";
        }
    };

    const getPricePlaceholder = () => {
        switch (rentalType) {
            case "short_term":
                return "e.g., 350";
            case "holiday":
                return "e.g., 75";
            default:
                return "e.g., 1200";
        }
    };

    const requestMediaPermission = async () => {
        const {status} = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
            Alert.alert(
                "Permission required",
                "We need access to your photo library to add property photos."
            );
            return false;
        }
        return true;
    };

    const pickImages = async () => {
        const ok = await requestMediaPermission();
        if (!ok) return;

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 0.3,
            selectionLimit: 10,
            base64: true,
            exif: false,
        });

        if (!result.canceled) {
            setNewAssets((prev) => {
                const merged = [...prev, ...result.assets];
                // de-dup by uri
                const seen = new Set<string>();
                return merged.filter((i) =>
                    seen.has(i.uri) ? false : (seen.add(i.uri), true)
                );
            });
        }
    };

    const removeExistingPhoto = (photoId: string, url: string) => {
        setPhotoDetails((prev) => prev.filter((p) => p.id !== photoId));
        setPhotosToDelete((prev) => [...prev, {id: photoId, url}]);
    };

    const removeNewAsset = (uri: string) => {
        setNewAssets((prev) => prev.filter((a) => a.uri !== uri));
    };

    const handleSetCover = async (photoId: string) => {
        if (!id) return;

        try {
            const success = await setCoverImage(id as string, photoId);

            if (success) {
                // Update local state
                setPhotoDetails((prev) =>
                    prev.map((p) => ({
                        ...p,
                        is_cover: p.id === photoId,
                    }))
                );
                Alert.alert("Success", "Cover image updated!");
                setSelectingCover(false);
            } else {
                Alert.alert("Error", "Failed to update cover image");
            }
        } catch (error) {
            console.error("Error setting cover:", error);
            Alert.alert("Error", "Failed to update cover image");
        }
    };

    const deletePhotosFromStorage = async (
        photos: Array<{ id: string; url: string }>
    ) => {
        for (const photo of photos) {
            try {
                // Extract the file path from the URL
                const urlParts = photo.url.split("/");
                const fileName = urlParts[urlParts.length - 1];
                const propertyId = urlParts[urlParts.length - 2];
                const filePath = `properties/${propertyId}/${fileName}`;

                const {error} = await supabase.storage
                    .from("property-images")
                    .remove([filePath]);

                if (error) {
                    console.error("Error deleting photo:", error);
                }

                // Delete from property_photos table
                await supabase.from("property_photos").delete().eq("id", photo.id);
            } catch (error) {
                console.error("Error in deletePhotosFromStorage:", error);
            }
        }
    };

    const onSubmit = async (data: AddNewProperty) => {
        try {
            console.log("Updating property data:", data);

            // Update property basic info
            const {error: updateError} = await supabase
                .from("properties")
                .update({
                    title: data.title,
                    description: data.description,
                    city: data.city,
                    postcode: data.postcode,
                    address: data.address,
                    rental_type: data.rental_type,
                    price: data.price,
                    bedrooms: data.bedrooms,
                    bathrooms: data.bathrooms,
                    is_available: isAvailable,
                })
                .eq("id", id);

            if (updateError) throw updateError;

            // Delete removed photos
            if (photosToDelete.length > 0) {
                await deletePhotosFromStorage(photosToDelete);
            }

            // Upload new photos
            if (newAssets.length > 0) {
                const urls = await uploadPropertyImages(id as string, newAssets);

                // If no cover image exists and we uploaded new photos, set the first as cover
                if (!property?.cover_image_url && urls.length > 0) {
                    await setCoverImage(id as string, urls[0]);
                }
            }

            // Update amenities
            if (data.amenities) {
                // Delete existing amenities
                await supabase
                    .from("property_amenities")
                    .delete()
                    .eq("property_id", id);

                // Insert new amenities
                if (data.amenities.length > 0) {
                    const amenityRecords = data.amenities.map((amenityId) => ({
                        property_id: id,
                        amenity_id: amenityId,
                    }));

                    const {error: amenitiesError} = await supabase
                        .from("property_amenities")
                        .insert(amenityRecords);

                    if (amenitiesError) {
                        console.error("Error updating amenities:", amenitiesError);
                    }
                }
            }

            Alert.alert("Success", "Property updated successfully!", [
                {
                    text: "OK",
                    onPress: () => {
                        router.back();
                    },
                },
            ]);
        } catch (error) {
            console.error("Error updating property:", error);
            Alert.alert("Error", "Failed to update property.");
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer} edges={["top", "bottom"]}>
                <ActivityIndicator size="large" color={colours.primary}/>
                <Text style={styles.loadingText}>Loading property...</Text>
            </SafeAreaView>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
        >
            <View style={styles.form}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Basic Information</Text>

                    <Controller
                        control={control}
                        name="title"
                        render={({field: {onChange, onBlur, value}}) => (
                            <Input
                                label="Property Title"
                                placeholder="e.g., Modern 2-bed apartment in City Centre"
                                onChangeText={onChange}
                                onBlur={onBlur}
                                value={value}
                                errorMessage={errors.title?.message}
                                testID="title-input"
                                style={styles.input}
                            />
                        )}
                    />

                    <Controller
                        control={control}
                        name="description"
                        render={({field: {onChange, onBlur, value}}) => (
                            <Input
                                label="Description"
                                placeholder="Describe your property..."
                                onChangeText={onChange}
                                onBlur={onBlur}
                                value={value}
                                errorMessage={errors.description?.message}
                                testID="description-input"
                                style={styles.input}
                                multiline
                                numberOfLines={4}
                            />
                        )}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Location</Text>

                    <Controller
                        control={control}
                        name="address"
                        render={({field: {onChange, onBlur, value}}) => (
                            <Input
                                label="Street Address"
                                placeholder="e.g., 123 Main Street"
                                onChangeText={onChange}
                                onBlur={onBlur}
                                value={value}
                                errorMessage={errors.address?.message}
                                testID="address-input"
                                style={styles.input}
                            />
                        )}
                    />

                    <View style={styles.row}>
                        <View style={styles.halfWidth}>
                            <Controller
                                control={control}
                                name="city"
                                render={({field: {onChange, onBlur, value}}) => (
                                    <Input
                                        label="City"
                                        placeholder="e.g., London"
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        value={value}
                                        errorMessage={errors.city?.message}
                                        testID="city-input"
                                        style={styles.input}
                                    />
                                )}
                            />
                        </View>

                        <View style={styles.halfWidth}>
                            <Controller
                                control={control}
                                name="postcode"
                                render={({field: {onChange, onBlur, value}}) => (
                                    <Input
                                        label="Postcode"
                                        placeholder="e.g., SW1A 1AA"
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        value={value}
                                        errorMessage={errors.postcode?.message}
                                        testID="postcode-input"
                                        style={styles.input}
                                    />
                                )}
                            />
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Property Details</Text>

                    <Controller
                        control={control}
                        name="rental_type"
                        render={({field: {onChange, value}, fieldState: {error}}) => (
                            <RentalTypeSelector
                                value={value}
                                onChange={onChange}
                                error={error?.message}
                            />
                        )}
                    />

                    <Controller
                        control={control}
                        name="price"
                        render={({field: {onChange, onBlur, value}}) => (
                            <Input
                                label={getPriceLabel()}
                                placeholder={getPricePlaceholder()}
                                onChangeText={(text) => onChange(text ? Number(text) : 0)}
                                onBlur={onBlur}
                                value={value ? value.toString() : ""}
                                keyboardType="numeric"
                                errorMessage={errors.price?.message}
                                testID="price-input"
                                style={styles.input}
                            />
                        )}
                    />

                    <View style={styles.row}>
                        <View style={styles.halfWidth}>
                            <Controller
                                control={control}
                                name="bedrooms"
                                render={({field: {onChange, onBlur, value}}) => (
                                    <Input
                                        label="Bedrooms"
                                        placeholder="e.g., 2"
                                        onChangeText={(text) => onChange(text ? Number(text) : 0)}
                                        onBlur={onBlur}
                                        value={value ? value.toString() : ""}
                                        keyboardType="numeric"
                                        errorMessage={errors.bedrooms?.message}
                                        testID="bedrooms-input"
                                        style={styles.input}
                                    />
                                )}
                            />
                        </View>

                        <View style={styles.halfWidth}>
                            <Controller
                                control={control}
                                name="bathrooms"
                                render={({field: {onChange, onBlur, value}}) => (
                                    <Input
                                        label="Bathrooms"
                                        placeholder="e.g., 1"
                                        onChangeText={(text) => onChange(text ? Number(text) : 0)}
                                        onBlur={onBlur}
                                        value={value ? value.toString() : ""}
                                        keyboardType="numeric"
                                        errorMessage={errors.bathrooms?.message}
                                        testID="bathrooms-input"
                                        style={styles.input}
                                    />
                                )}
                            />
                        </View>
                    </View>

                    <View style={styles.availabilityContainer}>
                        <View style={styles.availabilityLabel}>
                            <MaterialIcons
                                name={isAvailable ? "check-circle" : "cancel"}
                                size={20}
                                color={isAvailable ? colours.success : colours.muted}
                            />
                            <Text style={styles.availabilityText}>Available for Rent</Text>
                        </View>
                        <Switch
                            value={isAvailable}
                            onValueChange={setIsAvailable}
                            trackColor={{
                                false: colours.border,
                                true: colours.primaryLight,
                            }}
                            thumbColor={isAvailable ? colours.primary : colours.muted}
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <Controller
                        control={control}
                        name="amenities"
                        render={({field: {onChange, value}, fieldState: {error}}) => (
                            <AmenitySelector
                                selectedAmenities={value || []}
                                onChange={onChange}
                                error={error?.message}
                            />
                        )}
                    />
                </View>

                <View style={styles.section}>
                    <View style={styles.photoHeader}>
                        <Text style={styles.sectionTitle}>Photos</Text>
                        {photoDetails.length > 0 && (
                            <Pressable
                                onPress={() => setSelectingCover(!selectingCover)}
                                style={styles.setCoverButton}
                            >
                                <MaterialIcons
                                    name={selectingCover ? "close" : "image"}
                                    size={20}
                                    color={colours.primary}
                                />
                                <Text style={styles.setCoverText}>
                                    {selectingCover ? "Cancel" : "Set Cover"}
                                </Text>
                            </Pressable>
                        )}
                    </View>

                    {selectingCover && (
                        <Text style={styles.coverHint}>
                            Tap a photo to set it as the cover image
                        </Text>
                    )}

                    <View style={styles.photoGrid}>
                        {/* Add tile */}
                        <Pressable
                            onPress={pickImages}
                            style={({pressed}) => [
                                styles.addTile,
                                pressed && {opacity: 0.8},
                                selectingCover && {opacity: 0.6},
                            ]}
                            disabled={selectingCover}
                            accessibilityLabel="Add photos"
                        >
                            <MaterialIcons
                                name="add-a-photo"
                                size={24}
                                color={colours.primary}
                            />
                            <Text style={styles.addTileText}>Add photos</Text>
                        </Pressable>

                        {/* Existing photos */}
                        {photoDetails.map((photo) => (
                            <Pressable
                                key={photo.id}
                                onPress={() => selectingCover && handleSetCover(photo.id)}
                                disabled={!selectingCover}
                                style={styles.thumbWrapper}
                            >
                                <Image source={{uri: photo.image_url}} style={styles.thumb}/>
                                {photo.is_cover && (
                                    <View style={styles.coverBadge}>
                                        <MaterialIcons name="star" size={12} color="#fff"/>
                                        <Text style={styles.coverBadgeText}>Cover</Text>
                                    </View>
                                )}
                                {selectingCover && !photo.is_cover && (
                                    <View style={styles.selectOverlay}>
                                        <MaterialIcons
                                            name="check-circle"
                                            size={32}
                                            color={colours.primary}
                                        />
                                    </View>
                                )}
                                {!selectingCover && (
                                    <Pressable
                                        onPress={() =>
                                            removeExistingPhoto(photo.id, photo.image_url)
                                        }
                                        style={({pressed}) => [
                                            styles.removeBtn,
                                            pressed && {opacity: 0.8},
                                        ]}
                                        accessibilityLabel="Remove photo"
                                    >
                                        <MaterialIcons name="close" size={16} color="#fff"/>
                                    </Pressable>
                                )}
                            </Pressable>
                        ))}

                        {/* New assets to be uploaded */}
                        {!selectingCover &&
                            newAssets.map((a) => (
                                <View key={a.uri} style={styles.thumbWrapper}>
                                    <Image source={{uri: a.uri}} style={styles.thumb}/>
                                    <View style={styles.newBadge}>
                                        <Text style={styles.newBadgeText}>New</Text>
                                    </View>
                                    <Pressable
                                        onPress={() => removeNewAsset(a.uri)}
                                        style={({pressed}) => [
                                            styles.removeBtn,
                                            pressed && {opacity: 0.8},
                                        ]}
                                        accessibilityLabel="Remove photo"
                                    >
                                        <MaterialIcons name="close" size={16} color="#fff"/>
                                    </Pressable>
                                </View>
                            ))}
                    </View>
                    <Text style={styles.photoHint}>
                        {selectingCover
                            ? "Tap a photo to set it as your cover image"
                            : "Add, remove, or set a cover image. Changes will be saved when you update the property."}
                    </Text>
                </View>

                <View style={styles.buttonRow}>
                    <Button
                        title="Cancel"
                        onPress={() => router.back()}
                        buttonStyle={[styles.button, styles.cancelButton]}
                        titleStyle={styles.cancelButtonText}
                        testID="cancel-button"
                    />
                    <Button
                        title="Update Property"
                        onPress={handleSubmit(onSubmit)}
                        disabled={isSubmitting}
                        loading={isSubmitting}
                        buttonStyle={[styles.button, styles.submitButton]}
                        testID="update-property-button"
                    />
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colours.background,
    },
    contentContainer: {
        padding: 20,
        paddingBottom: 40,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colours.background,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: colours.textSecondary,
    },
    header: {
        alignItems: "center",
        marginBottom: 32,
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
        color: colours.text,
        marginTop: 12,
    },
    subtitle: {
        fontSize: 20,
        color: colours.textSecondary,
        marginTop: 4,
    },
    form: {
        width: "100%",
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: colours.text,
        marginBottom: 16,
    },
    input: {
        backgroundColor: colours.surface,
        borderColor: colours.border,
        borderRadius: 12,
    },
    row: {
        flexDirection: "row",
        gap: 12,
    },
    halfWidth: {
        flex: 1,
    },
    availabilityContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: colours.surface,
        padding: 16,
        borderRadius: 12,
        marginTop: 8,
    },
    availabilityLabel: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    availabilityText: {
        fontSize: 16,
        fontWeight: "500",
        color: colours.text,
    },
    photoHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    setCoverButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: colours.primaryLight,
        borderRadius: 8,
    },
    setCoverText: {
        fontSize: 14,
        fontWeight: "600",
        color: colours.primary,
    },
    coverHint: {
        fontSize: 12,
        color: colours.textSecondary,
        marginBottom: 12,
        fontStyle: "italic",
    },
    photoGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
    },
    addTile: {
        width: 96,
        height: 96,
        borderRadius: 12,
        borderWidth: 1,
        borderStyle: "dashed",
        borderColor: colours.primary,
        backgroundColor: colours.surface,
        alignItems: "center",
        justifyContent: "center",
    },
    addTileText: {
        marginTop: 6,
        fontSize: 12,
        color: colours.primary,
        fontWeight: "600",
    },
    thumbWrapper: {
        width: 96,
        height: 96,
        borderRadius: 12,
        overflow: "hidden",
        position: "relative",
        backgroundColor: colours.surface,
    },
    thumb: {
        width: "100%",
        height: "100%",
    },
    coverBadge: {
        position: "absolute",
        bottom: 6,
        left: 6,
        backgroundColor: colours.primary,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        flexDirection: "row",
        alignItems: "center",
        gap: 3,
    },
    coverBadgeText: {
        fontSize: 10,
        fontWeight: "600",
        color: "#fff",
    },
    selectOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        alignItems: "center",
        justifyContent: "center",
    },
    newBadge: {
        position: "absolute",
        bottom: 6,
        left: 6,
        backgroundColor: colours.success,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    newBadgeText: {
        fontSize: 10,
        fontWeight: "600",
        color: "#fff",
    },
    removeBtn: {
        position: "absolute",
        top: 6,
        right: 6,
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: "rgba(0,0,0,0.6)",
        alignItems: "center",
        justifyContent: "center",
    },
    photoHint: {
        marginTop: 8,
        fontSize: 12,
        color: colours.textSecondary,
    },
    buttonRow: {
        flexDirection: "row",
        gap: 12,
        marginTop: 8,
    },
    button: {
        flex: 1,
        borderRadius: 12,
        minHeight: 52,
    },
    cancelButton: {
        backgroundColor: colours.surface,
        borderWidth: 1,
        borderColor: colours.border,
    },
    cancelButtonText: {
        color: colours.text,
    },
    submitButton: {
        backgroundColor: colours.primary,
    },
});
