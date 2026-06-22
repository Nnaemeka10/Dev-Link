import { Minus, Plus } from "lucide-react";
export interface MapPricePin {
  label: string;
  top: string;
  left: string;
  active: boolean;
}

const MAP_PRICE_PINS: MapPricePin[] = [
  { label: "₦1.2M", top: "15%", left: "78%", active: false },
  { label: "₦450k", top: "20%", left: "42%", active: false },
  { label: "₦280k", top: "36%", left: "28%", active: true },
  { label: "₦600k", top: "58%", left: "60%", active: false },
  { label: "₦350k", top: "72%", left: "35%", active: false },
];

export default function StaticMapPanel() {
  return (
    <aside className="sticky top-0 h-screen overflow-hidden bg-[#DEDCD6]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_42%,rgba(188,180,169,0.95)_0_1.2%,transparent_1.3%),linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.10)_1px,transparent_1px)] bg-[length:100%_100%,120px_120px,120px_120px]" />
      {MAP_PRICE_PINS.map((pin) => (
        <span
          key={`${pin.label}-${pin.top}`}
          className={`absolute rounded-full px-4 py-3 text-sm font-extrabold shadow-[0_10px_18px_rgba(54,45,35,0.18)] ${
            pin.active ? "bg-[#A83A1C] text-white" : "bg-white text-[#252423]"
          }`}
          style={{ top: pin.top, left: pin.left }}
        >
          {pin.label}
        </span>
      ))}
      <div className="absolute bottom-6 right-6 flex flex-col gap-4">
        <button type="button" className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl shadow-md">
          <Plus className="h-5 w-5" />
        </button>
        <button type="button" className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl shadow-md">
          <Minus className="h-5 w-5" />
        </button>
      </div>
    </aside>
  );
}
