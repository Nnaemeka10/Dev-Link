import AuthGuard from "@/features/auth/AuthGuard";
import MyListingsPage from "@/features/vendor/pages/MyListingsPage";

export default function MyListingsRoute() {
  return (
    <AuthGuard>
      <MyListingsPage />
    </AuthGuard>
  );
}
