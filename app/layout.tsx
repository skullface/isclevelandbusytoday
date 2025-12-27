import type { Metadata } from "next";
import "./globals.css";
import { readFileSync } from "fs";
import { join } from "path";

  openGraph: {
    images: ["/og.png"],
  },
};
function getStatusDate(): string {
  try {
    const filePath = join(process.cwd(), "public", "data", "status.json");
    const fileContents = readFileSync(filePath, "utf8");
    const status = JSON.parse(fileContents);
    return status.date || new Date().toISOString().split("T")[0];
  } catch (error) {
    // Fallback to today’s date if status.json can’t be read
    return new Date().toISOString().split("T")[0];
  }
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Is downtown Cleveland busy today?",
    description:
      "Will parking be a problem today in CLE? Check if there's an event at one of the larger venues downtown.",
    icons: {
      icon: "/favicon",
      shortcut: "/favicon",
      apple: "/favicon",
    },
    openGraph: {
      images: [ogImageUrl],
    },
  };
}

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
