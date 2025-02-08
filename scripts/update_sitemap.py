# Path to your local sitemap.xml file (in the root of your repository)
SITEMAP_FILE = "sitemap.xml"

# Your script's logic for updating the sitemap
import os
import xml.etree.ElementTree as ET

def update_sitemap():
    # Check if the sitemap.xml exists
    if not os.path.exists(SITEMAP_FILE):
        print(f"{SITEMAP_FILE} not found!")
        return

    # Parse the XML file
    tree = ET.parse(SITEMAP_FILE)
    root = tree.getroot()

    # Logic to update the sitemap (example: update the <lastmod> field)
    for url in root.findall(".//url"):
        lastmod = url.find("lastmod")
        if lastmod is not None:
            lastmod.text = "2025-02-09"  # Example date (you could automate this)

    # Save the updated sitemap
    tree.write(SITEMAP_FILE)
    print(f"{SITEMAP_FILE} updated successfully.")

if __name__ == "__main__":
    update_sitemap()
