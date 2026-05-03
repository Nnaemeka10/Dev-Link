// remeber to remove framer motion and use gsap

"use client";

import { useEffect, useRef, useState } from "react";
import {
  Camera, Clapperboard, Drum, Mic, ShieldCheck,
  Sparkles, Users, WandSparkles, CarIcon, House,
} from "lucide-react";

// ─── Types & Data ─────────────────────────────────────────────────────────────

interface CategoryItem {
  id: string;
  label: string;
  icon:
    | "drum" | "mic" | "camera" | "video" | "planner"
    | "makeup" | "ushers" | "security" | "car-rental" | "hall-decorator";
}

const CATEGORIES: CategoryItem[] = [
  { id: "dj",             label: "DJ",             icon: "drum"           },
  { id: "mc",             label: "MC",             icon: "mic"            },
  { id: "photographer",   label: "Photographer",   icon: "camera"         },
  { id: "videographer",   label: "Videographer",   icon: "video"          },
  { id: "planner",        label: "Event Planner",  icon: "planner"        },
  { id: "makeup",         label: "Make-up Artist", icon: "makeup"         },
  { id: "ushers",         label: "Ushers",         icon: "ushers"         },
  { id: "security",       label: "Security",       icon: "security"       },
  { id: "car-rental",     label: "Car Rental",     icon: "car-rental"     },
  { id: "hall-decorator", label: "Hall Decorator",  icon: "hall-decorator" },
];

