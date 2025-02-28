async function handleRequest(request) {
    // Extract the path from the request URL
    const url = new URL(request.url);
    const path = url.pathname.substring(1); // Strip the leading "/"

    // Try to get the business listing from KV by key (path)
    const business = await BUSINESS_LISTINGS_KV.get(path);

    if (business) {
        // If the business listing is found, return the HTML page
        const businessData = JSON.parse(business);

        // Generate HTML content for the business listing
        const html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${businessData.title}</title>
            </head>
            <body>
                <h1>${businessData.title}</h1>
                <p><strong>Address:</strong> ${businessData.address}</p>
                <p><strong>Phone:</strong> <a href="tel:${businessData.phone}">${businessData.phone}</a></p>
                <p><strong>Website:</strong> <a href="${businessData.website}" target="_blank">${businessData.website}</a></p>
                <p><strong>Email:</strong> ${businessData.email}</p>
                <p><strong>Description:</strong> ${businessData.description}</p>
            </body>
            </html>
        `;

        return new Response(html, {
            headers: { 'Content-Type': 'text/html' },
        });
    } else {
        // If no business listing is found, return a 404 page
        return new Response('Business listing not found', { status: 404 });
    }
}

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});
