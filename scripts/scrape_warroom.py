import asyncio
from playwright.async_api import async_playwright
import json
from datetime import datetime
import re
import os
import time
from bs4 import BeautifulSoup
import psutil
import signal
import sys
import traceback
from asyncio import Semaphore

# Maximum concurrent article processing
MAX_CONCURRENT = 3  # Reduced for more stability
PAGE_LOAD_TIMEOUT = 60000  # Increased timeout to 60 seconds
NAVIGATION_TIMEOUT = 90000  # Added separate navigation timeout

def init_worker():
    signal.signal(signal.SIGINT, signal.SIG_IGN)

class SharedState:
    def __init__(self):
        self.articles = []
        self.articles_processed = 0
        self.current_page = 0
        self.semaphore = Semaphore(MAX_CONCURRENT)

    def increment_processed(self):
        self.articles_processed += 1
        return self.articles_processed

    def increment_page(self):
        self.current_page += 1
        return self.current_page

    def get_stats(self):
        return {
            'pages': self.current_page,
            'articles': len(self.articles),
            'processed': self.articles_processed
        }

def save_progress(articles, force=False):
    try:
        print(f'\nSaving progress... ({len(articles)} articles)')
        os.makedirs('public', exist_ok=True)
        
        # Save to new file to preserve existing data
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f'public/warroom-articles_{timestamp}.json'
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(articles, f, indent=2, ensure_ascii=False)
        print(f'Progress saved to {filename}')
        
        # Also update the main file
        with open('public/warroom-articles.json', 'w', encoding='utf-8') as f:
            json.dump(articles, f, indent=2, ensure_ascii=False)
            
    except Exception as e:
        print(f'Error saving progress: {str(e)}')
        traceback.print_exc()

def clean_filename(title):
    filename = re.sub(r'[^\w\s-]', '', title.lower())
    filename = re.sub(r'\s+', '-', filename)
    return filename + '.html'

def format_date(date_str):
    try:
        cleaned_date = re.sub(r'\s*\bi class="fa fa-clock-o"\i\s*', '', date_str)
        date_obj = datetime.strptime(cleaned_date.strip(), '%B %d, %Y')
        return date_obj.strftime('%Y-%m-%d')
    except:
        return datetime.now().strftime('%Y-%m-%d')

def clean_html_content(html_content):
    if not html_content:
        return ''
    
    try:
        soup = BeautifulSoup(html_content, 'html.parser')
        
        for element in soup(['script', 'style', 'iframe']):
            element.decompose()
        
        for tag in soup.find_all(True):
            tag.attrs = {key: value for key, value in tag.attrs.items() 
                        if key in ['href', 'src', 'alt']}
        
        allowed_tags = ['p', 'a', 'b', 'strong', 'i', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                       'ul', 'ol', 'li', 'blockquote', 'img', 'article', 'section', 'figure',
                       'figcaption', 'div', 'span']
        
        for tag in soup.find_all(True):
            if tag.name not in allowed_tags:
                tag.unwrap()
        
        for tag in soup.find_all():
            if len(tag.get_text(strip=True)) == 0 and not tag.find_all(['img']):
                tag.decompose()
        
        cleaned_html = str(soup)
        cleaned_html = re.sub(r'\n\s*\n', '\n', cleaned_html)
        cleaned_html = re.sub(r'>\s+<', '>\n<', cleaned_html)
        
        return cleaned_html
    except Exception as e:
        print(f'Error cleaning HTML: {str(e)}')
        traceback.print_exc()
        return html_content

