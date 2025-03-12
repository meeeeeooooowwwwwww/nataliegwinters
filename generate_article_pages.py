import json
import os

def generate_article_html(article):
    try:
        html_content = f"""<!DOCTYPE html>
<html>
<head>
    <title>{article['title']}</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="../assets/css/main.css">
    <link rel="stylesheet" href="../assets/css/fontawesome-all.min.css">
    <style>
        .article-container {{
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }}
        .article-header {{
            text-align: center;
            margin-bottom: 40px;
        }}
        .article-title {{
            font-size: 36px;
            margin-bottom: 20px;
            color: #333;
        }}
        .article-meta {{
            font-size: 16px;
            color: #666;
            margin-bottom: 30px;
        }}
        .article-content {{
            font-size: 18px;
            line-height: 1.8;
            color: #444;
        }}
        .article-excerpt {{
            font-size: 20px;
            line-height: 1.6;
            color: #666;
            margin: 30px 0;
            font-style: italic;
            border-left: 4px solid #e44c65;
            padding-left: 20px;
        }}
        .article-footer {{
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }}
        .back-to-articles {{
            display: inline-block;
            padding: 10px 20px;
            background: #e44c65;
            color: #fff;
            text-decoration: none;
            border-radius: 4px;
            transition: background 0.3s ease;
        }}
        .back-to-articles:hover {{
            background: #d83850;
        }}
        .source-link {{
            display: inline-block;
            padding: 10px 20px;
            background: #333;
            color: #fff;
            text-decoration: none;
            border-radius: 4px;
            transition: background 0.3s ease;
        }}
        .source-link:hover {{
            background: #444;
        }}
    </style>
</head>
<body>
    <div class="article-container">
        <article>
            <div class="article-header">
                <h1 class="article-title">{article['title']}</h1>
                <div class="article-meta">
                    By {article['author']} | {article['publishedDate']}
                </div>
            </div>
            
            <div class="article-excerpt">
                {article['excerpt']}
            </div>
            
            <div class="article-content">
                {article['content']}
            </div>
            
            <div class="article-footer">
                <a href="../warroom-articles.html" class="back-to-articles">← Back to Articles</a>
                <a href="{article['sourceUrl']}" class="source-link" target="_blank" rel="noopener noreferrer">Read Original Article →</a>
            </div>
        </article>
    </div>
</body>
</html>"""
        
        file_path = os.path.join('public/warroom-articles', article['fileName'])
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(html_content)
        return True
    except Exception as e:
        print(f"Error generating article {article.get('fileName', 'unknown')}: {str(e)}")
        return False

def main():
    print("Starting article generation...")
    
    # Read the articles JSON file
    try:
        with open('public/warroom-articles.json', 'r', encoding='utf-8') as f:
            articles = json.load(f)
        print(f"Loaded {len(articles)} articles from JSON file")
    except Exception as e:
        print(f"Error loading JSON file: {str(e)}")
        return
    
    # Create the warroom-articles directory if it doesn't exist
    os.makedirs('public/warroom-articles', exist_ok=True)
    
    # Generate HTML files for each article
    success_count = 0
    error_count = 0
    
    for i, article in enumerate(articles, 1):
        if generate_article_html(article):
            success_count += 1
            if success_count % 100 == 0:  # Print progress every 100 articles
                print(f"Generated {success_count} articles so far...")
        else:
            error_count += 1
    
    print(f"\nGeneration complete:")
    print(f"Successfully generated: {success_count} articles")
    print(f"Errors encountered: {error_count} articles")

if __name__ == '__main__':
    main() 