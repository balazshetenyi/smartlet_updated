import * as zod from "zod";

export const signUpSchema = zod
  .object({
    first_name: zod
      .string()
      .min(1, { message: "First name is required" })
      .max(50, { message: "First name must be less than 50 characters" })
      .regex(/^[a-zA-Z\s'-]+$/, {
        message: "First name contains invalid characters",
      }),
    last_name: zod
      .string()
      .min(1, { message: "Last name is required" })
      .max(50, { message: "Last name must be less than 50 characters" })
      .regex(/^[a-zA-Z\s'-]+$/, {
        message: "Last name contains invalid characters",
      }),
    email: zod
      .string()
      .min(1, "Email is required")
      .email("Invalid email address"),
    password: zod
      .string()
      .min(1, "Password is required")
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[^A-Za-z0-9]/,
        "Password must contain at least one special character"
      ),
    confirmPassword: zod.string().min(1, "Please confirm your password"),
    user_type: zod.enum(["tenant", "landlord"], {
      error: "Please select your account type",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const signInSchema = zod.object({
  email: zod.string().email({ message: "Invalid email address" }),
  password: zod.string().min(6, { message: "Invalid password" }),
});
