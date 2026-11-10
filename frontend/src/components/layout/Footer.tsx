import { Globe, AtSign, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

interface FooterColumnData {
  title: string;
  items: FooterLink[];
}

const FOOTER_COLUMNS: FooterColumnData[] = [
  {
    title: "Company",
    items: [
      { label: "About Us", href: "/about" },
      { label: "Careers", href: "mailto:careers@eventvnv.ng", external: true },
    ],
  },
  {
    title: "Support",
    items: [
      { label: "Help Center", href: "/help" },
      { label: "Contact", href: "mailto:support@eventvnv.ng", external: true },
    ],
  },
  {
    title: "Legal",
    items: [
      { label: "Terms", href: "/terms" },
      { label: "Privacy", href: "/privacy" },
    ],
  },
];

function FooterColumn({ title, items }: FooterColumnData) {
  return (
    <div>
      <h4 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-primary/48">
        {title}
      </h4>
      <div className="mt-4 space-y-2">
        {items.map((item) =>
          item.external ? (
            <a
              key={item.label}
              href={item.href}
              className="block text-sm font-medium text-text-primary/84 transition-colors hover:text-accent-primary"
            >
              {item.label}
            </a>
          ) : (
            <Link
              key={item.label}
              href={item.href}
              className="block text-sm font-medium text-text-primary/84 transition-colors hover:text-accent-primary"
            >
              {item.label}
            </Link>
          )
        )}
      </div>
    </div>
  );
}

export default function HomeFooter() {
  return (
    <footer className="bg-linear-to-b from-bg-primary to-bg-secondary min-h-50 px-4 pb-28 pt-96 lg:px-8 lg:pb-10 lg:pt-12">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_280px_180px_140px_90px] lg:items-start">
        <div>
          <Link
            href="/"
            className="text-2xl flex font-semibold tracking-[-0.02em] text-text-primary items-end gap-1"
          >
            <Image src="/logo.svg" alt="EventVnv" width={30} height={30} />
            <p className="font-semibold logo translate-y-1.5">EventVnV</p>
          </Link>
          <p className="mt-4 max-w-md text-sm text-text-primary/60">
            © 2026 Eventvnv. Nigeria&apos;s premier event concierge, curating
            elegance across West Africa.
          </p>
        </div>
        {FOOTER_COLUMNS.map((column) => (
          <FooterColumn key={column.title} {...column} />
        ))}
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