function generateSlug(title) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Get article ID from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const articleId = urlParams.get('id');
        
        console.log('Article ID from URL:', articleId);
        
        if (!articleId) {
            throw new Error('Article ID not provided');
        }
        
        // Load articles data
        const response = await fetch('/warroom-articles.json');
        const articles = await response.json();
        
        console.log('Number of articles loaded:', articles.length);
        
        // Find the specific article by matching the slug
        const article = articles.find(a => {
            const slug = generateSlug(a.title);
            console.log('Comparing:', { slug, articleId, title: a.title });
            return slug === articleId;
        });
        
        if (!article) {
            throw new Error('Article not found');
        }
        
        console.log('Found article:', article);
        
        // Update page title and meta description
        document.title = `${article.title} - Natalie Winters`;
        document.getElementById('meta-description').content = article.excerpt || article.content?.substring(0, 160) || '';
        
        // Update article content
        document.getElementById('article-title').textContent = article.title;
        
        const date = new Date(article.publishedDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        document.getElementById('article-date').textContent = date;
        
        const contentSection = document.getElementById('article-content');
        contentSection.innerHTML = `
            <div class="article-content">
                ${article.content || ''}
                ${article.author ? `<p class="article-author">By ${article.author}</p>` : ''}
            </div>
            <a href="/warroom-articles.html" class="back-to-articles">← Back to Articles</a>
        `;
        
    } catch (error) {
        console.error('Error loading article:', error);
        document.getElementById('article-content').innerHTML = `
            <div class="error">
                <p>Error loading article. ${error.message}</p>
                <a href="/warroom-articles.html" class="back-to-articles">← Back to Articles</a>
            </div>
        `;
    }
}); 