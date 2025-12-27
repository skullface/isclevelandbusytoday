# Is Cleveland Busy Today?

A simple website that shows if downtown Cleveland will be busy (for parking purposes) based on whether events are happening at specific venues.

## How It Works

1. A GitHub Actions workflow runs daily at midnight ET (5:00 AM UTC)
2. A Python script scrapes venue event pages to check for events on the current date
3. The result is stored in `public/data/status.json`
4. The Next.js website displays "YES" or "NO" based on the status

## Setup

### 1. Configure Venues

Edit `config/venues.json` with your venue information:

```json
[
  {
    "name": "Rocket Mortgage FieldHouse",
    "url": "https://www.rocketmortgagefieldhouse.com/events",
    "selector": ".event-item",
    "dateAttribute": "data-date"
  }
]
```

- `name`: Venue name (for logging)
- `url`: URL to the venue's events page
- `selector`: CSS selector to find event elements
- `dateAttribute`: (optional) HTML attribute containing the event date

### 2. Test Locally

```bash
# Install Python dependencies
pip install -r requirements.txt

# Run the scraper
python scripts/check_venues.py

# Install Node.js dependencies
npm install

# Run the Next.js dev server
npm run dev
```

### 3. Deploy

The site can be deployed to Vercel (free tier) or any static hosting service:

```bash
npm run build
```

The built site will be in the `out/` directory.

## GitHub Actions

The workflow automatically:

- Runs daily at midnight ET
- Scrapes all configured venues
- Updates `data/status.json`
- Commits and pushes the update

You can also manually trigger it from the GitHub Actions tab.

## Adding Venues

1. Add venue configuration to `config/venues.json`
2. Test locally with `python scripts/check_venues.py`
3. The GitHub Action will automatically pick up the new venue

## Notes

- The scraper checks for events matching today's date in Eastern Time
- If any venue has an event, the status is "busy" (YES)
- If scraping fails for a venue, it assumes no event (conservative approach)
