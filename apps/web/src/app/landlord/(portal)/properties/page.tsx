import { createClient } from "@/lib/supabase/server";
import { Building2, BedDouble, Bath, Users, Plus } from "lucide-react";
import Link from "next/link";

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

export default async function PropertiesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: properties } = await supabase
    .from("properties")
    .select("id, title, city, address, price, rental_type, bedrooms, bathrooms, max_guests, is_available, cover_image_url")
    .eq("landlord_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#2C3E50]">Properties</h1>
          <p className="text-gray-500 text-sm mt-1">
            {properties?.length ?? 0} listing
            {(properties?.length ?? 0) !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="https://kiado.co.uk"
          className="flex items-center gap-2 bg-[#7C6CFF] hover:bg-[#6B5CE7] text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus size={16} />
          Add property
        </Link>
      </div>

      {!properties || properties.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 py-16 text-center">
          <Building2 size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No properties listed yet</p>
          <p className="text-gray-400 text-xs mt-1">
            Add your first property from the mobile app
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {properties.map((property) => (
            <div
              key={property.id}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex hover:shadow-sm transition-shadow"
            >
              <div className="w-40 h-32 flex-shrink-0 bg-gray-100">
                {property.cover_image_url ? (
                  <img
                    src={property.cover_image_url}
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building2 size={24} className="text-gray-300" />
                  </div>
                )}
              </div>

              <div className="flex-1 p-5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-[#2C3E50]">
                      {property.title}
                    </h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        property.is_available
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {property.is_available ? "Available" : "Unavailable"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">
                    {property.address}, {property.city}
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <BedDouble size={13} />
                      {property.bedrooms} bed
                    </span>
                    <span className="flex items-center gap-1">
                      <Bath size={13} />
                      {property.bathrooms} bath
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={13} />
                      {property.max_guests} guests
                    </span>
                    <span className="bg-gray-100 px-2 py-0.5 rounded-full">
                      {rentalTypeLabel[property.rental_type] ?? property.rental_type}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-[#2C3E50]">
                    £{(property.price ?? 0).toLocaleString("en-GB")}
                  </p>
                  <p className="text-xs text-gray-400">
                    per {rentalTypePriceUnit[property.rental_type] ?? "period"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
