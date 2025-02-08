import os
import xml.etree.ElementTree as ET
from datetime import datetime

# Path to your local sitemap.xml file
SITEMAP_FILE = "../sitemap.xml"  # Go up one directory to find sitemap.xml in the root

# Function to get the list of current pages in your repo (you may need to adjust this part)
def get_current_pages():
    # Example: Get a list of HTML pages in the 'pages' folder or based on your repo structure
    current_pages = []
    for dirpath, _, filenames in os.walk('pages'):
        for file in filenames:
            if file.endswith('.html'):
                # Assuming the file path is the URL (relative path from the root)
                current_pages.append(f"/{os.path.relpath(os.path.join(dirpath, file), 'pages')}")
    return current_pages

# Function to parse and update the sitemap.xml
def update_sitemap():
    # Parse the existing sitemap.xml
    tree = ET.parse(SITEMAP_FILE)
    root = tree.getroot()

    # Get current list of pages in the repo
    current_pages = get_current_pages()

    # Track pages in the current sitemap.xml
    sitemap_urls = {url.find('loc').text: url for url in root.findall('url')}
    
    # Remove deleted pages from sitemap
    for url in list(sitemap_urls):
        if url not in current_pages:
            root.remove(sitemap_urls[url])

    # Add or update new pages
    for page in current_pages:
        # Check if page already exists in the sitemap
        existing_entry = sitemap_urls.get(page)
        if existing_entry:
            # Update the lastmod date for existing pages
            existing_entry.find('lastmod').text = datetime.now().strftime('%Y-%m-%d')
        else:
            # Add a new entry for a new page
            new_url = ET.Element('url')
            loc = ET.SubElement(new_url, 'loc')
            loc.text = f"https://nataliegwinters.com{page}"
            lastmod = ET.SubElement(new_url, 'lastmod')
            lastmod.text = datetime.now().strftime('%Y-%m-%d')
            root.append(new_url)

    # Save the updated sitemap.xml
    tree.write(SITEMAP_FILE)
    print("Sitemap updated successfully!")

# Main function
if __name__ == "__main__":
    update_sitemap()
