import { createClient } from "@/lib/supabase/server";
import {
  fetchPropertyById,
  fetchAmenities,
  fetchPropertyAmenityIds,
  fetchPropertyPhotos,
  updateProperty,
} from "@kiado/shared/services/property-service";
import type { PropertyFormData } from "@kiado/shared/schemas/property";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import EditPropertyClient from "../../_components/EditPropertyClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditPropertyPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [property, amenities, selectedAmenityIds, photos] = await Promise.all([
    fetchPropertyById(supabase, id),
    fetchAmenities(supabase),
    fetchPropertyAmenityIds(supabase, id),
    fetchPropertyPhotos(supabase, id),
  ]);

  if (!property || property.landlord_id !== user!.id) notFound();

  async function handleUpdate(
    data: PropertyFormData,
    amenityIds: string[],
  ): Promise<{ error?: string }> {
    "use server";
    try {
      const supabase = await createClient();
      await updateProperty(supabase, id, data, amenityIds);
    } catch (e) {
      return { error: (e as Error).message };
    }
    redirect(`/landlord/properties/${id}`);
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link
          href={`/landlord/properties/${id}`}
          className="text-gray-400 hover:text-[#2C3E50] transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#2C3E50]">Edit property</h1>
          <p className="text-gray-500 text-sm mt-0.5 truncate max-w-xs">
            {property.title}
          </p>
        </div>
      </div>

      <EditPropertyClient
        propertyId={id}
        property={property}
        amenities={amenities}
        selectedAmenityIds={selectedAmenityIds}
        initialPhotos={photos}
        handleUpdate={handleUpdate}
      />
    </div>
  );
}
