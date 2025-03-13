import json
import os
from datetime import datetime

def ensure_directories():
    """Create the directory structure for all content types"""
    regions = ['us', 'nz']
    content_types = ['news', 'products', 'businesses']
    
    for region in regions:
        for content_type in content_types:
            os.makedirs(f'public/{region}/{content_type}', exist_ok=True)

def convert_articles():
    """Convert existing articles to new format under news directory"""
    # Read existing articles
    with open('warroom-articles.json', 'r', encoding='utf-8') as f:
        existing_data = json.load(f)
    
    # Convert to new format
    us_articles = {
        "articles": []
    }
    
    # Handle case where existing_data is a list
    articles_list = existing_data if isinstance(existing_data, list) else existing_data.get('articles', [])
    
    for article in articles_list:
        new_article = {
            "id": article.get('slug', ''),
            "title": article.get('title', ''),
            "slug": article.get('slug', ''),
            "publishedDate": article.get('date', datetime.now().strftime('%Y-%m-%d')),
            "excerpt": article.get('excerpt', ''),
            "content": article.get('content', ''),
            "region": "us",
            "category": article.get('category', 'news'),
            "tags": article.get('tags', ['news'])
        }
        us_articles['articles'].append(new_article)
    
    # Write US news articles
    with open('public/us/news/articles.json', 'w', encoding='utf-8') as f:
        json.dump(us_articles, f, indent=2, ensure_ascii=False)

def create_placeholder_data():
    """Create placeholder data for products and businesses"""
    regions = ['us', 'nz']
    
    # Placeholder products data
    products_template = {
        "products": [
            {
                "id": "example-product",
                "name": "Example Product",
                "description": "This is a placeholder product",
                "price": 99.99,
                "currency": "USD",
                "category": "general",
                "tags": ["placeholder"],
                "status": "active"
            }
        ]
    }
    
    # Placeholder businesses data
    businesses_template = {
        "businesses": [
            {
                "id": "example-business",
                "name": "Example Business",
                "description": "This is a placeholder business listing",
                "category": "general",
                "location": {
                    "address": "123 Example St",
                    "city": "Example City",
                    "country": "United States"
                },
                "tags": ["placeholder"],
                "status": "active"
            }
        ]
    }
    
    for region in regions:
        # Create products.json
        products = products_template.copy()
        products["products"][0]["currency"] = "USD" if region == "us" else "NZD"
        products["products"][0]["region"] = region
        with open(f'public/{region}/products/products.json', 'w', encoding='utf-8') as f:
            json.dump(products, f, indent=2, ensure_ascii=False)
        
        # Create businesses.json
        businesses = businesses_template.copy()
        businesses["businesses"][0]["country"] = "United States" if region == "us" else "New Zealand"
        businesses["businesses"][0]["region"] = region
        with open(f'public/{region}/businesses/businesses.json', 'w', encoding='utf-8') as f:
            json.dump(businesses, f, indent=2, ensure_ascii=False)

def main():
    ensure_directories()
    convert_articles()
    create_placeholder_data()

if __name__ == '__main__':
    main() 