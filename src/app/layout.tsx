import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "HackMitra | Every Hackathon. Every District. One Platform.",
  description:
    "Discover genuine, moderator-verified hackathons across all 31 districts of Karnataka—including colleges, universities, KDEM clusters, and Beyond Bengaluru.",
  keywords: [
    "Karnataka hackathons",
    "Bengaluru hackathons",
    "Hubballi-Dharwad hackathons",
    "Mysuru hackathons",
    "Mangaluru hackathons",
    "Belagavi hackathons",
    "VTU hackathons",
    "Beyond Bengaluru",
    "HackMitra",
    "NAIN Karnataka",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen flex flex-col bg-[#F5F7FA] text-[#0F172A] antialiased selection:bg-[#2563EB] selection:text-white">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
