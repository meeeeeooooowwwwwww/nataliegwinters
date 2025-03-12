let allArticles = [];
let currentPage = 1;
const articlesPerPage = 20;

function renderArticles(articles, startIndex) {
    const articlesList = document.getElementById('articles-list');
    
    articles.slice(startIndex, startIndex + articlesPerPage).forEach(article => {
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

    // Show/hide load more button based on remaining articles
    const loadMoreButton = document.getElementById('load-more-button');
    if (startIndex + articlesPerPage >= articles.length) {
        loadMoreButton.style.display = 'none';
    } else {
        loadMoreButton.style.display = 'block';
    }
}

function loadMore() {
    currentPage++;
    renderArticles(allArticles, (currentPage - 1) * articlesPerPage);
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/warroom-articles.json');
        allArticles = await response.json();
        
        // Sort articles by date (newest first)
        allArticles.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        const articlesList = document.getElementById('articles-list');
        articlesList.innerHTML = ''; // Clear loading message
        
        // Add load more button
        articlesList.insertAdjacentHTML('afterend', `
            <div class="load-more-container">
                <button id="load-more-button" class="button" onclick="loadMore()">Load More Articles</button>
            </div>
        `);
        
        // Add styles for the load more button
        const style = document.createElement('style');
        style.textContent = `
            .load-more-container {
                text-align: center;
                margin: 2em 0;
            }
            #load-more-button {
                display: inline-block;
                padding: 1em 2em;
                background: #e44c65;
                color: #fff;
                text-decoration: none;
                border-radius: 4px;
                transition: background 0.3s ease;
                border: none;
                cursor: pointer;
                font-size: 1em;
            }
            #load-more-button:hover {
                background: #d83850;
            }
        `;
        document.head.appendChild(style);
        
        // Render first page
        renderArticles(allArticles, 0);
        
    } catch (error) {
        console.error('Error loading articles:', error);
        document.getElementById('articles-list').innerHTML = `
            <div class="error">
                Error loading articles. Please try again later.
            </div>
        `;
    }
}); 