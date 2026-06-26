import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GameProvider } from "@/lib/game-state";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sunset Galleria — Digital Mall Simulator",
  description: "Walk an early 2000s mall. Every store is a real web app.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col overflow-hidden">
        <GameProvider>{children}</GameProvider>
      </body>
    </html>
  );
}
