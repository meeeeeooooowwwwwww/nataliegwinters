// Handle requests for news.nataliegwinters.com
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  const path = url.pathname
  
  // Handle region-specific articles
  const regionMatch = path.match(/^\/(us|nz)\/(.+)/)
  if (regionMatch) {
    const [, region, slug] = regionMatch
    return handleArticle(region, slug)
  }
  
  // Handle region listings
  if (path === '/us' || path === '/nz') {
    const region = path.substring(1)
    return handleRegionListing(region)
  }
  
  // Handle home page
  if (path === '/') {
    return handleHomePage()
  }
  
  // Handle static assets
  if (path.startsWith('/assets/')) {
    return handleAsset(path)
  }
  
  // Handle API requests
  if (path.startsWith('/api/')) {
    return handleApiRequest(path)
  }
  
  // Return 404 for unknown routes
  return new Response('Not Found', { status: 404 })
}

async function handleArticle(region, slug) {
  try {
    const articleData = await getArticleFromR2(region, slug)
    if (!articleData) {
      return new Response('Article not found', { status: 404 })
    }
    
    const template = await getTemplate('article')
    const html = renderArticle(template, articleData)
    
    return new Response(html, {
      headers: { 'Content-Type': 'text/html' }
    })
  } catch (error) {
    return new Response('Error loading article', { status: 500 })
  }
}

async function handleRegionListing(region) {
  try {
    const articles = await getArticlesFromR2(region)
    const template = await getTemplate('listing')
    const html = renderListing(template, articles, region)
    
    return new Response(html, {
      headers: { 'Content-Type': 'text/html' }
    })
  } catch (error) {
    return new Response('Error loading articles', { status: 500 })
  }
}

async function handleHomePage() {
  try {
    const [usArticles, nzArticles] = await Promise.all([
      getArticlesFromR2('us'),
      getArticlesFromR2('nz')
    ])
    
    const template = await getTemplate('home')
    const html = renderHome(template, { us: usArticles, nz: nzArticles })
    
    return new Response(html, {
      headers: { 'Content-Type': 'text/html' }
    })
  } catch (error) {
    return new Response('Error loading home page', { status: 500 })
  }
}

async function handleAsset(path) {
  try {
    const asset = await getAssetFromR2(path)
    if (!asset) {
      return new Response('Asset not found', { status: 404 })
    }
    
    return new Response(asset.body, {
      headers: { 'Content-Type': asset.contentType }
    })
  } catch (error) {
    return new Response('Error loading asset', { status: 500 })
  }
}

async function handleApiRequest(path) {
  const apiMatch = path.match(/^\/api\/(us|nz)\/articles\.json$/)
  if (!apiMatch) {
    return new Response('Invalid API endpoint', { status: 404 })
  }
  
  const region = apiMatch[1]
  try {
    const articles = await getArticlesFromR2(region)
    return new Response(JSON.stringify(articles), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  } catch (error) {
    return new Response('Error loading articles', { status: 500 })
  }
} 