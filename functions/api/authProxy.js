// functions/api/authProxy.js

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // Handle preflight CORS requests, which are sent by browsers to check
  // if a cross-origin request is safe.
  if (request.method === 'OPTIONS') {
    return handleOptions(request);
  }

  try {
    // Extract the path from the original URL.
    const apiPath = url.pathname.replace(/^\/api\/authProxy/, ''); // Removes the proxy's base path

    // Build the final URL for the target API.
    const targetUrl = `https://api.samuellopes.com.br${apiPath}${url.search}`;

    // Prepare headers for the external API, copying from the original request
    // and adding the authorization token.
    const apiHeaders = new Headers(request.headers);
    apiHeaders.set('Authorization', `Bearer ${env.TOKEN}`);
    // The 'host' must be the target API's host, not the worker's.
    apiHeaders.set('Host', 'api.samuellopes.com.br');

    // Create a new request to forward. This is a more robust way to handle
    // the request body, which can only be read once.
    const apiRequest = new Request(targetUrl, {
      method: request.method,
      headers: apiHeaders,
      // Only include a body for methods that support it (e.g., POST, PUT).
      body: (request.method !== 'GET' && request.method !== 'HEAD') ? request.body : null,
      redirect: 'follow' // Follow redirects from the API.
    });

    const apiResponse = await fetch(apiRequest);

    // Create a new, mutable response from the API's response so we can add headers.
    const response = new Response(apiResponse.body, apiResponse);

    // Set CORS headers to allow requests from any origin. This is crucial for
    // cross-domain requests from a browser.
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Add a debug header to confirm that the proxy function was executed.
    // Check for this header in your browser's developer tools.
    response.headers.set('X-Proxy-Hit', '1');

    return response;

  } catch (error) {
    // If our function has an error, return a 500 status.
    console.error("Proxy Error:", error);
    const errorResponse = new Response(JSON.stringify({ message: 'Erro interno no proxy da função.', error: error.message }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' 
      }
    });
    return errorResponse;
  }
}

/**
 * Handles CORS preflight requests.
 * @param {Request} request
 * @returns {Response}
 */
function handleOptions(request) {
  // Standard response for CORS preflight (OPTIONS) requests.
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  return new Response(null, { headers });
}