async def process_article(url, preview_data, state):
    async with state.semaphore:  # Limit concurrent processing
        print(f'\nProcessing article: {url}')
        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(
                    headless=True,  # Changed to headless
                    args=['--disable-gpu', '--disable-dev-shm-usage', '--no-sandbox']
                )
                context = await browser.new_context(
                    viewport={'width': 1920, 'height': 1080},
                    java_script_enabled=True,
                    bypass_csp=True,
                    user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                )
                
                page = await context.new_page()
                page.set_default_timeout(PAGE_LOAD_TIMEOUT)
                
                print(f'Loading article page: {url}')
                await page.goto(url, wait_until='networkidle', timeout=NAVIGATION_TIMEOUT)
                await asyncio.sleep(3)  # Increased wait time
                
                # Additional wait for dynamic content
                try:
                    await page.wait_for_selector('.entry-content', timeout=10000)
                except:
                    pass
                
                article_data = {
                    'title': preview_data['title'],
                    'author': preview_data['author'],
                    'publishedDate': preview_data['date'],
                    'excerpt': preview_data['excerpt'],
                    'categories': preview_data['categories'],
                    'sourceUrl': url,
                    'fileName': clean_filename(preview_data['title']),
                    'images': [],
                    'commentsCount': preview_data['comments_count'],
                    'featuredImage': None,
                    'content': ''
                }
                
                content_selectors = [
                    'article.jeg_post.jeg_pl_lg_2',
                    '.entry-content',
                    '.content-inner',
                    '.jeg_post_content',
                    'article'  # Added fallback
                ]
                
                content = None
                for selector in content_selectors:
                    try:
                        content_elem = await page.query_selector(selector)
                        if content_elem:
                            content = await content_elem.inner_html()
                            print(f'Found content using selector: {selector}')
                            break
                    except:
                        continue
                
                if content:
                    article_data['content'] = clean_html_content(content)
                    print(f'Content length: {len(article_data["content"])} characters')
                else:
                    print('No content found!')
                
                await page.close()
                await browser.close()
                
                return article_data
                
        except Exception as e:
            print(f'Error processing article {url}: {str(e)}')
            traceback.print_exc()
            return None

async def scrape_articles():
    print('Starting scraper...')
    state = SharedState()
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,  # Changed to headless
            args=['--disable-gpu', '--disable-dev-shm-usage', '--no-sandbox']
        )
        context = await browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            java_script_enabled=True,
            bypass_csp=True,
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        )
        
        page = await context.new_page()
        page.set_default_timeout(PAGE_LOAD_TIMEOUT)
        page_num = 1
        base_url = 'https://warroom.org/category/newsroom/'
        
        try:
            while True:
                url = f'{base_url}page/{page_num}/' if page_num > 1 else base_url
                print(f'\nScraping page {page_num}: {url}')
                
                try:
                    await page.goto(url, wait_until='networkidle', timeout=NAVIGATION_TIMEOUT)
                    await asyncio.sleep(3)  # Increased wait time
                    
                    # Additional wait for article list
                    try:
                        await page.wait_for_selector('article.jeg_post', timeout=10000)
                    except:
                        pass
                    
                    error_elem = await page.query_selector('.jeg_404_content, .jeg_empty_content')
                    if error_elem:
                        print(f'Reached end of articles at page {page_num}')
                        break
                    
                    article_previews = await page.query_selector_all('article.jeg_post')
                    if not article_previews:
                        print('No more articles found, stopping...')
                        break
                        
                    print(f'Found {len(article_previews)} articles on page {page_num}')
                    
                    # Process articles concurrently
                    tasks = []
                    for preview in article_previews:
                        try:
                            link = await preview.query_selector('h3.jeg_post_title a')
                            if not link:
                                continue
                                
                            article_url = await link.get_attribute('href')
                            title = await link.inner_text()
                            
                            print(f'\nFound article: {title}')
                            print(f'URL: {article_url}')
                            
                            preview_data = {
                                'url': article_url,
                                'title': title,
                                'excerpt': '',
                                'author': 'Warroom Staff',
                                'date': datetime.now().strftime('%Y-%m-%d'),
                                'categories': ['News'],
                                'comments_count': 0
                            }
                            
                            excerpt_elem = await preview.query_selector('.jeg_post_excerpt p')
                            if excerpt_elem:
                                preview_data['excerpt'] = await excerpt_elem.inner_text()
                                
                            author_elem = await preview.query_selector('.jeg_meta_author a')
                            if author_elem:
                                preview_data['author'] = await author_elem.inner_text()
                                
                            date_elem = await preview.query_selector('.jeg_meta_date')
                            if date_elem:
                                date_text = await date_elem.inner_text()
                                preview_data['date'] = format_date(date_text)
                            
                            # Add task to process article
                            task = asyncio.create_task(process_article(article_url, preview_data, state))
                            tasks.append(task)
                            
                        except Exception as e:
                            print(f'Error processing preview: {str(e)}')
                            traceback.print_exc()
                            continue
                    
                    # Wait for all article processing tasks to complete
                    results = await asyncio.gather(*tasks, return_exceptions=True)
                    for result in results:
                        if result and not isinstance(result, Exception):
                            state.articles.append(result)
                            state.increment_processed()
                            print(f'Successfully processed article {len(state.articles)}')
                    
                    # Save progress after each page
                    save_progress(state.articles, force=True)
                    page_num += 1
                    await asyncio.sleep(2)  # Increased wait time between pages
                    
                except Exception as e:
                    print(f'Error processing page {url}: {str(e)}')
                    traceback.print_exc()
                    page_num += 1
                    continue
                
        except Exception as e:
            print(f'Error during scraping: {str(e)}')
            traceback.print_exc()
        finally:
            await page.close()
            await browser.close()
            
            save_progress(state.articles, force=True)
            save_articles(state.articles)
            return state.articles, state

