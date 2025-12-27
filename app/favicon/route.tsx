import { readFileSync } from "fs";
import { join } from "path";
import { NextResponse } from "next/server";

interface Status {
  busy: boolean;
  eventCount: number;
  venues: any[];
  date: string;
  checkedAt: string;
}

function getStatus(): Status | null {
  try {
    const filePath = join(process.cwd(), "public", "data", "status.json");
    const fileContents = readFileSync(filePath, "utf8");
    return JSON.parse(fileContents) as Status;
  } catch (error) {
    console.error("Error reading status.json:", error);
    return null;
  }
}

function getFaviconPath(eventCount: number): string {
  // Determine favicon based on event count (same logic as og/route.tsx)
  if (eventCount >= 2) {
    return join(process.cwd(), "public", "favicon-busy.png");
  } else if (eventCount === 1) {
    return join(process.cwd(), "public", "favicon-busy-ish.png");
  } else {
    return join(process.cwd(), "public", "favicon-not-busy.png");
  }
}

export const runtime = "nodejs";

export async function GET() {
  try {
    const status = getStatus();

    // Determine event count (same logic as og/route.tsx and page.tsx)
    const eventCount = status?.eventCount ?? (status?.busy ? 2 : 0);

    // Get the appropriate favicon path
    const faviconPath = getFaviconPath(eventCount);

    // Read and serve the favicon
    const faviconBuffer = readFileSync(faviconPath);

    return new NextResponse(faviconBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Error serving favicon:", error);
    // Fallback to not-busy favicon if there's an error
    try {
      const fallbackPath = join(
        process.cwd(),
        "public",
        "favicon-not-busy.png"
      );
      const fallbackBuffer = readFileSync(fallbackPath);
      return new NextResponse(fallbackBuffer, {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=3600",
        },
      });
    } catch (fallbackError) {
      console.error("Error serving fallback favicon:", fallbackError);
      return new NextResponse("Favicon not found", { status: 404 });
    }
  }
}

