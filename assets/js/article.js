document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Get article ID from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const articleId = urlParams.get('id');
        
        if (!articleId) {
            throw new Error('Article ID not provided');
        }
        
        // Load articles data
        const response = await fetch('/warroom-articles.json');
        const articles = await response.json();
        
        // Find the specific article
        const article = articles.find(a => a.id === articleId);
        
        if (!article) {
            throw new Error('Article not found');
        }
        
        // Update page title and meta description
        document.title = `${article.title} - Natalie Winters`;
        document.getElementById('meta-description').content = article.excerpt || article.content.substring(0, 160);
        
        // Update article content
        document.getElementById('article-title').textContent = article.title;
        
        const date = new Date(article.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        document.getElementById('article-date').textContent = date;
        
        const contentSection = document.getElementById('article-content');
        contentSection.innerHTML = `
            <div class="article-content">
                ${article.content}
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