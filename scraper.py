
import requests
from bs4 import BeautifulSoup

def scrape_headings(url):
    """
    Scrapes headings (H2 tags) from the specified URL.
    Args:
        url (str): The URL of the webpage to scrape.
    Returns:
        list: A list of headings as strings.
    """
    try:
        response = requests.get(url)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')

        # Adjust the tag and class based on the website's structure
        headings = [heading.text.strip() for heading in soup.find_all('h2')]

        return headings
    except Exception as e:
        print(f"Error occurred while scraping: {e}")
        return []
