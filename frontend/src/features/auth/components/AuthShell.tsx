import Image from "next/image";

import hallA from "@/assets/home/populareventsa.png";
import hallD from "@/assets/home/populareventsd.png";
import serviceB from "@/assets/home/curatedservicesb.png";
import Footer from "@/components/layout/Footer";

interface AuthShellProps {
  children: React.ReactNode;
  variant?: "centered" | "split";
}

export default function AuthShell({ children, variant = "centered" }: AuthShellProps) {
  return (
    <main className="min-h-screen bg-bg-primary text-[#252423]">
      {variant === "split" ? (
        <section className="mx-auto grid min-h-screen max-w-[92rem] gap-8 px-4 py-8 md:px-10 md:gap-12 md:py-10 lg:grid-cols-2 lg:items-center">
          {/* Aside: Form first on mobile, then aside */}
          <div className="order-2 lg:order-1">
            <aside className="flex flex-col justify-between">
              <div>
                <h1 className="text-2xl font-extrabold leading-tight tracking-[-0.04em] md:text-3xl lg:text-[4.6rem] lg:leading-[0.98]">
                  Discover Nigeria&apos;s finest <span className="text-[#B9401D]">curated</span> experiences.
                </h1>
              </div>
              {/* Mobile: Stacked images, Desktop: Overlapping images */}
              <div className="relative mt-8 h-auto md:h-80 lg:mt-0 lg:h-[24rem]">
                <div className="grid grid-cols-2 gap-4 md:gap-6 lg:absolute lg:h-[24rem] lg:w-full">
                  <Image
                    src={hallA}
                    alt="Curated event venue"
                    className="col-span-1 h-32 w-full rounded-2xl object-cover shadow-md md:h-40 lg:absolute lg:bottom-0 lg:left-0 lg:h-[22rem] lg:w-[19rem] lg:-rotate-2 lg:rounded-[2.2rem] lg:shadow-[0_22px_50px_rgba(34,27,18,0.18)]"
                  />
                  <Image
                    src={serviceB}
                    alt="Curated dining"
                    className="col-span-1 h-32 w-full rounded-2xl object-cover shadow-md md:h-40 lg:absolute lg:bottom-2 lg:left-[18rem] lg:h-[16rem] lg:w-[14rem] lg:rotate-6 lg:rounded-[2rem] lg:border-8 lg:border-bg-primary lg:shadow-[0_18px_42px_rgba(34,27,18,0.2)]"
                  />
                </div>
              </div>
            </aside>
          </div>
          {/* Form: Mobile first */}
          <div className="order-1 lg:order-2">{children}</div>
        </section>
      ) : (
        <section className="relative mx-auto flex min-h-[calc(100vh-15rem)] w-full max-w-5xl items-center justify-center px-4 py-10 md:px-6">
          {children}
          <Image
            src={hallD}
            alt="Editorial venue"
            className="pointer-events-none absolute bottom-2 right-8 hidden h-56 w-44 rotate-2 rounded-[2rem] object-cover opacity-45 shadow-[0_18px_42px_rgba(34,27,18,0.16)] lg:block"
          />
        </section>
      )}

      <Footer />
    </main>
  );
}