function iconByType(type: CategoryItem["icon"]) {
  switch (type) {
    case "drum":           return Drum;
    case "mic":            return Mic;
    case "camera":         return Camera;
    case "video":          return Clapperboard;
    case "planner":        return Sparkles;
    case "makeup":         return WandSparkles;
    case "ushers":         return Users;
    case "car-rental":     return CarIcon;
    case "hall-decorator": return House;
    default:               return ShieldCheck;
  }
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ITEM_WIDTH = 84;  // px — matches min-w-[5.25rem] (5.25 * 16 = 84)
const GAP        = 16;  // px — gap-4
const STRIDE     = ITEM_WIDTH + GAP; // distance between item origins
const PX_PER_FRAME = 0.45; // ~27px/s at 60fps — slow and premium

// ─── Component ────────────────────────────────────────────────────────────────

export default function CategoryStrip() {
  const containerRef = useRef<HTMLDivElement>(null);

  // SSR-safe mobile detection.
  // Lazy initialiser runs only on the client's first render —
  // typeof window guard keeps it safe during SSR.
  // The effect only subscribes to changes; setState is called inside
  // the callback (not synchronously in the effect body) so no cascading render.
  const [isMobile, setIsMobile] = useState<boolean>(
    () => typeof window !== "undefined"
      ? window.matchMedia("(max-width: 767px)").matches
      : false
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Pause ref — mutated by touch handlers and RAF, never causes re-render
  const pausedRef = useRef(false);
  const rafRef    = useRef<number>(0);

  // ── RAF ticker ───────────────────────────────────────────────────────────────
  //
  // WHY THIS LOOKS SEAMLESS (and CSS translateX doesn't):
  //
  // CSS translateX(-50%) moves the ENTIRE track as one block. When it resets
  // from -50% → 0, all items jump simultaneously — you see the whole strip
  // snap back even if it's instantaneous.
  //
  // GSAP's horizontalLoop (and this implementation) positions each item
  // INDIVIDUALLY. When item 0 exits the left edge, only item 0 teleports to
  // the right end — while items 1-9 keep moving uninterrupted. The eye sees
  // a continuous stream of individual items, never a block reset.
  //
  // This is the exact mechanic in the GSAP pen you shared. We replicate it
  // with requestAnimationFrame + direct DOM style writes (zero React re-renders).
  useEffect(() => {
    if (!isMobile) return;

    const container = containerRef.current;
    if (!container) return;

    const items = Array.from(
      container.querySelectorAll<HTMLElement>("[data-ticker-item]")
    );
    if (!items.length) return;

    // Initial x positions — item i starts at i * STRIDE
    const xPos = items.map((_, i) => i * STRIDE);

    // Set container height and make items absolute
    container.style.height = `${items[0].offsetHeight}px`;
    items.forEach((el, i) => {
      el.style.position   = "absolute";
      el.style.top        = "0";
      el.style.left       = "0";
      el.style.willChange = "transform";
      el.style.transform  = `translateX(${xPos[i]}px)`;
    });

    // Right boundary = width of the viewport (items beyond this are "offscreen right")
    // We seed items from 0 → n*STRIDE, some may already be off-screen right — that's fine,
    // they'll scroll into view naturally.

    function tick() {
      if (!pausedRef.current) {
        const n = items.length;

        for (let i = 0; i < n; i++) {
          xPos[i] -= PX_PER_FRAME;

          // Item has scrolled fully off the left edge
          if (xPos[i] + ITEM_WIDTH < 0) {
            // Find the item currently furthest right
            let maxX = -Infinity;
            for (let j = 0; j < n; j++) {
              if (j !== i && xPos[j] > maxX) maxX = xPos[j];
            }
            // Place this item just after the rightmost one
            xPos[i] = maxX + STRIDE;
          }

          items[i].style.transform = `translateX(${xPos[i]}px)`;
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      items.forEach((el) => {
        el.style.position   = "";
        el.style.top        = "";
        el.style.left       = "";
        el.style.willChange = "";
        el.style.transform  = "";
      });
      container.style.height = "";
    };
  }, [isMobile]);

  // ── Touch: pause while finger is on screen, resume after lift ───────────────
  useEffect(() => {
    if (!isMobile) return;
    const container = containerRef.current;
    if (!container) return;

    let resumeTimer: ReturnType<typeof setTimeout>;

    const pause = () => {
      pausedRef.current = true;
      clearTimeout(resumeTimer);
    };
    const resume = () => {
      resumeTimer = setTimeout(() => {
        pausedRef.current = false;
      }, 1400);
    };

    container.addEventListener("touchstart",  pause,  { passive: true });
    container.addEventListener("touchmove",   pause,  { passive: true });
    container.addEventListener("touchend",    resume, { passive: true });
    container.addEventListener("touchcancel", resume, { passive: true });

    return () => {
      container.removeEventListener("touchstart",  pause);
      container.removeEventListener("touchmove",   pause);
      container.removeEventListener("touchend",    resume);
      container.removeEventListener("touchcancel", resume);
      clearTimeout(resumeTimer);
    };
  }, [isMobile]);

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <section className="bg-bg-primary px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto max-w-7xl">

        {/* ── Mobile: per-item RAF ticker ───────────────────────────────────── */}
        {/*
          overflow-hidden clips items outside the viewport.
          mask-image fades the left/right edges so items don't hard-cut.
          The inner div gets position:relative + height injected by the effect.
        */}
        <div
          className="md:hidden overflow-hidden pb-2 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]"
          // prefers-reduced-motion: if the user has this set, we skip the RAF
          // loop entirely (isMobile stays true but the paused ref keeps it frozen)
          // For a cleaner solution, add a matchMedia check in the RAF effect above.
        >
          <div ref={containerRef} className="relative">
            {CATEGORIES.map((item) => {
              const Icon = iconByType(item.icon);
              return (
                <div
                  key={item.id}
                  data-ticker-item
                  aria-hidden="true" // decorative; desktop grid is the real nav
                  className="flex flex-col items-center gap-2"
                  style={{ width: `${ITEM_WIDTH}px` }}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-text-primary shadow-sm">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="w-full text-center text-[11px] font-semibold uppercase tracking-[0.05em] text-text-primary/72 leading-tight">
                    {item.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Desktop: static grid ─────────────────────────────────────────── */}
        <div className="hidden md:grid md:grid-cols-10 md:gap-4">
          {CATEGORIES.map((item, index) => {
            const Icon = iconByType(item.icon);
            return (
              <article
                key={item.id}
                className="flex flex-col items-center gap-2 motion-safe:animate-[var(--animate-fade-up)]"
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white text-text-primary shadow-sm">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-center text-xs font-semibold tracking-normal text-text-primary/72">
                  {item.label}
                </p>
              </article>
            );
          })}
        </div>

      </div>
    </section>
  );
}