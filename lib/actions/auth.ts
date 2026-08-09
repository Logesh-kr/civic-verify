"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { registerSchema, loginSchema } from "@/lib/validations";
import { createSessionToken, setAuthCookie, removeAuthCookie } from "@/lib/auth";
import type { ApiResponse } from "@/types";
import { Role } from "@prisma/client";

export async function registerUserAction(formData: unknown): Promise<ApiResponse<{ userId: string }>> {
  const result = registerSchema.safeParse(formData);

  if (!result.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const field = issue.path[0] as string;
      if (!fieldErrors[field]) fieldErrors[field] = [];
      fieldErrors[field].push(issue.message);
    }
    return {
      success: false,
      error: "Please fix the validation errors below.",
      fieldErrors,
    };
  }

  const { name, email, password, role } = result.data;

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return {
        success: false,
        error: "An account with this email address already exists.",
        fieldErrors: { email: ["This email is already registered."] },
      };
    }

    // Hash password with bcryptjs
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user in database
    const newUser = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        role: role as Role,
      },
    });

    // Create session JWT token and set httpOnly cookie
    const token = await createSessionToken({
      userId: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role as Role,
    });

    await setAuthCookie(token);

    return {
      success: true,
      data: { userId: newUser.id },
    };
  } catch (error) {
    console.error("Registration error:", error);
    return {
      success: false,
      error: "An error occurred during registration. Please try again.",
    };
  }
}

export async function loginUserAction(formData: unknown): Promise<ApiResponse<{ userId: string }>> {
  const result = loginSchema.safeParse(formData);

  if (!result.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const field = issue.path[0] as string;
      if (!fieldErrors[field]) fieldErrors[field] = [];
      fieldErrors[field].push(issue.message);
    }
    return {
      success: false,
      error: "Please enter a valid email and password.",
      fieldErrors,
    };
  }

  const { email, password } = result.data;

  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return {
        success: false,
        error: "Invalid email address or password.",
      };
    }

    // Verify password hash
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return {
        success: false,
        error: "Invalid email address or password.",
      };
    }

    // Create session JWT token and set httpOnly cookie
    const token = await createSessionToken({
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role as Role,
    });

    await setAuthCookie(token);

    return {
      success: true,
      data: { userId: user.id },
    };
  } catch (error) {
    console.error("Login error:", error);
    return {
      success: false,
      error: "An error occurred during sign in. Please try again.",
    };
  }
}

export async function logoutUserAction(): Promise<void> {
  await removeAuthCookie();
  redirect("/login");
}
