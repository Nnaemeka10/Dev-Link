import { Globe, AtSign, X} from "lucide-react";
import Image from "next/image";
import Link from "next/link";


interface FooterResponse {
  company: string[];
  support: string[];
  legal: string[];
}

const FOOTER_RESPONSE: FooterResponse = {
  company: ["About Us", "Careers"],
  support: ["Help Center", "Contact"],
  legal: ["Terms", "Privacy"],
};

function FooterColumn({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-primary/48">{title}</h4>
      <div className="mt-4 space-y-2">
        {items.map((item) => (
          <p key={item} className="text-sm font-medium text-text-primary/84">
            {item}
          </p>
        ))}
      </div>
    </div>
  );
}

export default function HomeFooter() {
  return (
    <footer className="bg-bg-tertiary min-h-50 px-4 pb-28 pt-10 lg:px-8 lg:pb-10 lg:pt-12">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_280px_180px_140px_90px] lg:items-start">
        <div>
          <Link href="/" className="text-2xl flex font-semibold tracking-[-0.02em] text-text-primary items-end gap-1">
            <Image src="/logo.svg" alt="EventVnv" width={30} height={30} />
            <p className="font-semibold logo translate-y-1.5">EventVnV </p>
          </Link>
          <p className="mt-4 max-w-md text-sm text-text-primary/60">
            © 2026 Eventvnv. Nigeria{"'"}s premier event concierge, curating elegance across West
            Africa.
          </p>
        </div>
        <FooterColumn title="Company" items={FOOTER_RESPONSE.company} />
        <FooterColumn title="Support" items={FOOTER_RESPONSE.support} />
        <FooterColumn title="Legal" items={FOOTER_RESPONSE.legal} />
        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-primary/48">
            Social
          </h4>
          <div className="mt-4 flex items-center gap-3 text-text-primary/80">
            <Globe className="h-4 w-4" />
            <AtSign className="h-4 w-4" />
            <X className="h-4 w-4" />
          </div>
        </div>
      </div>
    </footer>
  );
}
