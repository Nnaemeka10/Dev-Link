import AuthGuard from "@/features/auth/AuthGuard";
import TodayDashboard from "@/features/vendor/pages/TodayDashboard";

export default function VendorIndexRoute() {
  return(
    <AuthGuard>
      <TodayDashboard />
    </AuthGuard>
  );
}
