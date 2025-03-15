from playwright.sync_api import sync_playwright
import json
import time
from datetime import datetime, timedelta
import re
import os

# Automated via GitHub Actions - runs twice daily at 8:00 AM and 8:00 PM UTC

# URL of the Rumble War Room channel
URL = "https://rumble.com/c/BannonsWarRoom/videos"
OUTPUT_FILE = "warroom-videos.json"  # Make sure this is defined

def parse_rumble_date(date_text):
    """Convert Rumble's relative date to datetime object"""
    now = datetime.utcnow()
    if 'hour' in date_text:
        hours = int(re.search(r'(\d+)', date_text).group(1))
        return now.replace(microsecond=0, second=0, minute=0) - timedelta(hours=hours)
    elif 'day' in date_text:
        days = int(re.search(r'(\d+)', date_text).group(1))
        return now.replace(microsecond=0, hour=0, minute=0, second=0) - timedelta(days=days)
    elif 'week' in date_text:
        weeks = int(re.search(r'(\d+)', date_text).group(1))
        return now.replace(microsecond=0, hour=0, minute=0, second=0) - timedelta(weeks=weeks)
    elif 'month' in date_text:
        months = int(re.search(r'(\d+)', date_text).group(1))
        # Approximate months as 30 days
        return now.replace(microsecond=0, hour=0, minute=0, second=0) - timedelta(days=30*months)
    elif 'year' in date_text:
        years = int(re.search(r'(\d+)', date_text).group(1))
        # Approximate years as 365 days
        return now.replace(microsecond=0, hour=0, minute=0, second=0) - timedelta(days=365*years)
    return now  # Default to now if we can't parse the date

def load_existing_data():
    """Load the most recent video URL from the JSON file if it exists, otherwise return None"""
    if not os.path.exists(OUTPUT_FILE):
        print(f"Creating new {OUTPUT_FILE} file")
        with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
            json.dump({"last_updated": datetime.utcnow().isoformat(), "videos": []}, f, indent=4)
        return None

    try:
        with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            # Check if data is a dict with videos key (new format)
            if isinstance(data, dict) and 'videos' in data:
                videos = data['videos']
            else:
                # Old format - direct list of videos
                videos = data
                # Convert to new format
                data = {
                    "last_updated": datetime.utcnow().isoformat(),
                    "videos": videos
                }
                with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
                    json.dump(data, f, indent=4)
            
            # Return the URL of the most recent video (first entry in the list)
            if videos:
                return videos[0]['link']
            else:
                return None
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(f"Error loading {OUTPUT_FILE}: {str(e)}")
        return None

def append_data(videos):
    """Append the new batch of videos to the existing JSON file at the beginning"""
    try:
        with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            # Check if data is a dict with videos key (new format)
            if isinstance(data, dict) and 'videos' in data:
                existing_videos = data['videos']
            else:
                # Old format - direct list of videos
                existing_videos = data
    except (FileNotFoundError, json.JSONDecodeError):
        existing_videos = []  # If file doesn't exist or is empty, start with an empty list
    
    # Create a set of existing URLs to avoid duplicates
    existing_urls = {video['link'] for video in existing_videos}
    
    # Filter out any duplicates from new videos
    unique_new_videos = [video for video in videos if video['link'] not in existing_urls]
    
    # Sort videos by upload date (newest first)
    unique_new_videos.sort(key=lambda x: x['upload_date'], reverse=True)
    
    # Create a new list with new videos at the beginning
    combined_videos = unique_new_videos + existing_videos
    
    # Create the new data structure with timestamp
    output_data = {
        'last_updated': datetime.utcnow().isoformat(),
        'videos': combined_videos
    }
    
    # Save the combined data back to the JSON file
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(output_data, f, indent=4)
    print(f"Added {len(unique_new_videos)} new videos at the beginning of {OUTPUT_FILE}")
    if unique_new_videos:
        print("New videos added:")
        for video in unique_new_videos:
            print(f"- {video['title']}")

def scrape_rumble():
    # Load the most recent video URL
    last_video_url = load_existing_data()
    print(f"Last known video URL: {last_video_url}")

    with sync_playwright() as p:
        # Launch browser with specific options
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        )
        page = context.new_page()

        try:
            # Go to URL with timeout and wait until network is idle
            print(f"Navigating to {URL}...")
            page.goto(URL, timeout=30000, wait_until='networkidle')
            
            # Wait for the page to load, specifically for the video container
            print("Waiting for video grid to load...")
            page.wait_for_selector("ol.thumbnail__grid", timeout=30000)
            
            # Scroll down a bit to ensure all videos are loaded
            page.evaluate("window.scrollTo(0, 500)")
            page.wait_for_timeout(2000)  # Wait for any dynamic content to load
            
            # List to store new videos
            new_videos = []
            total_scraped = 0

            # Select video elements on the current page
            video_elements = page.query_selector_all("ol.thumbnail__grid div.thumbnail__thumb")
            print(f"Found {len(video_elements)} video elements on this page.")

            if len(video_elements) == 0:
                print("No video elements found on this page!")
                return

            # Extract video details from each video element
            most_recent_video = None
            for video in video_elements:
                try:
                    img_element = video.query_selector("img.thumbnail__image")
                    if img_element:
                        title = img_element.get_attribute("alt")
                        thumbnail = img_element.get_attribute("src")

                    link_element = video.query_selector("a.videostream__link.link")
                    if link_element:
                        link = link_element.get_attribute("href")
                        
                        # Get upload date
                        date_element = video.query_selector("time.video-item--time")
                        upload_date = None
                        if date_element:
                            date_text = date_element.text_content().strip()
                            upload_date = parse_rumble_date(date_text)
                        
                        if title and link:
                            video_url = "https://rumble.com" + link
                            
                            # Keep track of the most recent video we checked
                            if most_recent_video is None:
                                most_recent_video = {"title": title, "url": video_url}
                            
                            # Stop if we've reached the most recent video (already in the JSON)
                            if video_url == last_video_url:
                                print(f"Reached the most recent video: {title}")
                                print(f"URL: {video_url}")
                                break
                            
                            # Add new videos to the list
                            new_videos.append({
                                "title": title.strip(),
                                "link": video_url,
                                "thumbnail": thumbnail,
                                "uploader": "https://warroom.org",
                                "upload_date": upload_date.isoformat() if upload_date else datetime.utcnow().isoformat()
                            })
                except Exception as e:
                    print(f"Error extracting video data: {str(e)}")
                    continue

            total_scraped += len(new_videos)

            # Save new data to JSON (prepend the new videos to existing data)
            if new_videos:
                append_data(new_videos)
                print(f"Added {total_scraped} new videos")
            else:
                if most_recent_video:
                    print(f"No new videos found. Most recent video: {most_recent_video['title']}")
                    print(f"URL: {most_recent_video['url']}")
                else:
                    print("No videos found at all!")

            print(f"Scraping completed. Total videos processed: {len(video_elements)}")
            
        except Exception as e:
            print(f"Error during scraping: {str(e)}")
        finally:
            browser.close()

# Run scraper
if __name__ == "__main__":
    scrape_rumble()
