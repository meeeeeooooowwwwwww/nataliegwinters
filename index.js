addEventListener('fetch', event => {
    event.respondWith(handleRequest(event));
});

async function handleRequest(event) {
    const request = event.request;
    const url = new URL(request.url);
    let path = url.pathname.slice(1); // Get the path excluding the leading '/'
    console.log("Requested Path:", path); // Debug path

    // Normalize the path by removing any trailing slashes
    path = path.replace(/\/$/, '');

    // Define the prefix for business listings
    const businessPrefix = 'nataliegwinters/business/';

    // Check if this is a business listing under 'nataliegwinters/business/'
    if (path.startsWith(businessPrefix)) {
        // Extract the business ID (everything after 'nataliegwinters/business/')
        const businessId = path.slice(businessPrefix.length);
        if (businessId) {
            // Map to the KV key (e.g., "business/my-business-example")
            const kvKey = `business/${businessId}`;
            console.log("Fetching KV Key:", kvKey); // Debug KV key
            const business = await BUSINESS_LISTINGS_KV.get(kvKey);
            if (business) {
                return serveBusinessListing(business);
            } else {
                return new Response('Business listing not found', { status: 404 });
            }
        } else {
            return new Response('Invalid business listing path', { status: 400 });
        }
    }

    // If not a business listing, handle static pages with cache optimization
    return serveStaticPageWithCache(event, path);
}

// Serve the business listing page
function serveBusinessListing(businessData) {
    const business = JSON.parse(businessData);
    // Basic sanitization (could be expanded with a proper library)
    const sanitize = (str) => String(str).replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    const title = sanitize(business.title || 'Untitled Business');
    const address = sanitize(business.address || 'Address not available');
    const phone = sanitize(business.phone || 'Phone not available');
    const website = sanitize(business.website || 'Website not available');
    const email = sanitize(business.email || 'Email not available');
    const description = sanitize(business.description || 'No description available');

    const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${title}</title>
        </head>
        <body>
            <h1>${title}</h1>
            <p><strong>Address:</strong> ${address}</p>
            <p><strong>Phone:</strong> <a href="tel:${phone}">${phone}</a></p>
            <p><strong>Website:</strong> <a href="${website}" target="_blank">${website}</a></p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Description:</strong> ${description}</p>
        </body>
        </html>
    `;

    // Add Cache-Control for business listings (e.g., cache for 1 hour)
    const headers = { 
        'Content-Type': 'text/html',
        'Cache-Control': 'public, max-age=3600'
    };
    return new Response(html, { headers });
}

// Serve static pages with caching
async function serveStaticPageWithCache(event, path) {
    const staticUrl = `https://nataliegwinters.pages.dev/${path}`;
    const cacheKey = new Request(staticUrl); // Use staticUrl as cache key
    
    // Check cache first for static pages
    const cache = caches.default;
    let response = await cache.match(cacheKey);
    
    if (!response) {
        try {
            // If not in cache, fetch from Cloudflare Pages
            response = await fetch(staticUrl, { cf: { cacheTtl: 86400 } }); // Cache for 1 day
            
            // Cache the response for future requests if successful
            if (response.ok) {
                event.waitUntil(cache.put(cacheKey, response.clone()));
            }
        } catch (e) {
            console.error("Failed to fetch static page:", e);
            return new Response('Service unavailable', { status: 503 });
        }
    }
    
    return response || new Response('Page not found', { status: 404 });
}