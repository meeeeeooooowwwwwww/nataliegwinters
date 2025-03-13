const fs = require('fs').promises;
const path = require('path');
const cheerio = require('cheerio');
const config = require('../config');

// Configuration object
const config = {
    baseUrl: 'https://nataliegwinters.com', // Base URL for the website
    articlesPath: 'warroom-articles',       // Path for articles relative to base URL
    defaultImage: 'assets/images/social-header.jpg' // Default social media image
};

// Function to generate a URL-friendly slug from title
function generateSlug(title) {
    return title
        .replace(/'/g, '') // Remove apostrophes first
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric chars with hyphens
        .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
        .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen
}

// Function to generate meta description from content
function generateMetaDescription(content) {
    // Take first 160 characters of content, ending at a word boundary
    const truncated = content.slice(0, 157).split(' ').slice(0, -1).join(' ');
    return truncated + '...';
}

// Function to generate keywords from title and content
function generateKeywords(title, content) {
    const commonWords = new Set(['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at']);
    const words = new Set([
        ...title.toLowerCase().split(/\W+/),
        ...content.toLowerCase().split(/\W+/).slice(0, 50)
    ]);
    
    // Filter out common words and short words
    return Array.from(words)
        .filter(word => word.length > 3 && !commonWords.has(word))
        .slice(0, 10)
        .join(', ');
}

// Function to generate full URL for an article
function generateArticleUrl(slug) {
    return `${config.baseUrl}/${config.articlesPath}/${slug}`;
}

async function generateHtmlFile(article, template) {
    // Generate meta information
    const metaDescription = generateMetaDescription(article.content);
    const keywords = generateKeywords(article.title, article.content);
    const articleUrl = generateArticleUrl(article.slug);
    
    // Replace placeholders in template
    let htmlContent = template
        .replace('*******TITLE*******', article.title)
        .replace('*******JSON P TAGS*******', article.content.split('\n').map(p => `<p>${p}</p>`).join('\n'))
        .replace('*******LINK TO ORIGINAL NEWS ARTICLE', article.sourceUrl);
    
    // Update meta tags
    const $ = cheerio.load(htmlContent);
    
    // Update title and meta tags
    $('title').text(article.title);
    $('meta[name="description"]').attr('content', metaDescription);
    $('meta[name="keywords"]').attr('content', keywords);
    
    // Update base URL
    $('base').attr('href', config.baseUrl + '/');
    
    // Update canonical URL to point to the article's URL
    $('link[rel="canonical"]').attr('href', articleUrl);
    
    // Update OpenGraph tags
    $('meta[property="og:title"]').attr('content', article.title);
    $('meta[property="og:description"]').attr('content', metaDescription);
    $('meta[property="og:url"]').attr('content', articleUrl);
    $('meta[property="og:type"]').attr('content', 'article');
    $('meta[property="og:image"]').attr('content', `${config.baseUrl}/${config.defaultImage}`);
    
    // Update Twitter card tags
    $('meta[name="twitter:title"]').attr('content', article.title);
    $('meta[name="twitter:description"]').attr('content', metaDescription);
    $('meta[name="twitter:image"]').attr('content', `${config.baseUrl}/${config.defaultImage}`);
    
    return $.html();
}

async function processArticles() {
    const articlesDir = path.join(__dirname, '..', 'Warroom Articles');
    const outputDir = path.join(__dirname, '..', 'public', 'warroom-articles');
    const articles = [];

    try {
        // Read the template file
        const template = await fs.readFile(path.join(__dirname, '..', 'warroom-article-template.txt'), 'utf8');
        
        // Ensure output directory exists
        await fs.mkdir(outputDir, { recursive: true });
        
        const files = await fs.readdir(articlesDir);
        
        for (const file of files) {
            if (!file.endsWith('.html')) continue;
            
            const filePath = path.join(articlesDir, file);
            const content = await fs.readFile(filePath, 'utf8');
            const $ = cheerio.load(content);
            
            // Get the article container
            const articleContainer = $('.article-container');
            
            const title = articleContainer.find('h1').first().text().trim();
            
            const article = {
                title: title,
                slug: generateSlug(title),
                publishedDate: articleContainer.find('p:contains("Published on:")').text()
                    .replace('Published on:', '')
                    .trim(),
                content: articleContainer.find('p').not(':contains("Published on:")')
                    .map((i, el) => $(el).text().trim())
                    .get()
                    .join('\n')
                    .trim(),
                sourceUrl: articleContainer.find('a').attr('href') || '',
                fileName: file
            };
            
            // Only process articles with valid titles
            if (article.title && !article.title.startsWith('Natalie G Winters')) {
                articles.push(article);
                
                // Generate HTML file for this article
                const htmlContent = await generateHtmlFile(article, template);
                await fs.writeFile(
                    path.join(outputDir, `${article.slug}.html`),
                    htmlContent
                );
            }
        }

        // Sort articles by date (newest first)
        articles.sort((a, b) => {
            const dateA = new Date(a.publishedDate);
            const dateB = new Date(b.publishedDate);
            return dateB - dateA;
        });

        // Write to JSON file
        await fs.writeFile(
            path.join(__dirname, '..', 'public', 'warroom-articles.json'),
            JSON.stringify(articles, null, 2)
        );

        console.log(`Processed ${articles.length} articles and generated HTML files`);

    } catch (error) {
        console.error('Error processing articles:', error);
    }
}

processArticles(); 