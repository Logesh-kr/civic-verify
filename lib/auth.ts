import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/db";
import type { Role } from "@/types";

const COOKIE_NAME = "civic_session";
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "civicverify-hackathon-super-secret-key-2026"
);

export interface AuthSessionPayload {
  userId: string;
  name: string;
  email: string;
  role: Role;
}

/**
 * Sign a JWT token for the user session.
 */
export async function createSessionToken(payload: AuthSessionPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

/**
 * Verify JWT token string.
 */
export async function verifySessionToken(token: string): Promise<AuthSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      userId: payload.userId as string,
      name: payload.name as string,
      email: payload.email as string,
      role: payload.role as Role,
    };
  } catch {
    return null;
  }
}

/**
 * Set httpOnly auth cookie on response context.
 */
export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

/**
 * Delete httpOnly auth cookie.
 */
export async function removeAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Get active user session payload from request cookies.
 */
export async function getSession(): Promise<AuthSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return await verifySessionToken(token);
}

/**
 * Get current authenticated user from DB (excluding passwordHash).
 */
export async function getCurrentUser() {
  const session = await getSession();
  if (!session?.userId) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return user;
  } catch {
    // If DB is offline or user deleted, fall back to session token data
    return {
      id: session.userId,
      name: session.name,
      email: session.email,
      role: session.role,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

/**
 * Enforce authentication — redirects unauthenticated users to /login.
 */
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

/**
 * Enforce role-based access — redirects unauthorized users to /dashboard.
 */
export async function requireRole(allowedRoles: Role[]) {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role as Role)) {
    redirect("/dashboard");
  }
  return user;
}
