import Link from "next/link";
import {
  BadgeCheck,
  CalendarCheck2,
  Compass,
  CreditCard,
  HeartHandshake,
  LockKeyhole,
  MapPin,
  Search,
  Sparkles,
  Store,
} from "lucide-react";
import HomeFooter from "@/components/layout/Footer";
import MobileDock from "@/components/layout/MobileDock";

// Data 

const STATS = [
  { id: "states", value: "36 + FCT", label: "States covered, from Lagos to Borno" },
  { id: "hosts", value: "10k+", label: "Event hosts & planners trust us" },
  { id: "escrow", value: "100%", label: "Payments protected by escrow" },
  { id: "vendors", value: "Verified", label: "Every vendor, vetted before listing" },
];

const OFFERINGS = [
  {
    id: "halls",
    icon: Store,
    title: "Event halls",
    description:
      "Browse halls by state and LGA, guest capacity, amenities and price - from intimate spaces to grand ballrooms - with real photos and transparent pricing.",
  },
  {
    id: "services",
    icon: Sparkles,
    title: "Event services",
    description:
      "Everything around the venue: DJs, MCs, photographers, videographers, event planners, make-up artists, ushers, security, car rental and hall decorators.",
  },
];

const STEPS = [
  {
    id: "discover",
    icon: Search,
    step: "01",
    title: "Discover",
    description:
      "Search halls and services by state, LGA, date and guest capacity. Save what you love and compare side by side.",
  },
  {
    id: "pay",
    icon: CreditCard,
    step: "02",
    title: "Book & pay securely",
    description:
      "Pick your dates and review transparent pricing with VAT included. Your dates are held while you pay securely - close the popup and they're released instantly.",
  },
  {
    id: "confirm",
    icon: BadgeCheck,
    step: "03",
    title: "Vendor confirms",
    description:
      "Your money is held safely in escrow while the vendor confirms. Your dates are locked in the moment payment succeeds.",
  },
  {
    id: "celebrate",
    icon: CalendarCheck2,
    step: "04",
    title: "Celebrate",
    description:
      "Enjoy your event. The vendor is paid out after everything goes smoothly and the dispute window closes.",
  },
];

const VALUES = [
  {
    id: "trust",
    icon: LockKeyhole,
    title: "Trust first",
    description:
      "Escrow-protected payments mean nobody carries the risk of a bad transaction alone.",
  },
  {
    id: "craft",
    icon: Sparkles,
    title: "Curated elegance",
    description:
      "We vet vendors and showcase quality - because your event deserves more than a gamble.",
  },
  {
    id: "coverage",
    icon: MapPin,
    title: "Everywhere you celebrate",
    description:
      "From Lagos ballrooms to family compounds in Enugu - we're built for all of Nigeria.",
  },
  {
    id: "people",
    icon: HeartHandshake,
    title: "People over bookings",
    description:
      "Behind every booking is a host's big day and a vendor's livelihood. We protect both.",
  },
];

const COVERAGE = [
  "Lagos", "FCT Abuja", "Rivers", "Oyo", "Kano", "Enugu", "Kaduna", "Delta",
  "Anambra", "Ogun", "Abia", "Edo", "Plateau", "Katsina",
];

// Page 

