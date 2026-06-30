import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { PWARegister } from "@/components/PWARegister";
import "./globals.css";

const anthropicSerif = localFont({
  src: [
    {
      path: "../fonts/AnthropicSerif-Romans-Variable-25x258.ttf",
      style: "normal",
      weight: "300 700",
    },
    {
      path: "../fonts/AnthropicSerif-Italics-Variable-25x258.ttf",
      style: "italic",
      weight: "300 700",
    },
  ],
  variable: "--font-newsreader",
  display: "swap",
});

const anthropicSans = localFont({
  src: [
    {
      path: "../fonts/AnthropicSans-Romans-Variable-25x258.ttf",
      style: "normal",
      weight: "300 800",
    },
    {
      path: "../fonts/AnthropicSans-Italics-Variable-25x258.ttf",
      style: "italic",
      weight: "300 800",
    },
  ],
  variable: "--font-hanken",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Endure",
  description:
    "A quiet archive of effort. One mission, one deadline, one entry a night.",
  applicationName: "Endure",
  appleWebApp: {
    capable: true,
    title: "Endure",
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#f6eedb",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${anthropicSerif.variable} ${anthropicSans.variable}`}>
      <body>
        <PWARegister />
        {children}
      </body>
    </html>
  );
}
