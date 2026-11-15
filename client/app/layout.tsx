import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Navbar from "@/components/Navbar";
import { ToastProvider } from "@/components/ToastProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: "ReviewLens — Multilingual Product Review Intelligence",
  description:
    "Stateless NLP review analysis: spam filtering, multilingual aspect clustering, and grounded LLM synthesis.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-neutral-100 text-neutral-900">
        <ToastProvider>
          <Navbar />
          <div className="flex-1 flex flex-col">{children}</div>
        </ToastProvider>
      </body>
    </html>
  );
}
