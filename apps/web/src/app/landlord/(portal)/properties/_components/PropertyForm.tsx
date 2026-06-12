"use client";

import { propertySchema } from "@kiado/shared/schemas/property";
import type { PropertyFormData } from "@kiado/shared/schemas/property";
import type { Amenity } from "@kiado/shared/services/property-service";
import type { Property } from "@kiado/shared/types/property";
import type { GenerateListingResult } from "@kiado/shared/services/ai-service";
import { AlertTriangle, Loader2, Sparkles } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";

const RENTAL_TYPES = [
  { value: "holiday", label: "Holiday let", priceUnit: "per night" },
  { value: "short_term", label: "Short-term", priceUnit: "per week" },
  { value: "long_term", label: "Long-term", priceUnit: "per month" },
] as const;

interface Props {
  property?: Property;
  amenities: Amenity[];
  selectedAmenityIds?: string[];
  action: (data: PropertyFormData, amenityIds: string[]) => Promise<{ error?: string }>;
  submitLabel?: string;
  onGenerate?: (values: PropertyFormData) => Promise<GenerateListingResult | null>;
  photosAdded?: boolean;
}

export default function PropertyForm({
  property,
  amenities,
  selectedAmenityIds = [],
  action,
  submitLabel = "Save",
  onGenerate,
  photosAdded = false,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [isGenerating, setIsGenerating] = useState(false);
  const [wasGenerated, setWasGenerated] = useState(false);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof PropertyFormData | "_form", string>>>({});

  const [form, setForm] = useState<PropertyFormData>({
    title: property?.title ?? "",
    description: property?.description ?? "",
    address: property?.address ?? "",
    city: property?.city ?? "",
    postcode: property?.postcode ?? "",
    rental_type: (property?.rental_type as any) ?? "holiday",
    price: property?.price ?? 0,
    bedrooms: property?.bedrooms ?? 1,
    bathrooms: property?.bathrooms ?? 1,
    max_guests: property?.max_guests ?? 1,
    amenities: selectedAmenityIds,
  });

  const set = (field: keyof PropertyFormData, value: any) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  useEffect(() => {
    const el = descriptionRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [form.description]);

  const toggleAmenity = (id: string) =>
    set(
      "amenities",
      form.amenities?.includes(id)
        ? form.amenities.filter((a) => a !== id)
        : [...(form.amenities ?? []), id],
    );

  const handleGenerate = async () => {
    if (!onGenerate) return;
    setIsGenerating(true);
    try {
      const result = await onGenerate(form);
      if (result) {
        setForm((prev) => ({ ...prev, title: result.title, description: result.description }));
        setWasGenerated(true);
      }
    } catch {
      // silently ignore — parent handles error reporting
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = propertySchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: typeof errors = {};
      result.error.issues.forEach((issue) => {
        const key = issue.path[0] as keyof PropertyFormData;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    startTransition(async () => {
      const res = await action(result.data, form.amenities ?? []);
      if (res?.error) setErrors({ _form: res.error });
    });
  };

  const priceUnit =
    RENTAL_TYPES.find((t) => t.value === form.rental_type)?.priceUnit ?? "per period";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors._form && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
          {errors._form}
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        <div className="col-span-2">
          <Field label="Property title" error={errors.title}>
            <input
              className={input(errors.title)}
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Bright 2-bed flat near Victoria station"
            />
          </Field>
        </div>

        <div className="col-span-2">
          <Field label="Description" error={errors.description}>
            <textarea
              ref={descriptionRef}
              className={`${input(errors.description)} resize-none overflow-hidden`}
              value={form.description}
              onChange={(e) => {
                set("description", e.target.value);
                if (wasGenerated) setWasGenerated(false);
              }}
              rows={4}
              placeholder="Describe your property…"
            />
          </Field>
          {wasGenerated && (
            <div className="mt-2 flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs px-3 py-2.5 rounded-xl">
              <AlertTriangle size={13} className="shrink-0 mt-0.5" />
              <span>
                AI-generated — review before publishing. Details like price,
                dates, or specific features may need adjusting.
              </span>
            </div>
          )}
          {onGenerate && (
            <div className="mt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#7C6CFF] border border-[#7C6CFF] px-3 py-1.5 rounded-full hover:bg-[#7C6CFF]/5 transition-colors disabled:opacity-50"
              >
                {isGenerating ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Sparkles size={13} />
                )}
                {isGenerating ? "Generating…" : "Generate title & description"}
              </button>
              {!photosAdded && !isGenerating && (
                <span className="text-xs text-gray-400">
                  Add photos above for richer results
                </span>
              )}
            </div>
          )}
        </div>

        <div className="col-span-2">
          <Field label="Street address" error={errors.address}>
            <input
              className={input(errors.address)}
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              placeholder="e.g. 123 Main Street"
            />
          </Field>
        </div>

        <Field label="City" error={errors.city}>
          <input
            className={input(errors.city)}
            value={form.city}
            onChange={(e) => set("city", e.target.value)}
            placeholder="e.g. London"
          />
        </Field>

        <Field label="Postcode" error={errors.postcode}>
          <input
            className={input(errors.postcode)}
            value={form.postcode}
            onChange={(e) => set("postcode", e.target.value)}
            placeholder="e.g. SW1A 1AA"
          />
        </Field>

        <Field label="Rental type" error={errors.rental_type}>
          <select
            className={input(errors.rental_type)}
            value={form.rental_type}
            onChange={(e) => set("rental_type", e.target.value as any)}
          >
            {RENTAL_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label={`Price (${priceUnit})`} error={errors.price}>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
              £
            </span>
            <input
              type="number"
              min={1}
              className={`${input(errors.price)} pl-8`}
              value={form.price || ""}
              onChange={(e) => set("price", Number(e.target.value))}
              placeholder="0"
            />
          </div>
        </Field>

        <Field label="Bedrooms" error={errors.bedrooms}>
          <input
            type="number"
            min={1}
            className={input(errors.bedrooms)}
            value={form.bedrooms || ""}
            onChange={(e) => set("bedrooms", Number(e.target.value))}
          />
        </Field>

        <Field label="Bathrooms" error={errors.bathrooms}>
          <input
            type="number"
            min={1}
            className={input(errors.bathrooms)}
            value={form.bathrooms || ""}
            onChange={(e) => set("bathrooms", Number(e.target.value))}
          />
        </Field>

        <Field label="Max guests" error={errors.max_guests}>
          <input
            type="number"
            min={1}
            className={input(errors.max_guests)}
            value={form.max_guests || ""}
            onChange={(e) => set("max_guests", Number(e.target.value))}
          />
        </Field>
      </div>

      {amenities.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-3">Amenities</p>
          <div className="grid grid-cols-3 gap-2">
            {amenities.map((amenity) => {
              const checked = form.amenities?.includes(amenity.id);
              return (
                <label
                  key={amenity.id}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer text-sm transition-colors ${
                    checked
                      ? "border-[#7C6CFF] bg-[#7C6CFF]/5 text-[#7C6CFF]"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={!!checked}
                    onChange={() => toggleAmenity(amenity.id)}
                  />
                  <span
                    className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                      checked ? "bg-[#7C6CFF] border-[#7C6CFF]" : "border-gray-300"
                    }`}
                  >
                    {checked && (
                      <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                        <path
                          d="M2 6l3 3 5-5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </span>
                  {amenity.name}
                </label>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="bg-[#7C6CFF] hover:bg-[#6B5CE7] text-white font-semibold px-6 py-2.5 rounded-xl transition-colors disabled:opacity-60 text-sm"
        >
          {isPending ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
      </label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

function input(error?: string) {
  return `w-full px-4 py-2.5 rounded-xl border text-sm text-[#2C3E50] focus:outline-none focus:ring-2 focus:ring-[#7C6CFF] focus:border-transparent transition-colors ${
    error ? "border-red-300 bg-red-50" : "border-gray-200 bg-white"
  }`;
}
