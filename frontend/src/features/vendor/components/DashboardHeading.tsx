import type { VendorProfile } from "../types";

interface DashboardHeadingProps {
  vendor: VendorProfile;
}

export default function DashboardHeading({ vendor }: DashboardHeadingProps) {
  const greeting = vendor.isFirstVisit ? `Hi, ${vendor.firstName}` : `Welcome back, ${vendor.firstName}`;

  return (
    <div className="animate-fade-up">
      <h1 className="font-man text-2xl font-extrabold tracking-tight text-text-primary xs:text-3xl md:text-4xl">
        {greeting}
      </h1>
      <p className="mt-2 text-sm text-text-primary/60 md:text-base">
        {vendor.isFirstVisit
          ? "Here's where you'll track bookings, revenue, and client activity."
          : "Here's how your marketplace performance is looking."}
      </p>
    </div>
  );
}