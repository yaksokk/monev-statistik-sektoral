import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Monev Statistik Sektoral",
  description: "Monitoring dan evaluasi Statistik Sektoral OPD",
};

export const viewport: Viewport = {
  themeColor: "#f8fafc", // samakan dengan latar halaman
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={geist.variable}>
      <body>
        <a
          href="#konten"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-white"
        >
          Lewati ke konten utama
        </a>
        {children}
      </body>
    </html>
  );
}