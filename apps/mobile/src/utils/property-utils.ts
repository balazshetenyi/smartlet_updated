import { supabase } from "@/lib/supabase";
import { Property, PropertyWithLandlord } from "@/types/property";
import * as ImagePicker from "expo-image-picker";
import { uploadImageToStorage } from "./image-picker-utils";

/**
 * Fetches all properties from the Supabase database.
 * @returns {Promise<Property[]>} A promise that resolves to an array of properties.
 * @throws Will throw an error if the fetch operation fails.
 */
export const fetchAllProperties = async (): Promise<{
  long_term_properties: Property[];
  short_term_properties: Property[];
  holiday_properties: Property[];
}> => {
  try {
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .eq("is_available", true)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Error fetching properties: ${error.message}`);
    }

    const allProperties = data || [];
    if (allProperties.length) {
      const ids = allProperties.map((p) => p.id);
      const map = await fetchCoverImageUrls(ids);
      for (const property of allProperties) {
        if (map[property.id]) {
          property.cover_image_url = map[property.id];
        }
      }
    }

    const long_term_properties = allProperties.filter(
      (p) => p.rental_type === "long_term",
    );
    const short_term_properties = allProperties.filter(
      (p) => p.rental_type === "short_term",
    );
    const holiday_properties = allProperties.filter(
      (p) => p.rental_type === "holiday",
    );

    return {
      long_term_properties,
      short_term_properties,
      holiday_properties,
    };
  } catch (error) {
    console.error("Error fetching properties:", error);
    throw error;
  }
};

// const fetchProperties = useCallback(async () => {
//     try {
//       const { data, error } = await supabase
//         .from("properties")
//         .select("*")
//         .eq("is_available", true)
//         .order("created_at", { ascending: false });

//       if (error) throw error;

//       const allProperties = data || [];
//       setProperties(allProperties);
//       setFilteredProperties(allProperties);

//       // Separate by rental type
//       setLongTermProperties(
//         allProperties.filter((p) => p.rental_type === "long_term")
//       );
//       setShortTermProperties(
//         allProperties.filter((p) => p.rental_type === "short_term")
//       );
//       setHolidayProperties(
//         allProperties.filter((p) => p.rental_type === "holiday")
//       );

//       // Fetch cover images
//       if (allProperties.length) {
//         const ids = allProperties.map((p) => p.id);
//         const map = await fetchCoverImageUrls(ids);
//         setCoverMap(map);
//       } else {
//         setCoverMap({});
//       }
//     } catch (error) {
//       console.error("Error fetching properties:", error);
//       Alert.alert("Error", "Failed to load properties");
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   }, []);

/**
 * Fetches a property by its ID from the Supabase database.
 * @param {string} id - The ID of the property to fetch.
 * @returns {Promise<Property | null>} A promise that resolves to the property or null if not found.
 */
export const fetchPropertyById = async (
  id: string,
): Promise<Property | null> => {
  try {
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(`Error fetching property with ID ${id}:`, error);
      return null;
    }

    return data as Property;
  } catch (error) {
    console.error("Unexpected error fetching property:", error);
    return null;
  }
};

/**
 * Creates a new property in the Supabase database.
 * @param {Partial<Property>} property - The property object to create.
 * @param {string[]} amenityIds - Optional array of amenity IDs to associate with the property.
 * @returns {Promise<Property>} A promise that resolves to the created property.
 * @throws Will throw an error if the creation operation fails.
 */
export const createProperty = async (
  property: Partial<Property>,
  amenityIds?: string[],
): Promise<Property> => {
  try {
    // Remove amenities from a property object if it exists (it shouldn't be in the properties table)
    const { amenities, ...propertyData } = property as any;

    const { data, error } = await supabase
      .from("properties")
      .insert(propertyData)
      .select();

    if (error) {
      console.log("Error creating property:", error);
      throw new Error(`Error creating property: ${error.message}`);
    }

    const createdProperty = data[0] as Property;

    // Insert amenities if provided
    if (amenityIds && amenityIds.length > 0 && createdProperty.id) {
      const amenityRecords = amenityIds.map((amenityId) => ({
        property_id: createdProperty.id,
        amenity_id: amenityId,
      }));

      const { error: amenitiesError } = await supabase
        .from("property_amenities")
        .insert(amenityRecords);

      if (amenitiesError) {
        console.error("Error inserting amenities:", amenitiesError);
        // Don't throw an error here, property is still created
      }
    }

    return createdProperty;
  } catch (error) {
    console.error("Error creating property:", error);
    throw error;
  }
};

/**
 * Updates an existing property in the Supabase database.
 * @param {string} id - The ID of the property to update.
 * @param {Partial<Property>} updates - The updates to apply to the property.
 * @returns {Promise<Property>} A promise that resolves to the updated property.
 * @throws Will throw an error if the update operation fails.
 */
export const updateProperty = async (
  id: string,
  updates: Partial<Property>,
): Promise<Property> => {
  try {
    const { data, error } = await supabase
      .from("properties")
      .update(updates)
      .eq("id", id)
      .single();

    if (error) {
      throw new Error(
        `Error updating property with ID ${id}: ${error.message}`,
      );
    }

    return data as Property;
  } catch (error) {
    console.error("Error updating property:", error);
    throw error;
  }
};

/**
 * Deletes a property by its ID from the Supabase database.
 * @param {string} id - The ID of the property to delete.
 * @returns {Promise<void>} A promise that resolves when the property is deleted.
 * @throws Will throw an error if the deletion operation fails.
 */
export const deleteProperty = async (id: string): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from("properties")
      .delete()
      .eq("id", id)
      .select("id");

    if (error) {
      throw new Error(
        `Error deleting property with ID ${id}: ${error.message}`,
      );
    }
    return data;
  } catch (error) {
    console.error("Error deleting property:", error);
    throw error;
  }
};

/**
 * Uploads one or more images to Supabase Storage and creates DB records in `property_photos`.
 * - Storage bucket: `property-photos`
 * - Path: `${userId}_${timestamp}.jpg`
 * Returns the array of public URLs.
 */
export const uploadPropertyImages = async (
  propertyId: string,
  assets: Array<ImagePicker.ImagePickerAsset>,
): Promise<string[]> => {
  if (!assets || assets.length === 0) return [];

  const bucket = "property-photos";
  const urls: string[] = [];

  // Get current session
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    console.error("No active session found");
    return [];
  }

  for (const asset of assets) {
    try {
      // Pass propertyId as folder so path becomes: propertyId/userId_timestamp.jpg
      const publicUrl = await uploadImageToStorage(
        asset,
        bucket,
        session,
        propertyId,
      );

      if (!publicUrl) {
        console.error("Failed to upload image");
        continue;
      }

      urls.push(publicUrl);

      // Insert record in property_photos table
      const { error: insertError } = await supabase
        .from("property_photos")
        .insert({ property_id: propertyId, image_url: publicUrl });

      if (insertError) {
        console.error("Error inserting property photo record:", insertError);
      }
    } catch (err) {
      console.error("Unexpected error uploading image:", err);
    }
  }

  return urls;
};

/**
 * Fetches properties with their landlords from the Supabase database.
 * @returns {Promise<PropertyWithLandlord[]>} A promise that resolves to an array of properties with landlords.
 */
export const fetchPropertiesWithLandlords = async (): Promise<
  PropertyWithLandlord[]
> => {
  try {
    const { data, error } = await supabase.from("properties").select(`
        *,
        profiles:landlord_id (
          id,
          first_name,
          last_name,
          email
        )
      `);

    if (error) {
      throw new Error(
        `Error fetching properties with landlords: ${error.message}`,
      );
    }

    return data as PropertyWithLandlord[];
  } catch (error) {
    console.error("Error fetching properties with landlords:", error);
    throw error;
  }
};

/**
 * Fetch cover image URL for a list of property IDs.
 * Returns a map of propertyId -> cover_image_url.
 * Falls back to first photo if no cover is set.
 */
export const fetchCoverImageUrls = async (
  propertyIds: string[],
): Promise<Record<string, string>> => {
  const map: Record<string, string> = {};
  if (!propertyIds.length) return map;

  // First, try to get cover_image_url from properties table
  const { data: properties, error: propError } = await supabase
    .from("properties")
    .select("id, cover_image_url")
    .in("id", propertyIds);

  if (!propError && properties) {
    for (const prop of properties) {
      if (prop.cover_image_url) {
        map[prop.id] = prop.cover_image_url;
      }
    }
  }

  // For properties without cover_image_url, get first photo
  const missingIds = propertyIds.filter((id) => !map[id]);
  if (missingIds.length > 0) {
    const { data, error } = await supabase
      .from("property_photos")
      .select("property_id, image_url")
      .in("property_id", missingIds)
      .order("id", { ascending: true });

    if (!error && data) {
      for (const row of data) {
        if (!map[row.property_id]) {
          map[row.property_id] = row.image_url as string;
        }
      }
    }
  }

  return map;
};

/** Fetch all photo URLs for a property with their metadata */
export const fetchPropertyPhotos = async (
  propertyId: string,
): Promise<string[]> => {
  const { data, error } = await supabase
    .from("property_photos")
    .select("id, image_url, is_cover")
    .eq("property_id", propertyId)
    .order("is_cover", { ascending: false }) // Cover image first
    .order("id", { ascending: true });

  if (error) {
    console.error("Error fetching property photos:", error);
    return [];
  }
  return (data || []).map((r: any) => r.image_url as string);
};

/** Fetch all photo details for a property including metadata */
export const fetchPropertyPhotoDetails = async (
  propertyId: string,
): Promise<Array<{ id: string; image_url: string; is_cover: boolean }>> => {
  const { data, error } = await supabase
    .from("property_photos")
    .select("id, image_url, is_cover")
    .eq("property_id", propertyId)
    .order("is_cover", { ascending: false }) // Cover image first
    .order("id", { ascending: true });

  if (error) {
    console.error("Error fetching property photo details:", error);
    return [];
  }

  // Ensure is_cover is always a boolean
  return (data || []).map((photo: any) => ({
    id: photo.id,
    image_url: photo.image_url,
    is_cover: photo.is_cover === true,
  }));
};

/**
 * Set a photo as the cover image for a property
 * Updates the is_cover field in property_photos table
 */
export const setCoverImage = async (
  propertyId: string,
  photoId: string,
): Promise<boolean> => {
  try {
    // First, unset all existing cover images for this property
    const { error: unsetError } = await supabase
      .from("property_photos")
      .update({ is_cover: false })
      .eq("property_id", propertyId);

    if (unsetError) {
      console.error("Error unsetting cover images:", unsetError);
      return false;
    }

    // Then set the new cover image
    const { error: setError } = await supabase
      .from("property_photos")
      .update({ is_cover: true })
      .eq("id", photoId)
      .eq("property_id", propertyId);

    if (setError) {
      console.error("Error setting cover image:", setError);
      return false;
    }

    // Update the property's cover_image_url for backward compatibility
    const { data: photoData } = await supabase
      .from("property_photos")
      .select("image_url")
      .eq("id", photoId)
      .single();

    if (photoData) {
      await supabase
        .from("properties")
        .update({ cover_image_url: photoData.image_url })
        .eq("id", propertyId);
    }

    return true;
  } catch (error) {
    console.error("Unexpected error setting cover image:", error);
    return false;
  }
};
