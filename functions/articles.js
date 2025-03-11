export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // Handle API routes
      if (path.startsWith('/api/articles')) {
        return handleArticleRequest(request, env);
      }

      // Handle warroom.html specifically
      if (path === '/articles/warroom.html') {
        const response = await env.ASSETS.fetch(request);
        if (!response.ok) {
          throw new Error(`Failed to fetch warroom.html: ${response.status}`);
        }
        return response;
      }

      // Handle other static assets
      return env.ASSETS.fetch(request);
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(`Server error: ${error.message}`, { 
        status: 500,
        headers: {
          'Content-Type': 'text/plain',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }
};

async function handleArticleRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;

  try {
    // Handle index request
    if (path === '/api/articles') {
      const index = await env.ARTICLES_BUCKET.get('index.json');
      if (!index) {
        return new Response('Article index not found', { status: 404 });
      }
      return new Response(await index.text(), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Handle article requests
    if (path.startsWith('/api/articles/')) {
      const articlePath = path.replace('/api/articles/', '');
      const article = await env.ARTICLES_BUCKET.get(articlePath);
      
      if (!article) {
        return new Response('Article not found', { status: 404 });
      }

      return new Response(await article.text(), {
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'public, max-age=3600',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    return new Response('Not found', { status: 404 });
  } catch (error) {
    console.error('Article request error:', error);
    return new Response(`Error handling article request: ${error.message}`, { 
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
} 