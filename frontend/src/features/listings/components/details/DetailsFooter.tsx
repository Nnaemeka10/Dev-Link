import Image from "next/image";
import Link from "next/link";

const FOOTER_GROUPS = [
  ["Company", "About Us", "Careers", "Press Kit"],
  ["Support", "Contact Us", "Terms of Service", "Privacy Policy"],
  ["Connect", "Instagram", "LinkedIn", "Twitter"],
];

export default function ExploreFooter() {
  return (
    <footer className="mt-64 border-t border-[#E8DED2] pt-14 text-[#555B7F] bg-[#E8E4DC] px-8">
      <div className="grid grid-cols-4 gap-12">
        <div>
          <Link href="/" className="text-2xl flex font-semibold tracking-[-0.02em] text-text-primary items-end gap-1">
            <Image src="/logo.svg" alt="EventVnv" width={30} height={30} />
            <p className="font-semibold logo translate-y-1.5">EventVnV </p>
          </Link>
          <p className="mt-5 text-sm leading-6">Nigeria&apos;s premier concierge for high-end event planning and venue curation.</p>
        </div>
        {FOOTER_GROUPS.map(([title, ...links]) => (
          <div key={title}>
            <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-[#A83A1C]">{title}</h3>
            <div className="mt-5 space-y-3 text-sm">
              {links.map((link) => (
                <p key={link}>{link}</p>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-20 text-xs uppercase tracking-[0.18em]">© 2024 Eventvnv</p>
    </footer>
  );
}
