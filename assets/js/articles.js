let allArticles = [];
let currentPage = 1;
const articlesPerPage = 20;

function generateSlug(title) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

function renderArticles(articles, startIndex, append = false) {
    const articlesList = document.getElementById('articles-list');
    
    // Only clear the list if we're not appending
    if (!append) {
        articlesList.innerHTML = '';
    }
    
    articles.slice(startIndex, startIndex + articlesPerPage).forEach(article => {
        const articleElement = document.createElement('div');
        articleElement.className = 'article-item';
        
        const date = new Date(article.publishedDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        const slug = generateSlug(article.title);
        
        articleElement.innerHTML = `
            <a href="/article?id=${encodeURIComponent(slug)}">
                <h3>${article.title}</h3>
                <div class="date">${date}</div>
                <p>${article.excerpt || article.content?.substring(0, 200) || ''}...</p>
            </a>
        `;
        
        articlesList.appendChild(articleElement);
    });

    // Show/hide load more button based on remaining articles
    const loadMoreContainer = document.querySelector('.load-more-container');
    if (!loadMoreContainer) {
        // Create load more button if it doesn't exist
        const container = document.createElement('div');
        container.className = 'load-more-container';
        container.innerHTML = `
            <button id="load-more-button" class="button" onclick="loadMore()">Load More Articles</button>
        `;
        articlesList.parentNode.insertBefore(container, articlesList.nextSibling);
    }

    const loadMoreButton = document.getElementById('load-more-button');
    if (startIndex + articlesPerPage >= articles.length) {
        loadMoreButton.style.display = 'none';
    } else {
        loadMoreButton.style.display = 'block';
    }
}

function loadMore() {
    currentPage++;
    renderArticles(allArticles, (currentPage - 1) * articlesPerPage, true);
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
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

        const response = await fetch('/warroom-articles.json');
        allArticles = await response.json();
        
        // Sort articles by date (newest first)
        allArticles.sort((a, b) => new Date(b.publishedDate) - new Date(a.publishedDate));
        
        // Render first page
        renderArticles(allArticles, 0, false);
        
    } catch (error) {
        console.error('Error loading articles:', error);
        document.getElementById('articles-list').innerHTML = `
            <div class="error">
                Error loading articles. Please try again later.
            </div>
        `;
    }
}); 