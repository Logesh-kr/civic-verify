import { z } from "zod";

// ─── Shared primitives ────────────────────────────────────────────────────────

export const emailSchema = z
  .string()
  .email("Please enter a valid email address")
  .min(1, "Email is required");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be at most 128 characters");

// ─── Complaint ─────────────────────────────────────────────────────────────────

export const COMPLAINT_CATEGORIES = [
  "Pothole / Road Damage",
  "Streetlight",
  "Garbage / Waste",
  "Water Leakage",
  "Drainage",
  "Public Safety",
  "Other",
] as const;

export type ComplaintCategory = (typeof COMPLAINT_CATEGORIES)[number];

export const createComplaintSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(150, "Title must be at most 150 characters"),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(2000, "Description must be at most 2000 characters"),
  category: z.enum(COMPLAINT_CATEGORIES, {
    error: "Please select a valid category",
  }),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export type CreateComplaintInput = z.infer<typeof createComplaintSchema>;

// ─── User registration (Phase 2 will add full auth) ──────────────────────────

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters"),
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  role: z.enum(["CITIZEN", "AUTHORITY"], {
    error: "Please select a valid role (Citizen or Authority)",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;
