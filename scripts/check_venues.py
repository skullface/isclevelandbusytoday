#!/usr/bin/env python3
"""
Scrapes venue event pages to check if any events are happening today.
Outputs result to public/data/status.json
"""

import json
import os
import sys
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

import requests
from bs4 import BeautifulSoup

# Eastern Time zone
ET = ZoneInfo("America/New_York")

# Browser-like headers to avoid 403 errors
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
}


def get_today_et():
    """Get today's date in Eastern Time."""
    return datetime.now(ET).date()


def check_venue(venue_config):
    """
    Check if a venue has an event today.
    
    Args:
        venue_config: Dict with 'name', 'url', 'selector', and optionally 'dateAttribute'
    
    Returns:
        bool: True if event found, False otherwise
    """
    try:
        # Fetch the events page with browser-like headers
        response = requests.get(venue_config["url"], headers=HEADERS, timeout=10)
        response.raise_for_status()
        
        # Parse HTML
        soup = BeautifulSoup(response.content, "lxml")
        
        # Find elements matching the selector
        elements = soup.select(venue_config["selector"])
        
        if not elements:
            return False
        
        today = get_today_et()
        current_year = today.year
        
        # Date formats to try parsing (with year)
        date_formats = [
            "%Y-%m-%d",           # 2025-12-26
            "%m/%d/%Y",           # 12/26/2025
            "%B %d, %Y",          # December 26, 2025
            "%b %d, %Y",          # Dec 26, 2025
            "%B %d %Y",           # December 26 2025
            "%b %d %Y",           # Dec 26 2025 (also Jan 2 2026)
            "%a %b %d, %Y",       # Fri Jan 16, 2026
            "%a %b %d %Y",        # Fri Jan 16 2026
        ]
        
        # Date formats without year (assume current year)
        date_formats_no_year = [
            "%b %d",              # Jan 2
            "%B %d",              # January 2
            "%m/%d",              # 1/2
        ]
        
        # Check each element for today's date
        for element in elements:
            # If dateAttribute is specified, check that attribute
            if "dateAttribute" in venue_config and venue_config["dateAttribute"]:
                date_str = element.get(venue_config["dateAttribute"], "").strip()
                if date_str:
                    # Try to parse the date with year
                    for fmt in date_formats:
                        try:
                            event_date = datetime.strptime(date_str, fmt).date()
                            if event_date == today:
                                return True
                        except ValueError:
                            continue
                    
                    # Try to parse the date without year (assume current year)
                    for fmt in date_formats_no_year:
                        try:
                            event_date = datetime.strptime(date_str, fmt).date()
                            # Replace year with current year
                            event_date = event_date.replace(year=current_year)
                            if event_date == today:
                                return True
                        except ValueError:
                            continue
            
            # Also check text content for today's date
            text = element.get_text().strip()
            
            # Try parsing the full text as a date with year
            for fmt in date_formats:
                try:
                    event_date = datetime.strptime(text, fmt).date()
                    if event_date == today:
                        return True
                except ValueError:
                    continue
            
            # Try parsing the full text as a date without year (assume current year)
            for fmt in date_formats_no_year:
                try:
                    event_date = datetime.strptime(text, fmt).date()
                    # Replace year with current year
                    event_date = event_date.replace(year=current_year)
                    if event_date == today:
                        return True
                except ValueError:
                    continue
            
            # Handle date ranges (e.g., "Jan 9, 2026 - Jan 18, 2026")
            if " - " in text:
                try:
                    start_str, end_str = text.split(" - ", 1)
                    for fmt in date_formats:
                        try:
                            start_date = datetime.strptime(start_str.strip(), fmt).date()
                            end_date = datetime.strptime(end_str.strip(), fmt).date()
                            if start_date <= today <= end_date:
                                return True
                        except ValueError:
                            continue
                except Exception:
                    pass
            
            # Fallback: check if today's date string appears in text
            today_str = today.strftime("%Y-%m-%d")
            today_str_alt = today.strftime("%m/%d/%Y")
            today_str_alt2 = today.strftime("%B %d, %Y")
            today_str_alt3 = today.strftime("%b %d, %Y")
            today_str_alt4 = today.strftime("%B %d %Y")
            today_str_alt5 = today.strftime("%b %d %Y")
            today_str_alt6 = today.strftime("%b %d")  # Jan 2 (no year)
            today_str_alt7 = today.strftime("%B %d")  # January 2 (no year)
            today_str_alt8 = today.strftime("%m/%d")  # 1/2 (no year)
            
            if (today_str in text or today_str_alt in text or today_str_alt2 in text or 
                today_str_alt3 in text or today_str_alt4 in text or today_str_alt5 in text or
                today_str_alt6 in text or today_str_alt7 in text or today_str_alt8 in text):
                return True
        
        return False
    
    except Exception as e:
        print(f"Error checking {venue_config['name']}: {e}", file=sys.stderr)
        # On error, assume no event (conservative approach)
        return False


def main():
    # Load venue configuration
    config_path = Path(__file__).parent.parent / "config" / "venues.json"
    with open(config_path, "r") as f:
        venues = json.load(f)
    
    # Check all venues and track which ones have events
    venues_with_events = []
    for venue in venues:
        if check_venue(venue):
            print(f"Event found at {venue['name']}")
            venues_with_events.append({
                "name": venue["name"],
                "url": venue["url"]
            })
    
    # Determine busy status (2+ events = busy, 1 event = probably, 0 = not busy)
    event_count = len(venues_with_events)
    busy = event_count >= 2
    
    # Create public/data directory if it doesn't exist (for Next.js static export)
    public_data_dir = Path(__file__).parent.parent / "public" / "data"
    public_data_dir.mkdir(parents=True, exist_ok=True)
    
    # Write status
    status = {
        "busy": busy,
        "eventCount": event_count,
        "venues": venues_with_events,
        "date": get_today_et().isoformat(),
        "checkedAt": datetime.now(ZoneInfo("UTC")).isoformat()
    }
    
    status_path = public_data_dir / "status.json"
    with open(status_path, "w") as f:
        json.dump(status, f, indent=2)
    
    if event_count == 0:
        print("Status: NOT BUSY")
    elif event_count == 1:
        print(f"Status: PROBABLY (1 event at {venues_with_events[0]['name']})")
    else:
        print(f"Status: BUSY ({event_count} events)")
    print(f"Written to {status_path}")


if __name__ == "__main__":
    main()

