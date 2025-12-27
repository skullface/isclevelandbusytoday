import { ImageResponse } from "@vercel/og";
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

export const runtime = "nodejs";

function getInterFont() {
  try {
    // Load local InterDisplay font files
    // @vercel/og requires TTF/OTF format, not WOFF2
    // Using Bold for regular (400) and Black for bold (700)
    const regularPath = join(
      process.cwd(),
      "public",
      "fonts",
      "InterDisplay-Bold.ttf"
    );
    const boldPath = join(
      process.cwd(),
      "public",
      "fonts",
      "InterDisplay-Black.ttf"
    );

    // Read files as binary
    const regularBuffer = readFileSync(regularPath);
    const boldBuffer = readFileSync(boldPath);

    // Convert Buffer to ArrayBuffer
    // Create a new ArrayBuffer and copy the data
    const regular = regularBuffer.buffer.slice(
      regularBuffer.byteOffset,
      regularBuffer.byteOffset + regularBuffer.byteLength
    );
    const bold = boldBuffer.buffer.slice(
      boldBuffer.byteOffset,
      boldBuffer.byteOffset + boldBuffer.byteLength
    );

    return [
      {
        name: "Inter",
        data: regular,
        weight: 400 as const,
        style: "normal" as const,
      },
      {
        name: "Inter",
        data: bold,
        weight: 700 as const,
        style: "normal" as const,
      },
    ];
  } catch (error) {
    console.error("Error loading Inter font:", error);
    // Return empty array to fall back to system fonts
    return [];
  }
}

export async function GET() {
  try {
    const status = getStatus();

    if (!status) {
      // Serve static fallback image
      try {
        const imagePath = join(process.cwd(), "public", "og.png");
        const imageBuffer = readFileSync(imagePath);
        return new NextResponse(imageBuffer, {
          headers: {
            "Content-Type": "image/png",
            "Cache-Control": "public, max-age=3600",
          },
        });
      } catch (error) {
        console.error("Error reading og.png:", error);
        // Fallback to generated error image if static file is missing
        const fonts = getInterFont();
        return new ImageResponse(
          (
            <div
              style={{
                height: "100%",
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#000",
                color: "#fff",
                fontSize: 48,
                fontFamily:
                  fonts.length > 0 ? "Inter" : "system-ui, sans-serif",
              }}
            >
              Maybe? Sorry, check back later.
            </div>
          ),
          {
            width: 1200,
            height: 630,
            ...(fonts.length > 0 && { fonts }),
          }
        );
      }
    }

    // Determine state based on event count (same logic as page.tsx)
    const eventCount = status.eventCount ?? (status.busy ? 2 : 0);

    let mainText: string;
    let mainColor: string;
    let descriptionText: string;

    if (eventCount >= 2) {
      mainText = "BUSY";
      mainColor = "#ef4444"; // red
      descriptionText = "There are multiple events\nin downtown CLE today.";
    } else if (eventCount === 1) {
      mainText = "BUSY-ISH";
      mainColor = "#f59e0b"; // amber/orange
      descriptionText = "There is 1 event\nin downtown CLE today.";
    } else {
      mainText = "NOT BUSY";
      mainColor = "#10b981"; // green
      descriptionText = "There are no events in\ndowntown CLE today.";
    }

    let fonts: any[] = [];
    try {
      fonts = getInterFont();
    } catch (fontError) {
      console.error("Font loading failed, using system fonts:", fontError);
    }

    const imageOptions: any = {
      width: 1200,
      height: 630,
    };

    if (fonts.length > 0) {
      imageOptions.fonts = fonts;
    }

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#000",
            fontFamily: fonts.length > 0 ? "Inter" : "system-ui, sans-serif",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 120,
              fontWeight: 700,
              color: mainColor,
              textAlign: "center",
            }}
          >
            {mainText}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 32,
              fontWeight: 400,
              color: "#fff",
              textAlign: "center",
              whiteSpace: "pre-line",
              lineHeight: 1.1,
            }}
          >
            {descriptionText}
          </div>
        </div>
      ),
      imageOptions
    );
  } catch (error) {
    console.error("Error in OG route handler:", error);
    // Return a simple error response
    return new NextResponse(
      JSON.stringify({ error: "Failed to generate OG image" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
