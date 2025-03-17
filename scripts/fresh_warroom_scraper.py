from playwright.sync_api import sync_playwright
import json
from datetime import datetime

# URL of the Rumble War Room channel
URL = "https://rumble.com/c/BannonsWarRoom/videos"
OUTPUT_FILE = "fresh_warroom_videos.json"  # New output file
VIDEOS_PER_SAVE = 20  # Save to JSON every 20 videos

def save_to_json(videos):
    """Save the current videos to JSON file"""
    output_data = {
        'last_updated': datetime.utcnow().isoformat(),
        'videos': videos
    }
    
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(output_data, f, indent=4, ensure_ascii=False)
    print(f"\nSaved {len(videos)} videos to {OUTPUT_FILE}")

def scrape_rumble():
    print(f"Starting fresh scrape of {URL}")
    all_videos = []
    current_page = 1
    total_pages_found = False

    with sync_playwright() as p:
        # Launch browser with specific options
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        )
        page = context.new_page()

        try:
            while True:  # Keep going until we can't find more pages
                # Go to URL with timeout and wait until network is idle
                print(f"\nNavigating to page {current_page}...")
                if current_page == 1:
                    page.goto(URL, timeout=30000, wait_until='networkidle')
                
                # Wait for the video grid to load
                print("Waiting for video grid...")
                page.wait_for_selector("ol.thumbnail__grid", timeout=30000)
                
                # Get all video elements on current page
                video_elements = page.query_selector_all("ol.thumbnail__grid div.thumbnail__thumb")
                print(f"Found {len(video_elements)} videos on page {current_page}")

                # Get total pages if we haven't yet
                if not total_pages_found:
                    # Try to find the last page number
                    page_spans = page.query_selector_all("span.paginator--link")
                    if page_spans:
                        page_numbers = [span.get_attribute("aria-label") for span in page_spans]
                        page_numbers = [int(num) for num in page_numbers if num and num.isdigit()]
                        if page_numbers:
                            max_page = max(page_numbers)
                            print(f"\nDetected approximately {max_page} total pages")
                    total_pages_found = True

                # Extract video details
                for i, video in enumerate(video_elements, 1):
                    try:
                        # Get video title and thumbnail
                        img_element = video.query_selector("img.thumbnail__image")
                        if img_element:
                            title = img_element.get_attribute("alt")
                            thumbnail = img_element.get_attribute("src")

                        # Get video link
                        link_element = video.query_selector("a.videostream__link.link")
                        if link_element:
                            link = "https://rumble.com" + link_element.get_attribute("href")
                            
                            if title and link:
                                print(f"Processing video {len(all_videos) + 1}: {title}")
                                all_videos.append({
                                    "title": title.strip(),
                                    "link": link,
                                    "thumbnail": thumbnail,
                                    "uploader": "https://warroom.org"
                                })

                                # Save every VIDEOS_PER_SAVE videos
                                if len(all_videos) % VIDEOS_PER_SAVE == 0:
                                    print(f"\nReached {len(all_videos)} videos, saving checkpoint...")
                                    save_to_json(all_videos)

                    except Exception as e:
                        print(f"Error processing video: {str(e)}")
                        continue

                # Look for next page button using the correct selector
                print("\nLooking for next page button...")
                current_page_span = page.query_selector(f"span.paginator--link.paginator--link--current")
                if current_page_span:
                    current_number = current_page_span.get_attribute("aria-label")
                    next_page = int(current_number) + 1
                    print(f"Current page is {current_number}, looking for page {next_page}...")
                    
                    # Try to find and click the next page number
                    next_url = f"{URL}?page={next_page}"
                    print(f"Navigating to page {next_page}...")
                    page.goto(next_url, timeout=30000, wait_until='networkidle')
                    
                    # Verify we're on the new page
                    new_page_span = page.query_selector(f"span.paginator--link.paginator--link--current")
                    if new_page_span and new_page_span.get_attribute("aria-label") == str(next_page):
                        print(f"Successfully moved to page {next_page}")
                        current_page = next_page
                    else:
                        print("Failed to navigate to next page - reached the end")
                        break
                else:
                    print("Could not find current page indicator - reached the end")
                    break

            # Final save
            if len(all_videos) > 0:
                save_to_json(all_videos)
            
            print(f"\nCompleted scraping with {len(all_videos)} total videos")
            print("First 5 videos in order:")
            for i, video in enumerate(all_videos[:5], 1):
                print(f"{i}. {video['title']}")
            
        except Exception as e:
            print(f"Error during scraping: {str(e)}")
            if len(all_videos) > 0:
                print("Saving videos collected so far...")
                save_to_json(all_videos)
        finally:
            browser.close()

if __name__ == "__main__":
    scrape_rumble() 