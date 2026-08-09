import fs from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";

/**
 * Uploads an image file to persistent storage.
 * - Uses Vercel Blob storage when BLOB_READ_WRITE_TOKEN is configured.
 * - Falls back to local public/uploads directory for offline local development.
 *
 * @param photoFile The File object uploaded from form data.
 * @param prefix Prefix for the generated filename (e.g. "evidence" or "repair").
 * @returns Public URL (Vercel Blob) or relative path (/uploads/...) to be stored in the database.
 */
export async function uploadImage(
  photoFile: File,
  prefix: string
): Promise<string> {
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

  // 1. Persistent Cloud Storage via Vercel Blob (Production & Local with token)
  if (blobToken && blobToken.trim() !== "") {
    const ext = photoFile.name.split(".").pop() || "jpg";
    const filename = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;

    const blob = await put(filename, photoFile, {
      access: "public",
      token: blobToken.trim(),
    });

    console.log(`[Storage] Uploaded image to Vercel Blob: ${blob.url}`);
    return blob.url;
  }

  // 2. Local Filesystem Fallback (Local development without Vercel Blob token)
  console.log(`[Storage] BLOB_READ_WRITE_TOKEN not set. Saving locally to public/uploads.`);
  const bytes = await photoFile.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const ext = photoFile.name.split(".").pop() || "jpg";
  const filename = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");

  await fs.mkdir(uploadDir, { recursive: true });
  const filePath = path.join(uploadDir, filename);
  await fs.writeFile(filePath, buffer);

  return `/uploads/${filename}`;
}
