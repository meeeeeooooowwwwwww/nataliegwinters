function generateSlug(title) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

function getArticleId() {
    // Check for query parameter first (development)
    const urlParams = new URLSearchParams(window.location.search);
    const queryId = urlParams.get('id');
    if (queryId) return queryId;

    // Check for clean URL format (production)
    const match = window.location.pathname.match(/\/warroom-articles\/(.+)/);
    return match ? match[1] : null;
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const articleId = getArticleId();
        
        if (!articleId) {
            throw new Error('Article not found');
        }

        // Load the articles JSON
        const response = await fetch('/warroom-articles.json');
        const articles = await response.json();
        
        // Find the article by matching its slug
        const article = articles.find(a => generateSlug(a.title) === articleId);
        
        if (!article) {
            throw new Error('Article not found');
        }

        // Format the date
        const date = new Date(article.publishedDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Update the page title
        document.title = `${article.title} - Natalie Winters`;
        
        // Update the meta description
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.content = article.excerpt || article.content.substring(0, 150);
        }

        // Render the article
        const articleContent = document.getElementById('article-content');
        articleContent.innerHTML = `
            <div class="article-header">
                <h2>${article.title}</h2>
                <div class="article-date">${date}</div>
            </div>
            <div class="article-body">
                ${article.content}
            </div>
            <a href="/warroom-articles" class="back-to-articles"><em>→</em> Back to Articles</a>
        `;

    } catch (error) {
        console.error('Error loading article:', error);
        const articleContent = document.getElementById('article-content');
        articleContent.innerHTML = `
            <div class="error">
                <h2>Article Not Found</h2>
                <p>Sorry, we couldn't find the article you're looking for.</p>
                <a href="/warroom-articles" class="back-to-articles"><em>→</em> Back to Articles</a>
            </div>
        `;
    }
}); 