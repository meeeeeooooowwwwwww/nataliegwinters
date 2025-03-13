const fs = require('fs').promises;
const path = require('path');

async function uploadArticles() {
    try {
        // Read the JSON file
        const articlesJson = await fs.readFile(
            path.join(__dirname, '..', 'public', 'warroom-articles.json'),
            'utf8'
        );
        const articles = JSON.parse(articlesJson);

        // Upload to Cloudflare
        const response = await fetch('http://localhost:8788/api/upload-articles', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(articles)
        });

        const result = await response.json();
        
        if (result.success) {
            console.log('Successfully uploaded articles to Cloudflare R2');
        } else {
            console.error('Failed to upload articles:', result.error);
        }
    } catch (error) {
        console.error('Error uploading articles:', error);
    }
}

uploadArticles(); 