export async function onRequest(context) {
    try {
        // List objects in the R2 bucket
        const objects = await context.env.ARTICLES_BUCKET.list();
        
        // Transform the objects into article data
        const articles = objects.objects.map(obj => ({
            title: decodeURIComponent(obj.key.replace(/\.html$/, '')).replace(/-/g, ' '),
            url: `/articles/${obj.key}`,
            uploadedAt: obj.uploaded
        }));

        // Return the articles as JSON
        return new Response(JSON.stringify(articles), {
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=3600'
            }
        });
    } catch (error) {
        console.error('Error listing articles:', error);
        return new Response(JSON.stringify({ error: 'Failed to list articles' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
} 