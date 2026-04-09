import { Globe, AtSign } from "lucide-react";

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
    <footer className="border-t border-text-primary/7 px-4 pb-28 pt-10 md:px-8 md:pb-10 md:pt-12">
      <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[1fr_280px_180px_140px_90px] md:items-start">
        <div>
          <p className="text-[40px] font-semibold tracking-[-0.02em] text-text-primary">Eventvnv</p>
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
          </div>
        </div>
      </div>
    </footer>
  );
}
