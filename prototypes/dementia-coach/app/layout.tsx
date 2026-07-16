import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dementia Coach — Compassionate Guidance for Caregivers",
  description:
    "AI-powered scripts for family caregivers navigating difficult dementia moments, using validation therapy.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={geist.variable}>
      <body className="min-h-screen antialiased">
        {children}
        <script defer src="/_vercel/insights/script.js"></script>
      </body>
    </html>
  );
}
