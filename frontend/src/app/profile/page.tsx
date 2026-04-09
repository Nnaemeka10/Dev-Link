"use client";

import Card from "@/components/ui/Card";
import AuthGuard from "@/features/auth/AuthGuard";
import { useAuth } from "@/features/auth/useAuth";

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <AuthGuard>
      <main className="mx-auto w-full max-w-4xl px-4 py-8 md:px-6 md:py-12">
        <Card>
          <h1 className="text-2xl font-semibold text-text-primary">Profile</h1>
          <p className="mt-4 text-sm text-text-primary/80">
            Signed in as: <span className="font-medium text-text-primary">{user?.email}</span>
          </p>
        </Card>
      </main>
    </AuthGuard>
  );
}
