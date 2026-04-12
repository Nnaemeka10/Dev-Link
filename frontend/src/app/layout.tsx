import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import Navbar from "@/components/layout/Navbar";
import Providers from "./providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const manrope = Manrope ({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EventVnV - Eventhalls, Djs, Caterers & More",
  description: "Discover and book Nigeria's finest event halls, DJs, caterers, and more with EventVnV. Your one-stop platform for unforgettable events.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${manrope.variable} h-full antialiased`}>
      <body className="min-h-full bg-bg-primary text-text-primary">
        <Providers>
          <div className="relative min-h-screen">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(201,153,58,0.08),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(214,92,58,0.08),transparent_35%)]" />
            <div className="relative z-10 flex min-h-screen flex-col">
              <Navbar />
              {children}
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
