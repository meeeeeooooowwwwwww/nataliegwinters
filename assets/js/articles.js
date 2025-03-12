document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/warroom-articles.json');
        const articles = await response.json();
        
        const articlesList = document.getElementById('articles-list');
        articlesList.innerHTML = ''; // Clear loading message
        
        // Sort articles by date (newest first)
        articles.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        articles.forEach(article => {
            const articleElement = document.createElement('div');
            articleElement.className = 'article-item';
            
            const date = new Date(article.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            articleElement.innerHTML = `
                <a href="/article.html?id=${encodeURIComponent(article.id)}">
                    <h3>${article.title}</h3>
                    <div class="date">${date}</div>
                    <p>${article.excerpt || article.content.substring(0, 200)}...</p>
                </a>
            `;
            
            articlesList.appendChild(articleElement);
        });
    } catch (error) {
        console.error('Error loading articles:', error);
        document.getElementById('articles-list').innerHTML = `
            <div class="error">
                Error loading articles. Please try again later.
            </div>
        `;
    }
}); 