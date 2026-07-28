"use client";

import { useRef } from "react";
import { useListingStore } from "../store/useListingStore";
import type { GalleryPhoto } from "../types/listing";
import { uploadToCloudinary } from "../api/listingDraft.api";

const MIN_PHOTOS = 5;

export default function GalleryStep() {
  const listingId = useListingStore((s) => s.listingId);
  const category = useListingStore((s) => s.form.category);
  const gallery = useListingStore((s) => s.form.gallery);
  const addPhotos = useListingStore((s) => s.addPhotos);
  const updatePhoto = useListingStore((s) => s.updatePhoto);
  const removePhoto = useListingStore((s) => s.removePhoto);
  const setCoverPhoto = useListingStore((s) => s.setCoverPhoto);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const description =
    category === "service"
      ? "Upload at least 5 photos from different events or activities. High-quality imagery is the first thing clients notice."
      : "Upload at least 5 photos from different angles (Interior, Exterior, Amenities, Action shots). High-quality imagery is the first thing clients notice.";

  // NOTE(meks): local preview only — wire this to your Cloudinary signed
  // upload flow (get signature from the backend, upload client-side, then
  // call updatePhoto with the returned secure_url/public_id).
  // const handleFilesSelected = (files: FileList | null) => {
  //   if (!files) return;
  //   const newPhotos: GalleryPhoto[] = Array.from(files).map((file) => ({
  //     id: `photo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  //     url: URL.createObjectURL(file),
  //     publicId: null,
  //     isCover: false,
  //     uploadStatus: "pending",
  //   }));
  //   addPhotos(newPhotos);
  // };

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || !listingId) return;
    
    const fileArray = Array.from(files);
    
    // 1. Add as pending with local blob preview
    const newPhotos: GalleryPhoto[] = fileArray.map((file) => ({
      id: `photo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      url: URL.createObjectURL(file),
      publicId: null,
      isCover: false,
      uploadStatus: "pending",
    }));
    addPhotos(newPhotos);

    // 2. Upload each file to Cloudinary
    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const photoId = newPhotos[i].id;
      
      updatePhoto(photoId, { uploadStatus: "uploading" });
      
      try {
        const { secure_url, public_id } = await uploadToCloudinary(file, listingId, () => {});
        updatePhoto(photoId, { url: secure_url, publicId: public_id, uploadStatus: "uploaded" });
      } catch (error) {
        updatePhoto(photoId, { uploadStatus: "error" });
      }
    }
  };
  const remaining = Math.max(0, MIN_PHOTOS - gallery.length);
  const isUploading = gallery.some((p) => p.uploadStatus === "uploading" || p.uploadStatus === "pending"); 

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-10 max-w-2xl md:mb-14">
        <h2 className="font-man text-3xl font-bold tracking-tight text-text-primary md:text-5xl">
          Bring your listing to life
        </h2>
        <p className="mt-4 text-base text-text-primary/60 md:text-lg">{description}</p>
        {isUploading && <p className="mt-2 text-sm font-bold text-accent-primary animate-pulse">Uploading images...</p>}
      </div>

      <div className="rounded-card bg-white p-5 shadow-card ring-1 ring-black/5 md:p-8">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex w-full flex-col items-center justify-center rounded-card border-2 border-dashed border-black/10 bg-bg-tertiary py-10 text-center transition-colors hover:border-accent-primary/40 hover:bg-accent-tint md:py-14"
        >
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent-primary/10 text-accent-primary">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 16V4M12 4L7 9M12 4L17 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4 16V18C4 19.1046 4.89543 20 6 20H18C19.1046 20 20 19.1046 20 18V16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </span>
          <p className="font-man text-lg font-bold text-text-primary">Tap to browse files</p>
          <p className="mt-1 text-sm text-text-primary/50">or drag and drop — JPG, PNG, HEIC up to 10MB</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFilesSelected(e.target.files)}
            disabled={isUploading}
          />
        </button>

        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm font-semibold text-text-primary">
            {gallery.length} photo{gallery.length === 1 ? "" : "s"} added
          </p>
          {remaining > 0 && <p className="text-sm font-medium text-accent-primary">{remaining} more needed</p>}
        </div>

        {gallery.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-4 xs:grid-cols-3 md:grid-cols-4">
            {gallery.map((photo) => (
              <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-card bg-bg-tertiary">
                {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview, not a remote asset */}
                <img src={photo.url} alt="" className="h-full w-full object-cover" />
                
                {photo.uploadStatus === "uploading" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-xs font-bold">
                    Uploading...
                  </div>
                )}
                {photo.uploadStatus === "error" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-red-500/80 text-white text-xs font-bold">
                    Failed
                  </div>
                )}

                {photo.isCover && photo.uploadStatus === "uploaded" && (
                  <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-accent-primary shadow-card">
                    Cover
                  </span>
                )}

                {photo.isCover && (
                  <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-accent-primary shadow-card">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M12 2L14.5 8.5L21 9.3L16.2 13.9L17.5 20.5L12 17.2L6.5 20.5L7.8 13.9L3 9.3L9.5 8.5L12 2Z" />
                    </svg>
                    Cover
                  </span>
                )}

                <div className="absolute inset-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/50 via-transparent to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                  {!photo.isCover && (
                    <button
                      type="button"
                      onClick={() => setCoverPhoto(photo.id)}
                      className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-text-primary"
                    >
                      Set as cover
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removePhoto(photo.id)}
                    aria-label="Remove photo"
                    className="ml-auto flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-red-600"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M6 6L18 18M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}