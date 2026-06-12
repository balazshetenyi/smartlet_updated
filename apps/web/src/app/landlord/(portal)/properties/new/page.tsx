"use client";

import { createClient } from "@/lib/supabase/client";
import {
  createProperty,
  fetchAmenities,
} from "@kiado/shared/services/property-service";
import { generateListingContent } from "@kiado/shared/services/ai-service";
import type { Amenity } from "@kiado/shared/services/property-service";
import type { PropertyFormData } from "@kiado/shared/schemas/property";
import type { GenerateListingResult } from "@kiado/shared/services/ai-service";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import PropertyForm from "../_components/PropertyForm";
import PhotoPicker from "../_components/PhotoPicker";

const toBase64 = (file: File): Promise<{ base64: string; mimeType: string }> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve({ base64: result.split(",")[1], mimeType: file.type || "image/jpeg" });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default function NewPropertyPage() {
  const router = useRouter();
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const supabaseRef = useRef(createClient());

  useEffect(() => {
    fetchAmenities(supabaseRef.current).then(setAmenities);
  }, []);

  const handleGenerate = async (
    values: PropertyFormData,
  ): Promise<GenerateListingResult | null> => {
    try {
      const images = await Promise.all(
        selectedFiles.slice(0, 3).map(toBase64),
      );
      return await generateListingContent(supabaseRef.current, {
        ...values,
        images,
      });
    } catch {
      return null;
    }
  };

  const handleCreate = async (
    data: PropertyFormData,
    amenityIds: string[],
  ): Promise<{ error?: string }> => {
    const supabase = supabaseRef.current;
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return { error: "Not authenticated" };

      const property = await createProperty(
        supabase,
        { ...data, landlord_id: user.id, is_available: true },
        amenityIds,
      );

      for (const [index, file] of selectedFiles.entries()) {
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${property.id}/${user.id}_${Date.now()}_${index}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("property-photos")
          .upload(path, file, { upsert: false });

        if (uploadError) {
          return { error: `Photo upload failed: ${uploadError.message}` };
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("property-photos").getPublicUrl(path);

        const isCover = index === 0;
        await supabase.from("property_photos").insert({
          property_id: property.id,
          image_url: publicUrl,
          is_cover: isCover,
        });

        if (isCover) {
          await supabase
            .from("properties")
            .update({ cover_image_url: publicUrl })
            .eq("id", property.id);
        }
      }

      router.push(`/landlord/properties/${property.id}`);
      return {};
    } catch (e) {
      return { error: (e as Error).message };
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/landlord/properties"
          className="text-gray-400 hover:text-[#2C3E50] transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#2C3E50]">Add property</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Fill in the details to create a new listing
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
            Photos
          </h2>
          <PhotoPicker onChange={setSelectedFiles} />
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-5">
            Details
          </h2>
          <PropertyForm
            amenities={amenities}
            action={handleCreate}
            onGenerate={handleGenerate}
            photosAdded={selectedFiles.length > 0}
            submitLabel="Create property"
          />
        </div>
      </div>
    </div>
  );
}
