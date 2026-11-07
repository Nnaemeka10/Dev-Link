import HomeFooter from "@/components/layout/Footer";
import LegalShell from "../components/LegalShell";
import { PRIVACY_POLICY } from "../content/privacyPolicy";

export default function PrivacyPolicyPage() {
  return (
    <main className="bg-bg-primary motion-safe:animate-fade-in">
      <LegalShell doc={PRIVACY_POLICY} />
      <HomeFooter />
    </main>
  );
}