import {
  Armchair, Bath, ChefHat, Drama, Lightbulb, ShieldCheck, Sofa, Snowflake,
  Speaker, SquareParking, Tv, UsersRound, Utensils, UtensilsCrossed, Wifi, Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ListingFeature } from "../../details.types";

const FEATURE_ICONS: Record<string, LucideIcon> = {
  capacity: UsersRound, power: Zap, climate: Snowflake, suite: Armchair, catering: Utensils,
  parking: SquareParking, wifi: Wifi, "security-247": ShieldCheck,
  "sound-system": Speaker, "elevated-stage": Drama, "custom-lighting": Lightbulb,
  "led-screens": Tv, "premium-restrooms": Bath, "furniture-included": Sofa,
  "prep-kitchen": ChefHat, "in-house-catering": UtensilsCrossed,
};

function FeatureIcon({ icon, label }: { icon: ListingFeature["icon"]; label: string }) {
  const Icon = FEATURE_ICONS[icon];
  if (Icon) return <Icon className="h-5 w-5" />;
  return <span className="text-xl font-extrabold">{label.charAt(0).toUpperCase()}</span>;
}

export default function ListingFeatures({ features, variant = "desktop" }: { features: ListingFeature[]; variant?: "desktop" | "mobile" }) {
  const mobile = variant === "mobile";

  return (
    <section className={mobile ? "px-5 py-9" : "border-t border-[#E8DED2] py-10"}>
      <h2 className={mobile ? "md:text-xl text-heading-m font-medium text-[#3A3734]" : "text-lg font-medium text-[#3A3734]"}>
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
              <FeatureIcon icon={feature.icon} label = {feature.label} />
            </div>
            <div className={mobile ? "mt-3" : ""}>
              <h3 className="text-sm font-extrabold text-[#3A3734]">{feature.label}</h3>
              <p className="mt-0.5 md:text-sm text-tiny font-semibold leading-snug text-[#5E6588]">{feature.value}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
