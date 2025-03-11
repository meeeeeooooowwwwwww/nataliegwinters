import os
import re

# Set the directory to the current folder (where the script is run)
articles_dir = "."

# Source link wrapped in <p> tags
source_link = '\n<p><a href="https://warroom.org/" target="_blank" rel="noopener noreferrer">Source: War Room</a></p>\n'

# Regex pattern to match </article><br> (allowing spaces/newlines)
article_br_pattern = re.compile(r"</article>\s*<br>", re.IGNORECASE)

def update_html_file(file_path):
    print(f"Updating file: {file_path}")

    # Read the file content
    with open(file_path, "r", encoding="utf-8") as file:
        content = file.read()

    # Check if </article><br> exists and insert the source link on the next line
    if article_br_pattern.search(content):
        content = article_br_pattern.sub(r"</article><br>\n" + source_link, content, count=1)

        # Write the modified content back to the file
        with open(file_path, "w", encoding="utf-8") as file:
            file.write(content)

        print(f"✅ File {file_path} updated successfully.")
    else:
        print(f"❌ Tag '</article><br>' not found in {file_path}.")

# Get the current working directory (where script is running)
articles_dir = os.getcwd()

# Iterate through all HTML files in the current directory
for filename in os.listdir(articles_dir):
    file_path = os.path.join(articles_dir, filename)
    if os.path.isfile(file_path) and filename.endswith(".html"):
        update_html_file(file_path)

print("🔗 Source link inserted in all articles (where applicable).")
