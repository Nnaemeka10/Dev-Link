import Link from "next/link";

const links = [
  { href: "/dashboard", label: "Overview" },
  { href: "/profile", label: "Profile" },
  { href: "/listings", label: "Browse listings" },
];

export default function Sidebar() {
  return (
    <aside className="rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-base font-semibold text-text-primary">Workspace</h2>
      <ul className="space-y-2 text-sm text-text-primary/80">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="block rounded-lg px-4 py-2 hover:bg-bg-secondary">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
