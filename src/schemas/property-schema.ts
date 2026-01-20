import zod from "zod";

export const propertySchema = zod.object({
  title: zod.string().min(1, { message: "Title is required" }),
  description: zod.string().min(1, { message: "Description is required" }),
  city: zod.string().min(1, { message: "City is required" }),
  address: zod.string().min(1, { message: "Address is required" }),
  postcode: zod.string().min(1, { message: "Postcode is required" }),
  rental_type: zod.enum(["long_term", "short_term", "holiday"] as const, {
    message: "Please select a rental type",
  }),
  price: zod
    .number()
    .positive({ message: "Price must be a positive number" })
    .min(1, { message: "Price is required" }),
  bedrooms: zod
    .number()
    .int({ message: "Bedrooms must be an integer" })
    .positive({ message: "Bedrooms must be a positive number" }),
  bathrooms: zod
    .number()
    .int({ message: "Bathrooms must be an integer" })
    .positive({ message: "Bathrooms must be a positive number" }),
  amenities: zod.array(zod.string()).optional(),
});

export type AddNewProperty = zod.infer<typeof propertySchema>;
