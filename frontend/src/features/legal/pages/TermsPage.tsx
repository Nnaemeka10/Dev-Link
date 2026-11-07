import HomeFooter from "@/components/layout/Footer";
import LegalShell from "../components/LegalShell";
import { TERMS_OF_SERVICE } from "../content/termsOfService";

export default function TermsPage() {
  return (
    <main className="bg-bg-primary motion-safe:animate-fade-in">
      <LegalShell doc={TERMS_OF_SERVICE} />
      <HomeFooter />
    </main>
  );
}