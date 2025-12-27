# Is Cleveland busy today?

[isclevelandbusytoday.com](https://isclevelandbusytoday.com) is a simple, single-serving website that shows if it will be annoying to park downtown, based on whether events are happening at the larger venues (House of Blues, Rocket Arena, Huntington Bank Field, Convention Center, Public Hall).

## How it works

A GitHub Actions [`workflow`](https://github.com/skullface/isclevelandbusytoday/blob/main/.github/workflows/check-events.yml) runs a [`Python scraping script`](https://github.com/skullface/isclevelandbusytoday/blob/main/scripts/check_venues.py) daily at midnight ET (5:00 AM UTC) to check for events at the venues in [`/config/venues.json`](https://github.com/skullface/isclevelandbusytoday/blob/main/config/venues.json). The result is stored in [`/public/data/status.json`](https://github.com/skullface/isclevelandbusytoday/blob/main/public/data/status.json); any updates are committed and pushed. A single-page Next.js app reads the JSON at build time, rendering “No” for 0 events, “Probably” for 1 event, or “Yes” for 2+ events happening today.

OG image is dynamically generated (via [@vercel/og](https://vercel.com/docs/og-image-generation)) and favicon is dynamically updated per changes to `status.json`.

## How it was made

One-shot prompt with Cursor for basic functionality, then manually added the venue info and tweaked the fugly styling. Hosted on Vercel.

## Setup

### 1. Configure venues

Edit [`/config/venues.json`](https://github.com/skullface/isclevelandbusytoday/blob/main/config/venues.json) with venue information:

- `name`: Venue name
- `url`: URL to the venue’s events page
- `selector`: CSS selector to find event elements
- `dateAttribute`: (optional) HTML attribute containing the event date

### 2. Test locally

```bash
# Install Python dependencies
pip install -r requirements.txt

# Run the scraper
python scripts/check_venues.py

# Install Node.js dependencies
pnpm install

# Run the Next.js dev server
pnpm run dev
```

## Contributing

PRs welcome! &hearts;
