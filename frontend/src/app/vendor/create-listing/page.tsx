import AuthGuard from "@/features/auth/AuthGuard";
import CreateListingPage from "@/features/createListing/CreateListingPage";


export default function MyListingsRoute() {
  return (
    <AuthGuard>
      <CreateListingPage />
    </AuthGuard>
  );
}
