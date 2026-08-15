import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import "@/styles/globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Studio Ops",
  description:
    "Front-desk operations for a fitness studio: today's timetable at a glance.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${inter.variable} h-full`}
    >
      <body className="min-h-full bg-surface-sunken text-sm text-text-primary">
        {children}
      </body>
    </html>
  );
}
