addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
    try {
        const url = new URL(request.url);
        const path = url.pathname.slice(1);
        console.log("Requested Path:", path); // Debug path

        const business = await BUSINESS_LISTINGS_KV.get(path);
        console.log("KV Response:", business); // Debug KV output
        if (!business) {
            return new Response('Business listing not found', {
                status: 404,
                headers: { 'Content-Type': 'text/plain' }
            });
        }

        const businessData = JSON.parse(business);
        const title = businessData.title || 'Untitled Business';
        const address = businessData.address || 'Address not available';
        const phone = businessData.phone || 'Phone not available';
        const website = businessData.website || 'Website not available';
        const email = businessData.email || 'Email not available';
        const description = businessData.description || 'No description available';

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
        return new Response(`Error: ${error.message}`, {
            status: 500,
            headers: { 'Content-Type': 'text/plain' }
        });
    }
}