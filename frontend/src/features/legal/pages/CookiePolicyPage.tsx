import HomeFooter from "@/components/layout/Footer";
import LegalShell from "../components/LegalShell";
import { COOKIE_POLICY } from "../content/cookiePolicy";

export default function CookiePolicyPage() {
  return (
    <main className="bg-bg-primary motion-safe:animate-fade-in">
      <LegalShell doc={COOKIE_POLICY} />
      <HomeFooter />
    </main>
  );
}