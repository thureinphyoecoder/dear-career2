"use client";

import { useEffect, useState } from "react";

import { normalizeServerError } from "@/lib/form-validation";
import type { Job } from "@/lib/types";

type UseJobImageManagerOptions = {
  initialJob?: Partial<Job>;
  validateJobImageFile: (file: File | null) => string;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
};

export function useJobImageManager({
  initialJob,
  validateJobImageFile,
  onError,
  onSuccess,
}: UseJobImageManagerOptions) {
  const [imageUrl, setImageUrl] = useState(initialJob?.image_url ?? "");
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(initialJob?.image_file_url ?? "");
  const [imagePreviewUrl, setImagePreviewUrl] = useState(
    initialJob?.display_image_url ?? initialJob?.image_file_url ?? initialJob?.image_url ?? "",
  );
  const [imageUploadError, setImageUploadError] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isRemovingImage, setIsRemovingImage] = useState(false);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  function replaceImagePreview(nextUrl: string) {
    setImagePreviewUrl((current) => {
      if (current.startsWith("blob:")) {
        URL.revokeObjectURL(current);
      }
      return nextUrl;
    });
  }

  function applyJobImageState(job: Partial<Job>) {
    const nextImageUrl = job.image_url?.trim() ?? "";
    const nextUploadedImageUrl = job.image_file_url?.trim() ?? "";
    const nextDisplayImageUrl =
      job.display_image_url?.trim() || nextUploadedImageUrl || nextImageUrl;

    setImageUrl(nextImageUrl);
    setUploadedImageUrl(nextUploadedImageUrl);
    replaceImagePreview(nextDisplayImageUrl);
  }

  function setExternalImageUrl(nextImageUrl: string, options?: { syncPreview?: boolean }) {
    const trimmedImageUrl = nextImageUrl.trim();
    setImageUrl(trimmedImageUrl);
    if (options?.syncPreview ?? true) {
      replaceImagePreview(uploadedImageUrl || trimmedImageUrl);
    }
  }

  function clearSelectedImageFile() {
    setSelectedImageFile(null);
    setImageUploadError("");
    replaceImagePreview(uploadedImageUrl || imageUrl.trim());
  }

  function handleImageFileChange(file: File | null) {
    setImageUploadError("");
    setSelectedImageFile(file);
    if (!file) {
      replaceImagePreview(uploadedImageUrl || imageUrl.trim());
      return;
    }

    const nextError = validateJobImageFile(file);
    if (nextError) {
      setImageUploadError(nextError);
      onError(nextError);
      return;
    }

    replaceImagePreview(URL.createObjectURL(file));
  }

  async function uploadSelectedImage(jobId: number) {
    if (!selectedImageFile) {
      return null;
    }

    const nextError = validateJobImageFile(selectedImageFile);
    if (nextError) {
      setImageUploadError(nextError);
      throw new Error(nextError);
    }

    setIsUploadingImage(true);
    setImageUploadError("");

    try {
      const formData = new FormData();
      formData.append("image", selectedImageFile);

      const response = await fetch(`/api/admin/proxy/jobs/admin/jobs/${jobId}/image`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(normalizeServerError(detail, "Unable to upload image."));
      }

      const result = (await response.json()) as Job;
      applyJobImageState(result);
      setSelectedImageFile(null);
      return result;
    } finally {
      setIsUploadingImage(false);
    }
  }

  async function removeUploadedImage(jobId?: number) {
    if (!jobId) {
      clearSelectedImageFile();
      return;
    }

    setIsRemovingImage(true);
    setImageUploadError("");

    try {
      const response = await fetch(`/api/admin/proxy/jobs/admin/jobs/${jobId}/image`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(normalizeServerError(detail, "Unable to remove image."));
      }

      const result = (await response.json()) as Job;
      setSelectedImageFile(null);
      applyJobImageState(result);
      onSuccess("Uploaded image removed.");
    } catch (removeError) {
      const nextError =
        removeError instanceof Error ? removeError.message : "Unable to remove image.";
      setImageUploadError(nextError);
      onError(nextError);
    } finally {
      setIsRemovingImage(false);
    }
  }

  return {
    imageUrl,
    setImageUrl: setExternalImageUrl,
    selectedImageFile,
    uploadedImageUrl,
    imagePreviewUrl,
    imageUploadError,
    setImageUploadError,
    isUploadingImage,
    isRemovingImage,
    applyJobImageState,
    clearSelectedImageFile,
    handleImageFileChange,
    uploadSelectedImage,
    removeUploadedImage,
  };
}