def save_articles(articles):
    print('Saving individual article files...')
    os.makedirs('public/warroom-articles', exist_ok=True)
    
    for article in articles:
        try:
            html_content = f"""<!DOCTYPE html>
<html>
<head>
    <title>{article['title']}</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="../assets/css/main.css">
    <link rel="stylesheet" href="../assets/css/fontawesome-all.min.css">
</head>
<body>
    <article>
        <h1>{article['title']}</h1>
        <div class="article-meta">
            <span class="post-date">{article['publishedDate']}</span>
            {'<span class="author">By ' + article['author'] + '</span>' if article['author'] else ''}
            <div class="categories">
                {' | '.join(article['categories'])}
            </div>
            {'<div class="comments-count">' + str(article['commentsCount']) + ' Comments</div>' if article['commentsCount'] > 0 else ''}
        </div>
        {f'<div class="featured-image"><img src="{article["featuredImage"]}" alt="{article["title"]}"></div>' if article["featuredImage"] else ''}
        <div class="excerpt">
            {article['excerpt']}
        </div>
        <div class="entry-content">
            {article['content']}
        </div>
        <div class="source-link">
            <a href="{article['sourceUrl']}" target="_blank" rel="noopener noreferrer">View Original Article</a>
        </div>
    </article>
</body>
</html>"""
            
            file_path = os.path.join('public/warroom-articles', article['fileName'])
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(html_content)
                
        except Exception as e:
            print(f'Error saving article {article["title"]}: {str(e)}')
            traceback.print_exc()

async def main():
    print('Starting scraper...')
    start_time = time.time()
    
    try:
        # Increase process priority
        if sys.platform == 'win32':
            import win32api, win32process, win32con
            pid = win32api.GetCurrentProcessId()
            handle = win32api.OpenProcess(win32con.PROCESS_ALL_ACCESS, True, pid)
            win32process.SetPriorityClass(handle, win32process.HIGH_PRIORITY_CLASS)
    except:
        pass
    
    try:
        articles, state = await scrape_articles()
        
        end_time = time.time()
        duration = end_time - start_time
        
        stats = state.get_stats()
        print(f'\nScraping complete in {duration:.2f} seconds')
        print(f'Pages processed: {stats["pages"]}')
        print(f'Articles found: {stats["articles"]}')
        print(f'Articles processed: {stats["processed"]}')
        
        save_articles(articles)
        print('Articles saved to public/warroom-articles.json and individual HTML files.')
        
    except KeyboardInterrupt:
        print('\nScraping interrupted by user')
        sys.exit(1)
    except Exception as e:
        print(f'Fatal error: {str(e)}')
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    asyncio.run(main()) 