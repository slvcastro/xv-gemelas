import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter, Great_Vibes } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const greatVibes = Great_Vibes({
  variable: "--font-great-vibes",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "XV Años · Kelly & Kyara",
  description: "Sábado 28 de noviembre de 2026 · Ticul, Yucatán. ¡Nos encantará celebrar contigo!",
  openGraph: {
    title: "XV Años · Kelly & Kyara",
    description: "Sábado 28 de noviembre de 2026 · Ticul, Yucatán",
    locale: "es_MX",
    type: "website",
  },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#05214B",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${playfair.variable} ${inter.variable} ${greatVibes.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-navy text-blue-ice font-sans">
        {children}
      </body>
    </html>
  );
}
