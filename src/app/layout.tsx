import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Mission ML: Kirtagya will be a Machine Learning Engineer in 2027",
  description:
    "Personal ML roadmap tracker — track courses, videos, and playlists on the journey to becoming a Machine Learning Engineer by 2027.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="bg-dots antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
