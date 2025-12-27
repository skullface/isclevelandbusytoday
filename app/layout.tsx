import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Is downtown Cleveland busy today?",
  description:
    "Will parking be a problem today in CLE? Check if there's an event at one of the larger venues downtown.",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
