"use client";

import { createClient } from "@/lib/supabase/client";
import { generateListingContent } from "@kiado/shared/services/ai-service";
import type { GenerateListingResult } from "@kiado/shared/services/ai-service";
import type { Amenity, PropertyPhoto } from "@kiado/shared/services/property-service";
import type { PropertyFormData } from "@kiado/shared/schemas/property";
import type { Property } from "@kiado/shared/types/property";
import { useRef, useState } from "react";
import PhotoManager from "./PhotoManager";
import PropertyForm from "./PropertyForm";

const photoUrlToBase64 = async (
  url: string,
): Promise<{ base64: string; mimeType: string } | null> => {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve({ base64: result.split(",")[1], mimeType: blob.type || "image/jpeg" });
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

interface Props {
  propertyId: string;
  property: Property;
  amenities: Amenity[];
  selectedAmenityIds: string[];
  initialPhotos: PropertyPhoto[];
  handleUpdate: (data: PropertyFormData, amenityIds: string[]) => Promise<{ error?: string }>;
}

export default function EditPropertyClient({
  propertyId,
  property,
  amenities,
  selectedAmenityIds,
  initialPhotos,
  handleUpdate,
}: Props) {
  const [currentPhotos, setCurrentPhotos] = useState<PropertyPhoto[]>(initialPhotos);
  const supabaseRef = useRef(createClient());

  const handleGenerate = async (
    values: PropertyFormData,
  ): Promise<GenerateListingResult | null> => {
    try {
      const results = await Promise.all(
        currentPhotos.slice(0, 3).map((p) => photoUrlToBase64(p.image_url)),
      );
      const images = results.filter(Boolean) as Array<{ base64: string; mimeType: string }>;
      return await generateListingContent(supabaseRef.current, { ...values, images });
    } catch {
      return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
          Photos
        </h2>
        <PhotoManager
          propertyId={propertyId}
          initialPhotos={initialPhotos}
          onPhotosChange={setCurrentPhotos}
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-5">
          Details
        </h2>
        <PropertyForm
          property={property}
          amenities={amenities}
          selectedAmenityIds={selectedAmenityIds}
          action={handleUpdate}
          onGenerate={currentPhotos.length > 0 ? handleGenerate : undefined}
          submitLabel="Save changes"
        />
      </div>
    </div>
  );
}
