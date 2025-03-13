// Main JavaScript file for US News site

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize mobile navigation
    initMobileNav();
    
    // Initialize smooth scrolling
    initSmoothScroll();
    
    // Initialize lazy loading for images
    initLazyLoading();
});

// Mobile navigation functionality
function initMobileNav() {
    const nav = document.getElementById('nav');
    const menuButton = document.createElement('button');
    menuButton.className = 'mobile-menu-button';
    menuButton.innerHTML = '<span></span><span></span><span></span>';
    menuButton.setAttribute('aria-label', 'Toggle navigation menu');
    
    nav.insertBefore(menuButton, nav.firstChild);
    
    menuButton.addEventListener('click', function() {
        nav.classList.toggle('nav-open');
        menuButton.classList.toggle('active');
    });
}

// Smooth scrolling functionality
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Lazy loading for images
function initLazyLoading() {
    if ('loading' in HTMLImageElement.prototype) {
        const images = document.querySelectorAll('img[loading="lazy"]');
        images.forEach(img => {
            img.src = img.dataset.src;
        });
    } else {
        // Fallback for browsers that don't support lazy loading
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lazysizes/5.3.2/lazysizes.min.js';
        document.body.appendChild(script);
    }
}

// Format date strings
function formatDate(dateString) {
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Share article functionality
function shareArticle(title, url) {
    if (navigator.share) {
        navigator.share({
            title: title,
            url: url
        }).catch(console.error);
    } else {
        // Fallback for browsers that don't support Web Share API
        const dummy = document.createElement('input');
        document.body.appendChild(dummy);
        dummy.value = window.location.href;
        dummy.select();
        document.execCommand('copy');
        document.body.removeChild(dummy);
        alert('URL copied to clipboard!');
    }
}

// Add scroll-to-top button functionality
window.addEventListener('scroll', function() {
    const scrollButton = document.querySelector('.scroll-to-top');
    if (window.pageYOffset > 300) {
        scrollButton?.classList.add('visible');
    } else {
        scrollButton?.classList.remove('visible');
    }
});

// Handle article search
function handleSearch(event) {
    event.preventDefault();
    const searchInput = document.querySelector('.search-input');
    const searchTerm = searchInput.value.toLowerCase();
    
    const articles = document.querySelectorAll('.article-card');
    articles.forEach(article => {
        const title = article.querySelector('h3').textContent.toLowerCase();
        const excerpt = article.querySelector('.article-excerpt').textContent.toLowerCase();
        const tags = Array.from(article.querySelectorAll('.tag')).map(tag => tag.textContent.toLowerCase());
        
        const matches = title.includes(searchTerm) || 
                       excerpt.includes(searchTerm) || 
                       tags.some(tag => tag.includes(searchTerm));
        
        article.style.display = matches ? 'block' : 'none';
    });
}

// Handle category filtering
function filterByCategory(category) {
    const articles = document.querySelectorAll('.article-card');
    articles.forEach(article => {
        const articleCategory = article.dataset.category.toLowerCase();
        article.style.display = category === 'all' || articleCategory === category.toLowerCase() ? 'block' : 'none';
    });
    
    // Update active category button
    document.querySelectorAll('.category-filter').forEach(button => {
        button.classList.toggle('active', button.dataset.category === category);
    });
}

// Handle infinite scroll for articles
let isLoading = false;
let page = 1;

window.addEventListener('scroll', function() {
    if (isLoading) return;
    
    const scrollPosition = window.innerHeight + window.pageYOffset;
    const documentHeight = document.documentElement.offsetHeight;
    
    if (scrollPosition >= documentHeight - 1000) {
        loadMoreArticles();
    }
});

async function loadMoreArticles() {
    isLoading = true;
    
    try {
        const response = await fetch(`/api/articles?page=${page}`);
        const data = await response.json();
        
        if (data.articles.length === 0) {
            // No more articles to load
            return;
        }
        
        const articleGrid = document.querySelector('.article-grid');
        data.articles.forEach(article => {
            const articleElement = createArticleElement(article);
            articleGrid.appendChild(articleElement);
        });
        
        page++;
    } catch (error) {
        console.error('Error loading more articles:', error);
    } finally {
        isLoading = false;
    }
}

function createArticleElement(article) {
    const template = document.createElement('template');
    template.innerHTML = `
        <div class="article-card" data-category="${article.category}">
            <img src="${article.image}" alt="${article.title}" loading="lazy">
            <div class="article-content">
                <h3>${article.title}</h3>
                <div class="article-meta">
                    ${formatDate(article.publishedDate)}
                    · ${article.category}
                </div>
                <div class="article-excerpt">
                    ${article.excerpt}
                </div>
                <div class="article-tags">
                    ${article.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
                <a href="articles/${article.slug}.html" class="button">Read More</a>
            </div>
        </div>
    `.trim();
    
    return template.content.firstChild;
} 