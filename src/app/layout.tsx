import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Peta Kurikulum Fasilkom UI - CS & IS Curriculum Map",
  description: "Visualisasi interaktif peta kurikulum untuk program studi Ilmu Komputer (CS) dan Sistem Informasi (IS) Fakultas Ilmu Komputer Universitas Indonesia.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased bg-[#111111] text-[#F8FAFC]`}
      >
        {children}
      </body>
    </html>
  );
}
