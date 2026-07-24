"use client";

import AuthGuard from "@/features/auth/AuthGuard";
import UserProfilePage from "@/features/profile/pages/UserProfilePage";

export default function ProfileRoute() {
  return (
    <AuthGuard>
      <UserProfilePage />
    </AuthGuard>
  );
}