export default function AboutPage() {
  return (
    <main className="bg-bg-primary motion-safe:animate-fade-in">
      {/* Hero*/}
      <section className="bg-linear-to-b from-bg-tertiary to-bg-primary px-4 pb-16 pt-14 md:px-8 md:pt-20 lg:px-12">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-primary/48">
            Our story
          </p>
          <h1 className="mx-auto mt-4 max-w-3xl font-headline text-3xl font-bold leading-tight tracking-[-0.02em] text-text-primary md:text-5xl">
            Africa&apos;s events, beautifully orchestrated
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-[15px] leading-7 text-text-primary/70 md:text-base">
            EventVnV is Nigeria&apos;s premier event concierge. We bring every
            hall and every service - from the DJ to the decorators - into one
            marketplace with escrow-protected payments, so planning a
            world-class event feels effortless from first search to final song.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/listings"
              className="inline-flex items-center gap-2 rounded-full bg-accent-primary px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(214,92,58,0.3)] transition-transform hover:-translate-y-0.5"
            >
              <Compass className="h-4 w-4" />
              Explore halls & services
            </Link>
            <Link
              href="/vendor"
              className="inline-flex items-center gap-2 rounded-full border border-text-primary/20 bg-white px-6 py-3 text-sm font-semibold text-text-primary transition-colors hover:bg-bg-secondary"
            >
              <Store className="h-4 w-4" />
              Become a vendor
            </Link>
          </div>
        </div>
      </section>

      {/* Stats  */}
      <section className="bg-bg-tertiary px-4 py-10 md:px-8 lg:px-12">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 lg:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.id} className="text-center lg:text-left">
              <p className="font-headline text-2xl font-bold text-accent-primary md:text-3xl">
                {stat.value}
              </p>
              <p className="mt-1 text-xs leading-5 text-text-primary/60 md:text-sm">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/*  What we do */}
      <section className="px-4 py-16 md:px-8 md:py-20 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-primary/48">
            What we do
          </p>
          <h2 className="mt-3 max-w-2xl font-headline text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
            One marketplace for the entire event
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {OFFERINGS.map((offering) => (
              <div
                key={offering.id}
                className="rounded-card border border-[#F1E5D5] bg-white p-6 shadow-card transition-shadow hover:shadow-card-hover md:p-8"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-tint text-accent-primary">
                  <offering.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 font-headline text-lg font-bold text-text-primary">
                  {offering.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-text-primary/70">
                  {offering.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/*  How it works */}
      <section className="bg-bg-tertiary px-4 py-16 md:px-8 md:py-20 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-primary/48">
            How it works
          </p>
          <h2 className="mt-3 max-w-2xl font-headline text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
            From search to celebration in four steps
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className="rounded-card border border-[#F1E5D5] bg-white p-6 shadow-card"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-tint text-accent-primary">
                    <step.icon className="h-5 w-5" />
                  </span>
                  <span className="font-headline text-sm font-bold tabular-nums text-text-primary/30">
                    {step.step}
                  </span>
                </div>
                <h3 className="mt-5 font-headline text-base font-bold text-text-primary">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-text-primary/70">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="px-4 py-16 md:px-8 md:py-20 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-primary/48">
            What we stand for
          </p>
          <h2 className="mt-3 max-w-2xl font-headline text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
            Built on trust, styled with elegance
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {VALUES.map((value) => (
              <div key={value.id} className="flex gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-tint text-accent-primary">
                  <value.icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-headline text-base font-bold text-text-primary">
                    {value.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-6 text-text-primary/70">
                    {value.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/*  Coverage */}
      <section className="bg-bg-tertiary px-4 py-16 md:px-8 md:py-20 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-primary/48">
                Coverage
              </p>
              <h2 className="mt-3 font-headline text-2xl font-bold tracking-tight text-text-primary md:text-3xl">
                Wherever the party is
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-6 text-text-primary/60">
              Search by state and LGA to find halls and vendors close to your
              venue - or close to home.
            </p>
          </div>
          <ul className="mt-8 flex flex-wrap gap-2.5">
            {COVERAGE.map((state) => (
              <li
                key={state}
                className="flex items-center gap-1.5 rounded-full border border-[#F1E5D5] bg-white px-4 py-2 text-sm font-medium text-text-primary/80 shadow-card"
              >
                <MapPin className="h-3.5 w-3.5 text-accent-primary" />
                {state}
              </li>
            ))}
            <li className="rounded-full bg-accent-primary px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(214,92,58,0.28)]">
              + every state & FCT
            </li>
          </ul>
        </div>
      </section>

      {/* Vendor CTA */}
      <section className="px-4 py-16 md:px-8 md:py-20 lg:px-12">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-card bg-linear-to-br from-accent-primary to-[#b5441f] p-8 shadow-card md:p-12">
          <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div className="max-w-xl">
              <h2 className="font-headline text-2xl font-bold tracking-tight text-white md:text-3xl">
                Turn your venue into a business
              </h2>
              <p className="mt-3 text-sm leading-6 text-white/80">
                List your hall or service on EventVnV and reach thousands of
                hosts planning their next event. We handle discovery, booking
                and escrow-protected payments - you focus on delivering
                excellence.
              </p>
            </div>
            <Link
              href="/vendor"
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-accent-primary shadow-lg transition-transform hover:-translate-y-0.5"
            >
              <Store className="h-4 w-4" />
              Start listing
            </Link>
          </div>
        </div>
      </section>

      <HomeFooter />
      <MobileDock />
    </main>
  );
}