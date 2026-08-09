"use client";

import { useState, useRef, useTransition } from "react";
import Link from "next/link";
import {
  Camera,
  MapPin,
  FileText,
  Tag,
  AlertCircle,
  CheckCircle2,
  X,
  Navigation,
  ArrowRight,
  PlusCircle,
} from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui";
import { COMPLAINT_CATEGORIES } from "@/lib/validations";
import { createComplaintAction } from "@/lib/actions/complaints";
import { ROUTES } from "@/lib/constants";

export function ReportForm() {
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // UI State
  const [geoLocating, setGeoLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [successData, setSuccessData] = useState<{ complaintId: string } | null>(
    null
  );

  // Handle Photo File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFieldErrors((prev) => ({
        ...prev,
        photo: ["Please select an image file (JPEG, PNG, WebP)."],
      }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFieldErrors((prev) => ({
        ...prev,
        photo: ["Image size must be 5 MB or smaller."],
      }));
      return;
    }

    setPhotoFile(file);
    setFieldErrors((prev) => ({ ...prev, photo: [] }));

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Browser Geolocation
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser.");
      return;
    }

    setGeoLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(6));
        setLongitude(position.coords.longitude.toFixed(6));
        setGeoLocating(false);
      },
      (error) => {
        setGeoLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGeoError("Location permission denied. Please enter coordinates manually.");
            break;
          case error.POSITION_UNAVAILABLE:
            setGeoError("Location information unavailable. Please enter coordinates manually.");
            break;
          case error.TIMEOUT:
            setGeoError("Location request timed out. Please try again or enter manually.");
            break;
          default:
            setGeoError("Failed to fetch location. Please enter coordinates manually.");
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);
    setFieldErrors({});

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("category", category);
    formData.append("latitude", latitude);
    formData.append("longitude", longitude);
    if (photoFile) {
      formData.append("photo", photoFile);
    }

    startTransition(async () => {
      const res = await createComplaintAction(formData);

      if (!res.success) {
        setGlobalError(res.error);
        if (res.fieldErrors) {
          setFieldErrors(res.fieldErrors);
        }
      } else {
        setSuccessData(res.data);
      }
    });
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory("");
    setLatitude("");
    setLongitude("");
    setPhotoFile(null);
    setPhotoPreview(null);
    setGlobalError(null);
    setFieldErrors({});
    setSuccessData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Success State View
  if (successData) {
    return (
      <Card className="text-center py-10 px-6">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">
          Complaint Submitted Successfully
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Your complaint has been logged and assigned reference ID:
        </p>
        <div className="my-4 inline-block rounded-lg bg-gray-100 px-4 py-2 text-sm font-mono font-bold text-gray-800">
          {successData.complaintId}
        </div>
        <p className="text-xs text-gray-500 mb-8 max-w-md mx-auto">
          The complaint is now marked as <span className="font-semibold text-gray-700">SUBMITTED</span>. It will be reviewed by authorities and subject to independent evidence verification.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href={ROUTES.complaintDetail(successData.complaintId)}>
            <Button variant="primary" className="w-full sm:w-auto">
              View Complaint
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Button variant="outline" onClick={resetForm} className="w-full sm:w-auto">
            <PlusCircle className="h-4 w-4" />
            Report Another Issue
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {globalError && (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
          <div>{globalError}</div>
        </div>
      )}

      {/* 1. Issue Title & Description */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-civic-blue" />
            Issue Details
          </CardTitle>
        </CardHeader>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="report-title"
              className="block text-sm font-medium text-gray-700"
            >
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="report-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Deep pothole on Nehru Road near Market"
              className={[
                "mt-1 block w-full rounded-lg border px-3 py-2 text-sm transition-colors",
                fieldErrors.title
                  ? "border-red-300 bg-red-50/50 focus:border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:border-civic-blue focus:ring-civic-blue",
              ].join(" ")}
            />
            {fieldErrors.title ? (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.title[0]}</p>
            ) : (
              <p className="mt-1 text-xs text-gray-400">
                5–150 characters describing the problem clearly
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="report-description"
              className="block text-sm font-medium text-gray-700"
            >
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="report-description"
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue in detail, including landmarks, size, or safety hazards..."
              className={[
                "mt-1 block w-full resize-none rounded-lg border px-3 py-2 text-sm transition-colors",
                fieldErrors.description
                  ? "border-red-300 bg-red-50/50 focus:border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:border-civic-blue focus:ring-civic-blue",
              ].join(" ")}
            />
            {fieldErrors.description ? (
              <p className="mt-1 text-xs text-red-600">
                {fieldErrors.description[0]}
              </p>
            ) : (
              <p className="mt-1 text-xs text-gray-400">
                20–2000 characters with full context
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* 2. Category Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-civic-blue" />
            Category
          </CardTitle>
        </CardHeader>
        <div>
          <label
            htmlFor="report-category"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Issue Category <span className="text-red-500">*</span>
          </label>
          <select
            id="report-category"
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={[
              "block w-full rounded-lg border px-3 py-2 text-sm transition-colors bg-white",
              fieldErrors.category
                ? "border-red-300 bg-red-50/50 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:border-civic-blue focus:ring-civic-blue",
            ].join(" ")}
          >
            <option value="">-- Select issue category --</option>
            {COMPLAINT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          {fieldErrors.category && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.category[0]}</p>
          )}
        </div>
      </Card>

      {/* 3. Photo Evidence Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-civic-blue" />
            Photo Evidence
          </CardTitle>
        </CardHeader>

        <div>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/jpeg,image/png,image/webp,image/jpg"
            onChange={handleFileChange}
            className="hidden"
            id="photo-file-input"
          />

          {photoPreview ? (
            <div className="relative rounded-xl border border-gray-200 overflow-hidden bg-gray-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoPreview}
                alt="Selected evidence preview"
                className="max-h-64 w-full object-cover"
              />
              <button
                type="button"
                onClick={removePhoto}
                className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                title="Remove photo"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="p-2.5 bg-white border-t text-xs text-gray-600 flex items-center justify-between">
                <span className="truncate font-medium">{photoFile?.name}</span>
                <span className="shrink-0 text-gray-400">
                  {photoFile ? (photoFile.size / (1024 * 1024)).toFixed(2) : 0} MB
                </span>
              </div>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/50 px-6 py-8 cursor-pointer hover:bg-gray-50 hover:border-civic-blue/50 transition-all text-center"
            >
              <Camera className="mb-2 h-8 w-8 text-gray-400" />
              <p className="text-sm font-medium text-gray-700">
                Click to upload photo evidence
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Supports JPEG, PNG, WebP up to 5 MB
              </p>
            </div>
          )}

          {fieldErrors.photo && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.photo[0]}</p>
          )}
        </div>
      </Card>

      {/* 4. Location Coordinates & Geolocation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-civic-blue" />
            Location Coordinates
          </CardTitle>
        </CardHeader>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border border-blue-100 bg-blue-50/60 p-3.5">
            <div className="text-xs text-blue-900">
              <span className="font-semibold block">Automatic Geolocation:</span>
              <span>Fetch GPS coordinates directly from your device location</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleUseCurrentLocation}
              isLoading={geoLocating}
              className="shrink-0 border-blue-200 text-blue-700 hover:bg-blue-100"
            >
              <Navigation className="h-3.5 w-3.5 text-blue-600" />
              Use My Location
            </Button>
          </div>

          {geoError && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
              {geoError}
            </p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="report-latitude"
                className="block text-xs font-medium text-gray-700"
              >
                Latitude (-90 to 90)
              </label>
              <input
                id="report-latitude"
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="e.g. 12.9716"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-civic-blue focus:ring-civic-blue"
              />
              {fieldErrors.latitude && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.latitude[0]}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="report-longitude"
                className="block text-xs font-medium text-gray-700"
              >
                Longitude (-180 to 180)
              </label>
              <input
                id="report-longitude"
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="e.g. 77.5946"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-civic-blue focus:ring-civic-blue"
              />
              {fieldErrors.longitude && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.longitude[0]}</p>
              )}
            </div>
          </div>

          {latitude && longitude && (
            <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-2 font-mono">
              📍 Location set: {latitude}, {longitude}
            </p>
          )}
        </div>
      </Card>

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        isLoading={isPending}
        disabled={isPending}
      >
        Submit Complaint
      </Button>
    </form>
  );
}
