import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CNA Shield — Voice-First Care Documentation",
  description:
    "Voice-powered shift documentation for CNAs. Log care, flag alerts, and generate handoffs in seconds.",
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
