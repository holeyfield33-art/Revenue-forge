import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RevenueForge",
  description: "High-velocity validation and monetization for technical builders",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-foreground">{children}</body>
    </html>
  );
}
