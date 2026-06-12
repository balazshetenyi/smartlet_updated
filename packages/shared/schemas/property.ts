import { z } from "zod";

export const propertySchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  postcode: z.string().min(1, "Postcode is required"),
  rental_type: z.enum(["long_term", "short_term", "holiday"] as const, {
    message: "Please select a rental type",
  }),
  price: z.number().positive("Price must be a positive number").min(1, "Price is required"),
  bedrooms: z.number().int("Bedrooms must be a whole number").positive("Bedrooms must be a positive number"),
  bathrooms: z.number().int("Bathrooms must be a whole number").positive("Bathrooms must be a positive number"),
  max_guests: z.number().int("Max guests must be a whole number").positive("Max guests must be a positive number"),
  amenities: z.array(z.string()).optional(),
});

export type PropertyFormData = z.infer<typeof propertySchema>;
