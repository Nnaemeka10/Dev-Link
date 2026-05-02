import { Armchair, Snowflake, UsersRound, Utensils, Zap } from "lucide-react";
import type { ListingFeature } from "../../details.types";

function FeatureIcon({ icon }: { icon: ListingFeature["icon"] }) {
  if (icon === "capacity") return <UsersRound className="h-5 w-5" />;
  if (icon === "power") return <Zap className="h-5 w-5" />;
  if (icon === "climate") return <Snowflake className="h-5 w-5" />;
  if (icon === "suite") return <Armchair className="h-5 w-5" />;
  if (icon === "catering") return <Utensils className="h-5 w-5" />;
  return <span className="text-xl font-extrabold">P</span>;
}

export default function ListingFeatures({ features, variant = "desktop" }: { features: ListingFeature[]; variant?: "desktop" | "mobile" }) {
  const mobile = variant === "mobile";

  return (
    <section className={mobile ? "px-5 py-9" : "border-t border-[#E8DED2] py-10"}>
      <h2 className={mobile ? "text-xl font-medium text-[#3A3734]" : "text-lg font-medium text-[#3A3734]"}>
        {mobile ? "Venue Features" : "What this place offers"}
      </h2>
      <div className={mobile ? "mt-6 grid grid-cols-2 gap-4" : "mt-8 grid grid-cols-2 gap-x-16 gap-y-7"}>
        {features.map((feature) => (
          <article
            key={feature.id}
            className={
              mobile
                ? "rounded-[1.6rem] bg-[#F5F2EC] p-5"
                : "grid grid-cols-[1.75rem_minmax(0,1fr)] gap-4"
            }
          >
            <div className="text-[#B9401D]">
              <FeatureIcon icon={feature.icon} />
            </div>
            <div className={mobile ? "mt-3" : ""}>
              <h3 className="text-sm font-extrabold text-[#3A3734]">{feature.label}</h3>
              <p className="mt-0.5 text-sm font-semibold leading-snug text-[#5E6588]">{feature.value}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
