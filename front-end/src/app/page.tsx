import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
     
          <svg width="200" height="80" viewBox="0 0 200 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M40 25L55 15L70 25V45H40V25Z" fill="#D65C3A"/>
            <path d="M40 35H70" stroke="#C9993A" stroke-width="2"/>
            <path d="M45 45V55M65 45V55" stroke="#1A1F3C" stroke-width="2"/>
            <circle cx="55" cy="35" r="3" fill="#F9F6EF"/>
            <text x="80" y="50" font-family="Manrope, sans-serif" font-size="24" font-weight="bold" fill="#1A1F3C">eventvnv</text>
          </svg>
        </div>

  );
}
