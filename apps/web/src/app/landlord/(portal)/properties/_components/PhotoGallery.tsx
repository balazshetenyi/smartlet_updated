"use client";

import type { PropertyPhoto } from "@kiado/shared/services/property-service";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

interface Props {
  photos: PropertyPhoto[];
  title: string;
}

export default function PhotoGallery({ photos, title }: Props) {
  const [active, setActive] = useState(0);

  if (photos.length === 0) return null;

  const prev = () => setActive((i) => Math.max(0, i - 1));
  const next = () => setActive((i) => Math.min(photos.length - 1, i + 1));

  return (
    <div className="rounded-2xl overflow-hidden mb-6 bg-gray-100">
      {/* Main photo */}
      <div className="relative h-72 group">
        <img
          src={photos[active].image_url}
          alt={title}
          className="w-full h-full object-contain"
        />

        {photos.length > 1 && (
          <>
            <button
              onClick={prev}
              disabled={active === 0}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={next}
              disabled={active === photos.length - 1}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
            >
              <ChevronRight size={18} />
            </button>

            <span className="absolute bottom-3 right-3 bg-black/50 text-white text-xs font-medium px-2.5 py-1 rounded-full">
              {active + 1} / {photos.length}
            </span>
          </>
        )}
      </div>

      {/* Thumbnail strip */}
      {photos.length > 1 && (
        <div className="flex gap-1.5 p-2 bg-gray-900/5 overflow-x-auto">
          {photos.map((photo, idx) => (
            <button
              key={photo.id}
              onClick={() => setActive(idx)}
              className={`relative h-14 w-20 shrink-0 rounded-lg overflow-hidden transition-all ${
                idx === active
                  ? "ring-2 ring-[#7C6CFF] ring-offset-1"
                  : "opacity-60 hover:opacity-90"
              }`}
            >
              <img
                src={photo.image_url}
                alt=""
                className="w-full h-full object-contain"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
