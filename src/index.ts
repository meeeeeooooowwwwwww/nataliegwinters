addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
  })
  
  async function handleRequest(request: Request): Promise<Response> {
    const url = new URL(request.url)
  
    // Serve the business template page for a specific business ID
    if (url.pathname.startsWith('/business/')) {
      const businessId = url.pathname.split('/').pop()
      if (businessId) {
        const businessData = await BUSINESS_LISTINGS.get(businessId)
  
        if (businessData) {
          // Parse the stored business data
          const business = JSON.parse(businessData)
  
          // You would replace the placeholders in your template with the actual data
          let template = await TEMPLATE_BUCKET.get('business-template.html')
          template = template.replace("{{business_name}}", business.title || 'Currently Unavailable')
          template = template.replace("{{business_address}}", business.address || 'Currently Unavailable')
          template = template.replace("{{business_phone}}", business.phone || 'Currently Unavailable')
          template = template.replace("{{business_email}}", business.email || 'Currently Unavailable')
          template = template.replace("{{business_description}}", business.description || 'Currently Unavailable')
  
          return new Response(template, {
            headers: { 'Content-Type': 'text/html' }
          })
        } else {
          return new Response('Business not found', { status: 404 })
        }
      }
    }
  
    return new Response('Not Found', { status: 404 })
  }  