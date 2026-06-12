"use client";

import { ImagePlus, X } from "lucide-react";
import { useRef, useState } from "react";

interface Preview {
  file: File;
  url: string;
}

interface Props {
  onChange: (files: File[]) => void;
}

export default function PhotoPicker({ onChange }: Props) {
  const [previews, setPreviews] = useState<Preview[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = (fileList: FileList) => {
    const newPreviews = Array.from(fileList).map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
    const updated = [...previews, ...newPreviews];
    setPreviews(updated);
    onChange(updated.map((p) => p.file));
  };

  const remove = (url: string) => {
    URL.revokeObjectURL(url);
    const updated = previews.filter((p) => p.url !== url);
    setPreviews(updated);
    onChange(updated.map((p) => p.file));
  };

  return (
    <div>
      <div className="grid grid-cols-3 gap-3">
        {previews.map(({ url }) => (
          <div
            key={url}
            className="relative group aspect-video rounded-xl overflow-hidden bg-gray-100"
          >
            <img src={url} alt="" className="w-full h-full object-contain" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                type="button"
                onClick={() => remove(url)}
                className="flex items-center gap-1 bg-red-500/80 hover:bg-red-500 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg"
              >
                <X size={12} />
                Remove
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="aspect-video rounded-xl border-2 border-dashed border-gray-200 hover:border-[#7C6CFF] text-gray-400 hover:text-[#7C6CFF] transition-colors flex flex-col items-center justify-center gap-2"
        >
          <ImagePlus size={20} />
          <span className="text-xs font-medium">Add photos</span>
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && addFiles(e.target.files)}
      />
    </div>
  );
}
