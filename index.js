addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
    try {
        // Extract the path from the request URL
        const url = new URL(request.url);
        const path = url.pathname.slice(1); // Remove leading "/" (e.g., "richardson-brick-blocklayers-utting")

        // Fetch the business listing from KV using the path as the key
        const business = await BUSINESS_LISTINGS_KV.get(path);
        if (!business) {
            return new Response('Business listing not found', {
                status: 404,
                headers: { 'Content-Type': 'text/plain' }
            });
        }

        // Parse the JSON data from KV
        const businessData = JSON.parse(business);

        // Define fallback values for missing fields
        const title = businessData.title || 'Untitled Business';
        const address = businessData.address || 'Address not available';
        const phone = businessData.phone || 'Phone not available';
        const website = businessData.website || 'Website not available';
        const email = businessData.email || 'Email not available';
        const description = businessData.description || 'No description available';

        // Generate HTML content
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

        return new Response(html, {
            headers: { 'Content-Type': 'text/html' },
        });
    } catch (error) {
        // Handle any errors (e.g., JSON parsing errors, KV access issues)
        return new Response(`Error: ${error.message}`, {
            status: 500,
            headers: { 'Content-Type': 'text/plain' }
        });
    }
}