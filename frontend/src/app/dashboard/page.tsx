"use client";

import dynamic from "next/dynamic";
import Sidebar from "@/components/layout/Sidebar";
import Card from "@/components/ui/Card";
import AuthGuard from "@/features/auth/AuthGuard";

const Modal = dynamic(() => import("@/components/ui/Modal"), { ssr: false });

export default function DashboardPage() {
  return (
    <AuthGuard>
      <main className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-8 md:grid-cols-[240px_1fr] md:px-6 md:py-12">
        <Sidebar />
        <section className="space-y-4">
          <Card>
            <h1 className="text-2xl font-semibold text-text-primary">Dashboard</h1>
            <p className="mt-2 text-sm text-text-primary/80">
              Track your event pipeline, compare halls versus services, and keep your booking
              decisions organized.
            </p>
          </Card>
          <Card>
            <h2 className="text-xl font-semibold text-text-primary">Quick insight</h2>
            <p className="mt-2 text-sm text-text-primary/80">
              Your active conversations and upcoming bookings will appear here.
            </p>
          </Card>
        </section>
      </main>
      <Modal isOpen={false} title="Hidden modal" onClose={() => {}}>
        <p>This modal is lazily loaded for heavier interactive flows.</p>
      </Modal>
    </AuthGuard>
  );
}
