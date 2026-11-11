"use client";

import { useId } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";

const EASE_OUT = [0.16, 1, 0.3, 1] as const;
const HEIGHT_TRANSITION = { duration: 0.34, ease: EASE_OUT };

export interface AccordionPackage {
  id: string;
  name: string;
  price: string;
  description?: string;
  isPopular?: boolean;
  features: string[];
}

interface PackageAccordionProps {
  packages: AccordionPackage[];
  selectedId: string;
  onSelect: (id: string) => void;
  variant?: "mobile" | "desktop";
}

/**
 * Single-select package picker.
 *
 * The perks panel animates its own height (0 ⇄ auto) and the card box simply
 * follows in normal document flow - no layout transforms on the card, so its
 * border, padding and text never scale or snap mid-transition. Selecting a
 * different package collapses the old panel and opens the new one on the same
 * curve, so the stack glides instead of jumping. Perks stagger in behind it.
 */
export default function PackageAccordion({
  packages,
  selectedId,
  onSelect,
  variant = "desktop",
}: PackageAccordionProps) {
  const reduced = useReducedMotion();
  const groupId = useId();
  const mobile = variant === "mobile";

  if (packages.length === 0) return null;

  return (
    <div className={mobile ? "space-y-4" : "space-y-4"}>
      {packages.map((pkg) => {
        const isSelected = pkg.id === selectedId;
        const panelId = `${groupId}-${pkg.id}-perks`;

        return (
          <div key={pkg.id} className="relative">
            <button
              type="button"
              onClick={() => onSelect(pkg.id)}
              aria-expanded={isSelected}
              aria-controls={panelId}
              className={[
                "block w-full rounded-2xl border-2 p-5 text-left",
                "transition-[background-color,border-color,box-shadow,padding] duration-300 ease-out",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B9401D]",
                isSelected
                  ? "border-[#252423] bg-[#F9F7F5] shadow-[0_10px_28px_rgba(36,28,18,0.07)]"
                  : "border-[#E8DDD2] bg-white hover:border-[#252423]/45",
                isSelected ? "pb-5" : "pb-4",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-3">
                <h4
                  className={`font-bold text-[#252423] ${mobile ? "text-base" : "text-lg"}`}
                >
                  {pkg.name}
                </h4>

                <div className="flex shrink-0 items-center gap-2">
                  {pkg.isPopular && (
                    <span className="rounded-full bg-[#FFDFA7] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#B9401D]">
                      Popular
                    </span>
                  )}
                  <motion.span
                    animate={{ rotate: isSelected ? 180 : 0 }}
                    transition={{ duration: 0.28, ease: EASE_OUT }}
                    className="text-[#7B7E9B]"
                    aria-hidden="true"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </motion.span>
                </div>
              </div>

              <p
                className={`mt-1.5 font-extrabold text-[#252423] ${
                  mobile ? "text-lg" : "text-2xl"
                }`}
              >
                {pkg.price}
              </p>

              {pkg.description && (
                <p
                  className={`mt-2 text-[#5E6588] ${
                    mobile ? "text-small" : "text-sm"
                  }`}
                >
                  {pkg.description}
                </p>
              )}

              <AnimatePresence initial={false}>
                {isSelected && pkg.features.length > 0 && (
                  <motion.div
                    key="perks"
                    id={panelId}
                    initial={reduced ? false : { height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
                    transition={{
                      height: reduced ? { duration: 0 } : HEIGHT_TRANSITION,
                      opacity: { duration: 0.2, ease: "easeOut" },
                    }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 border-t border-[#E8DDD2] pt-4">
                      <motion.ul
                        className={mobile ? "space-y-3" : "space-y-3"}
                        initial="hidden"
                        animate="show"
                        variants={{
                          hidden: {},
                          show: {
                            transition: {
                              staggerChildren: reduced ? 0 : 0.05,
                              delayChildren: reduced ? 0 : 0.08,
                            },
                          },
                        }}
                      >
                        {pkg.features.map((feature, index) => (
                          <motion.li
                            key={index}
                            variants={{
                              hidden: reduced
                                ? { opacity: 1 }
                                : { opacity: 0, y: 8 },
                              show: { opacity: 1, y: 0 },
                            }}
                            transition={{ duration: 0.28, ease: EASE_OUT }}
                            className={`flex items-start gap-3 font-medium text-[#252423] ${
                              mobile ? "text-small" : "text-sm"
                            }`}
                          >
                            <Check
                              className="mt-0.5 h-4 w-4 shrink-0 text-[#B9401D]"
                              aria-hidden="true"
                            />
                            <span>{feature}</span>
                          </motion.li>
                        ))}
                      </motion.ul>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        );
      })}
    </div>
  );
}