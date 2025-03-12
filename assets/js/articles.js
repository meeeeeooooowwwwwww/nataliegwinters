let allArticles = [];
let currentPage = 1;
const articlesPerPage = 10;

function generateSlug(title) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

function getArticleUrl(slug) {
    // Use clean URLs in production, query parameters in development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return `/article.html?id=${encodeURIComponent(slug)}`;
    } else {
        return `/warroom-articles/${encodeURIComponent(slug)}`;
    }
}

function renderArticles(articles) {
    const articlesList = document.getElementById('articles-list');
    if (!articlesList) return;
    
    // Remove loading message if it exists
    const loadingDiv = articlesList.querySelector('.loading');
    if (loadingDiv) {
        loadingDiv.remove();
    }
    
    // Calculate start and end indices for current page
    const startIndex = 0;
    const endIndex = currentPage * articlesPerPage;
    const articlesToShow = articles.slice(startIndex, endIndex);
    
    // Clear the list if it's the first page
    if (currentPage === 1) {
        articlesList.innerHTML = '';
    }
    
    articlesToShow.forEach(article => {
        const articleElement = document.createElement('div');
        articleElement.className = 'article-item';
        
        const date = new Date(article.publishedDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        const slug = generateSlug(article.title);
        const excerpt = article.excerpt || article.content?.substring(0, 150) || '';
        
        articleElement.innerHTML = `
            <h3>${article.title}</h3>
            <div class="date">${date}</div>
            <p>${excerpt}...</p>
            <a href="${getArticleUrl(slug)}" class="read-more">read more <em>→</em></a>
        `;
        
        articlesList.appendChild(articleElement);
    });

    // Add or update Load More button
    let loadMoreContainer = document.querySelector('.load-more-container');
    if (!loadMoreContainer) {
        loadMoreContainer = document.createElement('div');
        loadMoreContainer.className = 'load-more-container';
        articlesList.after(loadMoreContainer);
    }

    // Show or hide Load More button based on whether there are more articles
    if (endIndex < articles.length) {
        loadMoreContainer.innerHTML = `
            <button id="load-more-button">Load More Articles</button>
        `;
        const loadMoreButton = document.getElementById('load-more-button');
        loadMoreButton.addEventListener('click', () => {
            currentPage++;
            renderArticles(articles);
        });
    } else {
        loadMoreContainer.innerHTML = '';
    }

    // Add styles for responsive design and read more link
    const style = document.createElement('style');
    style.textContent = `
        .article-item {
            opacity: 0;
            animation: fadeIn 0.5s ease forwards;
            margin-bottom: 2em;
            padding: 1.5em;
            background: #fff;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .article-item h3 {
            font-size: clamp(1.2rem, 2.5vw, 1.5rem);
            margin-bottom: 0.5em;
            color: #e44c65;
        }
        
        .article-item .date {
            font-size: clamp(0.8rem, 1.5vw, 0.9rem);
            color: #666;
            margin-bottom: 1em;
        }
        
        .article-item p {
            font-size: clamp(0.9rem, 2vw, 1rem);
            line-height: 1.6;
            margin-bottom: 1em;
        }
        
        .read-more {
            display: inline-block;
            color: #e44c65;
            font-size: clamp(0.9rem, 1.8vw, 1rem);
            text-decoration: none;
            transition: color 0.3s ease;
        }
        
        .read-more:hover {
            color: #d83850;
        }
        
        .read-more em {
            font-style: normal;
            margin-left: 0.3em;
            transition: transform 0.3s ease;
            display: inline-block;
        }
        
        .read-more:hover em {
            transform: translateX(5px);
        }

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
        
        @media screen and (max-width: 768px) {
            .article-item {
                padding: 1em;
            }
            
            .articles-section {
                padding: 1em;
            }
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;
    
    if (!document.querySelector('style[data-articles-styles]')) {
        style.setAttribute('data-articles-styles', '');
        document.head.appendChild(style);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/warroom-articles.json');
        allArticles = await response.json();
        
        // Sort articles by date (newest first)
        allArticles.sort((a, b) => new Date(b.publishedDate) - new Date(a.publishedDate));
        
        // Render articles
        renderArticles(allArticles);
        
    } catch (error) {
        console.error('Error loading articles:', error);
        const articlesList = document.getElementById('articles-list');
        if (articlesList) {
            articlesList.innerHTML = `
                <div class="error">
                    Error loading articles. Please try again later.
                </div>
            `;
        }
    }
}); 