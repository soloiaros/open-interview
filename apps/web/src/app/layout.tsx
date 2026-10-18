import type { Metadata } from "next";
import { DM_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { APP_NAME } from "@/lib/brand";

const instrument = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-instrument" });
const dmMono = DM_Mono({ subsets: ["latin"], weight: "500", variable: "--font-dm-mono" });

export const metadata: Metadata = {
  title: APP_NAME,
  description: "Interview your experts. Keep what they know.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${instrument.variable} ${dmMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
