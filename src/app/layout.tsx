import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { BlackDogPawWatermarkField } from "@/components/layout/BlackDogPawWatermarkField";
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
  title: "BlackDog Talent Hub",
  description: "Public Talent Map for global native talent coverage.",
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
      <body className="blackdog-paw-watermark-bg min-h-full flex flex-col">
        <BlackDogPawWatermarkField />
        {children}
      </body>
    </html>
  );
}
