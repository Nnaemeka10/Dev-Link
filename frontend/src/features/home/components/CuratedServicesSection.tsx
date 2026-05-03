"use client";

import Image, { type StaticImageData } from "next/image";
import { Star } from "lucide-react";
import serviceA from "@/assets/home/curatedeventsa.png";
import serviceB from "@/assets/home/curatedservicesb.png";
import serviceC from "@/assets/home/curatedservicesc.png";
import serviceD from "@/assets/home/curatedservicesd.png";

interface ServiceItem {
  id: string;
  role: string;
  name: string;
  price: string;
  unit: string;
  rating: number;
  image: StaticImageData;
}

interface ServicesResponse {
  heading: string;
  subheading: string;
  ctaLabel: string;
  ctaLink: string;
  data: ServiceItem[];
}

const CURATED_SERVICES_RESPONSE: ServicesResponse = {
  heading: "Curated Event Services",
  subheading: "Top-rated professionals for your special day.",
  ctaLabel: "Explore all services",
  ctaLink: "services",
  data: [
    {
      id: "service-1",
      role: "Deejay",
      name: "DJ Spinall",
      price: "₦450,000",
      unit: "set",
      rating: 5,
      image: serviceA,
    },
    {
      id: "service-2",
      role: "Master of Ceremony",
      name: "Basketmouth",
      price: "₦750,000",
      unit: "event",
      rating: 5,
      image: serviceB,
    },
    {
      id: "service-3",
      role: "Photography",
      name: "TY Bello Studios",
      price: "₦300,000",
      unit: "coverage",
      rating: 4.9,
      image: serviceC,
    },
    {
      id: "service-4",
      role: "Make-up Artist",
      name: "Banke Meshida",
      price: "₦150,000",
      unit: "bridal",
      rating: 4.9,
      image: serviceD,
    },
  ],
};

export default function CuratedServicesSection() {
  return (
    <section className="px-4 py-10 md:px-8 md:py-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-start md:items-end justify-between md:mb-7">
          <div>
            <h2 className="text-heading-m font-semibold leading-tight text-text-primary md:text-4xl">
              {CURATED_SERVICES_RESPONSE.heading}
            </h2>
            <p className="mt-2 text-small text-text-primary/62 md:text-base">
              {CURATED_SERVICES_RESPONSE.subheading}
            </p>
          </div>
          <button type="button" className="text-small font-semibold text-text-primary underline md:text-sm">
            {CURATED_SERVICES_RESPONSE.ctaLabel}
          </button>
        </div>

        <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-4 md:gap-4 md:overflow-visible">
          {CURATED_SERVICES_RESPONSE.data.map((service, index) => (
            <article
              key={service.id}
              className="min-w-67.5 md:min-w-0 motion-safe:animate-fade-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="relative overflow-hidden rounded-2xl">
                <Image src={service.image} alt={service.name} className="h-62.5 w-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/65 to-transparent p-3 text-white">
                  <p className="uppercase tracking-widest text-white/75 text-tiny font-bold">{service.role}</p>
                  <h3 className="text-xl font-semibold leading-none">{service.name}</h3>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <p className="font-semibold text-text-primary text-base">
                  {service.price}
                  <span className="ml-1 text-sm font-normal text-text-primary/60">/{service.unit}</span>
                </p>
                <p className="inline-flex items-center gap-1 rounded-full bg-[#F6E9BE] px-2 py-1 text-xs font-semibold text-[#7E6000]">
                  <Star className="h-3 w-3 fill-current" />
                  {service.rating.toFixed(1)}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
