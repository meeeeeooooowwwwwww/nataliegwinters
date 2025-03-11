const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// Function to recursively get all HTML files in a directory
function getHtmlFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...getHtmlFiles(fullPath));
    } else if (path.extname(fullPath) === '.html') {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Function to extract metadata from HTML file
function extractMetadata(html) {
  const $ = cheerio.load(html);
  
  return {
    title: $('title').text() || $('h1').first().text() || 'Untitled',
    description: $('meta[name="description"]').attr('content') || '',
    publishDate: $('meta[name="publish_date"]').attr('content') || new Date().toISOString(),
    category: $('meta[name="category"]').attr('content') || 'uncategorized',
    author: $('meta[name="author"]').attr('content') || 'Unknown'
  };
}

// Main migration function
async function migrateArticles() {
  const articlesDir = path.join(process.cwd(), 'public', 'articles');
  const r2Dir = path.join(process.cwd(), '.wrangler', 'state', 'r2', 'articles-bucket');
  
  // Create R2 directory if it doesn't exist
  if (!fs.existsSync(r2Dir)) {
    fs.mkdirSync(r2Dir, { recursive: true });
  }
  
  // Get all HTML files
  const htmlFiles = getHtmlFiles(articlesDir);
  const articles = [];
  
  // Process each file
  for (const file of htmlFiles) {
    const html = fs.readFileSync(file, 'utf-8');
    const metadata = extractMetadata(html);
    
    // Get relative path from articles directory
    const relativePath = path.relative(articlesDir, file);
    
    // Copy file to R2 directory
    const r2Path = path.join(r2Dir, relativePath);
    fs.mkdirSync(path.dirname(r2Path), { recursive: true });
    fs.copyFileSync(file, r2Path);
    
    // Add to articles list
    articles.push({
      path: relativePath.replace(/\\/g, '/'),
      ...metadata
    });
  }
  
  // Sort articles by publish date
  articles.sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));
  
  // Write index.json
  fs.writeFileSync(
    path.join(r2Dir, 'index.json'),
    JSON.stringify({ articles }, null, 2)
  );
  
  console.log(`Processed ${articles.length} articles`);
}

migrateArticles().catch(console.error); 