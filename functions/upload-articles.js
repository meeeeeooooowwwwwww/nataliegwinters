export async function onRequestPost(context) {
    try {
        const articlesJson = await context.env.ARTICLES_BUCKET.get('warroom-articles.json');
        
        if (articlesJson) {
            // Delete existing file if it exists
            await context.env.ARTICLES_BUCKET.delete('warroom-articles.json');
        }

        // Read the articles from the request body
        const articles = await context.request.json();

        // Upload to R2
        await context.env.ARTICLES_BUCKET.put('warroom-articles.json', JSON.stringify(articles), {
            httpMetadata: {
                contentType: 'application/json',
                cacheControl: 'max-age=3600'
            }
        });

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error uploading articles:', error);
        return new Response(
            JSON.stringify({ error: 'Failed to upload articles' }), 
            { 
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
} 