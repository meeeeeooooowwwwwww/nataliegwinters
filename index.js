addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
    const url = new URL(request.url);
    const path = url.pathname.slice(1); // Get the path excluding '/'
    console.log("Requested Path:", path); // Debug path

    // Check if this is a business listing
    if (path.startsWith("business/")) {
        const business = await BUSINESS_LISTINGS_KV.get(path);
        if (business) {
            return serveBusinessListing(business);
        } else {
            return new Response('Business listing not found', { status: 404 });
        }
    }

    // If not a business listing, handle static pages with cache optimization
    return serveStaticPageWithCache(path);
}

// Serve the business listing page
function serveBusinessListing(businessData) {
    const business = JSON.parse(businessData);
    const title = business.title || 'Untitled Business';
    const address = business.address || 'Address not available';
    const phone = business.phone || 'Phone not available';
    const website = business.website || 'Website not available';
    const email = business.email || 'Email not available';
    const description = business.description || 'No description available';

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
    return new Response(html, { headers: { 'Content-Type': 'text/html' } });
}

// Serve static pages with caching
async function serveStaticPageWithCache(path) {
    const staticUrl = `https://nataliegwinters.pages.dev/${path}`;
    
    // Check cache first for static pages
    const cache = caches.default;
    let response = await cache.match(request);
    
    if (!response) {
        // If not in cache, fetch from Cloudflare Pages
        response = await fetch(staticUrl);

        // Cache the response for future requests
        if (response.ok) {
            event.waitUntil(cache.put(request, response.clone()));
        }
    }
    
    return response || new Response('Page not found', { status: 404 });
}
