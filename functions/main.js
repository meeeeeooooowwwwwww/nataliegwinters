export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // Handle business listings (URLs starting with /biz/)
      if (path.startsWith('/biz/')) {
        return handleListingRequest(request, env);
      }

      // Handle news articles (URLs starting with /api/articles/)
      if (path.startsWith('/api/articles/')) {
        return handleArticleRequest(request, env);
      }

      // Handle static assets from public folder (default)
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

async function handleListingRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const listingPath = path.replace('/biz/', '');

  try {
    // Handle index request for listings
    if (listingPath === '' || listingPath === 'index.json') {
      const index = await env.LISTINGS_BUCKET.get('index.json');
      if (!index) {
        return new Response('Listings index not found', { status: 404 });
      }
      return new Response(await index.text(), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Handle individual listing request
    const listing = await env.LISTINGS_BUCKET.get(listingPath);
    if (!listing) {
      return new Response('Listing not found', { status: 404 });
    }

    return new Response(await listing.text(), {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('Listing request error:', error);
    return new Response(`Error handling listing request: ${error.message}`, { 
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

async function handleArticleRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const articlePath = path.replace('/api/articles/', '');

  try {
    // Handle index request for articles
    if (articlePath === '' || articlePath === 'index.json') {
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

    // Handle individual article request
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