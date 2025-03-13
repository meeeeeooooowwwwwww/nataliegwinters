import json
import os

def generate_article_html(article):
    try:
        html_content = f"""<!DOCTYPE HTML>
<html>
<head>
    <title>{article['title']} - Natalie Winters</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no" />
    <meta name="description" content="{article['excerpt']}" />
    <link rel="icon" type="image/icon" href="/favicon.ico">
    <link rel="stylesheet" href="/assets/css/main.css" />
    <link rel="stylesheet" href="/assets/css/fontawesome-all.min.css" />
    <noscript><link rel="stylesheet" href="/assets/css/noscript.css" /></noscript>
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
            color: #fff !important;
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
            color: #fff !important;
            text-decoration: none;
            border-radius: 4px;
            transition: background 0.3s ease;
        }}
        .source-link:hover {{
            background: #444;
        }}
    </style>
</head>
<body class="homepage is-preload">
    <div id="page-wrapper">
        <!-- Header -->
        <div id="header">
            <div class="inner">
                <header>
                    <h1><a href="/" id="logo">Natalie Winters</a></h1>
                    <hr />
                    <p>Investigative Reporter & White House Correspondent</p>
                </header>
                <div class="sponsor-images">
                    <img src="/images/war_path_coffee_logo.jpg" alt="War Path Coffee" />
                    <img src="/images/my_pillow_logo.jpg" alt="My Pillow" />
                    <img src="/images/sacred_human_health_logo.jpg" alt="Sacred Human Health" />
                    <img src="/images/meriwether_farms_logo.jpg" alt="Meriwether Farms" />
                    <img src="/images/shes_so_right_logo.jpg" alt="She's So Right" />
                    <img src="/images/stand_with_bannon.jpg" alt="Stand with Bannon" />
                </div>
            </div>

            <!-- Nav -->
            <nav id="nav">
                <ul>
                    <li><a href="/">Home</a></li>
                    <li><a href="#">Videos</a>
                        <ul>
                            <li><a href="/videos.html">Natalie Winters Videos</a></li>
                            <li><a href="/warroom-videos.html">Warroom Videos</a></li>
                        </ul>
                    </li>
                    <li><a href="/wedding.html">Wedding</a></li>
                    <li><a href="https://shessoright.co/" target="_blank" rel="noopener noreferrer">Shop</a></li>
                    <li><a href="/about.html">About</a></li>
                    <li><a href="https://warroom.org/contact/" target="_blank" rel="noopener noreferrer">Contact</a></li>
                </ul>
            </nav>
        </div>

        <div class="wrapper style2">
            <article id="main" class="container special">
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
                            <a href="/warroom-articles/" class="back-to-articles">← Back to Articles</a>
                            <a href="{article['sourceUrl']}" class="source-link" target="_blank" rel="noopener noreferrer">Read Original Article →</a>
                        </div>
                    </article>
                </div>
            </article>
        </div>

        <!-- Footer -->
        <div id="footer">
            <div class="container">
                <div class="row">
                    <div class="col-12">
                        <!-- Contact -->
                        <section class="contact">
                            <header>
                                <h3>Natalie Winters Social Media</h3>
                            </header>
                            <p>Follow @NatalieGWinters on all platforms & buy her a coffee.</p>
                            <ul class="icons">
                                <li><a href="https://x.com/nataliegwinters" target="_blank" rel="noopener noreferrer" class="icon brands fa-twitter"><span class="label">Twitter</span></a></li>
                                <li><a href="https://www.instagram.com/nataliegwinters/" target="_blank" rel="noopener noreferrer" class="icon brands fa-instagram"><span class="label">Instagram</span></a></li>
                            </ul>
                        </section>
                        
                        <!-- Copyright -->
                        <div class="copyright">
                            <ul class="menu">
                                <li>&copy; <a href="https://app.companiesoffice.govt.nz/companies/app/service/services/documents/EA487ACCCF57D6444298C67F09ECA876/CertIncorporation_9272491_05February2025.pdf" target="_blank" rel="noopener noreferrer">America First New Zealand</a></li>
                                <li><a href="https://github.com/meeeeeooooowwwwwww" target="_blank" rel="noopener noreferrer">Web Design: meeeeeooooowwwwwww</a></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Scripts -->
        <script src="/assets/js/jquery.min.js"></script>
        <script src="/assets/js/jquery.dropotron.min.js"></script>
        <script src="/assets/js/jquery.scrolly.min.js"></script>
        <script src="/assets/js/jquery.scrollex.min.js"></script>
        <script src="/assets/js/browser.min.js"></script>
        <script src="/assets/js/breakpoints.min.js"></script>
        <script src="/assets/js/util.js"></script>
        <script src="/assets/js/main.js"></script>
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
            if success_count % 10 == 0:  # Print progress more frequently
                print(f"Generated {success_count} articles so far...")
        else:
            error_count += 1
    
    print(f"\nGeneration complete:")
    print(f"Successfully generated: {success_count} articles")
    print(f"Errors encountered: {error_count} articles")

if __name__ == '__main__':
    main() 