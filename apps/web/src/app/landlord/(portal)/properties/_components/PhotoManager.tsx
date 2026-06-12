"use client";

import { createClient } from "@/lib/supabase/client";
import {
  deletePropertyPhoto,
  setPropertyCoverPhoto,
} from "@kiado/shared/services/property-service";
import type { PropertyPhoto } from "@kiado/shared/services/property-service";
import { ImagePlus, Loader2, Star, X } from "lucide-react";
import { useRef, useState } from "react";

interface Props {
  propertyId: string;
  initialPhotos: PropertyPhoto[];
  onPhotosChange?: (photos: PropertyPhoto[]) => void;
}

export default function PhotoManager({ propertyId, initialPhotos, onPhotosChange }: Props) {
  const [photos, setPhotos] = useState<PropertyPhoto[]>(initialPhotos);

  const updatePhotos = (next: PropertyPhoto[]) => {
    setPhotos(next);
    onPhotosChange?.(next);
  };
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingCoverId, setSettingCoverId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (files: FileList) => {
    if (!files.length) return;
    setUploading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setUploading(false);
      return;
    }

    const newPhotos: PropertyPhoto[] = [];

    for (const [index, file] of Array.from(files).entries()) {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${propertyId}/${user.id}_${Date.now()}_${index}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("property-photos")
        .upload(path, file, { upsert: false });

      if (uploadError) continue;

      const {
        data: { publicUrl },
      } = supabase.storage.from("property-photos").getPublicUrl(path);

      // First photo overall = no existing photos AND nothing accumulated yet this batch
      const isFirstEver = photos.length === 0 && newPhotos.length === 0;

      const { data: photo } = await supabase
        .from("property_photos")
        .insert({
          property_id: propertyId,
          image_url: publicUrl,
          is_cover: isFirstEver,
        })
        .select("id, image_url, is_cover")
        .single();

      if (photo) {
        if (isFirstEver) {
          await supabase
            .from("properties")
            .update({ cover_image_url: publicUrl })
            .eq("id", propertyId);
        }
        newPhotos.push({
          id: photo.id,
          image_url: photo.image_url,
          is_cover: photo.is_cover ?? false,
        });
      }
    }

    if (newPhotos.length > 0) {
      // Use functional update to avoid stale closure — don't read `photos` here
      setPhotos((prev) => {
        const next = [...prev, ...newPhotos];
        onPhotosChange?.(next);
        return next;
      });
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDelete = async (photo: PropertyPhoto) => {
    setDeletingId(photo.id);
    const supabase = createClient();
    await deletePropertyPhoto(supabase, photo.id, photo.image_url);

    const remaining = photos.filter((p) => p.id !== photo.id);

    if (photo.is_cover && remaining.length > 0) {
      const next = remaining[0];
      await setPropertyCoverPhoto(supabase, propertyId, next.id, next.image_url);
      updatePhotos(remaining.map((p, i) => ({ ...p, is_cover: i === 0 })));
    } else {
      updatePhotos(remaining);
    }

    setDeletingId(null);
  };

  const handleSetCover = async (photo: PropertyPhoto) => {
    setSettingCoverId(photo.id);
    const supabase = createClient();
    await setPropertyCoverPhoto(supabase, propertyId, photo.id, photo.image_url);
    updatePhotos(photos.map((p) => ({ ...p, is_cover: p.id === photo.id })));
    setSettingCoverId(null);
  };

  return (
    <div>
      <div className="grid grid-cols-3 gap-3">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="relative group aspect-video rounded-xl overflow-hidden bg-gray-100"
          >
            <img
              src={photo.image_url}
              alt=""
              className="w-full h-full object-contain"
            />

            {photo.is_cover && (
              <span className="absolute top-2 left-2 bg-[#7C6CFF] text-white text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                <Star size={10} fill="currentColor" />
                Cover
              </span>
            )}

            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              {!photo.is_cover && (
                <button
                  onClick={() => handleSetCover(photo)}
                  disabled={settingCoverId === photo.id}
                  className="flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors"
                >
                  {settingCoverId === photo.id ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Star size={12} />
                  )}
                  Set cover
                </button>
              )}
              <button
                onClick={() => handleDelete(photo)}
                disabled={deletingId === photo.id}
                className="flex items-center gap-1 bg-red-500/80 hover:bg-red-500 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors"
              >
                {deletingId === photo.id ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <X size={12} />
                )}
                Remove
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="aspect-video rounded-xl border-2 border-dashed border-gray-200 hover:border-[#7C6CFF] text-gray-400 hover:text-[#7C6CFF] transition-colors flex flex-col items-center justify-center gap-2 disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <ImagePlus size={20} />
          )}
          <span className="text-xs font-medium">
            {uploading ? "Uploading…" : "Add photos"}
          </span>
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleUpload(e.target.files)}
      />
    </div>
  );
}
