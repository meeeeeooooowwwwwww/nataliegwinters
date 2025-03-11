// Business listings function
export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const path = url.pathname;

    // Extract business ID and optional category
    const segments = path.split('/').filter(Boolean);

    // Helper function to get listings from R2
    async function getListings() {
        try {
            const listingsObj = await env.LISTINGS_BUCKET.get('listings.json');
            if (!listingsObj) {
                throw new Error('Listings not found in R2');
            }
            const listingsText = await listingsObj.text();
            return JSON.parse(listingsText);
        } catch (error) {
            console.error('Error fetching from R2:', error);
            throw error;
        }
    }

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

            const listings = await getListings();
            
            // Search through listings
            const results = listings.filter(business => 
                business.title.toLowerCase().includes(query) ||
                business.categories?.some(cat => cat.toLowerCase().includes(query)) ||
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
            const listings = await getListings();
            
            // Get pagination parameters
            const page = parseInt(new URL(request.url).searchParams.get('page')) || 1;
            const limit = parseInt(new URL(request.url).searchParams.get('limit')) || 10;
            const start = (page - 1) * limit;
            const end = start + limit;
            
            const results = listings.slice(start, end).map(business => ({
                id: business.id,
                title: business.title,
                address: business.address,
                phone: business.phone,
                categories: business.categories,
                description: business.description
            }));

            return new Response(JSON.stringify({
                page,
                limit,
                total: listings.length,
                results
            }, null, 2), {
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
        return new Response(JSON.stringify({ error: 'Invalid URL' }), { 
            status: 404,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const listings = await getListings();
        const business = listings.find(item => 
            item.id === businessId && 
            (!category || item.categories?.includes(category))
        );

        if (!business) {
            return new Response(JSON.stringify({ error: 'Business not found' }), { 
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify(business, null, 2), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
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