import { ImageSourceType } from "@/enums/image-source-type";
import { supabase } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";
import { decode } from "base64-arraybuffer";
import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";

/**
 * @description Opens the image picker to select an image from the device's library.
 * @param sourceType The source type - 'library' for photo library or 'camera' for camera
 * @returns {Promise<ImagePicker.ImagePickerAsset | null>} The selected image asset or null if no image was selected.
 * @throws Will throw an error if the image picker fails.
 */
export const pickImage = async (
  sourceType: ImageSourceType = ImageSourceType.Library
): Promise<ImagePicker.ImagePickerAsset | null> => {
  try {
    // Request permissions based on source type
    if (sourceType === "camera") {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant camera permission to take photos"
        );
        return null;
      }
    } else {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant permission to access your photos"
        );
        return null;
      }
    }

    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.3,
      base64: true,
    };

    // Launch appropriate picker
    const result =
      sourceType === "camera"
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);

    if (!result.canceled && result.assets && result.assets[0]) {
      const image = result.assets[0];
      return image; // Return the selected image object
    }
  } catch (error) {
    console.error("Image picker error:", error);
    Alert.alert(
      "Error",
      "There was a problem selecting or processing the image."
    );
  }
  return null; // Return null if no image was selected or an error occurred
};

/**
 *
 * @description Uploads an image to Supabase storage and returns the public URL.
 * @param image The image to upload, as returned by ImagePicker
 * @param bucketName The name of the Supabase storage bucket to upload to
 * @param session The current user session, used to determine the file path
 * @param folder Optional folder path (e.g., propertyId for property photos)
 * @returns {Promise<string | null>} The public URL of the uploaded image, or null if the upload fails
 * @throws Will throw an error if the upload fails.
 */
export const uploadImageToStorage = async (
  image: ImagePicker.ImageInfo,
  bucketName: string,
  session: Session,
  folder?: string
): Promise<string | null> => {
  if (!image.base64 || !session?.user) {
    Alert.alert("Error", "No image selected or user session not found.");
    return null;
  }

  try {
    // Convert base64 string to ArrayBuffer
    const arrayBuffer = decode(image.base64);

    // Create unique file path
    const fileName = `${session.user.id}_${Date.now()}.jpg`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    console.log(
      `Uploading image: ${filePath}, size: ${arrayBuffer.byteLength} bytes`
    );
    console.log(`Bucket: ${bucketName}, User ID: ${session.user.id}`);

    // Upload image
    const { data, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, arrayBuffer, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (uploadError) {
      console.error("Supabase upload error details:", {
        message: uploadError.message,
        // statusCode: uploadError.statusCode,
        // error: uploadError.error,
        name: uploadError.name,
      });
      throw uploadError;
    }

    if (!data) {
      throw new Error("Upload succeeded but no data returned");
    }

    console.log("Upload data:", data);

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    if (publicUrlData) {
      console.log(`Upload successful: ${publicUrlData.publicUrl}`);
      return publicUrlData.publicUrl;
    } else {
      throw new Error("Failed to get public URL");
    }
  } catch (error: any) {
    console.error("Error uploading image details:", error);
    console.error("Error name:", error?.name);
    console.error("Error message:", error?.message);
    console.error("Error stack:", error?.stack);
    throw new Error(
      `Upload Error: ${
        error?.message || "Failed to upload file. Please try again."
      }`
    );
  }
};

/**
 *
 * @description Removes an image from Supabase storage.
 * @param mediaUrl The URL of the file to remove from storage
 * @param bucketName The name of the Supabase storage bucket
 * @returns {Promise<void>} Resolves when the image is successfully removed
 * @throws Will throw an error if the removal fails.
 */
export const removeImageFromStorage = async (
  mediaUrl: string,
  bucketName: string
): Promise<void> => {
  try {
    const filePath = mediaUrl.split("/").pop(); // Extract the file name from the URL
    if (!filePath) {
      throw new Error("Invalid media URL: Unable to extract file path.");
    }
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);
    if (error) {
      console.error("Error removing image:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error removing image from storage:", error);
    Alert.alert("Error", "Failed to remove image from storage.");
  }
};
