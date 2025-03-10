export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const path = url.pathname;

    // Extract business ID and optional category
    const segments = path.split('/').filter(Boolean);
    let businessId, category;
    if (segments.length === 3) { // /biz/category/business-id
        category = segments[1];
        businessId = segments[2];
    } else if (segments.length === 2) { // /biz/business-id
        businessId = segments[1];
    } else {
        return new Response('Invalid URL', { status: 404 });
    }

    // Fetch from R2 (using binding or URL)
    const r2Response = await env.LISTINGS_BUCKET.get('all-listings.json');
    if (!r2Response) {
        return new Response('Failed to fetch listings', { status: 500 });
    }
    const listings = JSON.parse(await r2Response.text());
    const business = listings.find(item => item.id === businessId && (!category || item.category === category));

    if (!business) {
        return new Response('Business not found', { status: 404 });
    }

    // Generate HTML
    const html = `
        <!DOCTYPE html>
        <html>
        <head><title>${business.title}</title><meta charset="UTF-8"></head>
        <body>
            <h1>${business.title}</h1>
            ${category ? `<p>Category: ${business.category}</p>` : ''}
            <p>Address: ${business.address}</p>
        </body>
        </html>
    `;
    return new Response(html, { headers: { 'Content-Type': 'text/html' } });
}