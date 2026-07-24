import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchProfile,
  updateProfile,
  fetchAvatarSignature,
  fetchBookings,
  fetchPaymentMethods,
  setDefaultPaymentMethod,
  removePaymentMethod,
  updateNotifications,
  changePassword,
  deactivateAccount,
} from "../profile.api";
import type {
  ProfileResponse,
  UserProfile,
  PaymentMethod,
  Booking,
  NotificationSettings,
  UpdateProfilePayload,
} from "../profile.types";

// ─── Date Formatting ─────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
  const date = new Date(isDateOnly ? `${dateStr}T00:00:00` : dateStr);

  return date.toLocaleDateString("en-NG", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatMemberSince(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-NG", {
    month: "long",
    year: "numeric",
  });
}

const FALLBACK_AVATAR = "https://ui-avatars.com/api/?name=User&background=D65C3A&color=fff&size=200";
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&q=80";

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useProfile() {
  const queryClient = useQueryClient();

  // ── Queries ────────────────────────────────────────────────────────────

  const { data: raw, isLoading: isProfileLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: fetchProfile,
    staleTime: 1000 * 60 * 2,
  });

  const { data: rawBookings = [], isLoading: isBookingsLoading } = useQuery({
    queryKey: ["profile", "bookings"],
    queryFn: fetchBookings,
    staleTime: 1000 * 60,
  });

  const { data: rawPayments = [], isLoading: isPaymentsLoading } = useQuery({
    queryKey: ["profile", "payment-methods"],
    queryFn: fetchPaymentMethods,
    staleTime: 1000 * 60,
  });

  // ── Derived State ──────────────────────────────────────────────────────

  const profile: UserProfile | null = raw
    ? {
        fullName: `${raw.firstName} ${raw.lastName}`.trim() || raw.email,
        email: raw.email,
        phone: raw.phone || "",
        location: raw.location || "",
        avatarUrl: raw.avatarUrl || FALLBACK_AVATAR,
        memberSince: formatMemberSince(raw.joinDate),
      }
    : null;

  const notifications: NotificationSettings = raw?.notifications ?? {
    emailPromotions: false,
    smsAlerts: true,
    pushNotifications: true,
    bookingUpdates: true,
  };

  const bookings: Booking[] = rawBookings.map((b) => ({
    ...b,
    eventDate: formatDate(b.eventDate),
    bookedOn: formatDate(b.bookedOn),
    imageUrl: b.imageUrl || FALLBACK_IMAGE,
  }));

  const payments: PaymentMethod[] = rawPayments.map((pm) => ({
    ...pm,
    type: pm.type === "bank_transfer" ? ("bank" as const) : ("card" as const),
    expiry: pm.expiryDate,
  }));

  // ── Mutations ──────────────────────────────────────────────────────────

  const updateProfileMutation = useMutation({
    mutationFn: (payload: UpdateProfilePayload) => updateProfile(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(["profile"], data);
    },
  });

  const updateAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      // 1. Get signed params
      const { signature, timestamp, folder, apiKey, cloudName } = await fetchAvatarSignature();

      // 2. Upload directly to Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", apiKey);
      formData.append("timestamp", String(timestamp));
      formData.append("signature", signature);
      formData.append("folder", folder);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: formData }
      );

      if (!res.ok) throw new Error("Cloudinary upload failed");
      const data = await res.json();

      // 3. Save URL to profile
      return updateProfile({ avatarUrl: data.secure_url });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["profile"], data);
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: setDefaultPaymentMethod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", "payment-methods"] });
    },
  });

  const removePaymentMutation = useMutation({
    mutationFn: removePaymentMethod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", "payment-methods"] });
    },
  });

  const updateNotificationsMutation = useMutation({
    mutationFn: updateNotifications,
    onSuccess: (data) => {
      // Merge updated notification prefs into cached profile
      queryClient.setQueryData<ProfileResponse>(["profile"], (old) => {
        if (!old) return old;
        return { ...old, notifications: data };
      });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: changePassword,
  });

  const deactivateMutation = useMutation({
    mutationFn: deactivateAccount,
  });

  // ── Field Update Helper ───────────────────────────────────────────────

  const updateField = async (field: string, value: string) => {
    const payload: UpdateProfilePayload = {};

    if (field === "fullName") {
      const parts = value.trim().split(" ");
      payload.firstName = parts[0] || "";
      payload.lastName = parts.slice(1).join(" ") || "";
    } else if (field === "email") {
      payload.email = value.trim();
    } else if (field === "phone") {
      payload.phone = value.trim();
    } else if (field === "location") {
      payload.location = value.trim();
    }

    await updateProfileMutation.mutateAsync(payload);
  };

  // ── Notification Toggle Helper ────────────────────────────────────────

  const toggleNotification = async (key: keyof NotificationSettings) => {
    await updateNotificationsMutation.mutateAsync({ [key]: !notifications[key] });
  };

  // ── Return ────────────────────────────────────────────────────────────

  return {
    // Data
    profile,
    bookings,
    payments,
    notifications,
    isProfileLoading,
    isBookingsLoading,
    isPaymentsLoading,

    // Profile mutations
    updateField,
    uploadAvatar: updateAvatarMutation.mutateAsync,
    isUpdatingField: updateProfileMutation.isPending,
    isUploadingAvatar: updateAvatarMutation.isPending,
    fieldError: updateProfileMutation.error,

    // Payment mutations
    setDefaultPayment: setDefaultMutation.mutateAsync,
    removePayment: removePaymentMutation.mutateAsync,
    isUpdatingPayment: setDefaultMutation.isPending || removePaymentMutation.isPending,

    // Notification mutation
    toggleNotification,
    isUpdatingNotifications: updateNotificationsMutation.isPending,

    // Security mutations
    changePassword: changePasswordMutation.mutateAsync,
    isChangingPassword: changePasswordMutation.isPending,
    passwordError: changePasswordMutation.error,
    passwordSuccess: changePasswordMutation.isSuccess,

    // Account mutation
    deactivateAccount: deactivateMutation.mutateAsync,
    isDeactivating: deactivateMutation.isPending,
  };
}
