from playwright.sync_api import sync_playwright
import json
import time

# URL of the Rumble War Room channel
URL = "https://rumble.com/c/BannonsWarRoom/videos"
OUTPUT_FILE = "warroom-videos.json"  # Make sure this is defined

def load_existing_data():
    """Load the most recent video URL from the JSON file if it exists, otherwise return None"""
    try:
        with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
            existing_data = json.load(f)
            # Return the URL of the most recent video (first entry in the list)
            if existing_data:
                return existing_data[0]['link']
            else:
                return None
    except (FileNotFoundError, json.JSONDecodeError):
        return None

def append_data(videos):
    """Append the new batch of videos to the existing JSON file at the beginning"""
    try:
        with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
            existing_data = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        existing_data = []  # If file doesn't exist or is empty, start with an empty list
    
    # Prepend the new videos at the beginning of the existing data
    videos.extend(existing_data)
    
    # Save the combined data back to the JSON file
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(videos, f, indent=4)
    print(f"Appended {len(videos)} new videos to {OUTPUT_FILE}")

def scrape_rumble():
    # Load the most recent video URL
    last_video_url = load_existing_data()

    with sync_playwright() as p:
        # Launch browser
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Go to URL
        page.goto(URL)

        # Wait for the page to load, specifically for the video container
        print("Waiting for video grid to load...")
        try:
            page.wait_for_selector("ol.thumbnail__grid", timeout=10000)  # Timeout after 10 seconds
        except:
            print("Error: Could not find the video grid. Exiting.")
            browser.close()
            return

        # List to store new videos
        new_videos = []
        total_scraped = 0

        # Select video elements on the current page
        video_elements = page.query_selector_all("ol.thumbnail__grid div.thumbnail__thumb")
        print(f"Found {len(video_elements)} video elements on this page.")

        if len(video_elements) == 0:
            print("No video elements found on this page!")
            browser.close()
            return

        # Extract video details from each video element
        for video in video_elements:
            try:
                img_element = video.query_selector("img.thumbnail__image")
                if img_element:
                    title = img_element.get_attribute("alt")
                    thumbnail = img_element.get_attribute("src")

                link_element = video.query_selector("a.videostream__link.link")
                if link_element:
                    link = link_element.get_attribute("href")
                    if title and link:
                        video_url = "https://rumble.com" + link
                        
                        # Stop if we've reached the most recent video (already in the JSON)
                        if video_url == last_video_url:
                            print("Reached the most recent video. Stopping scrape.")
                            break
                        
                        # Add new videos to the list
                        new_videos.append({
                            "title": title.strip(),
                            "link": video_url,
                            "thumbnail": thumbnail,
                            "uploader": "https://warroom.org"
                        })
            except Exception as e:
                print("Error extracting video data:", e)

        total_scraped += len(new_videos)

        # Save new data to JSON (prepend the new videos to existing data)
        if new_videos:
            append_data(new_videos)

        print(f"Scraped {total_scraped} new videos and saved to {OUTPUT_FILE}")
        
        browser.close()

# Run scraper
if __name__ == "__main__":
    scrape_rumble()
