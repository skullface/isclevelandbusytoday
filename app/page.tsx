import { readFileSync } from "fs";
import { join } from "path";

interface Venue {
  name: string;
  url: string;
}

interface Status {
  busy: boolean;
  eventCount: number;
  venues: Venue[];
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

export default function Home() {
  const status = getStatus();

  if (!status) {
    return (
      <div style={styles.container}>
        <p>Unable to load downtown status right now, sorry :(</p>
      </div>
    );
  }

  // Determine answer based on event count
  // Fallback to busy field for backward compatibility
  const eventCount = status.eventCount ?? (status.busy ? 2 : 0);
  const venues = status.venues ?? [];

  let answer: string;
  let answerColor: string;
  if (eventCount >= 2) {
    answer = "Yes";
    answerColor = "#ef4444"; // red
  } else if (eventCount === 1) {
    answer = "Probably";
    answerColor = "#f59e0b"; // amber/orange
  } else {
    answer = "No";
    answerColor = "#10b981"; // green
  }

  // Format date string (YYYY-MM-DD) as Eastern Time date
  // Since the date string is date-only, we'll parse it and format it directly in ET
  const formatETDate = (dateStr: string): string => {
    // Parse the date components (YYYY-MM-DD)
    const [year, month, day] = dateStr.split("-").map(Number);

    // Create a date object that represents this date at noon in ET
    // We do this by creating a date string with explicit ET timezone offset
    // For December (EST), use -05:00. The formatter will handle DST correctly.
    const dateStrWithET = `${year}-${String(month).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}T12:00:00-05:00`;
    const date = new Date(dateStrWithET);

    // Use Intl.DateTimeFormat for reliable timezone formatting
    const formatter = new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      timeZone: "America/New_York",
    });

    return formatter.format(date);
  };

  return (
    <div style={styles.pageContainer}>
      <main style={styles.container}>
        <h1 style={styles.title}>
          Is downtown Cleveland busy today,{" "}
          {status.date ? formatETDate(status.date) : "today"}?
        </h1>
        <p style={{ ...styles.answer, color: answerColor }}>{answer}.</p>
        {venues && venues.length > 0 && (
          <p>
            There {venues.length === 1 ? "is" : "are"} {venues.length} event
            {venues.length > 1 && "s"} at{" "}
            {venues.map((venue, index) => (
              <span key={index}>
                <a href={venue.url} target="_blank" rel="noopener noreferrer">
                  {venue.name}
                </a>
                {index < venues.length - 2 && ", "}
                {index === venues.length - 2 && " and "}
              </span>
            ))}
            .
          </p>
        )}
      </main>
      <footer style={styles.timestamp}>
        {status.checkedAt && (
          <p>
            Last checked:{" "}
            {new Date(status.checkedAt).toLocaleString("en-US", {
              timeZone: "America/New_York",
              month: "2-digit",
              day: "2-digit",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            })}
          </p>
        )}
      </footer>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  pageContainer: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    textAlign: "center",
    padding: "2rem",
  },
  container: {
    alignSelf: "center",
    display: "flex",
    flexDirection: "column",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    gap: "1rem",
  },
  title: {
    fontSize: "2rem",
    fontWeight: "500",
    textWrap: "balance",
  },
  answer: {
    fontSize: "4rem",
    fontWeight: "700",
    lineHeight: 1,
  },
  timestamp: {
    opacity: 0.5,
    fontSize: "0.75rem",
  },
};
