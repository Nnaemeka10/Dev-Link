import Image from "next/image";
import Link from "next/link";
import hallA from "@/assets/home/populareventsa.png";
import hallD from "@/assets/home/populareventsd.png";
import serviceB from "@/assets/home/curatedservicesb.png";

interface AuthShellProps {
  children: React.ReactNode;
  variant?: "centered" | "split";
}

export default function AuthShell({ children, variant = "centered" }: AuthShellProps) {
  return (
    <main className="min-h-screen bg-bg-primary text-[#252423]">
      <header className="flex h-20 items-center border-b border-[#EFE8DE] bg-bg-primary/95 px-6 backdrop-blur md:px-10">
        <Link href="/" className="text-xl font-extrabold md:text-2xl">
          Eventvnv
        </Link>
        <nav className="ml-auto hidden items-center gap-9 text-base font-semibold text-[#5E6588] md:flex">
          <Link href="/listings">Venues</Link>
          <Link href="/listings">Vendors</Link>
          <Link href="/">Inspiration</Link>
          {variant === "centered" ? (
            <Link href="/login" className="rounded-full bg-[#B9401D] px-7 py-3 text-sm font-extrabold text-white">
              Sign In
            </Link>
          ) : null}
        </nav>
      </header>

      {variant === "split" ? (
        <section className="mx-auto grid min-h-[calc(100vh-10rem)] max-w-[92rem] gap-12 px-6 py-10 md:px-10 lg:grid-cols-[minmax(0,1fr)_minmax(28rem,40rem)] lg:items-center">
          <aside className="hidden min-h-[42rem] flex-col justify-between lg:flex">
            <div>
                <p className="text-2xl font-extrabold">Eventvnv</p>
              <h1 className="mt-12 max-w-2xl text-[4.6rem] font-extrabold leading-[0.98] tracking-[-0.04em]">
                Discover Nigeria&apos;s finest <span className="text-[#B9401D]">curated</span> experiences.
              </h1>
            </div>
            <div className="relative h-[24rem]">
              <Image
                src={hallA}
                alt="Curated event venue"
                className="absolute bottom-0 left-0 h-[22rem] w-[19rem] -rotate-2 rounded-[2.2rem] object-cover shadow-[0_22px_50px_rgba(34,27,18,0.18)]"
              />
              <Image
                src={serviceB}
                alt="Curated dining"
                className="absolute bottom-2 left-[18rem] h-[16rem] w-[14rem] rotate-6 rounded-[2rem] border-8 border-bg-primary object-cover shadow-[0_18px_42px_rgba(34,27,18,0.2)]"
              />
            </div>
          </aside>
          {children}
        </section>
      ) : (
        <section className="relative mx-auto flex min-h-[calc(100vh-15rem)] w-full max-w-5xl items-center justify-center px-6 py-10">
          {children}
          <Image
            src={hallD}
            alt="Editorial venue"
            className="pointer-events-none absolute bottom-2 right-8 hidden h-56 w-44 rotate-2 rounded-[2rem] object-cover opacity-45 shadow-[0_18px_42px_rgba(34,27,18,0.16)] lg:block"
          />
        </section>
      )}

      <footer className="flex flex-col gap-6 border-t border-[#EFE8DE] bg-[#F4F1EA] px-6 py-10 text-[#6B5F57] md:flex-row md:items-center md:px-10">
        <div>
          <p className="text-lg font-extrabold text-[#252423]">Eventvnv.</p>
          <p className="mt-2">© 2024 Eventvnv. Designed for Lagos.</p>
        </div>
        <nav className="flex flex-wrap gap-7 md:ml-auto">
          <Link href="/">Privacy Policy</Link>
          <Link href="/">Terms of Service</Link>
          <Link href="/">Help Center</Link>
          <Link href="/">Contact</Link>
        </nav>
      </footer>
    </main>
  );
}
