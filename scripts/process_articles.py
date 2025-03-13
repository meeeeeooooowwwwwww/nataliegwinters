import os
import json
from bs4 import BeautifulSoup
from datetime import datetime
import re

def clean_filename(filename):
    # Remove file extension
    filename = os.path.splitext(filename)[0]
    
    # Convert to lowercase and replace special characters
    clean = filename.lower()
    clean = clean.replace('--', '-')
    clean = re.sub(r'[^a-z0-9-]', '-', clean)
    clean = re.sub(r'-+', '-', clean)  # Replace multiple hyphens with single hyphen
    clean = clean.strip('-')
    
    return clean + '.html'

def extract_article_info(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
        soup = BeautifulSoup(content, 'html.parser')
        
        # Extract title from the title tag
        title_tag = soup.find('title')
        if title_tag:
            title = title_tag.text.split(' - ')[0].strip()
        else:
            title = os.path.splitext(os.path.basename(file_path))[0].replace('-', ' ')
        
        # Create a clean filename
        original_filename = os.path.basename(file_path)
        clean_name = clean_filename(original_filename)
        
        # Get today's date as publish date (since we're recreating the JSON)
        today = datetime.now().strftime('%B %d, %Y')
        
        # Create article object
        article = {
            'title': title,
            'slug': clean_name[:-5],  # Remove .html
            'publishedDate': today,
            'content': 'Article content from War Room',
            'sourceUrl': f'https://warroom.org/{clean_name[:-5]}',
            'fileName': clean_name
        }
        
        return article

def main():
    articles = []
    folder_path = 'Warroom Articles OLD'
    
    # Process each HTML file in the folder
    for filename in os.listdir(folder_path):
        if filename.endswith('.html'):
            file_path = os.path.join(folder_path, filename)
            try:
                article = extract_article_info(file_path)
                articles.append(article)
                print(f'Processed: {filename}')
            except Exception as e:
                print(f'Error processing {filename}: {str(e)}')
    
    # Sort articles by date (newest first)
    articles.sort(key=lambda x: datetime.strptime(x['publishedDate'], '%B %d, %Y'), reverse=True)
    
    # Write to JSON file
    output_path = 'public/warroom-articles.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(articles, f, indent=2, ensure_ascii=False)
    
    print(f'\nProcessed {len(articles)} articles')
    print(f'JSON file created at: {output_path}')

if __name__ == '__main__':
    main() 