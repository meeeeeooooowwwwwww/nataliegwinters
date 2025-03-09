addEventListener('fetch', event => {
    event.respondWith(handleRequest(event));
});

async function handleRequest(event) {
    const request = event.request;
    const url = new URL(request.url);
    let path = url.pathname.slice(1); // Get the path excluding the leading '/'
    console.log("Requested Path:", path); // Debug path

    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': 'https://nataliegwinters.com',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            }
        });
    }

    // Normalize the path by removing any trailing slashes
    path = path.replace(/\/$/, '');

    // Handle API endpoint for listings
    if (path === 'api/listings') {
        return serveListings(request);
    }

    // Define the prefix for business listings
    const businessPrefix = 'business/'; // Changed from 'nataliegwinters/business/'

    // Check if this is a business listing under 'business/'
    if (path.startsWith(businessPrefix)) {
        const businessId = path.slice(businessPrefix.length);
        if (businessId) {
            const kvKey = businessId; // Use the businessId directly as the KV key
            console.log("Fetching KV Key:", kvKey);
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

    // If not a business listing or API endpoint, handle static pages
    return serveStaticPageWithCache(event, path);
}

// Serve all listings as JSON
async function serveListings(request) {
    try {
        const url = new URL(request.url);
        const cursor = url.searchParams.get('cursor');
        const limit = 10; // Fixed limit of 10 items per page

        console.log('Fetching listings with cursor:', cursor); // Add debug logging

        // Get listings with pagination
        const list = await BUSINESS_LISTINGS_KV.list({
            limit,
            cursor: cursor || undefined
        });

        console.log('Got KV list response:', list); // Add debug logging

        const listings = [];
        
        // Process this batch
        for (const key of list.keys) {
            try {
                const value = await BUSINESS_LISTINGS_KV.get(key.name);
                if (value) {
                    const business = JSON.parse(value);
                    listings.push({
                        id: key.name,
                        title: business.title || 'Untitled Business',
                        address: business.address || null,
                        phone: business.phone || null,
                        website: business.website || null,
                        email: business.email || null,
                        description: business.description || null
                    });
                }
            } catch (e) {
                console.error(`Error processing key ${key.name}:`, e);
                continue;
            }
        }

        console.log('Processed listings:', listings.length); // Add debug logging

        // Return response with listings and cursor for next page
        return new Response(JSON.stringify({
            listings,
            cursor: list.list_complete ? null : list.cursor
        }), {
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': 'https://nataliegwinters.com',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Cache-Control': 'public, max-age=300'
            }
        });
    } catch (error) {
        console.error('Worker error:', error);
        return new Response(JSON.stringify({ 
            error: 'Failed to fetch listings', 
            details: error.message 
        }), {
            status: 500,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': 'https://nataliegwinters.com',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        });
    }
}

// Serve the business listing page
function serveBusinessListing(businessData) {
    const business = JSON.parse(businessData);
    const sanitize = (str) => String(str).replace(/</g, '<').replace(/>/g, '>');
    
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

    const headers = { 
        'Content-Type': 'text/html',
        'Cache-Control': 'public, max-age=3600'
    };
    return new Response(html, { headers });
}

// Serve static pages with caching
async function serveStaticPageWithCache(event, path) {
    const staticUrl = `https://nataliegwinters.pages.dev/${path}`;
    const cacheKey = new Request(staticUrl);
    
    const cache = caches.default;
    let response = await cache.match(cacheKey);
    
    if (!response) {
        try {
            response = await fetch(staticUrl, { cf: { cacheTtl: 86400 } });
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