// Business listings function
export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const path = url.pathname;

    // Extract business ID and optional category
    const segments = path.split('/').filter(Boolean);
    
    // Search endpoint
    if (segments.length === 2 && segments[1] === 'search') {
        try {
            const searchParams = new URL(request.url).searchParams;
            const query = searchParams.get('q')?.toLowerCase() || '';
            
            if (!query) {
                return new Response(JSON.stringify({ error: 'Search query required' }), {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                });
            }

            // Fetch listings from R2
            const listingsResponse = await fetch('https://data.nataliegwinters.com/listings.json');
            if (!listingsResponse.ok) {
                throw new Error('Failed to fetch listings');
            }

            const listings = await listingsResponse.json();
            
            // Search through listings
            const results = listings.filter(business => 
                business.title.toLowerCase().includes(query) ||
                business.category?.toLowerCase().includes(query) ||
                business.address?.toLowerCase().includes(query)
            );

            return new Response(JSON.stringify(results, null, 2), {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Cache-Control': 'public, max-age=60'
                }
            });
        } catch (error) {
            console.error('Error in search:', error.message);
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }

    // List all businesses
    if (segments.length === 2 && segments[1] === 'list') {
        try {
            // Fetch listings from R2
            const listingsResponse = await fetch('https://data.nataliegwinters.com/listings.json');
            if (!listingsResponse.ok) {
                throw new Error('Failed to fetch listings');
            }

            const listings = await listingsResponse.json();
            
            // Return first 10 listings by default
            const limit = parseInt(new URL(request.url).searchParams.get('limit')) || 10;
            const results = listings.slice(0, limit);

            return new Response(JSON.stringify(results, null, 2), {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Cache-Control': 'public, max-age=60'
                }
            });
        } catch (error) {
            console.error('Error in /biz/list:', error.message);
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }

    // Individual business view
    let businessId, category;
    if (segments.length === 3) { // /biz/category/business-id
        category = segments[1];
        businessId = segments[2];
    } else if (segments.length === 2) { // /biz/business-id
        businessId = segments[1];
    } else {
        return new Response('Invalid URL', { status: 404 });
    }

    try {
        // Fetch from R2
        const listingsResponse = await fetch('https://data.nataliegwinters.com/listings.json');
        if (!listingsResponse.ok) {
            throw new Error('Failed to fetch listings');
        }
        
        const listings = await listingsResponse.json();
        const business = listings.find(item => item.id === businessId && (!category || item.category === category));

        if (!business) {
            return new Response('Business not found', { status: 404 });
        }

        // Generate single business view HTML
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${business.title} - Business Directory</title>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <link rel="stylesheet" href="assets/css/main.css">
                <style>
                    .business-detail {
                        max-width: 800px;
                        margin: 40px auto;
                        padding: 20px;
                        background: #fff;
                        border-radius: 8px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    }
                    .business-title {
                        color: #333;
                        font-size: 32px;
                        margin-bottom: 20px;
                    }
                    .business-category {
                        color: #666;
                        font-size: 18px;
                        margin-bottom: 15px;
                    }
                    .business-address {
                        color: #888;
                        font-size: 16px;
                    }
                </style>
            </head>
            <body>
                <div class="business-detail">
                    <h1 class="business-title">${business.title}</h1>
                    <div class="business-category">Category: ${business.category}</div>
                    <div class="business-address">${business.address}</div>
                    <p><a href="/biz/list">← Back to Directory</a></p>
                </div>
            </body>
            </html>
        `;

        return new Response(html, {
            headers: {
                'Content-Type': 'text/html',
                'Cache-Control': 'public, max-age=60'
            }
        });
    } catch (error) {
        console.error('Error fetching business:', error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
} 