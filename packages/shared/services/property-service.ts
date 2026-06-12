import type { SupabaseClient } from "@supabase/supabase-js";
import type { Property } from "../types/property";

export interface Amenity {
  id: string;
  name: string;
  icon?: string | null;
}

export const fetchPropertyById = async (
  client: SupabaseClient,
  id: string,
): Promise<Property | null> => {
  const { data, error } = await client
    .from("properties")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as Property;
};

export const fetchAmenities = async (
  client: SupabaseClient,
): Promise<Amenity[]> => {
  const { data } = await client.from("amenities").select("id, name, icon");
  return (data ?? []) as Amenity[];
};

export const fetchPropertyAmenityIds = async (
  client: SupabaseClient,
  propertyId: string,
): Promise<string[]> => {
  const { data } = await client
    .from("property_amenities")
    .select("amenity_id")
    .eq("property_id", propertyId);
  return (data ?? []).map((r: { amenity_id: string }) => r.amenity_id);
};

export const createProperty = async (
  client: SupabaseClient,
  property: Partial<Property> & { landlord_id: string },
  amenityIds?: string[],
): Promise<Property> => {
  const { amenities, ...propertyData } = property as any;

  const { data, error } = await client
    .from("properties")
    .insert(propertyData)
    .select()
    .single();

  if (error) throw new Error(error.message);
  const created = data as Property;

  if (amenityIds && amenityIds.length > 0) {
    await client.from("property_amenities").insert(
      amenityIds.map((amenity_id) => ({
        property_id: created.id,
        amenity_id,
      })),
    );
  }

  return created;
};

export interface PropertyPhoto {
  id: string;
  image_url: string;
  is_cover: boolean;
}

export const fetchPropertyPhotos = async (
  client: SupabaseClient,
  propertyId: string,
): Promise<PropertyPhoto[]> => {
  const { data } = await client
    .from("property_photos")
    .select("id, image_url, is_cover")
    .eq("property_id", propertyId)
    .order("is_cover", { ascending: false })
    .order("id", { ascending: true });
  return (data ?? []).map((r: any) => ({
    id: r.id,
    image_url: r.image_url,
    is_cover: r.is_cover === true,
  }));
};

export const deletePropertyPhoto = async (
  client: SupabaseClient,
  photoId: string,
  imageUrl: string,
): Promise<void> => {
  const marker = "/storage/v1/object/public/property-photos/";
  const idx = imageUrl.indexOf(marker);
  if (idx !== -1) {
    const path = imageUrl.substring(idx + marker.length);
    await client.storage.from("property-photos").remove([path]);
  }
  await client.from("property_photos").delete().eq("id", photoId);
};

export const setPropertyCoverPhoto = async (
  client: SupabaseClient,
  propertyId: string,
  photoId: string,
  imageUrl: string,
): Promise<void> => {
  await client
    .from("property_photos")
    .update({ is_cover: false })
    .eq("property_id", propertyId);
  await client
    .from("property_photos")
    .update({ is_cover: true })
    .eq("id", photoId);
  await client
    .from("properties")
    .update({ cover_image_url: imageUrl })
    .eq("id", propertyId);
};

export const updateProperty = async (
  client: SupabaseClient,
  id: string,
  updates: Partial<Property>,
  amenityIds?: string[],
): Promise<Property> => {
  const { amenities, ...propertyData } = updates as any;

  const { data, error } = await client
    .from("properties")
    .update(propertyData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  if (amenityIds !== undefined) {
    await client
      .from("property_amenities")
      .delete()
      .eq("property_id", id);

    if (amenityIds.length > 0) {
      await client.from("property_amenities").insert(
        amenityIds.map((amenity_id) => ({ property_id: id, amenity_id })),
      );
    }
  }

  return data as Property;
};
