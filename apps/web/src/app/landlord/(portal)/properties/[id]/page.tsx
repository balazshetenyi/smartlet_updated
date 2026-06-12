import { createClient } from "@/lib/supabase/server";
import {
  fetchPropertyById,
  fetchAmenities,
  fetchPropertyAmenityIds,
  fetchPropertyPhotos,
} from "@kiado/shared/services/property-service";
import PhotoGallery from "../_components/PhotoGallery";
import {
  ArrowLeft,
  BedDouble,
  Bath,
  Users,
  MapPin,
  Pencil,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

const rentalTypeLabel: Record<string, string> = {
  holiday: "Holiday let",
  short_term: "Short-term",
  long_term: "Long-term",
};

const rentalTypePriceUnit: Record<string, string> = {
  holiday: "night",
  short_term: "week",
  long_term: "month",
};

export default async function PropertyDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [property, allAmenities, selectedAmenityIds, photos] = await Promise.all([
    fetchPropertyById(supabase, id),
    fetchAmenities(supabase),
    fetchPropertyAmenityIds(supabase, id),
    fetchPropertyPhotos(supabase, id),
  ]);

  if (!property || property.landlord_id !== user!.id) notFound();

  const selectedAmenities = allAmenities.filter((a) =>
    selectedAmenityIds.includes(a.id),
  );

  const priceUnit = property.rental_type
    ? (rentalTypePriceUnit[property.rental_type] ?? "period")
    : "period";

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/landlord/properties"
            className="text-gray-400 hover:text-[#2C3E50] transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#2C3E50]">
              {property.title}
            </h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  property.is_available
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {property.is_available ? "Available" : "Unavailable"}
              </span>
              {property.rental_type && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {rentalTypeLabel[property.rental_type] ?? property.rental_type}
                </span>
              )}
            </div>
          </div>
        </div>

        <Link
          href={`/landlord/properties/${id}/edit`}
          className="flex items-center gap-2 text-sm font-medium text-[#7C6CFF] border border-[#7C6CFF] px-4 py-2 rounded-xl hover:bg-[#7C6CFF]/5 transition-colors shrink-0"
        >
          <Pencil size={14} />
          Edit
        </Link>
      </div>

      <PhotoGallery photos={photos} title={property.title} />

      <div className="grid gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
            Location
          </h2>
          <div className="flex items-start gap-2 text-sm text-[#2C3E50]">
            <MapPin size={15} className="text-gray-400 mt-0.5 shrink-0" />
            <span>
              {property.address}, {property.city}, {property.postcode}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
            Details
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center">
                <BedDouble size={16} className="text-gray-500" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Bedrooms</p>
                <p className="text-sm font-semibold text-[#2C3E50]">
                  {property.bedrooms}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center">
                <Bath size={16} className="text-gray-500" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Bathrooms</p>
                <p className="text-sm font-semibold text-[#2C3E50]">
                  {property.bathrooms}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center">
                <Users size={16} className="text-gray-500" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Max guests</p>
                <p className="text-sm font-semibold text-[#2C3E50]">
                  {property.max_guests}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center">
                <span className="text-gray-500 text-sm font-bold">£</span>
              </div>
              <div>
                <p className="text-xs text-gray-400">Price</p>
                <p className="text-sm font-semibold text-[#2C3E50]">
                  £{(property.price ?? 0).toLocaleString("en-GB")}{" "}
                  <span className="font-normal text-gray-400">
                    / {priceUnit}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {property.description && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Description
            </h2>
            <p className="text-sm text-[#2C3E50] leading-relaxed whitespace-pre-wrap">
              {property.description}
            </p>
          </div>
        )}

        {selectedAmenities.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Amenities
            </h2>
            <div className="flex flex-wrap gap-2">
              {selectedAmenities.map((amenity) => (
                <span
                  key={amenity.id}
                  className="text-xs bg-[#7C6CFF]/10 text-[#7C6CFF] px-3 py-1.5 rounded-full font-medium"
                >
                  {amenity.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
